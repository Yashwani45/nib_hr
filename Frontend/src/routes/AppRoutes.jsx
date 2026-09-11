import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import HrConsolidationHub from "../pages/HrConsolidationHub";
import Login from "../pages/Login";
import AuthProvider, { useAuth } from "../auth/AuthProvider";

// Import separate role dashboards
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";

// Role-Based Frontend Route Guard
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const roleName = userRole?.toLowerCase() || "";
  const isAllowed = allowedRoles.some(role => role.toLowerCase() === roleName);

  if (!isAllowed) {
    // Redirect unauthorized users to their correct default workspace
    if (roleName === "superadmin") return <Navigate to="/super-admin/dashboard" replace />;
    if (roleName === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (roleName === "manager") return <Navigate to="/manager/dashboard" replace />;
    if (roleName === "departmenthr") {
      const targetTab = user?.departmentName ? encodeURIComponent(user.departmentName) : "Department";
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
        <Routes>
          {/* Login routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admins/login" element={<Login />} />
          <Route path="/department/login" element={<Login />} />
          <Route path="/department-hr/login" element={<Login />} />
          
          {/* Registration page redirects back to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
          
          <Route path="/" element={<MainLayout />}>
            {/* Root index determines initial redirection based on user's role */}
            <Route index element={<Dashboard />} />
            
            {/* Secure role-restricted dashboard paths */}
            <Route path="super-admin/dashboard" element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/dashboard" element={
              <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "Manager", "Employee", "DepartmentHR"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="manager/dashboard" element={
              <ProtectedRoute allowedRoles={["Manager", "Admin", "SuperAdmin"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="employee/dashboard" element={
              <ProtectedRoute allowedRoles={["Employee", "Admin", "SuperAdmin"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            
            {/* HR modules access restricted to Admin, Super Admin, or Department HR */}
            <Route path="hr-hub" element={
              <ProtectedRoute allowedRoles={["Admin", "SuperAdmin", "DepartmentHR", "Manager", "Employee"]}>
                <HrConsolidationHub />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch-all redirects back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;