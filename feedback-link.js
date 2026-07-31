import { db, auth } from "./scripts/firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Reviews use Firebase because the customer order flow identifies stalls with
// Firebase centre/stall IDs. The legacy complaint form below remains unchanged.
const API_BASE = "http://localhost:3000";
const CURRENT_CUSTOMER_ID = 1;
const STALL_ID = 1;

const params = new URLSearchParams(window.location.search);
const hawkerCenterId = params.get("centerId");
const foodStallId = params.get("stallId");

const reviewCarousel = document.getElementById("review-carousel");
const reviewOverlay = document.getElementById("review-overlay");
const writeReviewButton = document.getElementById("write-review");
const reviewCountElement = document.querySelector("#rating-count p");
const ratingValueElement = document.querySelector("#rating-overall h3");
const ratingImageElement = document.querySelector("#rating-overall img");

let currentUserId = "";
let currentDisplayName = "Customer";
let hawkerCenterName = "";
let foodStallName = "";

const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      resolve(null);
      return;
    }

    currentUserId = user.uid;
    currentDisplayName = user.displayName || user.email?.split("@")[0] || "Customer";

    try {
      const userSnapshot = await getDoc(doc(db, "users", user.uid));
      if (userSnapshot.exists() && userSnapshot.data().displayName) {
        currentDisplayName = userSnapshot.data().displayName;
      }
    } catch (error) {
      console.warn("Could not load the reviewer's display name:", error);
    }

    resolve(user);
  });
});

async function loadLocationNames() {
  if (!hawkerCenterId || !foodStallId) {
    return;
  }

  try {
    const [centerSnapshot, stallSnapshot] = await Promise.all([
      getDoc(doc(db, "hawker-centers", hawkerCenterId)),
      getDoc(doc(db, "hawker-centers", hawkerCenterId, "food-stalls", foodStallId)),
    ]);

    hawkerCenterName = centerSnapshot.exists() ? centerSnapshot.data().name || "" : "";
    foodStallName = stallSnapshot.exists() ? stallSnapshot.data().name || "" : "";
  } catch (error) {
    console.warn("Could not load review location names:", error);
  }
}

const locationNamesReady = loadLocationNames();

function toDate(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsed = value ? new Date(value) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function showReviewMessage(message) {
  reviewCarousel.replaceChildren();
  const emptyMessage = document.createElement("p");
  emptyMessage.className = "review-empty";
  emptyMessage.textContent = message;
  reviewCarousel.appendChild(emptyMessage);
}

function updateRating(reviews) {
  const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  reviewCountElement.textContent = `${reviews.length} ${reviews.length === 1 ? "Review" : "Reviews"}`;
  ratingValueElement.textContent = averageRating.toFixed(1);

  if (averageRating === 0) {
    ratingValueElement.style.color = "#474747";
    ratingImageElement.src = "icons/feedback/star-empty-5.svg";
    return;
  }

  const roundedRating = Math.max(1, Math.min(5, Math.round(averageRating)));
  const ratingColours = {
    1: "#AD343E",
    2: "#FF9247",
    3: "#FFD447",
    4: "#4CAF50",
    5: "#2E7D32",
  };

  ratingValueElement.style.color = ratingColours[roundedRating];
  ratingImageElement.src = `icons/feedback/star-${roundedRating}.svg`;
}

function createReviewCard(review) {
  const card = document.createElement("article");
  card.className = "review";

  const profileImage = document.createElement("img");
  profileImage.className = "review-profile";
  profileImage.src = "icons/feedback/blank-profile.svg";
  profileImage.alt = "Customer profile";

  const name = document.createElement("p");
  name.className = "review-name";
  name.textContent = review.displayName || "Anonymous";

  const date = document.createElement("p");
  date.className = "review-date";
  date.textContent = toDate(review.date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const rating = document.createElement("img");
  rating.className = "review-rating";
  rating.src = `icons/feedback/star-${review.rating}.svg`;
  rating.alt = `${review.rating} out of 5 stars`;

  const description = document.createElement("p");
  description.className = "review-desc";
  description.textContent = review.description;

  card.append(profileImage, name, date, rating, description);
  reviewCarousel.appendChild(card);
}

async function loadReviews() {
  updateRating([]);

  if (!hawkerCenterId || !foodStallId) {
    writeReviewButton.disabled = true;
    showReviewMessage("Select a stall to view its reviews.");
    return;
  }

  showReviewMessage("Loading reviews...");

  try {
    const reviewQuery = query(
      collection(db, "reviews"),
      where("hawkerCenterId", "==", hawkerCenterId),
      where("foodStallId", "==", foodStallId),
    );
    const snapshot = await getDocs(reviewQuery);
    const reviews = snapshot.docs
      .map((reviewDocument) => reviewDocument.data())
      .sort((left, right) => toDate(right.date) - toDate(left.date));

    updateRating(reviews);
    reviewCarousel.replaceChildren();

    const writtenReviews = reviews.filter(
      (review) => typeof review.description === "string" && review.description.trim() !== "",
    );

    if (writtenReviews.length === 0) {
      showReviewMessage(
        reviews.length > 0
          ? "This stall has ratings but no written reviews yet."
          : "No reviews yet for this stall. Be the first to leave one.",
      );
      return;
    }

    writtenReviews.forEach(createReviewCard);
  } catch (error) {
    console.error("Could not load reviews:", error);
    showReviewMessage("Reviews could not be loaded. Please try again.");
  }
}

writeReviewButton.addEventListener("click", () => {
  if (!hawkerCenterId || !foodStallId) {
    alert("Please select a stall before writing a review.");
    return;
  }

  reviewOverlay.style.display = "flex";
});

reviewOverlay.addEventListener("click", (event) => {
  if (event.target === reviewOverlay) {
    reviewOverlay.style.display = "none";
  }
});

reviewOverlay.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const ratingInput = form.querySelector('input[name="rating"]:checked');
  const descriptionInput = form.querySelector('textarea[name="description"]');

  if (!ratingInput) {
    alert("Please select a star rating.");
    return;
  }

  const signedInUser = await authReady;
  if (!signedInUser) {
    alert("Please log in before posting a review.");
    return;
  }

  await locationNamesReady;

  const postButton = document.getElementById("post-review");
  postButton.disabled = true;

  try {
    await addDoc(collection(db, "reviews"), {
      userId: currentUserId,
      displayName: currentDisplayName,
      hawkerCenterId,
      hawkerCenterName,
      foodStallId,
      foodStallName,
      rating: Number(ratingInput.value),
      description: descriptionInput.value.trim(),
      date: new Date(),
    });

    form.reset();
    reviewOverlay.style.display = "none";
    await loadReviews();
    alert("Thanks, your review has been posted.");
  } catch (error) {
    console.error("Could not submit review:", error);
    alert("Sorry, your review could not be submitted.");
  } finally {
    postButton.disabled = false;
  }
});

// open the complaint form
document.getElementById("write-issue").addEventListener("click", function () {
  document.getElementById("issue-overlay").style.display = "flex";
});

// CREATE: submit a complaint
document.getElementById("issue-overlay").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.currentTarget;
  const typeInput = form.querySelector('input[name="choice"]:checked');
  const descInput = form.querySelector('textarea[name="description"]');

  if (!typeInput) {
    alert("Please select an issue type.");
    return;
  }
  const description = descInput.value.trim();
  if (description === "") {
    alert("Please describe your issue.");
    return;
  }

  try {
    const res = await fetch(API_BASE + "/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: String(CURRENT_CUSTOMER_ID),
        stall_id: String(STALL_ID),
        complaint_type: typeInput.value,
        description: description,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log("complaint rejected:", res.status, errText);
      alert("Sorry, your issue could not be submitted.");
      return;
    }

    form.reset();
    document.getElementById("issue-overlay").style.display = "none";
    alert("Your issue has been submitted and will be reviewed by an admin.");
  } catch (err) {
    console.error(err);
    alert("Sorry, your issue could not be submitted.");
  }
});

// load reviews on page open
loadReviews();
