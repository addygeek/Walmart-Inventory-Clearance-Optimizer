// components/StatsCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Package, AlertTriangle, TrendingDown, DollarSign,
  Clock, ShoppingCart, Users, BarChart3
} from 'lucide-react';

const StatsCards = ({ products }) => {
  const stats = React.useMemo(() => {
    const total = products.length;
    const urgent = products.filter(p => p.days_to_expiry <= 7).length;
    const discounted = products.filter(p => p.discount > 0).length;
    const lowStock = products.filter(p => p.stock < 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const avgDiscount = discounted > 0 
      ? products.filter(p => p.discount > 0).reduce((sum, p) => sum + p.discount, 0) / discounted 
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
        change: `${((urgent / total) * 100).toFixed(1)}%`,
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
        change: `${((lowStock / total) * 100).toFixed(1)}%`,
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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
