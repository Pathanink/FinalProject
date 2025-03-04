import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDVy16XZdGWZxxOYQQ1TFuIEu22uOhaTc4",
    authDomain: "finalproject-c037e.firebaseapp.com",
    projectId: "finalproject-c037e",
    storageBucket: "finalproject-c037e.firebasestorage.app",
    messagingSenderId: "294930330109",
    appId: "1:294930330109:web:8d06bbecbf790f558b2994"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
