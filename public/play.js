import { db, auth } from "./firebaseInit.js";
import { submitAnswer } from "./scoreEngine.js";

import {
 doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


/* =========================
   RAMADAN START — CAIRO
========================= */

const RAMADAN_START =
 new Date("2026-02-19T22:00:00+02:00");


/* =========================
   TIME HELPERS
========================= */

function nowCairo(){
 return new Date(
  new Date().toLocaleString(
   "en-US",{timeZone:"Africa/Cairo"}
  )
 );
}

function today10pm(){
 const n = nowCairo();
 return new Date(
  n.getFullYear(),
  n.getMonth(),
  n.getDate(),
  22,0,0
 );
}

function quizOpenTime(){
 return today10pm();
}

function quizCloseTime(){
 return new Date(
  quizOpenTime().getTime()
  + 40*60*1000
 );
}


/* =========================
   AUTH
========================= */

onAuthStateChanged(auth,(user)=>{
 if(!user){
  location.href="login.html";
  return;
 }
 startPage(user);
});


/* =========================
   START PAGE
========================= */

function startPage(user){
 loadHijri();
 loadQuestions();
 startTimer();
 setupVoice();
}


/* =========================
   DAY INDEX REAL
========================= */

function dayIndex(){
 const diff =
 Math.floor(
  (nowCairo()-RAMADAN_START)/86400000
 );
 return "day"+(diff+1);
}


/* =========================
   TIMER
========================= */

function startTimer(){

 const el =
 document.getElementById("mainTimer");

 if(!el) return;

 setInterval(()=>{

  const now = nowCairo();

  if(now < RAMADAN_START){
   el.textContent="Starts in Ramadan";
   return;
  }

  if(now < quizOpenTime()){
   show(
    Math.floor(
     (quizOpenTime()-now)/1000
    )
   );
   return;
  }

  if(now < quizCloseTime()){
   show(
    Math.floor(
     (quizCloseTime()-now)/1000
    )
   );
   return;
  }

  el.textContent="Closed";
  lockAllBoxes();

 },1000);

 function show(sec){
  const m=Math.floor(sec/60);
  const s=sec%60;
  el.textContent=
   `${m}:${s.toString().padStart(2,'0')}`;
 }
}


/* =========================
   LOAD QUESTIONS
========================= */

async function loadQuestions(){

 const now = nowCairo();

 if(now < RAMADAN_START){
  setLockedText(
   "Locked until Ramadan 🌙"
  );
  lockAllBoxes();
  return;
 }

 if(now < quizOpenTime()){
  setLockedText(
   "The question will appear at 10:00 PM"
  );
  lockAllBoxes();
  return;
 }

 const day = dayIndex();

 const snap =
 await getDoc(doc(db,"daily",day));

 if(!snap.exists()){
  console.log("no doc:",day);
  return;
 }

 const d = snap.data();

 document.querySelector(
  ".islamic .question"
 ).textContent=d.islamic.q;

 document.querySelector(
  ".general .question"
 ).textContent=d.general.q;

 document.querySelector(
  ".sports .question"
 ).textContent=d.sports.q;
}

function setLockedText(msg){
 document.querySelectorAll(".question")
 .forEach(q=>q.textContent=msg);
}


/* =========================
   SUBMIT ANSWER
========================= */

const quizStartTime = Date.now();

document.querySelectorAll(
 ".submit-btn"
).forEach(btn=>{

 btn.onclick = async function(){

  const now = nowCairo();

  if(now < quizOpenTime()
  || now > quizCloseTime()){
   alert("Quiz is closed");
   return;
  }

  const user =
  auth.currentUser;

  if(!user) return;

  const box =
  this.closest(".challenge-box");

  const cat =
  box.dataset.cat;

  const val =
  box.querySelector("input")
  .value.trim();

  if(!val){
   alert("Type answer first");
   return;
  }

  const seconds =
  Math.floor(
   (Date.now()-quizStartTime)/1000
  );

  const day = dayIndex();

  const qSnap =
  await getDoc(doc(db,"daily",day));

  const answers =
  qSnap.data()[cat].answers;

  await submitAnswer({
   uid:user.uid,
   name:user.displayName || "Player",
   cat,
   day,
   userAnswer:val,
   correctAnswers:answers,
   time:seconds
  });

  box.querySelector("input")
  .disabled=true;

  btn.disabled=true;

  alert("Submitted");
 };
});


/* =========================
   LOCK INPUTS
========================= */

function lockAllBoxes(){
 document.querySelectorAll(
 "input,.submit-btn"
 ).forEach(e=>e.disabled=true);
}


/* =========================
   HIJRI DATE
========================= */

async function loadHijri(){
 try{
  const today=
  new Date()
  .toISOString()
  .split("T")[0];

  const r=await fetch(
   `https://api.aladhan.com/v1/gToH?date=${today}`
  );

  const j=await r.json();
  const h=j.data.hijri;

  const el=
  document.getElementById(
   "hijriDate"
  );

  if(el){
   el.textContent=
    `${h.day} ${h.month.en} ${h.year} AH`;
  }

 }catch(e){
  console.log("hijri error",e);
 }
}


/* =========================
   VOICE INPUT
========================= */

function setupVoice(){

 const SR =
 window.SpeechRecognition
 || window.webkitSpeechRecognition;

 if(!SR) return;

 document.querySelectorAll(
 ".voice-btn"
 ).forEach(btn=>{

  btn.onclick=()=>{

   const rec=new SR();
   rec.lang="ar";
   rec.start();

   rec.onresult=e=>{
    btn.closest(
     ".challenge-box"
    )
    .querySelector("input")
    .value=
    e.results[0][0]
    .transcript;
   };
  };
 });
}