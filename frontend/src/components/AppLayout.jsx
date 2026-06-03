import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import serinIcon from "../assets/serin-icon.png";
import logoPnl from "../assets/logo-Pnl.png";
import { getAssetUrl } from "../services/api";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  Activity,
  FileText,
  History,
  Menu,
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [headerProfile, setHeaderProfile] = useState({
    name: "Admin Unit BK",
    role: "Admin",
    photo: "",
  });

  useEffect(() => {
    const loadHeaderProfile = () => {
      const savedUser = safeParse(localStorage.getItem("serinUser"));

      setHeaderProfile({
        name: savedUser?.name || "Admin Unit BK",
        role: savedUser?.role || "Admin",
        photo: savedUser?.photo_url || "",
      });
    };

    loadHeaderProfile();

    window.addEventListener("serinUserProfileUpdated", loadHeaderProfile);
    window.addEventListener("storage", loadHeaderProfile);

    return () => {
      window.removeEventListener("serinUserProfileUpdated", loadHeaderProfile);
      window.removeEventListener("storage", loadHeaderProfile);
    };
  }, []);

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

  const displayName = headerProfile.name;
  const displayRole = headerProfile.role;
  const displayPhoto = headerProfile.photo;

  const sidebarWidth = isSidebarCollapsed ? "w-[88px]" : "w-[280px]";
  const mainOffset = isSidebarCollapsed
    ? "ml-[88px] w-[calc(100vw-88px)]"
    : "ml-[280px] w-[calc(100vw-280px)]";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f7f7fb] text-slate-900">
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen ${sidebarWidth} flex-col border-r border-slate-200/80 bg-white/95 shadow-[8px_0_30px_rgba(15,23,42,0.03)] backdrop-blur transition-all duration-300`}
      >
        <div
          className={`flex h-20 shrink-0 items-center border-b border-slate-100 px-5 transition-all duration-300 ${isSidebarCollapsed ? "justify-center px-3" : "gap-3"
            }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-indigo-100">
            <img
              src={serinIcon}
              alt="SERIN"
              className="h-10 w-10 object-contain"
            />
          </div>

          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-[18px] font-extrabold leading-tight tracking-tight text-slate-950">
                SERIN
              </h1>
              <p className="text-[11px] font-medium leading-tight text-slate-500">
                Emotion Recognition System
              </p>
            </div>
          )}
        </div>

        <nav
          className={`flex-1 space-y-1.5 py-4 transition-all duration-300 ${isSidebarCollapsed ? "px-3" : "px-3.5"
            }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  [
                    "group flex items-center rounded-2xl text-[13px] font-bold leading-snug transition-all",
                    isSidebarCollapsed
                      ? "h-12 justify-center px-0"
                      : "gap-3 px-4 py-2.5",
                    isActive
                      ? "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <Icon size={19} className="shrink-0" />

                {!isSidebarCollapsed && (
                  <span className="whitespace-normal break-words">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div
          className={`shrink-0 px-3.5 pb-4 transition-all duration-300 ${isSidebarCollapsed ? "px-3" : ""
            }`}
        >
          <div
            className={`flex items-center rounded-2xl px-1 py-1 ${isSidebarCollapsed ? "justify-center" : "gap-3"
              }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src={logoPnl}
                alt="Logo Politeknik Negeri Lhokseumawe"
                className="h-10 w-10 object-contain"
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900">
                  Unit BK
                </p>
                <p className="text-xs leading-4 text-slate-500">
                  Politeknik Negeri Lhokseumawe
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`${mainOffset} min-h-screen overflow-x-hidden bg-transparent transition-all duration-300`}
      >
        <header className="sticky top-0 z-30 flex min-h-[88px] items-center justify-between gap-6 border-b border-slate-200/80 bg-white/90 px-8 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.025)] backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#2563EB]"
              title={isSidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-1.5 text-xs font-semibold text-slate-500">
                {subtitle}
              </p>
            </div>
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

            <div className="flex shrink-0 items-center gap-3 rounded-3xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">
                {displayPhoto ? (
                  <img
                    src={getAssetUrl(displayPhoto)}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitial(displayName)
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="hidden text-left xl:block"
                title="Lihat profil"
              >
                <p className="max-w-44 truncate text-sm font-extrabold text-slate-950 transition hover:text-[#2563EB]">
                  {displayName}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {displayRole}
                </p>
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

function getInitial(name) {
  if (!name) return "AU";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default AppLayout;