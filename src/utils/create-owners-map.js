const {findNearestFiles} = require('./find-nearest-files');
const {readFile} = require('./read-file');

/**
 * @param {string[]} changedFiles
 * @param {string} filename
 * @param {RegExp} regex
 * @returns {Promise<Record<string, string[]>>}
 */
const createOwnersFileMap = async (changedFiles, filename, regex) => {
    const ownersFileMap = {};

    const ownersFilesQueue = changedFiles.map(async (filePath) => {
        const ownerFiles = await findNearestFiles(filename, filePath, regex);

        console.log(ownerFiles, filePath);

        ownerFiles.forEach((ownerFile) => {
            if (!ownersFileMap[ownerFile]) {
                ownersFileMap[ownerFile] = [];
            }

            ownersFileMap[ownerFile].push(filename);
        });
    });

    await Promise.all(ownersFilesQueue);

    return ownersFileMap;
};

/**
 * @param {string[]} changedFiles
 * @param {string} filename
 * @param {RegExp} regex
 * @returns {Promise<$Reviewers.OwnersMap>}
 */
const createOwnersMap = async (changedFiles, filename, regex) => {
    const ownersFileMap = await createOwnersFileMap(changedFiles, filename, regex);

    const fileQueue = Object.entries(ownersFileMap).map( async([ownersFile, changedFilesList]) => {
        const ownersData = await readFile(ownersFile);

        return {
            owners: ownersData,
            changedFilesList,
        };
    });

    const files = await Promise.all(fileQueue);

    const map = files.reduce((result, info) => {
        changedFiles.forEach((changedFile) => {
            if (!result[changedFile]) {
                result[changedFile] = [];
            }

            result[changedFile].push(...info.owners);
        });

        return result;
    }, {});

    return map;
};

module.exports = {createOwnersMap};
