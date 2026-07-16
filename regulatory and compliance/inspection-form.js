

    document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submitBtn");

    submitBtn.addEventListener("click", function (e) {
        e.preventDefault();

        alert("Inspection form submitted successfully!");

        // Redirect after the user clicks OK
        window.location.href = "inspector-dashboard.html";
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