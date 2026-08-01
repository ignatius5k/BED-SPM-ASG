/**
 * API documentation for the user / authentication routes.
 * This file contains only Swagger comments - no runtime code.
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new account
 *     description: >
 *       Creates a customer, vendor or inspector account. The password is
 *       hashed with bcrypt before storage. A verification link is emailed
 *       through the Resend API and the account cannot be used until the
 *       link is clicked.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: alicetan
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alicetan@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain an uppercase letter, a lowercase letter and a number
 *                 example: Password123
 *               role:
 *                 type: string
 *                 enum: [customer, vendor, inspector]
 *                 example: customer
 *               badgeNumber:
 *                 type: string
 *                 description: Required for inspectors, forbidden for other roles
 *                 example: NEA-0008
 *     responses:
 *       201:
 *         description: Account created and verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     emailSent: { type: boolean, example: true }
 *                     message:
 *                       type: string
 *                       example: Account created. Check your email for the verification link.
 *       400:
 *         description: Validation failed or the email is already registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     description: >
 *       Verifies the password against the stored bcrypt hash, then issues a
 *       token valid for 7 days. Accounts that have not verified their email
 *       are rejected with 403.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: alicetan@example.com }
 *               password: { type: string, example: Password123 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Email address not yet verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Please verify your email address before signing in.
 *                 needsVerification: { type: boolean, example: true }
 */

/**
 * @swagger
 * /users/verify-email:
 *   get:
 *     summary: Confirm an email address
 *     description: >
 *       Opened by clicking the link in the verification email. The token is
 *       single-use and expires after 24 hours. Redirects the browser back to
 *       the login page with a status flag rather than returning JSON.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: The one-time token from the emailed link
 *     responses:
 *       302:
 *         description: >
 *           Redirect to login.html?verified=verified (success),
 *           =already (link already used), =invalid (unknown or expired)
 *           or =error (server failure).
 */

/**
 * @swagger
 * /users/resend-verification:
 *   post:
 *     summary: Send a new verification link
 *     description: >
 *       Always returns the same message whether or not the email exists, so
 *       the endpoint cannot be used to discover registered accounts.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: alicetan@example.com }
 *     responses:
 *       200:
 *         description: Request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If that email needs verification, a new link has been sent.
 *       400:
 *         description: Missing or malformed email address
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the signed-in user's profile
 *     description: >
 *       Identity comes from the verified JWT, not from an ID supplied by the
 *       browser. Inspectors also receive their badge profile, vendors their stalls.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Missing, invalid or expired token
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change the signed-in user's password
 *     description: >
 *       The current password must be supplied even though the caller already
 *       holds a valid token, so a stolen token alone cannot lock the owner out.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: Password123 }
 *               newPassword: { type: string, example: NewPassword456 }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Current password incorrect, or new password reuses the old one
 *       401:
 *         description: Missing or invalid token
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get one user by ID
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: CUST001
 *     responses:
 *       200:
 *         description: The requested user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: Missing or invalid token }
 *       404: { description: User not found }
 *   put:
 *     summary: Update a user's username and email
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: CUST001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email]
 *             properties:
 *               username: { type: string, example: alicetan }
 *               email: { type: string, example: alice.new@example.com }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400: { description: username and email are required }
 *       401: { description: Missing or invalid token }
 *       404: { description: User not found }
 *   delete:
 *     summary: Delete a user account
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: CUST034
 *     responses:
 *       200:
 *         description: Account deleted
 *       401: { description: Missing or invalid token }
 *       404: { description: User not found }
 */