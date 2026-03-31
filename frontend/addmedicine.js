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
    input.name = `time${i}`;
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

  // Validation
  if (!name || !dosage || !frequency || !start_date || !end_date) {
    alert("⚠️ Please fill all required fields!");
    return;
  }

  // Gather time fields dynamically
  const times = {};
  const timeInputs = timeFieldsContainer.querySelectorAll("input[type='time']");
  
  if (timeInputs.length === 0) {
    alert("⚠️ Please add at least one time for your medicine!");
    return;
  }
  
  timeInputs.forEach((input, index) => {
    if (!input.value) {
      alert(`⚠️ Please set Time ${index + 1}`);
      return;
    }
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

  // Show loading state
  const submitBtn = document.querySelector("#medicineForm button[type='submit']");
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = "Adding...";
  submitBtn.disabled = true;

  try {
    // ✅ UPDATED: Using relative URL (removed localhost)
    const response = await fetch("/medicines/add", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(newMedicine),
    });

    const result = await response.json();
    
    if (response.ok) {
      alert("✅ " + result.message);
      
      // Reset the form
      document.getElementById("medicineForm").reset();
      timeFieldsContainer.innerHTML = ""; // Clear time fields
      
      // Optional: Redirect to reminders page after 2 seconds
      setTimeout(() => {
        window.location.href = "reminders.html";
      }, 2000);
    } else {
      alert("❌ " + (result.message || "Failed to save medicine"));
    }
    
  } catch (error) {
    console.error("Error saving medicine:", error);
    alert("❌ Failed to save medicine. Please check your connection and try again.");
  } finally {
    // Restore button state
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Optional: Add date validation
document.getElementById("startDate").addEventListener("change", function() {
  const startDate = this.value;
  const endDateInput = document.getElementById("endDate");
  
  if (startDate && endDateInput.value && endDateInput.value < startDate) {
    alert("⚠️ End date cannot be before start date!");
    endDateInput.value = "";
  }
});

document.getElementById("endDate").addEventListener("change", function() {
  const endDate = this.value;
  const startDateInput = document.getElementById("startDate");
  
  if (endDate && startDateInput.value && endDate < startDateInput.value) {
    alert("⚠️ End date cannot be before start date!");
    this.value = "";
  }
});

// Optional: Add confirmation before leaving if form has unsaved changes
let formChanged = false;
document.getElementById("medicineForm").addEventListener("input", () => {
  formChanged = true;
});

window.addEventListener("beforeunload", (e) => {
  if (formChanged) {
    e.preventDefault();
    e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    return e.returnValue;
  }
});

// Reset formChanged flag after successful submission
const originalSubmitHandler = document.getElementById("medicineForm").submit;
document.getElementById("medicineForm").addEventListener("submit", () => {
  formChanged = false;
});