import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ตอนพัฒนา: เรียก /api จากหน้าเว็บ แล้ว Vite ส่งต่อไป backend (ไม่ติด CORS)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});