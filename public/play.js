import { db, auth } from "./firebaseInit.js";
import { evaluateAnswer } from "./scoreEngine.js";

import {
 doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ================= TIME HELPERS ================= */

function nowCairo(){
  return new Date(
    new Date().toLocaleString("en-US",{timeZone:"Africa/Cairo"})
  );
}

function quizOpenTime(){
  const n = nowCairo();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 22,0,0);
}

function quizCloseTime(){
  return new Date(quizOpenTime().getTime() + 40*60*1000);
}

/* ================= AUTH ================= */

onAuthStateChanged(auth,(user)=>{
 if(!user){
   location.href="login.html";
   return;
 }
 startPage();
});

/* ================= START ================= */

async function startPage(){
 await loadHijri();
 await checkAndLoad();
 startTimer();
 setupVoice();
}

/* ================= CURRENT DAY ================= */

async function getCurrentDay(){
 const snap = await getDoc(doc(db,"config","current"));
 return snap.data().currentDay;
}

/* ================= TIMER ================= */

function startTimer(){

 const el=document.getElementById("mainTimer");
 if(!el) return;

 setInterval(()=>{

  const now = nowCairo();

  if(now < quizOpenTime()){
    el.textContent="The question will appear at 10:00 PM";
    lockAllBoxes();
    return;
  }

  if(now < quizCloseTime()){
    const sec = Math.floor((quizCloseTime()-now)/1000);
    const m=Math.floor(sec/60);
    const s=sec%60;
    el.textContent=`${m}:${s.toString().padStart(2,'0')}`;
    return;
  }

  el.textContent="Closed";
  lockAllBoxes();

 },1000);
}

/* ================= LOAD QUESTIONS ================= */

async function checkAndLoad(){

 const now = nowCairo();

 if(now < quizOpenTime()){
  setLockedText("The question will appear at 10:00 PM");
  return;
 }

 if(now > quizCloseTime()){
  setLockedText("Closed");
  return;
 }

 const day = await getCurrentDay();

 const snap = await getDoc(doc(db,"daily",day));
 if(!snap.exists()) return;

 const d = snap.data();

 document.querySelector(".islamic .question").textContent=d.islamic.q;
 document.querySelector(".general .question").textContent=d.general.q;
 document.querySelector(".sports .question").textContent=d.sports.q;
}

function setLockedText(msg){
 document.querySelectorAll(".question")
  .forEach(q=>q.textContent=msg);
 lockAllBoxes();
}

/* ================= SUBMIT ================= */

const quizStartTime = Date.now();

document.querySelectorAll(".submit-btn").forEach(btn=>{
 btn.onclick = async function(){

  const now = nowCairo();

  if(now < quizOpenTime() || now > quizCloseTime()){
    alert("Quiz is closed");
    return;
  }

  const box=this.closest(".challenge-box");
  const cat=box.dataset.cat;

  const val=box.querySelector("input").value.trim();
  if(!val){
    alert("Type answer first");
    return;
  }

  const seconds =
   Math.floor((Date.now()-quizStartTime)/1000);

  const res = await evaluateAnswer(cat,val,seconds);

  if(res.msg==="already"){
    alert("You already answered this category");
    return;
  }

  alert("تم استلام إجابتك بنجاح! انتظر النتائج النهائية 🌙");

  box.querySelector("input").disabled=true;
  btn.disabled=true;
 };
});

/* ================= LOCK ================= */

function lockAllBoxes(){
 document.querySelectorAll("input,.submit-btn")
 .forEach(e=>e.disabled=true);
}

/* ================= HIJRI API ================= */

async function loadHijri(){
 try{
  const now = new Date();
  const day = String(now.getDate()).padStart(2,'0');
  const month = String(now.getMonth()+1).padStart(2,'0');
  const year = now.getFullYear();

  const r = await fetch(
   `https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`
  );

  const j = await r.json();
  const h = j.data.hijri;

  document.getElementById("hijriDate").textContent =
   `${h.day} ${h.month.en} ${h.year} AH`;

 }catch(e){
  console.log("hijri error",e);
 }
}

/* ================= VOICE ================= */

function setupVoice(){

 const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
 if(!SR) return;

 document.querySelectorAll(".voice-btn").forEach(btn=>{
  btn.onclick=()=>{
   const rec=new SR();
   rec.lang="ar";
   rec.start();

   rec.onresult=e=>{
    btn.closest(".challenge-box")
     .querySelector("input").value =
       e.results[0][0].transcript;
   };
  };
 });
}