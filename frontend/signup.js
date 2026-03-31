document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signupForm");
  const messageBox = document.getElementById("message"); // ✅ FIXED

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim(); // ✅ FIXED
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showMessage("⚠️ Please fill in all fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("❌ Passwords do not match.", "error");
      return;
    }

    // Get existing users
    let users = JSON.parse(localStorage.getItem("sm_users")) || [];

    // Check if email already exists
    const exists = users.some((u) => u.email === email);

    if (exists) {
      showMessage("⚠️ Email already registered. Please login.", "error");
      return;
    }

    // Save user
    users.push({
      name: name,
      email: email,
      password: password,
    });

    localStorage.setItem("sm_users", JSON.stringify(users));

    showMessage("✅ Signup successful! Please login now.", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  });

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }
});