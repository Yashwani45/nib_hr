const fs = require('fs');
const path = require('path');

/**
 * Helper to scaffold a Company folder structure inside Frontend/src/Company/
 * Layout created:
 * Frontend/src/Company/
 *  ├── [CompanyName]/            (e.g., NIB)
 *  │    ├── IT/
 *  │    │    ├── Employee/
 *  │    │    └── Dashboard.jsx
 *  │    ├── HR/
 *  │    │    ├── Employee/
 *  │    │    └── Dashboard.jsx
 *  │    ├── Sales/
 *  │    │    ├── Employee/
 *  │    │    └── Dashboard.jsx
 *  │    └── Accounts/
 *  │         ├── Employee/
 *  │         └── Dashboard.jsx
 */

function createCompanyHierarchy(companyName = 'NIB', departments = ['IT', 'HR', 'Sales', 'Accounts']) {
  if (!companyName) {
    console.error('Error: Company name is required.');
    process.exit(1);
  }

  const cleanCompanyName = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const companyBaseDir = path.join(__dirname, '..', 'Frontend', 'src', 'Company');
  const targetCompanyDir = path.join(companyBaseDir, cleanCompanyName);

  console.log(`🚀 Scaffolding Company Directory for: "${cleanCompanyName}"...`);

  // Ensure Base Company directory exists
  if (!fs.existsSync(companyBaseDir)) {
    fs.mkdirSync(companyBaseDir, { recursive: true });
  }

  // Create Target Company directory (e.g. Frontend/src/Company/NIB)
  fs.mkdirSync(targetCompanyDir, { recursive: true });

  // Create each Department folder with Employee directory and Dashboard.jsx
  departments.forEach((dept) => {
    const cleanDeptName = dept.trim();
    const deptDir = path.join(targetCompanyDir, cleanDeptName);
    const empDir = path.join(deptDir, 'Employee');

    fs.mkdirSync(empDir, { recursive: true });

    // Create Employee module index inside Employee/
    fs.writeFileSync(
      path.join(empDir, 'index.js'),
      `// Employee Module for ${cleanCompanyName} -> ${cleanDeptName} Department\nexport const ${cleanDeptName}Employees = [\n  { id: "EMP-${cleanDeptName}-01", name: "${cleanDeptName} Lead", role: "${cleanDeptName} Specialist", status: "Active" }\n];\n`
    );

    // Create Dashboard.jsx inside department folder
    fs.writeFileSync(
      path.join(deptDir, 'Dashboard.jsx'),
      `import React from 'react';\nimport { ${cleanDeptName}Employees } from './Employee';\n\nexport const Dashboard = () => {\n  return (\n    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">\n      <h2 className="text-xl font-bold text-slate-800">${cleanDeptName} Department Dashboard</h2>\n      <p className="text-xs text-slate-500 mb-4">${cleanCompanyName} Workspace</p>\n    </div>\n  );\n};\n\nexport default Dashboard;\n`
    );

    console.log(`  └─ 📁 Company/${cleanCompanyName}/${cleanDeptName}/ -> 📁 Employee/, 📄 Dashboard.jsx`);
  });

  console.log(`✅ Successfully scaffolded Company structure at: ${targetCompanyDir}\n`);
}

// Support CLI execution: `node scripts/createCompanyFolder.js NIB IT HR Sales Accounts`
if (require.main === module) {
  const companyArg = process.argv[2] || 'NIB';
  const deptsArg = process.argv.slice(3);
  const departments = deptsArg.length > 0 ? deptsArg : ['IT', 'HR', 'Sales', 'Accounts'];

  createCompanyHierarchy(companyArg, departments);
}

module.exports = createCompanyHierarchy;
