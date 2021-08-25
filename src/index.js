const path = require('path');
const core = require('@actions/core');
const {
    context,
    getOctokit,
} = require('@actions/github');

const utils = require('./utils');

const PATH_PREFIX = process.env.GITHUB_WORKSPACE;

(async () => {
    const token = core.getInput('token', {required: true});
    const ownersFilename = core.getInput('source', {required: true});
    const ignoreFiles = core.getMultilineInput('ignore_files', {required: true});
    const labelsMap = JSON.parse(core.getInput('labels_map', {required: false}));

    const octokit = getOctokit(token);

    const {repo} = context;
    const {pull_request} = context.payload;
    const pull_number = pull_request.number;

    /**
     * @returns {string[]}
     */
    const getChangedFiles = async () => {
        core.startGroup('Changed Files');
        const listFilesOptions = octokit.rest.pulls.listFiles.endpoint.merge({
            ...context.repo,
            pull_number,
        });

        const listFilesResponse = await octokit.paginate(listFilesOptions);

        const changedFiles = listFilesResponse.map((file) => {
            core.info(`- ${file.filename}`);

            // @see https://docs.github.com/en/actions/reference/environment-variables
            return path.join(PATH_PREFIX, file.filename);
        });

        core.endGroup();
        // break line
        core.info('');
        return utils.filterChangedFiles(changedFiles, ignoreFiles)
    };

    const getLabels = async () => {
        const labels = await octokit.rest.issues.listLabelsOnIssue({
            ...context.repo,
            issue_number: pull_number,
        });

        return labels.data.map((label) => label.name);
    };

    /**
     * @param {string} createdBy
     * @param {string[]} changedFiles
     * @param {string} level
     */
    const getCodeOwners = async (createdBy, changedFiles, level) => {
        let reviewersFiles = await utils.getMetaFiles(changedFiles, ownersFilename, utils.getRegex(level, PATH_PREFIX));

        core.info(reviewersFiles);

        if (reviewersFiles.length <= 0) {
            reviewersFiles = [ownersFilename];
        }

        const reviewersMap = await utils.getMetaInfoFromFiles(reviewersFiles);
        return utils.getOwnersMap(reviewersMap, changedFiles, createdBy);
    };

    /**
     * @returns {string}
     */
    const getReviewersLevel = async () => {
        const DEFAULT_LEVEL = '**';

        if (!labelsMap) {
            return DEFAULT_LEVEL;
        }

        // early exit if not a valid map
        if (!utils.validateLabelsMap(labelsMap)){
            core.warning('labels_map does not have a valid structure ')
            return DEFAULT_LEVEL;
        }

        const labelsOnPR = await getLabels();
        core.info(`labels on PR: ${labelsOnPR}`);
        const labelsBelongsToAction = Object.keys(labelsMap);

        const matchedLabels = labelsOnPR.filter((label) => {
            return labelsBelongsToAction.includes(label);
        });

        if (matchedLabels.length <= 0) {
            return DEFAULT_LEVEL;
        } else if(matchedLabels.length === 1) {
            return labelsMap[matchedLabels[0]];
        } else {
            const labelsPaths = matchedLabels.map((label) => labelsMap[label]);

            return labelsPaths.reduce((currentPath, nextPath) => {
                const relative = path.relative(nextPath, currentPath);
                const isSubDir = relative && !relative.startsWith("..") && !path.isAbsolute(relative);

                return isSubDir ? nextPath : currentPath;
            }, DEFAULT_LEVEL);
        }
    };

    /**
     * @param {OwnersMap} codeowners
     * @param {string[]} reviewers
     * @returns {Promise<OwnersMap>}
     */
    const assignReviewers = async (codeowners, reviewers) => {
        const {repo} = context;

        /** @type {string[]} */
        let reviewersOnPr = [];

        const requestedReviewers = (await octokit.rest.pulls.listRequestedReviewers({
            ...repo,
            pull_number,
        })).data;

        if (requestedReviewers.users) {
            reviewersOnPr = requestedReviewers.users.map((user) => {
                return user.login;
            });
        }

        reviewersOnPr = [...new Set([reviewersOnPr, reviewers].flat())];

        const reviewersFromFiles = Object.keys(codeowners);
        const reviewersToAdd = reviewersFromFiles.filter((reviewer) => !reviewersOnPr.includes(reviewer));

        if (reviewersToAdd.length > 0) {
            await octokit.rest.pulls.requestReviewers({
                ...repo,
                pull_number,
                reviewers: reviewersToAdd,
            });
        }
    };

    /**
     * @returns {Promise<string>}
     */
    const getUser = async () => {
        const authInfo = await octokit.rest.users.getAuthenticated();
        return authInfo.data.login;
    }

    /**
     * @returns {Promise<Record<string, object>>}
     */
    const getReviewers = async () => {
        const allReviewersData = (await octokit.rest.pulls.listReviews({
            ...repo,
            pull_number,
        })).data;

        const latestReviews = {};

        allReviewersData.forEach((review) => {
            const user = review.user.login;
            const hasUserAlready = Boolean(latestReviews[user]);

            if (!hasUserAlready) {
                latestReviews[user] = review;
            } else if (review.submitted_at > latestReviews[user].submitted_at) {
                latestReviews[user] = review;
            }
        });

        return latestReviews;
    };

    /**
     * @param {OwnersMap} codeowners
     * @param {string[]} reviewers
     * @param {string[]} changedFiles
     * @param {boolean} [shouldDismiss]
     * @returns {Promise<void>}
     */
    const approvalProcess = async (codeowners, reviewers, changedFiles, shouldDismiss) => {
        const approvers = Object.keys(reviewers).filter((reviewer) => {
            return reviewers[reviewer].state === 'APPROVED';
        });

        const allApprovedFiles = [...new Set(approvers.reduce((acc, approver) => {
            if(codeowners[approver]) {
                acc.push(...codeowners[approver].ownedFiles);
            }
            return acc;
        }, []))];

        const filesWhichStillNeedApproval = changedFiles.filter((file) => {
            return !allApprovedFiles.includes(file);
        });


        if (filesWhichStillNeedApproval.length > 0) {
            core.warning("No sufficient approvals can't approve the pull-request");
            core.info(utils.createRequiredApprovalsComment(codeowners, filesWhichStillNeedApproval, PATH_PREFIX));

            const approvedByTheCurrentUser = reviewers[user] && reviewers[user].state === 'APPROVED';

            if (approvedByTheCurrentUser && shouldDismiss) {
                // Dismiss
                await octokit.rest.pulls.dismissReview({
                    ...repo,
                    pull_number,
                    review_id: reviewers[user].id,
                    message: 'No sufficient approvals',
                });
            }
        } else {
            // Approve
            await octokit.rest.pulls.createReview({
                ...repo,
                pull_number,
                event: 'APPROVE',
                body: '',
            });
        }
    };

    const [
        changedFiles,
        reviewers,
        user,
        level,
    ] = await Promise.all([
        getChangedFiles(),
        getReviewers(),
        getUser(),
        getReviewersLevel(),
    ]);

    core.info(`filtered files: ${changedFiles}`);

    const codeowners = await getCodeOwners(pull_request.user.login, changedFiles, level);
    core.info(`level is: ${level}`);

    switch (context.eventName) {
        case 'pull_request': {
            await Promise.all([
                assignReviewers(codeowners, Object.keys(reviewers)),
                approvalProcess(codeowners, reviewers, changedFiles, true),
            ]);

            break;
        }

        case 'pull_request_review': {
            // We don't want to go into Infinite loop
            if (
                context.payload.sender.login !== user  &&
                (/approved|dismissed/).test(context.payload.review.state)
            ) {
                await approvalProcess(codeowners, reviewers, changedFiles, true);
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

/**
 * @typedef {Object} PullRequestHandlerData
 * @prop {string[]} changedFiles
 * @prop {PullRequest} pull_request
 * @prop {ArtifactData} artifactData
 * @prop {OwnersMap} codeowners
 */

/**
 * @typedef {Object} PullRequest
 * @prop {number} number
 * @prop {User} user
 */

/**
 * @typedef {Object} User
 * @prop {string} login
 */


/** @typedef {import('./utils').OwnersMap} OwnersMap */
