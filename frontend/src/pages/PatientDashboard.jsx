import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/patients/me'),
      api.get('/prescriptions'),
      api.get('/reports'),
    ]).then(([p, pr, r]) => {
      setProfile(p.data);
      setPrescriptions(pr.data.slice(0, 3));
      setReports(r.data.slice(0, 3));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {profile?.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile?.name}</h1>
              <p className="text-teal-100 text-sm">{profile?.email}</p>
              <div className="flex gap-3 mt-2">
                {profile?.age && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Age: {profile.age}</span>}
                {profile?.gender && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{profile.gender}</span>}
                {profile?.blood_group && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Blood: {profile.blood_group}</span>}
              </div>
            </div>
          </div>
          {profile?.doctor_name && (
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
              <span className="text-teal-200 text-sm">Attending Doctor:</span>
              <span className="text-white text-sm font-semibold">{profile.doctor_name}</span>
              {profile.specialization && <span className="text-teal-200 text-xs">· {profile.specialization}</span>}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-violet-600">{prescriptions.length}+</p>
            <p className="text-sm text-slate-500 mt-1">Prescriptions</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-amber-500">{reports.length}+</p>
            <p className="text-sm text-slate-500 mt-1">Medical Reports</p>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Prescriptions</h2>
            <Link to="/patient/prescriptions" className="text-xs text-teal-600 hover:underline">View all</Link>
          </div>
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No prescriptions yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {prescriptions.map(p => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.diagnosis}</p>
                    <p className="text-xs text-slate-500">Dr. {p.doctor_name} · {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">
                      {p.items?.length || 0} meds
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Reports</h2>
            <Link to="/patient/reports" className="text-xs text-teal-600 hover:underline">View all</Link>
          </div>
          {reports.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No reports uploaded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.report_type}</p>
                    <p className="text-xs text-slate-500">Dr. {r.doctor_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <a href={r.file_url} target="_blank" rel="noreferrer"
                    className="text-xs text-teal-600 hover:underline font-medium">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/patient/prescriptions', label: 'My Prescriptions', emoji: '💊' },
            { to: '/patient/reports', label: 'My Reports', emoji: '📄' },
            { to: '/patient/verify', label: 'Verify Record', emoji: '🔐' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="bg-white border border-slate-100 rounded-xl p-4 text-center hover:border-teal-200 hover:bg-teal-50 transition-colors group">
              <div className="text-2xl mb-2">{a.emoji}</div>
              <p className="text-xs font-semibold text-slate-700 group-hover:text-teal-700">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
