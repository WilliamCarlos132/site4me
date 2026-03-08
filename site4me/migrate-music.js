const { initializeApp } = require('firebase/app');
const { getDatabase, ref: dbRef, set, get } = require('firebase/database');
const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase configuration
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
const storage = getStorage(app);

const musicDir = path.join(__dirname, 'site4me', 'public', 'music');
const musicListFile = path.join(__dirname, 'site4me', 'src', 'assets', 'music-list.js');

async function migrate() {
  console.log('Starting music migration...');

  // 1. Read music-list.js
  const musicListContent = fs.readFileSync(musicListFile, 'utf8');
  // Simple regex to extract the array. This is a bit fragile but should work for this specific file.
  const listMatch = musicListContent.match(/export const musicList = (\[[\s\S]*?\]);/);
  if (!listMatch) {
    console.error('Could not parse music-list.js');
    return;
  }
  
  // Use eval safely since it's our own file (or better, parse it)
  // For simplicity in this script:
  let musicList;
  try {
    // Convert ES module to CommonJS-ish for eval
    const cjsContent = musicListContent.replace('export const musicList =', 'module.exports =');
    const tempFile = path.join(__dirname, 'temp-music-list.js');
    fs.writeFileSync(tempFile, cjsContent);
    musicList = require(tempFile);
    fs.unlinkSync(tempFile);
  } catch (e) {
    console.error('Failed to parse music list:', e);
    return;
  }

  const updatedMusicList = [];

  for (const song of musicList) {
    const filePath = path.join(musicDir, song.file);
    if (fs.existsSync(filePath)) {
      console.log(`Uploading ${song.name} (${song.file})...`);
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const sRef = storageRef(storage, `music/${song.file}`);
        
        // Upload file
        await uploadBytes(sRef, fileBuffer);
        console.log(`✓ ${song.file} uploaded`);
        
        // Get download URL
        const downloadUrl = await getDownloadURL(sRef);
        console.log(`✓ URL: ${downloadUrl}`);
        
        updatedMusicList.push({
          ...song,
          url: downloadUrl
        });
      } catch (error) {
        console.error(`✗ Failed to upload ${song.file}:`, error.message);
        updatedMusicList.push(song); // Keep original if failed
      }
    } else {
      console.warn(`File not found: ${filePath}`);
      updatedMusicList.push(song);
    }
  }

  // 2. Save updated list to Firebase Realtime Database
  console.log('Saving updated music list to Firebase RTDB...');
  await set(dbRef(db, 'musicList'), updatedMusicList);
  console.log('✓ Migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});