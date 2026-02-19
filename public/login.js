import { auth } from "./firebaseInit.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleBtn");
  if (!googleBtn) return;

  googleBtn.addEventListener("click", async () => {
    try {
      // يمنع أي redirect تلقائي قبل الإكمال
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // هنا تعمل أي db check قبل الانتقال
      console.log("User signed in:", user.displayName);

      // Redirect بس بعد ما يتأكد ان user موجود
      window.location.href = "index.html";

    } catch (err) {
      console.error("Login failed:", err.code, err.message);
      alert("Login failed: " + err.message);
    }
  });
});