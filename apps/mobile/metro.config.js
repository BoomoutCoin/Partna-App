// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the full monorepo so workspace packages (e.g. @partna/types) hot-reload.
config.watchFolders = [workspaceRoot];

// With `shamefully-hoist=true` all deps live in the workspace root
// node_modules. Tell Metro to resolve from both.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = false;

module.exports = config;
