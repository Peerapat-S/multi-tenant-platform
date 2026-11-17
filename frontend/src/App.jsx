import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Storefront from './pages/Storefront.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import Orders from './pages/Orders.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';

// แต่ละแบรนด์ได้สีธีมต่างกัน (คำนวณจาก slug) เพื่อให้เห็นชัดว่าเปลี่ยนแบรนด์แล้ว
function hueOf(slug) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function RequireSuperAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'super_admin') {
    return <div className="notice" style={{ margin: '2rem auto', maxWidth: '480px' }}>หน้านี้สำหรับ Super Admin เท่านั้น</div>;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <div className="notice">หน้านี้สำหรับผู้ดูแล (admin) เท่านั้น</div>;
  }
  return children;
}

function RequireLogin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  const { tenant } = useAuth();

  useEffect(() => {
    document.documentElement.style.setProperty('--hue', hueOf(tenant));
  }, [tenant]);

  // key={tenant} ทำให้หน้าโหลดใหม่ทั้งหมดเมื่อสลับแบรนด์
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Storefront key={tenant} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminProducts key={tenant} />
              </RequireAdmin>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireLogin>
                <Orders key={tenant} />
              </RequireLogin>
            }
          />
          <Route
            path="/super-admin"
            element={
              <RequireSuperAdmin>
                <SuperAdminDashboard />
              </RequireSuperAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}
