import * as core from "@actions/core";
import { deleteApps, getConfig } from "./helpers";

async function run(): Promise<void> {
    try {
        const config = getConfig();

        try {
            const now = Date.now();
            // The `last_used` on app is unix time in seconds
            const oneHourAgo = (now - 60 * 60 * 1000) / 1000;
            await deleteApps(config, app => {
                return app.last_used < oneHourAgo;
            });
        } catch (error: any) {
            core.warning(`Failed to delete applications: ${error.message}`);
        }
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();

export default run;
