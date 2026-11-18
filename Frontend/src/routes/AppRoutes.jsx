import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import AuthProvider, { useAuth } from "../auth/AuthProvider";

// Lazy-load route pages to prevent browser network socket & memory exhaustion (ERR_INSUFFICIENT_RESOURCES)
const Login = lazy(() => import("../pages/Login"));
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdminDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const ManagerDashboard = lazy(() => import("../pages/ManagerDashboard"));
const EmployeeDashboard = lazy(() => import("../pages/EmployeeDashboard"));
const HrConsolidationHub = lazy(() => import("../pages/HrConsolidationHub"));
const PhoneFaceScanner = lazy(() => import("../pages/PhoneFaceScanner"));
const QrAttendanceKiosk = lazy(() => import("../pages/QrAttendanceKiosk"));
const AdminEmployeeQrScannerPage = lazy(() => import("../pages/AdminEmployeeQrScannerPage"));
const PayrollPage = lazy(() => import("../pages/Payroll/PayrollPage"));

const RouteLoading = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500">Loading module...</span>
    </div>
  </div>
);

// Role-Based Frontend Route Guard
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const roleName = userRole?.toLowerCase() || "";

  const effectiveRoles = [roleName];

  const isAllowed = allowedRoles.some(role => effectiveRoles.includes(role.toLowerCase()));

  if (!isAllowed) {
    // Redirect unauthorized users to their correct default workspace
    if (roleName === "superadmin") return <Navigate to="/super-admin/dashboard" replace />;
    if (roleName === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (roleName === "manager") return <Navigate to="/manager/dashboard" replace />;
    if (roleName === "departmenthr") {
      const targetTab = user?.departmentName ? encodeURIComponent(user.departmentName) : "Department%20Dashboard";
      return <Navigate to={`/hr-hub?category=DEPARTMENT&tab=${targetTab}`} replace />;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Login routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admins/login" element={<Login />} />
            <Route path="/department/login" element={<Login />} />
            <Route path="/department-hr/login" element={<Login />} />
            
            {/* Registration page redirects back to login */}
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="/phone-scan" element={<PhoneFaceScanner />} />
            <Route path="/qr-scan" element={<QrAttendanceKiosk />} />
            <Route path="/kiosk" element={<QrAttendanceKiosk />} />
            <Route path="/attendance-kiosk" element={<QrAttendanceKiosk />} />
            <Route path="/admin/scan-employee-qr" element={<AdminEmployeeQrScannerPage standalone={true} />} />
            <Route path="/scan-employee-qr" element={<AdminEmployeeQrScannerPage standalone={true} />} />
            <Route path="/qr-attendance" element={<Navigate to="/hr-hub?category=ATTENDANCE&tab=QR%20Attendance" replace />} />
            
            <Route path="/" element={<MainLayout />}>
              {/* Root index determines initial redirection based on user's role */}
              <Route index element={<Dashboard />} />
              
              {/* Secure role-restricted dashboard paths */}
              <Route path="super-admin/dashboard" element={
                <ProtectedRoute allowedRoles={["SuperAdmin", "Admin"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="superadmin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="superadmin/dashboard" element={<Navigate to="/super-admin/dashboard" replace />} />

              <Route path="admin/dashboard" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "Manager", "DepartmentHR"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="manager/dashboard" element={
                <ProtectedRoute allowedRoles={["Manager", "Admin", "SuperAdmin"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              <Route path="employee/dashboard" element={
                <ProtectedRoute allowedRoles={["Employee", "Admin", "SuperAdmin", "DepartmentHR"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />
              
              {/* HR modules access restricted to Admin, Super Admin, or Department HR */}
              <Route path="hr-hub" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <HrConsolidationHub />
                </ProtectedRoute>
              } />
              <Route path="payroll" element={<Navigate to="/payroll/dashboard" replace />} />
              <Route path="payroll/dashboard" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="dashboard" />
                </ProtectedRoute>
              } />
              <Route path="payroll/salary-structure" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="salary-structure" />
                </ProtectedRoute>
              } />
              <Route path="payroll/process" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="process" />
                </ProtectedRoute>
              } />
              <Route path="payroll/payslips" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="payslips" />
                </ProtectedRoute>
              } />
              <Route path="payroll/loan-advance" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="loan-advance" />
                </ProtectedRoute>
              } />
              <Route path="payroll/esi" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="esi" />
                </ProtectedRoute>
              } />
              <Route path="payroll/pt" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="pt" />
                </ProtectedRoute>
              } />
              <Route path="payroll/reports" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <PayrollPage subpage="reports" />
                </ProtectedRoute>
              } />

              <Route path="admin/consolidation" element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager"]}>
                  <HrConsolidationHub />
                </ProtectedRoute>
              } />

              {/* Smart shortcuts and fallback redirects */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Navigate to="/employee/dashboard?category=EMPLOYEE_MGMT&tab=Employee%20Profile" replace />} />
              <Route path="my-profile" element={<Navigate to="/employee/dashboard?category=EMPLOYEE_MGMT&tab=Employee%20Profile" replace />} />
              <Route path="settings" element={<Navigate to="/hr-hub?category=SETTINGS&tab=Settings%20Dashboard" replace />} />
              <Route path="employees" element={<Navigate to="/hr-hub?category=EMPLOYEE_MGMT&tab=Employee%20Profile" replace />} />
              <Route path="attendance" element={<Navigate to="/hr-hub?category=ATTENDANCE&tab=Attendance%20Dashboard" replace />} />
              <Route path="leaves" element={<Navigate to="/hr-hub?category=LEAVE_MGMT&tab=Leave%20Requests" replace />} />
              <Route path="helpdesk" element={<Navigate to="/hr-hub?category=HELPDESK&tab=Helpdesk%20Dashboard" replace />} />
              <Route path="organization" element={<Navigate to="/hr-hub?category=ORG_SETUP&tab=Company" replace />} />
              <Route path="company" element={<Navigate to="/hr-hub?category=ORG_SETUP&tab=Company" replace />} />
              <Route path="branch" element={<Navigate to="/hr-hub?category=ORG_SETUP&tab=Branch" replace />} />
              <Route path="department" element={<Navigate to="/hr-hub?category=ORG_SETUP&tab=Department" replace />} />
              <Route path="designation" element={<Navigate to="/hr-hub?category=ORG_SETUP&tab=Designation" replace />} />
            </Route>
            
            {/* Catch-all redirects back to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
