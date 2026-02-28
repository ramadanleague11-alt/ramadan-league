import { db } from "./firebaseInit.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function finalizeDay() {
  const today = new Date().toISOString().split("T")[0];

  // قاموس النقاط الجديد
  const pointsTable = {
    "Islam": 3,
    "General": 2,
    "Sports": 1
  };

  const winnersQuery = query(
    collection(db, "winnersManual"),
    where("day", "==", today)
  );

  const snapshot = await getDocs(winnersQuery);

  // حالة عدم وجود فائزين (تعديلك)
  if (snapshot.empty) {
    await addDoc(collection(db, "dailyScores"), {
      day: today,
      category: "None",
      correctAnswer: "No correct answers today",
      first: "",
      second: ""
    });
    alert("No winners today, dailyScores created with empty results.");
    return;
  }

  // معالجة كل فائز
  for (const winnerDoc of snapshot.docs) {
    const winner = winnerDoc.data();
    
    // النقاط بناءً على الفئة (Rank 1 & 2 بياخدوا نفس النقاط)
    const pointsToAdd = pointsTable[winner.category] || 0;

    // 1. تحديث نقاط المستخدم
    const userQuery = query(collection(db, "users"), where("name", "==", winner.name));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      const userDocRef = userSnap.docs[0].ref;
      const currentPoints = userSnap.docs[0].data().points || 0;
      await updateDoc(userDocRef, { points: currentPoints + pointsToAdd });
    } else {
      await addDoc(collection(db, "users"), {
        name: winner.name,
        points: pointsToAdd
      });
    }

    // 2. إضافة السجل اليومي للعرض في صفحة play.html
    await addDoc(collection(db, "dailyScores"), {
      day: today,
      category: winner.category,
      correctAnswer: winner.correctAnswer,
      first: winner.rank === 1 ? winner.name : "",
      second: winner.rank === 2 ? winner.name : ""
    });

    // 3. حذف من القائمة المؤقتة
    await deleteDoc(winnerDoc.ref);
  }

  alert("Day Finalized! Points updated based on categories.");
}