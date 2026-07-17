const STALL_API = "http://localhost:3000/stalls";
const INSPECTOR_API = "http://localhost:3000/inspectors";
const SCHEDULE_API = "http://localhost:3000/schedules";

window.onload = () => {
    loadStalls();
    loadInspectors();
    loadSchedules();

    document
        .getElementById("scheduleForm")
        .addEventListener("submit", createSchedule);

    document
        .getElementById("refreshBtn")
        .addEventListener("click", loadSchedules);
};

/* -------------------------
   Load Stalls
--------------------------*/

async function loadStalls() {

    try {

        const response = await fetch(STALL_API);
        const stalls = await response.json();

        const select = document.getElementById("stallSelect");

        select.innerHTML =
            '<option value="">Select Stall</option>';

        stalls.forEach(stall => {

            select.innerHTML += `
                <option value="${stall.StallID}">
                    ${stall.StallName}
                </option>
            `;

        });

    } catch (err) {

        console.error(err);

        alert("Unable to load stalls.");

    }

}

/* -------------------------
   Load Inspectors
--------------------------*/

async function loadInspectors() {

    try {

        const response = await fetch(INSPECTOR_API);

        const inspectors = await response.json();

        const select = document.getElementById("inspectorSelect");

        select.innerHTML =
            '<option value="">Select Inspector</option>';

        inspectors.forEach(inspector => {

            select.innerHTML += `
                <option value="${inspector.id}">
                    ${inspector.username}
                </option>
            `;

        });

    } catch (err) {

        console.error(err);

        alert("Unable to load inspectors.");

    }

}

/* -------------------------
   Load Schedule Table
--------------------------*/

async function loadSchedules() {

    try {

        const response = await fetch(SCHEDULE_API);

        const schedules = await response.json();

        const tbody =
            document.querySelector("#scheduleTable tbody");

        tbody.innerHTML = "";

        schedules.forEach(schedule => {

            const row = document.createElement("tr");

            row.innerHTML = `

                <td>${formatDate(schedule.ScheduleDate)}</td>

                <td>${schedule.ScheduleTime}</td>

                <td>${schedule.InspectorName}</td>

                <td>${schedule.StallName}</td>

                <td>

                    <span class="status pending">

                        ${schedule.Status}

                    </span>

                </td>

                <td>

                    <button
                        class="action-btn edit"
                        onclick="editSchedule(${schedule.ScheduleID})">

                        Edit

                    </button>

                    <button
                        class="action-btn delete"
                        onclick="deleteSchedule(${schedule.ScheduleID})">

                        Delete

                    </button>

                </td>

            `;

            tbody.appendChild(row);

        });

    } catch (err) {

        console.error(err);

        alert("Unable to load schedules.");

    }

}

/* -------------------------
   Create Schedule
--------------------------*/

async function createSchedule(event) {

    event.preventDefault();

    const schedule = {

        ScheduleDate:
            document.getElementById("inspectionDate").value,

        ScheduleTime:
            document.getElementById("inspectionTime").value,

        StallID:
            document.getElementById("stallSelect").value,

        InspectorID:
            document.getElementById("inspectorSelect").value,

        Purpose:
            document.getElementById("purpose").value,

        Status: "Pending"

    };

    try {

        const response = await fetch(SCHEDULE_API, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(schedule)

        });

        if (!response.ok) {

            throw new Error();

        }

        alert("Inspection scheduled successfully!");

        document.getElementById("scheduleForm").reset();

        loadSchedules();

    } catch (err) {

        console.error(err);

        alert("Unable to schedule inspection.");

    }

}

/* -------------------------
   Edit
--------------------------*/

function editSchedule(id) {

    window.location.href =
        `inspection-scheduling.html?id=${id}`;

}

/* -------------------------
   Delete
--------------------------*/

async function deleteSchedule(id) {

    const confirmDelete = confirm(
        "Delete this scheduled inspection?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${SCHEDULE_API}/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {

            throw new Error();

        }

        alert("Schedule deleted.");

        loadSchedules();

    } catch (err) {

        console.error(err);

        alert("Unable to delete schedule.");

    }

}

/* -------------------------
   Date Format
--------------------------*/

function formatDate(date) {

    return new Date(date).toLocaleDateString("en-SG");

}