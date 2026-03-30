// login.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const messageBox = document.getElementById("messageBox");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const storedUser = JSON.parse(localStorage.getItem("user"));

    // Check if user exists
    if (!storedUser) {
      showMessage("⚠️ No user found. Please sign up first.", "error");
      return;
    }

    // Validate credentials
    if (email === storedUser.email && password === storedUser.password) {
      showMessage("✅ Login successful! Redirecting...", "success");

      // Simulate logged-in session (you can replace with tokens later)
      localStorage.setItem("isLoggedIn", "true");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      showMessage("❌ Invalid email or password.", "error");
    }
  });

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }
});
