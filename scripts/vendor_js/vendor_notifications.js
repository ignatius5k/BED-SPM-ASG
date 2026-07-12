const API = "http://localhost:3000";

const vendorId = localStorage.getItem("userId");

console.log("Current vendor:", vendorId);

async function loadNotifications() {

    const res = await fetch(`${API}/notifications/${vendorId}`);
    const notifications = await res.json();

    const container = document.getElementById("notifications");

    container.innerHTML = "";

    notifications.forEach(notification => {

        container.innerHTML += `
            <div class="notification ${notification.IsRead ? "read" : "unread"}">

                <h4>${notification.Message}</h4>

                <small>
                    ${new Date(notification.CreatedAt).toLocaleString()}
                </small>

                <br><br>

                ${
                    notification.IsRead
                    ? ""
                    : `<button onclick="markRead('${notification.NotificationID}')">
                            Mark as Read
                       </button>`
                }

                <button onclick="deleteNotification('${notification.NotificationID}')">
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

loadNotifications();