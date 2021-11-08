const path = require('path');
const core = require('@actions/core');
const {
    context,
    getOctokit,
} = require('@actions/github');

const utils = require('./utils');
const pullRequestReviewStates = require('./constants/pull-request-review-states');

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
     * @returns {Record<string, string>}
     */
    const parseLabelsMap = () => {
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
     * @param {string[]} changedFiles
     */
    const logChangedFiles = (changedFiles) => {
        core.startGroup('Changed Files');
        changedFiles.forEach((file) => {
            core.info(`- ${file}`);
        });
        core.endGroup();
        // break line
        core.info('');
    };

    /**
     * @returns {string[]}
     */
    const getChangedFiles = async () => {
        const listFilesOptions = octokit.rest.pulls.listFiles.endpoint.merge({
            ...context.repo,
            pull_number,
        });

        const listFilesResponse = await octokit.paginate(listFilesOptions);

        const changedFiles = listFilesResponse.map((file) => {
            // @see https://docs.github.com/en/actions/reference/environment-variables
            return path.join(PATH_PREFIX, file.filename);
        });

        return changedFiles;
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
        // no level
        const DEFAULT_LEVEL = '';
        const labelsMapObj = parseLabelsMap();

        if (!labelsMapObj) {
            return DEFAULT_LEVEL;
        }

        const labelsOnPR = await getLabels();
        const labelsBelongsToAction = Object.keys(labelsMapObj);

        const matchedLabels = labelsOnPR.filter((label) => {
            return labelsBelongsToAction.includes(label);
        });

        if (matchedLabels.length <= 0) {
            return DEFAULT_LEVEL;
        } else if(matchedLabels.length === 1) {
            return labelsMapObj[matchedLabels[0]];
        } else {
            const labelsPaths = matchedLabels.map((label) => labelsMapObj[label]);

            return labelsPaths.reduce((currentPath, nextPath) => {
                const relative = path.relative(nextPath, currentPath);
                const isSubDir = relative && !relative.startsWith("..") && !path.isAbsolute(relative);

                return isSubDir ? nextPath : currentPath;
            }, '**');
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
    //
    // /**
    //  * pagination is not possible see https://github.com/octokit/rest.js/issues/33
    //  *
    //  * @returns {Promise<Record<string, object>>}
    //  */
    // const getReviewers = async () => {
    //     const route = `GET /repos/${repo.owner}/${repo.repo}/pulls/${pull_number}/reviews`;
    //     const options = {per_page: 100};
    //
    //     const response = await octokit.request(route, options);
    //
    //     const nextPages = utils.getNextPages(response.headers, route);
    //
    //     let allReviewersData;
    //
    //     if(!nextPages) {
    //         allReviewersData = response.data;
    //     } else {
    //         allReviewersData = [
    //             response.data,
    //             await Promise.all(
    //                 nextPages.map(async (page) => {
    //                     return (await octokit.request(page, options)).data;
    //                 }),
    //             ),
    //         ].flat(2);
    //     }
    //
    //     const latestReviews = {};
    //
    //     allReviewersData.forEach((review) => {
    //         const user = review.user.login;
    //         const hasUserAlready = Boolean(latestReviews[user]);
    //
    //         // https://docs.github.com/en/graphql/reference/enums#pullrequestreviewstate
    //         if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) {
    //             return;
    //         }
    //
    //         if (!hasUserAlready) {
    //             latestReviews[user] = review;
    //         } else if (review.submitted_at > latestReviews[user].submitted_at) {
    //             latestReviews[user] = review;
    //         }
    //     });
    //
    //     return latestReviews;
    // };

    /**
     * pagination is not possible see https://github.com/octokit/rest.js/issues/33
     *
     * @returns {Promise<PullRequestReview[]>}
     */
    const getReviews = async () => {
        const route = `GET /repos/${repo.owner}/${repo.repo}/pulls/${pull_number}/reviews`;
        const options = {per_page: 100};

        const response = await octokit.request(route, options);

        const nextPages = utils.getNextPages(response.headers, route);

        let reviews;

        if(!nextPages) {
            reviews = response.data;
        } else {
            reviews = [
                response.data,
                await Promise.all(
                    nextPages.map(async (page) => {
                        return (await octokit.request(page, options)).data;
                    }),
                ),
            ].flat(2);
        }

        return reviews;
    };

    /**
     * @param {PullRequestReview[]} reviews
     * @returns {Record<string, PullRequestReview>}
     */
    const getLatestReviewPerUser = (reviews) => {
        const latestReviewPerUser = {};

        reviews.forEach((review) => {
            const user = review.user.login;
            const hasUserAlready = Boolean(latestReviewPerUser[user]);

            if(![
                pullRequestReviewStates.APPROVED,
                pullRequestReviewStates.CHANGES_REQUESTED,
                pullRequestReviewStates.DISMISSED,
            ].includes(review.state)) {
                return;
            }

            if (!hasUserAlready) {
                latestReviewPerUser[user] = review;
            } else if (review.submitted_at > latestReviewPerUser[user].submitted_at) {
                latestReviewPerUser[user] = review;
            }
        });

        return latestReviewPerUser;
    };

    /**
     *
     * @param {PullRequestReview[]} reviews
     * @returns {string[]}
     */
    const getReviewers = (reviews) => {
        const reviewers = new Set();

        reviews.forEach((review) => {
            reviewers.add(review.user.login);
        });

        return Array.from(reviewers);
    };

    /**
     * @param {OwnersMap} codeowners
     * @param {Record<string, object>} reviewers
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

        const approvedByTheCurrentUser = reviewers[user] && reviewers[user].state === 'APPROVED';

        if (filesWhichStillNeedApproval.length > 0) {
            core.warning("No sufficient approvals can't approve the pull-request");
            core.info(utils.createRequiredApprovalsComment(codeowners, filesWhichStillNeedApproval, PATH_PREFIX));


            if (approvedByTheCurrentUser && shouldDismiss) {
                // Dismiss
                await octokit.rest.pulls.dismissReview({
                    ...repo,
                    pull_number,
                    review_id: reviewers[user].id,
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
    };

    const [
        changedFiles,
        reviewes,
        user,
        level,
    ] = await Promise.all([
        getChangedFiles(),
        getReviews(),
        getUser(),
        getReviewersLevel(),
    ]);

    logChangedFiles(changedFiles);

    const filteredChangedFiles = utils.filterChangedFiles(changedFiles, ignoreFiles);
    const codeowners = await getCodeOwners(pull_request.user.login, filteredChangedFiles, level);
    const latestReviewPerUser = getLatestReviewPerUser(reviewes);
    const reviewers = getReviewers(reviewes);

    core.info(`level is: ${level}`);

    switch (context.eventName) {
        case 'pull_request': {
            await Promise.all([
                assignReviewers(codeowners, reviewers),
                approvalProcess(codeowners, latestReviewPerUser, filteredChangedFiles, true),
            ]);

            break;
        }

        case 'pull_request_review': {
            // We don't want to go into Infinite loop
            if (
                context.payload.sender.login !== user  &&
                (/approved|dismissed/).test(context.payload.review.state)
            ) {
                await approvalProcess(codeowners, reviewers, filteredChangedFiles, true);
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
 * @typedef {import('./utils').OwnersMap} OwnersMap
 */

/**
 * @typedef {import('./interfaces').User} User
 */

/**
 * @typedef {import('./interfaces').PullRequestReview} PullRequestReview
 */
