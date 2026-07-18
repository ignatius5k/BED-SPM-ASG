import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  increment,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  resolveHawkerCenterImage,
  resolveProductImage,
  resolveStallImage,
  setImageSrc
} from "./image-paths.js";

/* =========================
   Firebase config (UNCHANGED)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyDac46txTyLdtBlJ4gvcvl2yxTlduC_FUE",
  authDomain: "hawkers-native.firebaseapp.com",
  projectId: "hawkers-native",
  storageBucket: "hawkers-native.firebasestorage.app",
  messagingSenderId: "25256491882",
  appId: "1:25256491882:web:99a54c487373e155278313"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const BEST_SELLERS_API = "http://localhost:3000/menu-items/best-sellers";

// Mock data keeps the Live Server preview independent from Firebase and MSSQL.
const MOCK_CENTER = {
  name: "Maxwell Food Centre",
  imagePath: "user_pages/hawker.jpg"
};

const MOCK_STALL = {
  name: "Ben's Chicken Rice",
  imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
};

const MOCK_PRODUCTS = [
  {
    id: "MENU001",
    name: "Steamed Chicken Rice",
    basePrice: 5.50,
    likes: 128,
    imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
  },
  {
    id: "MENU002",
    name: "Roasted Chicken Rice",
    basePrice: 6.00,
    likes: 96,
    imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
  },
  {
    id: "MENU003",
    name: "Chicken Soup",
    basePrice: 3.00,
    likes: 42,
    imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
  },
  {
    id: "MENU004",
    name: "Fried Rice",
    basePrice: 5.00,
    likes: 71,
    imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
  },
  {
    id: "MENU005",
    name: "Lime Juice",
    basePrice: 2.00,
    likes: 58,
    imagePath: "food_stall/maxwell _food_center/chicken rice stall.jpg"
  }
];

const MOCK_BEST_SELLERS = [
  { itemName: "Steamed Chicken Rice", category: "Main", price: 5.50, quantitySold: 7 },
  { itemName: "Lime Juice", category: "Drink", price: 2.00, quantitySold: 5 },
  { itemName: "Roasted Chicken Rice", category: "Main", price: 6.00, quantitySold: 4 },
  { itemName: "Fried Rice", category: "Main", price: 5.00, quantitySold: 3 },
  { itemName: "Chicken Soup", category: "Side", price: 3.00, quantitySold: 2 }
];

function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
}

/* =========================
   URL PARAMS
========================= */
const params = new URLSearchParams(window.location.search);
const mockMode = params.get("mock") === "true";

let centerId = params.get("centerId") || (mockMode ? "069184" : "");
let stallId = params.get("stallId") || (mockMode ? "01-01" : "");
document.querySelector('#breadcrumbs ul li:nth-child(2) a').href = `/food_stalls.html?centerId=${centerId}`;

if (!centerId || !stallId) {
  console.error("❌ Missing centerId or stallId in URL");
  throw new Error("Missing navigation context");
}

/* =========================
   Load hawker centre + stall info
========================= */
let centerRef;
let stallRef;
let center;
let stall;

if (mockMode) {
  center = MOCK_CENTER;
  stall = MOCK_STALL;
} else {
  centerRef = doc(db, "hawker-centers", centerId);
  stallRef = doc(centerRef, "food-stalls", stallId);

  const [centerSnap, stallSnap] = await Promise.all([
    getDoc(centerRef),
    getDoc(stallRef)
  ]);

  if (!centerSnap.exists() || !stallSnap.exists()) {
    throw new Error("Hawker centre or stall not found");
  }

  center = centerSnap.data();
  stall = stallSnap.data();
}

/* =========================
   Inject into HTML
========================= */
document.getElementById("stall-name").textContent =
  `${stall.name || "Stall"} #${stallId}`;

document.getElementById("stall-location").textContent =
  center.name;

const centerImagePath = resolveHawkerCenterImage(centerId, center.name, center.imagePath);
const stallImagePath = resolveStallImage(centerId, stall.name, stall.imagePath || center.imagePath);

setImageSrc(
  document.querySelector(".stall-banner"),
  stallImagePath,
  centerImagePath
);

/* Back button */
document.getElementById("back-btn").href =
  `food_stalls.html?centerId=${centerId}`;

/* =========================
   Load products from Firestore  ✅ FIXED
========================= */
let productsRef;
let allProducts;

if (mockMode) {
  allProducts = MOCK_PRODUCTS;
} else {
  productsRef = collection(stallRef, "products");
  const productsSnap = await getDocs(productsRef);

  allProducts = productsSnap.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/* =========================
   SA2-44: Load SQL best sellers
========================= */
function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function createBestSellerRow(item, index) {
  const row = document.createElement("tr");

  const rankCell = document.createElement("td");
  rankCell.className = "best-seller-rank";
  rankCell.textContent = index + 1;

  const nameCell = document.createElement("td");
  nameCell.className = "best-seller-name";
  nameCell.textContent = item.itemName;

  const categoryCell = document.createElement("td");
  categoryCell.textContent = item.category || "Uncategorised";

  const priceCell = document.createElement("td");
  priceCell.className = "best-seller-price";
  priceCell.textContent = formatPrice(item.price);

  const quantityCell = document.createElement("td");
  quantityCell.className = "best-seller-quantity";
  quantityCell.textContent = Number(item.quantitySold || 0).toLocaleString();

  row.appendChild(rankCell);
  row.appendChild(nameCell);
  row.appendChild(categoryCell);
  row.appendChild(priceCell);
  row.appendChild(quantityCell);

  return row;
}

function displayBestSellers(items, message) {
  const list = document.getElementById("best-sellers-list");
  list.innerHTML = "";

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "best-sellers-message";
    cell.textContent = message || "No completed sales were found for this stall.";
    row.appendChild(cell);
    list.appendChild(row);
    return;
  }

  for (let i = 0; i < items.length; i += 1) {
    list.appendChild(createBestSellerRow(items[i], i));
  }
}

async function loadBestSellers() {
  if (mockMode) {
    displayBestSellers(MOCK_BEST_SELLERS);
    return;
  }

  try {
    const query = new URLSearchParams({
      centreId: centerId,
      customerStallId: stallId
    });
    const response = await fetch(`${BEST_SELLERS_API}?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load best sellers");
    }

    displayBestSellers(data.items);
  } catch (error) {
    console.error("Best sellers error:", error);
    displayBestSellers([], "Best-selling items are temporarily unavailable.");
  }
}

await loadBestSellers();

/* =========================
   Render products
========================= */
const grid = document.getElementById("products-grid");

let renderToken = 0;

function renderProducts(products, isSearch = false) {
  const currentToken = ++renderToken;

  grid.innerHTML = "";

  const searchTitle = document.getElementById("search-title");
  searchTitle.style.display = isSearch ? "block" : "none";

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-search">
        <h4>No products found</h4>
        <p>Try searching something else.</p>
      </div>
    `;
    return;
  }

  (async () => {
    for (const product of products) {

      // 🛑 stop if a new render started
      if (currentToken !== renderToken) return;

      const card = document.createElement("div");
      card.className = "product-card";
      const productImagePath = resolveProductImage(
        centerId,
        stall.name,
        product.name,
        product.imagePath,
        stallImagePath
      );

      card.innerHTML = `
        <img class="product-image" src="${productImagePath}" alt="${product.name}">
        <div class="info">
          <h4>${product.name}</h4>
          <p class="price">$${product.basePrice ?? "--"}</p>

          <button class="like-btn" type="button" aria-label="Like product">
            <img class="like-icon" src="icons/order/like.svg" alt="like">
            <span class="like-count">${product.likes ?? 0}</span>
          </button>
        </div>
      `;

      setImageSrc(card.querySelector(".product-image"), productImagePath, stallImagePath);

      const likeBtn = card.querySelector(".like-btn");
      const likeIcon = card.querySelector(".like-icon");
      const likeCount = card.querySelector(".like-count");

      if (mockMode) {
        likeBtn.disabled = true;
        likeBtn.title = "Like actions are disabled in the mock preview";
      } else {
        const productRef = doc(productsRef, product.id);
        const userId = auth.currentUser?.uid;

        if (userId) {
          const likeRef = doc(productRef, "likes", userId);
          const likeDoc = await getDoc(likeRef);

          // Stop if a new render started while awaiting.
          if (currentToken !== renderToken) return;

          likeIcon.src = likeDoc.exists()
            ? "icons/order/unlike.svg"
            : "icons/order/like.svg";
        }

        likeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();

          const userId = auth.currentUser?.uid;
          if (!userId) {
            alert("You must be signed in to like!");
            return;
          }

          const likeRef = doc(productRef, "likes", userId);

          try {
            await runTransaction(db, async (transaction) => {
              const likeDoc = await transaction.get(likeRef);

              if (!likeDoc.exists()) {
                transaction.set(likeRef, { userId, timestamp: serverTimestamp() });
                transaction.update(productRef, { likes: increment(1) });

                likeCount.textContent = Number(likeCount.textContent) + 1;
                likeIcon.src = "icons/order/unlike.svg";

                const p = allProducts.find(p => p.id === product.id);
                if (p) p.likes = (p.likes ?? 0) + 1;
              } else {
                transaction.delete(likeRef);
                transaction.update(productRef, { likes: increment(-1) });

                likeCount.textContent = Number(likeCount.textContent) - 1;
                likeIcon.src = "icons/order/like.svg";

                const p = allProducts.find(p => p.id === product.id);
                if (p) p.likes = Math.max((p.likes ?? 0) - 1, 0);
              }
            });
          } catch (error) {
            console.error("Transaction failed:", error);
          }
        });

        card.addEventListener("click", () => {
          window.location.href =
            `addtocart.html?centerId=${centerId}&stallId=${stallId}&productId=${product.id}`;
        });
      }

      grid.appendChild(card);
    }
  })();
}

/* Initial render */
if (!mockMode) {
  await waitForAuthReady();
}
renderProducts(allProducts);

/* SEARCH */
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase().trim();

  if (!keyword) {
    renderProducts(allProducts, false);
    return;
  }

  const filtered = allProducts.filter(p =>
    p.name?.toLowerCase().includes(keyword)
  );

  renderProducts(filtered, true);
});



