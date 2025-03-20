module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Any other plugins you might have go here
      
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
