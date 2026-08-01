const PUBLIC_STALL_API = "http://localhost:3000/stalls/public";
const LEGACY_STALL_API = "http://localhost:3000/stalls";
const INSPECTOR_API = "http://localhost:3000/inspectors";
const SCHEDULE_API = "http://localhost:3000/schedule";

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

        let response = await fetch(PUBLIC_STALL_API);

        if (!response.ok) {
            response = await fetch(LEGACY_STALL_API);
        }

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

                <td>${formatDate(schedule.ScheduledDate)}</td>

                <td>${formatTime(schedule.ScheduledTime)}</td>

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

    ScheduledDate:
        document.getElementById("inspectionDate").value,

    ScheduledTime:
        document.getElementById("inspectionTime").value + ":00",

    StallID:
        document.getElementById("stallSelect").value,

    InspectorID:
        document.getElementById("inspectorSelect").value,

    Status: "Pending"

};

console.log(schedule);

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

    const error = await response.json();

    console.log(error);

    alert(error.message);

    return;

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

function formatTime(timeString) {

    const date = new Date(timeString);

    return date.toLocaleTimeString("en-SG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

}
