const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

const doc = {
  info: {
    title: "Singapore Hawker Centre Management System API",
    description: "RESTful APIs for menu item management, authentication, and customer engagement.",
  },
  host: `localhost:${process.env.PORT || 3000}`,
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter JWT as: Bearer <token>",
    },
  },
};

swaggerAutogen(outputFile, routes, doc);
