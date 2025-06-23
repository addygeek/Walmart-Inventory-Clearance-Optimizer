import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut } from 'lucide-react';

const Header = ({ userName, userRole, onLogout }) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 px-6 py-3  border-b border-gray-200 shadow-sm">
      {/* User Info */}
      <div className="flex items-center gap-2 text-sm text-gray-700 truncate max-w-xs">
        <User className="h-4 w-4 text-gray-500" />
        <span className="font-medium truncate">{userName} ({userRole})</span>
      </div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-red-500 hover:text-white transition-all duration-200"
      >
        <LogOut className="h-4 w-4 " />
        <span>Logout</span>
      </motion.button>
    </div>
  );
};

export default Header;
