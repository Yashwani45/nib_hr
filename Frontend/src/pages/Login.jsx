import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ArrowRightIcon, 
  SparklesIcon
} from "@heroicons/react/24/outline";
import technoLogo from "../assets/shortlogo1.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Navigate directly to the corresponding role dashboard
  const navigateToRoleDashboard = (role) => {
    const roleLower = String(role || "").toLowerCase();
    if (roleLower === "superadmin") {
      navigate("/super-admin/dashboard");
    } else if (roleLower === "admin") {
      navigate("/admin/dashboard");
    } else if (roleLower === "manager") {
      navigate("/manager/dashboard");
    } else if (roleLower === "departmenthr") {
      navigate("/hr-hub?category=DEPARTMENT&tab=Department%20Dashboard");
    } else {
      navigate("/employee/dashboard");
    }
  };

  // Resolve company code from email domain dynamically
  const getCompanyCodeFromEmail = (emailStr) => {
    if (!emailStr.includes("@")) return "2731b266-27c4-483d-a699-382b022d6c50";
    const lower = emailStr.toLowerCase();
    if (lower.includes("yashtech") || lower.includes("yash")) return "983b8e34-1df2-4f9b-af07-693be0b23681";
    if (lower.includes("alt") || lower.includes("nib-alt")) return "nib-insurance-alt-001";
    if (lower.includes("nib")) return "2731b266-27c4-483d-a699-382b022d6c50";

    const domain = emailStr.split("@")[1].split(".")[0].toUpperCase();
    const publicDomains = ["GMAIL", "YAHOO", "OUTLOOK", "HOTMAIL", "ICLOUD", "COMPANY"];
    if (publicDomains.includes(domain)) {
      return "2731b266-27c4-483d-a699-382b022d6c50"; // Fallback to primary tenant for public domains
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

      // If tenant routing fails because the domain isn't a separate tenant, auto-retry with main default tenant
      if (!response.ok && (result.error?.includes("Tenant") || result.message?.includes("Tenant"))) {
        const retryCode = "nib_insurance";
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
        throw new Error(result.error || result.message || "Authentication failed. Please check your credentials.");
      }

      // Clear any previous tenant override / impersonation states in localStorage
      localStorage.removeItem("selected_company_code");
      localStorage.removeItem("selected_company_name");
      localStorage.removeItem("selected_tenant_db");
      localStorage.removeItem("superadmin_impersonating");

      // Reset branch selection cleanly to prevent cross-tenant branch bleeding
      localStorage.setItem("selected_branch_id", result.data.branchId || "ALL");
      localStorage.setItem("selected_branch_name", result.data.branchName || "All Branches");
      localStorage.setItem("selected_branch_code", result.data.branchCode || "ALL");

      // Store in AuthProvider and localStorage
      const resolvedName = result.data.employeeName || result.data.name || (result.data.email ? result.data.email.split('@')[0] : 'User');
      const resolvedDeptName = result.data.departmentName || result.data.department || "General Staff";
      const resolvedRole = result.data.role || "Employee";

      if (result.data.companyName) {
        localStorage.setItem("selected_company_name", result.data.companyName);
      }
      if (resolvedDeptName) {
        localStorage.setItem("user_department", resolvedDeptName);
      }

      login(result.data.accessToken, {
        name: resolvedName,
        employeeName: resolvedName,
        email: result.data.email,
        role: resolvedRole,
        companyCode: result.data.companyCode || activeCode,
        companyName: result.data.companyName,
        branchId: result.data.branchId,
        branchName: result.data.branchName,
        employeeCode: result.data.employeeCode,
        departmentId: result.data.departmentId,
        departmentCode: result.data.departmentCode,
        departmentName: resolvedDeptName,
        department: resolvedDeptName,
        assignedModules: result.data.assignedModules || [],
      });

      // Direct redirection to the role-specific workspace
      navigateToRoleDashboard(resolvedRole);
    } catch (err) {
      // Resilient Sandbox Fallback for local testing
      const mockRoles = {
        "superadmin@nib.com": "SuperAdmin",
        "admin@nib.com": "Admin",
        "admin@nibinsurance.com": "Admin",
        "manager@nib.com": "Manager",
        "employee@nib.com": "Employee",
        "yashtech@gmail.com": "Admin",
        "palakmalviya@gmail.com": "DepartmentHR",
        "yashtechit@gmail.com": "DepartmentHR",
        "sunilpatel@gmail.com": "DepartmentHR",
        "markting@gmail.com": "DepartmentHR",
        "harsh@gmail.com": "DepartmentHR",
        "abhishek@gmail.com": "Employee",
        "yashwani@gmail.com": "Employee",
        "akanshamishra@gmail.com": "Employee",
        "deepu@gmail.com": "Employee",
        "rahul@gmail.com": "Employee",
        "malviya@gmail.com": "Employee",
        "deepesh@gmail.com": "Employee",
        "anjali@gmail.com": "Employee",
        "mintu@gmail.com": "Employee",
        "vikram.singh@yashtech.com": "Employee",
        "sneha.patel@yashtech.com": "Employee",
        "rohit.sharma@yashtech.com": "Employee",
        "priya.sharma@yashtech.com": "Employee",
        "amit.verma@yashtech.com": "Employee",
        "kavita.jain@yashtech.com": "Employee",
      };

      const emailLower = email.trim().toLowerCase();

      if (mockRoles[emailLower]) {
        const resolvedRole = mockRoles[emailLower];
        const isYash = emailLower.includes("yashtech");
        const isAlt = emailLower.includes("alt") || emailLower.includes("nib-alt");
        const resolvedCompCode = isYash ? "983b8e34-1df2-4f9b-af07-693be0b23681" : (isAlt ? "nib-insurance-alt-001" : "2731b266-27c4-483d-a699-382b022d6c50");
        const resolvedCompName = isYash ? "YashTech Solutions" : (isAlt ? "NIB Insurance (Alt)" : "NIB Insurance");

        localStorage.setItem("selected_branch_id", "ALL");
        localStorage.setItem("selected_branch_name", "All Branches");
        localStorage.setItem("selected_branch_code", "ALL");
        localStorage.setItem("selected_company_name", resolvedCompName);
        localStorage.setItem("selected_company_code", resolvedCompCode);

        login("mock-token-12345", {
          email: emailLower,
          name: emailLower.split("@")[0],
          employeeName: emailLower.split("@")[0],
          role: resolvedRole,
          departmentName: resolvedRole === "DepartmentHR" ? "Department Operations" : undefined,
          companyCode: resolvedCompCode,
          companyName: resolvedCompName,
        });
        navigateToRoleDashboard(resolvedRole);
        return;
      }

      setError(
        err.message === "Failed to fetch" 
          ? "Backend Server Offline: Please start your server on port 5000."
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
    <div className="min-h-screen w-full bg-[#070b16] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* CSS Override for browser autofill background */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active,
        input:-internal-autofill-selected,
        input:-internal-autofill-previewed {
          -webkit-box-shadow: 0 0 0 1000px #0b1120 inset !important;
          box-shadow: 0 0 0 1000px #0b1120 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          caret-color: #ffffff !important;
          background-color: #0b1120 !important;
          transition: background-color 9999999s ease-in-out 0s, color 9999999s ease-in-out 0s !important;
        }
        input:autofill,
        input:autofill:hover,
        input:autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0b1120 inset !important;
          box-shadow: 0 0 0 1000px #0b1120 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          caret-color: #ffffff !important;
          background-color: #0b1120 !important;
          transition: background-color 9999999s ease-in-out 0s, color 9999999s ease-in-out 0s !important;
        }
        input::selection {
          background-color: #7c3aed !important;
          color: #ffffff !important;
        }
        input::placeholder {
          -webkit-text-fill-color: #64748b !important;
          color: #64748b !important;
          opacity: 0.65 !important;
        }
      `}</style>

      {/* Atmospheric Ambient Glow Backdrops matching Image 3 */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-700/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-violet-600/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[350px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none"></div>

      {/* Main Centered 2-Column Responsive Layout - Adjusted Inward Towards Center */}
      <div className="w-full max-w-[1180px] mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 xl:gap-14 relative z-10">

        {/* =========================================================================
            LEFT PANEL: HIGH-TECH HRMS COMMAND CENTER SHOWCASE
        ========================================================================= */}
        <div className="w-full lg:w-[54%] max-w-[560px] flex flex-col items-center text-center space-y-5">
          
          {/* Top Brand Header */}
          <div className="flex flex-col items-center space-y-2.5">
            <div className="flex items-center gap-3">
              <img 
                src={technoLogo} 
                alt="TechnoVani" 
                className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" 
              />
              <span className="text-2xl font-black tracking-tight text-white select-none">
                TechnoVani
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold text-cyan-200 border border-purple-500/50 bg-[#150f2e]/80 shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                <span>Secure Enterprise Sign In</span>
              </div>
            </div>
          </div>

          {/* Center Typography */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white tracking-tight leading-tight drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] whitespace-nowrap">
              HRMS Command Center
            </h1>

            <p className="text-slate-300 text-sm sm:text-[15px] font-normal max-w-md mx-auto">
              Access your company admin, department HR, or employee workspace.
            </p>
          </div>

          {/* 3D Isometric Team Hierarchy Platform & Floating Glass Tablets Graphic */}
          <div className="relative w-full max-w-[530px] h-[310px] sm:h-[340px] flex items-center justify-center pointer-events-none select-none">
            
            {/* Ambient Purple/Cyan Glow Backdrop */}
            <div className="absolute inset-4 bg-gradient-to-tr from-purple-600/25 via-indigo-600/20 to-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <svg viewBox="0 0 560 360" className="w-full h-full drop-shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              <defs>
                <linearGradient id="pedestalSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#431c87" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#290e59" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#1a0833" />
                </linearGradient>
                <linearGradient id="tabletGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#151e36" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#091024" stopOpacity="0.96" />
                </linearGradient>
                <linearGradient id="neonWaveCyanMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
                <linearGradient id="neonAreaGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="neonAreaGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Background Digital Dotted Matrix */}
              <g fill="#38bdf8" opacity="0.25">
                <circle cx="45" cy="45" r="1.5" />
                <circle cx="60" cy="45" r="1.5" />
                <circle cx="75" cy="45" r="1.5" />
                <circle cx="45" cy="60" r="1.5" />
                <circle cx="60" cy="60" r="1.5" />
                <circle cx="75" cy="60" r="1.5" />
                <circle cx="475" cy="55" r="1.5" />
                <circle cx="490" cy="55" r="1.5" />
                <circle cx="505" cy="55" r="1.5" />
                <circle cx="475" cy="70" r="1.5" />
                <circle cx="490" cy="70" r="1.5" />
                <circle cx="505" cy="70" r="1.5" />
              </g>

              {/* 3D Circular Purple Platform / Pedestal */}
              <g>
                {/* 3D Base Height / Cylinder side */}
                <path d="M 135,225 A 145,48 0 0,0 425,225 v 20 A 145,48 0 0,1 135,245 Z" fill="#17062c" />
                {/* 3D Top Surface Ellipse */}
                <ellipse cx="280" cy="225" rx="145" ry="48" fill="url(#pedestalSurfaceGrad)" stroke="#9333ea" strokeWidth="1.8" />
                {/* Concentric Decorative Track Ring */}
                <ellipse cx="280" cy="225" rx="114" ry="36" fill="none" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
              </g>

              {/* Organizational Hierarchy Nodes on the Platform */}
              <g>
                {/* Connecting Laser Beams radiating from Central Leader to 5 Team Members */}
                <line x1="280" y1="220" x2="190" y2="208" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" />
                <line x1="280" y1="220" x2="222" y2="240" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" />
                <line x1="280" y1="220" x2="280" y2="252" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" />
                <line x1="280" y1="220" x2="338" y2="240" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" />
                <line x1="280" y1="220" x2="370" y2="208" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.8" />

                {/* Central Leader Node (Center Hub) */}
                <circle cx="280" cy="220" r="17" fill="#4c1d95" stroke="#f0abfc" strokeWidth="2" filter="drop-shadow(0 0 10px #a855f7)" />
                <g fill="#ffffff" transform="translate(280, 220) scale(0.7) translate(-12, -12)">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </g>

                {/* Peripheral Team Member Avatar Nodes */}
                {/* Node 1 */}
                <circle cx="190" cy="208" r="9.5" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="190" cy="206" r="3" fill="#38bdf8" />
                <path d="M 184,215 Q 190,210 196,215" fill="none" stroke="#38bdf8" strokeWidth="1.2" />

                {/* Node 2 */}
                <circle cx="222" cy="240" r="9.5" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="222" cy="238" r="3" fill="#a855f7" />
                <path d="M 216,247 Q 222,242 228,247" fill="none" stroke="#a855f7" strokeWidth="1.2" />

                {/* Node 3 */}
                <circle cx="280" cy="252" r="9.5" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="280" cy="250" r="3" fill="#38bdf8" />
                <path d="M 274,259 Q 280,254 286,259" fill="none" stroke="#38bdf8" strokeWidth="1.2" />

                {/* Node 4 */}
                <circle cx="338" cy="240" r="9.5" fill="#1e1b4b" stroke="#c084fc" strokeWidth="1.5" />
                <circle cx="338" cy="238" r="3" fill="#c084fc" />
                <path d="M 332,247 Q 338,242 344,247" fill="none" stroke="#c084fc" strokeWidth="1.2" />

                {/* Node 5 */}
                <circle cx="370" cy="208" r="9.5" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="370" cy="206" r="3" fill="#38bdf8" />
                <path d="M 364,215 Q 370,210 376,215" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
              </g>

              {/* =========================================================
                  FLOATING GLASS TABLETS IN ISOMETRIC 3D SPACE
                  ========================================================= */}
              
              {/* 1. TOP-CENTER TABLET: Wave Curves Card */}
              <g transform="translate(225, 35)">
                <rect width="110" height="65" rx="11" fill="url(#tabletGlassGrad)" stroke="#4f46e5" strokeWidth="1.3" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.6))" />
                <path d="M 12,48 Q 38,16 65,38 T 98,22" fill="none" stroke="url(#neonWaveCyanMagenta)" strokeWidth="2.2" />
                <path d="M 12,52 Q 44,28 72,44 T 98,34" fill="none" stroke="#a855f7" strokeWidth="1.6" opacity="0.6" />
                <circle cx="65" cy="38" r="2.8" fill="#22d3ee" />
                <circle cx="98" cy="22" r="2.8" fill="#f43f5e" />
              </g>

              {/* 2. MIDDLE-LEFT TABLET: Multi-Chart Workspace Dashboard */}
              <g transform="translate(20, 90) rotate(-6)">
                <rect width="165" height="105" rx="13" fill="url(#tabletGlassGrad)" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.7))" />
                {/* Titlebar with window dots */}
                <circle cx="16" cy="14" r="2.8" fill="#ef4444" opacity="0.8" />
                <circle cx="25" cy="14" r="2.8" fill="#eab308" opacity="0.8" />
                <circle cx="34" cy="14" r="2.8" fill="#22c55e" opacity="0.8" />
                {/* Left Mini Sidebar */}
                <rect x="14" y="26" width="24" height="65" rx="4" fill="#1e293b" opacity="0.6" />
                <line x1="18" y1="35" x2="33" y2="35" stroke="#64748b" strokeWidth="1.5" />
                <line x1="18" y1="46" x2="31" y2="46" stroke="#64748b" strokeWidth="1.5" />
                <line x1="18" y1="57" x2="33" y2="57" stroke="#64748b" strokeWidth="1.5" />
                {/* Upper Area Chart */}
                <path d="M 46,54 Q 66,32 92,45 T 154,30 L 154,60 L 46,60 Z" fill="url(#neonAreaGrad1)" />
                <path d="M 46,54 Q 66,32 92,45 T 154,30" fill="none" stroke="#22d3ee" strokeWidth="2" />
                {/* Lower Area Chart */}
                <path d="M 46,86 Q 76,64 108,80 T 154,67 L 154,92 L 46,92 Z" fill="url(#neonAreaGrad2)" />
                <path d="M 46,86 Q 76,64 108,80 T 154,67" fill="none" stroke="#d946ef" strokeWidth="2" />
              </g>

              {/* 3. MIDDLE-RIGHT TABLET: Pie Chart + Mountain Waves */}
              <g transform="translate(365, 85) rotate(6)">
                <rect width="170" height="102" rx="13" fill="url(#tabletGlassGrad)" stroke="#818cf8" strokeWidth="1.3" strokeOpacity="0.45" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.7))" />
                {/* Window Dots */}
                <circle cx="16" cy="14" r="2.8" fill="#64748b" opacity="0.8" />
                <circle cx="25" cy="14" r="2.8" fill="#64748b" opacity="0.8" />
                {/* Donut Pie Chart on Left */}
                <circle cx="50" cy="52" r="20" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="52" r="20" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="125" strokeDashoffset="50" />
                <circle cx="50" cy="52" r="20" fill="none" stroke="#06b6d4" strokeWidth="8" strokeDasharray="125" strokeDashoffset="100" strokeLinecap="round" />
                {/* Mountain Wave on Right */}
                <path d="M 88,72 Q 110,34 132,56 T 160,42 L 160,82 L 88,82 Z" fill="url(#neonAreaGrad2)" />
                <path d="M 88,72 Q 110,34 132,56 T 160,42" fill="none" stroke="#c084fc" strokeWidth="2" />
              </g>

              {/* 4. BOTTOM-LEFT TABLET: Donut Ring & Vertical Bar Chart */}
              <g transform="translate(50, 235) rotate(-4)">
                <rect width="128" height="80" rx="11" fill="url(#tabletGlassGrad)" stroke="#c084fc" strokeWidth="1.3" strokeOpacity="0.5" filter="drop-shadow(0 12px 25px rgba(0,0,0,0.7))" />
                {/* Donut ring */}
                <circle cx="36" cy="44" r="18" fill="none" stroke="#1e293b" strokeWidth="6.5" />
                <circle cx="36" cy="44" r="18" fill="none" stroke="#a855f7" strokeWidth="6.5" strokeDasharray="113" strokeDashoffset="40" strokeLinecap="round" />
                {/* Equalizer Bars on Right */}
                <rect x="68" y="34" width="6.5" height="26" rx="2" fill="#38bdf8" />
                <rect x="79" y="25" width="6.5" height="35" rx="2" fill="#818cf8" />
                <rect x="90" y="19" width="6.5" height="41" rx="2" fill="#d946ef" />
                <rect x="101" y="30" width="6.5" height="30" rx="2" fill="#22d3ee" />
                <rect x="112" y="40" width="6.5" height="20" rx="2" fill="#a855f7" />
              </g>

              {/* 5. BOTTOM-RIGHT TABLET: 50% Circular Gauge & Bar Columns */}
              <g transform="translate(380, 225) rotate(4)">
                <rect width="135" height="82" rx="11" fill="url(#tabletGlassGrad)" stroke="#22d3ee" strokeWidth="1.3" strokeOpacity="0.5" filter="drop-shadow(0 12px 25px rgba(0,0,0,0.7))" />
                {/* Circular Gauge with 50% */}
                <circle cx="40" cy="44" r="19" fill="none" stroke="#1e293b" strokeWidth="5" />
                <circle cx="40" cy="44" r="19" fill="none" stroke="#06b6d4" strokeWidth="5" strokeDasharray="119" strokeDashoffset="59" strokeLinecap="round" />
                <text x="40" y="48" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">50%</text>
                {/* Bars on Right */}
                <rect x="74" y="30" width="6.5" height="30" rx="2" fill="#22d3ee" />
                <rect x="84" y="21" width="6.5" height="39" rx="2" fill="#818cf8" />
                <rect x="94" y="36" width="6.5" height="24" rx="2" fill="#a855f7" />
                <rect x="104" y="17" width="6.5" height="43" rx="2" fill="#38bdf8" />
                <rect x="114" y="28" width="6.5" height="32" rx="2" fill="#c084fc" />
              </g>

              {/* Tiny Tech Matrix Accents at Bottom */}
              <g fill="#64748b" opacity="0.6" transform="translate(265, 320)">
                <rect x="0" y="0" width="20" height="26" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                <line x1="4" y1="6" x2="16" y2="6" stroke="#06b6d4" strokeWidth="1" />
                <circle cx="6" cy="12" r="1.2" fill="#94a3b8" />
                <circle cx="10" cy="12" r="1.2" fill="#94a3b8" />
                <circle cx="14" cy="12" r="1.2" fill="#94a3b8" />
                <circle cx="6" cy="18" r="1.2" fill="#94a3b8" />
                <circle cx="10" cy="18" r="1.2" fill="#94a3b8" />
                <circle cx="14" cy="18" r="1.2" fill="#94a3b8" />
              </g>
            </svg>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: AUTHENTICATION FORM CARD WITH PURPLE AMBIENT GLOW
        ========================================================================= */}
        <div className="w-full lg:w-[46%] max-w-[480px] flex items-center justify-center">
          
          {/* Glowing Purple Ambient Aura behind Card matching Image 3 */}
          <div className="w-full relative">
            
            {/* Diffused outer purple aura */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600/30 via-violet-600/25 to-indigo-600/30 rounded-[38px] blur-2xl opacity-90 pointer-events-none"></div>

            {/* Frosted Glass Card Container */}
            <div className="relative w-full bg-[#0d1424]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-7 sm:p-9 shadow-[0_0_50px_rgba(139,92,246,0.25),0_25px_60px_rgba(0,0,0,0.8)] space-y-6 overflow-hidden">
              
              {/* Top-Right Specular Glass Sheen */}
              <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-bl from-white/[0.08] via-transparent to-transparent rounded-tr-[32px] pointer-events-none"></div>

              {/* Card Title & Subtitle */}
              <div className="text-center space-y-1 relative z-10">
                <h2 className="text-3xl sm:text-[32px] font-black text-white tracking-tight">
                  Welcome Back!
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Sign in to continue to your dashboard
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-2xl animate-shake relative z-10">
                  {error}
                </div>
              )}

              {/* Unified Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                
                {/* EMAIL ADDRESS Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block cursor-pointer">
                    EMAIL ADDRESS
                  </label>
                  <div className="flex items-center gap-3 bg-[#0b1120] border border-[#1e293b] focus-within:border-[#38bdf8] focus-within:ring-2 focus-within:ring-[#38bdf8]/25 focus-within:shadow-[0_0_18px_rgba(56,189,248,0.25)] rounded-2xl px-4 py-3 transition">
                    <EnvelopeIcon className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none font-medium py-1"
                    />
                  </div>
                </div>

                {/* PASSWORD Field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block cursor-pointer">
                    PASSWORD
                  </label>
                  <div className="flex items-center gap-3 bg-[#0b1120] border border-[#1e293b] focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/25 focus-within:shadow-[0_0_18px_rgba(168,85,247,0.25)] rounded-2xl px-4 py-3 transition">
                    <LockClosedIcon className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-500 text-sm focus:outline-none font-medium py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 transition cursor-pointer p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeIcon className="w-5 h-5" />
                      ) : (
                        <EyeSlashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => alert("Please contact your administrator or IT helpdesk to reset your password.")}
                    className="text-xs font-semibold text-slate-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Sign In to Portal Button with Vivid Purple Gradient */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#9333ea] shadow-[0_0_28px_rgba(168,85,247,0.5)] hover:shadow-[0_0_36px_rgba(168,85,247,0.7)] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
                  <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>

              {/* Quick Fill Demo Credentials Section */}
              <div className="pt-4 border-t border-[#1e2a42]/70 space-y-3 relative z-10">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase text-center block">
                  QUICK FILL DEMO CREDENTIALS
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {/* NIB Insurance Admin */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("admin@nibinsurance.com", "securepassword")}
                    className="p-2 sm:p-2.5 rounded-2xl bg-[#090f1d] hover:bg-[#11192e] border border-slate-800/80 hover:border-blue-500/50 text-left transition group cursor-pointer relative overflow-hidden"
                    title="Click to fill NIB Insurance Admin credentials"
                  >
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                      NIB Admin
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-300 truncate block mt-0.5">
                      (securepassword)
                    </span>
                  </button>

                  {/* NIB Alt Admin */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("admin.alt@nibinsurance.com", "securepassword")}
                    className="p-2 sm:p-2.5 rounded-2xl bg-[#090f1d] hover:bg-[#11192e] border border-slate-800/80 hover:border-emerald-500/50 text-left transition group cursor-pointer relative overflow-hidden"
                    title="Click to fill NIB Insurance (Alt) Admin credentials"
                  >
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                      NIB (Alt) Admin
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-300 truncate block mt-0.5">
                      (securepassword)
                    </span>
                  </button>

                  {/* YashTech Admin */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("yashtech@gmail.com", "yashtech@123")}
                    className="p-2 sm:p-2.5 rounded-2xl bg-[#090f1d] hover:bg-[#11192e] border border-slate-800/80 hover:border-indigo-500/50 text-left transition group cursor-pointer relative overflow-hidden"
                    title="Click to fill YashTech Admin credentials"
                  >
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                      YashTech Admin
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-300 truncate block mt-0.5">
                      (yashtech@123)
                    </span>
                  </button>

                  {/* SuperAdmin */}
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("superadmin@nib.com", "securepassword")}
                    className="p-2 sm:p-2.5 rounded-2xl bg-[#090f1d] hover:bg-[#11192e] border border-slate-800/80 hover:border-purple-500/50 text-left transition group cursor-pointer relative overflow-hidden"
                    title="Click to fill SuperAdmin credentials"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate block">
                        SuperAdmin
                      </span>
                      <span className="text-xs text-amber-400 shrink-0 ml-1">🔑</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-300 truncate block mt-0.5">
                      (securepassword)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;