// see https://docs.github.com/en/graphql/reference/enums#pullrequestreviewstate

// A review allowing the pull request to merge.
const APPROVED = 'APPROVED';

// A review blocking the pull request from merging.
const CHANGES_REQUESTED = 'CHANGES_REQUESTED';

// An informational review.
const COMMENTED = 'COMMENTED';

// A review that has been dismissed.
const DISMISSED = 'DISMISSED';

// A review that has not yet been submitted.
const PENDING = 'PENDING';

module.exports = {
    APPROVED,
    CHANGES_REQUESTED,
    COMMENTED,
    DISMISSED,
    PENDING,
};

