import { getAuth, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
 getFirestore, collection, getDocs,
 query, orderBy, limit, where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { app } from "./firebaseInit.js";

const db=getFirestore(app);
const auth=getAuth(app);

function todayKey(){
 return new Date().toISOString().slice(0,10);
}

/* DAILY */

async function loadDaily(){

 const list=document.getElementById("dailyList");
 list.innerHTML="";

 const snap = await getDocs(
  query(
   collection(db,"dailyScores"),
   where("day","==",todayKey()),
   orderBy("pts","desc"),
   limit(20)
  )
 );

 let r=1;
 snap.forEach(d=>{
  const x=d.data();
  const li=document.createElement("li");
  li.textContent=`${r}. ${x.name} — ${x.pts} pts`;
  list.appendChild(li);
  r++;
 });
}

/* OVERALL */

async function loadOverall(){

 const list=document.getElementById("overallList");
 list.innerHTML="";

 const snap = await getDocs(
  query(collection(db,"users"),
  orderBy("points","desc"),limit(20))
 );

 let r=1;
 snap.forEach(d=>{
  const u=d.data();
  const li=document.createElement("li");
  li.textContent=
   `${r}. ${u.name||"User"} — ${u.points||0}`;
  list.appendChild(li);
  r++;
 });
}

/* INIT */

loadDaily();
loadOverall();

onAuthStateChanged(auth,u=>{
 if(!u) return;
});