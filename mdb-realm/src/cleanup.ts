import * as core from "@actions/core";
import { deleteApps, deleteCluster, getConfig, getClusters } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();

        try {
            await deleteApps(config);
        } catch (error: any) {
            core.warning(`Failed to delete applications: ${error.message}`);
        }

        // If a cluster name was specified, delete that cluster
        if (core.getInput("clusterName", { required: false })) {
            await deleteCluster(config);
        } else {
            // Otherwise, delete all clusters
            const clusters = await getClusters(config);
            for (const cluster of clusters) {
                try {
                    await deleteCluster(config, cluster);
                } catch (error: any) {
                    core.warning(`Failed to delete cluster ${cluster}: ${error.message}\n${error.stack}`);
                }
            }
        }
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
