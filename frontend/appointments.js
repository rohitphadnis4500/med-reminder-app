// -------------------------------
// Select DOM elements
// -------------------------------
const form = document.getElementById("appointmentForm");
const specializationSelect = document.getElementById("specialization");
const doctorSelect = document.getElementById("doctorName");
const appointmentsList = document.getElementById("appointmentsList");
const noAppointmentsMsg = document.getElementById("noAppointmentsMsg");

// ✅ UPDATED: Using relative URL (removed localhost)
const API_BASE = ""; // Use relative URLs for both local and production

let allDoctors = []; // store doctors globally

// -------------------------------
// Load doctors from backend
// -------------------------------
async function loadDoctors() {
  try {
    // ✅ UPDATED: Using relative URL
    const res = await fetch(`${API_BASE}/doctors/all`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const doctors = await res.json();
    allDoctors = doctors;

    // Populate specialization dropdown
    const specializations = [...new Set(doctors.map(doc => doc.specialization))];
    specializationSelect.innerHTML = `<option value="">Select specialization</option>`;
    specializations.forEach(spec => {
      const option = document.createElement("option");
      option.value = spec;
      option.textContent = spec;
      specializationSelect.appendChild(option);
    });

    // Start with doctor dropdown empty
    doctorSelect.innerHTML = `<option value="">Select doctor</option>`;

    // When specialization changes → filter doctors
    specializationSelect.addEventListener("change", () => {
      const selectedSpec = specializationSelect.value;
      if (selectedSpec) {
        const filtered = allDoctors.filter(doc => doc.specialization === selectedSpec);
        populateDoctorDropdown(filtered);
      } else {
        doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
      }
    });

  } catch (err) {
    console.error("Error loading doctors:", err);
    showErrorMessage("Failed to load doctors. Please refresh the page.");
  }
}

// -------------------------------
// Populate doctor dropdown
// -------------------------------
function populateDoctorDropdown(doctorsArray) {
  doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
  doctorsArray.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.name;
    option.textContent = doc.name;
    doctorSelect.appendChild(option);
  });
}

// -------------------------------
// Load appointments from localStorage
// -------------------------------
function loadAppointments() {
  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointmentsList.innerHTML = "";

  if (appointments.length === 0) {
    noAppointmentsMsg.style.display = "block";
    return;
  }

  noAppointmentsMsg.style.display = "none";

  appointments.forEach((app, index) => {
    const card = document.createElement("div");
    card.className = "appointment-card";
    if(app.status === "done") card.classList.add("done");

    card.innerHTML = `
      <div class="appointment-info">
        <p><strong>Patient:</strong> ${escapeHtml(app.patientName)}</p>
        <p><strong>Age:</strong> ${escapeHtml(app.patientAge)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(app.patientContact)}</p>
        <p><strong>Gender:</strong> ${escapeHtml(app.gender)}</p>
        <p><strong>Specialization:</strong> ${escapeHtml(app.specialization)}</p>
        <p><strong>Doctor:</strong> ${escapeHtml(app.doctor)}</p>
        <p><strong>Date:</strong> ${escapeHtml(app.date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(app.time)}</p>
        <p><strong>Notes:</strong> ${escapeHtml(app.notes || "-")}</p>
        <p><strong>Status:</strong> <span class="status-${app.status}">${app.status}</span></p>
      </div>
      <div class="appointment-actions">
        ${app.status !== 'done' ? `<button class="done-btn" data-id="${index}">✅ Done</button>` : ''}
        <button class="delete-btn" data-id="${index}">🗑️ Delete</button>
      </div>
    `;
    appointmentsList.appendChild(card);
  });

  addActionListeners();
}

// -------------------------------
// Add Done and Delete functionality
// -------------------------------
function addActionListeners() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this appointment?")) {
        deleteAppointment(id);
      }
    });
  });

  document.querySelectorAll(".done-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.getAttribute("data-id");
      markAsDone(id);
    });
  });
}

// -------------------------------
// Delete Appointment
// -------------------------------
function deleteAppointment(id) {
  let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointments.splice(id, 1);
  localStorage.setItem("appointments", JSON.stringify(appointments));
  loadAppointments();
  showSuccessMessage("Appointment deleted successfully!");
}

// -------------------------------
// Mark Appointment as Done
// -------------------------------
function markAsDone(id) {
  let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointments[id].status = "done";
  localStorage.setItem("appointments", JSON.stringify(appointments));
  loadAppointments();
  showSuccessMessage("Appointment marked as done!");
}

// -------------------------------
// Handle form submit
// -------------------------------
form.addEventListener("submit", e => {
  e.preventDefault();

  // Get form values
  const patientName = document.getElementById("patientName").value.trim();
  const patientAge = document.getElementById("patientAge").value.trim();
  const patientContact = document.getElementById("patientContact").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const specialization = specializationSelect.value;
  const doctor = doctorSelect.value;
  const date = document.getElementById("appointmentDate").value;
  const time = document.getElementById("appointmentTime").value;
  const notes = document.getElementById("notes").value.trim();

  // Validation
  if (!patientName || !patientAge || !patientContact || !gender || !specialization || !doctor || !date || !time) {
    alert("⚠️ Please fill all required fields!");
    return;
  }

  // Validate age is a number
  if (isNaN(patientAge) || patientAge < 0 || patientAge > 120) {
    alert("⚠️ Please enter a valid age (0-120)");
    return;
  }

  // Validate phone number (basic validation)
  if (!/^[\d\s+-]{10,15}$/.test(patientContact)) {
    alert("⚠️ Please enter a valid contact number (10-15 digits)");
    return;
  }

  const newAppointment = {
    patientName,
    patientAge: parseInt(patientAge),
    patientContact,
    gender,
    specialization,
    doctor,
    date,
    time,
    notes: notes || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointments.push(newAppointment);
  localStorage.setItem("appointments", JSON.stringify(appointments));

  // Show success message
  showSuccessMessage("Appointment booked successfully!");
  
  // Reset form
  form.reset();
  doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
  specializationSelect.value = "";
  
  // Reload appointments list
  loadAppointments();
});

// -------------------------------
// Helper Functions
// -------------------------------
function showErrorMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "error-message";
  msgDiv.textContent = message;
  msgDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(msgDiv);
  
  setTimeout(() => {
    msgDiv.remove();
  }, 3000);
}

function showSuccessMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "success-message";
  msgDiv.textContent = message;
  msgDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(msgDiv);
  
  setTimeout(() => {
    msgDiv.remove();
  }, 3000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  
  // ✅ Convert everything to string first
  str = String(str);

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Add CSS animation
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
  
  .status-pending {
    color: #ff9800;
    font-weight: bold;
  }
  
  .status-done {
    color: #4caf50;
    font-weight: bold;
    text-decoration: line-through;
  }
  
  .appointment-card {
    background: white;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }
  
  .appointment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .appointment-card.done {
    opacity: 0.7;
    background: #f5f5f5;
  }
  
  .appointment-info {
    margin-bottom: 10px;
  }
  
  .appointment-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  
  .done-btn, .delete-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.2s;
  }
  
  .done-btn {
    background: #4caf50;
    color: white;
  }
  
  .delete-btn {
    background: #f44336;
    color: white;
  }
  
  .done-btn:hover, .delete-btn:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(style);

// -------------------------------
// Initialize Everything
// -------------------------------
loadDoctors();
loadAppointments();