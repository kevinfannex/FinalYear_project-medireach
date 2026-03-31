import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ShareModal = ({ prescription, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post(`/prescriptions/${prescription.id}/share`)
      .then(r => setShareUrl(r.data.share_url))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [prescription.id]);

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-slate-900 mb-1">Share Prescription</h3>
        <p className="text-sm text-slate-500 mb-4">Share this link with another doctor</p>
        {loading ? (
          <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="flex gap-2">
            <input readOnly value={shareUrl} className="flex-1 text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono" />
            <button onClick={copy} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors">Close</button>
      </div>
    </div>
  );
};

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareTarget, setShareTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/prescriptions').then(r => setPrescriptions(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this prescription?')) return;
    await api.delete(`/prescriptions/${id}`);
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const filtered = prescriptions.filter(p =>
    p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
            <p className="text-slate-500 text-sm mt-1">{prescriptions.length} total records</p>
          </div>
          {user.role === 'doctor' && (
            <Link to="/doctor/prescriptions/new"
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              + New
            </Link>
          )}
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" placeholder="Search by diagnosis, patient, or doctor..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <p className="text-4xl mb-3">💊</p>
            <p className="text-slate-600 font-medium">No prescriptions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{p.diagnosis}</h3>
                        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{p.items?.length || 0} medicines</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {user.role === 'doctor' ? `Patient: ${p.patient_name}` : `Dr. ${p.doctor_name}`}
                        {p.specialization && ` · ${p.specialization}`}
                        {' · '}{new Date(p.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user.role === 'patient' && (
                        <button onClick={(e) => { e.stopPropagation(); setShareTarget(p); }}
                          className="text-xs bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Share
                        </button>
                      )}
                      {user.role === 'doctor' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Delete
                        </button>
                      )}
                      <span className="text-slate-400 text-sm">{expanded === p.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>

                {expanded === p.id && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                    {p.notes && (
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{p.notes}</p>
                      </div>
                    )}
                    {p.items?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Medicines</p>
                        <div className="space-y-2">
                          {p.items.map((item, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-teal-50 rounded-xl px-4 py-2.5">
                              <span className="font-semibold text-sm text-slate-800">{item.medicine_name}</span>
                              {item.dosage && <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{item.dosage}</span>}
                              {item.frequency && <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{item.frequency}</span>}
                              {item.duration && <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{item.duration}</span>}
                              {item.instructions && <span className="text-xs text-slate-400 italic">{item.instructions}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 font-mono break-all">🔐 Hash: {p.hash}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {shareTarget && <ShareModal prescription={shareTarget} onClose={() => setShareTarget(null)} />}
    </Layout>
  );
}
