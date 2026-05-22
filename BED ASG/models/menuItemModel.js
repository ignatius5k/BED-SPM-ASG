const sql = require("mssql");
const dbConfig = require("../dbConfig");

const SELECT_MENU_ITEM_FIELDS = `
  mi.menu_item_id AS id,
  mi.stall_id AS stallId,
  mi.item_name AS itemName,
  mi.description,
  mi.price,
  mi.category,
  mi.is_available AS isAvailable,
  mi.image_url AS imageUrl,
  mi.created_at AS createdAt,
  mi.updated_at AS updatedAt,
  s.stall_name AS stallName,
  COUNT(mil.like_id) AS likeCount
`;

async function getAllMenuItems(filters = {}) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    const conditions = [];

    if (filters.stallId) {
      request.input("stallId", sql.Int, filters.stallId);
      conditions.push("mi.stall_id = @stallId");
    }

    if (filters.category) {
      request.input("category", sql.NVarChar(50), filters.category);
      conditions.push("mi.category = @category");
    }

    if (filters.searchTerm) {
      request.input("searchTerm", sql.NVarChar(100), `%${filters.searchTerm}%`);
      conditions.push("(mi.item_name LIKE @searchTerm OR mi.description LIKE @searchTerm)");
    }

    if (filters.availableOnly) {
      conditions.push("mi.is_available = 1");
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
      SELECT ${SELECT_MENU_ITEM_FIELDS}
      FROM MenuItems mi
      INNER JOIN Stalls s ON mi.stall_id = s.stall_id
      LEFT JOIN MenuItemLikes mil ON mi.menu_item_id = mil.menu_item_id
      ${whereClause}
      GROUP BY
        mi.menu_item_id, mi.stall_id, mi.item_name, mi.description, mi.price,
        mi.category, mi.is_available, mi.image_url, mi.created_at, mi.updated_at,
        s.stall_name
      ORDER BY mi.item_name;
    `;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getMenuItemById(id) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("id", sql.Int, id);

    const query = `
      SELECT ${SELECT_MENU_ITEM_FIELDS}
      FROM MenuItems mi
      INNER JOIN Stalls s ON mi.stall_id = s.stall_id
      LEFT JOIN MenuItemLikes mil ON mi.menu_item_id = mil.menu_item_id
      WHERE mi.menu_item_id = @id
      GROUP BY
        mi.menu_item_id, mi.stall_id, mi.item_name, mi.description, mi.price,
        mi.category, mi.is_available, mi.image_url, mi.created_at, mi.updated_at,
        s.stall_name;
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function createMenuItem(menuItemData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("stallId", sql.Int, menuItemData.stallId);
    request.input("itemName", sql.NVarChar(100), menuItemData.itemName);
    request.input("description", sql.NVarChar(500), menuItemData.description || null);
    request.input("price", sql.Decimal(10, 2), menuItemData.price);
    request.input("category", sql.NVarChar(50), menuItemData.category);
    request.input("isAvailable", sql.Bit, menuItemData.isAvailable);
    request.input("imageUrl", sql.NVarChar(500), menuItemData.imageUrl || null);

    const query = `
      INSERT INTO MenuItems
        (stall_id, item_name, description, price, category, is_available, image_url)
      VALUES
        (@stallId, @itemName, @description, @price, @category, @isAvailable, @imageUrl);

      SELECT SCOPE_IDENTITY() AS id;
    `;

    const result = await request.query(query);
    return getMenuItemById(result.recordset[0].id);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateMenuItem(id, menuItemData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("id", sql.Int, id);
    request.input("stallId", sql.Int, menuItemData.stallId);
    request.input("itemName", sql.NVarChar(100), menuItemData.itemName);
    request.input("description", sql.NVarChar(500), menuItemData.description || null);
    request.input("price", sql.Decimal(10, 2), menuItemData.price);
    request.input("category", sql.NVarChar(50), menuItemData.category);
    request.input("isAvailable", sql.Bit, menuItemData.isAvailable);
    request.input("imageUrl", sql.NVarChar(500), menuItemData.imageUrl || null);

    const query = `
      UPDATE MenuItems
      SET
        stall_id = @stallId,
        item_name = @itemName,
        description = @description,
        price = @price,
        category = @category,
        is_available = @isAvailable,
        image_url = @imageUrl,
        updated_at = GETDATE()
      WHERE menu_item_id = @id;

      SELECT @@ROWCOUNT AS rowsAffected;
    `;

    const result = await request.query(query);
    if (result.recordset[0].rowsAffected === 0) {
      return null;
    }

    return getMenuItemById(id);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function deleteMenuItem(id) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("id", sql.Int, id);

    const result = await request.query(`
      DELETE FROM MenuItems
      WHERE menu_item_id = @id;

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

    return result.recordset[0].rowsAffected > 0;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function likeMenuItem(menuItemId, userId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input("menuItemId", sql.Int, menuItemId);
    request.input("userId", sql.Int, userId);

    await request.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM MenuItemLikes
        WHERE menu_item_id = @menuItemId AND user_id = @userId
      )
      BEGIN
        INSERT INTO MenuItemLikes (menu_item_id, user_id)
        VALUES (@menuItemId, @userId);
      END;
    `);

    return getMenuItemById(menuItemId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  likeMenuItem,
};
