import * as semver from "semver";
import moment from "moment";
import * as fs from "fs";

const changelogRegex = /^## (?<currentVersion>[^\n]*)[^#]*(?<sections>.*?)\n## (?<prevVersion>[^ ]*)/gms;
const sectionsRegex = /### (?<sectionName>[^\n]*)(?<sectionContent>[^#]*)/gm;

type ChangelogMatchGroups = { currentVersion: string; sections: string; prevVersion: string };
type SectionMatchGroups = { sectionName: string; sectionContent: string };
type SectionMatch = RegExpExecArray & { groups: SectionMatchGroups };

function matchChangelog(changelog: string): ChangelogMatchGroups {
    changelogRegex.lastIndex = 0;
    const match = changelogRegex.exec(changelog);
    if (!match || !match.groups) {
        throw new Error(`Failed to match changelog: ${changelog}`);
    }
    return match.groups as ChangelogMatchGroups;
}

function matchSections(sections: string): SectionMatch | null {
    const match = sectionsRegex.exec(sections);
    if (match && match.groups) {
        return match as SectionMatch;
    } else if (match) {
        throw new Error(`Failed to match sections: ${sections}`);
    } else {
        return null;
    }
}

export function suggestNewVersion(changelog: string, versionSuffix = ""): string {
    const { prevVersion, sections } = matchChangelog(changelog);

    const parsedPrevVersion = semver.parse(prevVersion);
    if (!parsedPrevVersion) {
        throw new Error(`Failed to parse previous version: ${prevVersion}`);
    }

    if (parsedPrevVersion.prerelease.length) {
        const nextPrereleaseVersion = semver.inc(prevVersion, "prerelease");
        if (nextPrereleaseVersion) {
            return nextPrereleaseVersion;
        }
    }

    let newVersion = prevVersion;
    let sectionMatch: SectionMatch | null;
    sectionsRegex.lastIndex = 0;
    while ((sectionMatch = matchSections(sections))) {
        if (!hasActualChanges(sectionMatch.groups.sectionContent)) {
            continue;
        }

        const inferredNewVersion = getNextVersion(prevVersion, sectionMatch.groups.sectionName);
        if (inferredNewVersion && semver.gt(inferredNewVersion, newVersion)) {
            newVersion = inferredNewVersion;
        }
    }

    return newVersion + versionSuffix;
}

export function processChangelog(
    changelog: string,
    versionSuffix?: string,
    versionOverride?: string,
): { updatedChangelog: string; newVersion: string; latestVersionChanges: string } {
    const newVersion = versionOverride ? versionOverride : suggestNewVersion(changelog, versionSuffix);
    const { sections, currentVersion, prevVersion } = matchChangelog(changelog);

    sectionsRegex.lastIndex = 0;
    let sectionMatch: SectionMatch | null;
    while ((sectionMatch = matchSections(sections))) {
        if (!hasActualChanges(sectionMatch.groups.sectionContent)) {
            // If the section doesn't have changes - i.e. it contains `* None`, remove it altogether
            changelog = changelog.replace(sectionMatch[0], "");
            continue;
        }
    }

    const versionToReplace = currentVersion;
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
    versionOverride?: string,
): Promise<{ newVersion: string; latestVersionChanges: string }> {
    const changelog = await fs.promises.readFile(path, { encoding: "utf-8" });

    const changelogUpdate = processChangelog(changelog, versionSuffix, versionOverride);
    await fs.promises.writeFile(path, changelogUpdate.updatedChangelog, { encoding: "utf-8" });

    return {
        newVersion: changelogUpdate.newVersion,
        latestVersionChanges: changelogUpdate.latestVersionChanges,
    };
}

function hasActualChanges(content: string): boolean {
    return content.includes("*") && !(content.includes("* None\n") || content.includes("* None.\n"));
}

function getNextVersion(prevVersion: string, sectionName: string): string | null {
    switch (sectionName) {
        case "Fixed":
            return semver.inc(prevVersion, "patch");
        case "Enhancements":
            return semver.inc(prevVersion, "minor");
        case "Breaking Changes": {
            // Breaking changes don't need incrementing major version when we're pre-v1.
            const parsedPrevVersion = semver.parse(prevVersion);
            if (parsedPrevVersion && parsedPrevVersion.major === 0) {
                return semver.inc(prevVersion, "minor");
            }
            return semver.inc(prevVersion, "major");
        }
        default:
            return null;
    }
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
