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

    const isComplete =
        formData.profileUsername && formData.profileEmail && formData.profilePassword;

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-950 via-sky-900 to-slate-950 text-slate-100">
            {/* soft water glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            {/* bubbles */}
            {/*<div className="pointer-events-none absolute inset-0">*/}
            {/*    <div className="absolute left-[12%] top-[18%] h-2 w-2 animate-[ping_6s_linear_infinite] rounded-full bg-cyan-300/60" />*/}
            {/*    <div className="absolute left-[22%] top-[72%] h-3 w-3 animate-[ping_7s_linear_infinite] rounded-full bg-sky-300/50" />*/}
            {/*    <div className="absolute left-[78%] top-[32%] h-1.5 w-1.5 animate-[ping_5s_linear_infinite] rounded-full bg-teal-300/60" />*/}
            {/*    <div className="absolute left-[58%] top-[82%] h-2.5 w-2.5 animate-[ping_8s_linear_infinite] rounded-full bg-cyan-200/50" />*/}
            {/*</div>*/}

            <div className="relative z-10 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md space-y-6">
                    {/* Heading */}
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                            Create your{" "}
                            <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
                Water Tracker
              </span>{" "}
                            account
                        </h1>
                        <p className="text-sky-200/70 text-sm mt-1">
                            Conserve water today so the desert can thrive tomorrow.
                        </p>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl border border-sky-300/10 bg-sky-900/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
                        {/* Auth toggle */}
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="px-4 py-2 rounded-lg border border-sky-400/30 text-sky-100 bg-sky-800/30 hover:bg-sky-800/50 transition"
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow hover:from-cyan-500 hover:to-sky-500 transition"
                            >
                                Sign Up
                            </button>
                        </div>

                        <Form id="signup" method="post" className="space-y-4">
                            {/* Username */}
                            <div className="space-y-1">
                                <label className="block text-sm text-sky-100/90">Username</label>
                                <div className="relative">
                                    <ImProfile className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-200/70" />
                                    <input
                                        type="text"
                                        name="profileUsername"
                                        placeholder="e.g. desert_saver"
                                        className="w-full rounded-xl bg-sky-900/40 border border-sky-400/30 px-3 py-2 pl-10 text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                                        value={formData.profileUsername}
                                        onChange={(e) =>
                                            setFormData({ ...formData, profileUsername: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-sm text-sky-100/90">Email</label>
                                <div className="relative">
                                    <MdOutlineEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-200/70" />
                                    <input
                                        type="email"
                                        name="profileEmail"
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl bg-sky-900/40 border border-sky-400/30 px-3 py-2 pl-10 text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                                        value={formData.profileEmail}
                                        onChange={(e) =>
                                            setFormData({ ...formData, profileEmail: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="block text-sm text-sky-100/90">Password</label>
                                <div className="relative">
                                    <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-200/70" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="profilePassword"
                                        placeholder="••••••••"
                                        className="w-full rounded-xl bg-sky-900/40 border border-sky-400/30 px-3 py-2 pl-10 text-white placeholder:text-sky-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                                        value={formData.profilePassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, profilePassword: e.target.value })
                                        }
                                        required
                                    />
                                    <IconContext.Provider value={{ size: "1.25em" }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-200/70 hover:text-sky-100"
                                        >
                                            {showPassword ? <BiHide /> : <BiShow />}
                                        </button>
                                    </IconContext.Provider>
                                </div>
                            </div>

                            {/* Local + server error */}
                            {(errorMessage || (actionData as any)?.error) && (
                                <p className="text-rose-300 text-xs">
                                    {errorMessage || (actionData as any)?.error}
                                </p>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!isComplete}
                                className={`w-full rounded-xl py-2.5 font-medium text-white transition
                  ${
                                    isComplete
                                        ? "bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 shadow-lg"
                                        : "bg-sky-700/40 cursor-not-allowed"
                                }`}
                            >
                                Sign Up
                            </button>
                        </Form>
                    </div>

                    {/* Footer hint */}
                    <p className="text-center text-xs text-sky-200/60">
                        🌵 Small choices add up — track use, reduce waste, protect the desert.
                    </p>
                </div>
            </div>
        </div>
    );
}

