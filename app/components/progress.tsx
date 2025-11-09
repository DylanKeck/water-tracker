import React from "react";

type Props = {
    percentage?: number;
    centerLabel?: React.ReactNode; // optional override for the centered text
};

const CircularProgressBar: React.FC<Props> = ({ percentage = 0, centerLabel }) => {
    // Clamp the value between 0 and 120
    const progress = Math.min(Math.max(percentage, 0), 120);

    // Circle setup
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    // Counterclockwise stroke offset (supports overage up to 120)
    const offset = circumference - (progress / 120) * circumference;

    // Determine color: blue for 0–100%, red for 101–120%
    const color = progress > 100 ? "#ef4444" : "#3b82f6"; // Tailwind blue-500 / red-500

    return (
        <div className="relative flex items-center justify-center">
            <svg
                className="transform rotate-90"
                width="100%" /* make responsive to parent size */
                height="100%" /* make responsive to parent size */
                viewBox="0 0 160 160"
                aria-hidden="true"
            >
                {/* Background circle */}
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb" // Tailwind gray-200
                    strokeWidth="12"
                />

                {/* Progress circle */}
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{
                        transformOrigin: "50% 50%",
                        transform: "scaleX(-1)", // mirror so it animates the expected direction
                        transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
                    }}
                />
            </svg>

            {/* Centered label: use provided centerLabel or default to percent */}
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-semibold pointer-events-none">
                {centerLabel ?? `${Math.round(progress)}%`}
            </div>
        </div>
    );
};

export default CircularProgressBar;