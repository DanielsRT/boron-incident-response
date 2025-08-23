import React from 'react';
import { Alert } from '../types';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  User, 
  MapPin,
  Eye,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger-50 border-danger-200 text-danger-900';
      case 'high':
        return 'bg-warning-50 border-warning-200 text-warning-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'medium':
        return <Shield className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-danger-600" />;
      case 'investigating':
        return <Eye className="w-4 h-4 text-warning-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'false_positive':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-danger-100 text-danger-800';
      case 'investigating':
        return 'bg-warning-100 text-warning-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      case 'false_positive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getSeverityColor(alert.severity)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSeverityIcon(alert.severity)}
          <h3 className="text-lg font-semibold">{alert.title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(alert.status)}
              <span className="capitalize">{alert.status.replace('_', ' ')}</span>
            </div>
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
            ${alert.severity === 'critical' ? 'bg-danger-600 text-white' :
              alert.severity === 'high' ? 'bg-warning-600 text-white' :
              alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
              'bg-blue-600 text-white'}`}>
            {alert.severity}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm mb-3">{alert.description}</p>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Time:</span>
          <span>{format(new Date(alert.timestamp), 'MMM dd, HH:mm')}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Events:</span>
          <span>{alert.event_count}</span>
        </div>

        {alert.affected_users.length > 0 && (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="font-medium">Users:</span>
            <span className="truncate">{alert.affected_users.slice(0, 2).join(', ')}</span>
            {alert.affected_users.length > 2 && (
              <span className="text-xs">+{alert.affected_users.length - 2} more</span>
            )}
          </div>
        )}

        {alert.source_ips.length > 0 && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">IPs:</span>
            <span className="truncate">{alert.source_ips.slice(0, 2).join(', ')}</span>
            {alert.source_ips.length > 2 && (
              <span className="text-xs">+{alert.source_ips.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Source */}
      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
        <span className="text-xs font-medium">Source: {alert.source}</span>
      </div>
    </div>
  );
};

export default AlertCard;
