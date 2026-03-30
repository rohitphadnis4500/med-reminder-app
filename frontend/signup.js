// signup.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signupForm");
  const messageBox = document.getElementById("messageBox");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      showMessage("⚠️ Please fill in all fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("❌ Passwords do not match.", "error");
      return;
    }

    // Store credentials (for now, in localStorage)
    const user = { username, email, password };
    localStorage.setItem("user", JSON.stringify(user));

    showMessage("✅ Signup successful! Please login now.", "success");

    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  });

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }
});
