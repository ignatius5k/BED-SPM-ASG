const API = "http://localhost:3000";
const vendorId = localStorage.getItem("userId");
const query = new URLSearchParams(window.location.search);
const mockPreference = query.get("mock");
const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const mockMode = mockPreference === "true" || (mockPreference !== "false" && isLiveServerPreview);

let mockNotifications = [
  {
    NotificationID: "demo-1",
    Message: "Rental agreement HCR-STALL001-CURRENT is due for renewal in 21 days.",
    CreatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    IsRead: "False",
  },
  {
    NotificationID: "demo-2",
    Message: "Your June sales performance report is ready to review.",
    CreatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    IsRead: "False",
  },
  {
    NotificationID: "demo-3",
    Message: "Ben's Chicken Rice maintained hygiene grade A at the latest inspection.",
    CreatedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    IsRead: "True",
  },
  {
    NotificationID: "demo-4",
    Message: "A customer left a 5-star review for Hainanese Chicken Rice.",
    CreatedAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
    IsRead: "True",
  },
];

function renderNotifications(notifications) {
  const container = document.getElementById("notifications");
  const emptyMessage = document.getElementById("empty-message");
  container.innerHTML = "";
  emptyMessage.style.display = notifications.length === 0 ? "block" : "none";

  notifications.forEach((notification) => {
    container.insertAdjacentHTML("beforeend", `
      <div class="notification ${notification.IsRead === "True" ? "read" : "unread"}">
        <h4>${notification.Message}</h4>
        <small>${new Date(notification.CreatedAt).toLocaleString("en-SG")}</small>
        <br><br>
        ${notification.IsRead === "True" ? "" : `
          <button class="read-btn" data-id="${notification.NotificationID}">Mark as Read</button>
        `}
        <button class="delete-btn" data-id="${notification.NotificationID}">Delete</button>
      </div>
    `);
  });
}

async function loadNotifications() {
  if (mockMode) {
    renderNotifications(mockNotifications);
    return;
  }

  try {
    const response = await fetch(`${API}/notifications/${vendorId}`);

    if (!response.ok) {
      throw new Error("Unable to load notifications");
    }

    renderNotifications(await response.json());
  } catch (error) {
    console.error("Notification loading error:", error);
    document.getElementById("empty-message").style.display = "block";
    document.getElementById("empty-message").textContent = "Notifications could not be loaded.";
  }
}

async function markRead(id) {
  if (mockMode) {
    mockNotifications = mockNotifications.map((notification) => (
      notification.NotificationID === id
        ? { ...notification, IsRead: "True" }
        : notification
    ));
    renderNotifications(mockNotifications);
    return;
  }

  await fetch(`${API}/notifications/${id}/read`, { method: "PUT" });
  loadNotifications();
}

async function deleteNotification(id) {
  if (mockMode) {
    mockNotifications = mockNotifications.filter((notification) => notification.NotificationID !== id);
    renderNotifications(mockNotifications);
    return;
  }

  await fetch(`${API}/notifications/${id}`, { method: "DELETE" });
  loadNotifications();
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("read-btn")) {
    markRead(event.target.dataset.id);
  }

  if (event.target.classList.contains("delete-btn")) {
    deleteNotification(event.target.dataset.id);
  }
});

loadNotifications();

if (!mockMode) {
  setInterval(loadNotifications, 2000);
}
