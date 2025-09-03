import React from 'react';
import { AlertStats } from '../types';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  CheckCircle, 
  Clock,
  X 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, change }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
    {change && (
      <div className="mt-4">
        <span className="text-sm text-gray-600">{change}</span>
      </div>
    )}
  </div>
);

interface AlertStatsOverviewProps {
  stats: AlertStats;
}

const AlertStatsOverview: React.FC<AlertStatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Alerts */}
      <StatsCard
        title="Total Alerts"
        value={stats.total_alerts}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="text-blue-600"
      />

      {/* Critical Alerts */}
      <StatsCard
        title="Critical Alerts"
        value={stats.by_severity.critical}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="text-danger-600"
      />

      {/* High Priority */}
      <StatsCard
        title="High Priority"
        value={stats.by_severity.high}
        icon={<Shield className="w-6 h-6" />}
        color="text-warning-600"
      />

      {/* Open Alerts */}
      <StatsCard
        title="Open Alerts"
        value={stats.by_status.open}
        icon={<Clock className="w-6 h-6" />}
        color="text-yellow-600"
      />

      {/* Severity Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Severity Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Critical</span>
            <span className="text-sm font-medium text-danger-600">{stats.by_severity.critical}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">High</span>
            <span className="text-sm font-medium text-warning-600">{stats.by_severity.high}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Medium</span>
            <span className="text-sm font-medium text-yellow-600">{stats.by_severity.medium}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Low</span>
            <span className="text-sm font-medium text-blue-600">{stats.by_severity.low}</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-danger-600" />
              <span className="text-sm text-gray-600">Open</span>
            </div>
            <span className="text-sm font-medium text-danger-600">{stats.by_status.open}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-warning-600" />
              <span className="text-sm text-gray-600">Investigating</span>
            </div>
            <span className="text-sm font-medium text-warning-600">{stats.by_status.investigating}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-success-600" />
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
            <span className="text-sm font-medium text-success-600">{stats.by_status.resolved}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <X className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">False Positive</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{stats.by_status.false_positive}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">24h Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.recent_activity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              
              {/* Total alerts line */}
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Alerts"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              
              {/* Critical alerts line */}
              <Line 
                type="monotone" 
                dataKey="critical" 
                stroke="#dc2626" 
                strokeWidth={2}
                name="Critical"
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#dc2626', strokeWidth: 2 }}
              />
              
              {/* High alerts line */}
              <Line 
                type="monotone" 
                dataKey="high" 
                stroke="#d97706" 
                strokeWidth={2}
                name="High"
                dot={{ fill: '#d97706', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#d97706', strokeWidth: 2 }}
              />
              
              {/* Medium alerts line */}
              <Line 
                type="monotone" 
                dataKey="medium" 
                stroke="#eab308" 
                strokeWidth={2}
                name="Medium"
                dot={{ fill: '#eab308', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#eab308', strokeWidth: 2 }}
              />
              
              {/* Low alerts line */}
              <Line 
                type="monotone" 
                dataKey="low" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Low"
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AlertStatsOverview;
