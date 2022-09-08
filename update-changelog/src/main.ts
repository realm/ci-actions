import * as core from "@actions/core";
import * as fs from "fs";
import { updateChangelogContent } from "./helpers";

async function run(): Promise<void> {
    try {
        const changelogPath = core.getInput("changelog");
        if (!fs.existsSync(changelogPath)) {
            throw new Error(`File ${changelogPath} doesn't exist.`);
        }

        const versionOverride = core.getInput("version", { required: false });
        if (versionOverride) {
            core.info(`Creating a new version '${versionOverride}' (overridden)`);
        }

        const versionSuffix = core.getInput("version-suffix", { required: false });
        if (versionSuffix) {
            core.info(`Creating a new version with suffix '${versionSuffix}'`);
        }

        const result = await updateChangelogContent(changelogPath, versionSuffix);
        core.setOutput("new-version", result.newVersion);
        core.info(`Inferred version: ${result.newVersion}`);

        const latestVersionChangelog = core.getInput("latest-version-changelog");
        if (latestVersionChangelog) {
            await fs.promises.writeFile(latestVersionChangelog, result.latestVersionChanges);
        }
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();
