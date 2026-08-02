/**
 * Swagger documentation for SA2-26 menu management and SA2-44 best sellers.
 * This file contains comments only and does not change runtime behaviour.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Cuisine:
 *       type: object
 *       properties:
 *         cuisineId: { type: integer, example: 1 }
 *         cuisineName: { type: string, example: Chinese }
 *     MenuItem:
 *       type: object
 *       properties:
 *         menuItemId: { type: string, example: MENU001 }
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         itemName: { type: string, example: Steamed Chicken Rice }
 *         description: { type: string, example: Fragrant rice served with tender chicken }
 *         price: { type: number, format: double, example: 5.5 }
 *         category: { type: string, example: Main }
 *         isAvailable: { type: boolean, example: true }
 *         cuisines:
 *           type: array
 *           items: { type: string }
 *           example: [Chinese, Hainanese]
 *     MenuItemInput:
 *       type: object
 *       required: [itemName, description, price, category, cuisines, isAvailable]
 *       properties:
 *         itemName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Steamed Chicken Rice
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: Fragrant rice served with tender chicken
 *         price:
 *           type: number
 *           format: double
 *           minimum: 0.5
 *           maximum: 9999.99
 *           example: 5.5
 *         category:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Main
 *         cuisines:
 *           type: array
 *           minItems: 1
 *           maxItems: 5
 *           uniqueItems: true
 *           items:
 *             type: string
 *             minLength: 2
 *             maxLength: 50
 *           example: [Chinese, Hainanese]
 *         isAvailable: { type: boolean, example: true }
 *     BestSellingItem:
 *       type: object
 *       properties:
 *         menuItemId: { type: string, example: MENU001 }
 *         itemName: { type: string, example: Steamed Chicken Rice }
 *         category: { type: string, example: Main }
 *         price: { type: number, format: double, example: 5.5 }
 *         quantitySold: { type: integer, example: 7 }
 */

/**
 * @swagger
 * /menu-items/cuisines:
 *   get:
 *     summary: SA2-26 - List menu cuisine categories
 *     tags: [SA2-26 Menu Management]
 *     responses:
 *       200:
 *         description: Available cuisine categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Cuisine' }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /menu-items/public:
 *   get:
 *     summary: SA2-26 - Get customer-facing menu items
 *     description: Returns available SQL menu items, optionally filtered to a public Firebase stall mapping or cuisine.
 *     tags: [SA2-26 Menu Management]
 *     parameters:
 *       - in: query
 *         name: centreId
 *         schema: { type: string, maxLength: 10 }
 *         example: "069184"
 *       - in: query
 *         name: customerStallId
 *         schema: { type: string, maxLength: 20 }
 *         example: 01-05
 *       - in: query
 *         name: cuisine
 *         schema: { type: string, maxLength: 50 }
 *         example: Chinese
 *     responses:
 *       200:
 *         description: Customer-facing menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menuItems:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MenuItem' }
 *       400: { description: Invalid stall or cuisine filter }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /menu-items/vendor:
 *   get:
 *     summary: SA2-26 - Get the signed-in vendor's menu
 *     description: The JWT identifies the vendor, preventing access to another vendor's menu.
 *     tags: [SA2-26 Menu Management]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Vendor stalls and menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stallId: { type: string, example: STALL001 }
 *                       stallName: { type: string, example: "Ben's Chicken Rice" }
 *                       primaryCuisine: { type: string, example: Chinese }
 *                 menuItems:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MenuItem' }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /menu-items:
 *   post:
 *     summary: SA2-26 - Add a vendor menu item
 *     tags: [SA2-26 Menu Management]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - type: object
 *                 required: [stallId]
 *                 properties:
 *                   stallId: { type: string, maxLength: 10, example: STALL001 }
 *               - $ref: '#/components/schemas/MenuItemInput'
 *     responses:
 *       201:
 *         description: Menu item created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Menu item created successfully }
 *                 menuItem: { $ref: '#/components/schemas/MenuItem' }
 *       400: { description: Invalid menu item or cuisine details }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: Stall not found for the vendor }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /menu-items/{menuItemId}:
 *   put:
 *     summary: SA2-26 - Update a vendor menu item
 *     tags: [SA2-26 Menu Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema: { type: string }
 *         example: MENU001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuItemInput' }
 *     responses:
 *       200:
 *         description: Menu item updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Menu item updated successfully }
 *                 menuItem: { $ref: '#/components/schemas/MenuItem' }
 *       400: { description: Invalid menu item or cuisine details }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: Menu item not found for the vendor }
 *       500: { description: Database error }
 *   delete:
 *     summary: SA2-26 - Soft-delete a vendor menu item
 *     description: Marks the item unavailable while preserving historical order data.
 *     tags: [SA2-26 Menu Management]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema: { type: string }
 *         example: MENU066
 *     responses:
 *       200:
 *         description: Menu item removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Menu item removed successfully }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: Menu item not found for the vendor }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /menu-items/best-sellers:
 *   get:
 *     summary: SA2-44 - Get a stall's five best-selling menu items
 *     description: Counts item quantities only from paid and completed SQL orders.
 *     tags: [SA2-44 Best Sellers]
 *     parameters:
 *       - in: query
 *         name: centreId
 *         required: true
 *         schema: { type: string, maxLength: 10 }
 *         example: "069184"
 *       - in: query
 *         name: customerStallId
 *         required: true
 *         schema: { type: string, maxLength: 20 }
 *         example: 01-05
 *     responses:
 *       200:
 *         description: Ranked menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   maxItems: 5
 *                   items: { $ref: '#/components/schemas/BestSellingItem' }
 *       400: { description: Missing or invalid public stall filters }
 *       500: { description: Database error }
 */
