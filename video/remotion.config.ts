import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setCrf(18);

// Reuse the headless Chrome the walkthrough films already downloaded, so a
// render doesn't fetch another copy. Remotion downloads its own if it's missing.
const sharedChrome = resolve(
  "../walkthrough-video/remotion/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe",
);
if (existsSync(sharedChrome)) Config.setBrowserExecutable(sharedChrome);
