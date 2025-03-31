module.exports = function(api) {
  api.cache(true);
  
  const plugins = [
    // Any other plugins you might have
  ];
  
  // Only add transform-remove-console in production builds
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...plugins,
      
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
