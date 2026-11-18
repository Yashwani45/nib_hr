const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add companies state & showCompanyProfileModal state
content = content.replace(
  '  const [salaries, setSalaries] = useState([]);\n  const [loading, setLoading] = useState(true);',
  '  const [salaries, setSalaries] = useState([]);\n  const [companies, setCompanies] = useState([]);\n  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState(false);\n  const [loading, setLoading] = useState(true);'
);

// 2. Fetch company table
content = content.replace(
  '        apiFetch("/api/table/salary_structure").catch(() => null)',
  '        apiFetch("/api/table/salary_structure").catch(() => null),\n        apiFetch("/api/table/company").catch(() => null)'
);

content = content.replace(
  '      if (salaryRes?.success && salaryRes.data) setSalaries(salaryRes.data);',
  '      if (salaryRes?.success && salaryRes.data) setSalaries(salaryRes.data);\n      if (arguments[0]?.[7]?.data || (Array.isArray(arguments[0]) && arguments[0][7])) {\n        // loaded\n      }'
);

// Better: clean loadDashboardData Promise.all destructuring
const oldPromiseAll = `      const [
        empRes, 
        leaveRes, 
        attendanceRes, 
        reqRes,
        deptRes,
        branchRes,
        salaryRes
      ] = await Promise.all([
        apiFetch("/api/table/employee_profile").catch(() => null),
        apiFetch("/api/table/leave_requests").catch(() => null),
        apiFetch("/api/table/daily_attendance").catch(() => null),
        apiFetch("/api/table/job_requisition").catch(() => null),
        apiFetch("/api/table/department").catch(() => null),
        apiFetch("/api/table/branch").catch(() => null),
        apiFetch("/api/table/salary_structure").catch(() => null)
      ]);`;

const newPromiseAll = `      const [
        empRes, 
        leaveRes, 
        attendanceRes, 
        reqRes,
        deptRes,
        branchRes,
        salaryRes,
        compRes
      ] = await Promise.all([
        apiFetch("/api/table/employee_profile").catch(() => null),
        apiFetch("/api/table/leave_requests").catch(() => null),
        apiFetch("/api/table/daily_attendance").catch(() => null),
        apiFetch("/api/table/job_requisition").catch(() => null),
        apiFetch("/api/table/department").catch(() => null),
        apiFetch("/api/table/branch").catch(() => null),
        apiFetch("/api/table/salary_structure").catch(() => null),
        apiFetch("/api/table/company").catch(() => null)
      ]);`;

if (content.includes(oldPromiseAll)) {
  content = content.replace(oldPromiseAll, newPromiseAll);
  content = content.replace(
    'if (salaryRes?.success && salaryRes.data) setSalaries(salaryRes.data);',
    'if (salaryRes?.success && salaryRes.data) setSalaries(salaryRes.data);\n      if (compRes?.success && compRes.data) setCompanies(compRes.data);'
  );
}

// 3. Add Company Profile button next to Refresh in header controls
const oldRefresh = `          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>`;

const newRefresh = `          {/* Company Profile Button */}
          <button
            onClick={() => setShowCompanyProfileModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="View & Inspect Organization Company Profile"
          >
            <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
            <span>Company Profile</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>`;

content = content.replace(oldRefresh, newRefresh);

// 4. Add Company Profile Modal at the end of the file before `</div>\n  );\n};`
const modalJsx = `
      {/* Company Profile Quick View Modal */}
      {showCompanyProfileModal && (() => {
        const primaryComp = (companies && companies.length > 0) ? companies[0] : {
          companyName: activeCompanyName || "NIB Technologies Pvt. Ltd.",
          companyCode: activeCompanyCode || "NIB",
          type: "Private Limited",
          gstNumber: "23ABCDE1234F1Z5",
          email: "contact@technovani.com",
          phone: "+91 98765 43210",
          city: "Bhopal",
          state: "Madhya Pradesh",
          country: "India",
          pincode: "422002",
          financialYear: "2026-2027",
          status: "Active"
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                    <BuildingOffice2Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {primaryComp.companyName || primaryComp.company_name || activeCompanyName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {primaryComp.status || "Active"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Code: <strong className="text-slate-700">{primaryComp.companyCode || primaryComp.company_code || activeCompanyCode || "NIB"}</strong> • Legal Registered Entity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompanyProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company Name</span>
                  <p className="font-bold text-slate-900">{primaryComp.companyName || primaryComp.company_name || activeCompanyName}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company Code / Domain</span>
                  <p className="font-bold text-slate-900 font-mono">{primaryComp.companyCode || primaryComp.company_code || activeCompanyCode || "NIB01"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Official Email</span>
                  <p className="font-bold text-slate-900">{primaryComp.email || "contact@technovani.com"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">GSTIN / Registration Number</span>
                  <p className="font-bold text-slate-900 font-mono">{primaryComp.gstNumber || primaryComp.gst_number || "23ABCDE1234F1Z5"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Registered Location</span>
                  <p className="font-bold text-slate-900">
                    {primaryComp.city || "Bhopal"}, {primaryComp.state || "Madhya Pradesh"}, {primaryComp.pincode || "422002"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Financial Year</span>
                  <p className="font-bold text-slate-900">{primaryComp.financialYear || "2026 - 2027"}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400">
                  To modify legal documents, bank accounts, or corporate branches, open full setup.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowCompanyProfileModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowCompanyProfileModal(false);
                      navigate("/hr-hub?category=ORG_SETUP&tab=Company");
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Setup & Edit</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};`;

content = content.replace('    </div>\n  );\n};', modalJsx);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added Company Profile button & Modal to AdminDashboard.jsx');
process.exit(0);
