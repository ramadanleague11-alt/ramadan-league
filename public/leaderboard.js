import { getAuth, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
 getFirestore, collection, getDocs,
 query, orderBy, limit, where,
 doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { app } from "./firebaseInit.js";

const db = getFirestore(app);
const auth = getAuth(app);

/* ================= CURRENT DAY ================= */

async function getCurrentDay(){
 const snap = await getDoc(doc(db,"config","current"));
 if(!snap.exists()) return null;
 return snap.data().currentDay;
}

/* ================= DAILY LEADERBOARD ================= */

async function loadDaily(){

 const list = document.getElementById("dailyList");
 if(!list) return;

 list.innerHTML = "Loading...";

 const day = await getCurrentDay();
 if(!day){
  list.innerHTML = "No active day";
  return;
 }

 const snap = await getDocs(
  query(
   collection(db,"dailyScores"),
   where("day","==",day),
   orderBy("pts","desc"),
   limit(20)
  )
 );

 list.innerHTML = "";

 if(snap.empty){
  list.innerHTML = "No results yet";
  return;
 }

 let rank = 1;

 snap.forEach(d=>{
  const x = d.data();

  const li = document.createElement("li");
  li.textContent =
   `${rank}. ${x.name || "User"} — ${x.pts} pts`;

  list.appendChild(li);
  rank++;
 });
}

/* ================= OVERALL LEADERBOARD ================= */

async function loadOverall(){

 const list = document.getElementById("overallList");
 if(!list) return;

 list.innerHTML = "Loading...";

 const snap = await getDocs(
  query(
   collection(db,"users"),
   orderBy("points","desc"),
   limit(20)
  )
 );

 list.innerHTML = "";

 if(snap.empty){
  list.innerHTML = "No results yet";
  return;
 }

 let rank = 1;

 snap.forEach(d=>{
  const u = d.data();

  const li = document.createElement("li");
  li.textContent =
   `${rank}. ${u.name || "User"} — ${u.points || 0} pts`;

  list.appendChild(li);
  rank++;
 });
}

/* ================= INIT ================= */

async function init(){
 await loadDaily();
 await loadOverall();
}

onAuthStateChanged(auth, user=>{
 if(!user) return;
 init();
});