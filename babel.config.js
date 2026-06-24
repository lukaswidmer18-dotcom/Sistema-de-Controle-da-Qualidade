module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Reanimated v4 moved worklet transforms to react-native-worklets.
    // Must be the last plugin in the list.
    plugins: ['react-native-worklets/plugin'],
  }
}
