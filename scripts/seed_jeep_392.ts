import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAb6W337-6Gew_KWdgPAIAKaNLwIk7F6pI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gridpass.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://gridpass-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gridpass",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gridpass.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "195906971027",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:195906971027:web:e3a99f60233b08018b3466",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedJeep() {
  const vehicleSlug = "2023-jeep-wrangler-rubicon-392";
  const payload = {
    id: vehicleSlug,
    tag_id: "GP-JEEP-392",
    title: "2023 Jeep Wrangler Rubicon 392",
    year: 2023,
    make: "Jeep",
    model: "Wrangler Rubicon",
    trim: "392",
    color: "Sarge Green",
    category: "car_truck",
    engine_specs: "6.4L Hemi V8 - 470 HP",
    transmission: "8-Speed Automatic",
    differential: "Dana 44 HD Heavy-Duty Front & Rear",
    gear_ratio: "4.56 Performance Axle Ratio",
    specs: {
      engine: "6.4L Hemi V8 - 470 HP",
      transmission: "8-Speed Automatic",
      differential: "Dana 44 HD Heavy-Duty Front & Rear",
      gear_ratio: "4.56 Performance Axle Ratio",
      hp: "470 HP",
      torque: "470 lb-ft"
    },
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    photo_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    additional_photos: [
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"
    ],
    mods: [
      "Warn VR EVO 10-S Winch with Synthetic Rope",
      "Rock Krawler 3.5 Inch Adventure Series Suspension Lift",
      "Method Race Wheels 315 Beadlocks with 37-Inch Nitto Trail Grapplers",
      "MagnaFlow Performance Exhaust System"
    ],
    mods_description: "Warn VR EVO 10-S Winch\nRock Krawler 3.5 Lift\nMethod 315 Beadlocks\nMagnaFlow Exhaust",
    owner_id: "losey_pj",
    owner_email: "loseyp@gmail.com",
    ref: "reddit_projectcar",
    created_at: new Date().toISOString(),
    location: "Monmouth, IL",
    scan_count: 14
  };

  await setDoc(doc(db, "vehicles", vehicleSlug), payload, { merge: true });
  console.log("SUCCESS: Created vehicle document in Cloud Firestore:", vehicleSlug);
  process.exit(0);
}

seedJeep().catch(err => {
  console.error("Error seeding vehicle:", err);
  process.exit(1);
});
