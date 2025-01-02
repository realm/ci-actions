import * as core from "@actions/core";
import { parseReleaseTag } from "./helpers";

async function run(): Promise<void> {
    try {
        const releaseTag = core.getInput("release-tag");
        const parsedReleaseTag = parseReleaseTag(releaseTag);

        core.setOutput("package-name", parsedReleaseTag.packageName);
        core.setOutput("package-version", parsedReleaseTag.packageVersion);
        core.setOutput("package-version-suffix", parsedReleaseTag.packageVersionSuffix);
        core.setOutput("prerelease", parsedReleaseTag.prerelease);
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

run();
