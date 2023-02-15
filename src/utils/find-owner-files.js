const path = require('path');
const fse = require('fs-extra');

/**
 *
 * @param {string} directory
 */
const nextLevelUp = (directory) => {
    if (directory === '.') {
        return '/';
    }

    if (directory === path.resolve('/')) {
        return null;
    }

    return  path.dirname(directory);
};

/**
 *
 * @param {string} ownersPath
 * @param {string} filename
 * @returns {Promise<string>}
 */
const getProjectOwnerFile = async (ownersPath, filename) => {
    if (!ownersPath) {
        return null;
    }

    const projectOwnersFile = path.join(ownersPath, filename);
    const fileExists = await fse.pathExists(projectOwnersFile);

    if (fileExists) {
        return projectOwnersFile;
    }

    return null;
}

/**
 * @param {FindFilesOptions} options
 * @returns {Promise<string[]>}
 */
const findFiles = async (options) => {

    const {
        filename,
        directory,
        regex,
        foundFiles = []
    } = options;

    if (!directory) {
        return foundFiles;
    }

    const file = path.join(directory, filename);

    // if no regex and we already found something just return it
    if (!regex && foundFiles.length > 0) {
        return foundFiles;
    } else if (regex) {
        const match = regex.exec(file);
        // reset regex
        regex.lastIndex = 0;

        // if no match and we already found something just return it
        if (!match && foundFiles.length > 0) {
            return foundFiles;
        }
    }

    const nextDirectory = nextLevelUp(directory);

    try {
        const fileExists = await fse.pathExists(file);

        if (fileExists && !foundFiles.includes(file)) {
            foundFiles.push(file);
        }

        const options = {
            filename,
            directory: nextDirectory,
            regex,
            foundFiles
        };

        return findFiles(options);
    } catch (e) {
        return findFiles(options);
    }
};

/**
 * @param {FindOwnerFilesOptions} options
 * @returns {Promise<string[]>}
 */
const findOwnerFiles = async (options) => {

    const {
        filename,
        directory,
        regex,
        ownersPath
    } = options;

    if (!filename) {
        throw new Error('filename is required');
    }

    if (filename.indexOf('/') !== -1 || filename === '..') {
        throw new Error('filename must be just a filename and not a path');
    }


    const foundFiles = [];
    const projectOwnersFile = await getProjectOwnerFile(ownersPath, filename);

    if (projectOwnersFile) {
        foundFiles.push(projectOwnersFile);
    }

    const files =  await findFiles({filename, directory, regex, foundFiles});

    return files;
};

module.exports = { findOwnerFiles }

/**
 * @typedef {Object} FindOwnerFilesOptions
 * @prop {string} filename
 * @prop {string} directory
 * @prop {RegExp} [regex]
 * @prop {string} [ownersPath]
 */

/**
 * @typedef {Object} FindFilesOptions
 * @prop {string} filename
 * @prop {string} directory
 * @prop {RegExp} [regex]
 * @prop {string[]} [foundFiles]
 */
