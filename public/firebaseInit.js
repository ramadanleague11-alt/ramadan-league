import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { getFirestore, doc, setDoc } from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBb6cXv4VMlaIYzSwH7P7j4HaMzC8r8Vqg",
  authDomain: "ramadan-league-fe4b6.firebaseapp.com",
  projectId: "ramadan-league-fe4b6",
  storageBucket: "ramadan-league-fe4b6.firebasestorage.app",
  messagingSenderId: "764615319228",
  appId: "1:764615319228:web:b0cdc7d639f7d699dc7ab9"
};

export const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ===== AUTO CREATE USER DOC ===== */

onAuthStateChanged(auth, async (user)=>{
  if(!user) return;

  await setDoc(doc(db,"users",user.uid),{
    name: user.displayName || "player",
    email: user.email || "",
    points: 0,
    streak: 0,
    createdAt: new Date()
  }, { merge:true });

  console.log("user doc ensured");
});

export { auth, db };
