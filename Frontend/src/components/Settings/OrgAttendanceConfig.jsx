import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/hrApi';
import { useAuth } from '../../auth/AuthProvider';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  UserIcon,
  QrCodeIcon,
  FingerPrintIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const METHOD_DETAILS = {
  MANUAL: {
    title: 'Manual Supervisor Attendance',
    description: 'HR and Managers can manually enter or edit attendance records.',
    icon: PencilSquareIcon,
    badgeColor: 'bg-slate-100 text-slate-700',
  },
  FACE_RECOGNITION: {
    title: 'Face Recognition Attendance',
    description: 'Employees mark attendance via webcam with live AI face detection & anti-spoofing.',
    icon: UserIcon,
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  BIOMETRIC: {
    title: 'Biometric Terminal Attendance',
    description: 'Hardware fingerprint or facial recognition turnstile terminal integration.',
    icon: FingerPrintIcon,
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  QR: {
    title: 'QR / Barcode Attendance',
    description: 'Dynamic ROTP QR codes scanned at entrance kiosks or mobile app.',
    icon: QrCodeIcon,
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
};

export default function OrgAttendanceConfig() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const [methodsConfig, setMethodsConfig] = useState({
    MANUAL: { isEnabled: true, settings: {} },
    FACE_RECOGNITION: {
      isEnabled: true,
      settings: { minConfidenceScore: 0.82, livenessRequired: true, maxAttempts: 3 },
    },
    BIOMETRIC: { isEnabled: true, settings: { autoSyncIntervalMinutes: 5 } },
    QR: { isEnabled: true, settings: { rotationSeconds: 60 } },
  });

  // Fetch organization configuration
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/operations/attendance/config');
      if (res && res.data && res.data.methods) {
        const updatedMap = { ...methodsConfig };
        res.data.methods.forEach(m => {
          let norm = String(m.methodType || m.method || '').toUpperCase();
          if (norm === 'FACE') norm = 'FACE_RECOGNITION';
          if (updatedMap[norm]) {
            updatedMap[norm] = {
              isEnabled: Boolean(m.isEnabled || m.is_enabled),
              settings: m.settings || updatedMap[norm].settings,
            };
          }
        });
        setMethodsConfig(updatedMap);
      }
    } catch (err) {
      console.warn('Error fetching attendance config:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggle = (key) => {
    setMethodsConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isEnabled: !prev[key].isEnabled,
      },
    }));
  };

  const handleSettingChange = (key, settingKey, value) => {
    setMethodsConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        settings: {
          ...(prev[key].settings || {}),
          [settingKey]: value,
        },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', msg: '' });

    // Validate at least one method is enabled
    const atLeastOne = Object.values(methodsConfig).some(m => m.isEnabled);
    if (!atLeastOne) {
      setFeedback({ type: 'error', msg: 'At least one attendance method must remain enabled for the organization.' });
      setSaving(false);
      return;
    }

    try {
      // Map to payload
      const payload = {
        methods: Object.entries(methodsConfig).map(([key, value]) => ({
          methodType: key === 'FACE_RECOGNITION' ? 'FACE' : key,
          isEnabled: value.isEnabled,
          settings: value.settings,
        })),
      };

      const res = await apiFetch('/api/operations/attendance/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res && (res.success || res.statusCode === 200)) {
        setFeedback({ type: 'success', msg: 'Organization attendance configuration saved successfully.' });
        window.dispatchEvent(new Event('org-config-updated'));
      } else {
        setFeedback({ type: 'error', msg: res?.message || 'Failed to update configuration.' });
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setFeedback({ type: 'error', msg: err.message || 'Server error while updating config.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-600">Loading Organization Attendance Settings...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="font-bold text-base">Organization Attendance Methods</h3>
            <p className="text-xs text-slate-400">Configure active check-in/check-out methods for your company</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        {feedback.msg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(METHOD_DETAILS).map(([key, info]) => {
            const config = methodsConfig[key] || { isEnabled: false, settings: {} };
            const Icon = info.icon;

            return (
              <div
                key={key}
                className={`p-5 rounded-2xl border transition-all ${
                  config.isEnabled
                    ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${info.badgeColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{info.title}</h4>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {key}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isEnabled}
                      onChange={() => handleToggle(key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{info.description}</p>

                {/* Method Specific Detailed Settings */}
                {config.isEnabled && key === 'FACE_RECOGNITION' && (
                  <div className="mt-4 pt-3 border-t border-blue-100/80 space-y-3 bg-white p-3 rounded-xl border border-blue-100">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
                      Face Recognition Parameters
                    </h5>

                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-600 font-medium">Recognition Similarity Threshold</label>
                      <span className="font-bold text-blue-700">
                        {Math.round((config.settings?.minConfidenceScore || 0.82) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.70"
                      max="0.95"
                      step="0.01"
                      value={config.settings?.minConfidenceScore || 0.82}
                      onChange={e => handleSettingChange(key, 'minConfidenceScore', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="text-slate-600 font-medium">Require Eye-Blink Liveness</label>
                      <input
                        type="checkbox"
                        checked={config.settings?.livenessRequired !== false}
                        onChange={e => handleSettingChange(key, 'livenessRequired', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={fetchConfig}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-2 shadow-md"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Configuration...
              </>
            ) : (
              'Save Organization Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
