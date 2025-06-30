import { View, Text } from 'react-native';
import 'expo-router/entry';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>🧪 App loaded outside router</Text>
    </View>
  );
}
