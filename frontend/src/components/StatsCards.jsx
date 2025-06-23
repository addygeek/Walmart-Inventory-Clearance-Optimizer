import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package, AlertTriangle, TrendingDown, DollarSign,
  BarChart3
} from 'lucide-react';

const colorClassMap = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  }
};

const StatsCards = ({ products }) => {
  const stats = useMemo(() => {
    const total = products.length;
    const urgent = products.filter(p => (p.days_to_expiry || 0) <= 7).length;
    const discounted = products.filter(p => (p.discount || 0) > 0).length;
    const lowStock = products.filter(p => (p.stock || 0) < 10).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const avgDiscount = discounted > 0 
      ? products.filter(p => (p.discount || 0) > 0).reduce((sum, p) => sum + (p.discount || 0), 0) / discounted 
      : 0;

    return [
      {
        title: 'Total Products',
        value: total.toLocaleString(),
        icon: Package,
        color: 'blue',
        change: '+12%',
        changeType: 'positive'
      },
      {
        title: 'Urgent Items',
        value: urgent.toLocaleString(),
        icon: AlertTriangle,
        color: 'red',
        change: `${total > 0 ? ((urgent / total) * 100).toFixed(1) : 0}%`,
        changeType: 'neutral'
      },
      {
        title: 'Discounted Items',
        value: discounted.toLocaleString(),
        icon: TrendingDown,
        color: 'green',
        change: `${(avgDiscount * 100).toFixed(1)}% avg`,
        changeType: 'positive'
      },
      {
        title: 'Low Stock',
        value: lowStock.toLocaleString(),
        icon: BarChart3,
        color: 'orange',
        change: `${total > 0 ? ((lowStock / total) * 100).toFixed(1) : 0}%`,
        changeType: 'negative'
      },
      {
        title: 'Total Value',
        value: `$${(totalValue / 1000).toFixed(1)}K`,
        icon: DollarSign,
        color: 'purple',
        change: '+8.2%',
        changeType: 'positive'
      }
    ];
  }, [products]);

  return (
    <div className=" border-b  border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => {
            const colorClasses = colorClassMap[stat.color] || {};
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                    <stat.icon className={`h-6 w-6 ${colorClasses.text}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">from last week</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
