import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#6C63FF',
  secondary: '#B8B8FF',
  background: '#F5F7FA',
  darkBackground: '#1B1D2E',
  light: '#FFFFFF',
  muted: '#A1A5B7',
  accent: '#FFD86E',
  error: '#FF6B6B',
  success: '#32D48E',
  text: '#1A1A1A',
  subtitle: '#5C5F71',
  border: '#E4E6EF'
};

const colorOptions = [
  { color: '#FF6B6B', label: 'Important' },
  { color: '#4ECDC4', label: 'Personal' },
  { color: '#FFD93D', label: 'Work' },
  { color: '#95A5A6', label: 'Other' },
  { color: '#6C5CE7', label: 'Social' }
];

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsByDate, setEventsByDate] = useState<Record<string, { id: number; text: string; color: string }[]>>({});
  const [eventText, setEventText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  // Change userId state to string
  const [userId, setUserId] = useState<string | null>(null);
  // State for events
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          Alert.alert('Error', 'Could not fetch user data');
          return;
        }
        setUserId(user.id);
        await fetchEvents(user.id);
        const date = new Date();
        setCurrentMonth(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
      } catch (error) {
        console.error('Error initializing calendar:', error);
        Alert.alert('Error', 'Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };
    initializeCalendar();
  }, []);

  // Fetch events
  const fetchEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setEventsByDate({});
    } else {
      setEvents(data || []);
      setEventsByDate(buildEventsByDate(data || []));
    }
  };

  // Helper to build eventsByDate from events array
  const buildEventsByDate = (eventsArr: any[]) => {
    const byDate: Record<string, { id: number; text: string; color: string }[]> = {};
    for (const ev of eventsArr) {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push({ id: ev.id, text: ev.content, color: ev.color });
    }
    return byDate;
  };

  // Create event
  const createEvent = async (event: any) => {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();
    if (error) {
      Alert.alert('Error', 'Failed to create event');
    } else {
      fetchEvents(event.user_id);
    }
  };

  // Update event
  const updateEvent = async (eventId: string, updates: any) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    if (error) {
      Alert.alert('Error', 'Failed to update event');
    } else {
      fetchEvents(updates.user_id);
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string, userId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    if (error) {
      Alert.alert('Error', 'Failed to delete event');
    } else {
      fetchEvents(userId);
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const saveEvent = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in again');
      router.replace('../login');
      return;
    }

    if (!eventText.trim()) {
      Alert.alert('Error', 'Please enter event details');
      return;
    }

    try {
      const result = await supabase
        .from('events')
        .insert([{
          user_id: userId,
          date: selectedDate,
          content: eventText.trim(),
          color: selectedColor
        }])
        .select()
        .single();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      if (result.data) {
        // After creating, fetch all events to update eventsByDate
        await fetchEvents(userId);
        setEventText('');
        setSelectedColor(colorOptions[0].color);
        setModalVisible(false);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const markedDates = Object.keys(eventsByDate).reduce((acc, date) => {
    const events = eventsByDate[date];
    if (events.length > 0) {
      acc[date] = {
        marked: true,
        dots: events.slice(0, 3).map(event => ({
          color: event.color,
          key: event.id.toString()
        }))
      };
    }
    return acc;
  }, {} as any);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const renderDay = (day: any) => {
    const events = day ? eventsByDate[day.dateString] || [] : [];
    const isSelected = selectedDate === (day?.dateString || '');

    if (!day) return <View style={styles.emptyDay} />;

    return (
      <TouchableOpacity
        onPress={() => handleDayPress(day)}
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay
        ]}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          day.dateString === new Date().toISOString().split('T')[0] && styles.todayText
        ]}>
          {day.day}
        </Text>
        <View style={styles.eventDotsContainer}>
          {events.slice(0, 3).map((event, index) => (
            <View
              key={event.id}
              style={[
                styles.eventDotInDay,
                { backgroundColor: event.color },
                index > 0 && { marginLeft: 2 }
              ]}
            />
          ))}
          {events.length > 3 && (
            <Text style={styles.moreEventsText}>+{events.length - 3}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <Text style={styles.monthText}>{currentMonth}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          style={styles.calendar}
          theme={{
            backgroundColor: COLORS.background,
            calendarBackground: COLORS.background,
            textSectionTitleColor: COLORS.subtitle,
            selectedDayBackgroundColor: 'transparent',
            selectedDayTextColor: COLORS.text,
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.text,
            textDisabledColor: COLORS.muted,
            monthTextColor: COLORS.text,
            textMonthFontSize: 16,
            textMonthFontWeight: '600',
            arrowColor: COLORS.primary,
          }}
          dayComponent={({ date }) => renderDay(date)}
        />

        <View style={styles.eventListContainer}>
          <Text style={styles.sectionTitle}>Events</Text>
          {selectedDate ? (
            eventsByDate[selectedDate]?.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { borderLeftColor: event.color }]}
                onPress={() => {
                  setSelectedEventId(event.id);
                  setEventText(event.text);
                  setSelectedColor(event.color);
                  setEditModalVisible(true);
                }}
              >
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.text}</Text>
                  <Text style={styles.eventTime}>All day</Text>
                </View>
                <View style={[styles.eventDot, { backgroundColor: event.color }]} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Select a date to view or add events</Text>
          )}
        </View>
      </Animated.ScrollView>

      {/* Add Event Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Event</Text>
            <TextInput
              placeholder="Event title"
              value={eventText}
              onChangeText={setEventText}
              style={styles.input}
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.colorLabel}>Event Category</Text>
            <View style={styles.colorGrid}>
              {colorOptions.map(({ color, label }) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={styles.colorOption}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={[styles.colorLabel, selectedColor === color && styles.selectedColorLabel]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEvent}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Event Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Event</Text>
            <TextInput
              value={eventText}
              onChangeText={setEventText}
              style={styles.input}
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.colorLabel}>Event Category</Text>
            <View style={styles.colorGrid}>
              {colorOptions.map(({ color, label }) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={styles.colorOption}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={[styles.colorLabel, selectedColor === color && styles.selectedColorLabel]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => deleteEvent(selectedEventId?.toString() || '', userId || '')}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => updateEvent(selectedEventId?.toString() || '', {
                  content: eventText,
                  color: selectedColor
                })}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginTop: 8 }]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    zIndex: 1
  },
  monthText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.light,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  eventListContainer: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16
  },
  eventCard: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  eventContent: {
    flex: 1
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  eventTime: {
    fontSize: 14,
    color: COLORS.subtitle
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 20
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.light,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.text
  },
  colorLabel: {
    fontSize: 14,
    color: COLORS.subtitle,
    marginBottom: 12
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    minWidth: (width - 72) / 2
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8
  },
  selectedColorLabel: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: COLORS.primary
  },
  saveButtonText: {
    color: COLORS.light,
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: COLORS.background
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: COLORS.error
  },
  deleteButtonText: {
    color: COLORS.light,
    fontSize: 16,
    fontWeight: '600'
  },
  dayContainer: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  selectedDay: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedDayText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  eventDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 12,
  },
  eventDotInDay: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEventsText: {
    fontSize: 8,
    color: COLORS.muted,
    marginLeft: 2,
  },
  emptyDay: {
    width: 32,
    height: 48,
  },
});

export default CalendarPage;