const path = require('path');
const core = require('@actions/core');
const {
    context,
    getOctokit,
} = require('@actions/github');

const utils = require('./utils');
const {ReviewStates} = require('./enums');

const PATH_PREFIX = process.env.GITHUB_WORKSPACE;

(async () => {
    const token = core.getInput('token', {required: true});
    const ownersFilename = core.getInput('source', {required: true});
    const ignoreFiles = core.getMultilineInput('ignore', {required: true});
    const labelsMap = core.getInput('labels', {required: false});

    const octokit = getOctokit(token);

    const {repo} = context;
    const {pull_request} = context.payload;
    const pull_number = pull_request.number;

    /**
     * @returns {string[]}
     */
    const getChangedFiles = async () => {
        const listFiles = await octokit.paginate(octokit.rest.pulls.listFiles.endpoint.merge({
            ...context.repo,
            pull_number,
        }));

        return listFiles.map((file) => {
            // @see https://docs.github.com/en/actions/reference/environment-variables
            return path.join(PATH_PREFIX, file.filename);
        });
    };

    const getLabels = async () => {
        const labels = await octokit.rest.issues.listLabelsOnIssue({
            ...context.repo,
            issue_number: pull_number,
        });

        return labels.data.map((label) => label.name);
    };

    /**
     * @returns {Promise<string>}
     */
    const getUser = async () => {
        const authInfo = await octokit.rest.users.getAuthenticated();
        return authInfo.data.login;
    }

    /**
     * @returns {$Reviewers.GitHub.Review[]}
     */
    const getListReviews = async () => {
        const route = `GET /repos/${repo.owner}/${repo.repo}/pulls/${pull_number}/reviews`;
        const options = {per_page: 100};

        const response = await octokit.request(route, options);

        const nextPages = utils.getNextPages(response.headers, route);

        if(!nextPages) {
            return response.data;
        }

        return [
            response.data,
            await Promise.all(
                nextPages.map(async (page) => {
                    return (await octokit.request(page, options)).data;
                }),
            ),
        ].flat(2);
    };

    /**
     * @returns {Record<string, string>}
     */
    const getLabelsMap = () => {
        if (!labelsMap) {
            return undefined;
        }

        let labelsMapObj;

        try {
            labelsMapObj = JSON.parse(labelsMap);
        } catch (_e) {
            core.warning('labels does not have a valid JSON structure');
            return undefined;
        }

        if (!utils.validateLabelsMap(labelsMapObj)){
            core.warning('labels does not have a valid structure');
            return undefined;
        }

        return labelsMapObj;
    };

    /**
     * @returns {Promise<string>}
     */
    const getReviewersLevel = async () => {
        // no level
        const DEFAULT_LEVEL = '';
        const labelsMapObj = getLabelsMap();

        if (!labelsMapObj) {
            return DEFAULT_LEVEL;
        }

        const labelsOnPR = await getLabels();
        const labelsBelongsToAction = Object.keys(labelsMapObj);

        const matchedLabels = labelsOnPR.filter((label) => {
            return labelsBelongsToAction.includes(label);
        });

        switch (matchedLabels.length) {
            case 0: {
                return DEFAULT_LEVEL;
            }

            case 1: {
                return labelsMapObj[matchedLabels[0]];
            }

            default: {
                const labelsPaths = matchedLabels.map((label) => labelsMapObj[label]);

                return labelsPaths.reduce((currentPath, nextPath) => {
                    const relative = path.relative(nextPath, currentPath);
                    const isSubDir = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

                    return isSubDir ? nextPath : currentPath;
                }, '**');
            }
        }
    };

    /**
     * @param {string[]} codeowners
     * @param {string[]} reviewers
     * @returns {Promise<OwnersMap>}
     */
    const assignReviewers = async (codeowners, reviewers) => {
        const {repo} = context;

        /** @type {string[]} */
        let requestedReviewers = [];


        const requestedReviewersResponse = /** @type {RequestedReviewers} */((await octokit.rest.pulls.listRequestedReviewers({
            ...repo,
            pull_number,
        })).data);

        if (requestedReviewersResponse.users) {
            requestedReviewers = requestedReviewersResponse.users.map((user) => {
                return user.login;
            });
        }

        requestedReviewers = [...new Set([...requestedReviewers, ...reviewers])];

        const reviewersToAdd = codeowners.filter((reviewer) => !requestedReviewers.includes(reviewer));

        if (reviewersToAdd.length > 0) {
            await octokit.rest.pulls.requestReviewers({
                ...repo,
                pull_number,
                reviewers: reviewersToAdd,
            });
        }
    };

    /**
     *
     * @param {string[]} owners
     * @param {string} requiredApproval
     */
    const updateBody = async (owners, requiredApproval) => {
        const updatedBody = utils.createUpdatedBody(pull_request.body, owners, requiredApproval);

        await octokit.rest.pulls.update({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number,
            body: updatedBody,
        });
    };

    /**
     * @param {$Reviewers.OwnersMap} ownersMap
     * @param {$Reviewers.LatestUserReviewMap} latestUserReviewMap
     * @param {string[]} changedFiles
     * @returns {Promise<void>}
     */
    const approvalProcess = async (ownersMap, latestUserReviewMap, changedFiles) => {
        const approvers = Object.keys(latestUserReviewMap).filter((reviewer) => {
            return latestUserReviewMap[reviewer].state === ReviewStates.APPROVED;
        });

        const filesApproved = [];
        const filesRequired = [];
        let ownersRequired = [];

        Object.entries(ownersMap).forEach(([file, owners]) => {
            const ownedFile = owners.some((owner) => approvers.includes(owner));

            if (ownedFile) {
                filesApproved.push(file);
            } else {
                filesRequired.push(file);
                ownersRequired.push(...owners);
            }
        });

        ownersRequired = [...new Set(ownersRequired)];

        const approvedByTheCurrentUser = latestUserReviewMap[user] && latestUserReviewMap[user].state === ReviewStates.APPROVED;
        const requiredApprovalComment = utils.createRequiredApprovalsComment(ownersMap, filesRequired, PATH_PREFIX);

        if (filesRequired.length > 0) {
            core.warning('No sufficient approvals can\'t approve the pull-request');
            core.info(requiredApprovalComment);

            if (approvedByTheCurrentUser) {
                // Dismiss
                await octokit.rest.pulls.dismissReview({
                    ...repo,
                    pull_number,
                    review_id: latestUserReviewMap[user].id,
                    message: 'No sufficient approvals',
                });
            }
        } else if(!approvedByTheCurrentUser) {
            // Approve
            await octokit.rest.pulls.createReview({
                ...repo,
                pull_number,
                event: 'APPROVE',
                body: '',
            });
        }

        await updateBody(ownersRequired, requiredApprovalComment);
    };

    /**
     * @param {string[]} changedFiles
     */
    const printChangedFiles = (changedFiles) => {
        core.startGroup('Changed Files');
        changedFiles.forEach((file) => {
            core.info(`- ${file}`);
        });
        core.endGroup();
        // break line
        core.info('');
    };

    const [
        changedFiles,
        user,
        level,
        listReviews,
    ] = await Promise.all([
        getChangedFiles(),
        getUser(),
        getReviewersLevel(),
        getListReviews(),
    ]);

    printChangedFiles(changedFiles);

    const latestUserReviewMap = utils.getLatestUserReviewMap(listReviews);
    const filteredChangedFiles = utils.filterChangedFiles(changedFiles, ignoreFiles);
    const creator = pull_request.user.login;
    const ownersMap = await utils.createOwnersMap(filteredChangedFiles, ownersFilename, utils.getRegex(level, PATH_PREFIX), creator);
    const codeowners = await utils.getOwners(ownersMap, path.join(PATH_PREFIX, ownersFilename), creator);

    core.info(`level is: ${level}`);

    switch (context.eventName) {
        case 'pull_request': {
            await Promise.all([
                assignReviewers(codeowners, utils.getListReviewers(listReviews)),
                approvalProcess(ownersMap, latestUserReviewMap, filteredChangedFiles),
            ]);

            break;
        }

        case 'pull_request_review': {
            // We don't want to go into Infinite loop
            if (
                context.payload.sender.login !== user  &&
                (/approved|dismissed/).test(context.payload.review.state)
            ) {
                await approvalProcess(ownersMap, latestUserReviewMap, filteredChangedFiles);
            }

            break;
        }

        default: {
            core.error('Only pull requests events or reviews can trigger this action');
        }
    }
})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
