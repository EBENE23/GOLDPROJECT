import ScrollReveal from "./ScrollReveal";

interface SectionTitleProps {
    eyebrow?: string;
    title: string;
    description?: string;
    centered?: boolean;
}

export default function SectionTitle({
    eyebrow,
    title,
    description,
    centered = true,
}: SectionTitleProps) {
    return (
        <div
            className={
                centered
                    ? "mx-auto mb-14 max-w-3xl text-center"
                    : "mb-14 max-w-3xl"
            }
        >
            <ScrollReveal direction="up">
                {eyebrow && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {eyebrow}
                    </div>
                )}

                <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    {title}
                </h2>

                {description && (
                    <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
                        {description}
                    </p>
                )}
            </ScrollReveal>
        </div>
    );
}