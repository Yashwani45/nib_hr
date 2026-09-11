const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Helper to recursively remove a directory and all contained files cleanly
 */
function forceRemoveDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        forceRemoveDir(curPath);
      } else {
        try { fs.unlinkSync(curPath); } catch (e) {}
      }
    }
    try { fs.rmdirSync(dirPath); } catch (e) {}
  } catch (err) {}
}

/**
 * Helper to clean and sanitize Company Name into PascalCase folder string.
 * Prevents raw hex hashes or UUIDs from ever becoming folder names.
 */
function sanitizeCompanyFolder(companyInput) {
  if (!companyInput) return 'NIB';

  let rawStr = String(companyInput).trim();
  const lower = rawStr.toLowerCase();

  // 1. Priority keyword matching FIRST
  if (lower.includes('c48d') || lower.includes('techno')) {
    return 'Technovani';
  }
  if (lower.includes('9070') || lower.includes('apex')) {
    return 'ApexDigitalSolutionsInc';
  }
  if (lower.includes('fdcd') || lower.includes('0aef') || lower.includes('vidit')) {
    return 'ViditMediaSolutions';
  }

  // 2. Check if string contains hex hash or UUID (allowing prefixes, dashes, underscores)
  const containsUUID = /[0-9a-fA-F]{16,}/.test(rawStr);
  if (containsUUID) {
    return 'NIB';
  }

  const clean = rawStr
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return clean || 'NIB';
}

/**
 * Auto Cleanup legacy UUID & duplicate folders on initialization
 */
function autoCleanupUUIDFolders() {
  try {
    const base = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company');
    if (!fs.existsSync(base)) return;

    // Direct merge map for known legacy/misspelled folders
    const mergeMap = {
      'C48dc3eb3e3c4e038ebfb71fa2bf1d84': 'Technovani',
      'c48dc3eb3e3c4e038ebfb71fa2bf1d84': 'Technovani',
      '0aef699d5a784b448936fff05bc7ce05': 'ViditMediaSolutions',
      '907076c217b8491997622574f01a53fa': 'ApexDigitalSolutionsInc',
      'fdcd11ae2efd4847afdd37ac289b8bb4': 'ViditMediaSolutions',
      'Viditmidiasolution': 'ViditMediaSolutions'
    };

    const entries = fs.readdirSync(base);
    entries.forEach(entry => {
      const isUUID = /[0-9a-fA-F]{16,}/.test(entry);
      if (isUUID || mergeMap[entry]) {
        const cleanTarget = mergeMap[entry] || sanitizeCompanyFolder(entry);
        const srcPath = path.join(base, entry);
        const targetPath = path.join(base, cleanTarget);

        if (cleanTarget && cleanTarget !== entry && fs.existsSync(srcPath)) {
          const srcDept = path.join(srcPath, 'Department');
          const targetDept = path.join(targetPath, 'Department');

          if (fs.existsSync(srcDept)) {
            if (!fs.existsSync(targetDept)) fs.mkdirSync(targetDept, { recursive: true });
            const depts = fs.readdirSync(srcDept);
            depts.forEach(d => {
              const s = path.join(srcDept, d);
              const t = path.join(targetDept, d);
              try {
                fs.cpSync(s, t, { recursive: true, force: true });
              } catch (e) {}
            });
          }

          forceRemoveDir(srcPath);
          logger.info(`[Folder Scaffolder] Consolidated legacy folder '${entry}' into '${cleanTarget}'`);
        }
      }
    });
  } catch (e) {
    logger.warn('[Folder Scaffolder] Auto cleanup notice: ' + e.message);
  }
}

// Run cleanup immediately after functions are declared
autoCleanupUUIDFolders();

/**
 * Scaffolds full company folder with departments and employee files
 */
function scaffoldCompanyFolder(companyName, departments = []) {
  try {
    const cleanCompanyFolder = sanitizeCompanyFolder(companyName);
    const companyBaseDir = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company');
    const targetCompanyDir = path.join(companyBaseDir, cleanCompanyFolder);

    if (!fs.existsSync(companyBaseDir)) {
      fs.mkdirSync(companyBaseDir, { recursive: true });
    }

    if (!fs.existsSync(targetCompanyDir)) {
      fs.mkdirSync(targetCompanyDir, { recursive: true });
    }

    departments.forEach((dept) => {
      scaffoldDepartmentFolder(cleanCompanyFolder, dept);
    });

    logger.info(`[Folder Scaffolder] Successfully created Company directory structure at: ${targetCompanyDir}`);
    return targetCompanyDir;
  } catch (err) {
    logger.error(`[Folder Scaffolder Error] Failed to scaffold company folder for ${companyName}: ` + err.message);
  }
}

/**
 * Scaffolds a single department folder with Employee directory and Dashboard.jsx
 */
function scaffoldDepartmentFolder(companyFolder, deptName) {
  try {
    if (!deptName) return;

    const cleanCompanyFolder = sanitizeCompanyFolder(companyFolder);
    const cleanDeptName = String(deptName).replace(/[^a-zA-Z0-9]/g, '');
    const deptDir = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department', cleanDeptName);
    const empDir = path.join(deptDir, 'Employee');

    if (!fs.existsSync(empDir)) {
      fs.mkdirSync(empDir, { recursive: true });
    }

    const empIndexPath = path.join(empDir, 'index.js');
    if (!fs.existsSync(empIndexPath)) {
      fs.writeFileSync(
        empIndexPath,
        `// Employee Module for ${cleanCompanyFolder} -> ${cleanDeptName} Department\nexport const ${cleanDeptName}Employees = [\n  { id: "EMP-${cleanDeptName}-01", name: "${cleanDeptName} Lead", role: "${cleanDeptName} Specialist", status: "Active" }\n];\n`
      );
    }

    const dashboardPath = path.join(deptDir, 'Dashboard.jsx');
    if (!fs.existsSync(dashboardPath)) {
      fs.writeFileSync(
        dashboardPath,
        `import React from 'react';\nimport { ${cleanDeptName}Employees } from './Employee';\n\nexport const Dashboard = () => {\n  return (\n    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">\n      <h2 className="text-xl font-bold text-slate-800">${cleanDeptName} Department Dashboard</h2>\n      <p className="text-xs text-slate-500 mb-4">${cleanCompanyFolder} Workspace</p>\n    </div>\n  );\n};\n\nexport default Dashboard;\n`
      );
    }

    logger.info(`[Folder Scaffolder] Created Department folder: Company/${cleanCompanyFolder}/Department/${cleanDeptName}/`);
    return deptDir;
  } catch (err) {
    logger.error(`[Folder Scaffolder Error] Failed to scaffold department ${deptName}: ` + err.message);
  }
}

/**
 * Appends/updates an employee record inside Company/[Company]/[Dept]/Employee/index.js
 */
function scaffoldEmployeeRecord(companyFolder, deptName, employeeData) {
  try {
    if (!deptName || !employeeData) return;

    const cleanCompanyFolder = sanitizeCompanyFolder(companyFolder);
    const cleanDeptName = String(deptName).replace(/[^a-zA-Z0-9]/g, '');
    const empIndexPath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department', cleanDeptName, 'Employee', 'index.js');

    scaffoldDepartmentFolder(cleanCompanyFolder, cleanDeptName);

    const empId = employeeData.empCode || employeeData.id || `EMP-${Date.now()}`;
    const empName = `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() || employeeData.name || employeeData.employee_name || 'New Employee';
    const empRole = employeeData.designation || employeeData.role || 'Staff Member';

    const fileContent = fs.readFileSync(empIndexPath, 'utf8');
    const newEntry = `  { id: "${empId}", name: "${empName}", role: "${empRole}", status: "Active" },\n];`;
    const updatedContent = fileContent.replace(/\];\s*$/, newEntry);

    fs.writeFileSync(empIndexPath, updatedContent);
    logger.info(`[Folder Scaffolder] Appended Employee '${empName}' to ${cleanCompanyFolder}/Department/${cleanDeptName}/Employee/index.js`);
  } catch (err) {
    logger.error(`[Folder Scaffolder Error] Failed to add employee to folder: ` + err.message);
  }
}

/**
 * Recursively deletes a physical department folder and all files inside it
 */
function deleteDepartmentFolder(companyFolder, deptName) {
  try {
    if (!deptName) return;

    const cleanCompanyFolder = sanitizeCompanyFolder(companyFolder);
    const cleanDeptName = String(deptName).replace(/[^a-zA-Z0-9]/g, '');
    const deptDir = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department', cleanDeptName);

    if (fs.existsSync(deptDir)) {
      forceRemoveDir(deptDir);
      logger.info(`[Folder Scaffolder] Deleted Department directory & files: Company/${cleanCompanyFolder}/Department/${cleanDeptName}/`);
    }
  } catch (err) {
    logger.error(`[Folder Scaffolder Error] Failed to delete department folder ${deptName}: ` + err.message);
  }
}

/**
 * Recursively deletes a physical company folder and all files inside it
 */
function deleteCompanyFolder(companyFolder) {
  try {
    if (!companyFolder) return;
    const cleanCompanyFolder = sanitizeCompanyFolder(companyFolder);
    const companyDir = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company', cleanCompanyFolder);

    if (fs.existsSync(companyDir)) {
      forceRemoveDir(companyDir);
      logger.info(`[Folder Scaffolder] Deleted Company directory & files: Company/${cleanCompanyFolder}/`);
    }
  } catch (err) {
    logger.error(`[Folder Scaffolder Error] Failed to delete company folder ${companyFolder}: ` + err.message);
  }
}

module.exports = {
  scaffoldCompanyFolder,
  scaffoldDepartmentFolder,
  scaffoldEmployeeRecord,
  deleteDepartmentFolder,
  deleteCompanyFolder,
  sanitizeCompanyFolder
};
