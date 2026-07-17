const sql = require("mssql");
const dbConfig = require("../dbConfig");

function attachCuisines(menuItems, cuisineRows) {
  for (let i = 0; i < menuItems.length; i += 1) {
    menuItems[i].cuisines = [];
  }

  for (let i = 0; i < cuisineRows.length; i += 1) {
    const cuisineRow = cuisineRows[i];

    for (let j = 0; j < menuItems.length; j += 1) {
      if (menuItems[j].menuItemId === cuisineRow.menuItemId) {
        menuItems[j].cuisines.push(cuisineRow.cuisineName);
        break;
      }
    }
  }

  return menuItems;
}

function addPublicFilters(request, filters) {
  const conditions = ["mi.IsAvailable = 1", "mi.IsDeleted = 0"];

  if (filters.centreId) {
    request.input("centreId", sql.VarChar(10), filters.centreId);
    conditions.push("s.HawkerCentreID = @centreId");
  }

  if (filters.customerStallId) {
    request.input(
      "customerStallId",
      sql.VarChar(20),
      filters.customerStallId
    );
    conditions.push("s.CustomerStallID = @customerStallId");
  }

  if (filters.cuisine) {
    request.input("cuisine", sql.VarChar(50), filters.cuisine);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM MenuItemCuisines selectedMic
        INNER JOIN Cuisines selectedCuisine
          ON selectedMic.CuisineID = selectedCuisine.CuisineID
        WHERE selectedMic.MenuItemID = mi.MenuItemID
          AND selectedCuisine.CuisineName = @cuisine
      )
    `);
  }

  return conditions.join(" AND ");
}

async function getCuisines() {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const result = await connection.request().query(`
      SELECT
        CuisineID AS cuisineId,
        CuisineName AS cuisineName
      FROM Cuisines
      ORDER BY CuisineName;
    `);

    return result.recordset;
  } catch (error) {
    console.error("Database error in getCuisines:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getVendorMenuItems(vendorId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const stallRequest = connection.request();
    stallRequest.input("vendorId", sql.VarChar(10), vendorId);
    const stallResult = await stallRequest.query(`
      SELECT
        StallID AS stallId,
        StallName AS stallName,
        Cuisine AS primaryCuisine
      FROM Stalls
      WHERE OwnerID = @vendorId
      ORDER BY StallName;
    `);

    const itemRequest = connection.request();
    itemRequest.input("vendorId", sql.VarChar(10), vendorId);
    const itemResult = await itemRequest.query(`
      SELECT
        mi.MenuItemID AS menuItemId,
        mi.StallID AS stallId,
        s.StallName AS stallName,
        mi.ItemName AS itemName,
        mi.Description AS description,
        mi.Price AS price,
        mi.Category AS category,
        mi.IsAvailable AS isAvailable
      FROM MenuItems mi
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE s.OwnerID = @vendorId
        AND mi.IsDeleted = 0
      ORDER BY mi.Category, mi.ItemName;
    `);

    const cuisineRequest = connection.request();
    cuisineRequest.input("vendorId", sql.VarChar(10), vendorId);
    const cuisineResult = await cuisineRequest.query(`
      SELECT
        mic.MenuItemID AS menuItemId,
        c.CuisineName AS cuisineName
      FROM MenuItemCuisines mic
      INNER JOIN Cuisines c ON mic.CuisineID = c.CuisineID
      INNER JOIN MenuItems mi ON mic.MenuItemID = mi.MenuItemID
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE s.OwnerID = @vendorId
        AND mi.IsDeleted = 0
      ORDER BY c.CuisineName;
    `);

    return {
      stalls: stallResult.recordset,
      menuItems: attachCuisines(
        itemResult.recordset,
        cuisineResult.recordset
      ),
    };
  } catch (error) {
    console.error("Database error in getVendorMenuItems:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getPublicMenuItems(filters) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const itemRequest = connection.request();
    const itemConditions = addPublicFilters(itemRequest, filters);
    const itemResult = await itemRequest.query(`
      SELECT
        mi.MenuItemID AS menuItemId,
        mi.StallID AS stallId,
        s.StallName AS stallName,
        s.HawkerCentreID AS centreId,
        s.CustomerStallID AS customerStallId,
        mi.ItemName AS itemName,
        mi.Description AS description,
        mi.Price AS price,
        mi.Category AS category
      FROM MenuItems mi
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE ${itemConditions}
      ORDER BY s.StallName, mi.Category, mi.ItemName;
    `);

    const cuisineRequest = connection.request();
    const cuisineConditions = addPublicFilters(cuisineRequest, filters);
    const cuisineResult = await cuisineRequest.query(`
      SELECT
        mic.MenuItemID AS menuItemId,
        c.CuisineName AS cuisineName
      FROM MenuItemCuisines mic
      INNER JOIN Cuisines c ON mic.CuisineID = c.CuisineID
      INNER JOIN MenuItems mi ON mic.MenuItemID = mi.MenuItemID
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE ${cuisineConditions}
      ORDER BY c.CuisineName;
    `);

    return attachCuisines(itemResult.recordset, cuisineResult.recordset);
  } catch (error) {
    console.error("Database error in getPublicMenuItems:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getValidCuisineRows(transaction, cuisineNames) {
  const request = new sql.Request(transaction);
  const parameterNames = [];

  for (let i = 0; i < cuisineNames.length; i += 1) {
    const parameterName = `cuisine${i}`;
    parameterNames.push(`@${parameterName}`);
    request.input(parameterName, sql.VarChar(50), cuisineNames[i]);
  }

  const result = await request.query(`
    SELECT CuisineID AS cuisineId, CuisineName AS cuisineName
    FROM Cuisines
    WHERE CuisineName IN (${parameterNames.join(", ")});
  `);

  if (result.recordset.length !== cuisineNames.length) {
    const error = new Error("One or more cuisine categories are invalid");
    error.code = "INVALID_CUISINE";
    throw error;
  }

  return result.recordset;
}

async function replaceCuisineLinks(transaction, menuItemId, cuisineRows) {
  const deleteRequest = new sql.Request(transaction);
  deleteRequest.input("menuItemId", sql.VarChar(10), menuItemId);
  await deleteRequest.query(`
    DELETE FROM MenuItemCuisines
    WHERE MenuItemID = @menuItemId;
  `);

  for (let i = 0; i < cuisineRows.length; i += 1) {
    const insertRequest = new sql.Request(transaction);
    insertRequest.input("menuItemId", sql.VarChar(10), menuItemId);
    insertRequest.input("cuisineId", sql.Int, cuisineRows[i].cuisineId);
    await insertRequest.query(`
      INSERT INTO MenuItemCuisines (MenuItemID, CuisineID)
      VALUES (@menuItemId, @cuisineId);
    `);
  }
}

async function createMenuItem(vendorId, menuItem) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();

    try {
      const stallRequest = new sql.Request(transaction);
      stallRequest.input("vendorId", sql.VarChar(10), vendorId);
      stallRequest.input("stallId", sql.VarChar(10), menuItem.stallId);
      const stallResult = await stallRequest.query(`
        SELECT StallID
        FROM Stalls
        WHERE StallID = @stallId AND OwnerID = @vendorId;
      `);

      if (stallResult.recordset.length === 0) {
        const error = new Error("The selected stall does not belong to this vendor");
        error.code = "STALL_NOT_FOUND";
        throw error;
      }

      const cuisineRows = await getValidCuisineRows(
        transaction,
        menuItem.cuisines
      );

      const idRequest = new sql.Request(transaction);
      const idResult = await idRequest.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(MenuItemID, 5, 10) AS INT)), 0) + 1
          AS nextNumber
        FROM MenuItems;
      `);
      const menuItemId = `MENU${String(
        idResult.recordset[0].nextNumber
      ).padStart(3, "0")}`;

      const insertRequest = new sql.Request(transaction);
      insertRequest.input("menuItemId", sql.VarChar(10), menuItemId);
      insertRequest.input("stallId", sql.VarChar(10), menuItem.stallId);
      insertRequest.input("itemName", sql.VarChar(100), menuItem.itemName);
      insertRequest.input(
        "description",
        sql.VarChar(500),
        menuItem.description
      );
      insertRequest.input("price", sql.Decimal(6, 2), menuItem.price);
      insertRequest.input("category", sql.VarChar(50), menuItem.category);
      insertRequest.input("isAvailable", sql.Bit, menuItem.isAvailable);
      await insertRequest.query(`
        INSERT INTO MenuItems
          (MenuItemID, StallID, ItemName, Description, Price, Category, IsAvailable)
        VALUES
          (@menuItemId, @stallId, @itemName, @description, @price, @category, @isAvailable);
      `);

      await replaceCuisineLinks(transaction, menuItemId, cuisineRows);
      await transaction.commit();

      return {
        menuItemId: menuItemId,
        ...menuItem,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Database error in createMenuItem:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateMenuItem(vendorId, menuItemId, menuItem) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(connection);
    await transaction.begin();

    try {
      const ownerRequest = new sql.Request(transaction);
      ownerRequest.input("vendorId", sql.VarChar(10), vendorId);
      ownerRequest.input("menuItemId", sql.VarChar(10), menuItemId);
      const ownerResult = await ownerRequest.query(`
        SELECT mi.StallID AS stallId
        FROM MenuItems mi
        INNER JOIN Stalls s ON mi.StallID = s.StallID
        WHERE mi.MenuItemID = @menuItemId
          AND mi.IsDeleted = 0
          AND s.OwnerID = @vendorId;
      `);

      if (ownerResult.recordset.length === 0) {
        await transaction.rollback();
        return null;
      }

      const cuisineRows = await getValidCuisineRows(
        transaction,
        menuItem.cuisines
      );

      const updateRequest = new sql.Request(transaction);
      updateRequest.input("menuItemId", sql.VarChar(10), menuItemId);
      updateRequest.input("itemName", sql.VarChar(100), menuItem.itemName);
      updateRequest.input(
        "description",
        sql.VarChar(500),
        menuItem.description
      );
      updateRequest.input("price", sql.Decimal(6, 2), menuItem.price);
      updateRequest.input("category", sql.VarChar(50), menuItem.category);
      updateRequest.input("isAvailable", sql.Bit, menuItem.isAvailable);
      await updateRequest.query(`
        UPDATE MenuItems
        SET
          ItemName = @itemName,
          Description = @description,
          Price = @price,
          Category = @category,
          IsAvailable = @isAvailable
        WHERE MenuItemID = @menuItemId;
      `);

      await replaceCuisineLinks(transaction, menuItemId, cuisineRows);
      await transaction.commit();

      return {
        menuItemId: menuItemId,
        stallId: ownerResult.recordset[0].stallId,
        ...menuItem,
      };
    } catch (error) {
      if (!error.code || error.code !== "EABORT") {
        await transaction.rollback();
      }
      throw error;
    }
  } catch (error) {
    console.error("Database error in updateMenuItem:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function deleteMenuItem(vendorId, menuItemId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("vendorId", sql.VarChar(10), vendorId);
    request.input("menuItemId", sql.VarChar(10), menuItemId);

    const result = await request.query(`
      UPDATE mi
      SET mi.IsDeleted = 1, mi.IsAvailable = 0
      FROM MenuItems mi
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE mi.MenuItemID = @menuItemId
        AND mi.IsDeleted = 0
        AND s.OwnerID = @vendorId;
    `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in deleteMenuItem:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getCuisines,
  getVendorMenuItems,
  getPublicMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
