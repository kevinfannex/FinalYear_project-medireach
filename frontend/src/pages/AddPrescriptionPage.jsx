import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const emptyItem = { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function AddPrescriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prePatient = searchParams.get('patient');

  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: prePatient || '', diagnosis: '', notes: '' });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/patients').then(r => setPatients(r.data)).catch(console.error);
  }, []);

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i][field] = val;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patient_id || !form.diagnosis) return setError('Patient and diagnosis are required.');
    const validItems = items.filter(i => i.medicine_name.trim());
    setLoading(true);
    try {
      await api.post('/prescriptions', { ...form, items: validItems });
      navigate('/doctor/prescriptions');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700 text-sm">← Back</button>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-medium">New Prescription</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Prescription</h1>
          <p className="text-slate-500 text-sm mt-1">Create a blockchain-verified prescription record</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Diagnosis */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Patient Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Patient</label>
              <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                <option value="">Choose patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis</label>
              <input type="text" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="e.g. Type 2 Diabetes Mellitus" required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes / Instructions</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes or instructions for the patient..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 resize-none" />
            </div>
          </div>

          {/* Medicines */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Medicines</h2>
              <button type="button" onClick={addItem}
                className="text-sm text-teal-600 hover:text-teal-700 font-semibold border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-colors">
                + Add Medicine
              </button>
            </div>

            {items.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 relative bg-slate-50">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-lg leading-none">×</button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Medicine Name *</label>
                    <input type="text" value={item.medicine_name}
                      onChange={e => updateItem(i, 'medicine_name', e.target.value)}
                      placeholder="e.g. Metformin 500mg"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dosage</label>
                    <input type="text" value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                    <input type="text" value={item.frequency} onChange={e => updateItem(i, 'frequency', e.target.value)}
                      placeholder="e.g. Twice daily"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                    <input type="text" value={item.duration} onChange={e => updateItem(i, 'duration', e.target.value)}
                      placeholder="e.g. 30 days"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Instructions</label>
                    <input type="text" value={item.instructions} onChange={e => updateItem(i, 'instructions', e.target.value)}
                      placeholder="e.g. After meals"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
