import { expect } from "chai";
import { parseReleaseTag } from "../src/helpers";

describe("parseReleaseTag", () => {
    it("should parse a valid release tag", () => {
        const releaseTag = "my-package-v1.0.0";
        const parsedReleaseTag = parseReleaseTag(releaseTag);
        console.log(parsedReleaseTag);
        expect(parsedReleaseTag).deep.equal({
            packageName: "my-package",
            packageVersion: "1.0.0",
            packageVersionSuffix: undefined,
            prerelease: false,
        });

        const prereleaseReleaseTag = "my-package-v1.0.0-alpha.1";
        const parsedPrereleaseReleaseTag = parseReleaseTag(prereleaseReleaseTag);
        expect(parsedPrereleaseReleaseTag).deep.equal({
            packageName: "my-package",
            packageVersion: "1.0.0-alpha.1",
            packageVersionSuffix: "-alpha.1",
            prerelease: true,
        });

        const releaseTagWithoutPackage = "v1.0.0";
        const parsedReleaseTagWithoutPackage = parseReleaseTag(releaseTagWithoutPackage);
        expect(parsedReleaseTagWithoutPackage).deep.equal({
            packageName: undefined,
            packageVersion: "1.0.0",
            packageVersionSuffix: undefined,
            prerelease: false,
        });

        const releaseTagWithoutPackageWithSuffix = "v1.0.0-alpha.1";
        const parsedReleaseTagWithoutPackageWithSuffix = parseReleaseTag(releaseTagWithoutPackageWithSuffix);
        expect(parsedReleaseTagWithoutPackageWithSuffix).deep.equal({
            packageName: undefined,
            packageVersion: "1.0.0-alpha.1",
            packageVersionSuffix: "-alpha.1",
            prerelease: true,
        });
    });
    it("should throw an error when given an invalid release tag", () => {
        const releaseTag = "my-package-1.0.0";
        expect(() => parseReleaseTag(releaseTag)).to.throw("Invalid release tag: my-package-1.0.0");
    });
});
