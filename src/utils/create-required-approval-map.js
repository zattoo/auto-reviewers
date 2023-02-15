/**
 * @param {$Reviewers.OwnersMap} ownersMap
 * @param {string[]} filesWhichRequireApproval
 * @param {string} pathPrefix
 * @returns {$Reviewers.OwnersMap}
 */
const createRequiredApprovalsMap = (ownersMap, filesWhichRequireApproval, pathPrefix) => {
    return filesWhichRequireApproval.reduce((
            /** @type {$Reviewers.OwnersMap} */ map,
            file
        ) => {
        map[file.substr(pathPrefix.length + 1)] = ownersMap[file];

        return map;
    }, {});
}

module.exports = {createRequiredApprovalsMap};
