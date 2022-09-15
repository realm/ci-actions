import * as core from "@actions/core";
import { deleteApplications, deleteCluster, getConfig, getClusters } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();

        try {
            await deleteApplications(config, /* deleteAll */ true);
        } catch (error: any) {
            core.warning(`Failed to delete applications: ${error.message}`);
        }

        const clusters = await getClusters(config);
        for (const cluster of clusters) {
            try {
                await deleteCluster(config, cluster);
            } catch (error: any) {
                core.warning(`Failed to delete cluster ${cluster}: ${error.message}\n${error.stack}`);
            }
        }
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
