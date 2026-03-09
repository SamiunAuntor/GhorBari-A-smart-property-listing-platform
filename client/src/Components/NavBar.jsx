import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Menu, X, User } from "lucide-react";
import { Link, NavLink } from "react-router";
import useAuth from "../Hooks/useAuth";
import { showToast } from "../Utilities/ToastMessage";
import { Tooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';
import useAdmin from "../Hooks/useAdmin";
import { useNavigate } from "react-router";
import useAxiosSecure from "../Hooks/useAxiosSecure";

const getRelativeTimeLabel = (dateValue) => {
    if (!dateValue) return "Just now";

    const target = new Date(dateValue).getTime();
    if (Number.isNaN(target)) return "Just now";

    const diffMs = target - Date.now();
    const diffMinutes = Math.round(diffMs / 60000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (Math.abs(diffMinutes) < 60) {
        return formatter.format(diffMinutes, "minute");
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
        return formatter.format(diffHours, "hour");
    }

    const diffDays = Math.round(diffHours / 24);
    return formatter.format(diffDays, "day");
};

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();
    const [isAdmin, isAdminLoading] = useAdmin();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const { data: notificationData } = useQuery({
        queryKey: ["notifications", user?.email],
        enabled: !!user,
        queryFn: async () => {
            const res = await axiosSecure.get("/notifications");
            return res.data;
        },
        refetchInterval: 60000
    });

    const notifications = notificationData?.notifications || [];
    const unreadCount = notificationData?.unreadCount || 0;
    const unreadBadgeCount = unreadCount > 99 ? "99+" : unreadCount;

    const markNotificationRead = useMutation({
        mutationFn: async (notificationId) => axiosSecure.patch(`/notifications/${notificationId}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
        }
    });

    const markAllNotificationsRead = useMutation({
        mutationFn: async () => axiosSecure.patch("/notifications/read-all"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
        }
    });


    const handleLogout = async () => {
        try {
            await logoutUser();
            showToast("Successfully logged out 👋", "success");
        } catch (error) {
            console.error(error);
            showToast(error.message || "Logout failed ❌", "error");
        }
    };

    const handleAvatarClick = () => {
        if (isAdminLoading) return; // prevent premature navigation

        if (isAdmin) {
            navigate("/admin-dashboard");
        } else {
            navigate("/profile");
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await markNotificationRead.mutateAsync(notification.id);
            }
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to update notification", "error");
        } finally {
            setNotificationOpen(false);
            navigate(notification.targetUrl || "/");
            setMenuOpen(false);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await markAllNotificationsRead.mutateAsync();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to mark notifications as read", "error");
        }
    };

    const notificationItems = useMemo(() => (
        notifications.map((notification) => (
            <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${notification.read
                    ? "bg-white border-gray-200 hover:border-orange-200 hover:bg-orange-50/40"
                    : "bg-orange-50 border-orange-200 hover:bg-orange-100/70"
                    }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 break-words">{notification.title}</p>
                        <p className="mt-1 text-xs text-gray-600 leading-5 break-words">{notification.message}</p>
                    </div>
                    {!notification.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 flex-shrink-0" />}
                </div>
                <p className="mt-2 text-[11px] font-medium text-gray-400">
                    {getRelativeTimeLabel(notification.sentAt || notification.createdAt)}
                </p>
            </button>
        ))
    ), [notifications]);

    useEffect(() => {
        if (!notificationOpen) {
            return undefined;
        }

        const handleDocumentClick = (event) => {
            const target = event.target;
            if (target?.closest?.("[data-notification-root='true']")) {
                return;
            }

            setNotificationOpen(false);
        };

        document.addEventListener("mousedown", handleDocumentClick);
        return () => document.removeEventListener("mousedown", handleDocumentClick);
    }, [notificationOpen]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);
    const renderNotificationButton = (className = "") => (
        <button
            onClick={() => setNotificationOpen((prev) => !prev)}
            aria-label="Open notifications"
            className={`relative w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:ring-2 hover:ring-orange-400 transition ${className}`}
        >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-orange-500 text-white text-[10px] font-black rounded-full border-2 border-white">
                    {unreadBadgeCount}
                </span>
            )}
        </button>
    );

    const renderNotificationPanel = (className = "") => (
        <div
            className={`absolute right-0 top-[calc(100%+12px)] w-[min(92vw,24rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-[10001] ${className}`}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-[0.16em]">Notifications</p>
                    <p className="text-[11px] text-gray-500 mt-1">{unreadCount} unread</p>
                </div>
                <button
                    onClick={handleMarkAllNotificationsRead}
                    disabled={unreadCount === 0 || markAllNotificationsRead.isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 disabled:text-gray-300 transition"
                >
                    <CheckCheck size={14} />
                    Mark all read
                </button>
            </div>
            <div className="max-h-[24rem] overflow-y-auto p-3 space-y-3 bg-gray-50">
                {notifications.length > 0 ? notificationItems : (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-10 text-center">
                        <p className="text-sm font-bold text-gray-500">No notifications yet</p>
                        <p className="mt-1 text-xs text-gray-400">New updates will appear here after email-triggering events.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <header className="relative w-full bg-white/70 backdrop-blur-md sticky top-0 z-[9999] border-b border-white/20">
            <nav className="w-11/12 mx-auto h-16 flex items-center">
                {/* LOGO */}
                <Link
                    to="/"
                    className="text-xl md:text-2xl font-bold text-orange-500 tracking-wide"
                >
                    GhorBari
                </Link>

                {/* NAV LINKS - DESKTOP */}
                <div className="hidden lg:flex items-center gap-2 ml-auto mr-4">
                    <NavLink
                        to="/properties"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
              ${isActive
                                ? "bg-orange-500 text-white"
                                : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                            }`
                        }
                    >
                        Marketplace
                    </NavLink>

                    {user && (
                        <NavLink
                            to="/list-property"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
              ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                }`
                            }
                        >
                            My Properties
                        </NavLink>
                    )}

                    {/* Only show Messages if logged in */}
                    {user && (
                        <NavLink
                            to="/chat"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
                  ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                }`
                            }
                        >
                            Chat
                        </NavLink>
                    )}

                    {/* Comparison link if logged in */}
                    {user && (
                        <NavLink
                            to="/compare"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
                  ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                }`
                            }
                        >
                            Compare
                        </NavLink>
                    )}
                    {user && (
                        <NavLink
                            to="/wishlist"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
                  ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                }`
                            }
                        >
                            Wishlist
                        </NavLink>
                    )}

                    {/* Only show My Profile if logged in */}
                    {user && (
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-200
                  ${isActive
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                }`
                            }
                        >
                            My Profile
                        </NavLink>
                    )}

                </div>




                {/* AUTH BUTTONS / USER AVATAR - DESKTOP */}
                <div className="hidden lg:flex items-center gap-4">
                    {!user ? (
                        <>
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm md:text-base font-medium border border-orange-400 text-orange-500 rounded-md hover:bg-orange-400/10 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 text-sm md:text-base font-medium bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-md hover:brightness-110 transition"
                            >
                                Register
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="relative" data-notification-root="true">
                                {renderNotificationButton()}
                                {notificationOpen && renderNotificationPanel()}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm md:text-base font-medium border border-orange-400 text-orange-500 rounded-md hover:bg-orange-400/10 transition"
                            >
                                Logout
                            </button>

                            {/* Avatar with tooltip */}
                            <div>
                                <div
                                    onClick={handleAvatarClick}
                                    data-tooltip-id="userTooltip"
                                    data-tooltip-content={
                                        isAdmin ? "Admin Dashboard" : user.displayName || "User"
                                    }
                                    className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border border-gray-200 flex items-center justify-center bg-gray-100 hover:ring-2 hover:ring-orange-400 transition"
                                >

                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || "User Avatar"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={20} className="text-gray-400" />
                                    )}
                                </div>
                                <Tooltip id="userTooltip" place="bottom" effect="solid" />
                            </div>

                        </div>
                    )}
                </div>

                {/* MOBILE MENU BUTTON */}
                <div className="lg:hidden ml-auto flex items-center gap-2">
                    {user && (
                        <>
                            <div className="relative" data-notification-root="true">
                                {renderNotificationButton()}
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                aria-label={isAdmin ? "Go to admin dashboard" : "Go to profile"}
                                className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100 hover:ring-2 hover:ring-orange-400 transition"
                            >
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || "User Avatar"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={20} className="text-gray-400" />
                                )}
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {user && notificationOpen && (
                <div className="lg:hidden absolute right-4 top-[calc(100%+8px)]" data-notification-root="true">
                    {renderNotificationPanel("w-[min(calc(100vw-2rem),24rem)]")}
                </div>
            )}

            {/* MOBILE MENU */}
            {
                menuOpen && (
                    <>
                        <div
                            className="lg:hidden fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-[2px]"
                            onClick={() => setMenuOpen(false)}
                        />
                        <div className="lg:hidden relative bg-white/90 backdrop-blur-md shadow-inner border-t border-white/20">
                            <div className="w-11/12 mx-auto flex flex-col py-3 gap-2">
                                {user && (
                                    <button
                                        onClick={() => {
                                            handleAvatarClick();
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 border border-orange-100 text-left"
                                    >
                                        <div className="w-11 h-11 rounded-full overflow-hidden border border-orange-200 flex items-center justify-center bg-white">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName || "User Avatar"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {user.displayName || "User"}
                                            </p>
                                            <p className="text-xs text-orange-600 font-medium">
                                                {isAdmin ? "Open admin dashboard" : "Open profile"}
                                            </p>
                                        </div>
                                    </button>
                                )}
                            <NavLink
                                to="/properties"
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                    `px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                ${isActive
                                        ? "bg-orange-500 text-white"
                                        : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                    }`
                                }
                            >
                                Marketplace
                            </NavLink>

                            {user && (
                                <NavLink
                                    to="/list-property"
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                ${isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                        }`
                                    }
                                >
                                    My Properties
                                </NavLink>
                            )}

                            {user && (
                                <NavLink
                                    to="/chat"
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                        }`
                                    }
                                >
                                    Chat
                                </NavLink>
                            )}

                            {user && (
                                <NavLink
                                    to="/compare"
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1
                    ${isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                        }`
                                    }
                                >
                                    Compare
                                </NavLink>
                            )}                            {user && (
                                <NavLink
                                    to="/wishlist"
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-700 hover:bg-orange-400/20 hover:text-orange-600"
                                        }`
                                    }
                                >
                                    Wishlist
                                </NavLink>
                            )}
                            {!user ? (
                                <div className="flex gap-2 pt-3 flex-col">
                                    <Link
                                        to="/login"
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full text-center px-4 py-3 text-sm font-medium border border-orange-400 text-orange-500 rounded-md hover:bg-orange-400/10 transition"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        to="/register"
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full text-center px-4 py-3 text-sm font-medium bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-md hover:brightness-110 transition"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMenuOpen(false);
                                    }}
                                    className="w-full text-center px-4 py-3 text-sm font-medium border border-orange-400 text-orange-500 rounded-md hover:bg-orange-400/10 transition flex items-center justify-center gap-2"
                                >
                                    <User size={18} /> Logout
                                </button>
                            )}
                        </div>
                    </div>
                    </>
                )
            }
        </header >
    );
};

export default Navbar;
