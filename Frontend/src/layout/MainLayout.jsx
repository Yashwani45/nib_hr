import { useEffect, useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../auth/AuthProvider";

const MainLayout = () => {
  const { user } = useAuth();
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem("sidebar_pinned") === "true";
  });
  const [isOpen, setIsOpen] = useState(isPinned);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    localStorage.setItem("sidebar_pinned", isPinned);
    if (isPinned) {
      setIsOpen(true);
    }
  }, [isPinned]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isSuperAdmin = userRole?.toLowerCase() === "superadmin";

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      <div
        className={`transition-all duration-300 min-w-0 ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <main className="min-w-0 px-4 py-5 pt-24 sm:px-6 lg:p-6 lg:pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
