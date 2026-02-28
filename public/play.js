import { db } from "./firebaseInit.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const resultsContainer = document.getElementById("resultsContainer");

// دالة لتحديد النقاط بناءً على الفئة للعرض فقط
function getCategoryPoints(category) {
    const cat = category.toLowerCase();
    if (cat.includes("islam")) return "3 pts";
    if (cat.includes("general")) return "2 pts";
    if (cat.includes("sports")) return "1 pt";
    return "";
}

async function loadTodayResults() {
  // استخدام تاريخ اليوم الفعلي
  const today = new Date().toISOString().split("T")[0];

  const q = query(
    collection(db, "dailyScores"),
    where("day", "==", today)
  );

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="card" style="justify-content: center; border-style: dashed;">
          <div class="winner" style="text-align: center;">No results yet.</div>
          <div class="correct-label">Check back later tonight!</div>
        </div>
      `;
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const pts = getCategoryPoints(data.category);

      html += `
        <div class="card">
          <div class="category">${data.category} <small>(${pts})</small></div>
          
          <div class="winners-list">
            <div class="winner">🥇 1st: ${data.first || "No Winner"}</div>
            <div class="winner">🥈 2nd: ${data.second || "No Winner"}</div>
          </div>

          <div class="divider"></div>

          <div class="answer-box">
            <span class="correct-label">CORRECT ANSWER:</span>
            <div class="correct-val">${data.correctAnswer}</div>
          </div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;
  } catch (error) {
    console.error("Error loading results:", error);
    resultsContainer.innerHTML = "<p>Error loading data. Please try again.</p>";
  }
}

loadTodayResults();