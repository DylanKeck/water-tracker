import { useState } from "react";
import CircularProgressBar from "../components/progress";

type Activity = {
    id: number;
    name: string;
    gallons: number;
    timestamp?: number;
};

type AggregatedActivity = Activity & {
    count: number;
};

export default function Dashboard() {
    const budget = 80;

    const activities: Activity[] = [
        {id: 1, name: "5 Minute Shower", gallons: 15},
        {id: 2, name: "10 Minute Shower", gallons: 30},
        {id: 3, name: "Toilet Flush", gallons: 3},
        {id: 4, name: "Dishwasher Load", gallons: 5},
        {id: 5, name: "Laundry Load", gallons: 23},
        {id: 6, name: "Hand Wash Dishes", gallons: 4},
        {id: 7, name: "Garden Watering", gallons: 12},
        {id: 8, name: "Brush Teeth", gallons: 1},
        {id: 9, name: "Shave", gallons: 2},
        {id: 10, name: "Take a Bath", gallons: 45},
    ];

    const generateDummyLogs = (): Activity[] => {
        const logs: Activity[] = [];
        const now = new Date();
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const day = new Date(now);
            day.setDate(now.getDate() - dayOffset);
            const entries = 1 + Math.floor(Math.random() * 3);
            for (let e = 0; e < entries; e++) {
                const act = activities[Math.floor(Math.random() * activities.length)];
                const ts = new Date(day);
                ts.setHours(6 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), 0, 0);
                logs.push({id: act.id, name: act.name, gallons: act.gallons, timestamp: ts.getTime()});
            }
        }
        logs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return logs;
    };

    const [logs, setLogs] = useState<Activity[]>(() => generateDummyLogs());
    const [selectedExtraId, setSelectedExtraId] = useState<number | null>(activities[4]?.id ?? null);
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const openDay = (d: Date) => setModalDate(new Date(d));
    const closeModal = () => setModalDate(null);

    const formatTime = (ts?: number) =>
        ts ? new Date(ts).toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"}) : "";

    const isSameDay = (ts: number, reference: Date) => {
        const d = new Date(ts);
        return (
            d.getFullYear() === reference.getFullYear() &&
            d.getMonth() === reference.getMonth() &&
            d.getDate() === reference.getDate()
        );
    };

    const logActivity = (activity: Activity) => {
        const entry: Activity = {...activity, timestamp: Date.now()};
        setLogs((prev) => [...prev, entry]);
    };

    const today = new Date();
    const todaysLogs = logs.filter((l) => l.timestamp && isSameDay(l.timestamp, today));
    const gallonsUsed = todaysLogs.reduce((s, a) => s + a.gallons, 0);
    const percent = (gallonsUsed / budget) * 100;
    const overBudget = gallonsUsed > budget;

    const aggregatedToday: AggregatedActivity[] = Object.values(
        todaysLogs.reduce((acc: Record<number, AggregatedActivity>, a) => {
            if (!acc[a.id]) acc[a.id] = {...a, count: 0};
            acc[a.id].count += 1;
            return acc;
        }, {})
    );

    const removeActivity = (activityId: number) => {
        setLogs((prev) => {
            for (let i = prev.length - 1; i >= 0; i--) {
                const entry = prev[i];
                if (entry.id === activityId && entry.timestamp && isSameDay(entry.timestamp, today)) {
                    const copy = prev.slice();
                    copy.splice(i, 1);
                    return copy;
                }
            }
            return prev;
        });
    };

    const getDayLabel = (d: Date) => d.toLocaleDateString("en-US", {weekday: "short"});
    const weeklyTotals: { date: Date; total: number }[] = Array.from({length: 7}).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const total = logs.reduce((s, a) => {
            if (!a.timestamp) return s;
            const ts = a.timestamp;
            if (isSameDay(ts, d)) return s + a.gallons;
            return s;
        }, 0);
        return {date: d, total};
    });

    return (
        <div
            className="relative h-screen overflow-hidden bg-gradient-to-b from-sky-950 via-sky-900 to-slate-950 text-slate-100 flex flex-col">
            {/* Soft cyan glow */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"/>

            {/* Header */}
            <div className="relative z-10 shrink-0 flex flex-wrap items-center justify-center px-4 py-4 md:flex-nowrap">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <div className="text-center">
                        <img
                            src={"/splish-logo.png"}
                            alt="SPLISH Logo"
                            className="h-14 sm:h-16 md:h-18 mx-auto"
                        />
                        <h2 className="text-lg sm:text-xl font-semibold mt-2">
            <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
              Your Water Usage Today
            </span>
                        </h2>
                        <h3
                            className={`text-base sm:text-xl font-bold ${
                                overBudget ? "text-rose-300" : "text-sky-100"
                            }`}
                        >
                            {gallonsUsed} / {budget} Gallons
                        </h3>
                    </div>
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36">
                        <CircularProgressBar percentage={(gallonsUsed / budget) * 100}/>
                    </div>
                </div>

                <div className="absolute right-4 top-4 md:right-8 md:top-6">
                    <button
                        className="rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-1.5 text-sm sm:text-base text-white shadow hover:from-cyan-500 hover:to-sky-500 transition">
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main grid */}
            <div className="relative z-10 flex-1 overflow-hidden">
                <div className="h-full px-4 pb-4">
                    <div
                        className="mx-auto grid h-full w-11/12 gap-4 rounded-3xl border border-sky-300/10 bg-sky-900/20 p-3 backdrop-blur-xl md:w-3/4 md:grid-cols-2 overflow-hidden">
                        {/* LEFT: Log an Activity */}
                        <div className="min-h-0 overflow-auto">
                            <h2 className="my-3 text-center text-lg font-semibold sm:text-xl">
                                Log an Activity
                            </h2>

                            {activities.slice(0, 4).map((activity) => (
                                <div
                                    key={activity.id}
                                    className="my-2 w-full rounded-2xl border border-sky-400/30 bg-sky-900/30 p-2 shadow-sm"
                                >
                                    <div className="grid grid-cols-3 items-center gap-3">
                                        <div className="col-span-2">
                                            <h3 className="mb-1 text-sm font-semibold sm:text-base">
                                                {activity.name}
                                            </h3>
                                            <p className="text-xs italic text-sky-200/80 sm:text-sm">
                                                ≈ {activity.gallons} gallons
                                            </p>
                                        </div>
                                        <button
                                            className="rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-2 text-sm text-white shadow hover:from-cyan-500 hover:to-sky-500 transition sm:px-4 sm:py-3"
                                            onClick={() => logActivity(activity)}
                                        >
                                            Log
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Dropdown for additional activities */}
                            {activities.length > 4 && (
                                <div
                                    className="my-2 w-full rounded-2xl border border-sky-400/30 bg-sky-900/30 p-3 shadow-sm">
                                    <div className="grid grid-cols-3 items-center gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-sky-100/90">
                                                More Activities
                                            </label>
                                            <select
                                                value={selectedExtraId ?? undefined}
                                                onChange={(e) => setSelectedExtraId(Number(e.target.value))}
                                                className="w-full rounded-lg border border-sky-400/30 bg-sky-900/40 px-2 py-1 text-sky-50 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:text-base"
                                                aria-label="Select extra activity"
                                            >
                                                {activities.slice(4).map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name} — {a.gallons} gal
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            className="rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-2 text-sm text-white shadow hover:from-cyan-500 hover:to-sky-500 transition sm:px-4 sm:py-3"
                                            onClick={() => {
                                                if (!selectedExtraId) return;
                                                const act = activities.find((a) => a.id === selectedExtraId);
                                                if (act) logActivity(act);
                                            }}
                                        >
                                            Log
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Today's Activities */}
                        <div className="min-h-0 overflow-auto">
                            <h2 className="my-3 text-center text-lg font-semibold sm:text-xl">
                                Today&apos;s Activities
                            </h2>

                            {aggregatedToday.length === 0 ? (
                                <p className="text-center text-sky-200/80 italic">
                                    No activities logged yet.
                                </p>
                            ) : (
                                aggregatedToday.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className={`my-2 w-full rounded-2xl border p-3 shadow-sm ${
                                            overBudget
                                                ? "border-rose-400/40 bg-rose-900/20"
                                                : "border-sky-400/30 bg-sky-900/30"
                                        }`}
                                    >
                                        <div className="grid grid-cols-3 items-center gap-3">
                                            <div className="col-span-2">
                                                <h3 className="mb-1 text-sm font-semibold sm:text-base">
                                                    {activity.name} {activity.count > 1 ? `×${activity.count}` : ""}
                                                </h3>
                                                <p className="text-xs italic text-sky-200/80 sm:text-sm">
                                                    ≈ {activity.gallons * activity.count} gallons total
                                                </p>
                                            </div>
                                            <button
                                                className="rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2 text-sm text-white shadow hover:from-rose-400 hover:to-rose-500 transition sm:px-4 sm:py-3"
                                                onClick={() => removeActivity(activity.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* WEEKLY VIEW */}
            <div className="relative z-10 shrink-0 mx-auto w-11/12 md:w-3/4 pb-3">
                <h2 className="mb-1 text-center text-base font-semibold sm:text-lg">
                    Past 7 Days
                </h2>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {weeklyTotals.map(({date, total}) => (
                        <div key={date.toDateString()} className="flex flex-col items-center gap-1">
                            <div className="pt-1 text-xs font-medium text-sky-100 sm:text-sm">
                                {getDayLabel(date)}
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => openDay(date)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") openDay(date);
                                }}
                                className="h-14 w-14 cursor-pointer sm:h-16 sm:w-16"
                            >
                                <CircularProgressBar
                                    percentage={Math.min(100, (total / budget) * 100)}
                                    centerLabel={total}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL (keeps its own scroll if needed) */}
            {modalDate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 hover:cursor-pointer"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Activities for ${modalDate.toDateString()}`}
                >
                    <div className="absolute inset-0 bg-black/60"/>
                    <div
                        className="relative z-10 w-full max-w-md rounded-2xl border border-sky-400/20 bg-sky-950/60 p-4 shadow-xl backdrop-blur-xl sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold sm:text-lg text-sky-100">
                                Activities —{" "}
                                {modalDate.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </h3>
                            <button
                                className="px-2 py-1 text-sm text-sky-200 hover:text-white hover:cursor-pointer"
                                onClick={closeModal}
                            >
                                Close
                            </button>
                        </div>
                        <div className="max-h-72 space-y-3 overflow-auto sm:max-h-80">
                            {(() => {
                                const entries = logs
                                    .filter((l) => l.timestamp && isSameDay(l.timestamp, modalDate))
                                    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                                if (entries.length === 0) {
                                    return (
                                        <p className="text-sm italic text-sky-200/80">
                                            No activities logged that day.
                                        </p>
                                    );
                                }
                                return entries.map((e, idx) => (
                                    <div
                                        key={`${e.id}-${e.timestamp}-${idx}`}
                                        className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-900/30 p-2 sm:p-3"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-sky-100">{e.name}</div>
                                            <div className="text-xs text-sky-200/70">{formatTime(e.timestamp)}</div>
                                        </div>
                                        <div className="text-sm font-semibold text-sky-50">{e.gallons} gal</div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
