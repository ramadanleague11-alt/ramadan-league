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
  
  // تعريف النقاط المتساوية للفائزين حسب الفئة كما شرحت لي
  const pointsTable = { 
    "Islam": 3, 
    "General": 2, 
    "Sports": 1 
  };

  const winnersQuery = query(collection(db, "winnersManual"), where("day", "==", today));
  const snapshot = await getDocs(winnersQuery);

  if (snapshot.empty) {
    alert("No entries found in the temporary list for today.");
    return;
  }

  const categorySummary = {};

  for (const winnerDoc of snapshot.docs) {
    const winner = winnerDoc.data();
    const cat = winner.category;

    if (!categorySummary[cat]) {
      categorySummary[cat] = { 
        day: today, 
        category: cat, 
        correctAnswer: winner.correctAnswer, 
        first: "No Winner", 
        second: "No Winner" 
      };
    }

    if (winner.rank === 1) categorySummary[cat].first = winner.name;
    if (winner.rank === 2) categorySummary[cat].second = winner.name;

    // منطق توزيع النقاط المتساوي (Rank 1 & Rank 2 يحصلان على نفس النقاط)
    if (winner.name && winner.name !== "No Winner" && winner.name !== "") {
      
      // التأكد من مطابقة اسم الفئة حتى لو اختلف حالة الأحرف
      const pointsToAdd = pointsTable[cat] || 0;

      if (pointsToAdd > 0) {
        const userQuery = query(collection(db, "users"), where("name", "==", winner.name));
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const userDocRef = userSnap.docs[0].ref;
          const currentPoints = userSnap.docs[0].data().points || 0;
          // إضافة النقاط كاملة (3 لـ Islam، 2 لـ General، 1 لـ Sports)
          await updateDoc(userDocRef, { points: currentPoints + pointsToAdd });
        } else {
          // إذا كان المستخدم جديداً، يتم إنشاؤه بالنقاط كاملة
          await addDoc(collection(db, "users"), { name: winner.name, points: pointsToAdd });
        }
      }
    }

    // حذف من القائمة المؤقتة بعد معالجة نقاطه
    await deleteDoc(winnerDoc.ref);
  }

  // حفظ سجل النتائج اليومي للعرض في صفحة play.html
  for (const cat in categorySummary) {
    await addDoc(collection(db, "dailyScores"), categorySummary[cat]);
  }

  alert("Day Finalized! Both winners received equal points per category.");
}