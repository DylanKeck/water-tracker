import { useEffect, useState } from "react";
import { Form, redirect, useActionData, useNavigate, useSearchParams } from "react-router";
import { MdOutlineEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { IconContext } from "react-icons";
import { BiHide, BiShow } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import type { Route } from "../+types/root";
import { commitSession, getSession } from "~/utils/session.server";
import { type SignIn, SignInSchema } from "~/utils/models/sign-in.model";
import { zodResolver } from "@hookform/resolvers/zod";
import { getValidatedFormData, useRemixForm } from "remix-hook-form";

// ------- META -------
export function meta({}: Route.MetaArgs) {
    return [
        { title: "Water Tracker — Login" },
        { name: "description", content: "Sign in to Water Tracker" },
    ];
}

const resolver = zodResolver(SignInSchema);

// ------- ACTION (server) -------
export async function action({ request }: Route.ActionArgs) {
    try {
        // 1) Validate form with Zod
        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SignIn>(request, resolver);
        if (errors) return { errors, defaultValues };

        const { profileEmail, profilePassword } = data;

        // 2) Get/prepare session
        const session = await getSession(request.headers.get("Cookie"));

        // 3) Lazy-import server deps (kept out of client bundle)
        const [{ default: postgres }, bcrypt] = await Promise.all([
            import("postgres"),
            import("bcryptjs"),
        ]);

        // 4) Singleton Postgres.js client (avoid new connection each HMR)
        // @ts-ignore
        if (!globalThis.__sql) {
            // If your DATABASE_URL already has ?sslmode=require you can omit ssl option
            // @ts-ignore
            globalThis.__sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 10 });
        }
        // @ts-ignore
        const sql: import("postgres").Sql = globalThis.__sql;

        // 5) Look up user by email
        const rows = await sql<{
            profile_id: string;
            profile_username: string;
            profile_email: string;
            profile_password_hash: string;
            profile_base_goal_liters: number | null;
            profile_reduction_percent: number | null;
            profile_created_at: Date | null;
        }[]>`
      select
        profile_id,
        profile_username,
        profile_email,
        profile_password_hash,
        profile_base_goal_liters,
        profile_reduction_percent,
        profile_created_at
      from profile
      where profile_email = ${profileEmail}
      limit 1
    `;

        if (rows.length === 0) {
            return { success: false, error: "Invalid email or password.", status: 400 };
        }

        const user = rows[0];

        // 6) Check password
        const ok = await bcrypt.compare(profilePassword, user.profile_password_hash);
        if (!ok) {
            return { success: false, error: "Invalid email or password.", status: 400 };
        }

        // 7) Put what you need into the session (no JWT necessary)
        //    Shape this to match what your app expects.
        const sessionProfile = {
            profileId: user.profile_id,
            profileUsername: user.profile_username,
            profileEmail: user.profile_email,
            profileBaseGoalLiters: user.profile_base_goal_liters ?? 110,
            profileReductionPercent: user.profile_reduction_percent ?? 0,
            profileCreatedAt: user.profile_created_at ?? null,
        };

        session.set("profile", sessionProfile);

        const headers = new Headers();
        headers.append("Set-Cookie", await commitSession(session));

        // 8) Redirect to your app
        return redirect("/dashboard", { headers });
    } catch (error: any) {
        console.error("Login action error:", error);
        return {
            success: false,
            error: error?.message ?? "Unknown error",
            status: 500,
        };
    }
}

// ------- COMPONENT (client) -------
export default function Login() {
    const actionData = useActionData<{ success?: boolean; error?: string }>();

    const {
        register,
        formState: { errors, isSubmitting },
        handleSubmit,
        watch,
    } = useRemixForm<SignIn>({
        resolver,
        mode: "onChange",
    });

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMessage = searchParams.get("message");

    const profileEmail = watch("profileEmail") ?? "";
    const profilePassword = watch("profilePassword") ?? "";
    const isFormComplete = profileEmail.length > 0 && profilePassword.length > 0;
    const buttonDisabled =
        isSubmitting || Object.keys(errors).length > 0 || profilePassword.length < 8 || !isFormComplete;

    const [showToast, setShowToast] = useState(!!initialMessage);
    const [message, setMessage] = useState(initialMessage);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setShowToast(false), 5000);
            return () => clearTimeout(t);
        }
    }, [message]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md space-y-6">
                {/* Toast */}
                {showToast && message && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-emerald-200 shadow">
                        <span className="text-sm">{message}</span>
                        <button
                            className="ml-4 hover:text-emerald-100"
                            onClick={() => setShowToast(false)}
                            aria-label="Close"
                        >
                            <AiOutlineClose className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Heading */}
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Welcome to Water Tracker</h1>
                    <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-6">
                    {/* Auth toggle */}
                    <div className="flex gap-3 justify-center">
                        <button
                            className="px-4 py-2 rounded-lg bg-violet-600 text-white shadow hover:bg-violet-500 transition"
                            type="button"
                        >
                            Login
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                            type="button"
                            onClick={() => navigate("/signup")}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <Form method="post" onSubmit={handleSubmit} id="login-form" className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Email</label>
                            <div className="relative">
                                <MdOutlineEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    {...register("profileEmail")}
                                    placeholder="you@example.com"
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                    required
                                />
                            </div>
                            {errors?.profileEmail && (
                                <p className="text-rose-400 text-xs">{String(errors.profileEmail.message)}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Password</label>
                            <div className="relative">
                                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("profilePassword")}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                    required
                                />
                                <IconContext.Provider value={{ size: "1.25em" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                    >
                                        {showPassword ? <BiHide /> : <BiShow />}
                                    </button>
                                </IconContext.Provider>
                            </div>
                            {errors?.profilePassword && (
                                <p className="text-rose-400 text-xs">{String(errors.profilePassword.message)}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={buttonDisabled}
                            className={`w-full rounded-lg py-2 font-medium text-white transition ${
                                buttonDisabled ? "bg-slate-700 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-500"
                            }`}
                        >
                            {isSubmitting ? "Signing in…" : "Login"}
                        </button>

                        {/* Server error */}
                        {actionData?.error && (
                            <div className="rounded-md border border-rose-900 bg-rose-950/40 text-rose-200 text-sm px-3 py-2">
                                {actionData.error}
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}
