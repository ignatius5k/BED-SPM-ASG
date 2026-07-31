// Links the order page review form to the feedback backend.

const API_BASE = "http://localhost:3000";
const CURRENT_CUSTOMER_ID = "CUST001";
const STALL_ID = "STALL001";

// READ: load this stall's feedback and show it on the page
async function loadReviews() {
  try {
    const res = await fetch(API_BASE + "/feedback");
    const all = await res.json();

    const reviews = all.filter(function (r) {
      return r.stall_id === STALL_ID;
    });

    let total = 0;
    for (let i = 0; i < reviews.length; i++) {
      total = total + reviews[i].rating;
    }
    const count = reviews.length;
    const avg = count > 0 ? (total / count).toFixed(1) : "0.0";

    document.querySelector("#rating-overall h3").textContent = avg;
    document.querySelector("#rating-count p").textContent = count + " Reviews";

    const carousel = document.getElementById("review-carousel");
    carousel.innerHTML = "";
    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      if (r.comments && r.comments.trim() !== "") {
        const card = document.createElement("div");
        card.className = "review";
        card.innerHTML =
          '<div class="review-profile"></div>' +
          '<p class="review-name">Customer</p>' +
          '<p class="review-date"></p>' +
          '<p class="review-rating">' + r.rating + "/5" + "</p>" +
          '<p class="review-desc">' + r.comments + "</p>";

        const desc = card.querySelector(".review-desc");

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "review-action";
        editBtn.addEventListener("click", function () {
          editReview(r.feedback_id, r.rating, r.comments);
        });

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "review-action";
        delBtn.addEventListener("click", function () {
          deleteReview(r.feedback_id);
        });

        desc.appendChild(document.createElement("br"));
        desc.appendChild(editBtn);
        desc.appendChild(delBtn);

        carousel.appendChild(card);
      }
    }
  } catch (err) {
    console.error("Could not load reviews:", err);
  }
}

// DELETE: remove a review
async function deleteReview(id) {
  const sure = confirm("Delete this review?");
  if (!sure) {
    return;
  }
  try {
    const res = await fetch(API_BASE + "/feedback/" + id, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Could not delete the review.");
      return;
    }
    loadReviews();
  } catch (err) {
    console.error(err);
    alert("Could not delete the review.");
  }
}

// UPDATE: edit a review's rating and comment
async function editReview(id, currentRating, currentComments) {
  const newRating = prompt("New rating (1 to 5):", currentRating);
  if (newRating === null) {
    return;
  }
  const ratingNum = Number(newRating);
  if (ratingNum < 1 || ratingNum > 5) {
    alert("Rating must be between 1 and 5.");
    return;
  }

  const newComments = prompt("New comment:", currentComments);
  if (newComments === null) {
    return;
  }

  try {
    const res = await fetch(API_BASE + "/feedback/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: ratingNum,
        comments: newComments,
      }),
    });
    if (!res.ok) {
      alert("Could not update the review.");
      return;
    }
    loadReviews();
  } catch (err) {
    console.error(err);
    alert("Could not update the review.");
  }
}

// open the review form
document.getElementById("write-review").addEventListener("click", function () {
  document.getElementById("review-overlay").style.display = "flex";
});

// CREATE: submit a new review
document.getElementById("review-overlay").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.currentTarget;
  const ratingInput = form.querySelector('input[name="rating"]:checked');
  const commentsInput = form.querySelector('textarea[name="description"]');

  if (!ratingInput) {
    alert("Please select a star rating.");
    return;
  }

  const rating = Number(ratingInput.value);
  const comments = commentsInput.value.trim();

  // DEBUG: shows exactly what is being sent
  console.log("sending:", { customer_id: CURRENT_CUSTOMER_ID, stall_id: STALL_ID, rating: rating, comments: comments });

  try {
    const res = await fetch(API_BASE + "/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: CURRENT_CUSTOMER_ID,
        stall_id: STALL_ID,
        rating: rating,
        comments: comments,
      }),
    });

    // DEBUG: if it fails, print the backend's reason
    if (!res.ok) {
      const errText = await res.text();
      console.log("backend rejected it:", res.status, errText);
      alert("Sorry, your review could not be submitted.");
      return;
    }

    form.reset();
    document.getElementById("review-overlay").style.display = "none";
    loadReviews();
    alert("Thanks, your review has been posted.");
  } catch (err) {
    console.error(err);
    alert("Sorry, your review could not be submitted.");
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