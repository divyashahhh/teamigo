import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity, Modal, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useMemberSubscriptions } from '@/hooks/useMemberSubscriptions';
import { useMemberFeed } from '@/hooks/useMemberFeed';
import { supabase } from '@/utils/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

interface Question {
  id: string;
  text: string;
  type: 'short_answer' | 'short' | 'number' | 'mcq';
  options?: string[];
  required: boolean;
}

interface MerchData {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url?: string;
  questions: Question[];
  host_id: string;
}

export default function MemberMerch() {
  const { hostIds, loading: subsLoading, error: subsError } = useMemberSubscriptions();
  const { data: merch, loading, error } = useMemberFeed('merchandise', hostIds);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orgs, setOrgs] = useState<{ id: string, name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedMerch, setSelectedMerch] = useState<MerchData | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hostIds.length > 0) {
      supabase
        .from('users')
        .select('id, name')
        .in('id', hostIds)
        .then(({ data }) => {
          setOrgs(data || []);
        });
    } else {
      setOrgs([]);
    }
  }, [hostIds]);

  const filteredMerch = selectedOrg
    ? merch.filter((m: any) => m.host_id === selectedOrg)
    : merch;

  const handleMerchPress = async (merchItem: any) => {
    try {
      const { data, error } = await supabase
        .from('merchandise')
        .select('*')
        .eq('id', merchItem.id)
        .single();

      if (error) throw error;
      
      console.log('Loaded merch data:', {
        id: data.id,
        title: data.title,
        questions: data.questions,
        questionsCount: data.questions?.length || 0
      });
      
      setSelectedMerch(data);
      setPopupVisible(true);
    } catch (error) {
      console.error('Error fetching merch data:', error);
      Alert.alert('Error', 'Failed to load merchandise details');
    }
  };

  const handleBuyPress = () => {
    setPopupVisible(false);
    setPurchaseModalVisible(true);
    setAnswers({});
    setQuantity(1);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    console.log('Answer change:', { questionId, value });
    if (!questionId) {
      console.warn('Question ID is undefined, cannot save answer');
      return;
    }
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const validateAnswers = () => {
    if (!selectedMerch) return false;
    
    for (const question of selectedMerch.questions) {
      if (question.required && (!answers[question.id] || answers[question.id].trim() === '')) {
        Alert.alert('Validation Error', `Please answer: ${question.text}`);
        return false;
      }
    }
    return true;
  };

  const handlePurchase = async () => {
    if (!selectedMerch || !validateAnswers()) return;

    setSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          merch_id: selectedMerch.id,
          answers: answers,
          merch_title: selectedMerch.title,
          merch_price: selectedMerch.price,
          quantity: quantity,
          payment_status: 'completed',
          payment_method: 'simulated'
        });

      if (error) throw error;

      Alert.alert(
        'Purchase Successful!', 
        'Your order has been placed successfully.',
        [{ text: 'OK', onPress: () => {
          setPurchaseModalVisible(false);
          setSelectedMerch(null);
        }}]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    // Use index as fallback if question.id is undefined
    const questionKey = question.id || `question-${Math.random()}`;
    const value = answers[questionKey] || '';

    console.log('Rendering question:', { 
      type: question.type, 
      text: question.text, 
      id: question.id, 
      questionKey,
      hasValue: !!value 
    });

    switch (question.type) {
      case 'short_answer':
      case 'short':
        return (
          <TextInput
            style={styles.input}
            placeholder={`Enter your ${question.text.toLowerCase()}`}
            value={value}
            onChangeText={(text) => handleAnswerChange(questionKey, text)}
            multiline={false}
            numberOfLines={1}
          />
        );
      
      case 'number':
        return (
          <TextInput
            style={styles.input}
            placeholder={`Enter your ${question.text.toLowerCase()}`}
            value={value}
            onChangeText={(text) => handleAnswerChange(questionKey, text)}
            keyboardType="numeric"
            multiline={false}
            numberOfLines={1}
          />
        );
      
      case 'mcq':
        return (
          <View style={styles.mcqContainer}>
            {question.options?.map((option, index) => (
              <TouchableOpacity
                key={`${questionKey}-${index}`}
                style={[
                  styles.mcqOption,
                  value === option && styles.mcqOptionSelected
                ]}
                onPress={() => handleAnswerChange(questionKey, option)}
              >
                <Text style={[
                  styles.mcqOptionText,
                  value === option && styles.mcqOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      default:
        console.log('Unknown question type:', question.type);
        return null;
    }
  };

  if (subsLoading || loading) {
    return <View style={styles.center}><ActivityIndicator color="#00b2a9" /></View>;
  }
  if (subsError || error) {
    return <View style={styles.center}><Text style={styles.error}>{subsError || error}</Text></View>;
  }
  return (
    <LinearGradient colors={['#EAF0FF', '#FFF6E0', '#C6FFF6']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Filter Button */}
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: '#222B45' }]} onPress={() => setFilterModalVisible(true)}>
          <Text style={[styles.filterButtonText, { color: '#fff' }]}>Filter</Text>
        </TouchableOpacity>
        {/* Show selected org */}
        {selectedOrg && (
          <View style={[styles.selectedOrgBar, { backgroundColor: 'rgba(255,255,255,0.7)' }] }>
            <Text style={[styles.selectedOrgText, { color: '#222B45' }] }>
              Showing: {orgs.find(o => o.id === selectedOrg)?.name || 'Organisation'}
            </Text>
            <Pressable onPress={() => setSelectedOrg(null)}>
              <Text style={[styles.clearFilterText, { color: '#FF4444' }]}>Clear Filter</Text>
            </Pressable>
          </View>
        )}
        <FlatList
          data={filteredMerch}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleMerchPress(item)}>
              <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.95)' }] }>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}><Text>🛍️</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: '#222B45' }]}>{item.title}</Text>
                  <Text style={[styles.desc, { color: '#6B7280' }]}>{item.description}</Text>
                  <Text style={[styles.price, { color: '#00b2a9' }]}>${item.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: '#888' }]}>No merchandise from your subscriptions yet.</Text>}
        />

        {/* Simple Popup Modal for merch details */}
        <Modal visible={popupVisible} animationType="slide" transparent onRequestClose={() => setPopupVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: 320, backgroundColor: 'rgba(255,255,255,0.98)' }]}>
              {selectedMerch && (
                <>
                  {selectedMerch.image_url ? (
                    <Image source={{ uri: selectedMerch.image_url }} style={{ width: 120, height: 120, borderRadius: 12, marginBottom: 12 }} />
                  ) : (
                    <View style={[styles.imagePlaceholder, { width: 120, height: 120, marginBottom: 12 }]}><Text>🛍️</Text></View>
                  )}
                  <Text style={[styles.title, { fontSize: 22, marginBottom: 6, color: '#222B45' }]}>{selectedMerch.title}</Text>
                  <Text style={[styles.price, { fontSize: 20, marginBottom: 6, color: '#00b2a9' }]}>${selectedMerch.price?.toFixed(2) ?? ''}</Text>
                  <Text style={[styles.desc, { fontSize: 16, marginBottom: 16, color: '#6B7280' }]}>{selectedMerch.description}</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                    <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: '#eee', flex: 1 }]} onPress={() => setPopupVisible(false)}>
                      <Text style={[styles.closeModalText, { color: '#222B45' }]}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: '#00b2a9', flex: 1 }]} onPress={handleBuyPress}>
                      <Text style={[styles.closeModalText, { color: '#fff' }]}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Purchase Modal */}
        <Modal visible={purchaseModalVisible} animationType="slide" transparent onRequestClose={() => setPurchaseModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '90%', maxHeight: '90%', backgroundColor: 'rgba(255,255,255,0.98)' }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedMerch && (
                  <>
                    {/* Merch Details */}
                    <View style={styles.merchSection}>
                      {selectedMerch.image_url ? (
                        <Image source={{ uri: selectedMerch.image_url }} style={styles.merchImage} />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.placeholderText}>🛍️</Text>
                        </View>
                      )}
                      <Text style={styles.merchTitle}>{selectedMerch.title}</Text>
                      <Text style={styles.merchPrice}>${selectedMerch.price.toFixed(2)}</Text>
                      <Text style={styles.merchDescription}>{selectedMerch.description}</Text>
                    </View>

                    {/* Quantity Selector */}
                    <View style={styles.quantitySection}>
                      <Text style={styles.sectionTitle}>Quantity</Text>
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => setQuantity(quantity + 1)}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Questions Form */}
                    {selectedMerch.questions && selectedMerch.questions.length > 0 && (
                      <View style={styles.questionsSection}>
                        <Text style={styles.sectionTitle}>Please provide the following information:</Text>
                        {selectedMerch.questions.map((question, index) => (
                          <View key={`question-${question.id || index}`} style={styles.questionContainer}>
                            <Text style={styles.questionText}>
                              {index + 1}. {question.text}
                              {question.required && <Text style={styles.required}> *</Text>}
                            </Text>
                            {renderQuestion(question)}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Payment Section */}
                    <View style={styles.paymentSection}>
                      <Text style={styles.sectionTitle}>Payment</Text>
                      <View style={styles.paymentMethod}>
                        <Text style={styles.paymentMethodText}>💳 Simulated Payment Gateway</Text>
                        <Text style={styles.paymentNote}>This is a demo payment simulation</Text>
                      </View>
                      <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>${(selectedMerch.price * quantity).toFixed(2)}</Text>
                      </View>
                    </View>

                    {/* Purchase Button */}
                    <TouchableOpacity 
                      style={[styles.purchaseButton, submitting && styles.purchaseButtonDisabled]}
                      onPress={handlePurchase}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.purchaseButtonText}>Complete Purchase</Text>
                      )}
                    </TouchableOpacity>

                    {/* Close Button */}
                    <TouchableOpacity 
                      style={[styles.closeModalButton, { marginTop: 16 }]} 
                      onPress={() => setPurchaseModalVisible(false)}
                    >
                      <Text style={[styles.closeModalText, { color: '#FF4444' }]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal for org filter */}
        <Modal visible={filterModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: 'rgba(255,255,255,0.98)' }]}>
              <Text style={[styles.modalTitle, { color: '#222B45' }]}>Filter by Organisation</Text>
              {orgs.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.orgOption, selectedOrg === org.id && styles.selectedOrgOption, { backgroundColor: selectedOrg === org.id ? '#EAF0FF' : 'rgba(0,0,0,0.03)' }]}
                  onPress={() => {
                    setSelectedOrg(org.id);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.orgName, { color: '#222B45' }]}>{org.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setFilterModalVisible(false)}>
                <Text style={[styles.closeModalText, { color: '#FF4444' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff4444', fontSize: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#222' },
  price: { fontSize: 16, color: '#00b2a9', marginTop: 4 },
  desc: { fontSize: 16, color: '#444', marginTop: 4 },
  empty: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
  filterButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    backgroundColor: '#00b2a9',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#00b2a9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedOrgBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f7f6',
    paddingVertical: 8,
    marginTop: 48,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 20,
    gap: 12,
  },
  selectedOrgText: {
    color: '#1AB09E',
    fontWeight: '600',
    fontSize: 15,
  },
  clearFilterText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#1C2A67',
  },
  orgOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  selectedOrgOption: {
    backgroundColor: '#1AB09E',
  },
  orgName: {
    fontSize: 16,
    color: '#1C2A67',
    fontWeight: '600',
  },
  closeModalButton: {
    marginTop: 16,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  closeModalText: {
    color: '#333',
    fontSize: 16,
  },
  // Purchase modal styles
  merchSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  merchImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 40,
  },
  merchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  merchPrice: {
    fontSize: 20,
    color: '#00b2a9',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  merchDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  quantitySection: {
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#00b2a9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  questionsSection: {
    marginBottom: 20,
    width: '100%',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#ff4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  mcqContainer: {
    gap: 8,
  },
  mcqOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  mcqOptionSelected: {
    borderColor: '#00b2a9',
    backgroundColor: '#e6f7f6',
  },
  mcqOptionText: {
    fontSize: 16,
    color: '#333',
  },
  mcqOptionTextSelected: {
    color: '#00b2a9',
    fontWeight: 'bold',
  },
  paymentSection: {
    marginBottom: 20,
    width: '100%',
  },
  paymentMethod: {
    marginBottom: 16,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00b2a9',
  },
  purchaseButton: {
    backgroundColor: '#00b2a9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  purchaseButtonDisabled: {
    backgroundColor: '#ccc',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 