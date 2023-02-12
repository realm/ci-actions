import * as core from "@actions/core";
import * as urllib from "urllib";
import { EnvironmentConfig } from "./config";
import { createHash } from "crypto";

function generateClusterName(): string {
    return createHash("md5")
        .update(`${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`)
        .digest("base64")
        .replace(/\+/g, "")
        .replace(/\//g, "")
        .toLowerCase()
        .substring(0, 8);
}

export function getConfig(): EnvironmentConfig {
    return {
        projectId: core.getInput("projectId", { required: true }),
        apiKey: core.getInput("apiKey", { required: true }),
        privateApiKey: core.getInput("privateApiKey", { required: true }),
        realmUrl: core.getInput("realmUrl", { required: false }) || "https://realm-qa.mongodb.com",
        atlasUrl: core.getInput("atlasUrl", { required: false }) || "https://cloud-qa.mongodb.com",
        clusterName: core.getInput("clusterName", { required: false }) || generateClusterName(),
        clusterSize: core.getInput("clusterSize", { required: false }) || "M5",
    };
}

export async function createCluster(config: EnvironmentConfig): Promise<void> {
    const clusters = await getClusters(config);
    if (clusters.includes(config.clusterName)) {
        core.info(`Skipping creation of cluster '${config.clusterName}' because it already exists`);
        return;
    }

    let providerSettings;
    if (Number(config.clusterSize.substring(1)) < 10) {
        providerSettings = {
            instanceSizeName: config.clusterSize,
            providerName: "TENANT",
            regionName: "US_EAST_1",
            backingProviderName: "AWS",
        };
    } else {
        providerSettings = {
            instanceSizeName: config.clusterSize,
            providerName: "AWS",
            regionName: "US_EAST_1",
        };
    }

    const payload = {
        name: config.clusterName,
        providerSettings,
    };

    core.info(`Creating ${config.clusterSize} cluster: ${config.clusterName}`);

    const response = await execAtlasRequest("POST", "clusters", config, payload);

    core.info(`Cluster created: ${JSON.stringify(response)}`);

    await waitForClusterDeployment(config);
}

export async function getClusters(config: EnvironmentConfig): Promise<string[]> {
    const response = await execAtlasRequest("GET", "clusters", config);
    return response.results.map((c: any) => c.name);
}

export async function deleteCluster(config: EnvironmentConfig, clusterName?: string): Promise<void> {
    clusterName = clusterName || config.clusterName;
    core.info(`Deleting Atlas cluster: ${clusterName}`);

    await execAtlasRequest("DELETE", `clusters/${clusterName}`, config);

    core.info(`Deleted Atlas cluster: ${clusterName}`);
}

async function waitForClusterDeployment(config: EnvironmentConfig): Promise<void> {
    const pollDelay = 5;
    let attempt = 0;
    while (attempt++ < 200) {
        try {
            const response = await execAtlasRequest("GET", `clusters/${config.clusterName}`, config);

            if (response.stateName === "IDLE") {
                return;
            }

            core.info(
                `Cluster state is: ${response.stateName} after ${
                    attempt * pollDelay
                } seconds. Waiting ${pollDelay} seconds for IDLE`,
            );
        } catch (error: any) {
            core.info(`Failed to check cluster status: ${error.message}`);
        }

        await delay(pollDelay * 1000);
    }

    throw new Error(`Cluster failed to deploy after ${100 * pollDelay} seconds`);
}

type App = {
    _id: string;
    name: string;
    client_app_id: string;
    last_used: number;
    // and more ...
};

/**
 * @see https://www.mongodb.com/docs/atlas/app-services/admin/api/v3/#tag/apps/operation/adminListApplications
 */
async function listApps(config: EnvironmentConfig): Promise<App[]> {
    const accessToken = await authenticate(config);
    return await execRealmRequest("GET", "apps", accessToken, config);
}

export async function deleteApps(config: EnvironmentConfig, filter: (app: App) => boolean): Promise<void> {
    const accessToken = await authenticate(config);

    const apps = await listApps(config);
    const appsToDelete = apps.filter(filter);

    for (const app of appsToDelete) {
        try {
            core.info(`Deleting ${app.name}`);
            await execRealmRequest("DELETE", `apps/${app._id}`, accessToken, config);
            core.info(`Deleted ${app.name}`);
        } catch (error: any) {
            core.warning(`Failed to delete ${app.name}: ${error.message}`);
        }
    }
}

async function execRequest(
    url: string,
    method: urllib.HttpMethod,
    payload?: any,
    digestAuth?: string,
    headers: urllib.IncomingHttpHeaders = {},
): Promise<any> {
    const request: urllib.RequestOptions = {
        digestAuth,
        method,
        timeout: 60000,
        headers: {
            "content-type": "application/json",
            accept: "application/json",
            ...headers,
        },
    };

    if (payload) {
        request.data = JSON.stringify(payload);
    }

    const response = await urllib.request(url, request);

    if (response.status < 200 || response.status > 300) {
        throw new Error(`Failed to execute ${request.method} ${url}: ${response.status}: ${response.data}`);
    }

    try {
        return JSON.parse(response.data);
    } catch {
        return {};
    }
}

async function execAtlasRequest(
    method: urllib.HttpMethod,
    route: string,
    config: EnvironmentConfig,
    payload?: any,
): Promise<any> {
    const url = `${config.atlasUrl}/api/atlas/v1.0/groups/${config.projectId}/${route}`;

    const digestAuth = `${config.apiKey}:${config.privateApiKey}`;
    return execRequest(url, method, payload, digestAuth);
}

async function authenticate(config: EnvironmentConfig): Promise<string> {
    const url = `${config.realmUrl}/api/admin/v3.0/auth/providers/mongodb-cloud/login`;
    const payload = { username: config.apiKey, apiKey: config.privateApiKey };
    const response = await execRequest(url, "POST", payload);

    return response.access_token;
}

async function execRealmRequest(
    method: urllib.HttpMethod,
    route: string,
    accessToken: string,
    config: EnvironmentConfig,
    payload?: any,
): Promise<any> {
    const url = `${config.realmUrl}/api/admin/v3.0/groups/${config.projectId}/${route}`;

    return execRequest(url, method, payload, undefined, {
        Authorization: `Bearer ${accessToken}`,
    });
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
