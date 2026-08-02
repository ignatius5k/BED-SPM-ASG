/**
 * @swagger
 * tags:
 *   name: Menu Items
 *   description: Vendor menu item management and customer-facing menu browsing
 */

/**
 * @swagger
 * /menu-items/cuisines:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get list of available cuisine categories
 *     responses:
 *       200:
 *         description: List of cuisines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cuisineId: { type: integer }
 *                   cuisineName: { type: string }
 *       500:
 *         description: Error retrieving cuisine categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /menu-items/public:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get public menu items for a hawker centre / stall (customer-facing)
 *     parameters:
 *       - name: centreId
 *         in: query
 *         required: false
 *         schema: { type: string, maxLength: 10 }
 *       - name: customerStallId
 *         in: query
 *         required: false
 *         schema: { type: string, maxLength: 20 }
 *       - name: cuisine
 *         in: query
 *         required: false
 *         schema: { type: string, maxLength: 50 }
 *     responses:
 *       200:
 *         description: Public menu items matching the given filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicMenuItem'
 *       400:
 *         description: A filter param exceeded its allowed length
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             example:
 *               message: "Invalid hawker stall filter"
 *       500:
 *         description: Error retrieving customer menu items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /menu-items/best-sellers:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get top 5 best-selling menu items for one customer-facing stall
 *     description: |
 *       SA2-44: Ranks menu items by quantity sold across paid/completed orders,
 *       returning at most the top 5. centreId and customerStallId are both required.
 *     parameters:
 *       - name: centreId
 *         in: query
 *         required: true
 *         schema: { type: string, maxLength: 10 }
 *       - name: customerStallId
 *         in: query
 *         required: true
 *         schema: { type: string, maxLength: 20 }
 *     responses:
 *       200:
 *         description: Top 5 best-selling menu items (only items with at least 1 sale are included)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BestSellingMenuItem'
 *       400:
 *         description: Missing required filters, or a filter exceeded its allowed length
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             examples:
 *               missing:
 *                 value: { message: "Hawker centre and stall filters are required" }
 *       500:
 *         description: Error retrieving best-selling menu items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /menu-items/vendor:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get the authenticated vendor's stalls and menu items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor's stalls and menu items (each item includes its linked cuisines)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorMenuItemsResponse'
 *       403:
 *         description: Authenticated user is not a vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             example:
 *               message: "Only vendors can manage menu items"
 *       500:
 *         description: Error retrieving vendor menu items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /menu-items:
 *   post:
 *     tags: [Menu Items]
 *     summary: Create a new menu item on one of the vendor's own stalls
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemInput'
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Menu item created successfully" }
 *                 menuItem:
 *                   $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: One or more cuisine categories are invalid, or request failed validateCreateMenuItem middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             example:
 *               message: "One or more cuisine categories are invalid"
 *       403:
 *         description: Authenticated user is not a vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *       404:
 *         description: The selected stallId does not belong to this vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             example:
 *               message: "The selected stall does not belong to this vendor"
 *       500:
 *         description: Error creating menu item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /menu-items/{menuItemId}:
 *   put:
 *     tags: [Menu Items]
 *     summary: Update an existing menu item (vendor must own the item)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: menuItemId
 *         in: path
 *         required: true
 *         schema: { type: string, example: "MENU001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemUpdateInput'
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Menu item updated successfully" }
 *                 menuItem:
 *                   $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: One or more cuisine categories are invalid, or request failed validateUpdateMenuItem middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *       403:
 *         description: Authenticated user is not a vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *       404:
 *         description: Menu item does not exist, is deleted, or does not belong to this vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *             example:
 *               message: "Menu item was not found for this vendor"
 *       500:
 *         description: Error updating menu item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *   delete:
 *     tags: [Menu Items]
 *     summary: Soft-delete a menu item (vendor must own the item)
 *     description: Sets IsDeleted = 1 and IsAvailable = 0 rather than removing the row.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: menuItemId
 *         in: path
 *         required: true
 *         schema: { type: string, example: "MENU001" }
 *     responses:
 *       200:
 *         description: Menu item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Menu item removed successfully"
 *       403:
 *         description: Authenticated user is not a vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *       404:
 *         description: Menu item was not found for this vendor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *       500:
 *         description: Error removing menu item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */