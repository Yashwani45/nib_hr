import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge } from "../components/ui";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyCode, setCompanyCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("Employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);







  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Code": companyCode.toUpperCase(),
        },
        body: JSON.stringify({ email, password, roleName }),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Workspace registration failed.");
      }

      // Automatically sign in upon registration
      login(result.data.accessToken, {
        email: result.data.email,
        role: result.data.role,
        companyCode: companyCode.toUpperCase(),
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 px-4 sm:px-6 py-12">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="primary" className="mx-auto">
            Provision Sandbox
          </Badge>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-3">
            Register Workspace
          </h2>
          <p className="text-sm text-indigo-200/60">
            Create user credentials inside your isolated tenant DB.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold rounded-2xl text-center">
            {error}
          </div>
        )}




        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">
              Company Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NIB01"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20 transition"
            />
          </div>




          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20 transition"
            />
          </div>



          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-indigo-200 uppercase tracking-wider">
              Target Access Role
            </label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="Employee">Employee (Self-Service View)</option>
              <option value="Manager">Manager (Team view)</option>
              <option value="Admin">Admin (Organization view)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Provisioning..." : "Create Account & Sign In"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-indigo-200/40">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-300 hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
