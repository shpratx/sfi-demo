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

  const initials = user?.fullName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "";

  return (
    <div className="min-h-screen bg-bg-page">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-hive-yellow focus:p-4 focus:text-black">Skip to content</a>
      <header className="border-b border-[#2E2E2E]">
        <nav aria-label="Main navigation" className="flex h-12 items-center bg-bg-app px-3.5">
          <Link to="/" className="mr-1.5 flex shrink-0 items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" fill="#F5C518" opacity="0.18"/>
              <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" stroke="#F5C518" strokeWidth="1.5"/>
              <path d="M16 8.5L23 12.75V21.25L16 25.5L9 21.25V12.75L16 8.5Z" fill="#F5C518" opacity="0.45"/>
              <path d="M16 13L19.5 15V19L16 21L12.5 19V15L16 13Z" fill="#F5C518"/>
            </svg>
            <span className="text-[13px] font-extrabold tracking-[0.06em]"><span className="text-white">THE</span><span className="text-hive-yellow">HIVE</span></span>
          </Link>

          <div className="ml-3 flex h-12 items-end">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex h-12 items-center border-b-2 border-hive-yellow px-3.5 text-xs font-medium text-hive-yellow">
                Driver Check In Admin
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[160px] rounded-[3px] bg-bg-surface p-1 shadow-md" sideOffset={4}>
                  <DropdownMenu.Item asChild>
                    <Link to="/admin/driver-checkin" className="block rounded-[3px] px-3 py-2 text-xs text-text-primary hover:bg-[#F9F9F9]">
                      Driver Check In
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link to="/admin/organizations" className="block rounded-[3px] px-3 py-2 text-xs text-text-primary hover:bg-[#F9F9F9]">
                      Organizations
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#A0A0A0]">{user.fullName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-white hover:text-hive-yellow"
              >
                Log Out
              </button>
              <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-hive-yellow text-[10px] font-bold text-text-primary">
                {initials}
              </div>
            </div>
          )}
        </nav>
      </header>
      <main id="main-content" className="bg-[#F5F5F5]">
        <Outlet />
      </main>
    </div>
  );
}
