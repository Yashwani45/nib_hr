// backend/config/database.js
const { Sequelize } = require('sequelize');
const { AsyncLocalStorage } = require('async_hooks');
const logger = require('./logger');
const dotenv = require('dotenv');

dotenv.config();

// Create AsyncLocalStorage instance to hold tenant database connections per request
const tenantStorage = new AsyncLocalStorage();

// Standard connection to the Master database (system_master_db)
const masterSequelize = new Sequelize(
  process.env.MASTER_DB_NAME || 'system_master_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: false,
      paranoid: false,
    },
  }
);

// Proxy Sequelize instance that dynamically routes calls to the active tenant's connection pool
const sequelizeProxy = new Proxy(masterSequelize, {
  get(target, prop) {
    // Check if there is an active tenant connection pool in the AsyncLocalStorage context
    const tenantConnection = tenantStorage.getStore();
    const activeInstance = tenantConnection || target;
    
    const value = Reflect.get(activeInstance, prop);
    if (typeof value === 'function') {
      return value.bind(activeInstance);
    }
    return value;
  }
});

const connectDB = async () => {
  try {
    await masterSequelize.authenticate();
    logger.info('MySQL Master Database connected successfully via Sequelize ORM.');

    // Self-healing: Provision master tables inside system_master_db if they do not exist
    await masterSequelize.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id CHAR(36) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        db_host VARCHAR(255) NOT NULL,
        db_port INT NOT NULL DEFAULT 3306,
        db_name VARCHAR(100) NOT NULL,
        db_username VARCHAR(100) NOT NULL,
        db_password VARCHAR(255) NOT NULL,
        db_ssl TINYINT(1) NOT NULL DEFAULT 1,
        admin_email VARCHAR(255) NULL,
        admin_password VARCHAR(255) NULL,
        status ENUM('Active', 'Suspended', 'Maintenance', 'Terminated') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Self-healing migration for existing databases
    try {
      await masterSequelize.query('ALTER TABLE tenants ADD COLUMN admin_email VARCHAR(255) NULL');
    } catch (e) {}
    try {
      await masterSequelize.query('ALTER TABLE tenants ADD COLUMN admin_password VARCHAR(255) NULL');
    } catch (e) {}

  } catch (error) {
    logger.error('Unable to connect to or initialize the Master database:', error);
    process.exit(1);
  }
};

module.exports = { 
  sequelize: sequelizeProxy, // Export the proxy as 'sequelize' to preserve compatibility with all static models
  masterSequelize,           // Export raw master connection for tenant provisioning / management tasks
  tenantStorage,             // Export storage context for middleware binding
  connectDB 
};