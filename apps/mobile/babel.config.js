module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Reanimated 3 plugin MUST be last.
      "react-native-reanimated/plugin",
    ],
  };
};
