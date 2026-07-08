module.exports = {
  user: bedHawker_user,
  password: 123,
  server: localhost,
  database: hawkerCentreDB,
  trustServerCertificate: true,
  options: {
    port: 1433, // Default SQL Server port
    connectionTimeout: 60000, // Connection timeout in milliseconds
  },
};