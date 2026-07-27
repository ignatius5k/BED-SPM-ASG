import { GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth, db } from "../firebase.js";

const provider = new GoogleAuthProvider();

export { auth, db, provider };
