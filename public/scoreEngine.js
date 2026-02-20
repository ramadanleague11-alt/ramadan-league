import { db,auth } from "./firebaseInit.js";
import {
 collection, addDoc, getDocs, query, where,
 orderBy, doc, setDoc, getDoc,
 serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CAT_POINTS = {
 islamic: 3,
 general: 2,
 sports: 1
};

/* ================= NORMALIZER ================= */

function normalize(text){
 return text
  .toLowerCase()
  .replace(/[أإآ]/g,"ا")
  .replace(/ة/g,"ه")
  .replace(/ى/g,"ي")
  .replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .replace(/[^a-z0-9\u0600-\u06FF]+/gi," ")
  .replace(/\s+/g," ")
  .trim();
}

function fuzzyMatch(userAnswer, correctAnswers){
 if(!Array.isArray(correctAnswers)) return false;
 const user = normalize(userAnswer);
 return correctAnswers.every(ans =>
   user.includes(normalize(ans))
 );
}

/* ================= MAIN SUBMIT ================= */

export async function evaluateAnswer(cat,userAnswer,time){

 const user = auth.currentUser;
 if(!user) return {ok:false};

 const configSnap = await getDoc(doc(db,"config","current"));
const day = configSnap.data().currentDay;

 /* منع تكرار نفس الكاتيجوري */

 const alreadyQ = query(
  collection(db,"answers"),
  where("uid","==",user.uid),
  where("day","==",day),
  where("cat","==",cat)
 );

 const alreadySnap = await getDocs(alreadyQ);

 if(!alreadySnap.empty){
  return {ok:false, msg:"already"};
 }

 /* جلب الاجابة الصحيحة */

 const dailyDoc = await getDoc(doc(db,"daily",day));
 if(!dailyDoc.exists()) return {ok:false};

 const correctAnswers = dailyDoc.data()[cat].answers;

 const ok = fuzzyMatch(userAnswer,correctAnswers);

 await addDoc(collection(db,"answers"),{
  uid:user.uid,
  name:user.displayName,
  cat,day,
  answer:userAnswer,
  ok,
  time,
  ts:serverTimestamp()
 });

 if(!ok) return {ok:false};

 /* ترتيب السرعة */

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
  if(d.data().uid === user.uid){
   rank = i+1;
  }
 });

 if(rank === 0 || rank > 2){
  return {ok:true, rank:null};
 }

 /* تسجيل فائز */

 await addDoc(collection(db,"dailyScores"),{
  uid:user.uid,
  name:user.displayName,
  cat,
  day,
  pts: CAT_POINTS[cat],
  rank,
  ts:serverTimestamp()
 });

 await recomputeBestOfDay(user.uid,user.displayName,day);

 return {ok:true, rank};
}

/* ================= BEST OF DAY ================= */

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

 const uref = doc(db,"users",uid);
 const udoc = await getDoc(uref);

 const prev = udoc.exists()
  ? (udoc.data().points || 0)
  : 0;

 await setDoc(uref,{
  name,
  points: prev + best
 },{merge:true});
}