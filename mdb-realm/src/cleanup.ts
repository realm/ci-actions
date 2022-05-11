import * as core from "@actions/core";
import { configureRealmCli, deleteApplications, deleteCluster, getConfig } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();

        try {
            await configureRealmCli(config);
            await deleteApplications(config);
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
