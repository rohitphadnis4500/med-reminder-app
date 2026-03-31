document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const messageBox = document.getElementById("message"); // ✅ FIXED

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase(); // ✅ FIXED
    const password = document.getElementById("password").value.trim();

    // Get all users
    const users = JSON.parse(localStorage.getItem("sm_users")) || [];

    // Find matching user
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      showMessage("❌ Invalid email or password.", "error");
      return;
    }

    // Login success
    showMessage("✅ Login successful! Redirecting...", "success");

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUser", email);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);
  });

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }
});