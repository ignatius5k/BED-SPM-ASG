import { db } from "./firebase.js";
import {
  doc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function saveProfile(uid, role, profile) {
  if (!uid) {
    throw new Error("Missing user id");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      role,
      ...profile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
