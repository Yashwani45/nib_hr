const express = require('express');
const app = express();
app.use(express.json());

try {
  const financeRoutes = require('../routes/finance.routes');
  app.use('/api/finance', financeRoutes);
  console.log('Finance routes loaded successfully!');
  process.exit(0);
} catch (e) {
  console.error('Failed to load finance routes:', e);
  process.exit(1);
}
