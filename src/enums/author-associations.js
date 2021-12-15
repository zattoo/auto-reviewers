// https://docs.github.com/en/graphql/reference/enums#commentauthorassociation
// A comment author association with repository.

// Author has been invited to collaborate on the repository.
const COLLABORATOR = 'COLLABORATOR';

// Author has previously committed to the repository.
const CONTRIBUTOR = 'CONTRIBUTOR';

// Author has not previously committed to GitHub.
const FIRST_TIMER = 'FIRST_TIMER';

// Author has not previously committed to the repository.
const FIRST_TIME_CONTRIBUTOR = 'FIRST_TIME_CONTRIBUTOR';

// Author is a placeholder for an unclaimed user.
const MANNEQUIN = 'MANNEQUIN';

// Author is a member of the organization that owns the repository.
const MEMBER = 'MEMBER';

// Author has no association with the repository.
const NONE = 'NONE';

// Author is the owner of the repository.
const OWNER = 'OWNER';

module.exports = {
    COLLABORATOR,
    CONTRIBUTOR,
    FIRST_TIMER,
    FIRST_TIME_CONTRIBUTOR,
    MANNEQUIN,
    MEMBER,
    NONE,
    OWNER,
};
