import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const users = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: '🛡️ Admin User',
      permissions: ['view', 'edit', 'delete', 'analytics', 'bulk_operations']
    },
    {
      username: 'manager',
      password: 'manager123',
      role: 'manager',
      name: '🛒 Store Manager',
      permissions: ['view', 'edit', 'analytics', 'mark_sold']
    },
    {
      username: 'staff',
      password: 'staff123',
      role: 'staff',
      name: '👷 Staff Member',
      permissions: ['view', 'add_to_cart', 'view_details']
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', `fake_token_${user.username}`);
      onLogin(user);
    } else {
      setError('Invalid username or password');
    }

    setLoading(false);
  };

  const handleQuickLogin = (user) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div className="login-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="login-card"
      >
        {/* Header */}
        <div className="login-header">
          <div className="login-header-icon">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1>🛡️ Walmart Clearance Optimizer</h1>
          <p>Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="error-msg"
            >
              {error}
            </motion.div>
          )}

          <div className="input-icon-wrapper">
            <User className="input-icon h-5 w-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder=" Enter your username"
              required
            />
          </div>

          <div className="input-icon-wrapper">
            <Lock className="input-icon h-5 w-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              '🔐 Sign In'
            )}
          </motion.button>
        </form>

        {/* Quick Login */}
        <div className="quick-login">
          <p>
            <span style={{ borderBottom: '1px solid #ddd', flex: 1 }}></span>
            &nbsp;🎭 Quick login for demo&nbsp;
            <span style={{ borderBottom: '1px solid #ddd', flex: 1 }}></span>
          </p>
          <div className="quick-btn-grid">
            {users.map((user) => (
              <button
                key={user.username}
                onClick={() => handleQuickLogin(user)}
                className="quick-btn"
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-gray-500 capitalize">{user.role}</div>
              </button>
            ))}
          </div>
        </div>

        
      </motion.div>
    </div>
  );
};

export default LoginPage;
