import {
    ArrowRight,
    type LucideIcon,
} from "lucide-react";
import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "outline" | "dark";
    icon?: LucideIcon;
    iconPosition?: "left" | "right";
    className?: string;
}

export default function Button({
    children,
    variant = "primary",
    icon: Icon = ArrowRight,
    iconPosition = "right",
    className = "",
    ...props
}: ButtonProps) {
    const variants = {
        primary:
            "bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700 hover:-translate-y-0.5",
        secondary:
            "bg-green-50 text-green-700 hover:bg-green-100",
        outline:
            "border border-slate-200 bg-white text-slate-700 hover:border-green-300 hover:text-green-700",
        dark:
            "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5",
    };

    return (
        <button
            className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                px-5
                py-3
                text-sm
                font-semibold
                transition-all
                duration-200
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:px-6
                sm:py-3.5
                ${variants[variant]}
                ${className}
            `}
            {...props}
        >
            {iconPosition === "left" && <Icon size={18} />}
            <span>{children}</span>
            {iconPosition === "right" && <Icon size={18} />}
        </button>
    );
}