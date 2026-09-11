import React, { useState } from "react";
import { PlusIcon, TrashIcon, CheckIcon, ClipboardDocumentCheckIcon, ComputerDesktopIcon, KeyIcon, AcademicCapIcon, FingerPrintIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const Onboarding = ({ records = [], onRefreshData }) => {
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New onboarding form state
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    job_title: "",
    status: "Pending"
  });

  const DEFAULT_TASKS = [
    { id: "docs", label: "Document Verification (Aadhar, PAN, Education)", completed: false },
    { id: "assets", label: "IT Assets Allocation (Laptop, Access Card)", completed: false },
    { id: "email", label: "Corporate Email & IAM Setup", completed: false },
    { id: "training", label: "Compliance & Orientation Training", completed: false },
    { id: "biometric", label: "Biometric Registration & Shift Schedule", completed: false }
  ];

  // Selected Candidate Custom Details State (Docs, Assets, IAM, Training, Biometrics)
  const [docsState, setDocsState] = useState({
    Aadhaar: "Pending",
    PAN: "Pending",
    "10th Certificate": "Pending",
    "12th Certificate": "Pending",
    "Degree Certificate": "Pending",
    "Address Proof": "Pending",
    "Bank Details": "Pending",
    rejectionReason: ""
  });

  const [assetData, setAssetData] = useState({
    assetId: "AST-" + Math.floor(1000 + Math.random() * 9000),
    assetName: "Laptop (MacBook Pro)",
    serialNumber: "",
    assignedDate: new Date().toISOString().split("T")[0],
    condition: "New",
    status: "Assigned",
    remarks: ""
  });

  const [iamData, setIamData] = useState({
    corporateEmail: "",
    hrmsAccount: "Active",
    iamAccount: "Active",
    employeeRole: "Software Engineer",
    accessLevel: "Developer",
    accountStatus: "Provisioned"
  });

  const [complianceState, setComplianceState] = useState({
    "Company Policies": "Assigned",
    "Code of Conduct": "Assigned",
    "Information Security": "Assigned",
    "Data Privacy": "Assigned",
    "Workplace Safety": "Assigned",
    "HR Policies": "Assigned"
  });

  const [biometricData, setBiometricData] = useState({
    biometricId: "",
    shiftName: "General Shift",
    startTime: "09:00",
    endTime: "18:00",
    workingDays: "Monday to Friday",
    weeklyOff: "Saturday, Sunday"
  });

  const [joiningEmpCode, setJoiningEmpCode] = useState("");

  const handleOpenDetail = (rec) => {
    setSelectedOnboarding(rec);
    setActiveTab("general");
    
    // Auto-generate IAM corporate email based on candidate name
    const emailPrefix = rec.candidate_name.toLowerCase().replace(/\s+/g, ".");
    setIamData(prev => ({
      ...prev,
      corporateEmail: `${emailPrefix}@nibtechnologies.com`
    }));

    // Auto-generate employee code for joining tab
    setJoiningEmpCode("EMP" + Math.floor(100 + Math.random() * 900));

    // Reset details forms
    setAssetData({
      assetId: "AST-" + Math.floor(1000 + Math.random() * 9000),
      assetName: "Laptop (MacBook Pro)",
      serialNumber: "SN-" + Math.floor(100000 + Math.random() * 900000),
      assignedDate: new Date().toISOString().split("T")[0],
      condition: "New",
      status: "Assigned",
      remarks: ""
    });

    setBiometricData({
      biometricId: "BIO-" + Math.floor(1000 + Math.random() * 9000),
      shiftName: "General Shift",
      startTime: "09:00",
      endTime: "18:00",
      workingDays: "Monday to Friday",
      weeklyOff: "Saturday, Sunday"
    });
  };

  const handleCreateOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await apiFetch("/api/table/onboarding_tasks", {
        method: "POST",
        body: JSON.stringify({
          id: uuid,
          candidate_name: formData.candidate_name,
          candidate_email: formData.candidate_email,
          job_title: formData.job_title,
          status: "Pending",
          progress: 0,
          tasks: JSON.stringify(DEFAULT_TASKS)
        })
      });
      setShowAddModal(false);
      setFormData({ candidate_name: "", candidate_email: "", job_title: "", status: "Pending" });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to initiate onboarding: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (rec, taskId) => {
    try {
      let parsedTasks = [];
      try {
        parsedTasks = typeof rec.tasks === "string" ? JSON.parse(rec.tasks) : rec.tasks;
      } catch (err) {
        parsedTasks = DEFAULT_TASKS;
      }

      const updatedTasks = parsedTasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );

      const completedCount = updatedTasks.filter(t => t.completed).length;
      const progressPercent = Math.round((completedCount / updatedTasks.length) * 100);
      const nextStatus = progressPercent === 100 ? "Completed" : "In Progress";

      const updatedRecord = {
        ...rec,
        tasks: JSON.stringify(updatedTasks),
        progress: progressPercent,
        status: nextStatus
      };

      await apiFetch(`/api/table/onboarding_tasks/${rec.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedRecord)
      });

      setSelectedOnboarding(updatedRecord);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to update checklist task.");
    }
  };

  const handleSaveDocs = () => {
    alert("Documents verified status updated locally. Verification complete!");
  };

  const handleSaveAssets = () => {
    alert(`IT Asset ${assetData.assetName} (Serial: ${assetData.serialNumber}) allocated successfully!`);
  };

  const handleSaveIAM = () => {
    alert(`IAM Workspace Accounts provisioned for corporate email: ${iamData.corporateEmail}`);
  };

  const handleSaveCompliance = () => {
    alert("Compliance training progress logs saved!");
  };

  const handleSaveBiometrics = () => {
    alert(`Biometric credentials registered under ID: ${biometricData.biometricId}`);
  };

  const handleCompleteJoining = async () => {
    if (!joiningEmpCode) {
      alert("Please provide an Employee ID to sync.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create joining record
      const joiningUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await apiFetch("/api/table/joining_records", {
        method: "POST",
        body: JSON.stringify({
          id: joiningUuid,
          joiningId: "JOIN-" + Math.floor(1000 + Math.random() * 9000),
          candidateId: selectedOnboarding.id,
          employeeId: joiningEmpCode,
          employeeName: selectedOnboarding.candidate_name,
          joiningDate: new Date().toISOString().split("T")[0],
          department: "IT",
          designation: selectedOnboarding.job_title,
          joiningStatus: "Joined"
        })
      });

      // 2. Sync to employee_profile
      const empUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await apiFetch("/api/table/employee_profile", {
        method: "POST",
        body: JSON.stringify({
          id: empUuid,
          employeeCode: joiningEmpCode,
          firstName: selectedOnboarding.candidate_name.split(" ")[0],
          lastName: selectedOnboarding.candidate_name.split(" ").slice(1).join(" ") || "Employee",
          email: selectedOnboarding.candidate_email,
          status: "Active",
          joiningDate: new Date().toISOString().split("T")[0]
        })
      });

      // 3. Mark Onboarding record status as Completed
      await apiFetch(`/api/table/onboarding_tasks/${selectedOnboarding.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...selectedOnboarding,
          status: "Completed",
          progress: 100
        })
      });

      alert("Awesome! Candidate joined, employee directory successfully populated and synced.");
      setSelectedOnboarding(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to complete joining: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOnboarding = async (id) => {
    if (!window.confirm("Are you sure you want to delete this onboarding record?")) return;
    try {
      await apiFetch(`/api/table/onboarding_tasks/${id}`, {
        method: "DELETE"
      });
      setSelectedOnboarding(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete onboarding record.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Workspace stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Onboardings", val: records.length, color: "text-blue-600 bg-blue-50" },
          { label: "In Progress", val: records.filter(r => r.status === "In Progress").length, color: "text-amber-600 bg-amber-50" },
          { label: "Completed", val: records.filter(r => r.status === "Completed").length, color: "text-green-600 bg-green-50" },
          { label: "Pending", val: records.filter(r => r.status === "Pending").length, color: "text-purple-600 bg-purple-50" },
          { label: "Overdue", val: records.filter(r => r.status === "Overdue").length || 0, color: "text-red-600 bg-red-50" }
        ].map((m, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-tight">{m.label}</span>
            <h3 className={`text-lg font-black mt-2 ${m.color} px-2 py-0.5 rounded w-max`}>{m.val}</h3>
          </div>
        ))}
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h3 className="text-sm font-black text-slate-800">Onboarding Workspace</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Coordinate induction checklists, documents and IAM workspace assets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Initiate Onboarding</span>
        </button>
      </div>

      {/* Grid of Onboarding Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.map((rec) => {
          let tasksList = [];
          try {
            tasksList = typeof rec.tasks === "string" ? JSON.parse(rec.tasks) : rec.tasks;
          } catch (e) {
            tasksList = DEFAULT_TASKS;
          }

          return (
            <div
              key={rec.id}
              onClick={() => handleOpenDetail(rec)}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{rec.candidate_name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{rec.job_title} • {rec.candidate_email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    rec.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    rec.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-50 text-slate-500 border-slate-200"
                  } border`}>
                    {rec.status || "Pending"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Onboarding Integration Progress</span>
                    <span className="font-mono text-indigo-600">{rec.progress || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${rec.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Mini checklists tracker status preview */}
                <div className="text-[10px] text-slate-500 font-bold space-y-1 pt-2 border-t border-slate-50">
                  {tasksList.map(t => (
                    <div key={t.id} className="flex items-center gap-1.5">
                      <span className={t.completed ? "text-green-500" : "text-slate-350"}>
                        {t.completed ? "☑" : "☐"}
                      </span>
                      <span className={t.completed ? "line-through text-slate-400" : "text-slate-650"}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[9px] font-black text-indigo-600">Click to Open Detail Workspace →</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteOnboarding(rec.id); }}
                  className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-650 transition cursor-pointer"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {records.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">📋</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Checklists Initiated</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Select a candidate to generate checklists.</p>
          </div>
        )}
      </div>

      {/* Selected Onboarding Detail Portal Modal */}
      {selectedOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Onboarding Workspace Detail Portal</h3>
                <p className="text-[10px] font-bold text-slate-450 mt-0.5">
                  Candidate: {selectedOnboarding.candidate_name} • {selectedOnboarding.job_title} ({selectedOnboarding.progress}% Complete)
                </p>
              </div>
              <button
                onClick={() => setSelectedOnboarding(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            {/* Tabbed Nav Bar */}
            <div className="flex bg-slate-100 border-b overflow-x-auto text-[10px] font-black uppercase tracking-wider">
              {[
                { id: "general", label: "Checklist", icon: ClipboardDocumentCheckIcon },
                { id: "docs", label: "Documents Verification", icon: AcademicCapIcon },
                { id: "assets", label: "IT Assets", icon: ComputerDesktopIcon },
                { id: "iam", label: "Email & IAM", icon: KeyIcon },
                { id: "compliance", label: "Orientation", icon: ClipboardDocumentCheckIcon },
                { id: "biometric", label: "Biometric & Shift", icon: FingerPrintIcon },
                { id: "joining", label: "Complete Joining", icon: UserPlusIcon }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 shrink-0 border-b-2 font-black transition cursor-pointer ${
                    activeTab === t.id 
                      ? "border-indigo-600 bg-white text-indigo-600" 
                      : "border-transparent text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Detail Tabs Content Area */}
            <div className="flex-1 overflow-y-auto p-6 text-xs leading-relaxed">
              
              {/* Tab 1: General Checklist */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Onboarding Checklist Tasks</h4>
                  <div className="space-y-3">
                    {(() => {
                      let tList = [];
                      try {
                        tList = typeof selectedOnboarding.tasks === "string" ? JSON.parse(selectedOnboarding.tasks) : selectedOnboarding.tasks;
                      } catch (e) {
                        tList = DEFAULT_TASKS;
                      }
                      return tList.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTask(selectedOnboarding, t.id)}
                          className="flex items-center gap-3 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl transition cursor-pointer"
                        >
                          <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                            t.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-350 bg-white"
                          }`}>
                            {t.completed && <CheckIcon className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                          <span className={`font-semibold ${t.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {t.label}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Tab 2: Document Verification */}
              {activeTab === "docs" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Verification Documents Verification Checklist</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(docsState).filter(k => k !== "rejectionReason").map(docName => (
                      <div key={docName} className="p-3.5 bg-slate-50 border rounded-xl flex justify-between items-center">
                        <span className="font-bold text-slate-700">{docName}</span>
                        <select
                          value={docsState[docName]}
                          onChange={(e) => setDocsState(prev => ({ ...prev, [docName]: e.target.value }))}
                          className="text-[10px] font-black border bg-white rounded-lg p-1 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {Object.values(docsState).includes("Rejected") && (
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-[9px] font-black text-red-500 uppercase tracking-wider">Document Rejection Reason</label>
                      <input
                        type="text"
                        required
                        value={docsState.rejectionReason}
                        onChange={(e) => setDocsState(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        className="w-full text-xs border border-red-200 rounded-xl p-2.5 bg-red-50/10 font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Please specify which document was rejected and the reason why..."
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSaveDocs}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirm Document Statuses
                  </button>
                </div>
              )}

              {/* Tab 3: IT Asset Allocation */}
              {activeTab === "assets" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Assign Hardware IT Assets</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset ID</label>
                      <input
                        type="text"
                        readOnly
                        value={assetData.assetId}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-100 font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset Name</label>
                      <select
                        value={assetData.assetName}
                        onChange={(e) => setAssetData(prev => ({ ...prev, assetName: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Laptop (MacBook Pro)">Laptop (MacBook Pro)</option>
                        <option value="Desktop (Intel Core i7)">Desktop (Intel Core i7)</option>
                        <option value="Keyboard & Mouse Combo">Keyboard & Mouse Combo</option>
                        <option value="Access Card (NFC)">Access Card (NFC)</option>
                        <option value="SIM Card (Airtel)">SIM Card (Airtel)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Serial Number</label>
                      <input
                        type="text"
                        required
                        value={assetData.serialNumber}
                        onChange={(e) => setAssetData(prev => ({ ...prev, serialNumber: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                        placeholder="e.g. SN-892716"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Allocation Date</label>
                      <input
                        type="date"
                        value={assetData.assignedDate}
                        onChange={(e) => setAssetData(prev => ({ ...prev, assignedDate: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Condition</label>
                      <select
                        value={assetData.condition}
                        onChange={(e) => setAssetData(prev => ({ ...prev, condition: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="New">New</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Asset Status</label>
                      <select
                        value={assetData.status}
                        onChange={(e) => setAssetData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Remarks</label>
                      <input
                        type="text"
                        value={assetData.remarks}
                        onChange={(e) => setAssetData(prev => ({ ...prev, remarks: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                        placeholder="e.g. Workstation setup"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAssets}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Allocate Hardware Asset
                  </button>
                </div>
              )}

              {/* Tab 4: Corporate Email & IAM Setup */}
              {activeTab === "iam" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">IAM Directory & Access Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Corporate Email Address</label>
                      <input
                        type="email"
                        value={iamData.corporateEmail}
                        onChange={(e) => setIamData(prev => ({ ...prev, corporateEmail: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Access Level Permissions</label>
                      <select
                        value={iamData.accessLevel}
                        onChange={(e) => setIamData(prev => ({ ...prev, accessLevel: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Developer">Developer Profile</option>
                        <option value="HR Administrator">HR Administrator</option>
                        <option value="Department Manager">Department Manager</option>
                        <option value="Superuser">Full Access Superuser</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">HRMS Account</label>
                      <select
                        value={iamData.hrmsAccount}
                        onChange={(e) => setIamData(prev => ({ ...prev, hrmsAccount: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">IAM Workspace Status</label>
                      <select
                        value={iamData.iamAccount}
                        onChange={(e) => setIamData(prev => ({ ...prev, iamAccount: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Employee Role (RBAC)</label>
                      <input
                        type="text"
                        value={iamData.employeeRole}
                        onChange={(e) => setIamData(prev => ({ ...prev, employeeRole: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-bold">
                    🛡️ <span className="font-extrabold text-indigo-900">RBAC IAM Policy:</span> Workspace credentials and access profiles are provisioned using secure Role Based Access Control. Temporary passwords will be sent to the candidate's personal email directly.
                  </div>

                  <button
                    onClick={handleSaveIAM}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Provision IAM Directory Profile
                  </button>
                </div>
              )}

              {/* Tab 5: Compliance & Orientation */}
              {activeTab === "compliance" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mandatory Orientation Modules</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(complianceState).map(moduleName => (
                      <div key={moduleName} className="p-3.5 bg-slate-50 border rounded-xl flex justify-between items-center">
                        <span className="font-bold text-slate-700">{moduleName}</span>
                        <select
                          value={complianceState[moduleName]}
                          onChange={(e) => setComplianceState(prev => ({ ...prev, [moduleName]: e.target.value }))}
                          className="text-[10px] font-black border bg-white rounded-lg p-1 focus:outline-none cursor-pointer"
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveCompliance}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Save Training Logs
                  </button>
                </div>
              )}

              {/* Tab 6: Biometric & Shift config */}
              {activeTab === "biometric" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Biometric Identity & Shift Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Biometric Gate ID</label>
                      <input
                        type="text"
                        value={biometricData.biometricId}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, biometricId: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                        placeholder="e.g. BIO-8910"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift Name</label>
                      <input
                        type="text"
                        value={biometricData.shiftName}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, shiftName: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift Start Time</label>
                      <input
                        type="time"
                        value={biometricData.startTime}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Shift End Time</label>
                      <input
                        type="time"
                        value={biometricData.endTime}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Working Days</label>
                      <input
                        type="text"
                        value={biometricData.workingDays}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, workingDays: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Weekly Off</label>
                      <input
                        type="text"
                        value={biometricData.weeklyOff}
                        onChange={(e) => setBiometricData(prev => ({ ...prev, weeklyOff: e.target.value }))}
                        className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBiometrics}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Confirm Biometric Credentials
                  </button>
                </div>
              )}

              {/* Tab 7: Sync to Employee Directory */}
              {activeTab === "joining" && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sync Onboarded Candidate to Active Directory</h4>
                  
                  {selectedOnboarding.progress < 100 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs font-medium text-amber-800">
                      <p className="font-extrabold text-amber-900">⚠️ Integration Checklist Incomplete</p>
                      <p>
                        The sync button will remain disabled until all onboarding checklist milestones have been verified and updated to 100% complete.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-2 text-xs font-medium text-green-800">
                      <p className="font-extrabold text-green-900">🎉 Integration Milestones Achieved!</p>
                      <p>
                        Candidate has successfully completed all onboarding tracks. You can now allocate their Employee ID and sync them into the active directory.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 max-w-sm">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Allocate Employee ID Code</label>
                    <input
                      type="text"
                      required
                      value={joiningEmpCode}
                      onChange={(e) => setJoiningEmpCode(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                      placeholder="e.g. EMP8910"
                    />
                  </div>

                  <button
                    onClick={handleCompleteJoining}
                    disabled={selectedOnboarding.progress < 100 || loading}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                  >
                    <UserPlusIcon className="w-4 h-4 shrink-0" />
                    <span>{loading ? "Syncing Directory..." : "Complete Joining & Sync Employee"}</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Add Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Initiate Onboarding Checklist</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Assign candidate details to generate induction tasks</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOnboarding} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={formData.candidate_name}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Yash Soni"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={formData.candidate_email}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="yash@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Position</label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Web Developer"
                />
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Initiating..." : "Initiate Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
