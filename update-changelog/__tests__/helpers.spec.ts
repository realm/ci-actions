import { expect } from "chai";
import "mocha";
import { suite, params, test } from "@testdeck/mocha";
import { processChangelog, updateChangelogContent } from "../src/helpers";
import moment from "moment";
import * as fs from "fs";
import * as tmp from "tmp";

const expectedPatchLatest = `
## *replace-me*

### Fixed
* Something important was fixed

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const patchBumpChangelog = `
## vNext (TBD)

### Fixed
* Something important was fixed

### Enhancements
* None

### Compatibility
* Foo bar

### Internal
* This is super internal

## 1.2.3 (2021-07-07)

### Fixed
* Something

### Enhancements
* Something else

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const expectedMinorLatest = `
## *replace-me*

### Fixed
* Something important was fixed

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const minorBumpChangelog = `
## vNext (TBD)

### Breaking Changes
* None

### Fixed
* Something important was fixed

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal

## 10.2.1 (2021-01-07)

### Fixed
* Something

### Enhancements
* Something else

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const expectedMajorLatest = `
## *replace-me*

### Breaking Changes
* Broke some API

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const majorBumpChangelog = `
## vNext (TBD)

### Breaking Changes
* Broke some API

### Fixed
* None

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal

## 10.2.1 (2021-01-07)

### Fixed
* Something

### Enhancements
* Something else

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const expectedPreReleaseLatest = `
## *replace-me*

### Breaking Changes
* Broke some API

### Fixed
* Fixed some stuff

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const preReleaseChangelog = `
## vNext (TBD)

### Breaking Changes
* Broke some API

### Fixed
* Fixed some stuff

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal

## 3.0.0-beta.2 (2019-02-03)

### Fixed
* Something

### Enhancements
* Something else

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const expectedPreV1Latest = `
## *replace-me*

### Breaking Changes
* Broke some API

### Fixed
* Fixed some stuff

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal`;

const preV1Changelog = `
## vNext (TBD)

### Breaking Changes
* Broke some API

### Fixed
* Fixed some stuff

### Enhancements
* This added an amazing enhancmement

### Compatibility
* Foo bar

### Internal
* This is super internal

## 0.2.1+alpha (2019-02-03)

### Breaking Changes
* Breaking changes are fine pre-v1

### Fixed
* Something

### Enhancements
* Something else

### Compatibility
* Foo bar

### Internal
* This is super internal`;

@suite
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class helpersTests {
    @params(
        { input: patchBumpChangelog, expectedVersion: "1.2.4", expectedChanges: expectedPatchLatest },
        "processor: patch",
    )
    @params(
        { input: minorBumpChangelog, expectedVersion: "10.3.0", expectedChanges: expectedMinorLatest },
        "processor: minor",
    )
    @params(
        { input: majorBumpChangelog, expectedVersion: "11.0.0", expectedChanges: expectedMajorLatest },
        "processor: major",
    )
    @params(
        { input: preReleaseChangelog, expectedVersion: "3.0.0-beta.3", expectedChanges: expectedPreReleaseLatest },
        "processor: pre",
    )
    @params(
        { input: preV1Changelog, expectedVersion: "0.3.0", expectedChanges: expectedPreV1Latest },
        "processor: prev1",
    )
    testChangelogProcessor(args: { input: string; expectedVersion: string; expectedChanges: string }): void {
        const result = processChangelog(args.input);
        expect(result.newVersion).to.equal(args.expectedVersion);

        this.validateExpectedChanges(result.latestVersionChanges, args.expectedChanges, args.expectedVersion);
        this.validateUpdatedChangelogContents(result.updatedChangelog, args.expectedVersion);
    }

    @params(
        { input: patchBumpChangelog, expectedVersion: "1.2.4", expectedChanges: expectedPatchLatest },
        "processor: patch",
    )
    @params(
        { input: minorBumpChangelog, expectedVersion: "10.3.0", expectedChanges: expectedMinorLatest },
        "processor: minor",
    )
    @params(
        { input: majorBumpChangelog, expectedVersion: "11.0.0", expectedChanges: expectedMajorLatest },
        "processor: major",
    )
    @params(
        { input: preReleaseChangelog, expectedVersion: "3.0.0-beta.3", expectedChanges: expectedPreReleaseLatest },
        "processor: pre",
    )
    @params(
        { input: preV1Changelog, expectedVersion: "0.3.0", expectedChanges: expectedPreV1Latest },
        "processor: prev1",
    )
    async testChangelogUpdater(args: {
        input: string;
        expectedVersion: string;
        expectedChanges: string;
    }): Promise<void> {
        const tempFile = tmp.tmpNameSync();
        try {
            await fs.promises.writeFile(tempFile, args.input);
            const result = await updateChangelogContent(tempFile);

            expect(result.newVersion).to.equal(args.expectedVersion);
            this.validateExpectedChanges(result.latestVersionChanges, args.expectedChanges, args.expectedVersion);

            const changelog = await fs.promises.readFile(tempFile, { encoding: "utf-8" });
            this.validateUpdatedChangelogContents(changelog, args.expectedVersion);
        } finally {
            await fs.promises.unlink(tempFile);
        }
    }

    @test
    testChangelogProcessorWithSuffix(): void {
        const result = processChangelog(minorBumpChangelog, "+alpha");
        expect(result.newVersion).to.equal("10.3.0+alpha");

        this.validateUpdatedChangelogContents(result.updatedChangelog, "10.3.0+alpha");
    }

    @test
    async testChangelogUpdaterWithSuffix(): Promise<void> {
        const tempFile = tmp.tmpNameSync();
        try {
            await fs.promises.writeFile(tempFile, minorBumpChangelog);
            const result = await updateChangelogContent(tempFile, "+alpha");

            expect(result.newVersion).to.equal("10.3.0+alpha");

            const changelog = await fs.promises.readFile(tempFile, { encoding: "utf-8" });
            this.validateUpdatedChangelogContents(changelog, "10.3.0+alpha");
        } finally {
            await fs.promises.unlink(tempFile);
        }
    }

    @test
    async testChangelogUpdaterWithOverride(): Promise<void> {
        const tempFile = tmp.tmpNameSync();
        try {
            await fs.promises.writeFile(tempFile, minorBumpChangelog);
            const result = await updateChangelogContent(tempFile, undefined, "1.2.3-rc.1337");

            expect(result.newVersion).to.equal("1.2.3-rc.1337");

            const changelog = await fs.promises.readFile(tempFile, { encoding: "utf-8" });
            this.validateUpdatedChangelogContents(changelog, "1.2.3-rc.1337");
        } finally {
            await fs.promises.unlink(tempFile);
        }
    }

    validateUpdatedChangelogContents(changelog: string, expectedVersion: string): void {
        expect(changelog).to.contain(`${this.getExpectedHeader(expectedVersion)}\n`);

        expect(changelog).not.to.contain("* None\n");
    }

    getExpectedHeader(expectedVersion: string): string {
        const todaysDate = moment();
        const year = todaysDate.year().toString().padStart(4, "0");
        const month = (todaysDate.month() + 1).toString().padStart(2, "0");
        const day = todaysDate.date().toString().padStart(2, "0");

        return `## ${expectedVersion} (${year}-${month}-${day})`;
    }

    validateExpectedChanges(actual: string, expectedChanges: string, expectedVersion: string): void {
        const expectedHeader = this.getExpectedHeader(expectedVersion);
        expectedChanges = expectedChanges.trim().replace("## *replace-me*", expectedHeader);

        expect(actual).to.equal(expectedChanges);
    }
}
