import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router";

import loginImg from "../assets/loginImage.jpg";
import Loading from "../Components/Loading";
import { showToast } from "../Utilities/ToastMessage";
import { getFirebaseAuthErrorMessage } from "../Utilities/firebaseAuthErrorMessage";
import useAuth from "../Hooks/useAuth";
import useAxios from "../Hooks/useAxios";
import useAdmin from "../Hooks/useAdmin";

const LoginPage = () => {
    const { loginUserWithEmailPassword, loginWithGoogle, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const axios = useAxios();

    const [showPassword, setShowPassword] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    // LAND AT TOP & FORCED INITIAL LOADING (0.25s)
    useEffect(() => {
        window.scrollTo(0, 0);
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 250);
        return () => clearTimeout(timer);
    }, []);

    // Email & Password Login
    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            const result = await loginUserWithEmailPassword(data.email, data.password);
            const user = result.user;

            // Check if user is admin
            try {
                const token = await user.getIdToken();
                const adminCheck = await axios.get(`/users/admin/${user.email}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const isAdmin = adminCheck.data?.admin || false;

                showToast(`Welcome back, ${user.displayName || "User"}! 👋`, "success");
                
                // Redirect admin to dashboard, others to intended location or home
                if (isAdmin) {
                    navigate("/admin-dashboard");
                } else {
                    navigate(location?.state?.from || "/");
                }
            } catch (error) {
                // If admin check fails, redirect to normal location
                showToast(`Welcome back, ${user.displayName || "User"}! 👋`, "success");
                navigate(location?.state?.from || "/");
            }
        } catch (error) {
            showToast(getFirebaseAuthErrorMessage(error, "Invalid email or password"), "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Google Sign-In
    const handleGoogleSignIn = async () => {
        try {
            setActionLoading(true);

            // Firebase Google sign in
            const result = await loginWithGoogle();
            const user = result.user;

            // Check if user exists in DB
            const { data } = await axios.get(`/check-user-exist?email=${user.email}`);

            // Create DB entry if not exists
            if (!data.exists) {
                await axios.post("/register-user", {
                    email: user.email,
                    name: user.displayName || "User",
                    profileImage: user.photoURL || "",
                    phone: "",
                    role: "user",
                });
            } else {
                // User exists: sync Firebase photoURL with database profileImage
                const token = await user.getIdToken();
                const { data: userProfile } = await axios.get(`/user-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Update Firebase photoURL if database has profileImage
                if (userProfile?.profileImage && userProfile.profileImage !== user.photoURL) {
                    await updateUserProfile({
                        photoURL: userProfile.profileImage
                    });
                } else if (!userProfile?.profileImage && user.photoURL) {
                    // Update database if it's missing profileImage but Firebase has it
                    await axios.patch('/update-profile', {
                        profileImage: user.photoURL
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            // Check if user is admin
            try {
                const token = await user.getIdToken();
                const adminCheck = await axios.get(`/users/admin/${user.email}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const isAdmin = adminCheck.data?.admin || false;

                showToast(`Welcome back, ${user.displayName || "User"}! 🚀`, "success");
                
                // Redirect admin to dashboard, others to intended location or home
                if (isAdmin) {
                    navigate("/admin-dashboard");
                } else {
                    navigate(location?.state?.from || "/");
                }
            } catch (error) {
                // If admin check fails, redirect to normal location
                showToast(`Welcome back, ${user.displayName || "User"}! 🚀`, "success");
                navigate(location?.state?.from || "/");
            }

        } catch (error) {
            showToast(getFirebaseAuthErrorMessage(error, "Google sign-in failed"), "error");
        } finally {
            setActionLoading(false);
        }
    };


    if (initialLoading) return <Loading />;

    return (
        <div className="min-h-screen flex bg-white">
            {/* LEFT – FORM (30% on Desktop, 100% on Tablet/Mobile) */}
            <div className="w-full lg:w-[30%] flex items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-md lg:max-w-sm">
                    {/* HEADER */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-500 mt-2 font-light">Login to manage your GhorBari account</p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* EMAIL */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address <span className="text-orange-500">*</span></label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                {...register("email", { required: "Email is required" })}
                                className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 text-gray-800 focus:border-orange-500 outline-none transition-all"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-gray-700">Password <span className="text-orange-500">*</span></label>
                                <Link to="/reset-password" className="text-xs text-orange-500 hover:underline">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password", { required: "Password is required" })}
                                    className="w-full bg-white border border-gray-200 rounded-md px-4 py-2.5 pr-12 text-gray-800 focus:border-orange-500 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors flex items-center justify-center"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-md font-bold shadow-lg shadow-orange-200 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                        >
                            {actionLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logging in...
                                </span>
                            ) : "Sign In"}
                        </button>
                    </form>

                    {/* DIVIDER */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* GOOGLE BUTTON */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={actionLoading}
                        className="w-full border border-gray-200 bg-white flex items-center justify-center gap-3 py-2.5 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition-all mb-6"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Continue with Google
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        New to GhorBari?{" "}
                        <Link to="/register" className="text-orange-500 font-bold hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>

            {/* RIGHT – IMAGE (Visible ONLY on Desktop) */}
            <div className="hidden lg:block lg:w-[70%] relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/20 to-transparent z-10" />
                <img
                    src={loginImg}
                    alt="Login"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
};

export default LoginPage;