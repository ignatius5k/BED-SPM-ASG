/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Customer ratings and reviews for a stall
 */

/**
 * @swagger
 * /feedback:
 *   get:
 *     summary: Get all reviews for a stall
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: centreId
 *         required: true
 *         schema: { type: string }
 *         example: "050335"
 *       - in: query
 *         name: customerStallId
 *         required: true
 *         schema: { type: string }
 *         example: "01-01"
 *     responses:
 *       200:
 *         description: Stall info and its reviews
 *       400:
 *         description: Missing/invalid query params
 *       404:
 *         description: Stall not found
 *   post:
 *     summary: Create a review for a stall
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [centreId, customerStallId, rating]
 *             properties:
 *               centreId: { type: string, example: "050335" }
 *               customerStallId: { type: string, example: "01-01" }
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comments: { type: string, example: "Great food!" }
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Validation error
 *       401:
 *         description: No/invalid token, or not a customer
 *       404:
 *         description: Stall not found
 *
 * /feedback/{feedbackId}:
 *   put:
 *     summary: Update your own review
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 3 }
 *               comments: { type: string, example: "Changed my mind" }
 *     responses:
 *       200:
 *         description: Review updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: No/invalid token, or not a customer
 *       404:
 *         description: Review not found or not owned by you
 *   delete:
 *     summary: Delete your own review
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review deleted
 *       401:
 *         description: No/invalid token, or not a customer
 *       404:
 *         description: Review not found or not owned by you
 */