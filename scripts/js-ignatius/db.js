import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase.js";

export async function saveProfile(userId, role, profile) {
  await setDoc(
    doc(db, "users", userId),
    { ...profile, role },
    { merge: true }
  );
}
