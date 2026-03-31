import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function VerificationPage() {
  const [type, setType] = useState('prescription');
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!id) return setError('Please enter a record ID.');
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await api.get(`/verify/${type}/${id}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Record not found or verification failed.');
    } finally { setLoading(false); }
  };

  const isVerified = result?.status === 'VERIFIED';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blockchain Verification</h1>
          <p className="text-slate-500 text-sm mt-1">Verify the integrity of prescriptions and reports using SHA-256 hashing</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['prescription', 'report'].map(t => (
              <button key={t} onClick={() => { setType(t); setResult(null); setError(''); setId(''); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${
                  type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {t === 'prescription' ? '💊 Prescription' : '📋 Report'}
              </button>
            ))}
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {type === 'prescription' ? 'Prescription' : 'Report'} ID
              </label>
              <div className="flex gap-3">
                <input
                  type="number" value={id} onChange={e => setId(e.target.value)}
                  placeholder={`Enter ${type} ID (e.g. 1, 2, 3...)`} min="1"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                />
                <button type="submit" disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
                  {loading ? 'Checking...' : '🔐 Verify'}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          </form>
        </div>

        {result && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden`}>
            {/* Status Banner */}
            <div className={`px-6 py-5 flex items-center gap-4 ${isVerified ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
                {isVerified ? '✅' : '⚠️'}
              </div>
              <div>
                <p className="text-xl font-bold">{result.status}</p>
                <p className="text-sm opacity-90">{result.message}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stored Hash (SHA-256)</p>
                <div className="bg-slate-900 rounded-xl px-4 py-3">
                  <p className="text-xs font-mono text-teal-400 break-all">{result.stored_hash}</p>
                </div>
              </div>

              {result.computed_hash && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Computed Hash {result.computed_hash === result.stored_hash ? '(Matches ✓)' : '(Mismatch ✗)'}
                  </p>
                  <div className={`rounded-xl px-4 py-3 ${result.computed_hash === result.stored_hash ? 'bg-green-900' : 'bg-red-900'}`}>
                    <p className="text-xs font-mono text-green-400 break-all">{result.computed_hash}</p>
                  </div>
                </div>
              )}

              {result.details && Object.keys(result.details).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Record Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(result.details).map(([k, v]) => v && (
                      <div key={k} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 capitalize mb-0.5">{k.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                Verified on {new Date(result.timestamp).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-base mb-4 text-teal-400">How Blockchain Verification Works</h3>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Hash Generation', desc: 'When a record is created, a SHA-256 hash of its full content is computed' },
              { step: '02', title: 'Hash Storage', desc: 'The hash is stored in the database alongside the record as its fingerprint' },
              { step: '03', title: 'Verification', desc: 'On demand, the current data or file is re-hashed and compared to the stored value' },
              { step: '04', title: 'Result', desc: 'Matching hashes = VERIFIED (data is intact). Different hashes = TAMPERED (data was altered)' },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <span className="text-teal-500 font-mono text-xs font-bold mt-0.5 shrink-0">{item.step}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
