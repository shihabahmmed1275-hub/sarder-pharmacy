import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAU56NV8SlXIEPSd4qWrxnjoNbagnUR0hk",
  authDomain: "sarder-medical-hall.firebaseapp.com",
  databaseURL: "https://sarder-medical-hall-default-rtdb.firebaseio.com",
  projectId: "sarder-medical-hall",
  storageBucket: "sarder-medical-hall.firebasestorage.app",
  messagingSenderId: "187686836659",
  appId: "1:187686836659:web:a90917664726f6772d13c6",
  measurementId: "G-MD14FZ04V0"
};

// Next.js-এ বারবার অ্যাপ রি-ইনিশিয়ালাইজেশন হওয়া রোধ করতে
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);