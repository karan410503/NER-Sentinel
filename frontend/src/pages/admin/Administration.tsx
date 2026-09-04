import { useEffect, useState } from 'react';
import { Users, Shield, Server, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../store';
import { adminApi } from '../../services/adminApi';
import type { User } from '../../services/adminApi';

const ROLES = ['ADMIN', 'GOVERNMENT', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'EMERGENCY_RESPONSE'];

export default function Administration() {
  const { emergencyMode } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await adminApi.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role");
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const cardStyle = `p-6 rounded-2xl border backdrop-blur-md transition-colors duration-500 ${
    emergencyMode ? 'bg-red-950/20 border-red-500/30' : 'bg-white/5 border-white/10'
  }`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Shield className={`w-6 h-6 mr-3 ${emergencyMode ? 'text-red-500' : 'text-ner-primary'}`} />
            Administration & System Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage users, access control, and view system health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">System Status</h3>
            <Server className={`w-5 h-5 ${emergencyMode ? 'text-red-400' : 'text-ner-primary'}`} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">FastAPI Backend</span>
              <span className="text-sm font-medium text-green-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Database (SQLite)</span>
              <span className="text-sm font-medium text-green-400">Connected</span>
            </div>
          </div>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">ML Models</h3>
            <Activity className={`w-5 h-5 ${emergencyMode ? 'text-red-400' : 'text-purple-400'}`} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">ETA Prediction Model</span>
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">v1.2 Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Disruption Predictor</span>
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">v2.0 Active</span>
            </div>
          </div>
        </div>

        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Total Users</h3>
            <Users className={`w-5 h-5 ${emergencyMode ? 'text-red-400' : 'text-blue-400'}`} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-white">{users.length}</span>
            <span className="text-sm text-gray-400">Registered</span>
          </div>
        </div>
      </div>

      <div className={cardStyle}>
        <h3 className="text-xl font-semibold text-white mb-6">User Management</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${emergencyMode ? 'border-red-500' : 'border-ner-primary'}`}></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400">Email</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400">Role</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          emergencyMode ? 'bg-red-500/20 text-red-400' : 'bg-ner-primary/20 text-ner-primary'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">{user.email}</td>
                    <td className="py-4 px-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`bg-black/50 border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 ${
                          emergencyMode ? 'border-red-500/30 focus:ring-red-500 text-red-200' : 'border-white/20 focus:ring-ner-primary text-gray-300'
                        }`}
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          <XCircle className="w-3 h-3 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                          user.is_active 
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
