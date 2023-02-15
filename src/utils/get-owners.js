const {readFile} = require('./read-file');

/**
 *
 * @param {string[]} owners
 * @param {string} creator
 * @returns {string[]}
 */
const filterCreator = (owners, creator) => {
    return owners.filter((owner) => {
        return owner !== creator;
    });
};

/**
 * @param {$Reviewers.OwnersMap} ownersMap
 * @param {string} filename
 * @param {string} creator
 * @returns {Promise<string[]>}
 */
const getOwners = async (ownersMap, filename, creator) => {
    /** @type {string[]} */
    let owners = [];

    Object.values(ownersMap).forEach((fileOwners) => {
        owners.push(...fileOwners);
    });

    owners = [...new Set(filterCreator(owners, creator))];

    if (owners.length === 0) {
        owners = (filterCreator((await readFile(filename)), creator));
    }

    return owners;

};

module.exports = {getOwners};
