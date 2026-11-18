// backend/scripts/test_security_suite.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage, masterSequelize, sequelize } = require('../config/database');
const { Employee, User, Role } = require('../models');
const employeeService = require('../services/core/employee.service');
const payslipService = require('../services/finance/payslip.service');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

const callMiddleware = (middleware, req, res = {}) => {
  return new Promise((resolve) => {
    middleware(req, res, (err) => resolve(err || null));
  });
};

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log('🛡️  RUNNING COMPREHENSIVE SECURITY & TENANT ISOLATION TEST SUITE');
  console.log('================================================================\n');

  try {
    // TEST 1: JWT Secret Entropy & Configuration
    console.log('--- TEST 1: JWT Secrets Configuration & Cryptographic Verification ---');
    assert(process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length >= 32, 'ACCESS_TOKEN_SECRET configured with high entropy');
    assert(process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length >= 32, 'REFRESH_TOKEN_SECRET configured with high entropy');

    // TEST 2: Token Verification & Backdoor Elimination
    console.log('\n--- TEST 2: Backdoor Elimination & Invalid Signature Rejection ---');
    const verifyJWT = require('../middleware/auth.middleware');

    // Test forged token
    const fakeToken = jwt.sign({ id: 'fake-user-1' }, 'wrong_secret_123');
    const fakeTokenErr = await callMiddleware(verifyJWT, { headers: { authorization: `Bearer ${fakeToken}` } });
    assert(fakeTokenErr && (fakeTokenErr.statusCode === 401 || fakeTokenErr.name === 'JsonWebTokenError'), `Forged JWT with incorrect signature rejected with HTTP 401 (${fakeTokenErr?.message})`);

    // Test missing token
    const missingTokenErr = await callMiddleware(verifyJWT, { headers: {} });
    assert(missingTokenErr && missingTokenErr.statusCode === 401, 'Request with missing token rejected with HTTP 401');

    // TEST 3: Unknown User Rejection (No Fallback to Admin Escalation)
    console.log('\n--- TEST 3: Unknown User Account Rejection (No Admin Escalation) ---');
    const nonExistentToken = jwt.sign(
      { id: 'non-existent-user-uuid-99999', email: 'intruder@attacker.com' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );
    const unknownUserErr = await callMiddleware(verifyJWT, { headers: { authorization: `Bearer ${nonExistentToken}` } });
    assert(unknownUserErr && unknownUserErr.statusCode === 401, `Validly signed token for non-existent user correctly rejected with HTTP 401 (${unknownUserErr?.message})`);

    // TEST 4: Cross-Tenant Isolation Enforcement
    console.log('\n--- TEST 4: Cross-Tenant Access Boundary Enforcement ---');
    const tenantDb = await getTenantConnection('nib_insurance');
    await tenantStorage.run(tenantDb, async () => {
      // Find an employee in NIB
      const [nibEmp] = await tenantDb.query("SELECT * FROM employees WHERE email IS NOT NULL LIMIT 1", { type: tenantDb.QueryTypes.SELECT });
      assert(nibEmp && nibEmp.id, `Found active tenant employee: ${nibEmp.employee_name || nibEmp.firstName} (${nibEmp.id})`);

      const validNibToken = jwt.sign(
        { id: nibEmp.id, email: nibEmp.email, role: 'Employee', companyCode: 'NIB_INSURANCE' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      // Attempt access to YashTech with NIB employee token
      const reqCross = {
        headers: { authorization: `Bearer ${validNibToken}` },
        companyCode: 'YASHTECH'
      };
      const crossTenantErr = await callMiddleware(verifyJWT, reqCross);
      assert(crossTenantErr && crossTenantErr.statusCode === 403, `Cross-tenant request from NIB employee into YashTech blocked with HTTP 403 (${crossTenantErr?.message})`);
    });

    // TEST 5: IDOR Prevention - Employee Self-Service Profile & Bank Details
    console.log('\n--- TEST 5: IDOR Protection on Profile & Bank Details ---');
    await tenantStorage.run(tenantDb, async () => {
      const emps = await tenantDb.query("SELECT id, email, employee_name FROM employees LIMIT 2", { type: tenantDb.QueryTypes.SELECT });
      if (emps && emps.length >= 2) {
        const emp1 = emps[0];
        const emp2 = emps[1];

        const user1 = {
          id: emp1.id,
          email: emp1.email,
          role: { name: 'Employee', roleName: 'Employee' },
          employee: { id: emp1.id }
        };

        // 5a. Emp1 tries to update Emp2's bank details
        let idorUpdateErr = null;
        try {
          await employeeService.updateEmployee(emp2.id, { accountNumber: '9999999999' }, user1);
        } catch (e) {
          idorUpdateErr = e;
        }
        assert(idorUpdateErr && idorUpdateErr.statusCode === 403, 'Employee attempting to update another employee profile rejected with HTTP 403');

        // 5b. Emp1 viewing Emp2's profile has sensitive fields stripped/masked
        const emp2View = await employeeService.getEmployeeById(emp2.id, user1);
        assert(!emp2View.accountNumber && !emp2View.panNumber && !emp2View.salary, 'Employee viewing another employee profile has bank, PAN, and salary fields stripped/masked');

        // 5c. Emp1 viewing their own profile can see their own fields
        const emp1SelfView = await employeeService.getEmployeeById(emp1.id, user1);
        assert(emp1SelfView && emp1SelfView.id === emp1.id, 'Employee viewing their own profile can see their own information');
      } else {
        console.log('⚠️ Less than 2 employees found for IDOR test; skipping multi-user check.');
      }
    });

    // TEST 6: IDOR Protection on Payslips
    console.log('\n--- TEST 6: IDOR Protection on Payslips ---');
    await tenantStorage.run(tenantDb, async () => {
      const userA = {
        id: 'user-a-uuid',
        role: { name: 'Employee' }
      };
      let payslipIdorErr = null;
      try {
        await payslipService.verifyEmployeeAccess(userA, 'target-employee-uuid-other');
      } catch (e) {
        payslipIdorErr = e;
      }
      assert(payslipIdorErr && payslipIdorErr.statusCode === 403, 'Cross-employee payslip access strictly rejected with HTTP 403');
    });

    console.log('\n================================================================');
    console.log('🎉 ALL SECURITY & TENANT ISOLATION TESTS PASSED (100% SUCCESS)!');
    console.log('================================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Security Test Suite Failed:', err.message);
    process.exit(1);
  }
}

runSecurityTestSuite();
