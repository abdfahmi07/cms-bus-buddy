import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBVZzX_-OvWLFDR_ig6JTYmlMxVj0n34uM",
  authDomain: "bus-buddy-212ab.firebaseapp.com",
  projectId: "bus-buddy-212ab",
  storageBucket: "bus-buddy-212ab.appspot.com",
  messagingSenderId: "296484510978",
  appId: "1:296484510978:web:55516618e731c1a856361b",
  measurementId: "G-ZQLLW16MJ4",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

export { app, db, storage, auth }
