// reports.js
document.addEventListener("DOMContentLoaded", async () => {
  const medChartCtx = document.getElementById("medChart");
  const trendChartCtx = document.getElementById("trendChart");

  const medTakenEl = document.querySelector(".report-summary .report-card:nth-child(1) p");
  const remindersEl = document.querySelector(".report-summary .report-card:nth-child(2) p");
  const healthEl = document.querySelector(".report-summary .report-card:nth-child(3) p");
  const nextApptEl = document.querySelector(".report-summary .report-card:nth-child(4) p");

  // Fetch medicines from backend
  let medicines = [];
  try {
    const res = await fetch("http://127.0.0.1:5000/medicines/all");
    medicines = await res.json();
  } catch (err) {
    console.error("Error fetching medicines:", err);
  }

  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];

  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.status === "taken").length;
  const adherencePercent = totalMeds ? Math.round((takenMeds / totalMeds) * 100) : 0;
  const healthStatus = adherencePercent > 80 ? "Stable & Improving" : "Needs Attention";
  const nextAppt = appointments.length ? `${appointments[0].doctor} - ${appointments[0].date}` : "No appointments";

  medTakenEl.innerHTML = `<strong>${takenMeds} / ${totalMeds}</strong> this month`;
  remindersEl.innerHTML = `<strong>${adherencePercent}%</strong> on-time intake`;
  healthEl.textContent = healthStatus;
  nextApptEl.textContent = nextAppt;

  const weeklyData = [3, 4, 5, 2];
  const monthlyTrend = [80, 85, 90, 92, 95, 97];

  new Chart(medChartCtx, {
    type: "bar",
    data: { labels: ["Week 1","Week 2","Week 3","Week 4"], datasets: [{ label: "Medicines Taken", data: weeklyData, backgroundColor: "#42a5f5" }] },
    options: { scales: { y: { beginAtZero: true } } }
  });

  new Chart(trendChartCtx, {
    type: "line",
    data: { labels: ["Jan","Feb","Mar","Apr","May","Jun"], datasets: [{ label: "Adherence %", data: monthlyTrend, borderColor: "#1565c0", backgroundColor: "rgba(21,101,192,0.2)", fill: true, tension: 0.4 }] },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
  });

  // -----------------------------
  // CREATE DOWNLOAD BUTTON DYNAMICALLY
  // -----------------------------
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "📄 Download Report";
  downloadBtn.className = "btn";
  downloadBtn.style.background = "#1565c0";
  downloadBtn.style.color = "white";
  downloadBtn.style.padding = "10px 20px";
  downloadBtn.style.borderRadius = "8px";
  downloadBtn.style.cursor = "pointer";
  document.querySelector("main").appendChild(downloadBtn);

  downloadBtn.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Background
    doc.setFillColor(240,248,255);
    doc.rect(0,0,210,297,"F");

    // Title
    doc.setFontSize(22);
    doc.setTextColor("#1565c0");
    doc.setFont("helvetica","bold");
    doc.text("📊 Smart Medications Tracker and Reminder", 14, 25);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor("#333");
    doc.setFont("helvetica","normal");
    doc.text(`💊 Medicines Taken: ${takenMeds} / ${totalMeds}`, 14, 45);
    doc.text(`⏰ Reminders Completed: ${adherencePercent}%`, 14, 55);
    doc.text(`🩺 Health Status: ${healthStatus}`, 14, 65);
    doc.text(`📅 Next Appointment: ${nextAppt}`, 14, 75);

    // Medicines Table inside PDF only
    let startY = 90;
    doc.setFontSize(12);
    doc.setTextColor("#1565c0");
    doc.text("📋 Medicines List", 14, startY);
    startY += 6;

    const headers = ["Medicine", "Dosage", "Timing", "Status"];
    const colX = [14, 64, 114, 164];

    doc.setFont("helvetica","bold");
    doc.setFillColor(21,101,192);
    doc.setTextColor(255,255,255);
    headers.forEach((h,i) => { doc.rect(colX[i]-2,startY-4,46,8,"F"); doc.text(h,colX[i],startY); });
    startY += 10;

    doc.setFont("helvetica","normal");
    doc.setTextColor(0,0,0);
    medicines.forEach(med => {
      doc.text(med.name,colX[0],startY);
      doc.text(med.dosage,colX[1],startY);
      doc.text(med.timing,colX[2],startY);
      doc.text(med.status,colX[3],startY);
      startY += 8;
      if(startY > 270){ doc.addPage(); startY = 20; }
    });

    // Charts
    const medChartCanvas = await html2canvas(medChartCtx);
    const medChartImg = medChartCanvas.toDataURL("image/png");
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor("#1565c0");
    doc.text("Weekly Medicine Intake Chart",14,14);
    doc.addImage(medChartImg,"PNG",14,20,180,100);

    const trendChartCanvas = await html2canvas(trendChartCtx);
    const trendChartImg = trendChartCanvas.toDataURL("image/png");
    doc.addPage();
    doc.text("Monthly Adherence Trend Chart",14,14);
    doc.addImage(trendChartImg,"PNG",14,20,180,100);

    doc.save("Smart_Medications_Report.pdf");
  });
});
