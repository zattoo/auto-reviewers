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

    console.log(regex);

    const ownersFilesQueue = changedFiles.map(async (filePath) => {
        const ownerFiles = await findNearestFiles(filename, filePath, regex);

        console.log(filePath, ownerFiles);

        ownerFiles.forEach((ownerFile) => {
            if (!ownersFileMap[ownerFile]) {
                ownersFileMap[ownerFile] = [];
            }

            ownersFileMap[ownerFile].push(filePath);
        });
    });

    await Promise.all(ownersFilesQueue);

    return ownersFileMap;
};

/**
 * @param {string[]} changedFiles
 * @param {string} filename
 * @param {RegExp} regex
 * @param {string} creator
 * @returns {Promise<$Reviewers.OwnersMap>}
 */
const createOwnersMap = async (changedFiles, filename, regex, creator) => {
    const ownersFileMap = await createOwnersFileMap(changedFiles, filename, regex);

    const fileQueue = Object.entries(ownersFileMap).map(async ([ownersFile, changedFilesList]) => {
        const owners = (await readFile(ownersFile)).filter((owner) => owner !== creator);

        return {
            owners,
            changedFilesList,
        };
    });

    const files = await Promise.all(fileQueue);

    const map = files.reduce((result, info) => {
        info.changedFilesList.forEach((changedFile) => {
            if (!result[changedFile]) {
                result[changedFile] = [];
            }

            result[changedFile] = [...new Set([...result[changedFile], ...info.owners])];
        });

        return result;
    }, {});

    return map;
};

module.exports = {createOwnersMap};
