import { Link, Outlet, useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/services/authApi";

export default function AppShell() {
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    storeLogout();
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-hive-yellow focus:text-black focus:z-50">Skip to content</a>
      <header className="border-b border-[#333]">
      <nav aria-label="Main navigation" className="flex h-12 items-center justify-between bg-bg-app px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-hive-yellow">
            The Hive
          </Link>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="text-sm text-white hover:text-hive-yellow">
              Administration
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] rounded bg-bg-surface p-1 shadow-md"
                sideOffset={4}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    to="/admin/driver-checkin"
                    className="block rounded px-3 py-2 text-sm text-text-primary hover:bg-bg-page"
                  >
                    Driver Check In
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    to="/admin/organizations"
                    className="block rounded px-3 py-2 text-sm text-text-primary hover:bg-bg-page"
                  >
                    Organizations
                  </Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">{user.fullName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-white hover:text-hive-yellow"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
      </header>
      <main id="main-content" className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
