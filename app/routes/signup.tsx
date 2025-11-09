import { ImProfile } from "react-icons/im";
import { MdOutlineEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { IconContext } from "react-icons";
import { BiHide, BiShow } from "react-icons/bi";
import { Form, redirect, useActionData, useNavigate } from "react-router";
import { useState } from "react";
import type { Route } from "../+types/root";

/**
 * Signup with Neon Postgres via Postgres.js (`postgres`)
 * Table:
 *   profile(
 *     profile_id uuid primary key default uuid_generate_v7(),
 *     profile_base_goal_liters int default 110,
 *     profile_created_at timestamptz default now(),
 *     profile_email varchar(255) not null,
 *     profile_password_hash text not null,
 *     profile_reduction_percent int default 0,
 *     profile_username varchar(20) not null
 *   )
 */
export async function action({ request }: Route.ActionArgs) {
    try {
        const form = await request.formData();
        const profile = Object.fromEntries(form) as Record<string, string>;

        // Basic validation
        if (!profile.profileUsername || !profile.profileEmail || !profile.profilePassword) {
            return { success: false, error: "All fields are required." };
        }
        if (profile.profileUsername.length > 20) {
            return { success: false, error: "Username must be 20 characters or fewer." };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.profileEmail)) {
            return { success: false, error: "Please enter a valid email address." };
        }
        if (profile.profilePassword.length < 8) {
            return { success: false, error: "Password must be at least 8 characters long." };
        }

        // Server-only deps
        const [{ default: postgres }, bcrypt] = await Promise.all([
            import("postgres"),
            import("bcryptjs"),
        ]);

        // Singleton client (prevents new connections on HMR)
        // @ts-ignore
        if (!globalThis.__sql) {
            // If DATABASE_URL has ?sslmode=require you can omit `ssl: 'require'`
            // @ts-ignore
            globalThis.__sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 10 });
        }
        // @ts-ignore
        const sql: import("postgres").Sql = globalThis.__sql;

        // Optional: guard against duplicate emails (your table has no UNIQUE constraint)
        const existing = await sql<{ exists: boolean }[]>`
      select exists(select 1 from profile where profile_email = ${profile.profileEmail}) as exists
    `;
        if (existing[0]?.exists) {
            return { success: false, error: "An account with this email already exists." };
        }

        const hash = await bcrypt.hash(profile.profilePassword, 12);

        // Insert
        await sql`
      insert into profile (profile_username, profile_email, profile_password_hash)
      values (${profile.profileUsername}, ${profile.profileEmail}, ${hash})
    `;

        return redirect("/login");
    } catch (err: any) {
        return { success: false, error: err?.message ?? "Unknown error", status: 500 };
    }
}

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage] = useState("");
    const navigate = useNavigate();
    const actionData = useActionData<any>();
    const [formData, setFormData] = useState({
        profileUsername: "",
        profileEmail: "",
        profilePassword: "",
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Create your account</h1>
                    <p className="text-slate-400 text-sm mt-1">Join Water Tracker</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-6">
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-violet-600 text-white shadow hover:bg-violet-500 transition"
                        >
                            Sign Up
                        </button>
                    </div>

                    <Form id="signup" method="post" className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Username</label>
                            <div className="relative">
                                <ImProfile className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    name="profileUsername"
                                    placeholder="e.g. john_doe"
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                    value={formData.profileUsername}
                                    onChange={(e) => setFormData({ ...formData, profileUsername: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Email</label>
                            <div className="relative">
                                <MdOutlineEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    name="profileEmail"
                                    placeholder="you@example.com"
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                    value={formData.profileEmail}
                                    onChange={(e) => setFormData({ ...formData, profileEmail: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Password</label>
                            <div className="relative">
                                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="profilePassword"
                                    placeholder="••••••••"
                                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
                                    value={formData.profilePassword}
                                    onChange={(e) => setFormData({ ...formData, profilePassword: e.target.value })}
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
                        </div>

                        {(errorMessage || (actionData as any)?.error) && (
                            <p className="text-rose-400 text-xs">{errorMessage || (actionData as any)?.error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={
                                !formData.profileUsername ||
                                !formData.profileEmail ||
                                !formData.profilePassword
                            }
                            className={`w-full rounded-lg py-2 font-medium text-white transition
                ${
                                formData.profileUsername &&
                                formData.profileEmail &&
                                formData.profilePassword
                                    ? "bg-violet-600 hover:bg-violet-500"
                                    : "bg-slate-700 cursor-not-allowed"
                            }`}
                        >
                            Sign Up
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
