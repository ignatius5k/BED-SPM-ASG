/**
 * @swagger
 * tags:
 *   name: Inspections
 *   description: Hawker stall inspection records
 */

/**
 * @swagger
 * /inspections:
 *   get:
 *     tags: [Inspections]
 *     summary: Get all inspections
 *     responses:
 *       200:
 *         description: List of inspections, most recent first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inspection'
 *       500:
 *         description: Unable to retrieve inspections
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorErrorResponse'
 *             example:
 *               error: "Unable to retrieve inspections."
 *   post:
 *     tags: [Inspections]
 *     summary: Create a new inspection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InspectionInput'
 *     responses:
 *       201:
 *         description: Inspection submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Inspection submitted successfully"
 *       500:
 *         description: Error creating inspection (error field carries the underlying error message)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorErrorResponse'
 */

/**
 * @swagger
 * /inspections/{id}:
 *   delete:
 *     tags: [Inspections]
 *     summary: Delete an inspection by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric InspectionID
 *     responses:
 *       200:
 *         description: Inspection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Inspection deleted successfully"
 *       404:
 *         description: Inspection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorErrorResponse'
 *             example:
 *               error: "Inspection not found"
 *       500:
 *         description: Failed to delete inspection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorErrorResponse'
 *             example:
 *               error: "Failed to delete inspection"
 */