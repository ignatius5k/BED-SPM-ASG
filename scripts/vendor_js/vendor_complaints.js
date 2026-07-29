const API = `${window.location.protocol}//${window.location.hostname}:3000`;

const vendorId = localStorage.getItem("userId");

let allComplaints = [];

async function loadComplaints() {
    const container = document.getElementById("complaints");
    const emptyMessage = document.getElementById("empty-message");

    if (!vendorId) {
        container.innerHTML = "";
        emptyMessage.style.display = "block";
        emptyMessage.textContent = "Sign in as a vendor to view complaints.";
        return;
    }

    const res = await fetch(`${API}/vendorComplaints/${encodeURIComponent(vendorId)}`);

    console.log("Response status:", res.status);

    const data = await res.json().catch(() => []);
    if (!res.ok) {
        throw new Error("Unable to load complaints.");
    }

    console.log("Complaints received:", data);

    allComplaints = data;
    emptyMessage.style.display = data.length === 0 ? "block" : "none";

    displayComplaints(allComplaints);
}

function displayComplaints(complaints) {

    const container = document.getElementById("complaints");

    container.innerHTML = "";

    complaints.forEach(c => {

        container.innerHTML += `
        <div class="complaint-card">

            <h3>${c.category}</h3>

            <p>${c.description}</p>

            <div class="meta">
                <span><strong>Customer:</strong> ${c.customer_id}</span>
                <span><strong>Date:</strong> ${new Date(c.complaint_date).toLocaleDateString()}</span>
            </div>

            <span class="badge ${c.status.replace(" ", "-")}">
                ${c.status}
            </span>

            <div class="actions">

                <select id="status-${c.complaint_id}">
                    <option value="pending" ${c.status==="pending"?"selected":""}>Pending</option>
                    <option value="in progress" ${c.status==="in progress"?"selected":""}>In Progress</option>
                    <option value="resolved" ${c.status==="resolved"?"selected":""}>Resolved</option>
                </select>

                <button onclick="updateComplaint('${c.complaint_id}')">
                    Update Status
                </button>

            </div>

        </div>
        `;
    });
}

window.updateComplaint = async function(id) {
    const status =
        document.getElementById(`status-${id}`).value;    
    await fetch(`${API}/vendorComplaints/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status
        })
    });
    loadComplaints();
}

document.getElementById("statusFilter").addEventListener("change", () => {
    const selected = document.getElementById("statusFilter").value;

    if (selected === "all") {
        displayComplaints(allComplaints);
    } else {
        const filtered = allComplaints.filter(
            c => c.status.toLowerCase() === selected.toLowerCase()
        );

        displayComplaints(filtered);
    }
})

loadComplaints().catch((error) => {
    console.warn(error.message);
});
