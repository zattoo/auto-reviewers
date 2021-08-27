const {
    getOwnersMap,
    getMetaFiles,
} = require('../src/utils');

const ownersMap = {
    gothban: {
        sources: [
            '/.owners',
        ],
        ownedFiles: [
            '/.github/workflows/project-recognition.yml',
            '/projects/app/.labels',
            '/projects/app/CHANGELOG.md',
            '/projects/app/src/features/account/.labels',
            '/projects/app/src/features/entrance/index.jsx',
            '/projects/app/src/features/player/index.jsx',
        ],
    },
    nitzanashi: {
        sources: [
            '/.owners',
            '/projects/app/.owners',
        ],
        ownedFiles: [
            '/.github/workflows/project-recognition.yml',
            '/projects/app/.labels',
            '/projects/app/CHANGELOG.md',
            '/projects/app/src/features/account/.labels',
            '/projects/app/src/features/entrance/index.jsx',
            '/projects/app/src/features/player/index.jsx',
        ],
    },
    victor: {
        sources: [
            '/projects/app/src/features/player/.owners'
        ],
        ownedFiles: [
            '/projects/app/src/features/player/index.jsx',
        ],
    }
};

describe(getOwnersMap.name, () => {
    it('returns the expected map', () => {
        const changedFiles = [
            '/.github/workflows/project-recognition.yml',
            '/projects/app/.labels',
            '/projects/app/CHANGELOG.md',
            '/projects/app/src/features/account/.labels',
            '/projects/app/src/features/entrance/index.jsx',
            '/projects/app/src/features/player/index.jsx',
        ];

        const infoMap = {
            '/.owners': ['gothban', 'nitzanashi'],
            '/projects/app/.owners': ['nitzanashi'],
            '/projects/app/src/features/player/.owners': ['victor'],
        };

        expect(getOwnersMap(infoMap, changedFiles)).toEqual(ownersMap);

    });
});

describe(getMetaFiles.name, () => {
    it('gets owners files', async () => {
        const changedFiles = ['test/mocks/app/src/features/example.js'];
        expect(await getMetaFiles(changedFiles, '.owners')).toEqual(['test/mocks/.owners']);
    });

    it('gets owners files for multiple files', async () => {
        const changedFiles = ['test/mocks/projects/app/src/features/example.js', 'test/mocks/projects/cast/src/index.js'];
        expect(await getMetaFiles(changedFiles, '.owners')).toEqual(['test/mocks/projects/app/.owners', 'test/mocks/projects/cast/.owners']);
    });

    it('doesnt break on dot files', async () => {
        const changedFiles = ['.github/workflows/pr.yml'];
        expect(await getMetaFiles(changedFiles, '.owners')).toEqual([]);
    });
});
