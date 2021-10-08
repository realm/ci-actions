# Deploy MDB Realm apps

This action exposes an API to create an Atlas cluster and then import previously exported MDB Realm applications.

## deployApps

The main action will deploy an M5 Atlas cluster and then import one or several MDB Realm applications using `realm-cli`.

## Usage

```yaml
deploy-baas-my-test-target:
  runs-on: ubuntu-latest
    name: Deploy MDB Realm for MyTestTarget
    outputs:
      deployedApps: ${{ steps.deploy-mdb-apps.outputs.deployedApps }}
    steps:
    - uses: actions/checkout@v2
    - uses: realm/ci-actions/mdb-realm/deployApps@v4
      id: deploy-mdb-apps
      with:
        projectId: ${{ secrets.ATLAS_PROJECT_ID }}
        apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
        privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}
        appsPath: ${{ github.workspace }}/Tests/TestApps
        differentiator: MyTestTarget
# this is your existing test
run-my-test-target:
  runs-on: ubuntu-latest
  name: Run tests against BaaS
  needs:
    - deploy-baas-my-test-target
  env:
    # this is a base64-encoded json object containing a map between folder name - app id
    APPS_CONFIG: ${{ needs.baas-uwp-managed.outputs.deployedApps }}
  steps:
    - # test step 1
    - # test step 2
cleanup-baas-my-test-target:
  runs-on: ubuntu-latest
    name: Cleanup MyTestTarget
    needs:
    - run-my-test-target
    if: always()
    steps:
    - uses: actions/checkout@v2
    - uses: realm/ci-actions/mdb-realm/cleanup@v4
      with:
        projectId: ${{ secrets.ATLAS_PROJECT_ID }}
        apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
        privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}
        differentiator: MyTestTarget

```

The action takes the following parameters:

1. *(Required)* `projectId`: the Id of the Atlas project where the cluster will be created.
1. *(Required)* `apiKey`: the public [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Required)* `privateApiKey`: the private [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Required)* `appsPath`: the path where the exported apps are located.
1. *(Required)* `differentiator`: a string to differentiate this deployment from others in the same workflow. This value will be combined with the Github Actions run id to generate a unique string for each run+target combination.
1. *(Optional)* `atlasUrl`: the Atlas URL to deploy against. Default is https://cloud-dev.mongodb.com.
1. *(Optional)* `realmUrl`: the MongoDB Realm URL to deploy against. Default is https://realm-dev.mongodb.com.

The action has the following outputs:

1. `deployedApps`: a base64-encoded json object containing a map from `*folder name*: appId` where `*folder name*` is the name of the folder containing the imported app relative to `appsPath` and `appId` is the id of the newly imported app.