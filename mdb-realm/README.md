# Deploy MDB Realm apps

This action exposes an API to create an Atlas cluster and then import previously exported MDB Realm applications.

## deploy

The main action will deploy an M5 Atlas cluster and then import one or several MDB Realm applications using `realm-cli`.

## Usage

```yaml
deploy-cluster:
  runs-on: ubuntu-latest
    name: Deploy MDB Realm for MyTestTarget
    outputs:
      atlasUrl: ${{ steps.deploy-mdb-apps.outputs.atlasUrl }}
      realmUrl: ${{ steps.deploy-mdb-apps.outputs.realmUrl }}
      clusterName: ${{ steps.deploy-mdb-apps.outputs.clusterName }}
    steps:
    - uses: actions/checkout@v2
    - uses: realm/ci-actions/mdb-realm/deploy@v4
      id: deploy-mdb-apps
      with:
        projectId: ${{ secrets.ATLAS_PROJECT_ID }}
        apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
        privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}
# this is your existing test
run-my-test-target:
  runs-on: ubuntu-latest
  name: Run tests against BaaS
  needs:
    - deploy-cluster
  steps:
    - # test step 1
    - # test step 2
    - run: ./test.sh --clusterName ${{ needs.deploy-cluster.outputs.clusterName }} --realmUrl ${{ needs.deploy-cluster.outputs.realmUrl }}
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

```

The action takes the following parameters:

1. *(Required)* `projectId`: the Id of the Atlas project where the cluster will be created.
1. *(Required)* `apiKey`: the public [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Required)* `privateApiKey`: the private [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Optional)* `atlasUrl`: the Atlas URL to deploy against. Default is https://cloud-qa.mongodb.com.
1. *(Optional)* `realmUrl`: the MongoDB Realm URL to deploy against. Default is https://realm-qa.mongodb.com.
1. *(Optional)* `clusterName`: the name of the cluster that to be created. If it is not set it is auto-generated.

The action has the following outputs:

1. `clusterName`: the name of the Atlas cluster created.
1. `atlasUrl`: the Atlas Url where the cluster was created (same as the `atlasUrl` input).
1. `realmUrl`: the Realm Url where the cluster was created (same as the `realmUrl` input).

## deleteAllClusters

Deletes all apps and clusters from a project. Use this only as a manual cleanup action as it may mess up existing jobs that are using the clusters.

## Usage

```yaml
name: Wipe all clusters

on:
  workflow_dispatch:
jobs:
  wipe-all-clusters:
    runs-on: ubuntu-latest
      name: Wipe all clusters and apps
      steps:
      - uses: realm/ci-actions/mdb-realm/deleteAllClusters@v5
        with:
          projectId: ${{ secrets.ATLAS_PROJECT_ID }}
          apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
          privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}
```

The action takes the following parameters:

1. *(Required)* `projectId`: the Id of the Atlas project where the cluster will be created.
1. *(Required)* `apiKey`: the public [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Required)* `privateApiKey`: the private [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Optional)* `atlasUrl`: the Atlas URL to deploy against. Default is https://cloud-dev.mongodb.com.
1. *(Optional)* `realmUrl`: the MongoDB Realm URL to deploy against. Default is https://realm-dev.mongodb.com.
