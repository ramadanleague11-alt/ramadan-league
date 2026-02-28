import { db } from "./firebaseInit.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const resultsContainer = document.getElementById("resultsContainer");

async function loadTodayResults() {
  const today = new Date().toISOString().split("T")[0];

  const q = query(
    collection(db, "dailyScores"),
    where("day", "==", today)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    resultsContainer.innerHTML = `
      <div class="card">
        <div class="category">No results yet</div>
        <div class="winner">Check back after the challenge ends.</div>
      </div>
    `;
    return;
  }

  let html = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    html += `
      <div class="card">
        <div class="category">${data.category}</div>
        <div class="winner">🥇 ${data.first || "-"}</div>
        <div class="winner">🥈 ${data.second || "-"}</div>
        <div class="correct">Correct Answer: ${data.correctAnswer}</div>
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

loadTodayResults();