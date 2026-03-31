import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, sub, color }) => (
  <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm`}>
    <p className="text-sm text-slate-500 font-medium">{label}</p>
    <p className={`text-4xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
  </div>
);

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Good morning, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here's your practice overview for today.</p>
          </div>
          <Link to="/doctor/prescriptions/new"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            + New Prescription
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Patients" value={stats?.stats?.patients ?? 0} color="text-teal-600" sub="Assigned to you" />
          <StatCard label="Prescriptions" value={stats?.stats?.prescriptions ?? 0} color="text-violet-600" sub="Written so far" />
          <StatCard label="Reports Uploaded" value={stats?.stats?.reports ?? 0} color="text-amber-500" sub="Medical files" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Prescriptions — Last 6 months</h2>
            {stats?.monthlyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.monthlyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Prescriptions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Recent Prescriptions</h2>
              <Link to="/doctor/prescriptions" className="text-xs text-teal-600 hover:underline">View all</Link>
            </div>
            {stats?.recentPrescriptions?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPrescriptions.map(p => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold shrink-0">
                      {p.patient_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.patient_name}</p>
                      <p className="text-xs text-slate-500 truncate">{p.diagnosis}</p>
                      <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No prescriptions yet.</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/doctor/patients', label: 'View Patients', emoji: '👥' },
            { to: '/doctor/prescriptions/new', label: 'Add Prescription', emoji: '✍️' },
            { to: '/doctor/reports', label: 'Upload Report', emoji: '📋' },
            { to: '/doctor/verify', label: 'Verify Record', emoji: '🔐' },
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
