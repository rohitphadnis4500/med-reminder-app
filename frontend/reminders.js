document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("remindersContainer");
  const editSection = document.getElementById("editSection");
  const API_BASE = "http://127.0.0.1:5000/medicines";

  // 🔊 Global alarm
  const audio = new Audio("alarm.mp3");
  audio.loop = true;

  // Unlock audio (browser restriction)
  document.body.addEventListener(
    "click",
    () => {
      audio.play().then(() => audio.pause());
      console.log("🎵 Audio unlocked");
    },
    { once: true }
  );

  function playAlarmSound() {
    audio.currentTime = 0;
    audio.play().catch((err) => console.warn("Audio blocked:", err));
  }

  function stopAlarmSound() {
    audio.pause();
    audio.currentTime = 0;
  }

  function normalizeTime(t) {
    if (!t) return null;
    return t.slice(0, 5);
  }

  function showAlert(med) {
    playAlarmSound();
    setTimeout(() => {
      alert(`⏰ Time to take your medicine!\n💊 ${med.name}\nDosage: ${med.dosage}`);
    }, 200);
  }

  const alerted = new Set();

  function resetDailyAlerts() {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
    setTimeout(() => {
      alerted.clear();
      console.log("🕛 Daily alerts reset");
      resetDailyAlerts();
    }, msUntilMidnight);
  }
  resetDailyAlerts();

  // 🔔 Alert checker
  function startAlertChecker(medicines) {
    console.log("✅ Alert checker running...");
    setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = now.toISOString().split("T")[0];

      medicines.forEach((med) => {
        const medTimes = [
          normalizeTime(med.time1),
          normalizeTime(med.time2),
          normalizeTime(med.time3),
        ].filter(Boolean);

        medTimes.forEach((time) => {
          const alertKey = `${med.id}_${time}_${today}`;
          if (time === currentTime && !alerted.has(alertKey)) {
            alerted.add(alertKey);
            showAlert(med);
          }
        });
      });
    }, 1000);
  }

  // 🩺 Load reminders
  function loadReminders() {
    fetch(`${API_BASE}/all`)
      .then((res) => res.json())
      .then((medicines) => {
        container.innerHTML = "";

        // If no reminders found
        if (!medicines || medicines.length === 0) {
          showNoRemindersMessage("📭 No reminders available right now.");
          return;
        }

        startAlertChecker(medicines);

        medicines.forEach((med) => {
          const card = document.createElement("div");
          card.className = "reminder-card";
          card.dataset.id = med.id;

          card.innerHTML = `
            <div class="reminder-details">
              <h3>${med.name}</h3>
              <p><b>Dosage:</b> ${med.dosage}</p>
              <p><b>Frequency:</b> ${med.frequency}</p>
              <p><b>Today's Date:</b> ${med.today}</p>
              <p><b>Time(s):</b> ${[med.time1, med.time2, med.time3]
                .filter(Boolean)
                .join(", ")}</p>
              <p><b>Duration:</b> ${med.start_date} to ${med.end_date}</p>
            </div>
            <div class="reminder-actions">
              <button class="taken-btn">Taken</button>
              <button class="edit-btn">Edit</button>
              <button class="delete-btn">Delete</button>
            </div>
          `;

          // 🩵 "Taken" button
          card.querySelector(".taken-btn").addEventListener("click", async () => {
            stopAlarmSound();
            const btn = card.querySelector(".taken-btn");
            btn.textContent = "Taken ✔";
            btn.disabled = true;

            const medTimes = [
              normalizeTime(med.time1),
              normalizeTime(med.time2),
              normalizeTime(med.time3),
            ].filter(Boolean);

            const current = new Date().toTimeString().slice(0, 5);
            const nextTime = medTimes.find((t) => t > current);
            const today = new Date().toISOString().split("T")[0];
            const isLastDay = today >= med.end_date;

            const updateData = {
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              time1: med.time1,
              time2: med.time2,
              time3: med.time3,
              start_date: med.start_date,
              end_date: med.end_date,
              move_to_next_day: !nextTime,
            };

            try {
              await fetch(`${API_BASE}/update/${med.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
              });

              if (!nextTime && isLastDay) {
                card.classList.add("fade-out");
                setTimeout(() => {
                  card.remove();

                  // Check if container empty after fade
                  if (container.querySelectorAll(".reminder-card").length === 0) {
                    showNoRemindersMessage("🌿 All caught up! No reminders left for today.");
                  }
                }, 800);
              } else {
                setTimeout(() => loadReminders(), 800);
              }
            } catch (err) {
              console.error("Error updating medicine:", err);
            }
          });

          // ✏️ Edit
          card.querySelector(".edit-btn").addEventListener("click", () => {
            editSection.innerHTML = `
              <h2>Edit Medicine</h2>
              <form id="editForm">
                <input type="hidden" id="editId" value="${med.id}">
                <label>Medicine Name:</label>
                <input type="text" id="editName" value="${med.name}" required><br>
                <label>Dosage:</label>
                <input type="text" id="editDosage" value="${med.dosage}" required><br>
                <label>Frequency:</label>
                <input type="text" id="editFrequency" value="${med.frequency}" required><br>
                <label>Time 1:</label>
                <input type="time" id="editTime1" value="${normalizeTime(med.time1)}" required><br>
                ${med.time2 ? `<label>Time 2:</label><input type="time" id="editTime2" value="${normalizeTime(med.time2)}"><br>` : ""}
                ${med.time3 ? `<label>Time 3:</label><input type="time" id="editTime3" value="${normalizeTime(med.time3)}"><br>` : ""}
                <label>Start Date:</label>
                <input type="date" id="editStart" value="${med.start_date}" required><br>
                <label>End Date:</label>
                <input type="date" id="editEnd" value="${med.end_date}" required><br><br>
                <button type="submit">Save Changes</button>
                <button type="button" id="cancelEdit">Cancel</button>
              </form>
            `;

            document.getElementById("cancelEdit").addEventListener("click", () => {
              editSection.innerHTML = "";
            });

            document.getElementById("editForm").addEventListener("submit", async (e) => {
              e.preventDefault();
              const updatedMed = {
                name: document.getElementById("editName").value,
                dosage: document.getElementById("editDosage").value,
                frequency: document.getElementById("editFrequency").value,
                time1: document.getElementById("editTime1").value,
                time2: document.getElementById("editTime2")?.value || null,
                time3: document.getElementById("editTime3")?.value || null,
                start_date: document.getElementById("editStart").value,
                end_date: document.getElementById("editEnd").value,
              };

              await fetch(`${API_BASE}/update/${med.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedMed),
              });
              alert("Medicine updated successfully!");
              editSection.innerHTML = "";
              loadReminders();
            });
          });

          // ❌ Delete
          card.querySelector(".delete-btn").addEventListener("click", () => {
            if (confirm(`Delete reminder for "${med.name}"?`)) {
              fetch(`${API_BASE}/delete/${med.id}`, { method: "DELETE" })
                .then(() => loadReminders())
                .catch((err) => console.error("Error deleting:", err));
            }
          });

          container.appendChild(card);
        });
      })
      .catch((err) => {
        console.error("Error loading medicines:", err);
        showNoRemindersMessage("⚠️ Failed to load reminders. Please check your server.");
      });
  }

  // 🌿 Show "No reminders" message
  function showNoRemindersMessage(text) {
    container.innerHTML = `
      <div class="no-reminders-message">
        ${text}
      </div>
    `;
  }

  // 🚀 Initialize
  loadReminders();
});
