const path = require('path');

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

    return new RegExp(combinedPath);
};

module.exports = {getRegex};
