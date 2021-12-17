const {getOwners} = require('../../src/utils');

const PATH_REPO = 'test/mocks/repo';

describe(getOwners.name, () => {
    it('returns owners list for a given owners map', async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['victor'],
        };

        expect(await getOwners(ownersMap, '.owners', 'not-me')).toEqual([
            'bogdan',
            'nitzanashi',
            'victor',
        ]);
    });

    it('returns owners list filtered by the creator of the pull-request',  async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['bogdan', 'nitzanashi'],
            [`${PATH_REPO}/projects/app/src/features/example.js`]: ['victor'],
        };

        expect(await getOwners(ownersMap, '.owners', 'nitzanashi')).toEqual([
            'bogdan',
            'victor',
        ]);
    });

    it('returns root owners if owners list is empty',  async () => {
        /** @type {OwnersMap} */
        const ownersMap = {
            [`${PATH_REPO}/.github/workflows/test.yml`]: ['nitzanashi'],
        };

        expect(await getOwners(ownersMap, `${PATH_REPO}/.owners`, 'nitzanashi')).toEqual([
            'bogdan',
        ]);
    });
});

/** @typedef{import('../../src/interfaces').OwnersMap} OwnersMap */
