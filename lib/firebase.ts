import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth function
export async function signInWithGoogle(){
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

export async function signInWithEmail(email: string, password: string){
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function signUpWithEmail(email: string, password: string, name: string){
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // set display name in firebase
    await updateProfile(result.user, {displayName: name});
    return result.user;
}

export async function logOut() {
    await signOut(auth);
}

export {auth, onAuthStateChanged, type User};