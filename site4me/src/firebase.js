// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8HAycmID1P7Ztu-ETZfyf_vqrniw_8u4",
  authDomain: "ournote-31a07.firebaseapp.com",
  databaseURL: "https://ournote-31a07-default-rtdb.firebaseio.com",
  projectId: "ournote-31a07",
  storageBucket: "ournote-31a07.firebasestorage.app",
  messagingSenderId: "1060792276650",
  appId: "1:1060792276650:web:23688a868dd51138fb22d3",
  measurementId: "G-S5K4Q3MYXN"
};

// Initialize Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Fallback to mock implementation if Firebase initialization fails
  db = {
    ref: function(path) {
      return {
        path,
        set: function(value) {
          console.log('Mock Firebase set:', path, value);
          return Promise.resolve();
        },
        on: function(event, callback) {
          console.log('Mock Firebase on:', event);
          return function() {};
        },
        get: function() {
          console.log('Mock Firebase get:', path);
          return Promise.resolve({ exists: () => false });
        }
      };
    }
  };
}

// Export database references
export { db, ref, set, onValue, get };