# Run an iOS application in a simulator
This github action helps with running an iOS application on a simulator in a Github runner.

This action can run on any Github runner and it can be added to a GitHub workflow as follows:

```yaml
- name: Run iOS application
  uses: realm/ci/run-ios-simulator@v1
  with:
    appPath: 'relative/path/to/your/iosApp.app'
    bundleId: 'domain.app.your'
    iphoneToSimulate: 'iPhone-9'
    arguments: '--some --arguments --in --whatever --format 'you need''
```

The action takes the following parameters:

1. *(Necessary)* __appPath__: a relative path to your app from the root of your repo
2. *(Necessary)* __bundleId__: the app bundle id of your app
3. *(Optional)* __iphoneToSimulate__: the ios devices that you want to simulated. If none is passed it defaults to *"iPhone-8"*
4. *(Optional)* __arguments__: additional arguments to supply to the simulator


![Ubuntu badge](https://badgen.net/badge/icon/Ubuntu?icon=terminal&label)
![macOS badge](https://badgen.net/badge/icon/macOS?icon=apple&label)
![Windows badge](https://badgen.net/badge/icon/Windows?icon=windows&label)

[![GitHub release badge](https://badgen.net/github/release/realm/ci-actions/run-ios-simulator/stable)](https://github.com/realm/ci-actions/releases/latest)
