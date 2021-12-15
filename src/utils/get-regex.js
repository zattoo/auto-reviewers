const path = require('path');
const globToRegExp = require('glob-to-regexp');

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

module.exports = {getRegex};
