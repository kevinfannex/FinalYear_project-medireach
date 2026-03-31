import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientsListPage from './pages/PatientsListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import AddPrescriptionPage from './pages/AddPrescriptionPage';
import ReportsPage from './pages/ReportsPage';
import VerificationPage from './pages/VerificationPage';
import SharedPrescriptionPage from './pages/SharedPrescriptionPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shared/prescription/:token" element={<SharedPrescriptionPage />} />

          <Route path="/doctor" element={
            <ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/doctor/patients" element={
            <ProtectedRoute roles={['doctor']}><PatientsListPage /></ProtectedRoute>
          } />
          <Route path="/doctor/patients/:id" element={
            <ProtectedRoute roles={['doctor']}><PatientDetailPage /></ProtectedRoute>
          } />
          <Route path="/doctor/prescriptions" element={
            <ProtectedRoute roles={['doctor']}><PrescriptionsPage /></ProtectedRoute>
          } />
          <Route path="/doctor/prescriptions/new" element={
            <ProtectedRoute roles={['doctor']}><AddPrescriptionPage /></ProtectedRoute>
          } />
          <Route path="/doctor/reports" element={
            <ProtectedRoute roles={['doctor']}><ReportsPage /></ProtectedRoute>
          } />
          <Route path="/doctor/verify" element={
            <ProtectedRoute roles={['doctor']}><VerificationPage /></ProtectedRoute>
          } />

          <Route path="/patient" element={
            <ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/patient/prescriptions" element={
            <ProtectedRoute roles={['patient']}><PrescriptionsPage /></ProtectedRoute>
          } />
          <Route path="/patient/reports" element={
            <ProtectedRoute roles={['patient']}><ReportsPage /></ProtectedRoute>
          } />
          <Route path="/patient/verify" element={
            <ProtectedRoute roles={['patient']}><VerificationPage /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
