const authService = require('../services/auth.service');

(async () => {
  try {
    console.log('--- Testing abhishek@gmail.com ---');
    // Note: abhishek is in yashtech or nib_insurance
    // What tenants exist?
    const testEmails = ['abhishek@gmail.com', 'yashwani@gmail.com', 'yashtechit@gmail.com', 'rahul@gmail.com', 'akansha@gmail.com'];
    for (const email of testEmails) {
      console.log(`\n=== Checking user for: ${email} ===`);
      // Let's check how authService.login works
    }
  } catch (err) {
    console.error(err);
  }
})();
