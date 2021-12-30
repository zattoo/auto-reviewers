/**
 * @param {$Reviewers.OwnersMap} requiredApprovalMap
 */
const createRequiredApprovalsComment = (requiredApprovalMap) => {
    const files = Object.keys(requiredApprovalMap);

    const filesMap = files.map((file) => {
        return `- ${file} (${requiredApprovalMap[file].join(', ')})`;
    }).join('\n');

    return (`Approval is still required for ${files.length} files\n${filesMap}`);
};

module.exports = {createRequiredApprovalsComment};

