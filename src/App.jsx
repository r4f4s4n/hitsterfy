import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Config from './pages/Config';
import PlaylistInput from './pages/PlaylistInput';
import Player from './pages/Player';
import PremiumInfo from './pages/PremiumInfo';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirigir a login pero guardar la ruta original a la que quería acceder
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

function App() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Para debugging
  useEffect(() => {
    console.log("App renderizando, auth state:", { isAuthenticated, loading, currentPath: location.pathname });
  }, [isAuthenticated, loading, location]);

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={location.state?.from || "/playlist"} replace />
          ) : (
            <Login />
          )
        } 
      />
      
      {/* Rutas protegidas */}
      <Route 
        path="/config" 
        element={
          <ProtectedRoute>
            <Config />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/playlist" 
        element={
          <ProtectedRoute>
            <PlaylistInput />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/player" 
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } 
      />

<Route 
        path="/player" 
        element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/premium-info" 
        element={
          <ProtectedRoute>
            <PremiumInfo />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirecciones */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/playlist" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;