document.addEventListener("DOMContentLoaded", () => {

    loadStalls();
    const form = document.getElementById("inspectionForm");

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        // ==========================
        // Collect form values
        // ==========================

const inspection = {

    // Temporary values
    StallID:
    document.getElementById("stall").value,

    InspectorID: "INSP001",

    InspectionDate: new Date().toISOString().split("T")[0],

    CleanlinessScore:
        Number(document.getElementById("inspectionScore").value),

    FoodHandlingScore:
        Number(document.getElementById("inspectionScore").value),

    Remarks:
        document.getElementById("remarks").value,

    Grade:
        document.getElementById("hygieneGrade").value

};

        console.log("Inspection:", inspection);

        

        
        try {

            const response = await fetch("http://localhost:3000/inspections", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(inspection)

            });

            const data = await response.json();

            console.log("Server response:", data);

            if (!response.ok) {
                alert(data.error || data.message);
                return;
            }

        } catch (err) {

            console.error(err);

            alert("Failed to submit inspection.");

            return;
        }
        

        // ==========================
        // Success message
        // ==========================

        alert("✅ Inspection submitted successfully!");

        form.reset();

        window.location.href = "inspection-dashboard.html";

    });

});




async function loadStalls() {

    try {

        let response = await fetch("http://localhost:3000/stalls/public");

        if (!response.ok) {
            response = await fetch("http://localhost:3000/stalls");
        }

        const stalls = await response.json();

        console.log("Stalls from API:", stalls);

        const select = document.getElementById("stall");

        console.log("Dropdown:", select);

        select.innerHTML =
            '<option value="">Select Stall</option>';

        stalls.forEach(stall => {

            console.log(stall);

            select.innerHTML += `
                <option value="${stall.StallID}">
                    ${stall.StallName}
                </option>
            `;

        });

    } catch (err) {

        console.error(err);

    }

}
