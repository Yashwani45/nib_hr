import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../services/hrApi';

const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

export default function EmployeeBiometricPunch({ onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const cancelWait = useRef(false);

  useEffect(() => {
    let active = true;
    apiFetch('/api/operations/attendance/biometric/status')
      .then(response => {
        if (active) setStatus(response.data);
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Could not load biometric attendance status.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      cancelWait.current = true;
    };
  }, []);

  const waitForPhysicalPunch = async () => {
    if (waiting || !status?.mappingConfigured) return;

    cancelWait.current = false;
    setWaiting(true);
    setError('');
    setMessage('Waiting for a verified event from the physical fingerprint device. Place your finger on the device now.');

    try {
      const baselineResponse = await apiFetch('/api/operations/attendance/biometric/status');
      const baseline = baselineResponse.data?.latestEvent?.id || null;
      const startedAt = Date.now();
      const deadline = startedAt + 120000;

      while (!cancelWait.current && Date.now() < deadline) {
        await wait(2000);
        if (cancelWait.current) return;

        const response = await apiFetch('/api/operations/attendance/biometric/status');
        const latest = response.data?.latestEvent;
        setStatus(response.data);
        if (!latest || latest.id === baseline) continue;

        const eventTime = new Date(latest.occurredAt).getTime();
        const isRecent = Number.isFinite(eventTime) && eventTime >= startedAt - 120000;
        if (latest.status !== 'SYNCED') {
          setError('The device event reached HRMS but was rejected. Check today’s punch status or contact HR.');
          setMessage('Device event received; attendance was not changed.');
          return;
        }
        if (!isRecent) {
          setMessage('An older device event was synchronized. It was not treated as the punch you just requested.');
          return;
        }

        const punchLabel = latest.punchType === 'IN' ? 'Punch In' : 'Punch Out';
        setMessage(`${punchLabel} Successful`);
        window.dispatchEvent(new Event('silent-refresh'));
        return;
      }

      if (!cancelWait.current) {
        setError('No verified device event arrived within two minutes. You may still punch at the physical device; HRMS will record it when the bridge synchronizes. Check bridge connectivity or contact HR.');
        setMessage('Still waiting for the physical device event.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not verify synchronization status. Retry or contact HR.');
      setMessage('The device event has not been confirmed by HRMS.');
    } finally {
      setWaiting(false);
    }
  };

  const nextAction = status?.nextAction;
  const isDone = nextAction === 'DONE';
  const expectedPunch = nextAction === 'OUT' ? 'Punch Out' : 'Punch In';
  const connection = status?.devices?.[0]?.connectionStatus || 'UNKNOWN';

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Biometric Attendance</h2>
          <p className="mt-1 text-sm text-slate-600">
            {status?.employee?.name || 'Your attendance'}
            {status?.employee?.employeeCode ? ` (${status.employee.employeeCode})` : ''}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
            Close
          </button>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {loading ? 'Checking device mapping and attendance…'
            : status?.today?.isCheckedIn && !status?.today?.isCheckedOut
              ? `Checked in at ${status.today.checkIn}.`
              : status?.today?.isCheckedOut
                ? `Today’s shift is complete (out at ${status.today.checkOut}).`
                : 'No check-in recorded for today.'}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Device bridge: <span className="font-semibold">{connection}</span>
          {status?.devices?.[0]?.lastSeenAt
            ? ` — last heartbeat ${new Date(status.devices[0].lastSeenAt).toLocaleString()}`
            : ' — no signed heartbeat received yet'}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
        Clicking below does not start a remote scan. It opens a two-minute confirmation window; fingerprint capture and verification happen on the physical device.
      </div>

      {status && !status.mappingConfigured && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Your device User ID is not mapped to this HRMS employee. Ask HR to register the mapping before punching.
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-800">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => apiFetch('/api/operations/attendance/biometric/status').then(response => setStatus(response.data)).catch(requestError => setError(requestError.message))}
          disabled={loading || waiting}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Refresh status
        </button>
        <button
          type="button"
          onClick={waitForPhysicalPunch}
          disabled={loading || waiting || !status?.mappingConfigured || isDone}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {waiting ? 'Waiting for device…' : isDone ? 'Shift complete' : `Wait for ${expectedPunch}`}
        </button>
      </div>
    </div>
  );
}
