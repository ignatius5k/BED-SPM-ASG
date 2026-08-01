const PROJECT_ID = "hawkers-native";
const CENTRE_ID = "069184";
const STALL_ID = "01-05";
const API_ROOT =
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
  "/databases/(default)/documents";
const APPLY_MODE = process.argv.includes("--apply");
const CLEANUP_MODE = process.argv.includes("--cleanup");
const ACCESS_TOKEN = process.env.FIREBASE_ACCESS_TOKEN || "";

const store = {
  name: "Ben's Chicken Rice",
  imagePath:
    "assets/images/food_stall/maxwell _food_center/chicken rice stall.jpg",
  sqlStallId: "STALL001",
  catalogSource: "BED-SPM-ASG",
};

const products = [
  {
    id: "MENU001",
    name: "Steamed Chicken Rice",
    description: "Classic steamed chicken with fragrant rice",
    basePrice: 5.5,
    likes: 0,
    imagePath: "",
    sqlMenuItemId: "MENU001",
  },
  {
    id: "MENU002",
    name: "Roasted Chicken Rice",
    description: "Roasted chicken with fragrant rice",
    basePrice: 6,
    likes: 0,
    imagePath: "",
    sqlMenuItemId: "MENU002",
  },
  {
    id: "MENU003",
    name: "Chicken Soup",
    description: "Clear chicken soup",
    basePrice: 3,
    likes: 0,
    imagePath: "",
    sqlMenuItemId: "MENU003",
  },
  {
    id: "MENU004",
    name: "Fried Rice",
    description: "Wok-fried rice with egg",
    basePrice: 5,
    likes: 0,
    imagePath: "",
    sqlMenuItemId: "MENU004",
  },
  {
    id: "MENU005",
    name: "Lime Juice",
    description: "Fresh lime drink",
    basePrice: 2,
    likes: 0,
    imagePath: "",
    sqlMenuItemId: "MENU005",
  },
].map((product) => ({
  ...product,
  catalogSource: "BED-SPM-ASG",
}));

function headers() {
  const result = { "Content-Type": "application/json" };

  if (ACCESS_TOKEN) {
    result.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  return result;
}

function toFirestoreFields(record) {
  const result = {};

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "number") {
      result[key] = Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    } else if (typeof value === "boolean") {
      result[key] = { booleanValue: value };
    } else {
      result[key] = { stringValue: String(value) };
    }
  }

  return result;
}

function fromFirestoreFields(fields) {
  const result = {};

  for (const [key, value] of Object.entries(fields || {})) {
    if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
      result[key] = value.stringValue;
    } else if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
      result[key] = Number(value.integerValue);
    } else if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) {
      result[key] = Number(value.doubleValue);
    } else if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) {
      result[key] = Boolean(value.booleanValue);
    }
  }

  return result;
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getDocument(path) {
  const response = await fetch(`${API_ROOT}/${path}`, {
    headers: headers(),
  });

  if (response.status === 404) {
    return null;
  }

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Firebase read failed with ${response.status}`
    );
  }

  return {
    id: data.name.split("/").pop(),
    fields: fromFirestoreFields(data.fields),
    createTime: data.createTime,
    updateTime: data.updateTime,
  };
}

async function listDocuments(path) {
  const response = await fetch(
    `${API_ROOT}/${path}?pageSize=100`,
    { headers: headers() }
  );
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Firebase list failed with ${response.status}`
    );
  }

  return (data.documents || []).map((document) => ({
    id: document.name.split("/").pop(),
    fields: fromFirestoreFields(document.fields),
    createTime: document.createTime,
    updateTime: document.updateTime,
  }));
}

async function createDocument(parentPath, documentId, record) {
  const response = await fetch(
    `${API_ROOT}/${parentPath}?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ fields: toFirestoreFields(record) }),
    }
  );
  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        `Firebase create failed with ${response.status}`
    );
  }

  return data;
}

async function deleteDocument(path) {
  const response = await fetch(`${API_ROOT}/${path}`, {
    method: "DELETE",
    headers: headers(),
  });
  const data = await readResponse(response);

  if (!response.ok && response.status !== 404) {
    throw new Error(
      data.error?.message ||
        `Firebase delete failed with ${response.status}`
    );
  }
}

function assertOwned(record, expectedSqlId, label) {
  if (
    record.fields.catalogSource !== "BED-SPM-ASG" ||
    (record.fields.sqlStallId && record.fields.sqlStallId !== expectedSqlId) ||
    (record.fields.sqlMenuItemId &&
      record.fields.sqlMenuItemId !== expectedSqlId)
  ) {
    throw new Error(
      `${label} already exists but is not the BED-SPM-ASG mapped record`
    );
  }
}

async function showDryRun() {
  const stallPath =
    `hawker-centers/${CENTRE_ID}/food-stalls/${STALL_ID}`;
  const currentStore = await getDocument(stallPath);
  const currentProducts = await listDocuments(`${stallPath}/products`);

  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        target: stallPath,
        existingStore: currentStore,
        existingProducts: currentProducts,
        proposedStore: store,
        proposedProducts: products,
      },
      null,
      2
    )
  );
}

async function applyStore() {
  const stallParent = `hawker-centers/${CENTRE_ID}/food-stalls`;
  const stallPath = `${stallParent}/${STALL_ID}`;
  const productParent = `${stallPath}/products`;
  const existingStore = await getDocument(stallPath);

  if (existingStore) {
    assertOwned(existingStore, "STALL001", "Maxwell stall 01-05");
  }

  const createdPaths = [];

  try {
    for (const product of products) {
      const productPath = `${productParent}/${product.id}`;
      const existingProduct = await getDocument(productPath);

      if (existingProduct) {
        assertOwned(existingProduct, product.sqlMenuItemId, product.id);
        continue;
      }

      await createDocument(productParent, product.id, product);
      createdPaths.push(productPath);
    }

    if (!existingStore) {
      await createDocument(stallParent, STALL_ID, store);
      createdPaths.push(stallPath);
    }
  } catch (error) {
    for (let index = createdPaths.length - 1; index >= 0; index -= 1) {
      try {
        await deleteDocument(createdPaths[index]);
      } catch (cleanupError) {
        console.error(
          `Could not roll back ${createdPaths[index]}:`,
          cleanupError.message
        );
      }
    }

    throw error;
  }

  const verifiedStore = await getDocument(stallPath);
  const verifiedProducts = await listDocuments(productParent);
  const expectedProducts = new Map(
    products.map((product) => [product.id, product])
  );

  if (!verifiedStore || verifiedProducts.length !== products.length) {
    throw new Error("Firebase verification failed after creating Ben's store");
  }

  assertOwned(verifiedStore, "STALL001", "Maxwell stall 01-05");

  for (const product of verifiedProducts) {
    const expectedProduct = expectedProducts.get(product.id);

    if (!expectedProduct) {
      throw new Error(`Unexpected product ${product.id} exists at Ben's store`);
    }

    assertOwned(product, expectedProduct.sqlMenuItemId, product.id);
  }

  console.log(
    `Verified Ben's Chicken Rice at Maxwell ${STALL_ID} with ` +
      `${verifiedProducts.length} products.`
  );
}

async function cleanupStore() {
  const stallPath =
    `hawker-centers/${CENTRE_ID}/food-stalls/${STALL_ID}`;
  const existingStore = await getDocument(stallPath);

  if (!existingStore) {
    console.log("Ben's Firebase store is already absent.");
    return;
  }

  assertOwned(existingStore, "STALL001", "Maxwell stall 01-05");

  const existingProducts = await listDocuments(`${stallPath}/products`);
  const expectedProducts = new Map(
    products.map((product) => [product.id, product])
  );

  for (const product of existingProducts) {
    const expectedProduct = expectedProducts.get(product.id);

    if (!expectedProduct) {
      throw new Error(
        `Cleanup stopped because unexpected product ${product.id} exists`
      );
    }

    assertOwned(
      product,
      expectedProduct.sqlMenuItemId,
      `Product ${product.id}`
    );
  }

  for (const product of existingProducts) {
    await deleteDocument(`${stallPath}/products/${product.id}`);
  }

  await deleteDocument(stallPath);
  console.log("Removed only the mapped Maxwell 01-05 store and products.");
}

async function main() {
  if (APPLY_MODE && CLEANUP_MODE) {
    throw new Error("Choose either --apply or --cleanup, not both.");
  }

  if (CLEANUP_MODE) {
    await cleanupStore();
    return;
  }

  if (APPLY_MODE) {
    await applyStore();
    return;
  }

  await showDryRun();
  console.log(
    "Dry run only. Use --apply to create the store or --cleanup to roll it back."
  );
}

main().catch((error) => {
  console.error("Ben Firebase store operation failed:", error.message);
  process.exitCode = 1;
});
