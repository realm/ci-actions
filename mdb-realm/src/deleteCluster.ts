import * as core from "@actions/core";
import { configureRealmCli, deleteCluster, getConfig } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig(/* requireDifferentiator */ false);

        await configureRealmCli(config);
        await deleteCluster(config, config.clusterName);
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
