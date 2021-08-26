# Reviewers

GitHub Action to recognize and assign reviewers and codeowners

## Inputs

### `token`

`string`

Required. GitHub token

### `source`

`string`

Required. Filename which contain owners metadata to look for

### `ignore_files`

`multiLine string`

Optional. list of files which the action should ignore when assigning reviewers, If no other changed files except ignore ones, the action will assign root level owners

### `labels_map`

`key-value pair object`

Optional. a key-value object, where keys are `labels` and values are a glob of a `path` in the code. If specific label added to a Pull-request, the action will assign reviewers according to the map

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
  name: Reviewers

  on:
      pull_request_review:
      pull_request:
          types: [
              opened,
              ready_for_review,
              reopened,
              synchronize,
              labeled,
              unlabeled,
          ]

  jobs:
      reviewers:
          name: Reviewers
          runs-on: ubuntu-latest
          steps:
              - uses: actions/checkout@v2
              - uses: zattoo/reviewers@levels
                with:
                    token: ${{secrets.TOKEN}}
                    source: '.owners'
                    ignore_files: |
                        CHANGELOG.md
                        Another file
                    labels_map: |
                        {
                          "reviewers-projects": "**/projects/*",
                          "reviewers-platform": "/"
                        }
````
