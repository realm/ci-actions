import { expect } from "chai";
import "mocha";
import { suite, test, timeout } from "@testdeck/mocha";
import { deleteCluster, getClusters } from "../src/helpers";
import { deployCluster } from "../src/deployApps";
import { EnvironmentConfig } from "../src/config";

@suite
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class helpersTests {
    getConfig(): EnvironmentConfig {
        return {
            apiKey: "set-your-api-key",
            privateApiKey: "set-your-api-key",
            atlasUrl: "https://cloud-qa.mongodb.com",
            projectId: "set-your-project-id",
            clusterName: "",
            realmUrl: "https://realm-qa.mongodb.com",
            useExistingCluster: true,
        };
    }

    @test.skip
    exampleTest(): void {
        expect(true).to.be.true;
    }

    @test.skip
    @timeout(60000)
    async getAllClusters(): Promise<void> {
        const config = this.getConfig();
        const result = await getClusters(config);
        expect(result).to.not.be.empty;
    }

    @test.skip
    @timeout(30000)
    async deleteAllClusters(): Promise<void> {
        const config = this.getConfig();
        const result = await getClusters(config);
        expect(result).to.not.be.empty;

        for (const cluster of result) {
            await deleteCluster(config, cluster);
        }
    }

    @test.skip
    @timeout(60000)
    async deployClusterIfMissing(): Promise<void> {
        const config = this.getConfig();
        const result = await deployCluster(config, "");
        expect(result).to.not.be.empty;
    }
}
