import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import {
  Search,
  CalendarDays,
  CalendarCheck,
  Radio,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  Eye,
  Play,
  Trash2,
} from "lucide-react";

const CURRENT_SESSION_KEY = "currentCounselingSession";
const SESSIONS_STORAGE_KEY = "counselingSessions";

const SAMPLE_SESSIONS = [
  {
    id: "KS-24052026-001",
    sessionId: "KS-24052026-001",
    studentName: "Andi Ramadhan",
    nim: "2022573010105",
    programStudy: "Teknik Informatika",
    topic: "Konseling Akademik",
    counselingType: "Konseling Akademik",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "24 Mei 2026",
    startTime: "09:00",
    duration: "00:30:00",
    status: "Berjalan",
  },
  {
    id: "KS-24052026-002",
    sessionId: "KS-24052026-002",
    studentName: "Siti Rahmawati",
    nim: "2022573010112",
    programStudy: "Teknik Informatika",
    topic: "Kecemasan Ujian",
    counselingType: "Konseling Akademik",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "24 Mei 2026",
    startTime: "10:30",
    duration: "00:45:00",
    status: "Dijadwalkan",
  },
  {
    id: "KS-23052026-015",
    sessionId: "KS-23052026-015",
    studentName: "Muhammad Fikri",
    nim: "2022573010118",
    programStudy: "Teknik Informatika",
    topic: "Konseling Pribadi",
    counselingType: "Konseling Pribadi",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "23 Mei 2026",
    startTime: "13:00",
    duration: "00:25:00",
    status: "Selesai",
  },
  {
    id: "KS-22052026-011",
    sessionId: "KS-22052026-011",
    studentName: "Nadia Aulia",
    nim: "2022573010125",
    programStudy: "Teknik Informatika",
    topic: "Adaptasi Kuliah",
    counselingType: "Konseling Akademik",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "22 Mei 2026",
    startTime: "08:15",
    duration: "00:20:00",
    status: "Selesai",
  },
  {
    id: "KS-21052026-007",
    sessionId: "KS-21052026-007",
    studentName: "Rizky Kurniawan",
    nim: "2022573010203",
    programStudy: "Teknik Informatika",
    topic: "Konsultasi Pribadi",
    counselingType: "Konseling Pribadi",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "21 Mei 2026",
    startTime: "14:00",
    duration: "00:35:00",
    status: "Dibatalkan",
  },
  {
    id: "KS-21052026-006",
    sessionId: "KS-21052026-006",
    studentName: "Fadila Ananda",
    nim: "2022573010307",
    programStudy: "Teknik Informatika",
    topic: "Perencanaan Studi",
    counselingType: "Konseling Karier",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "21 Mei 2026",
    startTime: "11:00",
    duration: "00:40:00",
    status: "Selesai",
  },
];

function SessionPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("Semua Tanggal");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [typeFilter, setTypeFilter] = useState("Semua Jenis");
  const [counselorFilter, setCounselorFilter] = useState("Semua Konselor");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const collectedSessions = [];

    const savedSessions = safeParse(localStorage.getItem(SESSIONS_STORAGE_KEY));
    const currentSession = safeParse(localStorage.getItem(CURRENT_SESSION_KEY));

    if (Array.isArray(savedSessions)) {
      savedSessions.forEach((session) => {
        collectedSessions.push(normalizeSession(session));
      });
    }

    if (currentSession) {
      collectedSessions.unshift(normalizeSession(currentSession, "Berjalan"));
    }

    if (collectedSessions.length > 0) {
      setSessions(removeDuplicateSessions(collectedSessions));
    } else {
      setSessions(SAMPLE_SESSIONS);
    }
  }, []);

  const dateOptions = useMemo(() => {
    return [
      "Semua Tanggal",
      ...new Set(sessions.map((session) => session.startDate).filter(Boolean)),
    ];
  }, [sessions]);

  const statusOptions = useMemo(() => {
    return [
      "Semua Status",
      ...new Set(sessions.map((session) => session.status).filter(Boolean)),
    ];
  }, [sessions]);

  const typeOptions = useMemo(() => {
    return [
      "Semua Jenis",
      ...new Set(
        sessions.map((session) => session.counselingType).filter(Boolean)
      ),
    ];
  }, [sessions]);

  const counselorOptions = useMemo(() => {
    return [
      "Semua Konselor",
      ...new Set(
        sessions.map((session) => session.counselorName).filter(Boolean)
      ),
    ];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const search = keyword.toLowerCase().trim();

    return sessions.filter((session) => {
      const matchKeyword =
        !search ||
        session.sessionId?.toLowerCase().includes(search) ||
        session.studentName?.toLowerCase().includes(search) ||
        session.nim?.toLowerCase().includes(search) ||
        session.topic?.toLowerCase().includes(search) ||
        session.counselingType?.toLowerCase().includes(search);

      const matchDate =
        dateFilter === "Semua Tanggal" || session.startDate === dateFilter;

      const matchStatus =
        statusFilter === "Semua Status" || session.status === statusFilter;

      const matchType =
        typeFilter === "Semua Jenis" || session.counselingType === typeFilter;

      const matchCounselor =
        counselorFilter === "Semua Konselor" ||
        session.counselorName === counselorFilter;

      return (
        matchKeyword &&
        matchDate &&
        matchStatus &&
        matchType &&
        matchCounselor
      );
    });
  }, [
    sessions,
    keyword,
    dateFilter,
    statusFilter,
    typeFilter,
    counselorFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / rowsPerPage)
  );

  const visibleSessions = filteredSessions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    dateFilter,
    statusFilter,
    typeFilter,
    counselorFilter,
    rowsPerPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const today = sessions.filter((session) =>
      isTodaySession(session.startDate)
    ).length;
    const active = sessions.filter((session) =>
      ["Berjalan", "Aktif", "active"].includes(session.status)
    ).length;
    const finishedThisMonth = sessions.filter((session) =>
      isFinishedThisMonth(session)
    ).length;

    return {
      total,
      today,
      active,
      finishedThisMonth,
      avgDuration: getAverageDuration(sessions),
    };
  }, [sessions]);

  const resetFilter = () => {
    setKeyword("");
    setDateFilter("Semua Tanggal");
    setStatusFilter("Semua Status");
    setTypeFilter("Semua Jenis");
    setCounselorFilter("Semua Konselor");
  };

  const firstItemNumber =
    filteredSessions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const lastItemNumber = Math.min(
    currentPage * rowsPerPage,
    filteredSessions.length
  );

  const handleContinueMonitoring = (session) => {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));

    navigate("/monitoring", {
      state: {
        session,
      },
    });
  };

  const handleViewSession = (session) => {
    localStorage.setItem("selectedSessionDetail", JSON.stringify(session));

    if (session.status === "Selesai") {
      const reports = safeParse(localStorage.getItem("sessionReports")) || [];

      const matchedReport = Array.isArray(reports)
        ? reports.find((report) => {
            return (
              report.sessionId === session.sessionId ||
              report.sessionInfo?.sessionId === session.sessionId
            );
          })
        : null;

      if (!matchedReport) {
        alert("Laporan untuk sesi ini belum ditemukan.");
        return;
      }

      navigate("/laporan-sesi", {
        state: {
          report: matchedReport,
        },
      });

      return;
    }

    navigate("/monitoring", {
      state: {
        session,
      },
    });
  };

  const handleDeleteSession = (session) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus sesi ${session.sessionId}?`
    );

    if (!confirmDelete) return;

    const nextSessions = sessions.filter(
      (item) => item.sessionId !== session.sessionId
    );

    setSessions(nextSessions);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions));

    const currentSession = safeParse(localStorage.getItem(CURRENT_SESSION_KEY));

    if (currentSession?.sessionId === session.sessionId) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  };

  return (
    <AppLayout
      title="Sesi Konseling"
      subtitle="Dashboard > Sesi Konseling"
      showSessionStatus={false}
    >
      <div className="space-y-5">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<CalendarDays size={21} />}
            iconClass="bg-gradient-to-br from-[#EEF2FF] to-white text-[#5B4FE9] ring-indigo-100"
            label="Total Sesi"
            value={stats.total}
          />

          <StatCard
            icon={<CalendarCheck size={21} />}
            iconClass="bg-gradient-to-br from-[#E6FFFB] to-white text-[#0D9488] ring-teal-100"
            label="Sesi Hari Ini"
            value={stats.today}
          />

          <StatCard
            icon={<Radio size={21} />}
            iconClass="bg-gradient-to-br from-amber-50 to-white text-amber-600 ring-amber-100"
            label="Sesi Aktif"
            value={stats.active}
          />

          <StatCard
            icon={<CheckCircle2 size={21} />}
            iconClass="bg-gradient-to-br from-blue-50 to-white text-blue-600 ring-blue-100"
            label="Selesai Bulan Ini"
            value={stats.finishedThisMonth}
          />

          <StatCard
            icon={<Clock3 size={21} />}
            iconClass="bg-gradient-to-br from-rose-50 to-white text-rose-600 ring-rose-100"
            label="Rata-rata Durasi"
            value={stats.avgDuration}
          />
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_150px_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama mahasiswa, topik, atau ID sesi..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-indigo-100 bg-white px-6 text-sm font-extrabold text-[#5B4FE9] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <Filter size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={() => navigate("/buat-sesi")}
              className="flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] px-7 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(91,79,233,0.22)] transition hover:brightness-105"
            >
              <Plus size={16} />
              Buat Sesi Baru
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <CompactSelect
              label="Tanggal"
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
            />

            <CompactSelect
              label="Status Sesi"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />

            <CompactSelect
              label="Jenis Konseling"
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
            />

            <CompactSelect
              label="Konselor"
              value={counselorFilter}
              onChange={setCounselorFilter}
              options={counselorOptions}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
            <div className="grid grid-cols-[42px_145px_minmax(0,1.8fr)_minmax(0,1.15fr)_126px_100px_112px_96px] items-center bg-slate-50/90 px-4 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <div>No.</div>
              <div>ID Sesi</div>
              <div>Mahasiswa</div>
              <div>Topik</div>
              <div>Tanggal</div>
              <div>Durasi</div>
              <div>Status</div>
              <div className="text-right">Aksi</div>
            </div>

            {visibleSessions.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                  <Search size={22} />
                </div>
                <p className="mt-3 text-sm font-extrabold text-slate-600">
                  Belum ada sesi konseling yang sesuai
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Coba ubah kata kunci atau reset filter.
                </p>
              </div>
            ) : (
              visibleSessions.map((session, index) => (
                <SessionRow
                  key={session.sessionId || session.id || index}
                  session={session}
                  rowNumber={(currentPage - 1) * rowsPerPage + index + 1}
                  onView={() => handleViewSession(session)}
                  onContinue={() => handleContinueMonitoring(session)}
                  onDelete={() => handleDeleteSession(session)}
                />
              ))
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Menampilkan{" "}
              <span className="font-extrabold text-slate-700">
                {firstItemNumber} - {lastItemNumber}
              </span>{" "}
              dari{" "}
              <span className="font-extrabold text-slate-700">
                {filteredSessions.length}
              </span>{" "}
              sesi
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50"
              >
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                {getPaginationPages(currentPage, totalPages).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-xl text-sm font-extrabold transition ${
                      currentPage === page
                        ? "bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] text-white shadow-[0_10px_20px_rgba(91,79,233,0.18)]"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="h-9 w-9 rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, iconClass, label, value }) {
  return (
    <div className="group flex h-[120px] flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 text-center shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
      <div
        className={`mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition group-hover:scale-105 ${iconClass}`}
      >
        {icon}
      </div>

      <p className="text-center text-[13px] font-bold leading-4 text-slate-500">
        {label}
      </p>

      <div className="mt-1.5 flex min-h-[28px] w-full items-center justify-center overflow-hidden">
        <h3
          title={String(value)}
          className="max-w-full truncate whitespace-nowrap text-center text-[21px] font-extrabold leading-tight text-slate-950"
        >
          {value}
        </h3>
      </div>
    </div>
  );
}

function CompactSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold text-slate-500">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ▼
        </span>
      </div>
    </label>
  );
}

function SessionRow({ session, rowNumber, onView, onContinue, onDelete }) {
  const canContinue = ["Berjalan", "Aktif", "Dijadwalkan", "active"].includes(
    session.status
  );

  return (
    <div className="grid grid-cols-[42px_145px_minmax(0,1.8fr)_minmax(0,1.15fr)_126px_100px_112px_96px] items-center border-t border-slate-100 px-4 py-3.5 text-sm transition hover:bg-[#EEF2FF]/45">
      <div className="font-semibold text-slate-700">{rowNumber}</div>

      <div className="whitespace-nowrap pr-3 font-semibold text-slate-700">
        {session.sessionId || session.id || "-"}
      </div>

      <div className="flex min-w-0 items-center gap-3 pr-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-xs font-extrabold text-[#5B4FE9] ring-1 ring-indigo-100">
          {getInitial(session.studentName)}
        </div>

        <div className="min-w-0">
          <p
            title={session.studentName}
            className="line-clamp-2 font-extrabold leading-5 text-slate-950"
          >
            {session.studentName || "-"}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {session.nim || "-"}
          </p>
        </div>
      </div>

      <div
        title={session.topic || session.counselingType}
        className="line-clamp-2 pr-3 font-medium leading-5 text-slate-700"
      >
        {session.topic || session.counselingType || "-"}
      </div>

      <div className="pr-3">
        <p className="font-bold text-slate-800">{session.startDate || "-"}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">
          {session.startTime ? `${session.startTime} WIB` : "-"}
        </p>
      </div>

      <div className="font-bold text-slate-800">
        {formatDuration(session.duration)}
      </div>

      <div>
        <StatusBadge status={session.status} />
      </div>

      <div className="flex justify-end gap-1.5">
        <ActionButton
          title="Lihat detail"
          icon={<Eye size={14} />}
          onClick={onView}
          className="text-[#5B4FE9] hover:border-indigo-200 hover:bg-indigo-50"
        />

        {canContinue && (
          <ActionButton
            title="Mulai / lanjut monitoring"
            icon={<Play size={14} />}
            onClick={onContinue}
            className="text-[#0D9488] hover:border-teal-200 hover:bg-teal-50"
          />
        )}

        <ActionButton
          title="Hapus sesi"
          icon={<Trash2 size={14} />}
          onClick={onDelete}
          className="text-rose-600 hover:border-rose-200 hover:bg-rose-50"
        />
      </div>
    </div>
  );
}

function ActionButton({ title, icon, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white transition ${className}`}
    >
      {icon}
    </button>
  );
}

function StatusBadge({ status }) {
  const normalized = status || "-";

  const styleMap = {
    Berjalan: "bg-blue-50 text-blue-700 ring-blue-100",
    Aktif: "bg-blue-50 text-blue-700 ring-blue-100",
    active: "bg-blue-50 text-blue-700 ring-blue-100",
    Dijadwalkan: "bg-amber-50 text-amber-700 ring-amber-100",
    Selesai: "bg-[#E6FFFB] text-[#0D9488] ring-teal-100",
    Dibatalkan: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${
        styleMap[normalized] || "bg-slate-50 text-slate-600 ring-slate-100"
      }`}
    >
      {normalized === "active" ? "Berjalan" : normalized}
    </span>
  );
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function normalizeSession(item, fallbackStatus = "Selesai") {
  const sessionId =
    item.sessionId || item.id || `KS-${Date.now().toString().slice(-8)}`;

  return {
    ...item,
    id: sessionId,
    sessionId,
    studentName:
      item.studentName ||
      item.student?.name ||
      item.name ||
      item.namaMahasiswa ||
      "-",
    nim: item.nim || item.student?.nim || "-",
    programStudy:
      item.programStudy || item.student?.programStudy || item.prodi || "-",
    topic:
      item.topic ||
      item.counselingTopic ||
      item.topikKonseling ||
      item.title ||
      "-",
    counselingType:
      item.counselingType || item.jenisKonseling || "Konseling Akademik",
    counselorName:
      item.counselorName ||
      item.counselor ||
      item.namaKonselor ||
      "Hendrawaty, ST., MT",
    startDate:
      item.startDate ||
      item.date ||
      item.sessionDate ||
      item.tanggal ||
      formatDateDisplay(item.createdAt),
    startTime:
      item.startTime ||
      item.time ||
      item.sessionTime ||
      item.waktu ||
      formatTimeDisplay(item.createdAt),
    duration: item.duration || item.sessionDuration || item.durasi || "00:00:00",
    status: item.status === "active" ? "Berjalan" : item.status || fallbackStatus,
  };
}

function removeDuplicateSessions(items) {
  const map = new Map();

  items.forEach((item) => {
    const key = item.sessionId || item.id;
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function formatDuration(duration) {
  if (!duration) return "-";

  if (typeof duration === "number") return secondsToTime(duration);

  if (duration.includes(":")) return duration;

  if (String(duration).toLowerCase().includes("menit")) return duration;

  return duration;
}

function getAverageDuration(sessions) {
  const secondsList = sessions
    .map((session) => durationToSeconds(session.duration))
    .filter((value) => value > 0);

  if (secondsList.length === 0) return "00:00:00";

  const average = Math.round(
    secondsList.reduce((total, value) => total + value, 0) / secondsList.length
  );

  return secondsToTime(average);
}

function durationToSeconds(duration) {
  if (!duration) return 0;

  if (typeof duration === "number") return duration;

  if (String(duration).toLowerCase().includes("menit")) {
    const minute = parseInt(duration, 10);
    return Number.isNaN(minute) ? 0 : minute * 60;
  }

  const parts = String(duration).split(":").map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return 0;
}

function secondsToTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function isTodaySession(dateText) {
  if (!dateText) return false;

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return normalizeDateText(dateText) === normalizeDateText(today);
}

function isFinishedThisMonth(session) {
  if (session.status !== "Selesai") return false;

  const date = parseIndonesianDate(session.startDate);
  if (!date) return false;

  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function parseIndonesianDate(dateText) {
  if (!dateText) return null;

  const months = {
    januari: 0,
    februari: 1,
    maret: 2,
    april: 3,
    mei: 4,
    juni: 5,
    juli: 6,
    agustus: 7,
    september: 8,
    oktober: 9,
    november: 10,
    desember: 11,
  };

  const clean = String(dateText).toLowerCase().replace(/\s+/g, " ").trim();
  const parts = clean.split(" ");

  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);

  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) {
    return null;
  }

  return new Date(year, month, day);
}

function normalizeDateText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^0/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateDisplay(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTimeDisplay(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5];

  if (currentPage >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

export default SessionPage;