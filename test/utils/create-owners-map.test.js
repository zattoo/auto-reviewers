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

        expect(await createOwnersMap({
            changedFiles,
            filename: '.owners'
        })).toEqual(ownersMap);
    });

    it('returns the expected map when theres an owners map param', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['nitzanashi', 'kimc0de'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['nitzanashi', 'kimc0de'],
        };

        expect(await createOwnersMap({
            changedFiles,
            filename: '.owners',
            projectOwnersPath: `${PATH_REPO}/projects/app`
        })).toEqual(ownersMap);
    });

    it('returns the expected map for project level', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['nitzanashi', 'kimc0de'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['nitzanashi', 'kimc0de', 'victor'],
        };

        expect(await createOwnersMap({
            changedFiles,
            filename: '.owners',
            regex: getRegex('projects/.*', ''),
            projectOwnersPath: `${PATH_REPO}/projects/app`
        })).toEqual(ownersMap);
    });

    it('returns the expected map for root level', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['bogdan', 'nitzanashi', 'victor', 'kimc0de'],
        };

        expect(await createOwnersMap({
            changedFiles,
            filename: '.owners',
            regex: getRegex('/', '')
        })).toEqual(ownersMap);
    });
});

/** @typedef{import('../../src/interfaces').OwnersMap} OwnersMap */
