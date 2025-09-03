import React, { useState, useEffect } from 'react';
import { Alert, AlertStats } from '../types';
import { alertsAPI } from '../services/api';
import AlertStatsOverview from './AlertStatsOverview';
import AlertList from './AlertList';
import { 
  Shield, 
  AlertTriangle, 
  RefreshCw,
  Bell
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [alertsData, statsData] = await Promise.all([
        alertsAPI.getAlerts({ limit: 100 }),
        alertsAPI.getStats()
      ]);
      
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      setLoading(true);
      await alertsAPI.generateAlerts();
      // Refresh data after generating alerts
      await fetchData();
    } catch (err) {
      console.error('Error generating alerts:', err);
      setError('Failed to generate alerts. Please try again.');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    // Update the alert in the local state immediately for better UX
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: newStatus as any } : alert
      )
    );
    
    // Refresh stats to reflect the change
    try {
      const statsData = await alertsAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Boron Incident Response
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={generateAlerts}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                Generate Alerts
              </button>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-danger-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-danger-800">Error</h3>
                <p className="text-sm text-danger-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && <AlertStatsOverview stats={stats} />}

        {/* Loading State for Initial Load */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg text-gray-600">Loading dashboard...</span>
          </div>
        )}

        {/* Alert List */}
        {(stats || !loading) && (
          <AlertList 
            alerts={alerts} 
            loading={loading && stats !== null} 
            onRefresh={fetchData}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Security Incident Response Dashboard
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-danger-500' : 'bg-success-500'}`} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
