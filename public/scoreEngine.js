import { db } from "./firebaseConfig.js";
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

  const winnersQuery = query(
    collection(db, "winnersManual"),
    where("day", "==", today)
  );

  const snapshot = await getDocs(winnersQuery);

  if (snapshot.empty) {
    alert("No winners added.");
    return;
  }

  for (const winnerDoc of snapshot.docs) {
    const winner = winnerDoc.data();

    const userRef = doc(db, "users", winner.name);
    const userSnap = await getDocs(query(collection(db,"users"), where("name","==",winner.name)));

    let points = winner.rank === 1 ? 5 : 3;

    if (!userSnap.empty) {
      const userDocument = userSnap.docs[0];
      await updateDoc(userDocument.ref, {
        points: (userDocument.data().points || 0) + points
      });
    } else {
      await addDoc(collection(db,"users"), {
        name: winner.name,
        points: points
      });
    }

    await addDoc(collection(db, "dailyScores"), {
      day: today,
      category: winner.category,
      correctAnswer: winner.correctAnswer,
      first: winner.rank === 1 ? winner.name : "",
      second: winner.rank === 2 ? winner.name : ""
    });

    await deleteDoc(winnerDoc.ref);
  }

  alert("Day Finalized Successfully!");
}