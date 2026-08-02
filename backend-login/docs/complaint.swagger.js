/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Customer complaints about a stall
 */

/**
 * @swagger
 * /complaint:
 *   post:
 *     summary: Submit a complaint about a stall
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [centreId, customerStallId, category, description]
 *             properties:
 *               centreId:
 *                 type: string
 *                 example: "050335"
 *               customerStallId:
 *                 type: string
 *                 example: "01-01"
 *               category:
 *                 type: string
 *                 enum: [Cleanliness, Food Quality, Service Quality, Waiting Time, Others]
 *                 example: Cleanliness
 *               description:
 *                 type: string
 *                 example: The table was dirty and not cleaned between customers.
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Stall not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */