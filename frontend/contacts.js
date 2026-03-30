document.addEventListener("DOMContentLoaded", async function () {
  const container = document.querySelector("main");
  const searchBox = document.getElementById("searchBox");
  const searchBtn = document.getElementById("searchBtn");
  const noResultsMsg = document.querySelector(".no-results");
  const docContainer = document.getElementById("doctorContainer");
  const template = document.getElementById("doctorTemplate");
  const API_BASE = "http://127.0.0.1:5000/doctors";

  // 🩺 Extract data from existing HTML mock cards (optional)
  function extractDoctorsFromHTML() {
    const cards = document.querySelectorAll(".doctor-card");
    const doctors = [];

    cards.forEach((card) => {
      const name = card.querySelector("h3").textContent.trim();
      const specialization = card.querySelector("p:nth-of-type(1)").textContent.replace(/^[^\w]+/, "").trim();
      const hospital_name = card.querySelector("p:nth-of-type(2)").textContent.replace(/^[^\w]+/, "").trim();
      const contact_no = card.querySelector("p:nth-of-type(3)").textContent.replace(/^[^\w]+/, "").trim();

      const timingsText = card.querySelector("p:nth-of-type(4)").textContent.replace(/^[^\w]+/, "").trim();
      let [available_from, available_to] = ["--:--", "--:--"];
      const match = timingsText.match(/(\d{1,2}\s?(AM|PM))\s*-\s*(\d{1,2}\s?(AM|PM))/i);
      if (match) {
        available_from = match[1];
        available_to = match[3];
      }

      doctors.push({ name, specialization, hospital_name, contact_no, available_from, available_to });
    });

    return doctors;
  }

  // 💾 Upload extracted doctors to backend (optional)
  async function uploadDoctorsToDB(doctors) {
    for (const doc of doctors) {
      try {
        const res = await fetch(`${API_BASE}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });

        const data = await res.json();
        console.log(`✅ ${doc.name}:`, data.message || data);
      } catch (err) {
        console.error(`❌ Failed to upload ${doc.name}:`, err);
      }
    }
  }

  // 📥 Load doctors from database
  async function loadDoctorsFromDB() {
    try {
      const res = await fetch(`${API_BASE}/all`);
      const doctors = await res.json();
      renderDoctors(doctors);
    } catch (err) {
      console.error("Error loading doctors:", err);
      container.innerHTML = `<p class="error">⚠️ Could not load doctors from database.</p>`;
    }
  }

  // 🧠 Render multiple doctors using a single HTML template
  function renderDoctors(doctors) {
    docContainer.innerHTML = ""; // clear old content (except template)
    if (!doctors || doctors.length === 0) {
      noResultsMsg.style.display = "block";
      return;
    }

    noResultsMsg.style.display = "none";

    doctors.forEach((doctor) => {
      const card = template.cloneNode(true);
      card.style.display = "block";
      card.removeAttribute("id");

      card.querySelector("#doctorName").textContent = doctor.name;
      card.querySelector("#doctorSpecialization").textContent = doctor.specialization;
      card.querySelector("#doctorHospital").textContent = doctor.hospital_name || "N/A";
      card.querySelector("#doctorContact").textContent = doctor.contact_no || "N/A";
      card.querySelector("#doctorGender").textContent = doctor.gender || "N/A";
      card.querySelector("#doctorTimings").textContent =
        `${doctor.available_from || "--:--"} - ${doctor.available_to || "--:--"}`;
      card.querySelector("#doctorImage").src =
        "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";

      const contactBtn = card.querySelector("#contactBtn");
      contactBtn.onclick = () => alert(`Calling ${doctor.name}...`);

      docContainer.appendChild(card);
    });
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
  }

  // 🎯 Event listeners
  searchBox.addEventListener("keyup", filterDoctors);
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    filterDoctors();
  });

  // 🚀 Main execution
  const extractedDoctors = extractDoctorsFromHTML();
  await uploadDoctorsToDB(extractedDoctors);
  await loadDoctorsFromDB();
});
