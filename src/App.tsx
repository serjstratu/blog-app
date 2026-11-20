import {AuthProvider} from "./providers/AuthProvider.tsx";
import AppRouter from "./providers/AppRouter.tsx";
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </AuthProvider>
  );
}

export default App;
