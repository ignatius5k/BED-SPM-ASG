/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Stall operating schedules
 */

/**
 * @swagger
 * /schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: Get all schedules
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Error retrieving schedules (message field carries the underlying error message)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *   post:
 *     tags: [Schedules]
 *     summary: Create a new schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleInput'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Schedule created successfully"
 *       500:
 *         description: Error creating schedule (message field carries the underlying error message)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     tags: [Schedules]
 *     summary: Update an existing schedule
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleInput'
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Schedule updated successfully"
 *       500:
 *         description: Error updating schedule (message field carries the underlying error message; controller has no explicit 404 handling)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete a schedule
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Schedule deleted successfully"
 *       500:
 *         description: Error deleting schedule (message field carries the underlying error message; controller has no explicit 404 handling)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessageResponse'
 */