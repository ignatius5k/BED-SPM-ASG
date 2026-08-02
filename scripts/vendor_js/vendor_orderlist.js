const API_BASE = "http://localhost:3000";

const vendorId = localStorage.getItem("userId");

async function loadOrderHistory(vendorId) {
    const container = document.getElementById("orders-list");
    const empty = document.getElementById("empty-orders");

    container.innerHTML = "Loading...";

    try {
        const response = await fetch(
            `${API_BASE}/orderHistory/${vendorId}`
        );

        const data = await response.json();

        const pendingOrders = data.orders.filter(
            order => order.Status === "paid"
        );

        document.getElementById("pending-count").textContent =
            pendingOrders.length;

        if (!response.ok) {
            throw new Error(data.error);
        }

        container.innerHTML = "";

        if (data.orders.length === 0) {
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        data.orders.forEach(order => {
            container.appendChild(createOrderCard(order));
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Unable to load order history.";
    }
}

function createOrderCard(order) {

    const card = document.createElement("div");
    card.className = "order-card";

    card.innerHTML = `
        <h4>${order.OrderID}</h4>

        <p><strong>Stall:</strong> ${order.StallID}</p>

        <p><strong>Status:</strong> ${order.Status}</p>

        <p><strong>Total:</strong> $${Number(order.TotalAmount).toFixed(2)}</p>

        <small>
            ${new Date(order.OrderDate).toLocaleString()}
        </small>
    `;

    const statusSelect = document.createElement("select");

    const statuses = [
        "paid",
        "completed",
        "cancelled"
    ];

    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = status === order.Status;
        statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", async () => {
        try {
            const response = await fetch(
                `${API_BASE}/orderHistory/${order.OrderID}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: statusSelect.value
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Unable to update status");
            }

        } catch (err) {
            alert(err.message);
            statusSelect.value = order.Status;
        }
    });
    card.appendChild(statusSelect);

    return card;
}

loadOrderHistory(vendorId);