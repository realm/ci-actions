import { expect } from "chai";
import "mocha";
import { suite, test, timeout } from "@testdeck/mocha";
import { createCluster, deleteCluster, getClusters, deleteApps } from "../src/helpers";
import { EnvironmentConfig } from "../src/config";

@suite
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class helpersTests {
    getConfig(): EnvironmentConfig {
        return {
            apiKey: "set-your-api-key",
            privateApiKey: "set-your-api-key",
            projectId: "set-your-project-id",
            clusterName: "Cluster1",
            atlasUrl: "https://cloud-qa.mongodb.com",
            realmUrl: "https://realm-qa.mongodb.com",
            clusterSize: "M5",
        };
    }

    @test.skip
    @timeout(60000)
    async deploy(): Promise<void> {
        const config = this.getConfig();
        await createCluster(config);
    }

    @test.skip
    @timeout(60000)
    async cleanup(): Promise<void> {
        const config = this.getConfig();

        await deleteApps(config);

        await deleteCluster(config);
    }

    @test.skip
    @timeout(60000)
    async getAllClusters(): Promise<void> {
        const config = this.getConfig();
        const result = await getClusters(config);
        expect(result).to.not.be.empty;
    }

    @test.skip
    @timeout(60000)
    async deleteAllApps(): Promise<void> {
        const config = this.getConfig();
        await deleteApps(config, true);
    }

    @test.skip
    @timeout(60000)
    async deleteAllClusters(): Promise<void> {
        const config = this.getConfig();
        const result = await getClusters(config);
        expect(result).to.not.be.empty;

        for (const cluster of result) {
            await deleteCluster(config, cluster);
        }
    }
}
