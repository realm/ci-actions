# Atlas Cluster Actions

These actions exposes an API to create and destroy Atlas cluster. It will no-op if the Atlas cluster has already been created or destroyed.

> NOTE: The version of these actions are based on the commit SHA rather than an explicit version.

## deploy

The action will deploy an M5 Atlas cluster. If `clusterName` is specified, the cluster will use that name, otherwise a hashed 8-character name will be generated based on the `github.run_id` and `github.run_attempt`.

## cleanup

This action is meant to be used in conjunction with the `deploy` action.  It can be used to destroy a cluster and any associated apps.  The `clusterName` can be used to specify which cluster will be deleted, otherwise it will use the same strategy as deploy to generate a cluster name based on the `github.run_id` and `github.run_attempt`.

>NOTE: If any job is re-run in your workflow, the `github.run_attempt` will be incremented, resulting in the generated cluster name to change.  Please design your workflow with this in consideration.
## Usage

```yaml
deploy-cluster:
  runs-on: ubuntu-latest
    name: Deploy MDB Realm for MyTestTarget
    outputs:
      atlasUrl: ${{ steps.deploy-cluster.outputs.atlasUrl }}
      realmUrl: ${{ steps.deploy-cluster.outputs.realmUrl }}
      clusterName: ${{ steps.deploy-cluster.outputs.clusterName }}
    steps:
    - uses: actions/checkout@<COMMIT_SHA>
    - uses: realm/ci-actions/mdb-realm/deploy@v4
      id: deploy-cluster
      with:
        projectId: ${{ secrets.ATLAS_PROJECT_ID }}
        apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
        privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}
    - # optional: run a script/app to deploy the applications prior to the actual test run
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
    - uses: realm/ci-actions/mdb-realm/cleanup@<COMMIT_SHA>
      with:
        projectId: ${{ secrets.ATLAS_PROJECT_ID }}
        apiKey: ${{ secrets.ATLAS_PUBLIC_API_KEY }}
        privateApiKey: ${{ secrets.ATLAS_PRIVATE_API_KEY }}

```

Both actions take the following parameters:

1. *(Required)* `projectId`: the Id of the Atlas project where the cluster will be created.
1. *(Required)* `apiKey`: the public [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Required)* `privateApiKey`: the private [Atlas API key](https://docs.atlas.mongodb.com/configure-api-access/).
1. *(Optional)* `atlasUrl`: the Atlas URL to deploy against. Default is https://cloud-qa.mongodb.com.
1. *(Optional)* `realmUrl`: the MongoDB Realm URL to deploy against. Default is https://realm-qa.mongodb.com.
1. *(Optional)* `clusterName`: the name of the cluster that to be created. If it is not set it is auto-generated. The generated name is based on the `github.run_id` and `github.run_attempt`.
1. *(Optional)* `clusterSize`: the size of the cluster to be created. Default is M5.

The `deploy` action has the following outputs:

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
      - uses: realm/ci-actions/mdb-realm/deleteAllClusters@<COMMIT_SHA>
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
