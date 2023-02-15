const {findOwnerFiles} = require('./find-owner-files');
const {readFile} = require('./read-file');

/**
 * @param {CreateOwnersMapOptions} options
 * @returns {Promise<Record<string, string[]>>}
 */
const createOwnersFileMap = async (options) => {
    const {
        changedFiles,
        filename,
        regex,
        ownersPath
    } = options;

    /** @type {Record<string, string[]>} */
    const ownersFileMap = {};

    const ownersFilesQueue = changedFiles.map(async (filePath) => {
       const ownerFiles = await findOwnerFiles({
           filename,
           directory: filePath,
           regex,
           ownersPath
        });

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
 * @param {CreateOwnersMapOptions} options
 * @returns {Promise<$Reviewers.OwnersMap>}
 */
const createOwnersMap = async (options) => {

    const {creator, ...createOwnersFileMapOptions} = options;
    const ownersFileMap = await createOwnersFileMap(createOwnersFileMapOptions);

    const fileQueue = Object.entries(ownersFileMap).map(async ([ownersFile, changedFilesList]) => {
        const owners = (await readFile(ownersFile)).filter((owner) => owner !== creator);

        return {
            owners,
            changedFilesList,
        };
    });

    const files = await Promise.all(fileQueue);

    const map = files.reduce((/** @type {Record<string, string[]>} **/ result, info) => {
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

/**
 * @typedef {Object} CreateOwnersFileMapOptions
 * @prop {string[]} changedFiles
 * @prop {string} filename
 * @prop {RegExp} [regex]
 * @prop {string} [ownersPath]
 */

/**
 * @typedef {CreateOwnersFileMapOptions & {creator?: string}}  CreateOwnersMapOptions
 */


