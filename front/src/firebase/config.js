// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDlq9I4oW6s0kr4t6Wm-eCJNXf4K2vuqfs",
    authDomain: "smartmodeller.firebaseapp.com",
    projectId: "smartmodeller",
    storageBucket: "smartmodeller.appspot.com",
    messagingSenderId: "503671038523",
    appId: "1:503671038523:web:85578bb93dfa3777c5721e",
    measurementId: "G-FHJ85NWBDD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth , db};