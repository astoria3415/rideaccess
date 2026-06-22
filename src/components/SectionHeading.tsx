import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  return (
    <Reveal>
      <div
        className={
          align === "center"
            ? "mx-auto max-w-2xl text-center"
            : "max-w-2xl text-left"
        }
      >
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
        {description && (
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
    </Reveal>
  );
}
