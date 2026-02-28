import { db } from "./firebaseInit.js";
import { 
  collection, getDocs, query, orderBy, limit, where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadOverall() {
  const list = document.getElementById("overallList");
  if (!list) return;
  list.innerHTML = "<li>Loading Overall Ranking...</li>";

  try {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(20));
    const snap = await getDocs(q);
    
    list.innerHTML = "";
    if (snap.empty) {
        list.innerHTML = "<li>No players found yet.</li>";
        return;
    }

    let rank = 1;
    snap.forEach(doc => {
      const u = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="rank">#${rank}</span>
        <span class="name">${u.name}</span>
        <span class="pts">${u.points || 0} pts</span>
      `;
      list.appendChild(li);
      rank++;
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = "<li>Error loading data.</li>";
  }
}

async function loadDaily() {
  const list = document.getElementById("dailyList");
  if (!list) return;
  
  const today = new Date().toISOString().split("T")[0];
  const q = query(collection(db, "dailyScores"), where("day", "==", today));
  const snap = await getDocs(q);

  list.innerHTML = "";
  if (snap.empty) {
    list.innerHTML = "<li>No winners announced for today yet.</li>";
    return;
  }

  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="daily-card">
        <strong>${d.category}</strong>: 🥇 ${d.first} | 🥈 ${d.second}
      </div>
    `;
    list.appendChild(li);
  });
}

// تشغيل الوظائف فور تحميل الصفحة دون انتظار تسجيل الدخول
loadOverall();
loadDaily();