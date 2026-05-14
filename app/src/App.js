import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import LoadingIndicator from './LoadingIndicator';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingIndicator />;
  }

  return user ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
