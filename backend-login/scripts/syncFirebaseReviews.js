const fs = require("fs");
const path = require("path");

const APPLY_MODE = process.argv.includes("--apply");
const CLEANUP_MODE = process.argv.includes("--cleanup");
const SEED_BATCH = "stall-review-seed-20260731";
const REVIEWS_PER_STALL = 3;
const BASE_REVIEW_DATE = Date.parse("2026-07-31T08:00:00.000Z");

const CENTRES = [
  { id: "050335", name: "Chinatown Complex Market" },
  { id: "069184", name: "Maxwell Food Centre" },
  { id: "168898", name: "Tiong Bahru Market" },
  { id: "390051", name: "Old Airport Road Food Centre" },
];

const RATING_PATTERNS = [
  [5, 4, 4],
  [4, 5, 3],
  [5, 4, 5],
  [4, 3, 5],
];

function loadFirebaseConfig() {
  const firebaseFile = path.resolve(__dirname, "../../scripts/firebase.js");
  const source = fs.readFileSync(firebaseFile, "utf8");
  const projectMatch = source.match(/projectId:\s*"([^"]+)"/);
  const apiKeyMatch = source.match(/apiKey:\s*"([^"]+)"/);

  if (!projectMatch || !apiKeyMatch) {
    throw new Error("Could not read the Firebase project configuration.");
  }

  return {
    projectId: projectMatch[1],
    apiKey: apiKeyMatch[1],
  };
}

const firebaseConfig = loadFirebaseConfig();
const documentsBaseUrl =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  "/databases/(default)/documents";

function documentId(document) {
  return document.name.split("/").pop();
}

function readFirestoreValue(value) {
  if (!value) return null;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
    return value.stringValue;
  }
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
    return Number(value.integerValue);
  }
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) {
    return Boolean(value.booleanValue);
  }
  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) {
    return value.timestampValue;
  }
  return null;
}

function readFields(document) {
  const fields = {};

  for (const [fieldName, value] of Object.entries(document.fields || {})) {
    fields[fieldName] = readFirestoreValue(value);
  }

  return fields;
}

function encodePath(documentPath) {
  return documentPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function requestUrl(documentPath) {
  return (
    `${documentsBaseUrl}/${encodePath(documentPath)}` +
    `?key=${encodeURIComponent(firebaseConfig.apiKey)}`
  );
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

async function listDocuments(documentPath, pageSize = 300) {
  const response = await fetch(`${requestUrl(documentPath)}&pageSize=${pageSize}`);
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || data.message || `Firebase request failed with ${response.status}`
    );
  }

  return data.documents || [];
}

function firestoreFields(review) {
  return {
    userId: { stringValue: review.userId },
    displayName: { stringValue: review.displayName },
    hawkerCenterId: { stringValue: review.hawkerCenterId },
    hawkerCenterName: { stringValue: review.hawkerCenterName },
    foodStallId: { stringValue: review.foodStallId },
    foodStallName: { stringValue: review.foodStallName },
    rating: { integerValue: String(review.rating) },
    description: { stringValue: review.description },
    date: { timestampValue: review.date },
    isSampleData: { booleanValue: true },
    seedBatch: { stringValue: SEED_BATCH },
  };
}

async function upsertReview(review) {
  const response = await fetch(requestUrl(`reviews/${review.documentId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: firestoreFields(review) }),
  });
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || data.message || `Review write failed with ${response.status}`
    );
  }
}

async function deleteReview(documentIdValue) {
  const response = await fetch(requestUrl(`reviews/${documentIdValue}`), {
    method: "DELETE",
  });

  if (response.status === 404) return;

  if (!response.ok) {
    const data = await readResponse(response);
    throw new Error(
      data.error?.message || data.message || `Review deletion failed with ${response.status}`
    );
  }
}

async function runInBatches(items, batchSize, worker) {
  for (let index = 0; index < items.length; index += batchSize) {
    await Promise.all(items.slice(index, index + batchSize).map(worker));
  }
}

async function readStalls() {
  const stalls = [];

  for (const centre of CENTRES) {
    const stallDocuments = await listDocuments(
      `hawker-centers/${centre.id}/food-stalls`,
      100
    );
    stallDocuments.sort((left, right) =>
      documentId(left).localeCompare(documentId(right))
    );

    for (const stallDocument of stallDocuments) {
      const fields = readFields(stallDocument);
      stalls.push({
        hawkerCenterId: centre.id,
        hawkerCenterName: centre.name,
        foodStallId: documentId(stallDocument),
        foodStallName: fields.name || documentId(stallDocument),
      });
    }
  }

  return stalls;
}

function buildReviews(stalls) {
  const reviews = [];

  stalls.forEach((stall, stallIndex) => {
    const ratings = RATING_PATTERNS[stallIndex % RATING_PATTERNS.length];
    const comments = [
      `${stall.foodStallName} served a satisfying meal with good flavour.`,
      "The portion was generous and my order was ready on time.",
      `I enjoyed the food and would order from ${stall.foodStallName} again.`,
    ];

    for (let reviewIndex = 0; reviewIndex < REVIEWS_PER_STALL; reviewIndex += 1) {
      const reviewNumber = reviewIndex + 1;
      const daysAgo = (stallIndex * REVIEWS_PER_STALL + reviewIndex) % 24;
      const date = new Date(BASE_REVIEW_DATE - daysAgo * 24 * 60 * 60 * 1000);

      reviews.push({
        documentId:
          `${SEED_BATCH}-${stall.hawkerCenterId}-${stall.foodStallId}` +
          `-${String(reviewNumber).padStart(2, "0")}`,
        userId: `sample-reviewer-${String(reviewNumber).padStart(2, "0")}`,
        displayName: `Sample Customer ${reviewNumber}`,
        hawkerCenterId: stall.hawkerCenterId,
        hawkerCenterName: stall.hawkerCenterName,
        foodStallId: stall.foodStallId,
        foodStallName: stall.foodStallName,
        rating: ratings[reviewIndex],
        description: comments[reviewIndex],
        date: date.toISOString(),
      });
    }
  });

  return reviews;
}

async function verifySeed(expectedCount) {
  const reviewDocuments = await listDocuments("reviews");
  const seededReviews = reviewDocuments.filter(
    (document) => readFields(document).seedBatch === SEED_BATCH
  );

  if (seededReviews.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} seeded reviews but found ${seededReviews.length}.`
    );
  }

  return seededReviews.length;
}

async function main() {
  if (APPLY_MODE && CLEANUP_MODE) {
    throw new Error("Choose either --apply or --cleanup, not both.");
  }

  const stalls = await readStalls();
  const reviews = buildReviews(stalls);

  if (stalls.length !== 16 || reviews.length !== 48) {
    throw new Error(
      `Expected 16 Firebase stalls and 48 reviews, found ${stalls.length} stalls and ${reviews.length} reviews.`
    );
  }

  if (!APPLY_MODE && !CLEANUP_MODE) {
    console.log(
      `Dry run: ${reviews.length} reviews are ready for ${stalls.length} stalls. ` +
        "Use --apply to write them or --cleanup to remove this seed batch."
    );
    console.table(
      stalls.map((stall) => ({
        centreId: stall.hawkerCenterId,
        stallId: stall.foodStallId,
        stallName: stall.foodStallName,
        reviewsToAdd: REVIEWS_PER_STALL,
      }))
    );
    return;
  }

  if (CLEANUP_MODE) {
    await runInBatches(reviews, 8, (review) => deleteReview(review.documentId));
    await verifySeed(0);
    console.log(`Removed ${reviews.length} seeded Firebase reviews.`);
    return;
  }

  await runInBatches(reviews, 8, upsertReview);
  const verifiedCount = await verifySeed(reviews.length);
  console.log(
    `Seeded and verified ${verifiedCount} Firebase reviews across ${stalls.length} stalls.`
  );
}

main().catch((error) => {
  console.error("Firebase review sync failed:", error.message);
  process.exitCode = 1;
});
