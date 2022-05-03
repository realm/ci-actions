import * as semver from "semver";
import moment from "moment";
import * as fs from "fs";

const changelogRegex = /^## (?<currentVersion>[^\n]*)[^#]*(?<sections>.*?)\n## (?<prevVersion>[^ ]*)/gms;
const sectionsRegex = /### (?<sectionName>[^\n]*)(?<sectionContent>[^#]*)/gm;

export function processChangelog(
    changelog: string,
    versionSuffix?: string,
): { updatedChangelog: string; newVersion: string; latestVersionChanges: string } {
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

    newVersion = `${newVersion}${versionSuffix || ""}`;

    const versionToReplace = changelogMatch.groups["currentVersion"];
    const todaysDate = moment().format("YYYY-MM-DD");
    changelog = changelog.replace(`## ${versionToReplace}\n`, `## ${newVersion} (${todaysDate})\n`);

    const latestVersionPattern = `^(?<latestVersionChanges>.+?)(?=\n## ${escapeRegExp(prevVersion)})`;
    const latestVersionRegex = new RegExp(latestVersionPattern, "gms");
    const latestVersionMatch = latestVersionRegex.exec(changelog);
    if (!latestVersionMatch || !latestVersionMatch.groups) {
        throw new Error(
            `Failed to match latest version section. Regex: "${latestVersionPattern}", changelog: ${changelog}`,
        );
    }

    return {
        updatedChangelog: changelog,
        newVersion,
        latestVersionChanges: latestVersionMatch.groups["latestVersionChanges"].trim(),
    };
}

export async function updateChangelogContent(
    path: string,
    versionSuffix?: string,
): Promise<{ newVersion: string; latestVersionChanges: string }> {
    const changelog = await fs.promises.readFile(path, { encoding: "utf-8" });

    const changelogUpdate = processChangelog(changelog, versionSuffix);
    await fs.promises.writeFile(path, changelogUpdate.updatedChangelog, { encoding: "utf-8" });

    return {
        newVersion: changelogUpdate.newVersion,
        latestVersionChanges: changelogUpdate.latestVersionChanges,
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

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
