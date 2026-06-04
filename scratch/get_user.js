const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAb6W337-6Gew_KWdgPAIAKaNLwIk7F6pI",
  authDomain: "gridpass.firebaseapp.com",
  databaseURL: "https://gridpass-default-rtdb.firebaseio.com",
  projectId: "gridpass",
  storageBucket: "gridpass.firebasestorage.app",
  messagingSenderId: "195906971027",
  appId: "1:195906971027:web:e3a99f60233b08018b3466",
  measurementId: "G-0CGSQMTQRF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const userId = "ZjO1QEwVWAcIIOsLCjy6tSbUsZs2";
    console.log("Fetching user doc...");
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      console.log("User Data:", JSON.stringify(userSnap.data(), null, 2));
    } else {
      console.log("No user found with ID ZjO1QEwVWAcIIOsLCjy6tSbUsZs2");
    }

    console.log("Fetching vehicles...");
    const vQuery = query(collection(db, 'vehicles'), where('owner_id', '==', userId));
    const vSnap = await getDocs(vQuery);
    const vList = vSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Vehicles Data:", JSON.stringify(vList, null, 2));
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

run();
