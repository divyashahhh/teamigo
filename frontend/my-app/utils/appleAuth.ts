import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function signInWithApple() {
  const nonce = Math.random().toString(36).substring(2, 10);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    let firstName = credential.fullName?.givenName || null;

    if (!firstName) {
      firstName = await AsyncStorage.getItem('appleFirstName');
    } else {
      await AsyncStorage.setItem('appleFirstName', firstName);
    }

    return {
      idToken: credential.identityToken,
      email: credential.email,
      fullName: credential.fullName,
      user: credential.user,
      firstName,
    };
  } catch (error) {
    console.error('Apple Auth Error:', error);
    return null;
  }
}