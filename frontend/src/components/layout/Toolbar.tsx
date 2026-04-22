import { cn } from "../ui";

export function Toolbar(props: {
  title: string;
  right?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            {props.title}
          </h1>
          {props.subtitle ? (
            <p className="text-surface-500 mt-1.5 font-medium">
              {props.subtitle}
            </p>
          ) : (
            <div className="h-1 w-12 bg-[hsl(var(--primary)/0.2)] rounded-full mt-2" />
          )}
        </div>
        <div className="flex items-center gap-3">{props.right}</div>
      </div>
    </div>
  );
}
