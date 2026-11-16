import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { api, unwrap } from '../lib/api';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'request' | 'verify'>('request');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function requestOtp() {
    setError(null);
    try {
      const data = await unwrap(api.POST('/v1/auth/otp/request', { body: { phone } }));
      setDevCode(data.devCode);
      setStage('verify');
    } catch {
      setError('Could not request OTP');
    }
  }

  async function verifyOtp() {
    setError(null);
    try {
      const data = await unwrap(api.POST('/v1/auth/otp/verify', { body: { phone, code } }));
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        navigate({ to: '/' });
      }
    } catch {
      setError('Invalid code');
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-center text-xl font-semibold text-slate-900">Sign in to AnnexEvoice</h1>
      {stage === 'request' && (
        <>
          <label className="mb-2 block text-sm font-medium text-slate-700">Phone (E.164)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+2348012345678"
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={requestOtp}
            className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Send code
          </button>
        </>
      )}
      {stage === 'verify' && (
        <>
          <label className="mb-2 block text-sm font-medium text-slate-700">6-digit code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {devCode && <p className="mb-3 text-xs text-slate-500">Dev code: {devCode}</p>}
          <button
            onClick={verifyOtp}
            className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Verify
          </button>
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
