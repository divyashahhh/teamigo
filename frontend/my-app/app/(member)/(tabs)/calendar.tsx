import React, { useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';
import { useMemberFeed } from '@/hooks/useMemberFeed';

export default function MemberCalendar() {
  const { hostIds, loading: subsLoading, error: subsError } = useMemberSubscriptions();
  const { data: events, loading, error } = useMemberFeed('events', hostIds);
  const [selectedDate, setSelectedDate] = useState('');

  // Collate events by date
  const eventsByDate = useMemo(() => {
    const byDate: Record<string, any[]> = {};
    for (const ev of events) {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push(ev);
    }
    return byDate;
  }, [events]);

  // Marked dates for calendar
  const markedDates = useMemo(() => {
    const marks: any = {};
    Object.keys(eventsByDate).forEach(date => {
      if (eventsByDate[date].length > 0) {
        marks[date] = { marked: true, dotColor: '#00b2a9' };
      }
    });
    if (selectedDate) marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true };
    return marks;
  }, [eventsByDate, selectedDate]);

  if (subsLoading || loading) {
    return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  }
  if (subsError || error) {
    return <View style={styles.center}><Text style={styles.error}>{subsError || error}</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#00b2a9',
          todayTextColor: '#00b2a9',
          dotColor: '#00b2a9',
        }}
      />
      <Text style={styles.sectionTitle}>Events</Text>
      <FlatList
        data={selectedDate ? eventsByDate[selectedDate] || [] : []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.content}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No events for this day.</Text>}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff4444', fontSize: 16 },
  calendar: { marginBottom: 20, borderRadius: 20, overflow: 'hidden' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#00b2a9', marginBottom: 16 },
  card: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  date: { fontSize: 12, color: '#888', marginTop: 8 },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
});