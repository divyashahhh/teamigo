import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');
SplashScreen.preventAutoHideAsync();

const slides: {
  title: string;
  subtitle: string;
  backgroundColor: string;
  image: ImageSourcePropType;
}[] = [
  {
    title: 'Welcome to Teamigo!',
    subtitle: 'Create, manage, and grow vibrant communities.',
    backgroundColor: '#002233',
    image: require('@/assets/images/teamwork.png'),
  },
  {
    title: 'Effortless Collaboration',
    subtitle: 'Chats, announcements, and calendars all in one app.',
    backgroundColor: '#092A3D',
    image: require('@/assets/images/organisation.png'),
  },
  {
    title: 'Join and Build',
    subtitle: 'Clubs, events, and more around you.',
    backgroundColor: '#10364A',
    image: require('@/assets/images/network.png'),
  },
];

export default function Onboarding() {
  const [fontsLoaded] = useFonts({
    'Sora-Regular': require('@/assets/fonts/Sora-Regular.ttf'),
    'Sora-Bold': require('@/assets/fonts/Sora-Bold.ttf'),
    'Sora-Light': require('@/assets/fonts/Sora-Light.ttf'),
    'Sora-SemiBold': require('@/assets/fonts/Sora-SemiBold.ttf'),
  });

  const animations = useRef(
    slides.map(() => new Animated.Value(0))
  ).current;

  const [currentIndex, setCurrentIndex] = useState(0);

  const animateSlide = (index: number) => {
    Animated.timing(animations[index], {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      animateSlide(0);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const goTo = (route: '/login' | '/signup') => {
    router.replace(route);
  };

  return (
    <Swiper
      loop={false}
      activeDotColor="#00AFAF"
      dotColor="#555"
      dotStyle={{ width: 8, height: 8, borderRadius: 4 }}
      activeDotStyle={{ width: 16, height: 8, borderRadius: 4 }}
      onIndexChanged={(i) => {
        setCurrentIndex(i);
        animateSlide(i);
      }}
    >
      {slides.map((slide, i) => (
        <View
          key={i}
          style={[styles.slide, { backgroundColor: slide.backgroundColor }]}
        >
          <Animated.Image
            source={slide.image}
            style={[
              styles.illustration,
              {
                opacity: animations[i],
                transform: [
                  {
                    scale: animations[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: animations[i],
                transform: [
                  {
                    translateY: animations[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {slide.title}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: animations[i],
                transform: [
                  {
                    translateY: animations[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {slide.subtitle}
          </Animated.Text>

          {i === slides.length - 1 && (
            <View style={styles.buttonRow}>
              <Pressable style={styles.button} onPress={() => goTo('/login')}>
                <Text style={styles.buttonText}>Log In</Text>
              </Pressable>
              <Pressable
                style={styles.buttonOutline}
                onPress={() => goTo('/signup')}
              >
                <Text style={styles.buttonTextOutline}>Sign Up</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </Swiper>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  illustration: {
    width: width * 0.75,
    height: height * 0.38,
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Sora-Bold',
    color: '#F0F0F0',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Sora-Regular',
    color: '#B0BEC5',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 16,
  },
  button: {
    backgroundColor: '#00AFAF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
    shadowColor: '#00AFAF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
  buttonOutline: {
    borderColor: '#FFD700',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
  },
  buttonTextOutline: {
    color: '#FFD700',
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
});
