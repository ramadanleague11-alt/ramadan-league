import { db, auth } from "./firebaseInit.js";
import { submitAnswer } from "./scoreEngine.js";
import { doc, getDoc }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* =========================
   TIME SETTINGS (TEST 12:30)
========================= */

function nowCairo(){
 return new Date(
  new Date().toLocaleString(
   "en-US",{timeZone:"Africa/Cairo"}
  )
 );
}

function quizOpenTime(){
 const n = nowCairo();
 return new Date(
  n.getFullYear(),
  n.getMonth(),
  n.getDate(),
  0,30,0   // ⬅ 12:30 AM
 );
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

/* ========================= */

function startPage(user){
 loadQuestions();
 startTimer();
}

/* =========================
   DAY INDEX
========================= */

function dayIndex(){
 return "day1"; // ⬅ للاختبار فقط
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

  if(now < quizOpenTime()){
   el.textContent="Waiting...";
   return;
  }

  if(now < quizCloseTime()){
   const sec =
    Math.floor(
     (quizCloseTime()-now)/1000
    );
   const m=Math.floor(sec/60);
   const s=sec%60;
   el.textContent=
    `${m}:${s.toString().padStart(2,'0')}`;
   return;
  }

  el.textContent="Closed";
  lockAllBoxes();

 },1000);
}

/* =========================
   LOAD QUESTIONS
========================= */

async function loadQuestions(){

 const now = nowCairo();

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

/* ========================= */

function setLockedText(msg){
 document.querySelectorAll(".question")
 .forEach(q=>q.textContent=msg);
}

function lockAllBoxes(){
 document.querySelectorAll(
 "input,.submit-btn"
 ).forEach(e=>e.disabled=true);
}

/* =========================
   SUBMIT
========================= */

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

  const box =
  this.closest(".challenge-box");

  const cat =
  box.dataset.cat;

  const val =
  box.querySelector("input")
  .value.trim();

  const seconds =
  Math.floor(
   (Date.now()-quizOpenTime().getTime())/1000
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

  alert("Submitted");
 };
});