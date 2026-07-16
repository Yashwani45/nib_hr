// backend/server.js
const app = require('./app');
const { sequelize, connectDB } = require('./config/database');
const { Role } = require('./models');
const logger = require('./config/logger');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish connection to MySQL via Sequelize
    await connectDB();

    // 2. Sync all models to MySQL tables
    await sequelize.sync({ alter: true });
    logger.info('MySQL tables structure successfully synchronized.');

    // 3. Seed default Roles if missing
    const roleCount = await Role.count();
    if (roleCount === 0) {
      logger.info('No roles found. Seeding default Admin, Manager, and Employee roles...');
      await Role.bulkCreate([
        { roleName: 'Admin', description: 'System administrator with complete access rights.' },
        { roleName: 'Manager', description: 'Department manager with administrative privileges.' },
        { roleName: 'Employee', description: 'Standard employee with employee portal rights.' }
      ]);
      logger.info('Default roles successfully seeded.');
    }

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      logger.info(`Enterprise HRMS Backend Server listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Critical server bootstrap error:', error);
    process.exit(1);
  }
};

startServer();