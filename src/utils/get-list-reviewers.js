/**
 * Returns list of users from reviews
 *
 * @param {$Reviewers.GitHub.Review[]} reviews
 * @returns {string[]}
 */
const getListReviewers = (reviews) => {
    return [...new Set(reviews.map((review) => {
        return review.user.login;
    }))];
};

module.exports = {getListReviewers};
