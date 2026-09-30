import { TodayLabel } from "./today-label";

/** Big serif page heading; `accent` is set in italic dusty rose. */
export function PageTitle({ title, accent }: { title: string; accent?: string }) {
  return (
    <header className="mb-8 md:mb-12">
      <TodayLabel className="label-caps" />
      <h1 className="mt-3 font-serif text-6xl leading-[0.95] tracking-[-0.02em] md:text-8xl">
        {title}
        {accent && (
          <>
            {" "}
            <em className="text-rose-deep">{accent}</em>
          </>
        )}
      </h1>
    </header>
  );
}
