'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Shield,
    BarChart3,
    Settings,
    UserCheck,
    UserX,
    Crown,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    UserPlus,
    Eye,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Plus,
    Minus,
    Calendar,
    Building
} from 'lucide-react';
import { AuthService } from '@/lib/services/auth.service';
import { SuperAdminService } from '@/lib/services/superadmin.service';
import { ProfileService } from '@/lib/services/profile.service';
import { useSuperAdmin } from '@/hooks/use-superadmin';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
import { AccessDenied } from '@/components/common/access-denied';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

// Types are now imported from the service

export default function SuperAdminPage() {
    // Debug authentication state
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        const checkDebugInfo = () => {
            const authData = {
                isAuthenticated: AuthService.isAuthenticated(),
                storedToken: !!AuthService.getStoredToken(),
                userRoles: AuthService.getUserRolesFromStorage(),
                storedUser: AuthService.getStoredUser(),
                localStorage: {
                    accessToken: !!localStorage.getItem('clubviz-accessToken'),
                    user: !!localStorage.getItem('clubviz-user'),
                    userContent: localStorage.getItem('clubviz-user') ? JSON.parse(localStorage.getItem('clubviz-user') || '{}') : null
                }
            };
            setDebugInfo(authData);
            console.log("🔍 SuperAdmin Debug Info:", authData);
        };

        checkDebugInfo();

        // Check again after a small delay
        const timer = setTimeout(checkDebugInfo, 200);
        return () => clearTimeout(timer);
    }, []);

    // Authentication info - no redirects
    const isAuthenticated = AuthService.isAuthenticated();
    const userRoles = AuthService.getUserRolesFromStorage();
    const hasRole = (role: string) => AuthService.hasRole(role);

    const router = useRouter();
    const { toast } = useToast();

    // Use the custom SuperAdmin hook
    const {
        isLoading,
        isStatsLoading,
        isUsersLoading,
        isClubsLoading,
        users,
        clubs,
        stats,
        selectedUsers,
        loadStats,
        loadUsers,
        loadClubs,
        refreshData,
        activateUser,
        deactivateUser,
        deleteUser,
        deleteClub,
        addRole,
        removeRole,
        bulkActivate,
        bulkDeactivate,
        bulkDelete,
        toggleUserSelection,
        selectAllUsers,
        clearSelection,
    } = useSuperAdmin();

    // Profile integration for superadmin
    const {
        currentUser,
        allProfiles,
        loadAllProfiles,
        isProfileLoading,
        isAllProfilesLoading,
    } = useProfile();

    // Show loading or redirect if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#021313] flex items-center justify-center">
                <div className="text-white text-lg">Redirecting...</div>
            </div>
        );
    }

    // Local state management
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clubs' | 'roles' | 'stats'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [newRoleUsername, setNewRoleUsername] = useState('');
    const [newRole, setNewRole] = useState('USER');
    // Delete dialog state for clubs
    const [showDeleteClubDialog, setShowDeleteClubDialog] = useState(false);
    const [deleteClubId, setDeleteClubId] = useState<string | null>(null);
    const [deleteClubName, setDeleteClubName] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        const initializeData = async () => {
            await refreshData();
            await loadAllProfiles();
        };
        initializeData();
    }, [refreshData, loadAllProfiles]);

    // Utility functions
    const handleQuickAddRole = async () => {
        if (!newRoleUsername.trim() || !newRole) {
            toast({
                title: "Error",
                description: "Please enter a username and select a role",
                variant: "destructive",
            });
            return;
        }

        await addRole(newRoleUsername.trim(), newRole);
        setNewRoleUsername('');
        setNewRole('USER');
    };

    // Navigation handlers
    const handleCreateClub = () => {
        router.push('/business/new-club');
    };

    const handleCreateEvent = () => {
        router.push('/business/new-event');
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.roles.includes(selectedRole.toUpperCase());

        return matchesSearch && matchesRole;
    });

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-6 h-6 text-[#14FFEC]" />
                        <span className="text-2xl font-bold text-white">
                            {isStatsLoading ? '...' : (stats?.totalUsers || 0)}
                        </span>
                    </div>
                    <p className="text-[#14FFEC] text-sm">Total Users</p>
                </div>

                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-6 h-6 text-green-500" />
                        <span className="text-2xl font-bold text-white">
                            {isStatsLoading ? '...' : (stats?.activeUsers || 0)}
                        </span>
                    </div>
                    <p className="text-green-500 text-sm">Active Users</p>
                </div>

                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-yellow-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <span className="text-2xl font-bold text-white">
                            {isStatsLoading ? '...' : (stats?.admins || 0)}
                        </span>
                    </div>
                    <p className="text-yellow-500 text-sm">Admins</p>
                </div>

                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-6 h-6 text-purple-500" />
                        <span className="text-2xl font-bold text-white">
                            {isClubsLoading ? '...' : (clubs?.length || 0)}
                        </span>
                    </div>
                    <p className="text-purple-500 text-sm">Total Clubs</p>
                </div>

                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <UserX className="w-6 h-6 text-red-500" />
                        <span className="text-2xl font-bold text-white">
                            {isStatsLoading ? '...' : (stats?.inactiveUsers || 0)}
                        </span>
                    </div>
                    <p className="text-red-500 text-sm">Inactive Users</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3 mb-4">
                    {/* Super Admin exclusive actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleCreateClub}
                            className="bg-[#14FFEC] text-black font-semibold py-3 rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#12E6D6] transition-colors"
                        >
                            <Building className="w-4 h-4" />
                            Create Club
                        </button>
                        <button
                            onClick={handleCreateEvent}
                            className="bg-[#0F6861] text-white font-semibold py-3 rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#0D5451] transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            Create Event
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setActiveTab('users')}
                        className="bg-[#222831] text-white font-semibold py-3 rounded-[12px] border border-[#14FFEC]/30 flex items-center justify-center gap-2 hover:bg-[#14FFEC]/10 transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('clubs')}
                        className="bg-[#222831] text-white font-semibold py-3 rounded-[12px] border border-[#14FFEC]/30 flex items-center justify-center gap-2 hover:bg-[#14FFEC]/10 transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        Clubs
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className="bg-[#222831] text-white font-semibold py-3 rounded-[12px] border border-[#14FFEC]/30 flex items-center justify-center gap-2 hover:bg-[#14FFEC]/10 transition-colors"
                    >
                        <Shield className="w-4 h-4" />
                        Roles
                    </button>
                </div>
            </div>

            {/* Quick Role Management */}
            <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Role Assignment</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={newRoleUsername}
                            onChange={(e) => setNewRoleUsername(e.target.value)}
                            className="flex-1 bg-[#021313] border border-[#14FFEC]/30 rounded-lg px-1 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#14FFEC]"
                        />
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-[#021313] border border-[#14FFEC]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#14FFEC]"
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERADMIN">Super Admin</option>
                        </select>
                    </div>
                    <button
                        onClick={handleQuickAddRole}
                        disabled={isLoading || !newRoleUsername.trim()}
                        className="bg-[#14FFEC] text-black px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Role
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-[#021313] rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div className="flex-1">
                            <p className="text-white text-sm">User kousik123 logged in</p>
                            <p className="text-gray-400 text-xs">2 minutes ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-[#021313] rounded-lg">
                        <UserPlus className="w-4 h-4 text-[#14FFEC]" />
                        <div className="flex-1">
                            <p className="text-white text-sm">New user registered: amin</p>
                            <p className="text-gray-400 text-xs">1 hour ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-[#021313] rounded-lg">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <div className="flex-1">
                            <p className="text-white text-sm">Admin role added to kousik123</p>
                            <p className="text-gray-400 text-xs">3 hours ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-4">
            {/* Bulk Operations */}
            {selectedUsers.length > 0 && (
                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold">
                            {selectedUsers.length} user(s) selected
                        </span>
                        <button
                            onClick={clearSelection}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Clear selection
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => bulkActivate(selectedUsers)}
                            disabled={isLoading}
                            className="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                        >
                            <UserCheck className="w-4 h-4 inline mr-1" />
                            Activate Selected
                        </button>
                        <button
                            onClick={() => bulkDeactivate(selectedUsers)}
                            disabled={isLoading}
                            className="bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors"
                        >
                            <UserX className="w-4 h-4 inline mr-1" />
                            Deactivate Selected
                        </button>
                        <button
                            onClick={() => bulkDelete(selectedUsers)}
                            disabled={isLoading}
                            className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={selectedUsers.length === users.length ? clearSelection : selectAllUsers}
                    className="px-4 py-3 bg-[#0D1F1F] rounded-[12px] text-[#14FFEC] border border-[#14FFEC]/20 hover:border-[#14FFEC] transition-colors font-semibold"
                >
                    {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#0D1F1F] rounded-[12px] text-white placeholder-gray-400 border border-[#14FFEC]/20 focus:outline-none focus:border-[#14FFEC]"
                    />
                </div>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-3 bg-[#0D1F1F] rounded-[12px] text-white border border-[#14FFEC]/20 focus:outline-none focus:border-[#14FFEC]"
                >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            <div className="space-y-3">
                {filteredUsers.map((user) => (
                    <div key={user.username} className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.username)}
                                    onChange={() => toggleUserSelection(user.username)}
                                    className="w-4 h-4 rounded border border-[#14FFEC]/30 bg-transparent checked:bg-[#14FFEC] checked:text-black focus:ring-[#14FFEC]"
                                />
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isActive ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <Users className={`w-5 h-5 ${user.isActive ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">{user.fullName || user.username}</h4>
                                    <p className="text-gray-400 text-sm">@{user.username}</p>
                                    <div className="flex gap-1 mt-1">
                                        {user.roles.map((role) => (
                                            <span
                                                key={role}
                                                className={`px-2 py-1 rounded-md text-xs font-semibold border ${SuperAdminService.getRoleBadgeColor(role)}`}
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setExpandedUser(expandedUser === user.username ? null : user.username)}
                                className="p-2 hover:bg-[#021313] rounded-lg transition-colors"
                            >
                                {expandedUser === user.username ?
                                    <ChevronUp className="w-4 h-4 text-gray-400" /> :
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                }
                            </button>
                        </div>

                        {expandedUser === user.username && (
                            <div className="mt-4 pt-4 border-t border-[#14FFEC]/10">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-gray-400 text-xs">Email</p>
                                        <p className="text-white text-sm">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Phone</p>
                                        <p className="text-white text-sm">{user.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Roles</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {user.roles.map(role => (
                                                <span key={role} className={`px-2 py-1 rounded-full text-xs ${role === 'ADMIN' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#14FFEC]/20 text-[#14FFEC]'
                                                    }`}>
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Status</p>
                                        <span className={`inline-flex items-center gap-1 text-sm ${user.isActive ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                {/* User Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {user.isActive ? (
                                        <button
                                            onClick={() => deactivateUser(user.username)}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <UserX className="w-3 h-3 inline mr-1" />
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => activateUser(user.username)}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <UserCheck className="w-3 h-3 inline mr-1" />
                                            Activate
                                        </button>
                                    )}

                                    {!user.roles.includes('ADMIN') && (
                                        <button
                                            onClick={() => addRole(user.username, 'ADMIN')}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <Crown className="w-3 h-3 inline mr-1" />
                                            Make Admin
                                        </button>
                                    )}

                                    {user.roles.includes('ADMIN') && user.roles.length > 1 && (
                                        <button
                                            onClick={() => removeRole(user.username, 'ADMIN')}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-lg text-sm hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <Shield className="w-3 h-3 inline mr-1" />
                                            Remove Admin
                                        </button>
                                    )}

                                    <button
                                        onClick={async () => {
                                            try {
                                                const userProfile = await ProfileService.getProfileByAdmin(user.username);
                                                toast({
                                                    title: "User Profile",
                                                    description: `Profile loaded for ${userProfile.fullName || user.username}`,
                                                });
                                            } catch (error) {
                                                toast({
                                                    title: "Error",
                                                    description: "Failed to load user profile",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <Eye className="w-3 h-3 inline mr-1" />
                                        View Profile
                                    </button>

                                    <button
                                        onClick={() => deleteUser(user.username)}
                                        disabled={isLoading}
                                        className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-3 h-3 inline mr-1" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No users found</p>
                </div>
            )}
        </div>
    );

    const renderClubs = () => (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Club Management</h3>
                        <p className="text-gray-400 text-sm">
                            Manage all clubs in the system
                        </p>
                    </div>
                    <button
                        onClick={loadClubs}
                        disabled={isClubsLoading}
                        className="p-2 hover:bg-[#021313] rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#14FFEC] ${isClubsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Clubs Loading State */}
            {isClubsLoading && (
                <div className="bg-[#0D1F1F] rounded-[15px] p-8 text-center">
                    <RefreshCw className="w-8 h-8 text-[#14FFEC] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading clubs...</p>
                </div>
            )}

            {/* Clubs List */}
            {!isClubsLoading && (
                <div className="space-y-3">
                    {clubs.length === 0 ? (
                        <div className="bg-[#0D1F1F] rounded-[15px] p-8 text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">No clubs found</p>
                            <p className="text-gray-500 text-sm">There are no clubs in the system yet.</p>
                        </div>
                    ) : (
                        clubs.map((club) => (
                            <div
                                key={club.id}
                                className="bg-[#0D1F1F] border border-[#14FFEC]/20 rounded-[15px] p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#14FFEC]/20 rounded-lg flex items-center justify-center">
                                            {club.logoUrl ? (
                                                <img
                                                    src={club.logoUrl}
                                                    alt={club.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <Users className="w-6 h-6 text-[#14FFEC]" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{club.name}</h4>
                                            <p className="text-gray-400 text-sm">
                                                Owner: {club.owner?.fullName || club.owner?.username || 'Unknown'}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {club.members?.length || 0} members • Created {new Date(club.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                // Navigate to club preview
                                                router.push(`/business/club-preview?clubId=${club.id}`);
                                            }}
                                            className="p-2 bg-[#14FFEC]/20 rounded-lg hover:bg-[#14FFEC]/30 transition-colors"
                                            title="View Club"
                                        >
                                            <Eye className="w-4 h-4 text-[#14FFEC]" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteClubId(club.id);
                                                setDeleteClubName(club.name);
                                                setShowDeleteClubDialog(true);
                                            }}
                                            className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                            disabled={isLoading}
                                            title="Delete Club"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Additional Club Info */}
                                {club.description && (
                                    <div className="mt-3 pt-3 border-t border-[#14FFEC]/10">
                                        <p className="text-gray-300 text-sm">{club.description}</p>
                                    </div>
                                )}

                                {/* Location Info */}
                                {(club.locationText?.city || club.locationText?.state) && (
                                    <div className="mt-2">
                                        <p className="text-gray-400 text-xs">
                                            📍 {club.locationText.city}{club.locationText.city && club.locationText.state ? ', ' : ''}{club.locationText.state}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Stats Footer */}
            {!isClubsLoading && clubs.length > 0 && (
                <div className="bg-[#0D1F1F] rounded-[15px] p-4 border border-[#14FFEC]/20">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                            Total Clubs: <span className="text-[#14FFEC] font-medium">{clubs.length}</span>
                        </span>
                        <span className="text-gray-400">
                            Active Clubs: <span className="text-green-400 font-medium">{clubs.filter(c => c.isActive).length}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog for Clubs */}
            <Dialog open={showDeleteClubDialog} onOpenChange={setShowDeleteClubDialog}>
                <DialogOverlay />
                <DialogContent className="p-0 border-none bg-transparent max-w-[420px]" showCloseButton={false}>
                    <div className="w-full p-[20px_21px_20px_22px] bg-[#0D1F1F] overflow-hidden rounded-[17px] flex flex-col items-center gap-[26px] relative">
                        <div className="absolute right-3 top-3">
                            <button
                                onClick={() => setShowDeleteClubDialog(false)}
                                className="w-8 h-8 flex items-center justify-center text-white bg-transparent rounded-full hover:bg-white/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="w-[80px] h-[80px] relative overflow-hidden flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 size={32} className="text-red-400" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-[12px]">
                            <div className="text-[#F9F9F9] text-[20px] font-semibold font-['Manrope']">Delete Club</div>
                            <div className="text-[#A3A3A3] text-[14px] font-['Manrope'] text-center leading-relaxed">
                                Are you sure you want to delete "{deleteClubName || 'this club'}"? This action cannot be undone.
                            </div>
                        </div>

                        <div className="flex items-center gap-[14px]">
                            <button
                                onClick={async () => {
                                    if (!deleteClubId) return;
                                    await deleteClub(deleteClubId);
                                    setShowDeleteClubDialog(false);
                                    setDeleteClubId(null);
                                    setDeleteClubName(null);
                                }}
                                disabled={isLoading}
                                className="w-[154px] h-[38px] bg-red-600 rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                            >
                                <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px] flex items-center gap-2">
                                    {isLoading && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {isLoading ? 'Deleting...' : 'Yes, Delete'}
                                </div>
                            </button>

                            <button
                                onClick={() => setShowDeleteClubDialog(false)}
                                className="w-[154px] h-[38px] border border-[#007877] rounded-[30px] flex justify-center items-center cursor-pointer hover:bg-[#012e2e] transition-all duration-300"
                            >
                                <div className="text-center text-white text-[16px] font-['Manrope'] font-medium tracking-[0.05px]">Cancel</div>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );

    const renderRoles = () => (
        <div className="space-y-4">
            <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Role Management</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Manage user roles and permissions. Available roles: USER, ADMIN
                </p>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#021313] rounded-lg">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-[#14FFEC]" />
                            <div>
                                <h4 className="text-white font-medium">USER</h4>
                                <p className="text-gray-400 text-sm">Standard user access</p>
                            </div>
                        </div>
                        <span className="text-[#14FFEC] text-sm">
                            {users.filter(u => u.roles.includes('USER')).length} users
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#021313] rounded-lg">
                        <div className="flex items-center gap-3">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <div>
                                <h4 className="text-white font-medium">ADMIN</h4>
                                <p className="text-gray-400 text-sm">Administrative access</p>
                            </div>
                        </div>
                        <span className="text-yellow-500 text-sm">
                            {users.filter(u => u.roles.includes('ADMIN')).length} users
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="space-y-4">
            <div className="bg-[#0D1F1F] rounded-[15px] p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Admin Statistics</h3>
                    <button
                        onClick={refreshData}
                        disabled={isLoading}
                        className="p-2 hover:bg-[#021313] rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#14FFEC] ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-[#021313] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">User Distribution</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-white">Active Users</span>
                                    <span className="text-green-500">{stats?.activeUsers || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white">Inactive Users</span>
                                    <span className="text-red-500">{stats?.inactiveUsers || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white">Admin Users</span>
                                    <span className="text-yellow-500">{stats?.admins || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-[#021313] rounded-lg">
                        <h4 className="text-white font-medium mb-3">System Health</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-white text-sm">Authentication Service</span>
                                <span className="text-green-500 text-sm">Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-white text-sm">User Management</span>
                                <span className="text-green-500 text-sm">Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-white text-sm">Role Management</span>
                                <span className="text-green-500 text-sm">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#021313] text-white">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-30 flex flex-col pt-8 bg-gradient-to-b from-[#11B9AB] to-[#222831] h-[140px] w-full">
                <div className="px-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="w-[35px] h-[35px] bg-white/20 overflow-hidden rounded-[18px] flex items-center justify-center"
                        >
                            <span className="text-white text-lg font-bold">&lt;</span>
                        </button>
                        {isLoading && (
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                                <span className="text-white text-sm">Loading...</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-center px-6 flex-1 flex flex-col justify-center">
                    <div className="text-white text-xl font-['Manrope'] font-bold leading-6 tracking-[0.50px]">
                        {currentUser?.fullName || currentUser?.username || 'SUPER ADMIN'}
                    </div>
                    <div className="text-white/70 text-sm mt-1">
                        {isProfileLoading ? 'Loading profile...' : 'System Administration'}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pt-[160px] pb-6">
                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex bg-[#0D1F1F] rounded-[20px] p-1">
                        {[
                            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                            { key: 'users', label: 'Users', icon: Users },
                            { key: 'clubs', label: 'Clubs', icon: Users },
                            { key: 'roles', label: 'Roles', icon: Shield },
                            { key: 'stats', label: 'Stats', icon: Settings }
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[16px] text-sm font-medium transition-all ${activeTab === key
                                    ? 'bg-[#14FFEC] text-black'
                                    : 'text-white/70 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[60vh]">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'clubs' && renderClubs()}
                    {activeTab === 'roles' && renderRoles()}
                    {activeTab === 'stats' && renderStats()}
                </div>
            </div>
        </div>
    );
}



