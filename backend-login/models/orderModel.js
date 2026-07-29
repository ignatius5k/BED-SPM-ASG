const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Generates the next order ID by finding the highest existing number
// and adding one, e.g. ORD011 -> ORD012
async function generateNextOrderId(connection) {
  const req = connection.request();
  const result = await req.query(`
    SELECT MAX(CAST(SUBSTRING(OrderID, 4, 10) AS INT)) AS maxNum FROM Orders
  `);
  const nextNum = (result.recordset[0].maxNum || 0) + 1;
  return "ORD" + String(nextNum).padStart(3, "0");
}

// items = [{ menuItemId, quantity }]
async function createOrder(customerId, stallId, items) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    // Look up the real price from the database for each item.
    // Prices are never taken from the browser - a user could edit those.
    let total = 0;
    const priced = [];
    for (const item of items) {
      const priceReq = connection.request();
      priceReq.input("menuItemId", item.menuItemId);
      priceReq.input("stallId", stallId);
      const priceResult = await priceReq.query(`
        SELECT Price FROM MenuItems
        WHERE MenuItemID = @menuItemId AND StallID = @stallId
      `);

      if (priceResult.recordset.length === 0) {
        throw new Error(`Menu item ${item.menuItemId} not found for this stall`);
      }

      const unitPrice = priceResult.recordset[0].Price;
      total += unitPrice * item.quantity;
      priced.push({ ...item, unitPrice });
    }

    const orderId = await generateNextOrderId(connection);

    const orderReq = connection.request();
    orderReq.input("orderId", orderId);
    orderReq.input("customerId", customerId);
    orderReq.input("stallId", stallId);
    orderReq.input("total", total);
    await orderReq.query(`
      INSERT INTO Orders (OrderID, CustomerID, StallID, TotalAmount)
      VALUES (@orderId, @customerId, @stallId, @total)
    `);

    for (const item of priced) {
      const itemReq = connection.request();
      itemReq.input("orderId", orderId);
      itemReq.input("menuItemId", item.menuItemId);
      itemReq.input("quantity", item.quantity);
      itemReq.input("unitPrice", item.unitPrice);
      await itemReq.query(`
        INSERT INTO OrderItems (OrderID, MenuItemID, Quantity, UnitPrice)
        VALUES (@orderId, @menuItemId, @quantity, @unitPrice)
      `);
    }

    return await getOrderById(orderId);
  } catch (error) {
    console.error("Database error in createOrder:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Returns every order for one customer, each with its line items attached.
async function getOrdersByCustomer(customerId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const req = connection.request();
    req.input("customerId", customerId);
    const ordersResult = await req.query(`
      SELECT o.OrderID, o.StallID, s.StallName, o.OrderDate, o.Status, o.TotalAmount
      FROM Orders o
      JOIN Stalls s ON o.StallID = s.StallID
      WHERE o.CustomerID = @customerId
      ORDER BY o.OrderDate DESC
    `);

    const orders = ordersResult.recordset;
    if (orders.length === 0) return [];

    // Fetch all line items for this customer in one query, then group them
    // by order. This avoids running a separate query for every order.
    const itemsReq = connection.request();
    itemsReq.input("customerId", customerId);
    const itemsResult = await itemsReq.query(`
      SELECT oi.OrderID, mi.ItemName, oi.Quantity, oi.UnitPrice
      FROM OrderItems oi
      JOIN MenuItems mi ON oi.MenuItemID = mi.MenuItemID
      JOIN Orders o ON oi.OrderID = o.OrderID
      WHERE o.CustomerID = @customerId
    `);

    const itemsByOrder = {};
    for (const row of itemsResult.recordset) {
      if (!itemsByOrder[row.OrderID]) itemsByOrder[row.OrderID] = [];
      itemsByOrder[row.OrderID].push({
        ItemName: row.ItemName,
        Quantity: row.Quantity,
        UnitPrice: row.UnitPrice
      });
    }

    return orders.map(o => ({ ...o, items: itemsByOrder[o.OrderID] || [] }));
  } catch (error) {
    console.error("Database error in getOrdersByCustomer:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Returns one order with its full item list.
async function getOrderById(orderId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const orderReq = connection.request();
    orderReq.input("orderId", orderId);
    const orderResult = await orderReq.query(`
      SELECT o.*, s.StallName
      FROM Orders o
      JOIN Stalls s ON o.StallID = s.StallID
      WHERE o.OrderID = @orderId
    `);

    const order = orderResult.recordset[0];
    if (!order) return null;

    const itemsReq = connection.request();
    itemsReq.input("orderId", orderId);
    const itemsResult = await itemsReq.query(`
      SELECT mi.ItemName, oi.Quantity, oi.UnitPrice
      FROM OrderItems oi
      JOIN MenuItems mi ON oi.MenuItemID = mi.MenuItemID
      WHERE oi.OrderID = @orderId
    `);

    order.items = itemsResult.recordset;
    return order;
  } catch (error) {
    console.error("Database error in getOrderById:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { createOrder, getOrdersByCustomer, getOrderById };