import * as core from "@actions/core";
import { createCluster, getConfig } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();
        for (let i = 0; i < 5; i++) {
            try {
                await createCluster(config);
                core.setOutput("clusterName", config.clusterName);
                core.setOutput("atlasUrl", config.atlasUrl);
                core.setOutput("realmUrl", config.realmUrl);

                return;
            } catch (e) {
                core.warning(`An error occurred while deploying cluster '${config.clusterName}': ${e}. Retrying...`);
            }
        }

        core.setFailed(`Failed to deploy ${config.clusterName} after 5 attempts.`);
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
