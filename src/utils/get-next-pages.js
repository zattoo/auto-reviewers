const {range} = require('lodash');
const parse = require('parse-link-header');

/**
 * @see https://docs.github.com/en/free-pro-team@latest/rest/guides/traversing-with-pagination
 * @param {$Reviewers.GitHub.ResponseHeaders} headers
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

module.exports = {getNextPages};
