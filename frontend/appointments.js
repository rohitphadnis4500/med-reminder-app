// -------------------------------
// Select DOM elements
// -------------------------------
const form = document.getElementById("appointmentForm");
const specializationSelect = document.getElementById("specialization");
const doctorSelect = document.getElementById("doctorName");
const appointmentsList = document.getElementById("appointmentsList");
const noAppointmentsMsg = document.getElementById("noAppointmentsMsg");

const API_BASE = "http://127.0.0.1:5000"; // backend for doctors

let allDoctors = []; // store doctors globally

// -------------------------------
// Load doctors from backend
// -------------------------------
async function loadDoctors() {
  try {
    const res = await fetch(`${API_BASE}/doctors/all`);
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
      <p><b>Patient:</b> ${app.patientName}</p>
      <p><b>Age:</b> ${app.patientAge}</p>
      <p><b>Contact:</b> ${app.patientContact}</p>
      <p><b>Gender:</b> ${app.gender}</p>
      <p><b>Specialization:</b> ${app.specialization}</p>
      <p><b>Doctor:</b> ${app.doctor}</p>
      <p><b>Date:</b> ${app.date}</p>
      <p><b>Time:</b> ${app.time}</p>
      <p><b>Notes:</b> ${app.notes || "-"}</p>
      <p><b>Status:</b> ${app.status}</p>
      <div class="flex justify-center gap-4 mt-3">
        <button class="bg-green-500 text-white px-4 py-1 rounded done-btn" data-id="${index}">✔️ Done</button>
        <button class="bg-red-500 text-white px-4 py-1 rounded delete-btn" data-id="${index}">🗑️ Delete</button>
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
      deleteAppointment(id);
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
}

// -------------------------------
// Mark Appointment as Done
// -------------------------------
function markAsDone(id) {
  let appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointments[id].status = "done";
  localStorage.setItem("appointments", JSON.stringify(appointments));
  loadAppointments();
}

// -------------------------------
// Handle form submit
// -------------------------------
form.addEventListener("submit", e => {
  e.preventDefault();

  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";

  const newAppointment = {
    patientName: document.getElementById("patientName").value,
    patientAge: document.getElementById("patientAge").value,
    patientContact: document.getElementById("patientContact").value,
    gender: gender,
    specialization: specializationSelect.value,
    doctor: doctorSelect.value,
    date: document.getElementById("appointmentDate").value,
    time: document.getElementById("appointmentTime").value,
    notes: document.getElementById("notes").value,
    status: "pending"
  };

  const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
  appointments.push(newAppointment);
  localStorage.setItem("appointments", JSON.stringify(appointments));

  form.reset();
  doctorSelect.innerHTML = `<option value="">Select doctor</option>`;
  loadAppointments();
});

// -------------------------------
// Initialize Everything
// -------------------------------
loadDoctors();
loadAppointments();
