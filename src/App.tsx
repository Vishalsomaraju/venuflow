import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { VenueMap } from './pages/VenueMap';
import { Assistant } from './pages/Assistant';
import { Admin } from './pages/Admin';
import { AuthProvider } from './components/providers/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<VenueMap />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
