/**
 * Swagger documentation for the SA2-27 inspector rental-agreement extension.
 * This file contains comments only and does not change runtime behaviour.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InspectorAgreementStall:
 *       type: object
 *       properties:
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         vendorId: { type: string, example: VEND001 }
 *         vendorName: { type: string, example: bensvendor }
 *     InspectorPublicStall:
 *       type: object
 *       properties:
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         vendorId: { type: string, nullable: true, example: VEND001 }
 *         vendorName: { type: string, nullable: true, example: bensvendor }
 *         centreId: { type: string, example: "069184" }
 *         customerStallId: { type: string, example: 01-05 }
 *         agreementEligible:
 *           type: boolean
 *           example: true
 *           description: True only when the public stall has a real vendor account
 *     RentalAgreementCreate:
 *       type: object
 *       required: [stallId, agreementReference, startDate, endDate, monthlyRent, renewalDate, status, termsSummary, changeReason]
 *       properties:
 *         stallId: { type: string, maxLength: 10, example: STALL001 }
 *         agreementReference:
 *           type: string
 *           minLength: 1
 *           maxLength: 40
 *           example: NEA-STALL001-2026
 *         startDate: { type: string, format: date, example: "2026-01-01" }
 *         endDate: { type: string, format: date, example: "2026-12-31" }
 *         monthlyRent:
 *           type: number
 *           format: double
 *           minimum: 0
 *           maximum: 99999999.99
 *           example: 1850
 *         renewalDate: { type: string, format: date, example: "2026-11-30" }
 *         status:
 *           type: string
 *           enum: [active, renewal due, renewed, expired]
 *           example: active
 *         termsSummary: { type: string, maxLength: 500 }
 *         changeReason:
 *           type: string
 *           minLength: 3
 *           maxLength: 250
 *           example: Initial government rental agreement
 */

/**
 * @swagger
 * /inspection-rental-agreements:
 *   get:
 *     summary: SA2-27 - Get inspector rental-agreement management data
 *     description: Returns eligible SQL stalls, all public stalls, agreements and audit history.
 *     tags: [SA2-27 Inspector Rental Agreements]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Inspector rental-agreement dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/InspectorAgreementStall' }
 *                 publicStalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/InspectorPublicStall' }
 *                 agreements:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RentalAgreement' }
 *                 changes:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RentalAgreementChange' }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not an inspector }
 *       500: { description: Database error }
 *   post:
 *     summary: SA2-27 - Create a rental agreement as an inspector
 *     description: Generates the next RA ID and records the authenticated inspector and creation reason in audit history.
 *     tags: [SA2-27 Inspector Rental Agreements]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RentalAgreementCreate' }
 *     responses:
 *       201:
 *         description: Agreement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agreement: { $ref: '#/components/schemas/RentalAgreement' }
 *       400: { description: Invalid agreement values }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not an inspector }
 *       404: { description: Selected stall not found or not eligible }
 *       409:
 *         description: Duplicate reference, duplicate current agreement or ID limit reached
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /inspection-rental-agreements/{agreementId}:
 *   put:
 *     summary: SA2-27 - Update a rental agreement as an inspector
 *     description: Stall and reference remain fixed; editable fields and their previous values are written to audit history.
 *     tags: [SA2-27 Inspector Rental Agreements]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: agreementId
 *         required: true
 *         schema: { type: string, pattern: '^[A-Za-z0-9-]{1,10}$' }
 *         example: RA001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RentalAgreementUpdate' }
 *     responses:
 *       200:
 *         description: Updated agreement and number of audit records created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agreement: { $ref: '#/components/schemas/RentalAgreement' }
 *                 changesAdded: { type: integer, example: 2 }
 *       400:
 *         description: Invalid agreement ID, values or expectedUpdatedAt
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not an inspector }
 *       404: { description: Agreement not found }
 *       409: { description: Stale update or another current agreement already exists }
 *       500: { description: Database error }
 */
