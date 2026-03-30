// progress.js  (Live auto refresh from MySQL)

document.addEventListener("DOMContentLoaded", function () {

  const totalEl = document.getElementById("totalCount");
  const takenEl = document.getElementById("takenCount");
  const missedEl = document.getElementById("missedCount");

  const API_BASE = "http://127.0.0.1:5000/medicines";

  let chartInstance = null;

  // -------------------------------
  // Fetch data from backend
  // -------------------------------
  function loadProgress() {
    fetch(`${API_BASE}/all`)
      .then(res => res.json())
      .then(medicines => {
        computeStats(medicines);
      })
      .catch(err => {
        console.error("Error loading progress:", err);
      });
  }

  // -------------------------------
  // Compute statistics
  // -------------------------------
  function computeStats(list) {
    const total = list.length;
    const taken = list.filter(r => r.status === "taken").length;
    const missed = list.filter(r => r.status === "missed").length;
    const pending = list.filter(r => r.status === "pending").length;

    totalEl.textContent = total;
    takenEl.textContent = taken;
    missedEl.textContent = missed;

    renderChart(taken, missed, pending);

    if (total === 0) {
      document.querySelector(".chart-section").innerHTML = `
        <p style="text-align:center; font-size:18px; color:#666;">
          No medicines added yet. Add a reminder 💊
        </p>
      `;
    }
  }

  // -------------------------------
  // Render Chart
  // -------------------------------
  function renderChart(taken, missed, pending) {
    const ctx = document.getElementById("progressChart");

    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Taken 💊", "Missed ❌", "Pending ⏳"],
        datasets: [{
          data: [taken, missed, pending],
          backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 14 } }
          }
        }
      }
    });
  }

  // -------------------------------
  // Load immediately + refresh every 5 seconds
  // -------------------------------
  loadProgress();                 
  setInterval(loadProgress, 5000);  // 🔥 Auto-refresh every 5 seconds

});
