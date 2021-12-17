const {ReviewStates} = require('../enums');

/**
 * Returns list of last reviews decision per user
 *
 * @param {$Reviewers.GitHub.Review[]} reviews
 * @returns {$Reviewers.LatestUserReviewMap}
 */
const getLatestUserReviewMap = (reviews) => {
    /** @type {$Reviewers.LatestUserReviewMap} */
    const listLatestReviewDecision = {};

    const meaningfulStates = [ReviewStates.APPROVED, ReviewStates.CHANGES_REQUESTED, ReviewStates.DISMISSED];

    reviews.forEach((review) => {
        const user = review.user.login;
        const hasUserAlready = Boolean(listLatestReviewDecision[user]);

        // https://docs.github.com/en/graphql/reference/enums#pullrequestreviewstate
        if (!meaningfulStates.includes(review.state)) {
            return;
        }

        if (!hasUserAlready) {
            listLatestReviewDecision[user] = review;
        } else if (review.submitted_at > listLatestReviewDecision[user].submitted_at) {
            listLatestReviewDecision[user] = review;
        }
    });

    return listLatestReviewDecision;
};

module.exports = {getLatestUserReviewMap};
