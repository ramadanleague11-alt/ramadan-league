import { db } from "./firebaseInit.js";
import {
 collection, addDoc, getDocs, query, where,
 orderBy, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================
   CATEGORY POINTS
========================= */

const CAT_POINTS = {
 islamic: 3,
 general: 2,
 sports: 1
};

/* =========================
   FUZZY NORMALIZER (UPGRADED)
========================= */

function norm(s){
 return s
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu,"")
  .trim();
}

function fuzzyMatch(input, answers){
 const n = norm(input);
 return answers.some(a => norm(a) === n);
}

/* =========================
   MAIN SUBMIT
========================= */

export async function submitAnswer({
 uid,name,cat,day,userAnswer,correctAnswers,time
}){

/* ---- prevent multi submit per cat ---- */

const alreadyQ = query(
 collection(db,"answers"),
 where("uid","==",uid),
 where("day","==",day),
 where("cat","==",cat)
);

const alreadySnap = await getDocs(alreadyQ);

if(!alreadySnap.empty){
 alert("You already answered this category");
 return;
}

/* ---- check correctness ---- */

const ok = fuzzyMatch(userAnswer,correctAnswers);

/* ---- log answer ---- */

await addDoc(collection(db,"answers"),{
 uid,name,cat,day,
 answer:userAnswer,
 ok,
 time,
 ts:serverTimestamp()
});

if(!ok) return;

/* =========================
   TOP2 LOCK
========================= */

const winnersQ = query(
 collection(db,"dailyScores"),
 where("day","==",day),
 where("cat","==",cat)
);

const winnersSnap = await getDocs(winnersQ);

if(winnersSnap.size >= 2){
 return; // already have top2
}

/* =========================
   RANK BY SPEED
========================= */

const correctQ = query(
 collection(db,"answers"),
 where("day","==",day),
 where("cat","==",cat),
 where("ok","==",true),
 orderBy("time","asc")
);

const correctSnap = await getDocs(correctQ);

let rank = 0;
correctSnap.forEach((d,i)=>{
 if(d.data().uid === uid){
  rank = i+1;
 }
});

if(rank === 0 || rank > 2) return;

/* =========================
   SAVE DAILY SCORE
========================= */

await addDoc(collection(db,"dailyScores"),{
 uid,name,cat,day,
 pts: CAT_POINTS[cat],
 rank,
 ts:serverTimestamp()
});

/* =========================
   BEST OF DAY LOGIC
========================= */

await recomputeBestOfDay(uid,name,day);
}

/* =========================
   BEST OF DAY CALC
========================= */

async function recomputeBestOfDay(uid,name,day){

const q = query(
 collection(db,"dailyScores"),
 where("uid","==",uid),
 where("day","==",day)
);

const snap = await getDocs(q);

let best = 0;

snap.forEach(d=>{
 const p = d.data().pts;
 if(p > best) best = p;
});

if(best === 0) return;

/* ---- update user total ---- */

const uref = doc(db,"users",uid);
const udoc = await getDoc(uref);

const prev = udoc.exists() ? (udoc.data().points || 0) : 0;

await setDoc(uref,{
 name,
 points: prev + best
},{merge:true});
}