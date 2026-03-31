// reports.js
document.addEventListener("DOMContentLoaded", async () => {
  const medChartCtx = document.getElementById("medChart");
  const trendChartCtx = document.getElementById("trendChart");

  const medTakenEl = document.querySelector(".report-summary .report-card:nth-child(1) p");
  const remindersEl = document.querySelector(".report-summary .report-card:nth-child(2) p");
  const healthEl = document.querySelector(".report-summary .report-card:nth-child(3) p");
  const nextApptEl = document.querySelector(".report-summary .report-card:nth-child(4) p");
  
  // Add loading state
  let isLoading = false;
  
  // ✅ UPDATED: Using relative URL (removed localhost)
  const API_BASE = "/medicines";

  // Fetch medicines from backend
  let medicines = [];
  let totalMeds = 0;
  let takenMeds = 0;
  let adherencePercent = 0;
  let healthStatus = "Loading...";
  let nextAppt = "Loading...";
  
  // Show loading state
  function showLoading() {
    if (medTakenEl) medTakenEl.innerHTML = `<strong>Loading...</strong>`;
    if (remindersEl) remindersEl.innerHTML = `<strong>Loading...</strong>`;
    if (healthEl) healthEl.textContent = "Loading...";
    if (nextApptEl) nextApptEl.textContent = "Loading...";
  }
  
  // Fetch data
  async function fetchData() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      // Fetch medicines from backend
      const res = await fetch(`${API_BASE}/all`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      medicines = await res.json();
      
    } catch (err) {
      console.error("Error fetching medicines:", err);
      showErrorMessage("Failed to load medicine data. Please refresh the page.");
      medicines = [];
    }
    
    // Get appointments from localStorage
    const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
    
    // Calculate statistics
    totalMeds = medicines.length;
    
    // Check if medicines have status field
    const hasStatus = medicines.some(m => m.hasOwnProperty('status'));
    
    if (hasStatus) {
      takenMeds = medicines.filter(m => m.status === "taken").length;
    } else {
      // If no status field, calculate based on dates
      const today = new Date().toISOString().split("T")[0];
      takenMeds = medicines.filter(m => {
        // Consider medicines that have ended as "taken" for reporting
        return m.end_date && m.end_date < today;
      }).length;
    }
    
    adherencePercent = totalMeds ? Math.round((takenMeds / totalMeds) * 100) : 0;
    healthStatus = adherencePercent >= 80 ? "✅ Stable & Improving" : 
                   adherencePercent >= 50 ? "⚠️ Needs Attention" : "❌ Critical";
    
    // Get next appointment
    if (appointments.length > 0) {
      const upcoming = appointments
        .filter(a => a.status !== "done")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      nextAppt = upcoming.length ? `${upcoming[0].doctor} - ${upcoming[0].date}` : "No upcoming appointments";
    } else {
      nextAppt = "No appointments";
    }
    
    // Update UI
    if (medTakenEl) medTakenEl.innerHTML = `<strong>${takenMeds} / ${totalMeds}</strong> this month`;
    if (remindersEl) remindersEl.innerHTML = `<strong>${adherencePercent}%</strong> on-time intake`;
    if (healthEl) {
      healthEl.textContent = healthStatus;
      // Color code health status
      if (adherencePercent >= 80) {
        healthEl.style.color = "#4caf50";
      } else if (adherencePercent >= 50) {
        healthEl.style.color = "#ff9800";
      } else {
        healthEl.style.color = "#f44336";
      }
    }
    if (nextApptEl) nextApptEl.textContent = nextAppt;
    
    isLoading = false;
  }
  
  // Generate real data from actual medicines
  function generateWeeklyData() {
    if (!medicines.length) return [0, 0, 0, 0];
    
    // Group medicines by week (rough estimate)
    const weeks = [0, 0, 0, 0];
    const today = new Date();
    const currentMonth = today.getMonth();
    
    medicines.forEach(med => {
      if (med.created_at || med.start_date) {
        const medDate = new Date(med.start_date || med.created_at);
        if (medDate.getMonth() === currentMonth) {
          const week = Math.floor(medDate.getDate() / 7);
          if (week < 4) weeks[week]++;
        }
      }
    });
    
    return weeks;
  }
  
  function generateMonthlyTrend() {
    if (!medicines.length) return [0, 0, 0, 0, 0, 0];
    
    // Get last 6 months of data
    const months = [0, 0, 0, 0, 0, 0];
    const today = new Date();
    
    medicines.forEach(med => {
      if (med.created_at || med.start_date) {
        const medDate = new Date(med.start_date || med.created_at);
        const monthDiff = (today.getFullYear() - medDate.getFullYear()) * 12 + 
                          (today.getMonth() - medDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < 6) {
          months[5 - monthDiff]++;
        }
      }
    });
    
    // Convert counts to percentages
    const maxCount = Math.max(...months, 1);
    return months.map(count => Math.round((count / maxCount) * 100));
  }
  
  // Get actual data
  const weeklyData = generateWeeklyData();
  const monthlyTrend = generateMonthlyTrend();
  
  // Destroy existing charts if they exist
  if (window.medChart) window.medChart.destroy();
  if (window.trendChart) window.trendChart.destroy();
  
  // Create Medicine Chart
  if (medChartCtx && typeof Chart !== 'undefined') {
    window.medChart = new Chart(medChartCtx, {
      type: "bar",
      data: { 
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"], 
        datasets: [{ 
          label: "Medicines Added", 
          data: weeklyData, 
          backgroundColor: "#42a5f5",
          borderColor: "#1976d2",
          borderWidth: 1,
          borderRadius: 5
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: true,
        scales: { 
          y: { 
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Medicines'
            }
          } 
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw} medicines`;
              }
            }
          }
        }
      }
    });
  }
  
  // Create Trend Chart
  if (trendChartCtx && typeof Chart !== 'undefined') {
    window.trendChart = new Chart(trendChartCtx, {
      type: "line",
      data: { 
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], 
        datasets: [{ 
          label: "Adherence %", 
          data: monthlyTrend, 
          borderColor: "#1565c0", 
          backgroundColor: "rgba(21,101,192,0.1)", 
          fill: true, 
          tension: 0.4,
          pointBackgroundColor: "#1565c0",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: true,
        scales: { 
          y: { 
            beginAtZero: true, 
            max: 100,
            title: {
              display: true,
              text: 'Adherence Rate (%)'
            }
          } 
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Adherence: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }

  // -----------------------------
  // CREATE DOWNLOAD BUTTON DYNAMICALLY
  // -----------------------------
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "📄 Download Report";
  downloadBtn.className = "btn download-btn";
  downloadBtn.style.background = "#1565c0";
  downloadBtn.style.color = "white";
  downloadBtn.style.border = "none";
  downloadBtn.style.padding = "12px 24px";
  downloadBtn.style.borderRadius = "8px";
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.fontSize = "16px";
  downloadBtn.style.fontWeight = "bold";
  downloadBtn.style.margin = "20px";
  downloadBtn.style.transition = "opacity 0.2s";
  
  downloadBtn.addEventListener("mouseenter", () => {
    downloadBtn.style.opacity = "0.8";
  });
  downloadBtn.addEventListener("mouseleave", () => {
    downloadBtn.style.opacity = "1";
  });
  
  const mainElement = document.querySelector("main");
  if (mainElement) {
    mainElement.appendChild(downloadBtn);
  }

  downloadBtn.addEventListener("click", async () => {
    // Show loading state
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "📄 Generating PDF...";
    downloadBtn.disabled = true;
    
    try {
      // Check if jsPDF and html2canvas are loaded
      if (typeof window.jspdf === 'undefined') {
        throw new Error("PDF library not loaded. Please refresh the page.");
      }
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Background
      doc.setFillColor(240, 248, 255);
      doc.rect(0, 0, 210, 297, "F");

      // Title
      doc.setFontSize(22);
      doc.setTextColor("#1565c0");
      doc.setFont("helvetica", "bold");
      doc.text("📊 Smart Medications Tracker and Reminder", 14, 25);

      // Summary
      doc.setFontSize(14);
      doc.setTextColor("#333");
      doc.setFont("helvetica", "normal");
      doc.text(`💊 Medicines Taken: ${takenMeds} / ${totalMeds}`, 14, 45);
      doc.text(`⏰ Reminders Completed: ${adherencePercent}%`, 14, 55);
      doc.text(`🩺 Health Status: ${healthStatus}`, 14, 65);
      doc.text(`📅 Next Appointment: ${nextAppt}`, 14, 75);

      // Medicines Table
      let startY = 90;
      doc.setFontSize(12);
      doc.setTextColor("#1565c0");
      doc.text("📋 Medicines List", 14, startY);
      startY += 6;

      const headers = ["Medicine", "Dosage", "Timing", "Status"];
      const colX = [14, 64, 114, 164];

      doc.setFont("helvetica", "bold");
      doc.setFillColor(21, 101, 192);
      doc.setTextColor(255, 255, 255);
      headers.forEach((h, i) => { 
        doc.rect(colX[i] - 2, startY - 4, 46, 8, "F"); 
        doc.text(h, colX[i], startY); 
      });
      startY += 10;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      // Display medicines (max 20 per page)
      medicines.forEach((med, idx) => {
        // Format timing from time1, time2, time3
        const timing = [med.time1, med.time2, med.time3]
          .filter(Boolean)
          .map(t => t.slice(0, 5))
          .join(", ");
        
        const status = med.status || "pending";
        const statusDisplay = status === "taken" ? "✓ Taken" : 
                              status === "missed" ? "✗ Missed" : "⏳ Pending";
        
        doc.text(med.name || "N/A", colX[0], startY);
        doc.text(med.dosage || "N/A", colX[1], startY);
        doc.text(timing || "N/A", colX[2], startY);
        doc.text(statusDisplay, colX[3], startY);
        startY += 8;
        
        if (startY > 270 && idx < medicines.length - 1) { 
          doc.addPage(); 
          startY = 20; 
        }
      });

      // Charts
      if (medChartCtx && window.medChart) {
        try {
          const medChartCanvas = await html2canvas(medChartCtx, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const medChartImg = medChartCanvas.toDataURL("image/png");
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor("#1565c0");
          doc.text("Weekly Medicine Intake Chart", 14, 14);
          doc.addImage(medChartImg, "PNG", 14, 20, 180, 100);
        } catch (err) {
          console.error("Error capturing medicine chart:", err);
          doc.addPage();
          doc.text("Weekly Medicine Intake Chart", 14, 14);
          doc.text("(Chart could not be generated)", 14, 40);
        }
      }

      if (trendChartCtx && window.trendChart) {
        try {
          const trendChartCanvas = await html2canvas(trendChartCtx, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const trendChartImg = trendChartCanvas.toDataURL("image/png");
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor("#1565c0");
          doc.text("Monthly Adherence Trend Chart", 14, 14);
          doc.addImage(trendChartImg, "PNG", 14, 20, 180, 100);
        } catch (err) {
          console.error("Error capturing trend chart:", err);
          doc.addPage();
          doc.text("Monthly Adherence Trend Chart", 14, 14);
          doc.text("(Chart could not be generated)", 14, 40);
        }
      }

      // Add footer with generation date
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor("#999");
        const date = new Date().toLocaleDateString();
        doc.text(`Generated on ${date} - Page ${i} of ${pageCount}`, 14, 290);
      }

      doc.save(`Medication_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      showErrorMessage("Failed to generate PDF. Please try again.");
    } finally {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
    }
  });

  // Helper functions
  function showErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.animation = "slideOut 0.3s ease";
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }
  
  function showSuccessMessage(message) {
    const successDiv = document.createElement("div");
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.style.animation = "slideOut 0.3s ease";
      setTimeout(() => successDiv.remove(), 300);
    }, 2000);
  }
  
  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    .download-btn {
      transition: opacity 0.2s;
    }
    .download-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
  
  // Add refresh button
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh Data";
  refreshBtn.style.cssText = `
    background: #4caf50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    margin: 20px;
    font-size: 16px;
    font-weight: bold;
    transition: opacity 0.2s;
  `;
  refreshBtn.onclick = async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "🔄 Refreshing...";
    await fetchData();
    // Refresh charts
    if (window.medChart) {
      window.medChart.data.datasets[0].data = generateWeeklyData();
      window.medChart.update();
    }
    if (window.trendChart) {
      window.trendChart.data.datasets[0].data = generateMonthlyTrend();
      window.trendChart.update();
    }
    refreshBtn.disabled = false;
    refreshBtn.textContent = "🔄 Refresh Data";
    showSuccessMessage("Data refreshed successfully!");
  };
  
  if (mainElement) {
    mainElement.appendChild(refreshBtn);
  }

  // Initialize data
  showLoading();
  await fetchData();
});