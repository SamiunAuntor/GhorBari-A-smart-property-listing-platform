import React from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Clock, CheckCircle, Handshake, ArrowRight, Eye, ExternalLink, XCircle, Trash2, ShieldCheck, LayoutGrid, Inbox } from 'lucide-react';
import useAxiosSecure from '../../Hooks/useAxiosSecure';
import Swal from 'sweetalert2';

const AdminDashboardHome = () => {
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    // Fetch data from database
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await axiosSecure.get('/admin/stats');
            return res.data;
        }
    });

    const { data: users = [] } = useQuery({
        queryKey: ['pending-users-dashboard'],
        queryFn: async () => {
            const res = await axiosSecure.get('/admin/pending-verifications');
            return res.data.slice(0, 5); // Limit to 5 for dashboard view
        }
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['pending-properties-dashboard'],
        queryFn: async () => {
            const res = await axiosSecure.get('/admin/pending-properties');
            return res.data.slice(0, 5); // Limit to 5 for dashboard view
        }
    });

    // Same mutaion logic as main pages
    const verifyByRegistryMutation = useMutation({
        mutationFn: async ({ id }) => {
            return await axiosSecure.patch(`/admin/verify-user-nid/${id}`);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries(['pending-users-dashboard']);
            const matched = res?.data?.matched;
            if (matched) {
                Swal.fire('Verified!', 'User has been verified using NID registry.', 'success');
            } else {
                Swal.fire('Rejected', 'NID number not found in registry. User marked as rejected.', 'info');
            }
        }
    });

    const showNidInfo = (images) => {
        Swal.fire({
            title: '<span class="text-sm font-black uppercase tracking-widest text-[#344767]">National ID Verification Documents</span>',
            html: `
                <div style="display: flex; gap: 15px; justify-content: center; align-items: center; padding: 10px;">
                    ${images.map(img => `
                        <div style="flex: 1; aspect-ratio: 1.58 / 1; overflow: hidden; border-radius: 8px; border: 1px solid #e9ecef; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    `).join('')}
                </div>
            `,
            width: 800,
            showConfirmButton: true,
            confirmButtonText: 'Close',
            confirmButtonColor: '#67748e'
        });
    };

    // Same mutation logic as main pages
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await axiosSecure.patch(`/admin/property-status/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pending-properties-dashboard']);
            Swal.fire('Updated!', 'Property status has been changed.', 'success');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await axiosSecure.delete(`/admin/delete-property/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pending-properties-dashboard']);
            Swal.fire('Deleted!', 'Property has been permanently removed.', 'success');
        }
    });

    const handleAction = (id, status) => {
        Swal.fire({
            title: `Are you sure you want to ${status}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'active' ? '#10b981' : '#f59e0b',
            confirmButtonText: `Yes, ${status} it!`
        }).then((result) => {
            if (result.isConfirmed) statusMutation.mutate({ id, status });
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete Permanently?',
            text: "This action cannot be undone!",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Delete it!'
        }).then((result) => {
            if (result.isConfirmed) deleteMutation.mutate(id);
        });
    };

    const statCards = [
        {
            label: 'Pending User Verifications',
            count: stats?.pendingVer || 0,
            icon: ShieldAlert,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            label: 'Pending Property Listings',
            count: stats?.pendingList || 0,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Active Property Listings',
            count: stats?.activeList || 0,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            label: 'Successful Deals',
            // Sum of Rented + Sold counts = Successful Deals
            count: (stats?.rentedCount || 0) + (stats?.soldCount || 0),
            icon: Handshake,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500 p-4">

            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#344767] uppercase tracking-tight">
                    GhorBari Admin Dashboard
                </h1>
                <p className="text-[#67748e] text-sm font-medium">
                    Overview of system performance and pending administrative tasks.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[#adb5bd] text-[11px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-[#344767]">{stat.count}</h3>
                    </div>
                ))}
            </div>

            {/* USER VERIFICATION MANAGEMENT */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-[#344767]">
                            <ShieldCheck size={20} />
                        </div>
                        <h1 className="text-[10px] md:text-lg font-bold text-[#344767] uppercase tracking-tight">Recent Pending User Verifications</h1>
                    </div>
                    <button onClick={() => navigate('/admin-dashboard/pending-verifications')} className="text-[11px] font-bold uppercase bg-[#344767] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all">
                        View All <ArrowRight size={14} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-center table-auto border-collapse">
                        {users.length > 0 && (
                            <thead className="bg-[#f8f9fa]">
                                <tr className="text-[11px] uppercase text-[#344767] font-black tracking-widest border-b border-gray-200">
                                    <th className="px-4 py-4 text-left border-r border-gray-200">User Identity</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Contact Number</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Role</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Application Time</th>
                                    <th className="px-4 py-4 border-r border-gray-200">NID Documents</th>
                                    <th className="px-4 py-4">Verification Status</th>
                                </tr>
                            </thead>
                        )}
                        <tbody className="divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Inbox size={32} className="text-gray-400" />
                                            </div>
                                            <p className="text-[#67748e] font-bold text-sm uppercase tracking-wider mb-1">No Pending Verifications</p>
                                            <p className="text-gray-400 text-xs">All user verifications have been processed.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-4 py-5 text-left border-r border-gray-200 bg-white group-hover:bg-gray-50/80">
                                        <div className="flex items-center gap-3">
                                            <img src={user.profileImage} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-[#344767] leading-snug">{user.name}</span>
                                                <span className="text-[11px] text-[#67748e] font-medium">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-sm font-medium text-[#67748e] border-r border-gray-200">{user.phone || 'N/A'}</td>
                                    <td className="px-4 py-5 border-r border-gray-200">
                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-gray-100 text-[#344767]">{user.role}</span>
                                    </td>
                                    <td className="px-4 py-5 text-sm font-medium text-[#67748e] border-r border-gray-200">
                                        <div className="flex flex-col items-center">
                                            <span>{new Date(user.nidSubmittedAt).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(user.nidSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 border-r border-gray-200">
                                        <button onClick={() => showNidInfo(user.nidImages)} className="mx-auto w-fit px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100 shadow-sm">
                                            <Eye size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">View NID</span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => verifyByRegistryMutation.mutate({ id: user._id })}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest border border-emerald-100"
                                            >
                                                Verify User
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*PROPERTY APPROVALS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-[#344767]">
                            <LayoutGrid size={20} />
                        </div>
                        <h1 className="text-[10px] md:text-lg font-bold text-[#344767] uppercase tracking-tight">Recent Pending Property Listings</h1>
                    </div>
                    <button onClick={() => navigate('/admin-dashboard/pending-properties')} className="text-[11px] font-bold uppercase bg-[#344767] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all">
                        View All <ArrowRight size={14} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-center table-auto border-collapse">
                        {properties.length > 0 && (
                            <thead className="bg-[#f8f9fa]">
                                <tr className="text-[11px] uppercase text-[#344767] font-black tracking-widest border-b border-gray-200">
                                    <th className="px-4 py-4 text-left border-r border-gray-200">Property Title</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Owner Contact</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Mode</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Category</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Price Structure</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Specifications</th>
                                    <th className="px-4 py-4 border-r border-gray-200">Size</th>
                                    <th className="px-4 py-4">Administrative Actions</th>
                                </tr>
                            </thead>
                        )}
                        <tbody className="divide-y divide-gray-200">
                            {properties.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Inbox size={32} className="text-gray-400" />
                                            </div>
                                            <p className="text-[#67748e] font-bold text-sm uppercase tracking-wider mb-1">No Pending Properties</p>
                                            <p className="text-gray-400 text-xs">All property listings have been processed.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                properties.map(prop => (
                                    <tr key={prop._id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-4 py-5 text-left border-r border-gray-200 bg-white group-hover:bg-gray-50/80">
                                        <span className="font-bold text-sm text-[#344767] leading-snug">{prop.title}</span>
                                    </td>
                                    <td className="px-4 py-5 text-sm font-medium text-[#67748e] border-r border-gray-200">{prop.owner?.email}</td>
                                    <td className="px-4 py-5 border-r border-gray-200">
                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${prop.listingType === 'rent' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {prop.listingType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-sm font-bold uppercase text-[#67748e] border-r border-gray-200">{prop.propertyType}</td>
                                    <td className="px-4 py-5 text-sm font-black text-[#344767] border-r border-gray-200">
                                        ৳{prop.price.toLocaleString()}
                                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                                            {prop.listingType === 'rent' ? 'Per Month' : 'Asking Price'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-sm font-bold text-[#67748e] border-r border-gray-200">
                                        {prop.propertyType === 'building' 
                                            ? `${prop.floorCount || prop.unitCount || 'N/A'} Floors, ${prop.totalUnits || 'N/A'} Units`
                                            : `${prop.roomCount || prop.unitCount || 'N/A'} Rooms, ${prop.bathrooms || 'N/A'} Baths`
                                        }
                                    </td>
                                    <td className="px-4 py-5 text-sm font-medium text-[#67748e] border-r border-gray-200">{prop.areaSqFt} <span className="text-[10px] font-bold">SQFT</span></td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleAction(prop._id, 'active')} className="w-9 h-9 flex items-center justify-center text-emerald-500 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all" title="Approve">
                                                <CheckCircle size={18} />
                                            </button>
                                            <button onClick={() => navigate(`/admin-dashboard/property-details/${prop._id}`)} className="w-9 h-9 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all" title="Details">
                                                <ExternalLink size={18} />
                                            </button>
                                            <button onClick={() => handleAction(prop._id, 'rejected')} className="w-9 h-9 flex items-center justify-center text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all" title="Reject">
                                                <XCircle size={18} />
                                            </button>
                                            <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
                                            <button onClick={() => handleDelete(prop._id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all" title="Hard Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;
