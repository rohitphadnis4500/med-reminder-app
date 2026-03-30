// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("medicineForm");

//   form.addEventListener("submit", (e) => {
//     e.preventDefault(); // Stop default submit behavior

//     const name = document.getElementById("medicineName").value.trim();
//     const dosage = document.getElementById("dosage").value.trim();
//     const frequency = document.getElementById("frequency").value;
//     const time = document.getElementById("time").value;
//     const startDate = document.getElementById("startDate").value;
//     const endDate = document.getElementById("endDate").value;

//     if (!name || !dosage || !frequency || !time || !startDate || !endDate) {
//       alert("Please fill all fields!");
//       return;
//     }

//     // Retrieve existing medicines or initialize empty list
//     const medicines = JSON.parse(localStorage.getItem("medicines")) || [];

//     // Add new medicine
//     medicines.push({ name, dosage, frequency, time, startDate, endDate });

//     // Save updated list
//     localStorage.setItem("medicines", JSON.stringify(medicines));

//     // Show success message
//     const msg = document.getElementById("successMessage");
//     msg.style.display = "block";

//     // Reset form
//     form.reset();

//     // Redirect to view reminders after 1.5 seconds
//     setTimeout(() => {
//       window.location.href = "reminders.html";
//     }, 1500);
//   });
// });

// 🕒 Dynamic time inputs based on frequency


// 🕒 Dynamic time inputs based on frequency
const frequencySelect = document.getElementById("frequency");
const timeFieldsContainer = document.getElementById("timeFields");

frequencySelect.addEventListener("change", () => {
  const freq = frequencySelect.value;
  timeFieldsContainer.innerHTML = ""; // Clear old fields

  let count = 1;
  if (freq === "once") count = 1;
  else if (freq === "twice") count = 2;
  else if (freq === "thrice") count = 3;
  else if (freq === "4times") count = 4;

  // Dynamically create time inputs
  for (let i = 1; i <= count; i++) {
    const label = document.createElement("label");
    label.textContent = `Time ${i}`;
    const input = document.createElement("input");
    input.type = "time";
    input.id = `time${i}`;
    input.required = true;

    timeFieldsContainer.appendChild(label);
    timeFieldsContainer.appendChild(input);
  }
});

// 💊 Handle form submission
document.getElementById("medicineForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("medicineName").value.trim();
  const dosage = document.getElementById("dosage").value.trim();
  const frequency = document.getElementById("frequency").value;
  const start_date = document.getElementById("startDate").value;
  const end_date = document.getElementById("endDate").value;

  // Gather time fields dynamically
  const times = {};
  const timeInputs = timeFieldsContainer.querySelectorAll("input[type='time']");
  timeInputs.forEach((input, index) => {
    times[`time${index + 1}`] = input.value;
  });

  // Automatically set today's date
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  // Construct medicine object
  const newMedicine = {
    name,
    dosage,
    frequency,
    start_date,
    end_date,
    today,
    ...times, // spreads all time fields (time1, time2, etc.)
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/medicines/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMedicine),
    });

    const result = await response.json();
    alert(result.message);

    // Optionally reset the form
    document.getElementById("medicineForm").reset();
    timeFieldsContainer.innerHTML = ""; // Clear time fields
  } catch (error) {
    console.error("Error saving medicine:", error);
    alert("Failed to save medicine. Please try again.");
  }
});
