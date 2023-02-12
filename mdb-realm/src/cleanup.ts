import * as core from "@actions/core";
import { deleteApps, deleteCluster, getConfig } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();

        try {
            await deleteApps(config, app => app.name.includes(config.clusterName));
        } catch (error: any) {
            core.warning(`Failed to delete applications: ${error.message}`);
        }

        await deleteCluster(config);
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
