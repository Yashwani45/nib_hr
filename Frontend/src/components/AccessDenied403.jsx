import React from "react";
import { ShieldExclamationIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const AccessDenied403 = ({ moduleName = "this module" }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full text-center bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="w-20 h-20 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
          <ShieldExclamationIcon className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            Error 403 • Access Denied
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Restricted Department Module
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your Department HR or user role does not have permission to access <strong className="text-slate-800">{moduleName}</strong>. Please contact your Super Admin to assign this module.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied403;
