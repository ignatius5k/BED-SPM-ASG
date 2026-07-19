

    document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submitInspection");

    submitBtn.addEventListener("click", function (e) {
        e.preventDefault();

        alert("Inspection form submitted successfully!");

        // Redirect after the user clicks OK
        window.location.href = "inspection-dashboard.html";
    });
});

function updateStallOptions() {
    const hawkerCentre = document.getElementById("hawkerCentre").value;
    const stallSelect = document.getElementById("stall");

    if (!hawkerCentre) {
        stallSelect.innerHTML = '<option value="">Select Hawker Centre First</option>';
        return;
    }

    const stalls = getStallsForHawkerCentre(hawkerCentre);

    let options = '<option value="">Select Stall</option>';

    stalls.forEach(stall => {
        options += `<option value="${stall.name}">${stall.name}</option>`;
    });

    stallSelect.innerHTML = options;
}

const response = await fetch(API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(inspection)
});

if (!response.ok) {
    throw new Error("Failed to submit inspection.");
}

alert("✅ Inspection submitted successfully!");

document.getElementById("inspectionForm").reset();