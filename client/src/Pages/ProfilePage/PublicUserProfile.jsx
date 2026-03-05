import React from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
    Mail,
    ShieldCheck,
    ShieldAlert,
    Calendar,
    Star,
    Award,
    Phone,
    MessageSquare
} from 'lucide-react';
import useAxios from '../../Hooks/useAxios';
import useAuth from '../../Hooks/useAuth';
import Loading from '../../Components/Loading';

const PublicUserProfile = () => {
    const { email } = useParams();
    const axios = useAxios();
    const { user: authUser } = useAuth();

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['public-profile', email],
        queryFn: async () => {
            const token = await authUser?.getIdToken();
            const res = await axios.get(`/public-profile/${email}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return res.data;
        },
        enabled: !!email
    });

    if (isLoading) return <Loading />;

    if (error || !profile) {
        return (
            <div className="h-screen flex items-center justify-center font-black text-2xl">
                <ShieldAlert className="mr-2 text-rose-500" />
                PROFILE NOT FOUND
            </div>
        );
    }
    const isVerified = profile?.nidVerified === 'verified';

    const StatCard = ({ label, value, icon: Icon, color }) => (
        <div className="w-40 p-4 bg-white/5 rounded-lg border border-white/10 text-center">
            <p className={`text-[10px] font-black uppercase mb-1 ${color}`}>
                {label}
            </p>
            <div className="flex items-center justify-center gap-2 text-white font-black text-lg">
                <Icon size={18} className={color} /> {value}
            </div>
        </div>
    );

    return (
        <div className="w-11/12 mx-auto my-12 font-sans antialiased">
            {/* HERO SECTION */}
            <header className="relative bg-[#1A1A2E] rounded-lg p-10 md:p-16 overflow-hidden shadow-2xl mb-10">
                <div className="relative flex flex-col md:flex-row items-center gap-12">
                    <div className="relative shrink-0">
                        {/* Avatar container with gradient ring (match My Profile layout) */}
                        <div className="relative p-1 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2.8rem]">
                            <div className="relative">
                                <img
                                    src={profile.profileImage || "https://i.ibb.co/5GzXpdx/default-user.png"}
                                    alt="Profile"
                                    className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] object-cover border-4 md:border-8 border-[#1A1A2E] shadow-2xl"
                                />
                            </div>

                            {/* Verification capsule on avatar (same style as My Profile) */}
                            <div className="absolute -bottom-2 -right-2">
                                {isVerified ? (
                                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full border-2 border-[#1A1A2E] shadow-lg">
                                        <ShieldCheck size={12} /> Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded-full border-2 border-[#1A1A2E] shadow-lg">
                                        <ShieldAlert size={12} /> Unverified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-5xl font-black text-white mb-4">
                            {profile.name}
                        </h1>

                        <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-8 font-bold">
                            <Calendar size={18} className="text-orange-500" />
                            Member since{" "}
                            {new Date(profile.createdAt).toLocaleDateString(
                                'en-GB',
                                { month: 'long', year: 'numeric' }
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <StatCard
                                label="Total Rating"
                                value={profile?.rating?.average || "5.0"}
                                icon={Star}
                                color="text-amber-400"
                            />
                            <StatCard
                                label="System Role"
                                value={profile?.role?.replace('_', ' ') || 'User'}
                                icon={Award}
                                color="text-blue-400"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
                        Identity
                    </h3>

                    <div
                        className={`flex items-center gap-4 p-6 rounded-md border-2 ${isVerified
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-rose-50 border-rose-100 text-rose-600'
                            }`}
                    >
                        {isVerified ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                        <div>
                            <p className="text-sm font-black uppercase">
                                {isVerified ? 'NID Verified' : 'Not Verified'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-white p-8 rounded-lg border border-gray-100 shadow-sm relative flex flex-col md:flex-row justify-between">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                            Contact
                        </h3>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-md">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">
                                    Email
                                </p>
                                <p className="text-lg font-bold">
                                    {profile.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-md">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase">
                                    Phone
                                </p>
                                <p className="text-lg font-bold">
                                    {profile.phone || "Not Provided"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button className="mt-8 md:mt-0 md:self-end flex items-center gap-3 px-10 py-5 bg-orange-600 text-white rounded-md font-black uppercase text-xs tracking-widest shadow-xl">
                        <MessageSquare size={18} />
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicUserProfile;
