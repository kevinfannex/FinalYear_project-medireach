import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('prescriptions');

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/prescriptions/patient/${id}`),
      api.get(`/reports/patient/${id}`),
    ]).then(([p, pr, r]) => {
      setPatient(p.data);
      setPrescriptions(pr.data);
      setReports(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout><div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div></Layout>
  );
  if (!patient) return <Layout><div className="text-center py-16 text-slate-500">Patient not found.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/doctor/patients" className="text-slate-400 hover:text-slate-700 text-sm">← Patients</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-medium">{patient.name}</span>
        </div>

        {/* Patient card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold">
              {patient.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
              <p className="text-slate-500 text-sm">{patient.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {patient.age && <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">Age: {patient.age}</span>}
                {patient.gender && <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{patient.gender}</span>}
                {patient.blood_group && <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">Blood: {patient.blood_group}</span>}
                {patient.phone && <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">📞 {patient.phone}</span>}
              </div>
            </div>
            <Link to={`/doctor/prescriptions/new?patient=${id}`}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              + Prescription
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {['prescriptions', 'reports'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t} {t === 'prescriptions' ? `(${prescriptions.length})` : `(${reports.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'prescriptions' && (
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <p className="text-slate-400">No prescriptions yet.</p>
              </div>
            ) : prescriptions.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.diagnosis}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">#{p.id}</span>
                </div>
                {p.notes && <p className="text-sm text-slate-600 mt-2">{p.notes}</p>}
                {p.items?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {p.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        <span className="font-medium text-slate-700">{item.medicine_name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{item.dosage}</span>
                        {item.duration && <><span className="text-slate-400">·</span><span className="text-slate-500">{item.duration}</span></>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-mono text-slate-400 break-all">Hash: {p.hash?.substring(0, 32)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                <p className="text-slate-400">No reports yet.</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-lg shrink-0">📋</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{r.report_type}</p>
                  <p className="text-xs text-slate-400">{r.file_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                  {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
                </div>
                <a href={r.file_url} target="_blank" rel="noreferrer"
                  className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
