import * as core from "@actions/core";
import { createCluster, getConfig } from "./helpers";

async function run(): Promise<void> {
    const config = getConfig();
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await createCluster(config);
            core.setOutput("clusterName", config.clusterName);
            core.setOutput("atlasUrl", config.atlasUrl);
            core.setOutput("realmUrl", config.realmUrl);

            return;
        } catch (e) {
            core.warning(
                `Attempt #${i}: An error occurred while deploying cluster '${config.clusterName}': ${e}. Retrying...`,
            );
        }
    }

    core.setFailed(`Failed to deploy ${config.clusterName} after ${maxAttempts} attempts.`);
}

// eslint-disable-next-line github/no-then
run().catch(e => {
    core.setFailed(`An unexpected error occurred: ${e.message}\n${e.stack}`);
});

export default run;
