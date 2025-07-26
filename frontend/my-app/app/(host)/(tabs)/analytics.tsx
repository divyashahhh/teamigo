import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '@/utils/supabaseClient';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dummyStats, setDummyStats] = useState({
    topProduct: 'Teamigo T-shirt',
    avgOrderValue: 32.5,
    returningCustomers: 7,
    conversionRate: 0.18,
    bestMonth: 'July 2025',
  });

  // Dummy chart data
  const chartData = [
    { month: 'Mar', value: 120 },
    { month: 'Apr', value: 80 },
    { month: 'May', value: 150 },
    { month: 'Jun', value: 100 },
    { month: 'Jul', value: 200 },
  ];
  const maxValue = Math.max(...chartData.map(d => d.value));

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setTotalEarnings(null);
      setLoading(false);
      return;
    }
    // Get all purchases for this host's merch
    const { data: merch, error: merchError } = await supabase
      .from('merchandise')
      .select('id')
      .eq('host_id', user.id);
    if (merchError || !merch) {
      setTotalEarnings(null);
      setLoading(false);
      return;
    }
    const merchIds = merch.map((m: any) => m.id);
    if (merchIds.length === 0) {
      setTotalEarnings(0);
      setLoading(false);
      return;
    }
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('merch_price, quantity')
      .in('merch_id', merchIds);
    if (purchasesError || !purchases) {
      setTotalEarnings(null);
      setLoading(false);
      return;
    }
    const total = purchases.reduce((sum: number, p: any) => sum + (Number(p.merch_price) * Number(p.quantity)), 0);
    setTotalEarnings(total);
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕ Close</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>📊 Analytics</Text>
        {loading ? (
          <ActivityIndicator color="#00b2a9" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Total Earnings</Text>
            <Text style={styles.earnings}>${totalEarnings?.toFixed(2) ?? '--'}</Text>
          </View>
        )}
        {/* Dummy Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly Earnings</Text>
          <Svg width={320} height={160}>
            {chartData.map((d, i) => (
              <Rect
                key={d.month}
                x={20 + i * 60}
                y={150 - (d.value / maxValue) * 120}
                width={36}
                height={(d.value / maxValue) * 120}
                fill="#00b2a9"
                rx={8}
              />
            ))}
            {chartData.map((d, i) => (
              <SvgText
                key={d.month + '-label'}
                x={38 + i * 60}
                y={155}
                fontSize={14}
                fill="#444"
                textAnchor="middle"
              >
                {d.month}
              </SvgText>
            ))}
            {chartData.map((d, i) => (
              <SvgText
                key={d.month + '-value'}
                x={38 + i * 60}
                y={145 - (d.value / maxValue) * 120}
                fontSize={13}
                fill="#1C2A67"
                textAnchor="middle"
                fontWeight="bold"
              >
                {d.value}
              </SvgText>
            ))}
          </Svg>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Other Insights</Text>
          <View style={styles.statRow}><Text style={styles.statLabel}>Top Product:</Text><Text style={styles.statValue}>{dummyStats.topProduct}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Avg. Order Value:</Text><Text style={styles.statValue}>${dummyStats.avgOrderValue}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Returning Customers:</Text><Text style={styles.statValue}>{dummyStats.returningCustomers}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Conversion Rate:</Text><Text style={styles.statValue}>{(dummyStats.conversionRate * 100).toFixed(1)}%</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Best Month:</Text><Text style={styles.statValue}>{dummyStats.bestMonth}</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    backgroundColor: '#eee',
    borderRadius: 20,
    elevation: 2,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C2A67',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00b2a9',
    marginBottom: 12,
  },
  earnings: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C2A67',
    marginBottom: 8,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#444',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C2A67',
  },
}); 