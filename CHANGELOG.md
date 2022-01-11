All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased

- Clean before and after linebreaks in PR description

## [4.0.0] - 09.01.2022

- [breaking-changes] Changed glob for regex based values for `labels` map

## [3.1.1] - 30.12.2021

Changed Pull Request description styling

## [3.1.0] - 29.12.2021

### Added
- [#36](https://github.com/zattoo/reviewers/issues/36) Show required reviewers on Pull Request description

## [3.0.1] - 22.12.2021

### Fixed
- Ignored files were included in changed files

## [3.0.0] - 17.12.2021

### Changed
- [breaking-changes] Architecture of assigning reviewers, preventing propagation

## [2.1.1] - 05.11.2021

### Fixed
- [#35](https://github.com/zattoo/reviewers/issues/35) Last review per user is being evaluated even if it is just a comment

## [2.1.0] - 25.10.2021

### Fixed
- [#8](https://github.com/zattoo/reviewers/issues/8) Handle `listReviews` pagination

## [2.0.0] - 29.08.2021

### Added
- Assign reviewers using labels

### Changed
- [breaking change] `ignore_files` renamed to `ignore`

## [1.0.1] - 26.08.2021

### Changed
- Increased the amount of results for `List reviews for a pull request` from 30 to 100

### Infrastructure
- Renamed package to `reviewers`

## [1.0.0] - 18.08.2021

Initial implementation
