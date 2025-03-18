/**
 * A+ Core 2 (1102) Test List Screen
 */
const APlus2Screen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'aplus2',
          title: 'CompTIA A+ Core 2 (1102) 🖥️',
          ...route.params
        }
      }}
    />
  );
};

export default APlus2Screen;

