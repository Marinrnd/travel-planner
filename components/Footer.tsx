export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-iridescent shadow-glow" aria-hidden />
          <span className="font-sans text-base font-semibold tracking-tight">
            Travel<span className="text-iridescent">OS</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
          <a href="#how" className="hover:text-white">
            How it works
          </a>
          <a href="#templates" className="hover:text-white">
            Templates
          </a>
          <a href="#reviews" className="hover:text-white">
            Reviews
          </a>
          <a href="#get" className="hover:text-white">
            Get the planner
          </a>
        </nav>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Travel OS · A demo experience
        </p>
      </div>
    </footer>
  );
}
