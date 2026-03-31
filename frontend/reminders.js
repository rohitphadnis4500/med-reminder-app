document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("remindersContainer");
  const editSection = document.getElementById("editSection");
  
  // ✅ UPDATED: Using relative URL (removed localhost)
  const API_BASE = "/medicines";
  
  let refreshInterval = null;
  let isRefreshing = false;

  // 🔊 Global alarm
  const audio = new Audio("alarm.mp3");
  audio.loop = true;

  // Unlock audio (browser restriction)
  let audioUnlocked = false;
  
  function unlockAudio() {
    if (!audioUnlocked) {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audioUnlocked = true;
        console.log("🎵 Audio unlocked");
      }).catch((err) => console.warn("Audio unlock failed:", err));
    }
  }
  
  document.body.addEventListener("click", unlockAudio, { once: true });
  document.body.addEventListener("touchstart", unlockAudio, { once: true });

  function playAlarmSound() {
    if (!audioUnlocked) {
      unlockAudio();
      setTimeout(() => playAlarmSound(), 100);
      return;
    }
    audio.currentTime = 0;
    audio.play().catch((err) => console.warn("Audio blocked:", err));
  }

  function stopAlarmSound() {
    audio.pause();
    audio.currentTime = 0;
  }

  function normalizeTime(t) {
    if (!t) return null;
    // Handle time in various formats
    if (typeof t === 'object' && t.hours) {
      return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`;
    }
    const timeStr = String(t);
    return timeStr.slice(0, 5);
  }

  function showAlert(med) {
    playAlarmSound();
    
    // Create custom alert modal instead of browser alert (less intrusive)
    const modal = document.createElement("div");
    modal.className = "alert-modal";
    modal.innerHTML = `
      <div class="alert-content">
        <div class="alert-icon">⏰</div>
        <h3>Time to take your medicine!</h3>
        <p><strong>💊 ${escapeHtml(med.name)}</strong></p>
        <p>Dosage: ${escapeHtml(med.dosage)}</p>
        <button class="alert-dismiss">OK, I'll take it</button>
        <button class="alert-snooze">Snooze (5 min)</button>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    const content = modal.querySelector(".alert-content");
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      max-width: 90%;
      width: 320px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease;
    `;
    
    const dismissBtn = modal.querySelector(".alert-dismiss");
    const snoozeBtn = modal.querySelector(".alert-snooze");
    
    dismissBtn.style.cssText = `
      background: #4caf50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 10px 5px;
      cursor: pointer;
    `;
    
    snoozeBtn.style.cssText = `
      background: #ff9800;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 10px 5px;
      cursor: pointer;
    `;
    
    dismissBtn.onclick = () => {
      modal.remove();
      stopAlarmSound();
    };
    
    snoozeBtn.onclick = () => {
      modal.remove();
      stopAlarmSound();
      // Snooze for 5 minutes
      setTimeout(() => {
        if (document.body.contains(container)) {
          showAlert(med);
        }
      }, 5 * 60 * 1000);
    };
    
    document.body.appendChild(modal);
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 30000);
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
  let alertCheckerInterval = null;
  
  function startAlertChecker(medicines) {
    if (alertCheckerInterval) {
      clearInterval(alertCheckerInterval);
    }
    
    console.log("✅ Alert checker running...");
    alertCheckerInterval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = now.toISOString().split("T")[0];

      medicines.forEach((med) => {
        // Check if medicine is active for today
        if (med.start_date && med.end_date) {
          if (today < med.start_date || today > med.end_date) {
            return; // Skip if not within date range
          }
        }
        
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
  async function loadReminders() {
    if (isRefreshing) return;
    isRefreshing = true;
    
    try {
      // ✅ UPDATED: Using relative URL
      const response = await fetch(`${API_BASE}/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const medicines = await response.json();
      container.innerHTML = "";

      // If no reminders found
      if (!medicines || medicines.length === 0) {
        showNoRemindersMessage("📭 No reminders available right now. Add your first medicine!");
        return;
      }

      startAlertChecker(medicines);

      medicines.forEach((med) => {
        const card = document.createElement("div");
        card.className = "reminder-card";
        card.dataset.id = med.id;

        // Check if today is within date range
        const today = new Date().toISOString().split("T")[0];
        const isActive = today >= med.start_date && today <= med.end_date;
        
        if (!isActive) {
          card.classList.add("inactive");
        }

        card.innerHTML = `
          <div class="reminder-details">
            <h3>${escapeHtml(med.name)}</h3>
            <p><strong>Dosage:</strong> ${escapeHtml(med.dosage)}</p>
            <p><strong>Frequency:</strong> ${escapeHtml(med.frequency)}</p>
            <p><strong>Today's Date:</strong> ${escapeHtml(med.today)}</p>
            <p><strong>Time(s):</strong> ${[med.time1, med.time2, med.time3]
              .filter(Boolean)
              .map(t => escapeHtml(normalizeTime(t)))
              .join(", ")}</p>
            <p><strong>Duration:</strong> ${escapeHtml(med.start_date)} to ${escapeHtml(med.end_date)}</p>
            ${!isActive ? '<p class="inactive-badge">⏸️ Not active until ' + med.start_date + '</p>' : ''}
          </div>
          <div class="reminder-actions">
            ${isActive ? '<button class="taken-btn">✅ Taken</button>' : ''}
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">🗑️ Delete</button>
          </div>
        `;

        // 🩵 "Taken" button
        const takenBtn = card.querySelector(".taken-btn");
        if (takenBtn) {
          takenBtn.addEventListener("click", async () => {
            stopAlarmSound();
            const btn = card.querySelector(".taken-btn");
            btn.textContent = "✓ Taken";
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
              const updateResponse = await fetch(`${API_BASE}/update/${med.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
              });

              if (!updateResponse.ok) {
                throw new Error("Update failed");
              }

              if (!nextTime && isLastDay) {
                card.classList.add("fade-out");
                setTimeout(() => {
                  card.remove();
                  if (container.querySelectorAll(".reminder-card").length === 0) {
                    showNoRemindersMessage("🌿 All caught up! No reminders left for today.");
                  }
                }, 800);
              } else {
                showToast("✅ Medicine marked as taken!", "success");
                setTimeout(() => loadReminders(), 800);
              }
            } catch (err) {
              console.error("Error updating medicine:", err);
              showToast("❌ Failed to update. Please try again.", "error");
              btn.textContent = "Taken";
              btn.disabled = false;
            }
          });
        }

        // ✏️ Edit
        card.querySelector(".edit-btn").addEventListener("click", () => {
          editSection.innerHTML = `
            <h2>Edit Medicine</h2>
            <form id="editForm">
              <input type="hidden" id="editId" value="${med.id}">
              <label>Medicine Name:</label>
              <input type="text" id="editName" value="${escapeHtml(med.name)}" required><br>
              <label>Dosage:</label>
              <input type="text" id="editDosage" value="${escapeHtml(med.dosage)}" required><br>
              <label>Frequency:</label>
              <input type="text" id="editFrequency" value="${escapeHtml(med.frequency)}" required><br>
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

            try {
              const updateResponse = await fetch(`${API_BASE}/update/${med.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedMed),
              });
              
              if (updateResponse.ok) {
                showToast("✅ Medicine updated successfully!", "success");
                editSection.innerHTML = "";
                loadReminders();
              } else {
                throw new Error("Update failed");
              }
            } catch (err) {
              console.error("Error updating:", err);
              showToast("❌ Failed to update medicine", "error");
            }
          });
        });

        // ❌ Delete
        card.querySelector(".delete-btn").addEventListener("click", async () => {
          if (confirm(`Delete reminder for "${med.name}"?`)) {
            try {
              const deleteResponse = await fetch(`${API_BASE}/delete/${med.id}`, { 
                method: "DELETE" 
              });
              
              if (deleteResponse.ok) {
                showToast("✅ Medicine deleted successfully!", "success");
                loadReminders();
              } else {
                throw new Error("Delete failed");
              }
            } catch (err) {
              console.error("Error deleting:", err);
              showToast("❌ Failed to delete medicine", "error");
            }
          }
        });

        container.appendChild(card);
      });
      
    } catch (err) {
      console.error("Error loading medicines:", err);
      showNoRemindersMessage("⚠️ Failed to load reminders. Please check your connection and refresh the page.");
    } finally {
      isRefreshing = false;
    }
  }

  // 🌿 Show "No reminders" message
  function showNoRemindersMessage(text) {
    container.innerHTML = `
      <div class="no-reminders-message">
        <div class="empty-icon">💊</div>
        <p>${escapeHtml(text)}</p>
        <a href="addmedicine.html" class="add-btn">+ Add Medicine</a>
      </div>
    `;
  }

  // 🔔 Show toast notification
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = "slideDown 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Add CSS styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
    .reminder-card {
      transition: opacity 0.3s, transform 0.2s;
    }
    .reminder-card:hover {
      transform: translateY(-2px);
    }
    .reminder-card.fade-out {
      opacity: 0;
      transform: translateX(-20px);
    }
    .reminder-card.inactive {
      opacity: 0.6;
      background: #f5f5f5;
    }
    .inactive-badge {
      color: #ff9800;
      font-size: 12px;
      margin-top: 5px;
    }
    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: bounce 2s ease infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .add-btn {
      display: inline-block;
      background: #4caf50;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      margin-top: 15px;
    }
    .add-btn:hover {
      background: #45a049;
    }
    .no-reminders-message {
      text-align: center;
      padding: 50px;
      color: #666;
    }
    .alert-modal button {
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .alert-modal button:hover {
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);

  // Add refresh button
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh";
  refreshBtn.style.cssText = `
    background: #2196f3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    margin: 10px;
    font-size: 14px;
  `;
  refreshBtn.onclick = () => loadReminders();
  const header = document.querySelector("header") || document.body;
  header.appendChild(refreshBtn);

  // Auto-refresh every 30 seconds
  setInterval(() => {
    if (!isRefreshing) {
      loadReminders();
    }
  }, 30000);

  // 🚀 Initialize
  loadReminders();
});