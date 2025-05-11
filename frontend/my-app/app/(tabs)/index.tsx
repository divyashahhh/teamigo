import { View, Text, StyleSheet, Image, TextInput } from 'react-native';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Howdy,</Text>
        <Text style={styles.name}>Leah White</Text>
        <Image
          source={{ uri: 'https://i.pravatar.cc/100' }}
          style={styles.avatar}
        />
      </View>

      <TextInput
        placeholder="Search"
        style={styles.search}
      />

      <Text style={styles.section}>Course Categories</Text>

      <View style={styles.row}>
        {['UX', 'HCI', 'Design', 'Motion'].map((cat, i) => (
          <View key={i} style={styles.category}>
            <Text style={styles.categoryText}>{cat}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Enrolled courses</Text>
      <View style={styles.card}>
        <Text style={styles.courseTitle}>Human-Computer Interaction - HCI</Text>
        <Text style={styles.teacher}>Jane Martin / Teacher</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 20, color: '#555' },
  name: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  search: {
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    fontSize: 16,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  category: {
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 14,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  categoryText: { fontWeight: '600' },
  card: {
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  courseTitle: { fontWeight: '600', fontSize: 16 },
  teacher: { color: '#666', marginTop: 4 },
});
