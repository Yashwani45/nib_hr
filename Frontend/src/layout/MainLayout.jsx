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

  const isSuperAdminRoute = location.pathname.startsWith("/super-admin");
  const isSuperAdminImpersonating = (user?.role === "SuperAdmin" || localStorage.getItem("superadmin_impersonating") === "true") && !!localStorage.getItem("selected_company_code");
  const selectedCompanyName = localStorage.getItem("selected_company_name") || user?.companyName || "Company Portal";
  const selectedCompanyCode = localStorage.getItem("selected_company_code") || "";

  const handleExitSuperAdminPortal = () => {
    localStorage.removeItem("superadmin_impersonating");
    localStorage.removeItem("selected_company_code");
    localStorage.removeItem("selected_company_name");
    localStorage.removeItem("selected_tenant_db");
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      delete u.isSuperAdminImpersonating;
      localStorage.setItem("user", JSON.stringify(u));
    } catch (e) {}
    window.location.href = "/super-admin";
  };

  if (isSuperAdminRoute) {
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
          isOpen ? "lg:ml-72" : "lg:ml-20"
        }`}
      >
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <main className="min-w-0 px-4 py-5 pt-24 sm:px-6 lg:p-6 lg:pt-24">
          {isSuperAdminImpersonating && (
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 rounded-2xl mb-5 shadow-lg border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <span className="p-1 bg-blue-500/30 border border-blue-400/40 rounded-lg text-sm">🛡️</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-200 uppercase tracking-wider text-[10px]">SuperAdmin Active Session:</span>
                    <strong className="text-white text-xs">{selectedCompanyName}</strong>
                  </div>
                  {selectedCompanyCode && (
                    <span className="text-[10px] font-mono text-blue-300">
                      Tenant ID: {selectedCompanyCode}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.href = "/admin/dashboard"}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition cursor-pointer"
                >
                  Admin Command Center
                </button>
                <button
                  onClick={() => window.location.href = "/employee/dashboard"}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition cursor-pointer"
                >
                  Employee Workspace
                </button>
                <button
                  onClick={handleExitSuperAdminPortal}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span>Exit to SuperAdmin Console →</span>
                </button>
              </div>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
