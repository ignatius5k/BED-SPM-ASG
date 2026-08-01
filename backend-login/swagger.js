const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

/**
 * Swagger / OpenAPI configuration.
 *
 * The endpoint descriptions live as @swagger JSDoc comments inside the
 * files listed under "apis" below. Keeping them in a separate docs/ folder
 * means teammates can document their own routes without editing app.js
 * and causing merge conflicts.
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hawkers API",
      version: "1.0.0",
      description:
        "Back-end API for the Singapore Hawker Centre Management System. " +
        "Covers user accounts, authentication with JWT, email verification, " +
        "and customer order history."
    },
    servers: [
      { url: "http://localhost:3000", description: "Local development server" }
    ],
    tags: [
      { name: "Auth", description: "Registration, login and email verification" },
      { name: "Users", description: "User account management" },
      { name: "Orders", description: "Customer order history" }
    ],
    components: {
      // Describes the "Authorization: Bearer <token>" header so the
      // Authorize button appears in the Swagger UI.
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste the token returned by POST /users/login"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "CUST034" },
            username: { type: "string", example: "alicetan" },
            email: { type: "string", example: "alicetan@example.com" },
            role: {
              type: "string",
              enum: ["customer", "vendor", "inspector"],
              example: "customer"
            }
          }
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            },
            id: { type: "string", example: "CUST001" },
            username: { type: "string", example: "alicetan" },
            role: { type: "string", example: "customer" }
          }
        },
        OrderItem: {
          type: "object",
          properties: {
            ItemName: { type: "string", example: "Steamed Chicken Rice" },
            Quantity: { type: "integer", example: 2 },
            UnitPrice: { type: "number", format: "float", example: 5.5 }
          }
        },
        Order: {
          type: "object",
          properties: {
            OrderID: { type: "string", example: "ORD012" },
            StallID: { type: "string", example: "STALL001" },
            StallName: { type: "string", example: "Ben's Chicken Rice" },
            OrderDate: { type: "string", format: "date-time" },
            Status: {
              type: "string",
              enum: ["paid", "completed", "cancelled"],
              example: "paid"
            },
            TotalAmount: { type: "number", format: "float", example: 11.0 },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderItem" }
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Invalid email or password" }
          }
        }
      }
    }
  },
  // Absolute paths so it works no matter which folder you run node from.
  apis: [
    path.join(__dirname, "docs", "*.js"),
    path.join(__dirname, "app.js")
  ]
};

module.exports = swaggerJsdoc(options);