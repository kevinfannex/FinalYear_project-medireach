import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const REPORT_TYPES = ['Blood Test','X-Ray','MRI Scan','CT Scan','ECG','Urine Test','Ultrasound','Biopsy','Other'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', report_type: '', description: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    const calls = [api.get('/reports')];
    if (user.role === 'doctor') calls.push(api.get('/patients'));
    Promise.all(calls).then(([r, p]) => {
      setReports(r.data);
      if (p) setPatients(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.role]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file.');
    setError(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patient_id', form.patient_id);
      fd.append('report_type', form.report_type);
      fd.append('description', form.description);
      const res = await api.post('/reports/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReports(prev => [res.data, ...prev]);
      setShowForm(false);
      setForm({ patient_id: '', report_type: '', description: '' });
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    await api.delete(`/reports/${id}`);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Medical Reports</h1>
            <p className="text-slate-500 text-sm mt-1">{reports.length} reports on file</p>
          </div>
          {user.role === 'doctor' && (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {showForm ? 'Cancel' : '+ Upload Report'}
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Upload New Report</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient</label>
                  <select value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Report Type</label>
                  <select value={form.report_type} onChange={e => setForm({...form, report_type: e.target.value})} required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                    <option value="">Select type...</option>
                    {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
                  <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Brief description of findings..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">File (PDF or Image, max 10MB)</label>
                  <div
                    className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
                    onClick={() => fileRef.current.click()}>
                    {file ? (
                      <p className="text-sm text-teal-600 font-medium">✓ {file.name}</p>
                    ) : (
                      <div>
                        <p className="text-3xl mb-2">📁</p>
                        <p className="text-slate-500 text-sm">Click to select file</p>
                        <p className="text-slate-400 text-xs mt-1">PDF, JPG, PNG supported</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => setFile(e.target.files[0])} />
                </div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <button type="submit" disabled={uploading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                {uploading ? 'Uploading...' : 'Upload Report'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-600 font-medium">No reports yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {user.role === 'doctor' ? 'Upload the first report using the button above.' : 'Your doctor will upload reports here.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                    {user.role === 'doctor' ? 'Patient' : 'Doctor'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm shrink-0">📋</div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{r.report_type}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.file_name}</p>
                          <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-700">{user.role === 'doctor' ? r.patient_name : `Dr. ${r.doctor_name}`}</p>
                      {r.description && <p className="text-xs text-slate-400 truncate max-w-[160px]">{r.description}</p>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-slate-400">{r.hash?.substring(0, 16)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a href={r.file_url} target="_blank" rel="noreferrer"
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Open
                        </a>
                        {user.role === 'doctor' && (
                          <button onClick={() => handleDelete(r.id)}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
