import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { isGuest } from "./js-login/api.js"; //detect if user is a guest
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  addDoc,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  normalizeImagePath,
  setImageSrc
} from "./image-paths.js";

const auth = getAuth(app);

const container = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const payNowBtn = document.getElementById("pay-now");
const paymentButtons = document.querySelectorAll(".payments button");
let selectedPaymentMethod = null;
let orderCounter = Number(localStorage.getItem("orderCounter")) || 1008;
let item = null;

const userId = localStorage.getItem("userId");
const guest = isGuest();


console.log("Logged in as:", userId);

let itemsRef = null;
let snap = null;

if (!guest) {

    itemsRef = collection(db, "carts", userId, "items");

    console.log("Loading Firestore cart for:", userId);

    snap = await getDocs(itemsRef);

    console.log("Firestore cart size:", snap.size);

}

let subtotal = 0;
container.innerHTML = "";

let hasItems = false;

if (!guest) {

    snap.forEach(docSnap => {

        hasItems = true;

        item = docSnap.data();

        const addonHTML =
    item.addons && item.addons.length > 0
        ? `
            <div class="cart-addons">
                ${item.addons.map(addon => `
                    <div>+ ${addon.name} ($${Number(addon.price).toFixed(2)})</div>
                `).join("")}
            </div>
        `
        : "";
console.log(item);
console.log(item["stallId"])
        subtotal += (item.unitPrice ?? item.price ?? 0) * item.quantity;

        const div = document.createElement("div");
        div.className = "cart-item";

        const itemImagePath = normalizeImagePath(
            item.imagePath,
            "Background/background.png"
        );

        div.innerHTML = `
            <img class="cart-item-image" src="${itemImagePath}">
            <div class="cart-info">
    <h4>${item.quantity}x ${item.name}</h4>
    <p>${item.description ?? ""}</p>

    ${addonHTML}

    <span class="cart-price">
                    $${Number(item.unitPrice ?? item.price ?? 0).toFixed(2)}
                </span>
                <div class="remove">Remove</div>
            </div>
        `;

        setImageSrc(div.querySelector(".cart-item-image"), itemImagePath);

        div.querySelector(".remove").onclick = async () => {

            await deleteDoc(doc(itemsRef, docSnap.id));

            location.reload();

        };

        container.appendChild(div);

    });

}
else {
console.log("Guest:", guest);
console.log("User:", userId);

    const guestCart =
        JSON.parse(localStorage.getItem("guestCart")) || [];

    guestCart.forEach((item, index) => {
    console.log(JSON.stringify(item.addons, null, 2));

        hasItems = true;

        subtotal += item.unitPrice * item.quantity;

        const addonHTML =
    item.addons && item.addons.length > 0
        ? `
            <div class="cart-addons">
                ${item.addons?.map(addon => `
    <div class="addon">
        + ${addon.label} ($${Number(addon.price).toFixed(2)})
    </div>
`).join("") ?? ""}
            </div>
        `
        : "";

        const div = document.createElement("div");

        div.className = "cart-item";

        const itemImagePath = normalizeImagePath(
            item.imagePath,
            "Background/background.png"
        );

        div.innerHTML = `
            <img class="cart-item-image" src="${itemImagePath}">
            <div class="cart-info">
    <h4>${item.quantity}x ${item.name}</h4>

    ${addonHTML}

    <span class="cart-price">
                    $${item.unitPrice.toFixed(2)}
                </span>
                <div class="remove">Remove</div>
            </div>
        `;

        setImageSrc(div.querySelector(".cart-item-image"), itemImagePath);

        div.querySelector(".remove").onclick = () => {

            guestCart.splice(index, 1);

            localStorage.setItem(
                "guestCart",
                JSON.stringify(guestCart)
            );

            location.reload();

        };

        container.appendChild(div);

    });

}

// 🔒 Block payment if cart empty

if (!hasItems) {
  paymentButtons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  });

  payNowBtn.disabled = true;
  payNowBtn.style.opacity = "0.5";
  payNowBtn.style.cursor = "not-allowed";
}

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  // =========================
// FULFILLMENT LOGIC
// =========================
let fulfillmentType = "takeout";

const feesContainer = document.getElementById("fees");
const radios = document.querySelectorAll("input[name='fulfillment']");

radios.forEach(r => {
  r.addEventListener("change", () => {
    fulfillmentType = r.value;

    updateTotal(subtotal);  
    if (!guest) { // updates fee label UI
    loadAppliedCodes(userId, subtotal);
    } // recalculates promo + final total
  });
});


function updateTotal(subtotal) {
  let total = subtotal;
  feesContainer.innerHTML = "";

  if (fulfillmentType === "takeout") {
    const takeoutFee = 0.30;
    total += takeoutFee;

    feesContainer.innerHTML = `
      <div class="summary-row">
        <span>Takeaway Charge</span>
        <span>$${takeoutFee.toFixed(2)}</span>
      </div>
    `;
  }

  if (fulfillmentType === "delivery") {
    const deliveryFee = 2.00;

    let minOrderFee = 0;
    if (subtotal < 10) {
      minOrderFee = 10 - subtotal;
      total += minOrderFee;
    }

    total += deliveryFee;

    feesContainer.innerHTML = `
      ${minOrderFee > 0 ? `
        <div class="summary-row">
          <span>Min Order Fee</span>
          <span>$${minOrderFee.toFixed(2)}</span>
        </div>
      ` : ""}

      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>$${deliveryFee.toFixed(2)}</span>
      </div>
    `;
  }

  totalEl.textContent = `$${total.toFixed(2)}`;

  // store for payment.js
  sessionStorage.setItem("total", total.toFixed(2));
  sessionStorage.setItem("fulfillmentType", fulfillmentType);
}

// run once on load
updateTotal(subtotal);
if (!guest) {
  loadAppliedCodes(userId, subtotal);
}
const promoCode = document.getElementById("promo-code");

if (guest) {

    promoCode.style.display = "none";

}
else {

    promoCode.addEventListener("submit", async (e) => {

        e.preventDefault();

        const inputCode = document.getElementById("input-code");
        const now = Timestamp.fromDate(new Date());

        const promoQuery = query(
            collection(db, "promotions"),
            where("code", "==", inputCode.value),
            where("start", "<=", now),
            where("end", ">=", now)
        );

        const promoSnapshot = await getDocs(promoQuery);

        if (promoSnapshot.empty) {
            return alert("ℹ️ No promo codes found.");
        }

        const redemptionQuery = query(
            collection(db, "redemptions"),
            where("userId", "==", userId),
            where("code", "==", inputCode.value)
        );

        const redemptionSnapshot = await getDocs(redemptionQuery);

        if (!redemptionSnapshot.empty) {
            return alert("⚠️ You have already redeemed this promo code.");
        }

        const promoDoc = promoSnapshot.docs[0];
        const data = promoDoc.data();

        await addDoc(collection(db, "carts", userId, "appliedCodes"), {
            code: inputCode.value,
            discount: data.discount,
            type: data.type,
            description: data.description,
            redeemedAt: new Date().toLocaleDateString()
        });

        await addDoc(collection(db, "redemptions"), {
            userId,
            code: inputCode.value,
            type: data.type,
            description: data.description,
            redeemedAt: new Date()
        });

        await loadAppliedCodes(userId, subtotal);

        alert("✅ Promo code redeemed successfully!");
        promoCode.reset();

    });

}

/* =========================
   PAYMENT METHOD UI
========================= */

paymentButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // remove active (green) from all
    paymentButtons.forEach(b => b.classList.remove("active"));

    // make clicked one green
    btn.classList.add("active");

    // store selected payment method
    selectedPaymentMethod = btn.dataset.method;

    console.log("Selected payment:", selectedPaymentMethod);
  });
});


async function createVendorNotification() {

  orderCounter++;

  localStorage.setItem("orderCounter", orderCounter);

  console.log(orderCounter);
  const message = `[NEW ORDER] Order ID: ORD${orderCounter}`;

  try {
    const res = await fetch("http://localhost:3000/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        VendorID: "VEND002",
        StallID: item["stallId"],
        CenterID: item["centerId"],
        Message: message,
        IsRead: "False",
        OrderID: "ORD" + orderCounter
      })
    });

    const data = await res.json();
    console.log("Notification created:", data);

  } catch (err) {
    console.error("Notification failed:", err);
  }
}

/* =========================
   PAY NOW BUTTON
========================= */


payNowBtn.addEventListener("click", async () => {
  if (!selectedPaymentMethod) {
    alert("Please select a payment method.");
    return;
}
  if (isGuest()) {
    await saveGuestOrder();
} else {
    await saveFirestoreOrder();
}

  await createVendorNotification();
  const userId = localStorage.getItem("userId");  const fulfillmentType = sessionStorage.getItem("fulfillmentType") ?? "takeout";

  // 🔴 BLOCK delivery without address
  if (fulfillmentType === "delivery") {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const hasAddress = userSnap.exists() && userSnap.data()?.address?.line1;

    if (!hasAddress) {
      alert("Please add your delivery address in your profile before checkout.");
      window.location.href = "user.html";
      return;
    }
  }

  // 🔴 BLOCK Visa/Mastercard without saved card
  if (selectedPaymentMethod === "visa" || selectedPaymentMethod === "mastercard") {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const hasCard =
      userSnap.exists() &&
      userSnap.data()?.payment?.last4; // matches your Firestore

    if (!hasCard) {
      alert("Please add your card details in your profile before paying with card.");
      window.location.href = "user.html";
      return;
    }
  }

  /// store payment method
sessionStorage.setItem("paymentMethod", selectedPaymentMethod);

// 🟢 Show QR ONLY for PayNow
if (selectedPaymentMethod === "paynow") {
  document.getElementById("qr-modal").style.display = "flex";
  return;
}

// 🟢 Card or Cash → go straight to payment page
window.location.href = "payment.html";
});

/* =========================
   CALCULATE PROMOTIONS
========================= */
function applyDiscount(total, discount, type) {
  if (type === "percent") {
    return total * (1 - discount / 100);
  }
  return total - discount;
}

function createDiscount(description, discount, type) {
  const div = document.createElement("div");
  div.className = "summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.textContent = description;

  const valueSpan = document.createElement("span");
  valueSpan.className = "amount";
  valueSpan.textContent = type === "percent" ? `-${discount}%` : `-$${discount}`;

  div.append(labelSpan, valueSpan);
  return div;
}

async function loadAppliedCodes(userId, subtotal) {

  // const order_summary = document.querySelector(".order-summary");
  const discounts = document.getElementById("discounts")
  const appliedCodesRef = collection(db, "carts", userId, "appliedCodes");
  const snapshot = await getDocs(appliedCodesRef);

  const fulfillmentType = sessionStorage.getItem("fulfillmentType") ?? "takeout";

let total = subtotal;

// apply promo first
snapshot.forEach(doc => {
  const data = doc.data();
  total = applyDiscount(total, data.discount, data.type);
});

// apply correct fee AFTER promo
if (fulfillmentType === "takeout") {
  total += 0.30;
}

if (fulfillmentType === "delivery") {
  total += 2.00;

  if (subtotal < 10) {
    total += (10 - subtotal); // min order fee
  }
}

  discounts.querySelectorAll("div").forEach(el => el.remove());

  snapshot.forEach(doc => {
    const data = doc.data();

    discounts.append(createDiscount(data.description, data.discount, data.type));
  });

  totalEl.textContent = `$${Math.max(total, 0).toFixed(2)}`;
  sessionStorage.setItem("total", Math.max(total, 0).toFixed(2));
}

// QR DONE → go to payment page (register ONCE)
document.getElementById("qr-done").addEventListener("click", () => {
  window.location.href = "payment.html";
});

async function saveFirestoreOrder() {
    const fulfillmentType =
    sessionStorage.getItem("fulfillmentType") ?? "takeout";
    const itemsRef = collection(db, "carts", userId, "items");
    const itemsSnap = await getDocs(itemsRef);

    const items = [];

    itemsSnap.forEach(docSnap => {
        items.push(docSnap.data());
    });

    await addDoc(collection(db, "orders"), {

        userId,

        items,

        total: Number(sessionStorage.getItem("total")),

        paymentMethod: selectedPaymentMethod,

        fulfillmentType,

        createdAt: Timestamp.now(),

        status: "Preparing"

    });

    // Empty cart after saving order
    for (const document of itemsSnap.docs) {
        await deleteDoc(document.ref);
    }

}

function saveGuestOrder() {

    const items =
        JSON.parse(localStorage.getItem("guestCart")) || [];

    const existing =
        JSON.parse(localStorage.getItem("guestOrders")) || [];

    const fulfillmentType =
        sessionStorage.getItem("fulfillmentType") ?? "takeout";

    const order = {

        items,

        total: Number(sessionStorage.getItem("total")),

        paymentMethod: selectedPaymentMethod,

        fulfillmentType,

        createdAt: new Date().toISOString(),

        status: "Preparing"

    };

    existing.push(order);

    localStorage.setItem(
        "guestOrders",
        JSON.stringify(existing)
    );

    localStorage.removeItem("guestCart");

}

