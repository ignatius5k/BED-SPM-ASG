/**
 * Swagger documentation for SA2-27 rental agreements and
 * SA2-28/SA2-42 vendor performance.
 * This file contains comments only and does not change runtime behaviour.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StallSummary:
 *       type: object
 *       properties:
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *     RentalAgreement:
 *       type: object
 *       properties:
 *         agreementId: { type: string, example: RA001 }
 *         stallId: { type: string, example: STALL001 }
 *         stallName: { type: string, example: "Ben's Chicken Rice" }
 *         vendorId: { type: string, example: VEND001 }
 *         vendorName: { type: string, example: bensvendor }
 *         agreementReference: { type: string, example: HCR-STALL001-CURRENT }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         monthlyRent: { type: number, format: double, example: 1850 }
 *         renewalDate: { type: string, format: date-time }
 *         status:
 *           type: string
 *           enum: [active, renewal due, renewed, expired]
 *           example: renewal due
 *         termsSummary:
 *           type: string
 *           maxLength: 500
 *           example: Monthly rent includes common-area cleaning.
 *         updatedAt: { type: string, format: date-time }
 *         daysUntilRenewal: { type: integer, example: 18 }
 *     RentalAgreementChange:
 *       type: object
 *       properties:
 *         changeId: { type: integer, example: 39 }
 *         agreementId: { type: string, example: RA001 }
 *         fieldChanged: { type: string, example: Monthly rent }
 *         previousValue: { type: string, nullable: true, example: S$1800.00 }
 *         newValue: { type: string, nullable: true, example: S$1850.00 }
 *         changeReason: { type: string, example: Annual rental adjustment }
 *         changedAt: { type: string, format: date-time }
 *         changedByName: { type: string, example: bensvendor }
 *         changedByRole: { type: string, enum: [vendor, inspector], example: vendor }
 *     RentalAgreementUpdate:
 *       type: object
 *       required: [startDate, endDate, monthlyRent, renewalDate, status, termsSummary, changeReason, expectedUpdatedAt]
 *       properties:
 *         startDate: { type: string, format: date, example: "2025-09-30" }
 *         endDate: { type: string, format: date, example: "2026-09-30" }
 *         monthlyRent:
 *           type: number
 *           format: double
 *           minimum: 0
 *           maximum: 99999999.99
 *           example: 1850
 *         renewalDate: { type: string, format: date, example: "2026-08-20" }
 *         status:
 *           type: string
 *           enum: [active, renewal due, renewed, expired]
 *           example: renewal due
 *         termsSummary: { type: string, maxLength: 500 }
 *         changeReason:
 *           type: string
 *           minLength: 3
 *           maxLength: 250
 *           example: Annual rental adjustment
 *         expectedUpdatedAt:
 *           type: string
 *           format: date-time
 *           description: Exact updatedAt value from the latest GET response
 *     PerformanceItem:
 *       type: object
 *       properties:
 *         menuItemId: { type: string, example: MENU001 }
 *         itemName: { type: string, example: Steamed Chicken Rice }
 *         quantitySold: { type: integer, example: 7 }
 *         revenue: { type: number, format: double, example: 38.5 }
 */

/**
 * @swagger
 * /vendor-rental-agreements:
 *   get:
 *     summary: SA2-27 - Get the signed-in vendor's rental agreements
 *     description: Returns only agreements connected to stalls owned by the JWT vendor.
 *     tags: [SA2-27 Rental Agreements]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Vendor stalls, rental agreements and complete change history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StallSummary' }
 *                 agreements:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RentalAgreement' }
 *                 changes:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/RentalAgreementChange' }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: No stall found for this vendor }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /vendor-rental-agreements/{agreementId}:
 *   put:
 *     summary: SA2-27 - Update a vendor rental agreement
 *     description: Records every changed field in the audit history and rejects stale concurrent edits.
 *     tags: [SA2-27 Rental Agreements]
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
 *                 changesAdded: { type: integer, example: 1 }
 *       400: { description: Invalid agreement ID or update values }
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: Agreement not found for this vendor }
 *       409: { description: Stale update or another current agreement already exists }
 *       500: { description: Database error }
 */

/**
 * @swagger
 * /vendor-performance:
 *   get:
 *     summary: SA2-28/SA2-42 - Get vendor performance with optional date filters
 *     description: Uses paid and completed SQL orders belonging to the signed-in vendor's stalls.
 *     tags: [SA2-28 and SA2-42 Performance]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         example: "2026-01-01"
 *         description: Must be supplied together with endDate
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         example: "2026-08-02"
 *         description: Must be supplied together with startDate
 *     responses:
 *       200:
 *         description: Vendor performance summary, trend and item rankings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stalls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StallSummary' }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     dailySales: { type: number, format: double, example: 45.5 }
 *                     totalOrders: { type: integer, example: 12 }
 *                     averageOrderValue: { type: number, format: double, example: 8.25 }
 *                 monthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       monthStart: { type: string, format: date-time }
 *                       monthLabel: { type: string, example: Jan 2026 }
 *                       totalOrders: { type: integer, example: 2 }
 *                       revenue: { type: number, format: double, example: 13.5 }
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PerformanceItem' }
 *                 bestSellingItem:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PerformanceItem'
 *                   nullable: true
 *                 leastSellingItem:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PerformanceItem'
 *                   nullable: true
 *       400:
 *         description: Missing, malformed or reversed date range
 *       401:
 *         description: Missing, invalid or expired token
 *       403: { description: Signed-in user is not a vendor }
 *       404: { description: No stall found for this vendor }
 *       500: { description: Database error }
 */
