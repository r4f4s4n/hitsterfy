import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (isRegistering) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Si el registro fue exitoso o el inicio de sesión fue exitoso
      if (result.data?.user || result.data?.session) {
        navigate('/config');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-spotify-green mb-2">Hitsterfy</h1>
          <p className="text-gray-300">Adivina la canción, demuestra cuánto sabes de música</p>
        </div>

        <div className="bg-spotify-black bg-opacity-50 p-8 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mb-4"
            >
              {loading
                ? 'Cargando...'
                : isRegistering
                ? 'Registrarse'
                : 'Iniciar sesión'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-spotify-green hover:underline"
            >
              {isRegistering
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;