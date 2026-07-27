const API = `${window.location.protocol}//${window.location.hostname}:3000`;

const vendorId = localStorage.getItem("userId");

console.log("Current vendor:", vendorId);

async function loadNotifications() {
    const container = document.getElementById("notifications");
    const emptyMessage = document.getElementById("empty-message");

    if (!vendorId) {
        container.innerHTML = "";
        emptyMessage.style.display = "block";
        emptyMessage.querySelector("p").textContent = "Sign in as a vendor to view notifications.";
        return;
    }

    const res = await fetch(`${API}/notifications/${encodeURIComponent(vendorId)}`);
    const notifications = await res.json().catch(() => []);
    if (!res.ok) {
        throw new Error("Unable to load notifications.");
    }

    console.log("API response:", notifications);

    container.innerHTML = "";
    emptyMessage.style.display = notifications.length === 0 ? "block" : "none";

    notifications.forEach(notification => {

        container.innerHTML += `
            <div class="notification ${notification.IsRead === "True" ? "read" : "unread"}">

                <h4>${notification.Message}</h4>

                <small>
                    ${new Date(notification.CreatedAt).toLocaleString()}
                </small>

                <br><br>

                ${
                    notification.IsRead === "True"
                    ? ""
                    :  `<button class="read-btn" data-id="${notification.NotificationID}">
                            Mark as Read
                        </button>`
                }

                <button class="delete-btn" data-id="${notification.NotificationID}">
                    Delete
                </button>

            </div>
        `;
    });
}

async function markRead(id) {

    await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT"
    });

    loadNotifications();
}

async function deleteNotification(id) {

    await fetch(`${API}/notifications/${id}`, {
        method: "DELETE"
    });

    loadNotifications();
}

document.addEventListener("click", (e) => {

    if (e.target.classList.contains("read-btn")) {
        markRead(e.target.dataset.id);
    }

    if (e.target.classList.contains("delete-btn")) {
        deleteNotification(e.target.dataset.id);
    }

});

loadNotifications().catch((error) => {
    console.warn(error.message);
});

if (vendorId) {
    setInterval(() => {
        loadNotifications().catch((error) => console.warn(error.message));
    }, 15000);
}
