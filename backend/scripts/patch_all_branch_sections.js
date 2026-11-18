const fs = require('fs');
const filePath = 'Frontend/src/components/CoreSetup/Branch.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update KPI Strip
const oldKPI = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Facilities</span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">{allBranches.length} <span className="text-[11px] font-normal text-slate-400">/ 50 limit</span></span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Branches</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Inactive Branches</span>
            <span className="text-base font-black text-rose-700 mt-0.5 block">{inactiveCount}</span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Headcount</span>
            <span className="text-base font-black text-indigo-700 mt-0.5 block">{employees.length} personnel</span>
          </div>
        </div>`;

const newKPI = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAllSelected ? "Total Facilities" : "Selected Facility"}
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">
              {displayedBranches.length} <span className="text-[11px] font-normal text-slate-400">{isAllSelected ? \`/ \${MAX_BRANCHES} limit\` : \`of \${allBranches.length} total\`}</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Branches</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Inactive Branches</span>
            <span className="text-base font-black text-rose-700 mt-0.5 block">{inactiveCount}</span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Headcount</span>
            <span className="text-base font-black text-indigo-700 mt-0.5 block">{totalHeadcount} personnel</span>
          </div>
        </div>`;

if (content.includes(oldKPI)) {
  content = content.replace(oldKPI, newKPI);
  console.log('1. Updated KPI strip');
} else {
  console.log('1. KPI strip already updated or not found');
}

// 2. Add Scope pill banner right after Header Banner
const headerEnd = '      </div>\n\n      {/* 2. Top Navbar Selected Branch Context Card';
const scopeBanner = `      </div>

      {/* Scope Banner when a single branch is selected */}
      {!isAllSelected && navbarSelectedBranch && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 px-4 py-2.5 rounded-2xl text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span>
              Scoped to Active Branch: <strong>{navbarSelectedBranch.branchName || navbarSelectedBranch.branch_name}</strong> (Showing 1 of {allBranches.length} facilities).
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("selected_branch_id", "ALL");
              localStorage.setItem("selected_branch_name", "All Branches");
              localStorage.setItem("selected_branch_code", "ALL");
              window.dispatchEvent(new Event("branches_updated"));
              window.dispatchEvent(new Event("branch_changed"));
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("branch_switched", { detail: { branchId: "ALL", branchName: "All Branches", branchCode: "ALL" } }));
            }}
            className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-950 hover:underline cursor-pointer text-xs"
          >
            <span>View All Facilities ({allBranches.length})</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {/* 2. Top Navbar Selected Branch Context Card`;

if (content.includes(headerEnd)) {
  content = content.replace(headerEnd, scopeBanner);
  console.log('2. Added scope banner');
}

// 3. Update navbarSelectedBranch Assigned Personnel to use getBranchHeadcount
content = content.replace(
  'Assigned Personnel: <strong>{branchHeadcountMap[navbarSelectedBranch.id] || branchHeadcountMap[navbarSelectedBranch.branchName] || 0}</strong>',
  'Assigned Personnel: <strong>{getBranchHeadcount(navbarSelectedBranch)}</strong>'
);
console.log('3. Updated navbarSelectedBranch Assigned Personnel');

// 4. Update card headcount in Facilities Directory
content = content.replace(
  'const headcount = branchHeadcountMap[br.id] || branchHeadcountMap[br.branchName] || 0;',
  'const headcount = getBranchHeadcount(br);'
);
console.log('4. Updated card headcount in Facilities Directory');

// 5. Update Working Hours & Shifts table to use displayedBranches
content = content.replace(
  '{allBranches.map((br) => (\n                  <tr key={br.id} className="hover:bg-slate-50/80 transition">',
  '{displayedBranches.map((br) => (\n                  <tr key={br.id} className="hover:bg-slate-50/80 transition">'
);
console.log('5. Updated Working Hours & Shifts');

// 6. Update Attendance Policies to use displayedBranches
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n            {allBranches.map((br) => (',
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n            {displayedBranches.map((br) => ('
);
console.log('6. Updated Attendance Policies');

// 7. Update Payroll & Compliance to use displayedBranches
content = content.replace(
  '<tbody className="divide-y divide-slate-100">\n                {allBranches.map((br) => (\n                  <tr key={br.id}',
  '<tbody className="divide-y divide-slate-100">\n                {displayedBranches.map((br) => (\n                  <tr key={br.id}'
);
console.log('7. Updated Payroll & Compliance');

// 8. Update Branch Reporting to use displayedBranches and getBranchHeadcount
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n            {allBranches.map((br) => {\n              const count = branchHeadcountMap[br.id] || branchHeadcountMap[br.branchName] || 0;',
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n            {displayedBranches.map((br) => {\n              const count = getBranchHeadcount(br);'
);
console.log('8. Updated Branch Reporting');

// 9. Add displayedHolidays logic
if (!content.includes('displayedHolidays')) {
  const holidayHeader = '{activeSubTab === "holidays" && (';
  const holidayFilter = `const displayedHolidays = useMemo(() => {
    if (isAllSelected) return branchHolidays;
    const targetName = (navbarSelectedBranch?.branchName || navbarSelectedBranch?.branch_name || "").toLowerCase().trim();
    const targetId = String(navbarSelectedBranch?.id || "").trim();
    return branchHolidays.filter(h => {
      const hBranch = (h.branch_name || h.branch || "").toLowerCase().trim();
      const hId = String(h.branch_id || h.branchId || "").trim();
      return !hBranch || hBranch === "all branches" || hBranch.includes("company-wide") || hId === targetId || (targetName && hBranch.includes(targetName));
    });
  }, [branchHolidays, isAllSelected, navbarSelectedBranch]);\n\n  `;

  // We place displayedHolidays right after getBranchHeadcount
  const getBranchHeadcountEnd = 'return 0;\n  };';
  content = content.replace(getBranchHeadcountEnd, getBranchHeadcountEnd + '\n\n  ' + holidayFilter);

  content = content.replace(
    '{branchHolidays.length === 0 ? (',
    '{displayedHolidays.length === 0 ? ('
  );
  content = content.replace(
    '{branchHolidays.map((h) => (',
    '{displayedHolidays.map((h) => ('
  );
  console.log('9. Updated Holidays filter');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching Branch.jsx!');
