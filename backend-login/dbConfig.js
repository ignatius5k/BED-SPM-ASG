require("dotenv").config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  connectionTimeout: 60000,
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};