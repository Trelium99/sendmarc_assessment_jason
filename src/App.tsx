import { NavLink, Outlet } from "react-router";
import { ThemeModeToggle } from "./components/theme_mode_toggle.tsx";

export function App() {
  return (
    <div className="min-h-screen font-sans text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-6">
          <p className="font-semibold">Labs</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? "font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/domain-score"
                className={({ isActive }) =>
                  isActive
                    ? "font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                Domain score
              </NavLink>
            </nav>
            <ThemeModeToggle />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
