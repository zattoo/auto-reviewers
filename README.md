# Reviewers

GitHub Action to recognize and assign reviewers and codeowners

## Inputs

### `token`

`string`

Required. GitHub token

### `source`

`string`

Required. Filename which contain owners metadata to look for

### `ignore`

`multi-line string`

Optional. list of files which the action should ignore when assigning reviewers, If no other changed files except ignore ones, the action will assign root level owners

### `labels`

`string`

Optional. Path to a `source` to fetch reviewers from.

### `owners_path`

`JSON string`

Optional. Record, with `label` keys and regex path values. If a specified label is added to a PR, the action will assign reviewers according to the map.

## Where to see Information

The action provides information regarding which files needs to be approved and who are the codeowners of each file
The information is updated everytime the action runs automatically
It can be found in the Pull Request description as well as in the Workflow logs
In the Pull Request description if the amount of files exceeded 500 the action won't show specific details for each file

### Example:

```
<!-- reviewers start -->
## Reviewers

2 files needs to be approved by: @not-a-user, @another-user
<details>
<summary>Details</summary>

| File | Owners |
| :--- | :--- |
| `src/index.jsx` | not-a-user |
| `.github/workflows/reviewers.yml` | not-a-user, another-user|

</details>
<!-- reviewers end -->
```

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
                    ignore: |
                      CHANGELOG.md
                      Another file
                    labels: |
                        {
                          "reviewers:projects": "**/projects/*",
                          "reviewers:platform": "/"
                        }
                    path: 'projects/directory-containing-owners'
````
