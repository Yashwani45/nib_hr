const { getTenants } = require('./controllers/superadmin.controller');

const req = {
  user: {
    role: 'SuperAdmin',
    email: 'superadmin@nib.com'
  }
};

const res = {
  status: (code) => {
    return {
      json: (data) => {
        console.log('STATUS:', code);
        console.log('DATA:', JSON.stringify(data, null, 2));
      }
    };
  }
};

getTenants(req, res, (err) => {
  if (err) console.error('ERROR:', err);
  process.exit(0);
});
