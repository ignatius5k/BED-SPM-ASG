import {
  getCurrentUser,
  getToken,
} from "./scripts/js-login/api.js";

const API_BASE = "http://localhost:3000";

const params = new URLSearchParams(window.location.search);
const hawkerCenterId = params.get("centerId");
const foodStallId = params.get("stallId");

const reviewCarousel = document.getElementById("review-carousel");
const reviewOverlay = document.getElementById("review-overlay");
const reviewForm = reviewOverlay;
const reviewHeading = document.querySelector("#review-overlay-header h4");
const writeReviewButton = document.getElementById("write-review");
const postReviewButton = document.getElementById("post-review");
const reviewCountElement = document.querySelector("#rating-count p");
const ratingValueElement = document.querySelector("#rating-overall h3");
const ratingImageElement = document.querySelector("#rating-overall img");

let editingReviewId = null;
let currentUserPromise = null;

function getReviewUser() {
  if (!currentUserPromise) {
    currentUserPromise = getCurrentUser();
  }

  return currentUserPromise;
}

async function reviewApiRequest(path, options = {}) {
  const finalOptions = {
    method: options.method || "GET",
    headers: {},
  };
  const currentUser = await getReviewUser();
  const token = getToken();

  if (options.body) {
    finalOptions.headers["Content-Type"] = "application/json";
    finalOptions.body = JSON.stringify(options.body);
  }

  if (currentUser && token) {
    finalOptions.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, finalOptions);
  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(data.error || "The review request failed");
  }

  return data;
}

function toDate(value) {
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
  let totalRating = 0;

  for (let i = 0; i < reviews.length; i += 1) {
    totalRating += Number(reviews[i].rating || 0);
  }

  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  reviewCountElement.textContent =
    `${reviews.length} ${reviews.length === 1 ? "Review" : "Reviews"}`;
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

function resetReviewForm() {
  reviewForm.reset();
  editingReviewId = null;
  reviewHeading.textContent = "Rating";
  postReviewButton.textContent = "Post";
}

function closeReviewOverlay() {
  reviewOverlay.style.display = "none";
  resetReviewForm();
}

function openReviewEditor(review) {
  resetReviewForm();
  editingReviewId = review.feedbackId;
  reviewHeading.textContent = "Edit rating";
  postReviewButton.textContent = "Save";

  const ratingInput = reviewForm.querySelector(
    `input[name="rating"][value="${review.rating}"]`
  );
  const descriptionInput = reviewForm.querySelector(
    'textarea[name="description"]'
  );

  if (ratingInput) {
    ratingInput.checked = true;
  }

  descriptionInput.value = review.comments || "";
  reviewOverlay.style.display = "flex";
}

async function deleteReview(review) {
  const confirmed = window.confirm("Delete this review permanently?");

  if (!confirmed) {
    return;
  }

  try {
    await reviewApiRequest(`/feedback/${review.feedbackId}`, {
      method: "DELETE",
    });
    await loadReviews();
    alert("Your review has been deleted.");
  } catch (error) {
    console.error("Could not delete review:", error);
    alert(error.message);
  }
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
  date.textContent = toDate(review.createdAt).toLocaleDateString("en-SG", {
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
  description.textContent = review.comments || "No written comment provided.";

  card.append(profileImage, name, date, rating, description);

  if (review.isOwner) {
    const actions = document.createElement("div");
    actions.className = "review-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "review-action review-edit";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => openReviewEditor(review));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "review-action review-delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteReview(review));

    actions.append(editButton, deleteButton);
    card.appendChild(actions);
  }

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
    const query = new URLSearchParams({
      centreId: hawkerCenterId,
      customerStallId: foodStallId,
    });
    const result = await reviewApiRequest(`/feedback?${query.toString()}`);
    const reviews = Array.isArray(result.reviews) ? result.reviews : [];

    updateRating(reviews);
    reviewCarousel.replaceChildren();

    if (reviews.length === 0) {
      showReviewMessage("No SQL reviews yet for this stall. Be the first to leave one.");
      return;
    }

    for (let i = 0; i < reviews.length; i += 1) {
      createReviewCard(reviews[i]);
    }
  } catch (error) {
    console.error("Could not load SQL reviews:", error);
    showReviewMessage("SQL reviews could not be loaded. Please try again.");
  }
}

writeReviewButton.addEventListener("click", async () => {
  if (!hawkerCenterId || !foodStallId) {
    alert("Please select a stall before writing a review.");
    return;
  }

  const currentUser = await getReviewUser();

  if (!currentUser || currentUser.role !== "customer") {
    alert("Please log in with a customer account before posting a review.");
    return;
  }

  resetReviewForm();
  reviewOverlay.style.display = "flex";
});

reviewOverlay.addEventListener("click", (event) => {
  if (event.target === reviewOverlay) {
    closeReviewOverlay();
  }
});

reviewOverlay.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ratingInput = reviewForm.querySelector('input[name="rating"]:checked');
  const descriptionInput = reviewForm.querySelector(
    'textarea[name="description"]'
  );

  if (!ratingInput) {
    alert("Please select a star rating.");
    return;
  }

  const payload = {
    rating: Number(ratingInput.value),
    comments: descriptionInput.value.trim(),
  };
  const isEditing = editingReviewId !== null;

  if (!isEditing) {
    payload.centreId = hawkerCenterId;
    payload.customerStallId = foodStallId;
  }

  postReviewButton.disabled = true;

  try {
    await reviewApiRequest(
      isEditing ? `/feedback/${editingReviewId}` : "/feedback",
      {
        method: isEditing ? "PUT" : "POST",
        body: payload,
      }
    );

    closeReviewOverlay();
    await loadReviews();
    alert(isEditing ? "Your review has been updated." : "Thanks, your review has been posted.");
  } catch (error) {
    console.error("Could not save SQL review:", error);
    alert(error.message);
  } finally {
    postReviewButton.disabled = false;
  }
});

const issueForm = document.getElementById("issue-overlay");
const submitIssueButton = document.getElementById("submit-issue");

// Only a signed-in customer with a selected stall can report an issue.
document.getElementById("write-issue").addEventListener("click", async function () {
  if (!hawkerCenterId || !foodStallId) {
    alert("Please select a stall before reporting an issue.");
    return;
  }

  const currentUser = await getReviewUser();

  if (!currentUser || currentUser.role !== "customer" || !getToken()) {
    alert("Please log in with a customer account before reporting an issue.");
    return;
  }

  document.getElementById("issue-overlay").style.display = "flex";
});

issueForm.addEventListener("submit", async function (e) {
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

  const currentUser = await getReviewUser();
  const token = getToken();

  if (!currentUser || currentUser.role !== "customer" || !token) {
    alert("Please log in with a customer account before reporting an issue.");
    return;
  }

  submitIssueButton.disabled = true;

  try {
    const res = await fetch(API_BASE + "/complaint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        centreId: hawkerCenterId,
        customerStallId: foodStallId,
        category: typeInput.value,
        description: description,
      }),
    });

    if (!res.ok) {
      const responseText = await res.text();
      let errorMessage = "Sorry, your issue could not be submitted.";

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          console.log("complaint rejected:", res.status, responseText);
        }
      }

      throw new Error(errorMessage);
    }

    form.reset();
    document.getElementById("issue-overlay").style.display = "none";
    alert("Your issue has been submitted and will be reviewed by an admin.");
  } catch (err) {
    console.error(err);
    alert(err.message || "Sorry, your issue could not be submitted.");
  } finally {
    submitIssueButton.disabled = false;
  }
});

loadReviews();
