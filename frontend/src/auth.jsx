import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from './api.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'mtp-session';
const DEFAULT_TENANT = 'brand-a';

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.tenant) {
      return { tenant: saved.tenant, token: saved.token || null, user: saved.user || null };
    }
  } catch {
    /* ignore */
  }
  return { tenant: DEFAULT_TENANT, token: null, user: null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, [session]);

  // token ผูกกับแบรนด์เดียว: เปลี่ยนแบรนด์ = ออกจากระบบ
  const selectTenant = useCallback((slug) => {
    setSession((prev) => (prev.tenant === slug ? prev : { tenant: slug, token: null, user: null }));
  }, []);

  const logout = useCallback(() => {
    setSession((prev) => ({ ...prev, token: null, user: null }));
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
        tenant: session.tenant,
      });
      setSession((prev) => ({ ...prev, token: data.token, user: data.user }));
      return data.user;
    },
    [session.tenant]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await request('/auth/register', {
        method: 'POST',
        body: { name, email, password },
        tenant: session.tenant,
      });
      setSession((prev) => ({ ...prev, token: data.token, user: data.user }));
      return data.user;
    },
    [session.tenant]
  );

  // เรียก API พร้อม token; ถ้า token หมดอายุ/ไม่ถูกต้อง (401) ให้ออกจากระบบ
  // noTenant = true ใช้สำหรับ super_admin calls ที่ไม่ต้องการ X-Tenant-ID
  const call = useCallback(
    (path, options = {}) => {
      const { noTenant, ...rest } = options;
      return request(path, {
        ...rest,
        tenant: noTenant ? undefined : session.tenant,
        token: session.token,
        noTenant,
      }).catch((err) => {
        if (err.status === 401 && session.token) logout();
        throw err;
      });
    },
    [session.tenant, session.token, logout]
  );

  const value = useMemo(
    () => ({ ...session, selectTenant, login, register, logout, call }),
    [session, selectTenant, login, register, logout, call]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}