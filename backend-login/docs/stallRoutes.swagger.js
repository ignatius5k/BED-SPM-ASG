/**
 * @swagger
 * tags:
 *   name: Stalls
 *   description: Hawker stall listings
 */

/**
 * @swagger
 * /stalls/public:
 *   get:
 *     tags: [Stalls]
 *     summary: Get the public stall catalogue (customer-facing)
 *     responses:
 *       200:
 *         description: List of public stalls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stall'
 *       500:
 *         description: Error retrieving the public stall catalogue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /stalls:
 *   get:
 *     tags: [Stalls]
 *     summary: Get all stalls
 *     responses:
 *       200:
 *         description: List of all stalls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stall'
 *       500:
 *         description: Error retrieving stalls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */