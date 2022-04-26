import * as semver from "semver";
import moment from "moment";
import * as fs from "fs";

const changelogRegex = /^## (?<currentVersion>[^\n]*)[^#]*(?<sections>.*?)\n## (?<prevVersion>[^ ]*)/gms;
const sectionsRegex = /### (?<sectionName>[^\n]*)(?<sectionContent>[^#]*)/gm;

export function processChangelog(changelog: string): { updatedChangelog: string; newVersion: string } {
    changelogRegex.lastIndex = 0;
    sectionsRegex.lastIndex = 0;

    const changelogMatch = changelogRegex.exec(changelog);
    if (!changelogMatch || !changelogMatch.groups) {
        throw new Error(`Failed to match changelog: ${changelog}`);
    }

    const prevVersion = changelogMatch.groups["prevVersion"];
    let newVersion = prevVersion;

    const parsedPrevVersion = semver.parse(prevVersion);
    if (!parsedPrevVersion) {
        throw new Error(`Failed to parse previous version: ${prevVersion}`);
    }
    if (parsedPrevVersion.prerelease.length) {
        newVersion = semver.inc(prevVersion, "prerelease")!;
    } else {
        let sectionMatch: RegExpExecArray | null;
        while ((sectionMatch = sectionsRegex.exec(changelogMatch.groups["sections"]))) {
            if (!sectionMatch.groups) {
                throw new Error(`Failed to match sections: ${changelogMatch.groups["sections"]}`);
            }

            if (!hasActualChanges(sectionMatch.groups["sectionContent"])) {
                // If the section doesn't have changes - i.e. it contains `* None`, remove it altogether
                changelog = changelog.replace(sectionMatch[0], "");
                continue;
            }

            const inferredNewVersion = getNextVersion(prevVersion, sectionMatch.groups["sectionName"]);
            if (inferredNewVersion && semver.gt(inferredNewVersion, newVersion)) {
                newVersion = inferredNewVersion;
            }
        }
    }

    const versionToReplace = changelogMatch.groups["currentVersion"];
    const todaysDate = moment().format("YYYY-MM-DD");
    changelog = changelog.replace(`## ${versionToReplace}\n`, `## ${newVersion} (${todaysDate})\n`);
    return {
        updatedChangelog: changelog,
        newVersion,
    };
}

export async function updateChangelogContent(path: string): Promise<{ newVersion: string }> {
    const changelog = await fs.promises.readFile(path, { encoding: "utf-8" });

    const changelogUpdate = processChangelog(changelog);
    await fs.promises.writeFile(path, changelogUpdate.updatedChangelog, { encoding: "utf-8" });

    return {
        newVersion: changelogUpdate.newVersion,
    };
}

function hasActualChanges(content: string): boolean {
    return content.includes("*") && !content.includes("* None\n");
}

function getNextVersion(prevVersion: string, sectionName: string): string | undefined {
    switch (sectionName) {
        case "Fixed":
            return semver.inc(prevVersion, "patch")!;
        case "Enhancements":
            return semver.inc(prevVersion, "minor")!;
        case "Breaking Changes":
            // Breaking changes don't need incrementing major version when we're pre-v1.
            if (semver.parse(prevVersion)!.major === 0) {
                return semver.inc(prevVersion, "minor")!;
            }
            return semver.inc(prevVersion, "major")!;
        default:
            return undefined;
    }
}
