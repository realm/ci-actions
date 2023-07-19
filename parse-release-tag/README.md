# Parse a Release Tag

This action will take a release tag string as input and produce the following output:

1. `package-name`: the name of the package, if set.
2. `package-version`: the version string that was published (10.9.8) or (8.9.10-alpha).
3. `package-version-suffix`: the suffix part of the package-version.
4. `prerelease`: set to `true` if a version suffix (`-<something>`) is appended to the tag.
```

For example, the tag "my-package-v42.0.0-alpha.1 would return:
```
  package-name: "my-package",
  package-version: "42.0.0-alpha.1"
  package-version-suffix: "-alpha.1"
  prerelease: true
```

and the tag "v42.0.0" would return:
```
  package-name: undefined
  package-version: "42.0.0"
  package-version-suffix: undefined
  prerelease: false
```

## Usage

```yaml
- name: Parse Release Tag
  id: parse-release-tag
  uses: realm/ci-actions/andrew/parse-release-tag
  with:
    releaseTag: ${{ github.workspace }}/CHANGELOG.md
- name: Print result version
  run: |
    echo ${{ steps.parse-release-tag.outputs.package-name }}
    echo ${{ steps.update-changelog.outputs.package-version }}
    echo ${{ steps.update-changelog.outputs.package-version-suffix }}
    echo ${{ steps.update-changelog.outputs.prerelease }}
```
