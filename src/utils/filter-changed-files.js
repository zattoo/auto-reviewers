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

module.exports = {filterChangedFiles};
