const fse = require('fs-extra');

/**
 * @param path
 * @returns {Promise<string[]>}
 */
const readFile = async (path) => {
    if (!path) {
        return Promise.resolve('');
    }

    try {
        return (await fse.readFile(path, 'utf8')).split('\n').filter(Boolean);
    } catch (e) {
        return Promise.reject(`path: ${path} errored while reading data: ${e}`);
    }
};

module.exports = {readFile};
