const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Frontend', 'src', 'components', 'Attendance', 'EmployeeQrScannerModal.jsx');
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('Smart Auto (In / Out)')) {
  const target = '<div className="p-5 sm:p-6 space-y-5">\n          {/* Camera Selection */}';
  const targetCRLF = '<div className="p-5 sm:p-6 space-y-5">\r\n          {/* Camera Selection */}';

  const newSection = `<div className="p-5 sm:p-6 space-y-4">
          {/* Mode Selector */}
          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPunchMode("auto")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "auto"
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200 font-black"
                  : "text-slate-600 hover:text-slate-900"
              }\`}
            >
              <SparklesIcon className="w-4 h-4 text-indigo-600" />
              <span>⚡ Smart Auto (In / Out)</span>
            </button>
            <button
              type="button"
              onClick={() => setPunchMode("clock-in")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "clock-in"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-emerald-700"
              }\`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>🟢 Check-In Only</span>
            </button>
            <button
              type="button"
              onClick={() => setPunchMode("clock-out")}
              className={\`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer \${
                punchMode === "clock-out"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-amber-700"
              }\`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>🔴 Check-Out Only</span>
            </button>
          </div>

          {/* Quick Zoom Presets for Distance Scanning */}
          <div className="flex items-center justify-between px-1 bg-indigo-50/60 border border-indigo-100 rounded-xl py-1.5 px-3 text-xs">
            <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5">
              <BoltIcon className="w-4 h-4 text-indigo-600" />
              <span>Door Se Scan (Distance Zoom):</span>
            </span>
            <div className="flex items-center gap-1">
              {[1, 1.5, 2, 2.5, 3].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => handleCameraZoomChange(z)}
                  className={\`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer \${
                    cameraZoom === z
                      ? "bg-indigo-600 text-white shadow-sm scale-105"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }\`}
                  title={\`Zoom \${z}x for scanning QR from distance\`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          {/* Camera Selection */}`;

  if (code.includes(target)) {
    code = code.replace(target, newSection);
  } else if (code.includes(targetCRLF)) {
    code = code.replace(targetCRLF, newSection);
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully injected Distance Zoom and Check-In/Out Mode Selector!');
