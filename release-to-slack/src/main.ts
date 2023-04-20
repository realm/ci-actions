import * as core from "@actions/core";
import * as github from "@actions/github";
import * as http from "@actions/http-client";

import * as fs from "fs";
import { getPayload, getFallbackPayload } from "./helpers";

async function run(): Promise<void> {
    try {
        const changelogPath = core.getInput("changelog");
        if (!fs.existsSync(changelogPath)) {
            throw new Error(`File ${changelogPath} doesn't exist.`);
        }

        const sdk = core.getInput("sdk");
        const webhookUrl = core.getInput("webhook-url");
        const version = core.getInput("version");

        const repoUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}`;

        const result = getPayload(fs.readFileSync(changelogPath, { encoding: "utf8" }), sdk, repoUrl, version);

        const client = new http.HttpClient();
        try {
            await client.postJson(webhookUrl, result);
        } catch (blocksErr: any) {
            core.warning(`Failed to post to Slack: ${blocksErr.message}`);

            await client.postJson(webhookUrl, getFallbackPayload(sdk, repoUrl, version));
        }
    } catch (error: any) {
        core.setFailed(`${error.message}: ${error.stack}`);
    }
}

run();
