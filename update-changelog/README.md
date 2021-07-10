# Update a Changelog and extract next version

This action will process a CHANGELOG.md that uses the Realm team conventions and extract the candidate next version. It will also update the changelog top section with the new version and today's date, as well as remove any sections that don't have changes.

## Picking a version

Next version based on the content of the top section of the changelog and the previous version:
* If the previous version was a prerelease (i.e. `x.y.z-pre.1`), it will increment the pre-version - i.e. `x.y.z-pre.2`.
* If the new version has a `### Breaking Changes` section, it will increment the major version.
* If the new version has a `### Enhancements` section, it will increment the minor version.
* If the new version has a `### Fixes` section, it will increment the patch version.

## Usage

```yaml
- name: Update Changelog
  id: update-changelog
  uses: realm/ci-actions/update-changelog@v2
  with:
    changelog: ${{ github.workspace }}/CHANGELOG.md
- name: Print inferred version
  run: echo ${{ steps.update-changelog.outputs.new-version }}
```

The action takes the following parameters:

1. *(Required)* `changelog`: the path to the CHANGELOG.md.

The action has the following outputs:

1. `new-version`: the inferred version based on the changelog contents.

[![GitHub release badge](https://badgen.net/github/release/realm/ci-actions/run-ios-simulator)](https://github.com/realm/ci-actions/releases/latest)
