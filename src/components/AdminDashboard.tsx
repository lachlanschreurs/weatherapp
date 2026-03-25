import { useState, useEffect } from 'react';
import { Shield, Users, Database, Activity, UserCog } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface ProbeAPI {
  id: string;
  user_id: string;
  api_name: string;
  created_at: string;
  user_email?: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [probeAPIs, setProbeAPIs] = useState<ProbeAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    totalProbes: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (usersData) {
        const userEmails = await Promise.all(
          usersData.map(async (user) => {
            const { data } = await supabase.auth.admin.getUserById(user.user_id);
            return {
              id: user.user_id,
              email: data.user?.email || 'Unknown',
              role: user.role,
              created_at: user.created_at,
            };
          })
        );
        setUsers(userEmails);

        setStats({
          totalUsers: userEmails.length,
          adminUsers: userEmails.filter(u => u.role === 'admin').length,
          totalProbes: 0,
        });
      }

      const { data: probesData } = await supabase
        .from('probe_apis')
        .select('*')
        .order('created_at', { ascending: false });

      if (probesData) {
        const probesWithEmail = await Promise.all(
          probesData.map(async (probe) => {
            const { data } = await supabase.auth.admin.getUserById(probe.user_id);
            return {
              ...probe,
              user_email: data.user?.email || 'Unknown',
            };
          })
        );
        setProbeAPIs(probesWithEmail);
        setStats(prev => ({ ...prev, totalProbes: probesWithEmail.length }));
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (!error) {
      loadAdminData();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center">
          <Activity className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-green-700" />
        <h2 className="text-3xl font-bold text-green-900">Admin Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Admin Users</p>
              <p className="text-3xl font-bold text-blue-900">{stats.adminUsers}</p>
            </div>
            <Shield className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Probes</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalProbes}</p>
            </div>
            <Database className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-green-700" />
            User Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserRole(user.id, user.role)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-green-700" />
            Probe APIs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">API Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {probeAPIs.length > 0 ? (
                  probeAPIs.map((probe) => (
                    <tr key={probe.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{probe.api_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{probe.user_email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(probe.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No probe APIs configured yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
