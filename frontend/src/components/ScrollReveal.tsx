import {
    motion,
    type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    direction?: "up" | "down" | "left" | "right" | "none";
    delay?: number;
    duration?: number;
    distance?: number;
    className?: string;
    once?: boolean;
}

export default function ScrollReveal({
    children,
    direction = "up",
    delay = 0,
    duration = 0.7,
    distance = 40,
    className = "",
    once = true,
}: ScrollRevealProps) {
    const getInitialPosition = () => {
        switch (direction) {
            case "up":
                return { opacity: 0, y: distance };

            case "down":
                return { opacity: 0, y: -distance };

            case "left":
                return { opacity: 0, x: distance };

            case "right":
                return { opacity: 0, x: -distance };

            case "none":
                return { opacity: 0 };

            default:
                return { opacity: 0, y: distance };
        }
    };

    const variants: Variants = {
        hidden: getInitialPosition(),
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    return (
        <motion.div
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{
                once,
                amount: 0.15,
            }}
        >
            {children}
        </motion.div>
    );
}