import type { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?: "green" | "blue" | "orange" | "red" | "slate";
}

export default function Badge({
    children,
    variant = "green",
}: BadgeProps) {
    const variants = {
        green: "border-green-100 bg-green-50 text-green-700",
        blue: "border-blue-100 bg-blue-50 text-blue-700",
        orange: "border-orange-100 bg-orange-50 text-orange-700",
        red: "border-red-100 bg-red-50 text-red-700",
        slate: "border-slate-200 bg-slate-50 text-slate-600",
    };

    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-semibold
                ${variants[variant]}
            `}
        >
            {children}
        </span>
    );
}