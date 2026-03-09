const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Zustand's ESM builds use import.meta.env which isn't supported in
// Metro's web bundle output (served as a regular script, not an ES module).
// Force zustand imports to resolve to the CJS builds instead.
const zustandRoot = path.resolve(__dirname, 'node_modules', 'zustand');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === 'zustand' || moduleName.startsWith('zustand/'))
  ) {
    const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    return {
      filePath: path.resolve(zustandRoot, `${subpath}.js`),
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
