# Run an iOS application in a simulator
This github action helps with running an iOS application on a simulator in a Github runner.

This action can run on any Github runner and it can be added to a GitHub workflow as follows:

```yaml
- name: Run iOS application
  uses: realm/ci-actions/run-ios-simulator@v1
  with:
    appPath: 'relative/path/to/your/iosApp.app'
    bundleId: 'domain.app.your'
    iphoneToSimulate: 'iPhone-9'
    arguments: '--some --arguments --in --whatever --format 'you need''
```

The action takes the following parameters:

1. *(Required)* `appPath`: a relative path to your app from the root of your repo
2. *(Required)* `bundleId`: the app bundle id of your app
3. *(Optional)* `iphoneToSimulate`: the ios devices that you want to simulated. If none is passed it defaults to *"iPhone-8"*
4. *(Optional)* `arguments`: additional arguments to supply to the simulator
5. *(Optional)* `os`: operating system to simulate. Valid options are `iOS` and `tvOS`.

[![GitHub release badge](https://badgen.net/github/release/realm/ci-actions/run-ios-simulator)](https://github.com/realm/ci-actions/releases/latest)
