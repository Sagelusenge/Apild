import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { UiProvider } from './context/UiContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <UiProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </UiProvider>
  );
}
