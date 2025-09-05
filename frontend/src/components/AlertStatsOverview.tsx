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
          {/* Simple Activity Table - Replace with proper chart when Recharts compatibility is resolved */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 border-b pb-2">
              <div>Time</div>
              <div>Total</div>
              <div>Critical</div>
              <div>High</div>
              <div>Medium</div>
              <div>Low</div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {stats.recent_activity.slice(0, 8).map((activity, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-gray-100">
                  <div className="text-gray-600">
                    {new Date(activity.time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="font-medium text-blue-600">{activity.total}</div>
                  <div className="font-medium text-red-600">{activity.critical}</div>
                  <div className="font-medium text-orange-600">{activity.high}</div>
                  <div className="font-medium text-yellow-600">{activity.medium}</div>
                  <div className="font-medium text-green-600">{activity.low}</div>
                </div>
              ))}
            </div>
            {stats.recent_activity.length > 8 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  Showing latest 8 entries of {stats.recent_activity.length} total
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertStatsOverview;
