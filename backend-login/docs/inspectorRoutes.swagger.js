/**
 * @swagger
 * tags:
 *   name: Inspectors
 *   description: Hawker centre food safety inspectors
 */

/**
 * @swagger
 * /inspectors:
 *   get:
 *     tags: [Inspectors]
 *     summary: Get all inspectors
 *     responses:
 *       200:
 *         description: List of inspectors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inspector'
 *       500:
 *         description: Error retrieving inspectors (message field carries the underlying error message)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */