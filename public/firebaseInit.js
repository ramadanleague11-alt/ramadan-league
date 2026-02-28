import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBb6cXv4VMlaIYzSwH7P7j4HaMzC8r8Vqg",
  authDomain: "ramadan-league-fe4b6.firebaseapp.com",
  projectId: "ramadan-league-fe4b6",
  storageBucket: "ramadan-league-fe4b6.firebasestorage.app",
  messagingSenderId: "764615319228",
  appId: "1:764615319228:web:b0cdc7d639f7d699dc7ab9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// هذا الجزء سيعمل فقط عند تسجيل دخول المستخدم (اختياري)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || "player",
      email: user.email || "",
      points: 0
    }, { merge: true });
    console.log("User doc ensured");
  }
});