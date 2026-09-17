import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const Dashboard = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const roleName = userRole?.toLowerCase() || "employee";

  // SuperAdmin routes to the SuperAdmin Console
  if (roleName === "superadmin") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  // Admin routes to Admin Dashboard
  if (roleName === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (roleName === "manager") {
    return <Navigate to="/manager/dashboard" replace />;
  }
  if (roleName === "departmenthr") {
    const targetTab = user.departmentName ? encodeURIComponent(user.departmentName) : "Department Dashboard";
    return <Navigate to={`/hr-hub?category=DEPARTMENT&tab=${targetTab}`} replace />;
  }

  // Fallback to employee dashboard
  if (user?.profileStatus === "Incomplete" || user?.profileStatus === "Profile Incomplete") {
    return <Navigate to="/employee/dashboard?category=EMP_PROFILE&tab=Personal%20Information" replace />;
  }
  return <Navigate to="/employee/dashboard" replace />;
};




export default Dashboard;
