import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, X } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openConfirmModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    
    const user = selectedUser;
    const isBanning = user.status === 'Active';
    const endpoint = isBanning ? `/ban` : `/unban`;

    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:3000/api/admin/users/${user.id}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UI
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: isBanning ? 'Banned' : 'Active' } : u
      ));
      
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || `Error trying to ${isBanning ? 'ban' : 'unban'} account`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModal = () => {
    if (!isModalOpen || !selectedUser) return null;
    
    const isBanning = selectedUser.status === 'Active';
    const actionText = isBanning ? 'Ban' : 'Unban';
    const bgColor = isBanning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
    const iconColor = isBanning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColor}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirm {actionText} User
            </h3>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to <strong>{actionText.toLowerCase()}</strong> the account <span className="font-semibold text-gray-800">{selectedUser.email}</span>? 
              {isBanning 
                ? ' This user will no longer be able to log in to the system.' 
                : ' This user will regain access to the system.'}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleToggleStatus}
                disabled={isProcessing}
                className={`px-5 py-2.5 rounded-xl font-medium text-white transition-colors flex items-center gap-2 ${bgColor} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing...' : `Yes, ${actionText}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center p-10 text-primary font-medium">Loading users...</div>;
  if (error) return <div className="text-center p-10 text-error font-medium">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Render Modal */}
      {renderModal()}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <div className="text-sm text-gray-500">
          Total: <span className="font-bold text-primary">{users.length}</span> users
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.Role?.role_name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('en-US')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.Role?.role_name !== 'Admin' && (
                    <button
                      onClick={() => openConfirmModal(user)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        user.status === 'Active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {user.status === 'Active' ? 'Ban' : 'Unban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
