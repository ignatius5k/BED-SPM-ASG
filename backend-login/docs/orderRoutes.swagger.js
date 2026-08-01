/**
 * API documentation for the order history routes.
 * This file contains only Swagger comments - no runtime code.
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order
 *     description: >
 *       Restricted to the customer role. The order is linked to the user in the
 *       verified token, never to an ID sent by the browser. Unit prices are read
 *       from the MenuItems table so a tampered price in the request is ignored.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stallId, items]
 *             properties:
 *               stallId: { type: string, example: STALL001 }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [menuItemId, quantity]
 *                   properties:
 *                     menuItemId: { type: string, example: MENU001 }
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 99
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Validation failed (e.g. quantity below 1, empty item list)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { description: Missing or invalid token }
 *       403: { description: Signed-in user is not a customer }
 *   get:
 *     summary: Get the signed-in customer's order history
 *     description: Scoped to the token owner, so one customer can never read another's orders.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Orders, newest first, each with its line items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Order' }
 *       401: { description: Missing or invalid token }
 */

/**
 * @swagger
 * /orders/search:
 *   get:
 *     summary: Search your own orders
 *     description: >
 *       Matches on stall name, order status or item name using a parameterized
 *       LIKE query, so user input can never alter the SQL. Declared before
 *       /orders/{id} so "search" is not read as an order ID.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         required: true
 *         schema: { type: string }
 *         example: Chicken
 *     responses:
 *       200:
 *         description: Matching orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Order' }
 *       400: { description: Search term is required }
 *       401: { description: Missing or invalid token }
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get one order by ID
 *     description: >
 *       The ID format is validated before the database is touched, and
 *       ownership is checked afterwards so guessing a valid ID is not enough.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^ORD\\d+$' }
 *         example: ORD001
 *     responses:
 *       200:
 *         description: The requested order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       400: { description: 'Invalid order ID. Expected format: ORD001' }
 *       401: { description: Missing or invalid token }
 *       403: { description: The order belongs to another customer }
 *       404: { description: Order not found }
 */