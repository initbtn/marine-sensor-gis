import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarineAppShell } from './components/Layout/MarineAppShell';
import { SensorDashboard } from './components/Dashboard/SensorDashboard';
import { FullGisPage } from './components/Pages/FullGisPage';
import { ComplianceReportPage } from './components/Pages/ComplianceReportPage';
import { AlarmAuditPage } from './components/Pages/AlarmAuditPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarineAppShell />}>
          <Route path="/" element={<SensorDashboard />} />
          <Route path="/gis" element={<FullGisPage />} />
          <Route path="/reports" element={<ComplianceReportPage />} />
          <Route path="/alarms" element={<AlarmAuditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
