const {isPlainObject} = require('lodash');

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

module.exports = {validateLabelsMap};
