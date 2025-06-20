import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './components/LoginPage';
import ProductPage from './ProductPage';
import LoadingSpinner from './components/LoadingSpinner';
import ApiService from './services/api';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        ApiService.setToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }

    // Check server health
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
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    ApiService.setToken(null);
    queryClient.clear(); // Clear all cached data
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {/* Server Status Indicator */}
        <div className={`fixed top-0 left-0 right-0 z-50 h-1 ${
          serverStatus === 'connected' ? 'bg-green-500' : 
          serverStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
        }`} />

        {!user ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <ProductPage 
            userId={user.username} 
            userRole={user.role}
            userName={user.name}
            userPermissions={user.permissions}
            onLogout={handleLogout}
          />
        )}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;
