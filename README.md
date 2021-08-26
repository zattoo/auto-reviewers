# Reviewers

GitHub Action to recognize and assign reviewers and codeowners

## Inputs

### `token`

`string`

Required. GitHub token

### `source`

`string`

Required. Filename which contain owners metadata to look for

## Usage

### Metadata file
The metadata file contains list of labels separated by break-line between which should be assigned ot all sub-paths.
```yml
# name: projects/common/.owners
nitzanashi
```

If the changed file was `projects/common/utils/time.js` the action will search for the closest `source` (e.g `.labels`)
In the current example `projects/common/.labels` is the closest one so all the labels listed in that file will be assigned.

### Workflow

````yaml
name: Auto Reviewers

on:
    pull_request_review:
    pull_request:

jobs:
    assign-labels:
        name: Assign labels
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - uses: zattoo/auto-reviewers@v1
            with:
              token: ${{secrets.TOKEN}}
              source: '.owners'
              ignore_files: '
                .owners
                CHANGELOG.md
              '
````
