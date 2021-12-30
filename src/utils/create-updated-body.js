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
 * Create table with all required files and owners
 * If the amount of files exceeded 1000 we don't show table
 * since PR body can't contain it
 *
 * @param {$Reviewers.OwnersMap} requiredApprovalMap
 * @param {number} length
 * @returns {string}
 */
const createTable = (requiredApprovalMap, length) => {
    if(length > 4000) {
        return '';
    }

    const data = Object.entries(requiredApprovalMap).map(([file, owners]) => {
        return `| \`${file}\` | ${owners.join(', ')} |\n`;
    }).join('');

    return (
        '<details>'
        + '\n'
        + '<summary>Details</summary>'
        + '\n\n'
        + '| File | Owners |\n| :--- | :--- |'
        + '\n'
        + data
        + '\n\n'
        + '</details>'
        + '\n'
    )
};

/**
 * @param {string[]} owners
 * @param {$Reviewers.OwnersMap} requiredApprovalMap
 * @returns {string}
 */
const createCommentBlock = (owners, requiredApprovalMap) => {
    if(!owners.length) {
        return REVIEWERS_BLOCK_START + REVIEWERS_BLOCK_END;
    }

    const files = Object.keys(requiredApprovalMap);
    const filesLength = files.length;
    const description = `${filesLength} ${filesLength > 1 ? 'files' : 'file'} needs to be approved by: ${owners.map(owner => `@${owner}`).join(', ')}`;
    const table = createTable(requiredApprovalMap, filesLength);

    return (
        REVIEWERS_BLOCK_START
        + '\n'
        + '## Reviewers'
        + '\n\n'
        + description
        + '\n'
        + table
        + REVIEWERS_BLOCK_END
        + '\n'
    );
};

/**
 * @param {string} currentBody
 * @param {string[]} owners
 * @param {$Reviewers.OwnersMap} requiredApprovalMap
 * @returns {string}
 */
const createUpdatedBody = (currentBody, owners, requiredApprovalMap) => {
    const body = currentBody || '';
    const comment = createCommentBlock(owners, requiredApprovalMap);

    if(sameComment(body, comment)) {
        return body;
    }

    if(BLOCK_REGEX.test(body)) {
        return body.replace(BLOCK_REGEX, comment);
    }

    return body + comment;
};

module.exports = {createUpdatedBody};
