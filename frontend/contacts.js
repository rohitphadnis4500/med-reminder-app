document.addEventListener("DOMContentLoaded", async function () {
  const container = document.querySelector("main");
  const searchBox = document.getElementById("searchBox");
  const searchBtn = document.getElementById("searchBtn");
  const noResultsMsg = document.querySelector(".no-results");
  const docContainer = document.getElementById("doctorContainer");
  const template = document.getElementById("doctorTemplate");
  
  // ✅ UPDATED: Using relative URL (removed localhost)
  const API_BASE = "/doctors";
  
  // Loading state
  let isLoading = false;

  // 🩺 Extract data from existing HTML mock cards (optional)
  function extractDoctorsFromHTML() {
    const cards = document.querySelectorAll(".doctor-card:not(#doctorTemplate)");
    const doctors = [];

    cards.forEach((card) => {
      const name = card.querySelector("h3")?.textContent.trim();
      const specialization = card.querySelector("p:nth-of-type(1)")?.textContent.replace(/^[^\w]+/, "").trim();
      const hospital_name = card.querySelector("p:nth-of-type(2)")?.textContent.replace(/^[^\w]+/, "").trim();
      const contact_no = card.querySelector("p:nth-of-type(3)")?.textContent.replace(/^[^\w]+/, "").trim();

      const timingsText = card.querySelector("p:nth-of-type(4)")?.textContent.replace(/^[^\w]+/, "").trim();
      let [available_from, available_to] = ["--:--", "--:--"];
      const match = timingsText?.match(/(\d{1,2}\s?(AM|PM))\s*-\s*(\d{1,2}\s?(AM|PM))/i);
      if (match) {
        available_from = match[1];
        available_to = match[3];
      }

      if (name && specialization) {
        doctors.push({ name, specialization, hospital_name, contact_no, available_from, available_to });
      }
    });

    return doctors;
  }

  // 💾 Upload extracted doctors to backend (optional)
  async function uploadDoctorsToDB(doctors) {
    if (doctors.length === 0) return;
    
    console.log(`📤 Uploading ${doctors.length} doctors to database...`);
    
    for (const doc of doctors) {
      try {
        const res = await fetch(`${API_BASE}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });

        const data = await res.json();
        if (res.ok) {
          console.log(`✅ Uploaded: ${doc.name}`);
        } else {
          console.log(`⚠️ Skipped ${doc.name}: ${data.message || data.error}`);
        }
      } catch (err) {
        console.error(`❌ Failed to upload ${doc.name}:`, err);
      }
    }
  }

  // 📥 Load doctors from database
  async function loadDoctorsFromDB() {
    if (isLoading) return;
    
    isLoading = true;
    showLoadingState();
    
    try {
      // ✅ UPDATED: Using relative URL
      const res = await fetch(`${API_BASE}/all`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const doctors = await res.json();
      renderDoctors(doctors);
    } catch (err) {
      console.error("Error loading doctors:", err);
      showErrorMessage("⚠️ Could not load doctors from database. Please refresh the page.");
      docContainer.innerHTML = `<p class="error-message">⚠️ Failed to load doctors. Please check your connection.</p>`;
    } finally {
      isLoading = false;
      hideLoadingState();
    }
  }

  // 🧠 Render multiple doctors using a single HTML template
  function renderDoctors(doctors) {
    docContainer.innerHTML = ""; // clear old content
    
    if (!doctors || doctors.length === 0) {
      noResultsMsg.style.display = "block";
      noResultsMsg.textContent = "👨‍⚕️ No doctors found in the database.";
      return;
    }

    noResultsMsg.style.display = "none";

    doctors.forEach((doctor) => {
      const card = template.cloneNode(true);
      card.style.display = "block";
      card.removeAttribute("id");
      card.classList.add("doctor-card");

      // Set doctor information
      card.querySelector("#doctorName").textContent = doctor.name || "N/A";
      card.querySelector("#doctorSpecialization").textContent = doctor.specialization || "N/A";
      card.querySelector("#doctorHospital").textContent = doctor.hospital_name || "Not specified";
      card.querySelector("#doctorContact").textContent = doctor.contact_no || "Not available";
      card.querySelector("#doctorGender").textContent = doctor.gender || "Not specified";
      
      // Format timings
      const fromTime = formatTime(doctor.available_from);
      const toTime = formatTime(doctor.available_to);
      card.querySelector("#doctorTimings").textContent = `${fromTime} - ${toTime}`;
      
      // Set doctor image (with fallback)
      const img = card.querySelector("#doctorImage");
      if (img) {
        img.src = doctor.image_url || "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";
        img.alt = `Dr. ${doctor.name}`;
      }

      // Add contact button functionality
      const contactBtn = card.querySelector("#contactBtn");
      if (contactBtn) {
        contactBtn.onclick = () => {
          if (doctor.contact_no && doctor.contact_no !== "Not available") {
            showContactOptions(doctor);
          } else {
            showToast("📞 Contact information not available for this doctor", "info");
          }
        };
      }

      // Add view details button if it exists
      const detailsBtn = card.querySelector("#detailsBtn");
      if (detailsBtn) {
        detailsBtn.onclick = () => showDoctorDetails(doctor);
      }

      docContainer.appendChild(card);
    });
    
    // Update search after rendering
    filterDoctors();
  }

  // 🔍 Search filter
  function filterDoctors() {
    const query = searchBox.value.toLowerCase().trim();
    const doctorCards = document.querySelectorAll(".doctor-card:not(#doctorTemplate)");
    let visibleCount = 0;

    doctorCards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.style.display = "block";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
    if (visibleCount === 0 && query) {
      noResultsMsg.textContent = `🔍 No doctors found matching "${query}"`;
    } else if (visibleCount === 0) {
      noResultsMsg.textContent = "👨‍⚕️ No doctors found in the database.";
    }
  }

  // 📞 Show contact options
  function showContactOptions(doctor) {
    const contactNumber = doctor.contact_no;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && contactNumber) {
      if (confirm(`Call ${doctor.name} at ${contactNumber}?`)) {
        window.location.href = `tel:${contactNumber.replace(/\s/g, '')}`;
      }
    } else {
      alert(`📞 Contact ${doctor.name}\n📱 Phone: ${contactNumber}\n🏥 Hospital: ${doctor.hospital_name || 'Not specified'}`);
      
      // Copy to clipboard option
      if (contactNumber && contactNumber !== "Not available") {
        navigator.clipboard.writeText(contactNumber).then(() => {
          showToast("📋 Phone number copied to clipboard!", "success");
        }).catch(() => {
          console.log("Could not copy to clipboard");
        });
      }
    }
  }

  // 👨‍⚕️ Show doctor details
  function showDoctorDetails(doctor) {
    alert(`
      👨‍⚕️ Dr. ${doctor.name}
      🏥 Specialization: ${doctor.specialization}
      🏨 Hospital: ${doctor.hospital_name || 'Not specified'}
      📞 Contact: ${doctor.contact_no || 'Not available'}
      ⚥ Gender: ${doctor.gender || 'Not specified'}
      ⏰ Available: ${formatTime(doctor.available_from)} - ${formatTime(doctor.available_to)}
    `);
  }

  // ⏰ Format time helper
  function formatTime(time) {
    if (!time || time === "--:--") return "Not specified";
    
    // Check if time is in HH:MM:SS format
    if (time.includes(":")) {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time;
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

  // 📊 Show loading state
  function showLoadingState() {
    const loader = document.createElement("div");
    loader.id = "doctorLoader";
    loader.className = "loader";
    loader.innerHTML = '<div class="spinner"></div><p>Loading doctors...</p>';
    loader.style.cssText = `
      text-align: center;
      padding: 40px;
      font-size: 18px;
      color: #666;
    `;
    if (docContainer.children.length === 0) {
      docContainer.appendChild(loader);
    }
  }

  function hideLoadingState() {
    const loader = document.getElementById("doctorLoader");
    if (loader) loader.remove();
  }

  // 🎯 Event listeners
  if (searchBox) {
    searchBox.addEventListener("keyup", filterDoctors);
  }
  
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      filterDoctors();
    });
  }

  // 🔄 Add refresh button
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "🔄 Refresh Doctors";
  refreshBtn.className = "refresh-btn";
  refreshBtn.style.cssText = `
    background: #4caf50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    margin: 10px;
    font-size: 14px;
  `;
  refreshBtn.onclick = async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "🔄 Loading...";
    await loadDoctorsFromDB();
    refreshBtn.disabled = false;
    refreshBtn.textContent = "🔄 Refresh Doctors";
  };
  
  const header = document.querySelector("header") || document.body;
  if (header) {
    header.appendChild(refreshBtn);
  }

  // 🚀 Main execution
  try {
    // Check if doctors already exist in database
    const checkRes = await fetch(`${API_BASE}/all`);
    const existingDoctors = await checkRes.json();
    
    // Only upload if no doctors exist
    if (!existingDoctors || existingDoctors.length === 0) {
      const extractedDoctors = extractDoctorsFromHTML();
      if (extractedDoctors.length > 0) {
        console.log(`📋 Found ${extractedDoctors.length} doctors in HTML to upload`);
        await uploadDoctorsToDB(extractedDoctors);
      }
    } else {
      console.log(`✅ Found ${existingDoctors.length} doctors already in database`);
    }
    
    // Load doctors from database
    await loadDoctorsFromDB();
  } catch (err) {
    console.error("Error in main execution:", err);
    showErrorMessage("⚠️ Failed to initialize doctors page. Please refresh.");
  }
});

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .doctor-card {
    transition: transform 0.2s;
  }
  
  .doctor-card:hover {
    transform: translateY(-2px);
  }
  
  .error-message {
    text-align: center;
    padding: 40px;
    color: #f44336;
    font-size: 18px;
  }
  
  .refresh-btn {
    transition: opacity 0.2s;
  }
  
  .refresh-btn:hover {
    opacity: 0.8;
  }
  
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);