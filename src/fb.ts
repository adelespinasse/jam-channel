import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMmXpGRAB6iX7pr02ySkQEeKwbUNZh4yM",
  authDomain: "jam-channel.firebaseapp.com",
  projectId: "jam-channel",
  storageBucket: "jam-channel.appspot.com",
  messagingSenderId: "569348953885",
  appId: "1:569348953885:web:d3254a66358ec625e033f4"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
