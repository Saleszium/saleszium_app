require("dotenv").config();

// Helper function to check if SSL should be disabled (for local dev)
const isLocalDB = (host) => {
  return host === 'localhost' || host === '127.0.0.1' || host === 'host.docker.internal' || host === 'postgres';
};

const getDialectOptions = (host) => {
  const sslEnabled = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && !isLocalDB(host));
  return sslEnabled ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {};
};

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: getDialectOptions(process.env.DB_HOST),
    define: {
      schema: process.env.DB_SCHEMA || 'public',
    },
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: getDialectOptions(process.env.DB_HOST),
    define: {
      schema: process.env.DB_SCHEMA,
    },
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: getDialectOptions(process.env.DB_HOST),
    define: {
      schema: process.env.DB_SCHEMA,
    },
  },

  crmdb: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.CRM_DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: getDialectOptions(process.env.DB_HOST),
    define: {
      schema: process.env.CRM_DB_SCHEMA || process.env.DB_SCHEMA,
    },
  },
};
