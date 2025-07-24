import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    image: require('../assets/images/teamwork.png'),
    title: 'Welcome to Teamigo!',
    description: 'Create, manage and\ngrow vibrant communities',
    gradient: [
      '#EAF0FF',
      '#FFF6E0',
      '#C6FFF6',
    ] as const,
    button: 'Next',
    textColor: '#222B45',
    descColor: '#6B7280',
    buttonBg: '#222B45',
    buttonText: '#fff',
  },
  {
    image: require('../assets/images/sports.png'),
    title: 'Effortless!',
    description: 'Chats, announcements and\ncalendars all in one app',
    gradient: [
      '#2B2BFF',
      '#2B2BFF',
      '#00CFFF',
    ] as const,
    button: 'Next',
    textColor: '#fff',
    descColor: '#E0E7FF',
    buttonBg: '#222B45',
    buttonText: '#fff',
  },
  {
    image: require('../assets/images/hugs.png'),
    title: 'Join and Grow!',
    description: 'Clubs and events,\nand more around you!',
    gradient: [
      '#EAF0FF',
      '#FFF6E0',
      '#C6FFF6',
    ] as const,
    button: 'Get Started',
    textColor: '#222B45',
    descColor: '#6B7280',
    buttonBg: '#222B45',
    buttonText: '#fff',
  },
];

interface OnboardingProps {
  page?: number;
  setPage?: (page: number) => void;
  customButtons?: React.ReactNode;
  onLastSlideComplete?: () => void;
}

const Onboarding = ({ page: externalPage, setPage: externalSetPage, customButtons, onLastSlideComplete }: OnboardingProps) => {
  const flatListRef = useRef<FlatList>(null);
  const [internalPage, setInternalPage] = useState(0);
  const page = externalPage !== undefined ? externalPage : internalPage;
  const setPage = externalSetPage !== undefined ? externalSetPage : setInternalPage;

  const handleMomentumScrollEnd = (event: any) => {
    const newPage = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(newPage);
  };

  const handleNext = () => {
    if (page < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: page + 1, animated: true });
    } else {
      if (onLastSlideComplete) onLastSlideComplete();
      else router.replace('/auth/login');
    }
  };

  const renderItem = ({ item, index }: { item: typeof onboardingData[0]; index: number }) => (
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.panel}
    >
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
      <Text style={[styles.description, { color: item.descColor }]}>{item.description}</Text>
      <View style={{ height: 30 }} />
      <View style={styles.pagination}>
        {onboardingData.map((_, dotIdx) => (
          <View
            key={dotIdx}
            style={[styles.dot, page === dotIdx && { backgroundColor: '#222B45', width: 18 }]}
          />
        ))}
      </View>
      {/* Only show button(s) on the last page */}
      {index === onboardingData.length - 1 && customButtons}
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        initialScrollIndex={page}
        extraData={page}
      />
    </View>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  panel: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    marginTop: 30,
    marginBottom: 30,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 30,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C7D2FE',
    marginHorizontal: 6,
  },
  button: {
    marginTop: 10,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
