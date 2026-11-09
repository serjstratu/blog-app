import {AuthProvider} from "./providers/AuthProvider.tsx";
import AppRouter from "./providers/AppRouter.tsx";

function App() {
  return (
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
  );
}

export default App;