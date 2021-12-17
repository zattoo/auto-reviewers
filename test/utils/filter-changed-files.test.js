const {filterChangedFiles} = require('../../src/utils');

const changedFiles = [
    'test/mocks/.github/workflows/test.yml',
    'test/mocks/projects/app/src/features/example.js',
    'test/mocks/projects/app/CHANGELOG.md',
];

describe(filterChangedFiles.name, () => {
   it('filters ignored files from changed files', () => {
       expect(filterChangedFiles(changedFiles, ['CHANGELOG.md'])).toEqual([
           'test/mocks/.github/workflows/test.yml',
           'test/mocks/projects/app/src/features/example.js',
       ]);
   });

   it('returns the changed files list if no ignore file was found', () => {
       expect(filterChangedFiles(changedFiles, ['README.md'])).toEqual(changedFiles);
   });

   it('returns the changed files list if all files were filtered', () => {
       const changelogChangedFiles = ['test/mocks/projects/app/CHANGELOG.md']
       expect(filterChangedFiles(changelogChangedFiles, ['CHANGELOG.md'])).toEqual(changelogChangedFiles);
   });
});
