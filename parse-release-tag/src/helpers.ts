type ParsedReleaseTag = {
    packageName: string;
    packageVersion: string;
    packageVersionSuffix: string;
    prerelease: boolean;
};

export function parseReleaseTag(releaseTag: string): ParsedReleaseTag {
    const releaseTagRegex = /(([a-zA-Z-]*[a-zA-Z])-)?v([0-9]+\.[0-9]+\.[0-9])+(-\S+)?/;
    const result = releaseTagRegex.exec(releaseTag);
    if (!result) {
        throw new Error(`Invalid release tag: ${releaseTag}`);
    }
    const packageName = result[2];
    const packageVersion = result[3];
    const packageVersionSuffix = result[4];

    return {
        packageName,
        packageVersion,
        packageVersionSuffix,
        prerelease: packageVersionSuffix !== undefined,
    };
}
