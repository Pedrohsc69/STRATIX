import { PropsWithChildren } from 'react';

export function DashboardShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-10">
      <header className="mb-10 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur">
        <span className="font-display text-sm uppercase tracking-[0.3em] text-brand-light">
          STRATIX
        </span>
        <div>
          <h1 className="text-4xl font-semibold text-white">Performance management cockpit</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            Modular monolith with DDD and hexagonal boundaries prepared for IAM, ciclos,
            objetivos, OKRs, relatórios and dashboards.
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}
