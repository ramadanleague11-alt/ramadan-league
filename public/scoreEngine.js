import { db } from "./firebaseInit.js";
import {
 collection, addDoc, getDocs, query, where,
 orderBy, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CAT_POINTS = {
 islamic: 3,
 general: 2,
 sports: 1
};

/* =========================
   NORMALIZER (AR + EN)
========================= */

function norm(s){
 return s
  .toLowerCase()
  .replace(/[أإآ]/g,"ا")
  .replace(/ة/g,"ه")
  .replace(/ى/g,"ي")
  .replace(/[^\p{L}\p{N}]+/gu,"")
  .trim();
}

/* ========================= */

function singleMatch(input, answers){
 const n = norm(input);
 return answers.some(a => norm(a) === n);
}

function multiMatch(input, answers){

 const userParts = input
   .split(/,|and|&/gi)
   .map(x => norm(x))
   .filter(x => x);

 const correctParts =
  answers.map(x => norm(x));

 if(userParts.length !== correctParts.length)
   return false;

 return correctParts.every(a =>
  userParts.includes(a)
 );
}

function checkAnswer(userAnswer, correctAnswers){

 if(correctAnswers.length > 1){
   return multiMatch(userAnswer, correctAnswers);
 }else{
   return singleMatch(userAnswer, correctAnswers);
 }
}

/* =========================
   SUBMIT
========================= */

export async function submitAnswer({
 uid,name,cat,day,userAnswer,correctAnswers,time
}){

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

const ok =
 checkAnswer(userAnswer,correctAnswers);

await addDoc(collection(db,"answers"),{
 uid,name,cat,day,
 answer:userAnswer,
 ok,
 time,
 ts:serverTimestamp()
});

if(!ok) return;

/* Top2 */

const winnersQ = query(
 collection(db,"dailyScores"),
 where("day","==",day),
 where("cat","==",cat)
);

const winnersSnap = await getDocs(winnersQ);
if(winnersSnap.size >= 2) return;

/* Rank by speed */

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

await addDoc(collection(db,"dailyScores"),{
 uid,name,cat,day,
 pts: CAT_POINTS[cat],
 rank,
 ts:serverTimestamp()
});
}