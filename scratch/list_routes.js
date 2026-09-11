const app = require('../backend/app');

function printRoutes(routes, prefix = '') {
  routes.forEach(route => {
    if (route.route) {
      const methods = Object.keys(route.route.methods).join(', ').toUpperCase();
      console.log(`${methods} ${prefix}${route.route.path}`);
    } else if (route.name === 'router' && route.handle && route.handle.stack) {
      let routePrefix = prefix;
      if (route.regexp) {
        // Simple extraction of static prefix from regex if possible
        const match = route.regexp.toString().match(/^\/\^\\(\/\w+)/);
        if (match) {
          routePrefix += match[1];
        }
      }
      printRoutes(route.handle.stack, routePrefix);
    }
  });
}

if (app._router && app._router.stack) {
  printRoutes(app._router.stack);
} else {
  console.log('No routes found in express app.');
}
