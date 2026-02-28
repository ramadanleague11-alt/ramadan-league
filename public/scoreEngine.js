import { db } from "./firebaseInit.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function finalizeDay() {
  const today = new Date().toISOString().split("T")[0];
  const pointsTable = { "Islam": 3, "General": 2, "Sports": 1 };

  const winnersQuery = query(collection(db, "winnersManual"), where("day", "==", today));
  const snapshot = await getDocs(winnersQuery);

  if (snapshot.empty) {
    alert("No entries found in the temporary list for today.");
    return;
  }

  // كائن لتجميع الفائزين حسب الفئة قبل الحفظ
  const categorySummary = {};

  for (const winnerDoc of snapshot.docs) {
    const winner = winnerDoc.data();
    const cat = winner.category;

    // تجهيز الكائن للفئة إذا لم تكن موجودة
    if (!categorySummary[cat]) {
      categorySummary[cat] = { day: today, category: cat, correctAnswer: winner.correctAnswer, first: "No Winner", second: "No Winner" };
    }

    // تعيين الأسماء حسب المركز
    if (winner.rank === 1) categorySummary[cat].first = winner.name;
    if (winner.rank === 2) categorySummary[cat].second = winner.name;

    // تحديث النقاط (فقط إذا كان هناك اسم فائز حقيقي)
    if (winner.name !== "No Winner") {
      const pointsToAdd = pointsTable[cat] || 0;
      const userQuery = query(collection(db, "users"), where("name", "==", winner.name));
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        const userDocRef = userSnap.docs[0].ref;
        const currentPoints = userSnap.docs[0].data().points || 0;
        await updateDoc(userDocRef, { points: currentPoints + pointsToAdd });
      } else {
        await addDoc(collection(db, "users"), { name: winner.name, points: pointsToAdd });
      }
    }

    // حذف من القائمة المؤقتة بعد المعالجة
    await deleteDoc(winnerDoc.ref);
  }

  // حفظ النتائج المجمعة في dailyScores (سجل واحد لكل فئة)
  for (const cat in categorySummary) {
    await addDoc(collection(db, "dailyScores"), categorySummary[cat]);
  }

  alert("Day Finalized! Winners organized and points updated.");
}