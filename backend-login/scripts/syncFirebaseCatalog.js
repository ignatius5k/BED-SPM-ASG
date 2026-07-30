const sql = require("mssql");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dbConfig = require("../dbConfig");

const FIREBASE_PROJECT_ID = "hawkers-native";
const CLEANUP_MODE = process.argv.includes("--cleanup");
const FIREBASE_PASSWORD_HASH = CLEANUP_MODE
  ? ""
  : bcrypt.hashSync(crypto.randomUUID(), 10);

// These are the customer-facing hawker centres currently stored in Firebase.
const CENTRES = [
  { id: "050335", name: "Chinatown Complex Market" },
  { id: "069184", name: "Maxwell Food Centre" },
  { id: "168898", name: "Tiong Bahru Market" },
  { id: "390051", name: "Old Airport Road Food Centre" },
];

// Firebase does not currently store cuisine tags, so the only inferred data in
// this sync is kept here explicitly. Store/product names, descriptions, prices,
// image paths, likes, and document IDs are always read directly from Firebase.
const STORE_CUISINES = {
  "050335/01-01": ["Japanese"],
  "050335/01-02": ["Chinese", "Singaporean"],
  "050335/01-03": ["Chinese", "Singaporean"],
  "050335/01-04": ["Chinese", "Singaporean"],
  "069184/01-01": ["Chinese", "Hainanese", "Singaporean"],
  "069184/01-02": ["Western", "Singaporean"],
  "069184/01-03": ["Chinese", "Fujian", "Singaporean"],
  "069184/01-04": ["Chinese", "Singaporean"],
  "168898/01-01": ["Western"],
  "168898/01-02": ["Chinese", "Singaporean"],
  "168898/01-03": ["Chinese", "Teochew", "Singaporean"],
  "168898/01-04": ["Chinese", "Hokkien", "Singaporean"],
  "390051/01-01": ["Malay", "Singaporean"],
  "390051/01-02": ["Chinese", "Hokkien", "Singaporean"],
  "390051/01-03": ["Chinese", "Hokkien", "Singaporean"],
  "390051/01-04": ["Singaporean"],
};

function documentId(document) {
  return document.name.split("/").pop();
}

function firestoreValue(value) {
  if (!value) return null;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
    return value.stringValue;
  }
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
    return Number(value.integerValue);
  }
  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) {
    return Number(value.doubleValue);
  }
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) {
    return Boolean(value.booleanValue);
  }
  return null;
}

function readFields(document) {
  const result = {};
  const fields = document.fields || {};

  for (const [fieldName, value] of Object.entries(fields)) {
    result[fieldName] = firestoreValue(value);
  }

  return result;
}

async function listDocuments(path) {
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/${encodedPath}?pageSize=100`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Firebase request failed with ${response.status}`
    );
  }

  return data.documents || [];
}

function inferCategory(productName) {
  const name = productName.toLowerCase();
  const snackTerms = [
    "curry puff",
    "oyster cake",
    "shui kueh",
    "chee cheong fun",
  ];

  for (const term of snackTerms) {
    if (name.includes(term)) return "Snack";
  }

  return "Main";
}

async function readFirebaseCatalog() {
  const stores = [];
  let storeNumber = 0;
  let menuNumber = 0;

  for (const centre of CENTRES) {
    const stallDocuments = await listDocuments(
      `hawker-centers/${centre.id}/food-stalls`
    );
    stallDocuments.sort((a, b) => documentId(a).localeCompare(documentId(b)));

    for (const stallDocument of stallDocuments) {
      storeNumber += 1;
      const customerStallId = documentId(stallDocument);
      const stallFields = readFields(stallDocument);
      const key = `${centre.id}/${customerStallId}`;
      const cuisines = STORE_CUISINES[key] || ["Singaporean"];
      const productDocuments = await listDocuments(
        `hawker-centers/${centre.id}/food-stalls/${customerStallId}/products`
      );
      productDocuments.sort((a, b) =>
        documentId(a).localeCompare(documentId(b))
      );

      const products = [];

      for (const productDocument of productDocuments) {
        menuNumber += 1;
        const productFields = readFields(productDocument);

        products.push({
          menuItemId: `FBM${String(menuNumber).padStart(4, "0")}`,
          firebaseProductId: documentId(productDocument),
          itemName: productFields.name,
          description: productFields.description || "",
          price: Number(productFields.basePrice || 0),
          category: inferCategory(productFields.name || ""),
          imagePath: productFields.imagePath || "",
          likes: Number(productFields.likes || 0),
        });
      }

      stores.push({
        ownerId: `FBV${String(storeNumber).padStart(3, "0")}`,
        stallId: `FBS${String(storeNumber).padStart(3, "0")}`,
        centreId: centre.id,
        centreName: centre.name,
        customerStallId,
        stallName: stallFields.name,
        imagePath: stallFields.imagePath || "",
        cuisines,
        products,
      });
    }
  }

  return stores;
}

async function cleanupMirror(connection) {
  const transaction = new sql.Transaction(connection);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    await request.query(`
      DELETE FROM OrderItems
      WHERE OrderID LIKE 'FBO%';

      DELETE FROM Orders
      WHERE OrderID LIKE 'FBO%';

      DELETE FROM MenuItemCuisines
      WHERE MenuItemID LIKE 'FBM%';

      DELETE FROM MenuItems
      WHERE MenuItemID LIKE 'FBM%';

      DELETE FROM Stalls
      WHERE StallID LIKE 'FBS%';

      DELETE FROM Users
      WHERE id LIKE 'FBV%' OR id = 'FBC001';
    `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function upsertUser(transaction, user) {
  const request = new sql.Request(transaction);
  request.input("id", sql.VarChar(10), user.id);
  request.input("username", sql.VarChar(50), user.username);
  request.input("email", sql.VarChar(100), user.email);
  request.input("password", sql.VarChar(255), FIREBASE_PASSWORD_HASH);
  request.input("role", sql.VarChar(20), user.role);
  await request.query(`
    IF EXISTS (SELECT 1 FROM Users WHERE id = @id)
    BEGIN
      UPDATE Users
      SET
        username = @username,
        email = @email,
        password = @password,
        role = @role
      WHERE id = @id;
    END
    ELSE
    BEGIN
      INSERT INTO Users (id, username, email, password, role)
      VALUES (@id, @username, @email, @password, @role);
    END;
  `);
}

async function upsertStall(transaction, store) {
  const request = new sql.Request(transaction);
  request.input("stallId", sql.VarChar(10), store.stallId);
  request.input("ownerId", sql.VarChar(10), store.ownerId);
  request.input("stallName", sql.VarChar(100), store.stallName);
  request.input("cuisine", sql.VarChar(50), store.cuisines[0]);
  request.input(
    "description",
    sql.VarChar(500),
    `${store.stallName} at ${store.centreName}, customer stall #${store.customerStallId}.`
  );
  request.input("centreId", sql.VarChar(10), store.centreId);
  request.input(
    "customerStallId",
    sql.VarChar(20),
    store.customerStallId
  );
  await request.query(`
    IF EXISTS (SELECT 1 FROM Stalls WHERE StallID = @stallId)
    BEGIN
      UPDATE Stalls
      SET
        OwnerID = @ownerId,
        StallName = @stallName,
        Cuisine = @cuisine,
        Description = @description,
        HawkerCentreID = @centreId,
        CustomerStallID = @customerStallId
      WHERE StallID = @stallId;
    END
    ELSE
    BEGIN
      INSERT INTO Stalls
        (StallID, OwnerID, StallName, Cuisine, Description,
         HawkerCentreID, CustomerStallID)
      VALUES
        (@stallId, @ownerId, @stallName, @cuisine, @description,
         @centreId, @customerStallId);
    END;
  `);
}

async function insertMenuItem(transaction, store, product) {
  const request = new sql.Request(transaction);
  request.input("menuItemId", sql.VarChar(10), product.menuItemId);
  request.input("stallId", sql.VarChar(10), store.stallId);
  request.input("itemName", sql.VarChar(100), product.itemName);
  request.input("description", sql.VarChar(500), product.description);
  request.input("price", sql.Decimal(6, 2), product.price);
  request.input("category", sql.VarChar(50), product.category);
  await request.query(`
    INSERT INTO MenuItems
      (MenuItemID, StallID, ItemName, Description, Price, Category,
       IsAvailable, IsDeleted)
    VALUES
      (@menuItemId, @stallId, @itemName, @description, @price, @category,
       1, 0);
  `);

  for (const cuisineName of store.cuisines) {
    const cuisineRequest = new sql.Request(transaction);
    cuisineRequest.input("menuItemId", sql.VarChar(10), product.menuItemId);
    cuisineRequest.input("cuisineName", sql.VarChar(50), cuisineName);
    await cuisineRequest.query(`
      INSERT INTO MenuItemCuisines (MenuItemID, CuisineID)
      SELECT @menuItemId, CuisineID
      FROM Cuisines
      WHERE CuisineName = @cuisineName;
    `);
  }
}

async function insertSampleOrder(transaction, store, storeIndex) {
  const rankedProducts = [...store.products].sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return a.itemName.localeCompare(b.itemName);
  });
  const orderId = `FBO${String(storeIndex + 1).padStart(4, "0")}`;
  let totalAmount = 0;
  const quantities = [];

  for (let index = 0; index < rankedProducts.length; index += 1) {
    // These are local sample sales only. Firebase likes influence the ranking,
    // but they are never represented as real completed-sale counts.
    const quantity = Math.max(1, rankedProducts[index].likes + 4 - index);
    quantities.push(quantity);
    totalAmount += rankedProducts[index].price * quantity;
  }

  const orderRequest = new sql.Request(transaction);
  orderRequest.input("orderId", sql.VarChar(10), orderId);
  orderRequest.input("stallId", sql.VarChar(10), store.stallId);
  orderRequest.input("daysAgo", sql.Int, storeIndex % 14);
  orderRequest.input("totalAmount", sql.Decimal(10, 2), totalAmount);
  await orderRequest.query(`
    INSERT INTO Orders
      (OrderID, CustomerID, StallID, OrderDate, Status, TotalAmount)
    VALUES
      (@orderId, 'FBC001', @stallId,
       DATEADD(DAY, -@daysAgo, GETDATE()), 'completed', @totalAmount);
  `);

  for (let index = 0; index < rankedProducts.length; index += 1) {
    const product = rankedProducts[index];
    const itemRequest = new sql.Request(transaction);
    itemRequest.input("orderId", sql.VarChar(10), orderId);
    itemRequest.input("menuItemId", sql.VarChar(10), product.menuItemId);
    itemRequest.input("quantity", sql.Int, quantities[index]);
    itemRequest.input("unitPrice", sql.Decimal(6, 2), product.price);
    await itemRequest.query(`
      INSERT INTO OrderItems (OrderID, MenuItemID, Quantity, UnitPrice)
      VALUES (@orderId, @menuItemId, @quantity, @unitPrice);
    `);
  }
}

async function loadMirror(connection, stores) {
  await cleanupMirror(connection);

  const transaction = new sql.Transaction(connection);
  await transaction.begin();

  try {
    await upsertUser(transaction, {
      id: "FBC001",
      username: "firebase_catalog_customer",
      email: "firebase.catalog.customer@example.test",
      role: "customer",
    });

    const cuisineNames = [
      ...new Set(stores.flatMap((store) => store.cuisines)),
    ];

    for (const cuisineName of cuisineNames) {
      const cuisineRequest = new sql.Request(transaction);
      cuisineRequest.input("cuisineName", sql.VarChar(50), cuisineName);
      await cuisineRequest.query(`
        IF NOT EXISTS (
          SELECT 1 FROM Cuisines WHERE CuisineName = @cuisineName
        )
        BEGIN
          INSERT INTO Cuisines (CuisineName) VALUES (@cuisineName);
        END;
      `);
    }

    for (let storeIndex = 0; storeIndex < stores.length; storeIndex += 1) {
      const store = stores[storeIndex];
      await upsertUser(transaction, {
        id: store.ownerId,
        username:
          `firebase_vendor_${store.centreId}_${store.customerStallId}`.replace(
            /-/g,
            "_"
          ),
        email:
          `firebase.${store.centreId}.${store.customerStallId}`.replace(
            /-/g,
            ""
          ) + "@example.test",
        role: "vendor",
      });
      await upsertStall(transaction, store);

      for (const product of store.products) {
        await insertMenuItem(transaction, store, product);
      }

      await insertSampleOrder(transaction, store, storeIndex);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function verifyMirror(connection) {
  const result = await connection.request().query(`
    SELECT
      COUNT(DISTINCT s.StallID) AS storeCount,
      COUNT(DISTINCT mi.MenuItemID) AS menuItemCount,
      COUNT(DISTINCT o.OrderID) AS sampleOrderCount
    FROM Stalls s
    LEFT JOIN MenuItems mi
      ON mi.StallID = s.StallID
      AND mi.MenuItemID LIKE 'FBM%'
    LEFT JOIN Orders o
      ON o.StallID = s.StallID
      AND o.OrderID LIKE 'FBO%'
    WHERE s.StallID LIKE 'FBS%';

    SELECT
      s.HawkerCentreID,
      s.CustomerStallID,
      s.StallName,
      COUNT(DISTINCT mi.MenuItemID) AS MenuItemCount,
      COUNT(DISTINCT oi.MenuItemID) AS ItemsWithSampleSales
    FROM Stalls s
    LEFT JOIN MenuItems mi ON mi.StallID = s.StallID
    LEFT JOIN OrderItems oi ON oi.MenuItemID = mi.MenuItemID
    WHERE s.StallID LIKE 'FBS%'
    GROUP BY
      s.HawkerCentreID,
      s.CustomerStallID,
      s.StallName
    ORDER BY s.HawkerCentreID, s.CustomerStallID;
  `);

  return {
    totals: result.recordsets[0][0],
    stores: result.recordsets[1],
  };
}

async function main() {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    if (CLEANUP_MODE) {
      await cleanupMirror(connection);
      console.log("Firebase catalogue mirror removed.");
      return;
    }

    const stores = await readFirebaseCatalog();
    const productCount = stores.reduce(
      (total, store) => total + store.products.length,
      0
    );

    if (stores.length === 0 || productCount === 0) {
      throw new Error("Firebase returned an empty store or product catalogue.");
    }

    await loadMirror(connection, stores);
    const verification = await verifyMirror(connection);

    console.log(
      `Mirrored ${verification.totals.storeCount} Firebase stores, ` +
        `${verification.totals.menuItemCount} products, and ` +
        `${verification.totals.sampleOrderCount} local sample orders.`
    );
    console.table(verification.stores);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main().catch((error) => {
  console.error("Firebase catalogue sync failed:", error);
  process.exitCode = 1;
});
