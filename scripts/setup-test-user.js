const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

const firebaseConfig = {
  apiKey: 'AIzaSyDBMSitGO5yDdwQFY5UO6EHnNkqsWin_Z8',
  authDomain: 'datingapp5.firebaseapp.com',
  projectId: 'datingapp5',
  storageBucket: 'datingapp5.firebasestorage.app',
  messagingSenderId: '751767135162',
  appId: '1:751767135162:web:38a18fd16db538c53d7383'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const TEST_EMAIL = 'andrew.martin2215@gmail.com';
const TEST_PASSWORD = 'test123456';

async function setupTestUser() {
  try {
    // Try to create the user first
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('Test user created successfully:', userCredential.user.uid);
    } catch (error) {
      // If user already exists, try to sign in
      if (error.code === 'auth/email-already-in-use') {
        const signInResult = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('Test user already exists, signed in successfully:', signInResult.user.uid);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error setting up test user:', error);
    process.exit(1);
  }
}

setupTestUser(); 