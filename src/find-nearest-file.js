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
 * @param {string} filename
 * @param {string} directory
 * @param {RegExp} regex
 * @param {string[]} [foundFiles]
 * @returns {string[]}
 */
const findFiles = async (filename, directory, regex, foundFiles = []) => {
    console.log(foundFiles);
    if (!directory) {
        return foundFiles;
    }

    const file = path.join(directory, filename);

    const match = regex.exec(file);
    console.log(`- file: ${file}, match: ${match}`);

    if(!match && foundFiles.length > 0) {
        console.log('finish', directory);
        return foundFiles;
    }

    const nextDirectory = nextLevelUp(directory);

    try {
        const fileExists = await fse.pathExists(file);

        if (fileExists) {
            foundFiles.push(file);
        }

        return findFiles(filename, nextDirectory, regex, foundFiles);
    } catch (e) {
        return findFiles(filename, nextDirectory, regex, foundFiles);
    }
};

/**
 *
 * @param {string} filename
 * @param {string} root
 * @param {RegExp} regex
 * @returns {string[]}
 */
const findNearestFile = async (filename, root, regex) => {
    console.log(regex);
    if (!filename) {
        throw new Error('filename is required');
    }

    if (filename.indexOf('/') !== -1 || filename === '..') {
        throw new Error('filename must be just a filename and not a path');
    }

    const files = await findFiles(filename, root, regex);
    console.log(`filename: ${filename} : files: ${files.join(', ')}`);
    return files;
};

module.exports = {findNearestFile}
