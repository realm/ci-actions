import * as core from "@actions/core";
import * as fs from "fs";
import { updateChangelogContent } from "./helpers";

async function run(): Promise<void> {
    try {
        const changelogPath = core.getInput("changelog");
        if (!fs.existsSync(changelogPath)) {
            throw new Error(`File ${changelogPath} doesn't exist.`);
        }

        const versionSuffix = core.getInput("version-suffix", { required: false });

        const result = await updateChangelogContent(changelogPath, versionSuffix);
        core.setOutput("new-version", result.newVersion);
        core.setOutput("lastest-version-changes", result.latestVersionChanges);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
