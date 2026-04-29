import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Root Layout Wrapper
 * 
 * Komponen ini membungkus semua routes dengan AuthProvider
 * sehingga useAuth() bisa digunakan di mana saja dalam app
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}