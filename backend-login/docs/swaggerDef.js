// docs/swaggerDef.js
//
// Base OpenAPI definition: info, servers, security schemes, and shared
// component schemas. This is NOT scanned for @swagger JSDoc comments —
// it's passed directly to swagger-jsdoc as `definition`. Each
// *.swagger.js file in this folder supplies the `paths` via JSDoc
// comments and gets merged in against this base.

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Hawker Centre Food Court / Vendor Management API",
    version: "1.0.0",
    description:
      "API documentation for Inspections, Inspectors, Menu Items, Stalls, and Schedules.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "requireAuth middleware. Populates req.userId and req.role. " +
          "Vendor-restricted endpoints additionally require req.role === 'vendor'.",
      },
    },
    schemas: {
      // ---------- Inspections ----------
      Inspection: {
        type: "object",
        properties: {
          InspectionID: { type: "integer", example: 101 },
          InspectionDate: { type: "string", format: "date", example: "2026-07-15" },
          CleanlinessScore: { type: "integer", example: 8 },
          FoodHandlingScore: { type: "integer", example: 9 },
          Remarks: { type: "string" },
          Grade: { type: "string", maxLength: 1, example: "A" },
          StallName: { type: "string", description: "Joined from Stalls" },
          Cuisine: { type: "string", description: "Joined from Stalls" },
          InspectorName: {
            type: "string",
            description: "Joined from Users.username",
          },
        },
      },
      InspectionInput: {
        type: "object",
        required: [
          "StallID",
          "InspectorID",
          "InspectionDate",
          "CleanlinessScore",
          "FoodHandlingScore",
          "Grade",
        ],
        properties: {
          StallID: { type: "string", maxLength: 10 },
          InspectorID: { type: "string", maxLength: 10 },
          InspectionDate: { type: "string", format: "date" },
          CleanlinessScore: { type: "integer" },
          FoodHandlingScore: { type: "integer" },
          Remarks: { type: "string", maxLength: 500 },
          Grade: { type: "string", maxLength: 1, example: "A" },
        },
      },

      // ---------- Inspectors ----------
      Inspector: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
        },
      },

      // ---------- Menu Items ----------
      MenuItem: {
        type: "object",
        properties: {
          menuItemId: { type: "string", example: "MENU001" },
          stallId: { type: "string" },
          stallName: { type: "string" },
          itemName: { type: "string" },
          description: { type: "string" },
          price: { type: "number", format: "float" },
          category: { type: "string" },
          isAvailable: { type: "boolean" },
          cuisines: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      PublicMenuItem: {
        allOf: [
          { $ref: "#/components/schemas/MenuItem" },
          {
            type: "object",
            properties: {
              centreId: { type: "string" },
              customerStallId: { type: "string" },
            },
          },
        ],
      },
      BestSellingMenuItem: {
        type: "object",
        properties: {
          menuItemId: { type: "string", example: "MENU001" },
          itemName: { type: "string" },
          category: { type: "string" },
          price: { type: "number", format: "float" },
          quantitySold: {
            type: "integer",
            description: "Sum of quantities from paid/completed orders",
          },
        },
      },
      VendorMenuItemsResponse: {
        type: "object",
        properties: {
          stalls: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stallId: { type: "string" },
                stallName: { type: "string" },
                primaryCuisine: { type: "string" },
              },
            },
          },
          menuItems: {
            type: "array",
            items: { $ref: "#/components/schemas/MenuItem" },
          },
        },
      },
      MenuItemInput: {
        type: "object",
        required: [
          "stallId",
          "itemName",
          "price",
          "category",
          "isAvailable",
          "cuisines",
        ],
        properties: {
          stallId: {
            type: "string",
            description: "Must belong to the authenticated vendor",
          },
          itemName: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          price: { type: "number", format: "float" },
          category: { type: "string", maxLength: 50 },
          isAvailable: { type: "boolean" },
          cuisines: {
            type: "array",
            items: { type: "string" },
            description: "Must all be existing cuisine names",
          },
        },
      },
      MenuItemUpdateInput: {
        type: "object",
        required: ["itemName", "price", "category", "isAvailable", "cuisines"],
        properties: {
          itemName: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500 },
          price: { type: "number", format: "float" },
          category: { type: "string", maxLength: 50 },
          isAvailable: { type: "boolean" },
          cuisines: {
            type: "array",
            items: { type: "string" },
          },
        },
      },

      // ---------- Stalls ----------
      Stall: {
        type: "object",
        properties: {
          StallID: { type: "string" },
          StallName: { type: "string" },
          Cuisine: { type: "string" },
        },
      },

      // ---------- Schedules ----------
      Schedule: {
        type: "object",
        properties: {
          id: { type: "string" },
          stallId: { type: "string" },
          dayOfWeek: { type: "string" },
          openTime: { type: "string" },
          closeTime: { type: "string" },
        },
      },
      ScheduleInput: {
        type: "object",
        properties: {
          stallId: { type: "string" },
          dayOfWeek: { type: "string" },
          openTime: { type: "string" },
          closeTime: { type: "string" },
        },
      },

      // ---------- Shared ----------
      MessageResponse: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ErrorMessageResponse: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ErrorErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
};