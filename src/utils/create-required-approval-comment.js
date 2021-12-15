/**
 * @param {$Reviewers.OwnersMap} ownersMap
 * @param {string[]} filesWhichRequireApproval
 * @param {string} pathPrefix
 */
const createRequiredApprovalsComment = (ownersMap, filesWhichRequireApproval, pathPrefix) => {
    const filesMap = filesWhichRequireApproval.map((file) => {
        return `- ${file.substr(pathPrefix.length + 1)} (${ownersMap[file].join(', ')})`;
    }).join('\n');

    return (`Approval is still required for ${filesWhichRequireApproval.length} files\n${filesMap}`);
};

module.exports = {createRequiredApprovalsComment};

