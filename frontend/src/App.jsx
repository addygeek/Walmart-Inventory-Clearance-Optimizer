// App.jsx
import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ApiService from './services/api';
import LoadingSpinner from './components/LoadingSpinner';
import CustomToaster from './components/CustomToaster';
import LoginPage from './components/LoginPage';
import ProductPage from './ProductPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 30000,
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        ApiService.setToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.clear();
      }
    }

    checkServerHealth();
    setLoading(false);
  }, []);

  const checkServerHealth = async () => {
    try {
      await ApiService.healthCheck();
      setServerStatus('connected');
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerStatus('disconnected');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', `demo_token_${userData.username}`);
    ApiService.setToken(`demo_token_${userData.username}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
    ApiService.setToken(null);
    queryClient.clear();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Server Status Indicator */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 h-1 ${serverStatus === 'connected'
              ? 'bg-green-500'
              : serverStatus === 'disconnected'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
        />

        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <ProductPage
                  userId={user.username}
                  userRole={user.role}
                  userName={user.name}
                  userPermissions={user.permissions}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <CustomToaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
