const API_URL = "http://localhost:3000/inspections";

window.onload = () => {
    loadInspections();
};

async function loadInspections() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load inspections.");
        }

        const inspections = await response.json();

        const tableBody = document.querySelector("#inspectionTable tbody");

        tableBody.innerHTML = "";

        inspections.forEach(inspection => {

            const averageScore = Math.round(
                (inspection.CleanlinessScore + inspection.FoodHandlingScore) / 2
            );

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${inspection.InspectionID}</td>
                <td>${inspection.StallID}</td>
                <td>${inspection.InspectorID}</td>
                <td>${formatDate(inspection.InspectionDate)}</td>
                <td>${inspection.Grade}</td>
                <td>${averageScore}</td>
                <td>
                    <button class="action-btn edit" onclick="editInspection(${inspection.InspectionID})">Edit</button>
                    <button class="action-btn delete" onclick="deleteInspection(${inspection.InspectionID})">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);

        });

    } catch (error) {
        console.error(error);
        alert("Unable to load inspections.");
    }
}

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-SG");

}

function editInspection(id) {

    window.location.href = `inspection-form.html?id=${id}`;

}

async function deleteInspection(id) {

    const confirmDelete = confirm("Are you sure you want to delete this inspection?");

    if (!confirmDelete) return;

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed.");
        }

        alert("Inspection deleted successfully.");

        loadInspections();

    } catch (error) {

        console.error(error);

        alert("Unable to delete inspection.");

    }

}