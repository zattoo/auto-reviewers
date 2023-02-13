const {
    createOwnersMap,
    getRegex,
} = require('../../src/utils');

const PATH_REPO = 'test/mocks/repo';

const changedFiles = [
    `${PATH_REPO}/.github/workflows/test.yml`,
    `${PATH_REPO}/projects/app/src/features/example.js`,
];

describe(createOwnersMap.name, () => {
    it('returns the expected map', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['victor'],
        };

        expect(await createOwnersMap(changedFiles, '.owners', null)).toEqual(ownersMap);
    });

    it('returns the expected map when theres an owners map param', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['gotbhan', 'jermie', 'bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['victor', 'gotbhan', 'jermie'],
        };

        expect(await createOwnersMap(changedFiles, '.owners', null, null, `${PATH_REPO}/projects/cast`)).toEqual(ownersMap);
    });

    it('returns the expected map for project level', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['victor', 'nitzanashi', 'kimc0de'],
        };

        expect(await createOwnersMap(changedFiles, '.owners', getRegex('projects/.*', ''))).toEqual(ownersMap);
    });

    it('returns the expected map for root level', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['bogdan', 'nitzanashi', 'victor', 'kimc0de'],
        };

        expect(await createOwnersMap(changedFiles, '.owners', getRegex('/', ''))).toEqual(ownersMap);
    });
});

/** @typedef{import('../../src/interfaces').OwnersMap} OwnersMap */
