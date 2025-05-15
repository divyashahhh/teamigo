import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const goTo = (route: '/login' | '/signup') => {
    router.replace(route);
  };

  return (
    <Swiper loop={false} activeDotColor="#5B4EFF">
      <View style={styles.slide}>
        <Text style={styles.title}>Welcome to Teamigo!</Text>
        <Text style={styles.subtitle}>Creating Communities Made Easy!</Text>
      </View>

      <View style={[styles.slide, { backgroundColor: '#1D1D4E' }]}>
        <Text style={styles.titleDark}>Effortless Announcements</Text>
        <Text style={styles.subtitleDark}>Share updates, polls, events with your group</Text>
      </View>

      <View style={styles.slide}>
        <Text style={styles.title}>Sell Merch, Organize Events</Text>
        <Text style={styles.subtitle}>Everything your club needs in one app</Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.button} onPress={() => goTo('/login')}>
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => goTo('/signup')}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </Swiper>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  titleDark: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitleDark: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 20,
  },
  button: {
    backgroundColor: '#5B4EFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

