// Learn more https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

// Monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const expoPath = fs.realpathSync(path.resolve(projectRoot, 'node_modules/expo'));
const expoModulesCorePath = fs.realpathSync(path.resolve(expoPath, '../expo-modules-core'));
const viewShotPath = fs.realpathSync(
  path.resolve(monorepoRoot, 'node_modules/react-native-view-shot'),
);

const config = getDefaultConfig(projectRoot);
const shims = {
  'expo-glass-effect': path.resolve(projectRoot, 'src/shims/expo-glass-effect.tsx'),
  'expo-linking': path.resolve(projectRoot, 'src/shims/expo-linking.ts'),
  'expo-localization': path.resolve(projectRoot, 'src/shims/expo-localization.ts'),
  'react-native-view-shot': path.resolve(projectRoot, 'src/shims/react-native-view-shot.ts'),
};

// 1. Watch all files in the monorepo (shared packages, config, etc.)
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve packages from both the app's node_modules
//    AND the monorepo root node_modules (where pnpm hoists)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Enable symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'expo-modules-core': expoModulesCorePath,
  'react-native-view-shot': viewShotPath,
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const shimPath = shims[moduleName];
  if (shimPath) {
    return {
      type: 'sourceFile',
      filePath: shimPath,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
