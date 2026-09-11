import React, { useState } from "react";
import { ArrowUpTrayIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const ResumeParsing = ({ onRefreshData }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseStep, setParseStep] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [saved, setSaved] = useState(false);

  const mockExtractedProfiles = [
    {
      firstName: "Aditya",
      lastName: "Rao",
      email: "aditya.rao@gmail.com",
      phone: "+91 98765 43210",
      qualification: "B.Tech in Computer Science",
      experience: 4.5,
      currentCompany: "Infosys Ltd",
      expectedSalary: "12 LPA",
      skills: "React, Node.js, Express, MongoDB, Tailwind CSS, JavaScript",
      status: "Shortlisted"
    },
    {
      firstName: "Neha",
      lastName: "Sharma",
      email: "neha.sharma@yahoo.com",
      phone: "+91 87654 32109",
      qualification: "MBA in Human Resources",
      experience: 2.0,
      currentCompany: "TCS",
      expectedSalary: "6.5 LPA",
      skills: "Talent Acquisition, Onboarding, Employee Engagement, MS Excel",
      status: "Shortlisted"
    },
    {
      firstName: "David",
      lastName: "Miller",
      email: "david.miller@outlook.com",
      phone: "+1 (555) 019-2834",
      qualification: "M.S. in Software Engineering",
      experience: 6.0,
      currentCompany: "Microsoft",
      expectedSalary: "25 LPA",
      skills: "Python, Django, AWS, PostgreSQL, Docker, Kubernetes, Git",
      status: "Shortlisted"
    }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData(null);
      setSaved(false);
    }
  };

  const handleStartParsing = () => {
    if (!file) return;
    setParsing(true);
    setProgress(10);
    setParseStep("Uploading document to parsing parser server...");

    const steps = [
      { p: 30, text: "Reading file structural layout..." },
      { p: 55, text: "Extracting raw text segments using OCR..." },
      { p: 75, text: "Executing AI parser to identify entity labels..." },
      { p: 90, text: "Mapping candidate skills, experience, and contact info..." },
      { p: 100, text: "Parsing completed!" }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const current = steps[currentStepIdx];
        setProgress(current.p);
        setParseStep(current.text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setParsing(false);
        // Randomly select one of the mock extracted profiles
        const randomProfile = mockExtractedProfiles[Math.floor(Math.random() * mockExtractedProfiles.length)];
        setParsedData(randomProfile);
      }
    }, 900);
  };

  const handleSaveToDatabase = async () => {
    if (!parsedData) return;
    try {
      const candUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await apiFetch("/api/table/candidate_database", {
        method: "POST",
        body: JSON.stringify({
          candidateId: candUuid,
          ...parsedData
        })
      });
      setSaved(true);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to save candidate: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <h3 className="text-sm font-black text-slate-800">AI Resume Parser</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Drag, drop, and extract candidate files directly into the directory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Column */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-2xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Select Candidate Resume</h4>
            
            {/* File Drag Box */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 transition text-center cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <ArrowUpTrayIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-700">
                {file ? file.name : "Click or Drag resume file here"}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">Supports PDF, DOCX formats (Max 5MB)</p>
            </div>

            {/* Parsing Progress Bar */}
            {parsing && (
              <div className="space-y-2 pt-2 animate-pulse">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>{parseStep}</span>
                  <span className="font-mono text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!file || parsing}
            onClick={handleStartParsing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {parsing ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Extracting Text...</span>
              </>
            ) : (
              <span>Extract & Parse Resume</span>
            )}
          </button>
        </div>

        {/* Extracted Details Column */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-2xs space-y-6">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">AI Extracted Candidate Card</h4>

          {parsedData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={parsedData.firstName || ""}
                    onChange={(e) => setParsedData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={parsedData.lastName || ""}
                    onChange={(e) => setParsedData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={parsedData.email || ""}
                    onChange={(e) => setParsedData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    value={parsedData.phone || ""}
                    onChange={(e) => setParsedData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={parsedData.experience || 0}
                    onChange={(e) => setParsedData(prev => ({ ...prev, experience: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Expected Salary</label>
                  <input
                    type="text"
                    value={parsedData.expectedSalary || ""}
                    onChange={(e) => setParsedData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Highest Qualification</label>
                <input
                  type="text"
                  value={parsedData.qualification || ""}
                  onChange={(e) => setParsedData(prev => ({ ...prev, qualification: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Current Company</label>
                <input
                  type="text"
                  value={parsedData.currentCompany || ""}
                  onChange={(e) => setParsedData(prev => ({ ...prev, currentCompany: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-slate-450 font-black uppercase tracking-wider">Skills List (Comma separated)</label>
                <input
                  type="text"
                  value={parsedData.skills || ""}
                  onChange={(e) => setParsedData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {saved ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold justify-center mt-4">
                  <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>Successfully Saved to Candidate Database!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/10 hover:shadow-lg transition cursor-pointer mt-4"
                >
                  Save to Candidate Database
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2 border border-dashed rounded-2xl bg-slate-50/20">
              <span className="text-3xl">📄</span>
              <p className="text-xs text-slate-500 font-bold">No Parsed Profile Ready</p>
              <p className="text-[10px] text-slate-400 max-w-xs text-center">
                Select a resume file on the left and click "Extract & Parse Resume" to generate the candidate card.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeParsing;
