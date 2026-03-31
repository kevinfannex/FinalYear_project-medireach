import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function SharedPrescriptionPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/prescriptions/shared/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError('Prescription not found or this link is invalid.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-slate-700 font-semibold text-lg">{error}</p>
        <p className="text-slate-400 text-sm mt-2">Check the URL and try again.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-2xl mb-3 shadow-lg shadow-teal-600/30">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">MedChain</h1>
          <p className="text-slate-500 text-sm">Blockchain-Verified Prescription</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Verified badge */}
          <div className="bg-green-500 px-6 py-3 flex items-center gap-2">
            <span className="text-white text-sm font-semibold">✅ Blockchain Verified — Record is authentic and unaltered</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Doctor & Date */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{data.diagnosis}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Prescribed by <strong className="text-slate-700">Dr. {data.doctor_name}</strong>
                  {data.specialization && <span className="text-slate-400"> · {data.specialization}</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Patient info */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Patient</p>
              <p className="text-base font-semibold text-slate-800">{data.patient_name}</p>
            </div>

            {/* Notes */}
            {data.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Clinical Notes</p>
                <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">{data.notes}</p>
              </div>
            )}

            {/* Medicines */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Prescribed Medicines ({data.items?.length || 0})
              </p>
              <div className="space-y-2">
                {data.items?.length > 0 ? data.items.map((item, i) => (
                  <div key={i} className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <span className="font-semibold text-sm text-slate-900">{item.medicine_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 ml-7">
                      {item.dosage && <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.dosage}</span>}
                      {item.frequency && <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.frequency}</span>}
                      {item.duration && <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{item.duration}</span>}
                      {item.instructions && <span className="text-xs text-slate-400 italic">{item.instructions}</span>}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No medicines listed.</p>
                )}
              </div>
            </div>

            {/* Hash */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Integrity Hash (SHA-256)</p>
              <div className="bg-slate-900 rounded-xl px-4 py-3">
                <p className="text-xs font-mono text-teal-400 break-all">{data.hash}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          This prescription was securely shared via MedChain · Blockchain Medical System
        </p>
      </div>
    </div>
  );
}
