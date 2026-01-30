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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export database references
export { db, ref, set, onValue, get };