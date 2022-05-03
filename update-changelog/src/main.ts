import * as core from "@actions/core";
import * as fs from "fs";
import { updateChangelogContent } from "./helpers";

async function run(): Promise<void> {
    try {
        const changelogPath = core.getInput("changelog");
        if (!fs.existsSync(changelogPath)) {
            throw new Error(`File ${changelogPath} doesn't exist.`);
        }

        const versionSuffix = core.getInput("versionSuffix", { required: false });

        const result = await updateChangelogContent(changelogPath, versionSuffix);
        core.setOutput("new-version", result.newVersion);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
