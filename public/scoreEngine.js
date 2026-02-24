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

/* ================= SUBMIT (NO SCORING HERE) ================= */

export async function evaluateAnswer(cat,userAnswer,time){

 const user = auth.currentUser;
 if(!user) return {ok:false};

 const configSnap = await getDoc(doc(db,"config","current"));
 const day = configSnap.data().currentDay;

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

 const dailyDoc = await getDoc(doc(db,"daily",day));
 if(!dailyDoc.exists()) return {ok:false};

 const correctAnswers = dailyDoc.data()[cat].answers;
 const ok = fuzzyMatch(userAnswer,correctAnswers);

 await addDoc(collection(db,"answers"),{
  uid:user.uid,
  name:user.displayName,
  cat,
  day,
  answer:userAnswer,
  ok,
  time,
  ts:serverTimestamp()
 });

 return {ok};
}

/* ================= FINALIZE DAY ================= */

export async function finalizeDay(day){

 // منع التكرار
 const flagRef = doc(db,"finalizedDays",day);
 const flagSnap = await getDoc(flagRef);

 if(flagSnap.exists()){
  console.log("Already finalized");
  return;
 }

 const answersRef = collection(db,"answers");
 const playersBest = {};

 for(const cat of ["islamic","general","sports"]){

   const q = query(
     answersRef,
     where("day","==",day),
     where("cat","==",cat),
     where("ok","==",true),
     orderBy("ts","asc")
   );

   const snap = await getDocs(q);

   let i = 0;

   for(const docSnap of snap.docs){

     if(i >= 2) break;

     const data = docSnap.data();
     const pts = CAT_POINTS[cat];

     await addDoc(collection(db,"dailyScores"),{
       uid:data.uid,
       name:data.name,
       cat,
       day,
       rank:i+1,
       pts,
       ts:serverTimestamp()
     });

     // أعلى cat فقط
     if(!playersBest[data.uid] || pts > playersBest[data.uid].pts){
       playersBest[data.uid] = {
         name:data.name,
         pts
       };
     }

     i++;
   }
 }

 // تحديث users بأعلى cat فقط
 for(const uid in playersBest){

   const player = playersBest[uid];
   const userRef = doc(db,"users",uid);
   const userSnap = await getDoc(userRef);

   const prev = userSnap.exists()
     ? (userSnap.data().points || 0)
     : 0;

   await setDoc(userRef,{
     name:player.name,
     points: prev + player.pts
   },{merge:true});
 }

 await setDoc(flagRef,{
   day,
   ts:serverTimestamp()
 });

 console.log("Day Finalized Successfully");
}