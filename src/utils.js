const fse = require('fs-extra');
const path = require('path');
const {
    isPlainObject,
    range,
} = require('lodash');
const globToRegExp = require("glob-to-regexp");
const parse = require('parse-link-header');

const {findNearestFile} = require('./find-nearest-file');

/**
 * @see https://docs.github.com/en/free-pro-team@latest/rest/guides/traversing-with-pagination
 * @param {ResponseHeaders} headers
 * @param {string} route
 * @returns {string[]}
 */
const getNextPages = (headers, route) => {
    if (!headers.link) {
        return null;
    }

    const links = parse(headers.link);
    const pages = range(2, Number(links.last.page)+1);

    return pages.map((number) => {
        return `${route}?page=${number}`;
    });
};


/**
 * @param {string} level
 * @param {string} pathPrefix
 * @returns {RegExp}
 */
const getRegex = (level, pathPrefix) => {
    if (!level) {
        return null;
    }

    const combinedPath = path.join(pathPrefix, level);

    return globToRegExp(combinedPath, {
        flags: 'ig',
        globstar: true,
    });
};

/**
 * @param {Record<string, string>}labelsMap
 * @returns {boolean}
 */
const validateLabelsMap = (labelsMap) => {
    if (!isPlainObject(labelsMap)) {
        return false;
    }

    for (const label of Object.keys(labelsMap)) {
        if (typeof label !== 'string') {
            return false;
        }
    }

    for (const path of Object.values(labelsMap)) {
        if (typeof path !== 'string') {
            return false;
        }
    }

    return true;
};

/**
 * @param {string[]} changedFiles
 * @param {string[]} ignoreFiles
 * @returns {string[]}
 */
const filterChangedFiles = (changedFiles, ignoreFiles) => {
    const filteredFiles = changedFiles.filter((file) => {
        return !ignoreFiles.includes(file.split('/').pop());
    });

    if (filteredFiles.length) {
        return filteredFiles;
    }

    return changedFiles;
};

/**
 * @param {string[]} changedFiles
 * @param {string} filename
 * @param {RegExp} regex
 * @returns {string[]}
 */
const getMetaFiles = async (changedFiles, filename, regex) => {
    const queue = changedFiles.map(async (filePath) => {
        return findNearestFile(filename, filePath, regex);
    });

    const results = await Promise.all(queue);

    return [...new Set(results.flat())].filter(Boolean);
};

/**
 * @param {string[]} files
 * @returns {InfoMap}
 */
const getMetaInfoFromFiles = async (files) => {
    const infoMap = {};

    await Promise.all(...[files.map(async (file) => {
        if (!file) {
            return;
        }

        try {
            const data = (await fse.readFile(file, 'utf8'));
            const dataToArray = data.split('\n');
            infoMap[file] = dataToArray.filter(Boolean);

        } catch (e) {
            console.error(`file: ${file} errored while reading data: ${e}`);
            return Promise.resolve();
        }
    })]);

    return infoMap;
};

/**
 *
 * @param {InfoMap} infoMap
 * @param {string[]} changedFiles
 * @param {string} createdBy
 * @returns {OwnersMap}
 */
const getOwnersMap = (infoMap, changedFiles, createdBy) => {
    /** @type {OwnersMap} */
    const ownersMap = {};

    /** @type {InfoMap} */
    const infoDirMap = {};

    /**
     * @param {string[]} owners
     * @param {string} filePath
     */
    const addFileToOwners = (owners, filePath) => {
        owners.forEach((owner) => {
           ownersMap[owner].ownedFiles.push(filePath);
        });
    };

    Object.entries(infoMap).forEach(([filePath, owners]) => {
        owners.forEach((owner) => {
            if (!ownersMap[owner]) {
                ownersMap[owner] = {
                    sources: [],
                    ownedFiles: []
                }
            }

            ownersMap[owner].sources.push(filePath);
        });

        const dir = path.dirname(filePath);
        infoDirMap[dir] = owners;
    });

    changedFiles.forEach((file) => {
        const owners = [...new Set(Object.keys(infoDirMap).reduce((acc, path) => {
            if (file.startsWith(path)) {
                acc.push(...infoDirMap[path]);
            }

            return acc;
        }, []))].filter(Boolean);

        addFileToOwners(owners, file);
    });

    // Remove owner of PR
    delete ownersMap[createdBy];

    return ownersMap;
};

/**
 *
 * @param {string} file
 * @param {string} pathPrefix
 * @returns {string}
 */
const removePrefixPathFromFile = (file, pathPrefix) => {
    return file.substr(pathPrefix.length + 1);
};

/**
 * @param {OwnersMap} codeowners
 * @param {string[]} files
 * @param {string} pathPrefix
 */
const createRequiredApprovalsComment = (codeowners, files, pathPrefix) => {
    const filesMap = files.map((file) => {
        const fileOwners = Object.entries(codeowners).reduce((acc, [codeowner, data]) => {
            if (data.ownedFiles.includes(file)) {
                acc.push(codeowner);
            }

            return acc;
        }, []);

        return `- ${removePrefixPathFromFile(file, pathPrefix)} (${fileOwners.join(', ')})`;
    }).join('\n');

    return (`Approval is still required for ${files.length} files\n${filesMap}`);
};


module.exports = {
    getMetaFiles,
    getMetaInfoFromFiles,
    filterChangedFiles,
    getOwnersMap,
    createRequiredApprovalsComment,
    validateLabelsMap,
    getNextPages,
    getRegex,
};

/** @typedef {import('@octokit/types/dist-types/ResponseHeaders.d.ts').ResponseHeaders} ResponseHeaders */

/** @typedef {Record<string, string[]>} InfoMap */

/** @typedef {Record<string, OwnerData>} OwnersMap */

/**
 * @typedef {Object} OwnerData
 * @prop {string[]} sources
 * @prop {string[]} ownedFiles
 */
