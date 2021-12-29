const REVIEWERS_BLOCK_START = '<!-- reviewers start -->';
const REVIEWERS_BLOCK_END = '<!-- reviewers end -->';

const BLOCK_REGEX = new RegExp(`${REVIEWERS_BLOCK_START}(.|\r\n|\n)*${REVIEWERS_BLOCK_END}`);

/**
 * @param {string} body
 * @param {string} comment
 * @returns {boolean}
 */
const sameComment = (body, comment) => {
    const matchedBlock = body.match(BLOCK_REGEX);

    if(!matchedBlock) {
        return false;
    }

    return (matchedBlock[0] === comment);
}

/**
 * @param {string[]} owners
 * @param {string} requiredApproval
 * @returns {string}
 */
const createCommentBlock = (owners, requiredApproval) => {
    if(!owners.length) {
        return REVIEWERS_BLOCK_START + REVIEWERS_BLOCK_END;
    }

    return (
        REVIEWERS_BLOCK_START
        + '\n'
        + '### Reviewers'
        + '\n\n'
        + `Needs to be approved by: ${owners.map(owner => `@${owner}`).join(', ')}`
        + '\n'
        + '<details>'
        + '\n'
        + '<summary>Details</summary>'
        + '\n'
        + requiredApproval
        + '\n'
        + '</details>'
        + '\n'
        + REVIEWERS_BLOCK_END
    );
};

/**
 * @param {string} currentBody
 * @param {string[]} owners
 * @param {string} requiredApproval
 * @returns {string}
 */
const createUpdatedBody = (currentBody, owners, requiredApproval) => {
    const body = currentBody || '';
    const comment = createCommentBlock(owners, requiredApproval);

    if(sameComment(body, comment)) {
        return body;
    }

    if(BLOCK_REGEX.test(body)) {
        return body.replace(BLOCK_REGEX, comment);
    }

    return body + '\n\n' + comment;
};

module.exports = {createUpdatedBody};
