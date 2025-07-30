import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabaseClient';
import * as FileSystem from 'expo-file-system';

const questionTypes = [
  { label: 'Short Answer', value: 'short' },
  { label: 'Number', value: 'number' },
  { label: 'MCQ', value: 'mcq' },
];

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgmcfhlkc/image/upload';
const CLOUDINARY_PRESET = 'user_uploads';
const uploadToCloudinary = async (uri: string, folder: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const data = new FormData();
  data.append('file', `data:image/jpeg;base64,${base64}`);
  data.append('upload_preset', CLOUDINARY_PRESET);
  data.append('folder', folder);
  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data });
  const result = await res.json();
  if (result.secure_url) { return result.secure_url; } else { throw new Error('Cloudinary upload failed'); }
};

export default function MerchSetupScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [paymentOption, setPaymentOption] = useState<'gateway' | 'qr' | 'number'>('gateway');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'short', options: [''] }]);
  };
  const updateQuestion = (idx: number, key: string, value: any) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [key]: value } : q));
  };
  const removeQuestion = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  };
  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o: string, j: number) => j === oIdx ? value : o) } : q));
  };
  const addOption = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ''] } : q));
  };
  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_: string, j: number) => j !== oIdx) } : q));
  };

  const handlePost = async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadToCloudinary(image, 'merch_images');
      }
      let paymentDetails: any = {};
      if (paymentOption === 'qr' && qrImage) {
        paymentDetails.qr_url = await uploadToCloudinary(qrImage, 'merch_qr_images');
      }
      if (paymentOption === 'number' && phoneNumber) {
        paymentDetails.phone = phoneNumber;
      }
      const { error: insertError } = await supabase
        .from('merchandise')
        .insert({
          host_id: user.id,
          image_url: imageUrl,
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          questions,
          payment_type: paymentOption,
          payment_details: paymentDetails,
        });
      if (insertError) throw insertError;
      Alert.alert('Success', 'Merchandise posted!');
      router.replace('../(tabs)/merch');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post merchandise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.header}>Set Up Merchandise</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setImage)}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>Add Image</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor="#888"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor="#888"
        multiline
        numberOfLines={3}
      />
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        placeholderTextColor="#888"
        keyboardType="numeric"
      />
      <Text style={styles.sectionTitle}>Questions for Buyer</Text>
      {questions.map((q, idx) => (
        <View key={idx} style={styles.questionBox}>
          <TextInput
            style={styles.input}
            value={q.text}
            onChangeText={v => updateQuestion(idx, 'text', v)}
            placeholder="Question"
            placeholderTextColor="#888"
          />
          <View style={styles.typeRow}>
            {questionTypes.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeButton, q.type === t.value && styles.typeButtonActive]}
                onPress={() => updateQuestion(idx, 'type', t.value)}
              >
                <Text style={q.type === t.value ? styles.typeButtonTextActive : styles.typeButtonText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {q.type === 'mcq' && (
            <View style={styles.optionsBox}>
              {q.options.map((opt: string, oIdx: number) => (
                <View key={oIdx} style={styles.optionRow}>
                  <TextInput
                    style={styles.input}
                    value={opt}
                    onChangeText={v => updateOption(idx, oIdx, v)}
                    placeholder={`Option ${oIdx + 1}`}
                    placeholderTextColor="#888"
                  />
                  <TouchableOpacity onPress={() => removeOption(idx, oIdx)}>
                    <Text style={{ color: '#ff4444', fontSize: 18, marginLeft: 8 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={() => addOption(idx)}>
                <Text style={{ color: '#00b2a9', marginTop: 4 }}>+ Add Option</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => removeQuestion(idx)}>
            <Text style={{ color: '#ff4444', marginTop: 4 }}>Remove Question</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
        <Text style={styles.addQuestionText}>+ Add Question</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Payment Option</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeButton, paymentOption === 'gateway' && styles.typeButtonActive]}
          onPress={() => setPaymentOption('gateway')}
        >
          <Text style={paymentOption === 'gateway' ? styles.typeButtonTextActive : styles.typeButtonText}>Payment Gateway</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, paymentOption === 'qr' && styles.typeButtonActive]}
          onPress={() => setPaymentOption('qr')}
        >
          <Text style={paymentOption === 'qr' ? styles.typeButtonTextActive : styles.typeButtonText}>Upload QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, paymentOption === 'number' && styles.typeButtonActive]}
          onPress={() => setPaymentOption('number')}
        >
          <Text style={paymentOption === 'number' ? styles.typeButtonTextActive : styles.typeButtonText}>Phone Number</Text>
        </TouchableOpacity>
      </View>
      {paymentOption === 'qr' && (
        <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setQrImage)}>
          {qrImage ? (
            <Image source={{ uri: qrImage }} style={styles.image} />
          ) : (
            <Text style={styles.imagePlaceholder}>Upload QR</Text>
          )}
        </TouchableOpacity>
      )}
      {paymentOption === 'number' && (
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
        />
      )}
      {paymentOption === 'gateway' && (
        <View style={styles.gatewayBox}>
          <Text style={{ color: '#888', fontSize: 16 }}>Apple Pay & Mastercard will be supported at checkout.</Text>
        </View>
      )}
      <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={loading}>
        <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b2a9',
    marginBottom: 20,
    marginTop: 10,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#888',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#222',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00b2a9',
    marginTop: 24,
    marginBottom: 8,
  },
  questionBox: {
    backgroundColor: '#f0f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#00b2a9',
  },
  typeButtonText: {
    color: '#222',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  optionsBox: {
    marginTop: 8,
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addQuestionBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addQuestionText: {
    color: '#00b2a9',
    fontSize: 16,
    fontWeight: '500',
  },
  gatewayBox: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  postBtn: {
    backgroundColor: '#00b2a9',
    borderRadius: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 