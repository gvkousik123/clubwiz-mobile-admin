#!/usr/bin/env node
/**
 * Bumps CFBundleVersion (CURRENT_PROJECT_VERSION) in the iOS Xcode project.
 *
 * App Store Connect rejects an upload whose build number was already used for
 * the app, so this has to move forward on every TestFlight/App Store deploy.
 *
 *   node scripts/bump-ios-build.js        -> increment by 1
 *   node scripts/bump-ios-build.js 12     -> set explicitly
 *   IOS_BUILD_NUMBER=12 node scripts/...  -> set from CI env var
 */

const fs = require("fs")
const path = require("path")

const pbxprojPath = path.join(
  __dirname,
  "..",
  "ios",
  "App",
  "App.xcodeproj",
  "project.pbxproj"
)

const contents = fs.readFileSync(pbxprojPath, "utf8")

const current = [
  ...contents.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g),
].map((match) => Number(match[1]))

if (current.length === 0) {
  console.error(`No CURRENT_PROJECT_VERSION found in ${pbxprojPath}`)
  process.exit(1)
}

const requested = process.argv[2] || process.env.IOS_BUILD_NUMBER
const next = requested ? Number(requested) : Math.max(...current) + 1

if (!Number.isInteger(next) || next < 1) {
  console.error(`Invalid build number: ${requested}`)
  process.exit(1)
}

fs.writeFileSync(
  pbxprojPath,
  contents.replace(
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${next};`
  )
)

console.log(`iOS build number: ${Math.max(...current)} -> ${next}`)
