const {getNextPages} = require('../../src/utils');

const ROUTE = `GET /repos/zattoo/bew/pulls/666/reviews`;
const RAW_ROUTE = 'https://api.github.com/repos/zattoo/bew/pulls/666/reviews';

describe(getNextPages.name, () => {
    it('return null if there is no link in the headers', () => {
        /** @type {ResponseHeaders} */
        const responseHeaders = {
            link: null
        }

        expect(getNextPages(responseHeaders, ROUTE)).toEqual(null);
    });

    it('returns next pages range', () => {
        const LAST_PAGE = 4;

        /** @type {ResponseHeaders} */
        const responseHeaders = {
            link: `<${RAW_ROUTE}?page=2>; rel="next",` +
                `<${RAW_ROUTE}?page=${LAST_PAGE}>; rel="last",` +
                `<${RAW_ROUTE}?page=1>; rel="first`,
        };

        const expectedResult = [
            `${ROUTE}?page=2`,
            `${ROUTE}?page=3`,
            `${ROUTE}?page=4`,
        ];

        expect(getNextPages(responseHeaders, ROUTE)).toEqual(expectedResult);
    });
});


/** @typedef {import('../../src/interfaces').GitHub.ResponseHeaders} ResponseHeaders */
