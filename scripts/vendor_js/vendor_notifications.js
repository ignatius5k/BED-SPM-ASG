const API = "http://localhost:3000";

const vendorId = localStorage.getItem("userId");

console.log("Current vendor:", vendorId);

async function loadNotifications() {

    const res = await fetch(`${API}/notifications/${vendorId}`);
    const notifications = await res.json();

    console.log("API response:", notifications);

    const container = document.getElementById("notifications");

    container.innerHTML = "";

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

// Load immediately when page opens
loadNotifications();


// Automatically check for new notifications every 2 seconds
setInterval(loadNotifications, 2000);