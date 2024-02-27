import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { v4 as uuidv4 } from "uuid";
import * as semver from "semver";

async function run(): Promise<void> {
    const id = uuidv4();

    try {
        const appPath = core.getInput("appPath", { required: true });
        const bundleId = core.getInput("bundleId", { required: true });
        const iphoneToSimulate = core.getInput("iphoneToSimulate", { required: false });
        const args = core.getInput("arguments", { required: false });
        const os = core.getInput("os", { required: false }) || "iOS";

        const runtimes = await execCmd("xcrun simctl list runtimes");

        const newestRuntime = getNewestRuntime(runtimes, os);

        try {
            await execCmd(
                `xcrun simctl create ${id} com.apple.CoreSimulator.SimDeviceType.${iphoneToSimulate} ${newestRuntime.runtime.replace(
                    " ",
                    ""
                )}`
            );
        } catch {
            // Different combinantions of xcode and macOS versions have shown different syntax acceptance about the runtime, therefore 1 last attempt with a different syntax.
            await execCmd(
                `xcrun simctl create ${id} com.apple.CoreSimulator.SimDeviceType.${iphoneToSimulate} ${newestRuntime.runtimeFallback}`
            );
        }

        await execCmd(`xcrun simctl boot ${id}`);
        await execCmd(`xcrun simctl install ${id} ${appPath}`);
        await execCmd(`xcrun simctl launch --console-pty ${id} ${bundleId} ${args}`);
    } catch (error: any) {
        core.setFailed(`An unexpected error occurred: ${error.message}\n${error.stack}`);
    }
}

function getNewestRuntime(runtimes: string, os: string): { runtime: string; runtimeFallback: string } {
    // Sample output: iOS 14.5 (14.5 - 18E182) - com.apple.CoreSimulator.SimRuntime.iOS-14-5
    // and we want to extract "iOS 14.5" and "com.apple.CoreSimulator.SimRuntime.iOS-14-5"
    const matches = runtimes.matchAll(
        new RegExp(
            `(?<runtime1>${os} \\d{1,2}(.\\d{1,2})?).*(?<runtime2>com\\.apple\\.CoreSimulator\\.SimRuntime\\.${os}-[0-9.-]+)`,
            "g"
        )
    );

    let newestRuntime: { runtime: string; runtimeFallback: string } | undefined = undefined;

    for (const match of matches) {
        const currentRuntime = match.groups?.runtime1;
        if (!currentRuntime) {
            continue;
        }

        if (!newestRuntime || isRuntimeNewer(currentRuntime, newestRuntime.runtime)) {
            newestRuntime = { runtime: currentRuntime, runtimeFallback: match.groups!.runtime2 };
        }
    }

    if (!newestRuntime) {
        throw new Error(`Impossible to fetch a runtime. Check runtimes and retry.\n${runtimes}`);
    }

    return newestRuntime;
}

function isRuntimeNewer(first: string, second: string): boolean {
    const extractVersion = (runtime: string): string => {
        let extractedVersion = runtime.split(" ").pop()!;
        const components = extractedVersion.split(".").length;
        extractedVersion = extractedVersion.concat(...Array.from({ length: 3 - components}, _ => ".0"));

        if (!semver.valid(extractedVersion)) {
            throw new Error(`Couldn't extract version for runtime ${runtime}`);
        }

        return extractedVersion;
    };

    return semver.gt(extractVersion(first), extractVersion(second));
}

async function execCmd(cmd: string): Promise<string> {
    let stdout = "";
    let stderr = "";
    const options: exec.ExecOptions = {};
    options.listeners = {
        stdout: (data: Buffer): void => {
            stdout += data.toString();
        },
        stderr: (data: Buffer): void => {
            stderr += data.toString();
        },
    };

    const exitCode = await exec.exec(cmd, [], options);
    if (exitCode != 0) {
        throw new Error(`"${cmd}" failed with code ${exitCode} giving error:\n ${stderr}`);
    }

    return stdout;
}

run();

export default run;
