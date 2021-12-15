const {readFile} = require('./read-file');

/**
 * @param {$Reviewers.OwnersMap} ownersMap
 * @param {string} filename
 * @param {string} createdBy
 * @returns {Promise<string[]>}
 */
const getOwners = async (ownersMap, filename, createdBy) => {
    let owners = [];

    Object.values(ownersMap).forEach((fileOwners) => {
        owners.push(...fileOwners);
    });

    if (owners.length === 0) {
        owners = await readFile(filename);
    }

    return [...new Set(owners.filter((owner) => {
        return owner !== createdBy;
    }))];
};

module.exports = {getOwners};
