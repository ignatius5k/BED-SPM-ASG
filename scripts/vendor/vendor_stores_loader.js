const query = new URLSearchParams(window.location.search);
const mockPreference = query.get("mock");
const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const mockMode = mockPreference === "true" || (mockPreference !== "false" && isLiveServerPreview);

if (!mockMode) {
  import("./vendor_stores.js");
} else {
  const stores = [
    {
      id: "demo-store-1",
      name: "Ben's Chicken Rice",
      location: "Maxwell Food Centre",
      unitNumber: "#01-10",
      cuisine: "Chinese",
      hours: "7:30 AM - 7:30 PM",
      grade: "A",
      status: "open",
      image: "./food_stall/maxwell%20_food_center/chicken%20rice%20stall.jpg",
    },
    {
      id: "demo-store-2",
      name: "Old Airport Hokkien Mee",
      location: "Old Airport Road Food Centre",
      unitNumber: "#01-32",
      cuisine: "Chinese",
      hours: "11:00 AM - 9:00 PM",
      grade: "A",
      status: "open",
      image: "./food_stall/old_airport_road_food_center/nam_sing_hokkien_mee.jpg",
    },
    {
      id: "demo-store-3",
      name: "Tiong Bahru Western Grill",
      location: "Tiong Bahru Market",
      unitNumber: "#02-21",
      cuisine: "Western",
      hours: "12:00 PM - 8:30 PM",
      grade: "B",
      status: "closed",
      image: "./food_stall/tiong_bahru_market/Western%20Stall.jpg",
    },
  ];

  const storesGrid = document.getElementById("storesGrid");
  const searchInput = document.getElementById("searchInput");
  const gradeFilter = document.getElementById("gradeFilter");
  const statusFilter = document.getElementById("statusFilter");

  function renderStores(items) {
    storesGrid.innerHTML = "";

    items.forEach((store) => {
      storesGrid.insertAdjacentHTML("beforeend", `
        <article class="store-card">
          <div class="store-image">
            <img src="${store.image}" alt="${store.name}">
            <div class="badges">
              <span class="badge badge-${store.grade.toLowerCase()}">Grade ${store.grade}</span>
              <span class="badge ${store.status === "open" ? "badge-open" : "badge-closed"}">
                ${store.status === "open" ? "Open" : "Closed"}
              </span>
            </div>
          </div>
          <div class="store-header">
            <h3>${store.name}</h3>
            <p class="store-location">${store.location} • ${store.unitNumber}</p>
          </div>
          <div class="store-content">
            <div class="detail-row">
              <span class="detail-label">Cuisine Type:</span>
              <span class="detail-value">${store.cuisine}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Opening Hours:</span>
              <span class="detail-value">${store.hours}</span>
            </div>
          </div>
        </article>
      `);
    });
  }

  function filterStores() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const grade = gradeFilter.value;
    const status = statusFilter.value;
    const filtered = stores.filter((store) => {
      const matchesSearch = !searchTerm || [store.name, store.location, store.unitNumber, store.cuisine]
        .some((value) => value.toLowerCase().includes(searchTerm));
      const matchesGrade = !grade || store.grade === grade;
      const matchesStatus = !status || store.status === status;
      return matchesSearch && matchesGrade && matchesStatus;
    });

    renderStores(filtered);
  }

  searchInput.addEventListener("input", filterStores);
  gradeFilter.addEventListener("change", filterStores);
  statusFilter.addEventListener("change", filterStores);
  document.getElementById("addStoreBtn").addEventListener("click", () => {
    alert("Store creation is disabled in the presentation demo.");
  });

  renderStores(stores);
}
