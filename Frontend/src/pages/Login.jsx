import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge } from "../components/ui";
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import technoLogo from "../assets/shortlogo1.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Resolve company code from email domain dynamically
  const getCompanyCodeFromEmail = (emailStr) => {
    if (!emailStr.includes("@")) return "NIB01";
    const domain = emailStr.split("@")[1].split(".")[0].toUpperCase();
    const publicDomains = ["GMAIL", "YAHOO", "OUTLOOK", "HOTMAIL", "ICLOUD", "COMPANY"];
    if (publicDomains.includes(domain)) {
      return "NIB01"; // Fallback to main default tenant for public domains
    }
    return domain;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const activeCode = getCompanyCodeFromEmail(email);

    try {
      let response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Code": activeCode,
        },
        body: JSON.stringify({ email, password, companyCode: activeCode }),
      });

      let text = await response.text();
      let result = text ? JSON.parse(text) : {};

      // If tenant routing fails because the domain isn't a separate tenant, auto-retry with main default tenant NIB01
      if (!response.ok && (result.error?.includes("Tenant") || result.message?.includes("Tenant"))) {
        const retryCode = "NIB01";
        response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Company-Code": retryCode,
          },
          body: JSON.stringify({ email, password, companyCode: retryCode }),
        });
        text = await response.text();
        result = text ? JSON.parse(text) : {};
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Authentication failed.");
      }

      // Store in AuthProvider and Redux
      const emailLower = (result.data.email || email).toLowerCase();
      const resolvedName = result.data.employeeName || result.data.name || (result.data.email ? result.data.email.split('@')[0] : 'User');
      const resolvedDeptName = result.data.departmentName || "General Staff";

      login(result.data.accessToken, {
        name: resolvedName,
        employeeName: resolvedName,
        email: result.data.email,
        role: result.data.role,
        companyCode: result.data.companyCode || activeCode,
        companyName: result.data.companyName,
        departmentId: result.data.departmentId,
        departmentCode: result.data.departmentCode,
        departmentName: resolvedDeptName,
        assignedModules: result.data.assignedModules || [],
      });

      // Redirect to home (which will route to the specific dashboard depending on the user's role)
      navigate("/");
    } catch (err) {
      // Resilient Sandbox Fallback for local testing
      const mockRoles = {
        "superadmin@nib.com": "SuperAdmin",
        "admin@nib.com": "Admin",
        "manager@nib.com": "Manager",
        "employee@nib.com": "Employee",
        "yashtech@gmail.com": "Admin",
      };

      const emailLower = email.trim().toLowerCase();

      if ((password === "securepassword" || password === "yashtech@123") && mockRoles[emailLower]) {
        const resolvedRole = mockRoles[emailLower];
        login("mock-token-12345", {
          email: emailLower,
          name: emailLower.split("@")[0],
          employeeName: emailLower.split("@")[0],
          role: resolvedRole,
          companyCode: emailLower.includes("yashtech") ? "983b8e34-1df2-4f9b-af07-693be0b23681" : "NIB01",
          companyName: emailLower.includes("yashtech") ? "YashTech" : "NIB Master Operations",
        });
        navigate("/");
        return;
      }

      // Format clean error message for user visibility
      setError(
        err.message === "Failed to fetch" 
          ? "Backend Server Offline: Please start your server with 'npm run dev' inside the backend folder."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 px-4 sm:px-6 py-12">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header Title with Logo */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={technoLogo} 
              alt="TechnoVani" 
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            <span className="text-2xl font-black tracking-tight text-white select-none">
              TechnoVani
            </span>
          </div>
          <Badge variant="primary" className="mx-auto">
            Secure Enterprise Sign In
          </Badge>
          <h2 className="text-xl font-bold text-white tracking-tight">
            HRMS Command Center
          </h2>
          <p className="text-xs text-indigo-200/60">
            Access your company admin, department HR, or employee workspace
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-bold rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-4 w-4 text-indigo-300/40" />
              </span>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LockClosedIcon className="h-4 w-4 text-indigo-300/40" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-[11px] text-center font-bold text-indigo-300/60 uppercase tracking-wider mb-2.5">
            Quick Fill Demo Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount("yashtech@gmail.com", "yashtech@123")}
              className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition group text-left"
            >
              <span className="block text-[11px] font-bold text-indigo-300 group-hover:text-white truncate">
                YashTech Admin
              </span>
              <span className="block text-[9px] text-indigo-200/50 truncate">
                yashtech@123
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("superadmin@nib.com", "securepassword")}
              className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition group text-left"
            >
              <span className="block text-[11px] font-bold text-indigo-300 group-hover:text-white truncate">
                SuperAdmin
              </span>
              <span className="block text-[9px] text-indigo-200/50 truncate">
                securepassword
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("yashwani@gmail.com", "yashwani@123")}
              className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition group text-left"
            >
              <span className="block text-[11px] font-bold text-indigo-300 group-hover:text-white truncate">
                Employee
              </span>
              <span className="block text-[9px] text-indigo-200/50 truncate">
                yashwani@123
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
