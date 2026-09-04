import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DriverDashboard from './pages/driver/DriverDashboard';
import FieldOfficerDashboard from './pages/field-officer/FieldOfficerDashboard';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/map/MapPage';
import VehiclesPage from './pages/vehicles/Vehicles';
import IncidentsPage from './pages/incidents/Incidents';
import RoutesPage from './pages/routes/Routes';
import AnalyticsPage from './pages/analytics/Analytics';
import DeliveriesPage from './pages/deliveries/Deliveries';
import PredictionsPage from './pages/predictions/Predictions';
import AlertsPage from './pages/alerts/Alerts';
import EmergencyPage from './pages/emergency/Emergency';
import AdministrationPage from './pages/admin/Administration';
import AiAnalysisPage from './pages/analytics/AiAnalysisPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Driver Routes */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={['DRIVER']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />

        {/* Field Officer Routes */}
        <Route path="/field-officer" element={
          <ProtectedRoute allowedRoles={['FIELD_OFFICER']}>
            <FieldOfficerDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<MapPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="predictions" element={<PredictionsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ai-analysis" element={<AiAnalysisPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="administration" element={<AdministrationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
