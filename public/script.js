import { auth } from "./firebaseInit.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ===== AUTH NAVBAR CONTROL ===== */

const signBtn = document.getElementById("signBtn");
const navProfile = document.getElementById("navProfile");
const navAvatar = document.getElementById("navAvatar");
const profileName = document.getElementById("profileName");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth,(user)=>{

 if(!user){
   if(signBtn) signBtn.style.display="inline-block";
   if(navProfile) navProfile.style.display="none";
   return;
 }

 if(signBtn) signBtn.style.display="none";
 if(navProfile) navProfile.style.display="block";

 if(navAvatar) navAvatar.src = user.photoURL;
 if(profileName) profileName.textContent = user.displayName || "Player";
});

if(logoutBtn){
 logoutBtn.onclick = ()=>{
   signOut(auth);
   location.reload();
 };
}



/* =========================
   NAVBAR MOBILE TOGGLE — FINAL
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("navmenu");

  if (toggle && nav) {
    const icon = toggle.querySelector("i");

    toggle.addEventListener("click", () => {
      nav.classList.toggle("active");

      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-xmark");
      }
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");
        if (icon) {
          icon.classList.add("fa-bars");
          icon.classList.remove("fa-xmark");
        }
      });
    });
  }
});


/* =========================
   Cairo 10PM Countdown
========================= */

function getCairoTarget() {
  const now = new Date();
  const cairo = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
  );

  const target = new Date(cairo);
  target.setHours(22, 0, 0, 0);

  if (cairo > target) target.setDate(target.getDate() + 1);

  return target;
}

function updateCountdown() {
  const now = new Date();
  const cairoNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
  );

  const diff = getCairoTarget() - cairoNow;
  if (diff <= 0) return;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const el = document.getElementById("countdown");
  if (el) {
    el.textContent =
      `${h.toString().padStart(2,"0")}:` +
      `${m.toString().padStart(2,"0")}:` +
      `${s.toString().padStart(2,"0")}`;
  }
}

setInterval(updateCountdown, 1000);
updateCountdown();


/* =========================
   Number Pop Animation
========================= */

document.querySelectorAll(".num").forEach((el,i)=>{
  el.style.opacity=0;
  setTimeout(()=>{
    el.style.transition="0.6s";
    el.style.opacity=1;
    el.style.transform="scale(1.3)";
    setTimeout(()=>el.style.transform="scale(1)",300);
  }, i*300);
});

/* ===== Profile Menu Toggle ===== */

const avatar = document.getElementById("navAvatar");
const menu = document.getElementById("profileMenu");

if (avatar && menu){
  avatar.addEventListener("click", ()=>{
    menu.classList.toggle("show");
  });

  document.addEventListener("click",(e)=>{
    if (!e.target.closest(".nav-profile")){
      menu.classList.remove("show");
    }
  });
}

