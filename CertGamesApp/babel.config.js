module.exports = function(api) {
  api.cache(true);
  
  const plugins = [
  ];
  
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: [] }]);
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...plugins,

      'react-native-reanimated/plugin',
    ],
  };
};
