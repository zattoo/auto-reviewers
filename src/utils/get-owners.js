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
        owners.add(...fileOwners);
    });

    if (owners.length === 0) {
        owners = await readFile(filename);
    }

    owners.filter((owner) => {
        return owner !== createdBy;
    });

    return [...new Set(owners)];
};

module.exports = {getOwners};
