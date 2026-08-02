/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Stall promotions and notification emails
 */

/**
 * @swagger
 * /promotion:
 *   get:
 *     summary: Get all promotions
 *     tags: [Promotions]
 *     responses:
 *       200:
 *         description: List of promotions
 *   post:
 *     summary: Create a promotion and send notification email
 *     tags: [Promotions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, discount]
 *             properties:
 *               stallId: { type: string, example: "STALL001" }
 *               title: { type: string, example: "50% Off Noodles" }
 *               description: { type: string, example: "Limited time offer" }
 *               discount: { type: string, example: "50%" }
 *     responses:
 *       201:
 *         description: Promotion created, email sent/attempted
 *       400:
 *         description: Validation error
 *       404:
 *         description: Stall not found
 */