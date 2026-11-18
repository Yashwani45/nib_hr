const fs = require('fs');
const filePath = 'Frontend/src/components/CoreSetup/Branch.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('  // Filtered branches for display\n  const filteredBranches');
const endIndex = content.indexOf('  // 1. Action: Toggle Branch Status (Active / Inactive)');

console.log('startIndex:', startIndex, 'endIndex:', endIndex);

const replacement = `  // Branches to display based on navbar dropdown (Specific Branch vs All Branches)
  const displayedBranches = useMemo(() => {
    if (isAllSelected) return allBranches;
    const matched = allBranches.filter(isBranchMatch);
    return matched.length > 0 ? matched : (navbarSelectedBranch ? [navbarSelectedBranch] : allBranches);
  }, [allBranches, isAllSelected, storedId, storedName, storedCode, syncTick, navbarSelectedBranch]);

  // Filtered branches for display (search + status applied on displayedBranches)
  const filteredBranches = useMemo(() => {
    return displayedBranches.filter((br) => {
      const name = (br.branchName || br.branch_name || "").toLowerCase();
      const code = (br.branchCode || br.branch_code || "").toLowerCase();
      const city = (br.city || "").toLowerCase();
      const manager = (br.manager || "").toLowerCase();
      const status = br.status || "Active";

      const matchesSearch = 
        !searchQuery || 
        name.includes(searchQuery.toLowerCase()) || 
        code.includes(searchQuery.toLowerCase()) || 
        city.includes(searchQuery.toLowerCase()) || 
        manager.includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [displayedBranches, searchQuery, statusFilter]);

  // Headcount per branch map (robust normalization for id, code, and names)
  const branchHeadcountMap = useMemo(() => {
    const map = {};
    employees.forEach(emp => {
      const bId = emp.branch_id || emp.branchId;
      const bName = emp.branch || emp.branchName || emp.branch_name;
      const bCode = emp.branchCode || emp.branch_code;
      if (bId) {
        map[bId] = (map[bId] || 0) + 1;
      }
      if (bName) {
        map[bName] = (map[bName] || 0) + 1;
        const norm = String(bName).toLowerCase().trim().replace(/[\\u2013\\u2014-]/g, '-');
        map[norm] = (map[norm] || 0) + 1;
      }
      if (bCode) {
        map[String(bCode).toLowerCase().trim()] = (map[String(bCode).toLowerCase().trim()] || 0) + 1;
      }
    });
    return map;
  }, [employees]);

  // Accurate headcount resolver for a branch
  const getBranchHeadcount = (br) => {
    if (!br) return 0;
    if (br.id && branchHeadcountMap[br.id]) return branchHeadcountMap[br.id];
    const bName = br.branchName || br.branch_name || "";
    if (bName && branchHeadcountMap[bName]) return branchHeadcountMap[bName];
    const norm = bName.toLowerCase().trim().replace(/[\\u2013\\u2014-]/g, '-');
    if (norm && branchHeadcountMap[norm]) return branchHeadcountMap[norm];
    const bCode = br.branchCode || br.branch_code || "";
    if (bCode && branchHeadcountMap[bCode.toLowerCase().trim()]) return branchHeadcountMap[bCode.toLowerCase().trim()];
    return 0;
  };\n\n`;

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully replaced filteredBranches and headcount map!');
} else {
  console.error('Failed to find indices!');
}
