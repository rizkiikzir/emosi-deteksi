import { NavLink, useNavigate } from "react-router-dom";
import serinIcon from "../assets/serin-icon.png";
import logoPnl from "../assets/logo-Pnl.png";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Activity,
  FileText,
  History,
  Bell,
  ShieldCheck,
  Brain,
  LogOut,
} from "lucide-react";

function AppLayout({
  title,
  subtitle,
  children,
  showSessionStatus = false,
  sessionDuration = "00:00:00",
  headerActions,
}) {
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Data Mahasiswa",
      path: "/mahasiswa",
      icon: Users,
    },
    {
      label: "Sesi Konseling",
      path: "/sesi-konseling",
      icon: CalendarPlus,
    },
    {
      label: "Monitoring Emosi Real-Time",
      path: "/monitoring",
      icon: Activity,
    },
    {
      label: "Laporan Konseling",
      path: "/laporan-sesi",
      icon: FileText,
    },
    {
      label: "Riwayat Laporan Konseling",
      path: "/riwayat-laporan",
      icon: History,
    },
  ];

  const getAuthUser = () => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  };

  const authUser = getAuthUser();

  const displayName = authUser?.name || "Hendrawaty, ST., MT";
  const displayRole = authUser?.role || "Konselor";

  const handleLogout = () => {
    const confirmLogout = window.confirm("Yakin ingin logout dari sistem?");

    if (!confirmLogout) return;

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authUser");

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f7f7fb] text-slate-900">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-slate-200/80 bg-white/95 shadow-[8px_0_30px_rgba(15,23,42,0.03)] backdrop-blur">
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-indigo-100">
            <img
              src={serinIcon}
              alt="SERIN"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold leading-tight tracking-tight text-slate-950">
              SERIN
            </h1>
            <p className="text-[11px] font-medium leading-tight text-slate-500">
              Emotion Recognition System
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3.5 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-bold leading-snug transition-all",
                    isActive
                      ? "bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] text-white shadow-[0_14px_30px_rgba(91,79,233,0.20)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  ].join(" ")
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className="whitespace-normal break-words">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 px-3.5 pb-4">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck size={17} className="shrink-0 text-violet-700" />
              <span>Aman & Terpercaya</span>
            </div>
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">
              Data sesi konseling terenkripsi dan hanya dapat diakses oleh
              konselor.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl px-1 py-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src={logoPnl}
                alt="Logo Politeknik Negeri Lhokseumawe"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">Unit BK</p>
              <p className="text-xs leading-4 text-slate-500">
                Politeknik Negeri Lhokseumawe
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-[280px] min-h-screen w-[calc(100vw-280px)] overflow-x-hidden bg-transparent">
        <header className="sticky top-0 z-30 flex min-h-[88px] items-center justify-between gap-6 border-b border-slate-200/80 bg-white/90 px-8 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.025)] backdrop-blur">
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              {subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {showSessionStatus && (
              <div className="flex shrink-0 items-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-800">
                    Sesi Berlangsung
                  </span>
                </div>

                <div className="border-l border-slate-200 px-4 py-3 text-sm font-bold text-emerald-600">
                  {sessionDuration}
                </div>
              </div>
            )}

            {headerActions && (
              <div className="flex shrink-0 items-center gap-3">
                {headerActions}
              </div>
            )}

            <button
              type="button"
              className="relative rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50"
            >
              <Bell size={22} />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-700 text-[10px] font-bold text-white">
                3
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">
                {displayName
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div className="hidden xl:block">
                <p className="max-w-44 truncate text-sm font-extrabold text-slate-950">
                  {displayName}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {displayRole}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <section className="w-full max-w-full overflow-x-hidden px-7 py-6">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </section>
      </main>
    </div>
  );
}

export default AppLayout;