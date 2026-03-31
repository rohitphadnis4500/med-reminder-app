// progress.js  (Live auto refresh from MySQL)

document.addEventListener("DOMContentLoaded", function () {

  const totalEl = document.getElementById("totalCount");
  const takenEl = document.getElementById("takenCount");
  const missedEl = document.getElementById("missedCount");
  const adherenceEl = document.getElementById("adherenceRate");
  const lastUpdatedEl = document.getElementById("lastUpdated");

  // ✅ UPDATED: Using relative URL (removed localhost)
  const API_BASE = "/medicines";

  let chartInstance = null;
  let refreshInterval = null;
  let isLoading = false;

  // -------------------------------
  // Fetch data from backend
  // -------------------------------
  async function loadProgress() {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
      // Show loading indicator
      showLoadingState();
      
      // ✅ UPDATED: Using relative URL
      const response = await fetch(`${API_BASE}/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const medicines = await response.json();
      computeStats(medicines);
      
      // Update last updated time
      if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
      }
      
    } catch (err) {
      console.error("Error loading progress:", err);
      showErrorMessage("Failed to load progress data. Please refresh the page.");
      
      // Show error in stats
      if (totalEl) totalEl.textContent = "Error";
      if (takenEl) takenEl.textContent = "?";
      if (missedEl) missedEl.textContent = "?";
      
    } finally {
      isLoading = false;
      hideLoadingState();
    }
  }

  // -------------------------------
  // Compute statistics
  // -------------------------------
  function computeStats(list) {
    const total = list.length;
    
    // Check if medicines have status field, if not, treat all as pending
    let taken = 0;
    let missed = 0;
    let pending = 0;
    
    if (total > 0) {
      // Check if any medicine has status field
      const hasStatus = list.some(med => med.hasOwnProperty('status'));
      
      if (hasStatus) {
        taken = list.filter(r => r.status === "taken").length;
        missed = list.filter(r => r.status === "missed").length;
        pending = list.filter(r => r.status === "pending").length;
      } else {
        // If no status field, treat all as pending
        pending = total;
      }
    }
    
    // Calculate adherence rate (taken / total medicines with taken/missed status)
    const completed = taken + missed;
    const adherenceRate = completed > 0 ? Math.round((taken / completed) * 100) : 0;
    
    // Update DOM elements
    if (totalEl) totalEl.textContent = total;
    if (takenEl) takenEl.textContent = taken;
    if (missedEl) missedEl.textContent = missed;
    if (adherenceEl) adherenceEl.textContent = `${adherenceRate}%`;
    
    // Update adherence rate color
    if (adherenceEl) {
      if (adherenceRate >= 80) {
        adherenceEl.style.color = "#4caf50";
      } else if (adherenceRate >= 50) {
        adherenceEl.style.color = "#ff9800";
      } else {
        adherenceEl.style.color = "#f44336";
      }
    }
    
    renderChart(taken, missed, pending);
    
    // Show empty state message
    if (total === 0) {
      const chartSection = document.querySelector(".chart-section");
      if (chartSection) {
        chartSection.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">💊</div>
            <p style="text-align:center; font-size:18px; color:#666;">
              No medicines added yet. 
              <a href="addmedicine.html" style="color: #4caf50;">Add your first reminder</a> 💊
            </p>
          </div>
        `;
      }
    } else {
      // Ensure chart section has canvas if it was replaced
      const chartSection = document.querySelector(".chart-section");
      if (chartSection && !chartSection.querySelector("#progressChart")) {
        chartSection.innerHTML = '<canvas id="progressChart" width="400" height="400"></canvas>';
        renderChart(taken, missed, pending);
      }
    }
  }

  // -------------------------------
  // Render Chart
  // -------------------------------
  function renderChart(taken, missed, pending) {
    const ctx = document.getElementById("progressChart");
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error("Chart.js not loaded");
      return;
    }
    
    // Check if all values are zero
    const allZero = taken === 0 && missed === 0 && pending === 0;
    
    if (allZero) {
      // Show empty chart message
      const parent = ctx.parentNode;
      parent.innerHTML = `
        <div class="empty-chart">
          <p style="text-align:center; padding: 50px; color: #999;">
            📊 No data to display yet<br>
            <small>Add medicines to see progress</small>
          </p>
        </div>
      `;
      return;
    }
    
    // Create new chart
    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Taken 💊", "Missed ❌", "Pending ⏳"],
        datasets: [{
          data: [taken, missed, pending],
          backgroundColor: ["#4caf50", "#f44336", "#ff9800"],
          borderColor: ["#388e3c", "#d32f2f", "#f57c00"],
          borderWidth: 2,
          hoverOffset: 15,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { 
              font: { size: 14, weight: "bold" },
              padding: 15,
              usePointStyle: true,
              pointStyle: "circle"
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = taken + missed + pending;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000
        }
      }
    });
  }

  // -------------------------------
  // Show loading state
  // -------------------------------
  function showLoadingState() {
    const loadingDiv = document.getElementById("loadingIndicator");
    if (!loadingDiv) {
      const indicator = document.createElement("div");
      indicator.id = "loadingIndicator";
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
        text-align: center;
      `;
      indicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading data...</p>
      `;
      document.body.appendChild(indicator);
    }
  }
  
  function hideLoadingState() {
    const loadingDiv = document.getElementById("loadingIndicator");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }
  
  // -------------------------------
  // Show error message
  // -------------------------------
  function showErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-toast";
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
  
  // -------------------------------
  // Manual refresh function
  // -------------------------------
  async function manualRefresh() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "🔄 Refreshing...";
    }
    
    await loadProgress();
    
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "🔄 Refresh Data";
    }
    
    showSuccessMessage("Data refreshed successfully!");
  }
  
  function showSuccessMessage(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success-toast";
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
  
  // -------------------------------
  // Add refresh button
  // -------------------------------
  function addRefreshButton() {
    const header = document.querySelector("header") || document.querySelector(".dashboard-header") || document.body;
    if (header && !document.getElementById("refreshBtn")) {
      const refreshBtn = document.createElement("button");
      refreshBtn.id = "refreshBtn";
      refreshBtn.textContent = "🔄 Refresh Data";
      refreshBtn.style.cssText = `
        background: #4caf50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        margin: 10px;
        font-size: 14px;
        transition: opacity 0.2s;
      `;
      refreshBtn.onclick = manualRefresh;
      header.appendChild(refreshBtn);
    }
  }
  
  // -------------------------------
  // Add CSS animations
  // -------------------------------
  function addStyles() {
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
      
      .spinner {
        border: 3px solid rgba(255,255,255,0.3);
        border-top: 3px solid #fff;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .empty-chart {
        text-align: center;
        padding: 40px;
      }
      
      .empty-state {
        text-align: center;
        padding: 60px 20px;
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
      
      #refreshBtn:hover {
        opacity: 0.8;
      }
      
      #refreshBtn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  // -------------------------------
  // Load immediately + refresh every 10 seconds (increased from 5 to reduce load)
  // -------------------------------
  addStyles();
  addRefreshButton();
  loadProgress();
  
  // Clear existing interval if any
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Set new interval (every 10 seconds instead of 5 to reduce server load)
  refreshInterval = setInterval(loadProgress, 10000);
  
  // Clean up interval on page unload
  window.addEventListener("beforeunload", function() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
});