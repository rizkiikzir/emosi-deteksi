import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";
import {
  Users,
  CalendarDays,
  Activity,
  FileText,
  BarChart3,
  Info,
} from "lucide-react";

const STUDENTS_KEY = "studentsData";
const CURRENT_SESSION_KEY = "currentCounselingSession";

const EMOTION_COLORS = {
  Senang: "#22c55e",
  Sedih: "#2563eb",
  Marah: "#ef4444",
  Takut: "#f59e0b",
  Netral: "#6b7280",
};

const EMOTION_EMOJI = {
  Senang: "😊",
  Sedih: "😢",
  Marah: "😠",
  Takut: "😨",
  Netral: "😐",
};

const SAMPLE_RECENT_SESSIONS = [
  {
    id: "KS-20240512-001",
    studentName: "Andi Ramadhan",
    nim: "2022573010105",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "12 Mei 2024",
    startTime: "10:00",
    duration: "00:15:00",
    status: "Selesai",
  },
  {
    id: "KS-20240512-002",
    studentName: "Siti Rahmawati",
    nim: "2022573010112",
    counselorName: "Hendrawaty, ST., MT",
    startDate: "12 Mei 2024",
    startTime: "09:30",
    duration: "00:12:45",
    status: "Berlangsung",
  },
  {
    id: "KS-20240512-003",
    studentName: "Muhammad Fikri",
    nim: "2022573010118",
    counselorName: "Azhar, ST., MT",
    startDate: "12 Mei 2024",
    startTime: "09:00",
    duration: "00:16:20",
    status: "Selesai",
  },
];

const SAMPLE_EMOTION_DISTRIBUTION = [
  { name: "Netral", value: 52.6, count: 1293 },
  { name: "Senang", value: 20.4, count: 502 },
  { name: "Sedih", value: 13.2, count: 324 },
  { name: "Marah", value: 8.7, count: 214 },
  { name: "Takut", value: 5.1, count: 124 },
];

const SAMPLE_SCATTER_POINTS = [
  { day: "6 Mei", emotion: "Marah" },
  { day: "6 Mei", emotion: "Senang" },
  { day: "6 Mei", emotion: "Takut" },
  { day: "6 Mei", emotion: "Sedih" },
  { day: "6 Mei", emotion: "Netral" },
  { day: "7 Mei", emotion: "Marah" },
  { day: "7 Mei", emotion: "Senang" },
  { day: "7 Mei", emotion: "Takut" },
  { day: "7 Mei", emotion: "Netral" },
  { day: "8 Mei", emotion: "Senang" },
  { day: "8 Mei", emotion: "Sedih" },
  { day: "8 Mei", emotion: "Marah" },
  { day: "8 Mei", emotion: "Takut" },
  { day: "9 Mei", emotion: "Sedih" },
  { day: "9 Mei", emotion: "Netral" },
  { day: "9 Mei", emotion: "Senang" },
  { day: "9 Mei", emotion: "Marah" },
  { day: "10 Mei", emotion: "Sedih" },
  { day: "10 Mei", emotion: "Takut" },
  { day: "10 Mei", emotion: "Marah" },
  { day: "10 Mei", emotion: "Senang" },
  { day: "11 Mei", emotion: "Netral" },
  { day: "11 Mei", emotion: "Sedih" },
  { day: "11 Mei", emotion: "Takut" },
  { day: "11 Mei", emotion: "Senang" },
  { day: "12 Mei", emotion: "Netral" },
  { day: "12 Mei", emotion: "Sedih" },
  { day: "12 Mei", emotion: "Takut" },
  { day: "12 Mei", emotion: "Marah" },
];

function DashboardPage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const storedStudents = safeParse(localStorage.getItem(STUDENTS_KEY));
    const storedCurrentSession = safeParse(
      localStorage.getItem(CURRENT_SESSION_KEY)
    );

    setStudents(Array.isArray(storedStudents) ? storedStudents : []);
    setCurrentSession(storedCurrentSession || null);

    const reportCandidates = [
      "counselingReports",
      "sessionReports",
      "reportHistory",
      "reportsData",
      "reports",
    ];

    const collectedReports = [];

    reportCandidates.forEach((key) => {
      const value = safeParse(localStorage.getItem(key));

      if (Array.isArray(value)) {
        value.forEach((item) => collectedReports.push(item));
      }
    });

    setReports(removeDuplicateReports(collectedReports));
  }, []);

  const recentSessions = useMemo(() => {
    const list = [];

    if (currentSession) {
      list.push(normalizeSession(currentSession, "Berlangsung"));
    }

    reports.forEach((report) => {
      const normalized = normalizeSession(report, "Selesai");

      if (normalized.studentName !== "-" || normalized.nim !== "-") {
        list.push(normalized);
      }
    });

    if (list.length === 0) return SAMPLE_RECENT_SESSIONS;

    return removeDuplicateSessions(list).slice(0, 3);
  }, [currentSession, reports]);

  const emotionDistribution = useMemo(() => {
    const fromReports = buildEmotionDistribution(reports);

    if (fromReports.length > 0) return fromReports;

    return SAMPLE_EMOTION_DISTRIBUTION;
  }, [reports]);

  const dominantEmotion = useMemo(() => {
    if (emotionDistribution.length === 0) return "Netral";

    return [...emotionDistribution].sort((a, b) => b.value - a.value)[0].name;
  }, [emotionDistribution]);

  const totalEmotionDetections = useMemo(() => {
    return emotionDistribution.reduce((total, item) => total + item.count, 0);
  }, [emotionDistribution]);

  const stats = useMemo(() => {
    return {
      totalStudents: students.length || 86,
      totalSessions:
        recentSessions.length > 0 && !isUsingSampleSession(recentSessions)
          ? recentSessions.length
          : 32,
      todaySessions: currentSession ? 1 : 3,
      totalReports: reports.length || 27,
      dominantEmotion,
    };
  }, [
    students.length,
    recentSessions,
    currentSession,
    reports.length,
    dominantEmotion,
  ]);

  const todayInfo = useMemo(() => {
    const now = new Date();

    return {
      date: now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }, []);

  return (
    <AppLayout title="Dashboard" subtitle="">
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#E6FFFB]/70 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#EEF2FF]/80 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950">
                Selamat datang, Hendrawaty, ST., MT 👋
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Kelola sesi konseling dan pantau emosi mahasiswa secara real-time
                untuk pendampingan yang lebih efektif.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E6FFFB] text-[#5B4FE9] ring-1 ring-indigo-100">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="font-extrabold text-slate-800">
                  {todayInfo.date}
                </p>
                <p className="font-semibold text-slate-500">
                  {todayInfo.time} WIB
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Users size={21} />}
            iconClass="bg-gradient-to-br from-[#EEF2FF] to-white text-[#5B4FE9] ring-indigo-100"
            label="Total Mahasiswa"
            value={stats.totalStudents}
          />

          <StatCard
            icon={<CalendarDays size={21} />}
            iconClass="bg-gradient-to-br from-[#E6FFFB] to-white text-[#0D9488] ring-teal-100"
            label="Total Sesi Konseling"
            value={stats.totalSessions}
          />

          <StatCard
            icon={<Activity size={21} />}
            iconClass="bg-gradient-to-br from-blue-50 to-white text-blue-600 ring-blue-100"
            label="Sesi Hari Ini"
            value={stats.todaySessions}
          />

          <StatCard
            icon={<FileText size={21} />}
            iconClass="bg-gradient-to-br from-amber-50 to-white text-amber-600 ring-amber-100"
            label="Laporan Dibuat"
            value={stats.totalReports}
          />

          <StatCard
            icon={<BarChart3 size={21} />}
            iconClass="bg-gradient-to-br from-rose-50 to-white text-rose-600 ring-rose-100"
            label="Emosi Dominan"
            value={stats.dominantEmotion}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
          {/* KOLOM KIRI: Grafik + Sesi Terbaru */}
          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    Grafik Sebaran Emosi (Scatter Plot) - 7 Hari Terakhir
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Visualisasi sebaran emosi berdasarkan waktu pemantauan.
                  </p>
                </div>

                <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50">
                  <option>7 Hari Terakhir</option>
                  <option>30 Hari Terakhir</option>
                </select>
              </div>

              <EmotionLegend />

              <ScatterChart points={SAMPLE_SCATTER_POINTS} />

              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-2.5">
                <Info size={17} className="mt-0.5 shrink-0 text-[#5B4FE9]" />
                <p className="text-xs font-semibold leading-relaxed text-slate-600">
                  Setiap titik merepresentasikan emosi dominan pada interval waktu
                  tertentu selama sesi konseling.
                </p>
              </div>
            </div>

            <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    Sesi Konseling Terbaru
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Menampilkan 1 sesi terbaru. Klik lihat semua untuk data lengkap.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/sesi-konseling")}
                  className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-extrabold text-[#5B4FE9] transition hover:bg-[#EEF2FF]"
                >
                  Lihat semua
                </button>
              </div>

              <div className="mt-4">
                {recentSessions.slice(0, 1).map((session) => (
                  <RecentSessionCompactCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN: Distribusi + Emosi Dominan */}
          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <h3 className="text-base font-extrabold text-slate-950">
                Distribusi Emosi (Keseluruhan)
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Ringkasan komposisi seluruh hasil deteksi.
              </p>

              <div className="mt-4 grid gap-5 md:grid-cols-[190px_1fr] md:items-center xl:grid-cols-1 2xl:grid-cols-[190px_1fr]">
                <DonutChart
                  distribution={emotionDistribution}
                  total={totalEmotionDetections}
                />

                <div className="space-y-3">
                  {emotionDistribution.map((item) => (
                    <DistributionRow key={item.name} item={item} />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-teal-100 bg-gradient-to-br from-[#E6FFFB] to-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <h3 className="text-base font-extrabold text-slate-950">
                Emosi Dominan
              </h3>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-teal-100">
                  <img
                    src={getEmotionIcon(dominantEmotion)}
                    alt={dominantEmotion}
                    className="h-13 w-13 object-contain"
                  />
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-950">
                    {dominantEmotion}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {getDominantPercentage(emotionDistribution, dominantEmotion)}% dari
                    total deteksi
                  </p>

                  <span className="mt-2 inline-flex rounded-full border border-teal-100 bg-white px-2.5 py-1 text-xs font-extrabold text-[#0D9488]">
                    Stabil
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-3 text-center text-xs font-medium text-slate-500">
          © 2026 Unit BK Politeknik Negeri Lhokseumawe. Semua hak dilindungi.
        </footer>
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

function EmotionLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs font-bold text-slate-600">
      {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
        <div key={emotion} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
          />
          {emotion}
        </div>
      ))}
    </div>
  );
}

function ScatterChart({ points }) {
  const emotions = ["Senang", "Netral", "Takut", "Marah", "Sedih"];
  const days = ["6 Mei", "7 Mei", "8 Mei", "9 Mei", "10 Mei", "11 Mei", "12 Mei"];

  return (
    <div className="mt-4 rounded-2xl bg-white">
      <div className="grid grid-cols-[70px_1fr]">
        <div className="grid h-[190px] grid-rows-5 text-xs font-bold text-slate-600">
          {emotions.map((emotion) => (
            <div key={emotion} className="flex items-center justify-end pr-3">
              {emotion}
            </div>
          ))}
        </div>

        <div className="relative h-[190px] border-l border-b border-slate-200">
          <div className="absolute inset-0 grid grid-rows-5">
            {emotions.map((emotion) => (
              <div key={emotion} className="border-t border-slate-100" />
            ))}
          </div>

          <div className="absolute inset-0 grid grid-cols-7">
            {days.map((day) => (
              <div
                key={day}
                className="border-l border-slate-100 first:border-l-0"
              />
            ))}
          </div>

          {points.map((point, index) => {
            const xIndex = days.indexOf(point.day);
            const yIndex = emotions.indexOf(point.emotion);

            if (xIndex === -1 || yIndex === -1) return null;

            const left = `${(xIndex / (days.length - 1)) * 92 + 4}%`;
            const top = `${(yIndex / (emotions.length - 1)) * 82 + 8}%`;

            return (
              <span
                key={`${point.day}-${point.emotion}-${index}`}
                title={`${point.day} - ${point.emotion}`}
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                style={{
                  left,
                  top,
                  backgroundColor: EMOTION_COLORS[point.emotion],
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="ml-[70px] mt-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
        {days.map((day) => (
          <div key={day}>
            <p>{day}</p>
            <p className="text-slate-400">00:00</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs font-bold text-slate-500">
        Waktu (menit)
      </p>
    </div>
  );
}

function DonutChart({ distribution, total }) {
  const gradient = buildConicGradient(distribution);

  return (
    <div className="mx-auto flex h-[145px] w-[145px] items-center justify-center rounded-full">
      <div
        className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full shadow-sm"
        style={{ background: gradient }}
      >
        <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
          <p className="text-xs font-bold text-slate-500">Total</p>
          <h4 className="text-lg font-extrabold text-slate-950">
            {formatNumber(total)}
          </h4>
          <p className="text-xs font-semibold text-slate-500">Deteksi</p>
        </div>
      </div>
    </div>
  );
}

function DistributionRow({ item }) {
  return (
    <div className="grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5 text-sm transition hover:bg-white hover:shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <img
          src={getEmotionIcon(item.name)}
          alt={item.name}
          className="h-9 w-9 object-contain"
        />
      </div>

      <div className="min-w-0">
        <p className="font-extrabold text-slate-700">{item.name}</p>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full opacity-90"
            style={{
              width: `${item.value}%`,
              backgroundColor: EMOTION_COLORS[item.name],
            }}
          />
        </div>
      </div>

      <p className="text-right font-extrabold text-slate-950">
        {item.value}%{" "}
        <span className="font-bold text-slate-600">
          ({formatNumber(item.count)})
        </span>
      </p>
    </div>
  );
}

function RecentSessionRow({ session }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_130px_100px_110px] items-center border-t border-slate-100 px-4 py-3.5 text-sm transition hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-3 pr-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-xs font-extrabold text-[#5B4FE9] ring-1 ring-indigo-100">
          {getInitial(session.studentName)}
        </div>

        <div className="min-w-0">
          <p
            title={session.studentName}
            className="truncate text-sm font-extrabold text-slate-950"
          >
            {session.studentName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {session.nim}
          </p>
        </div>
      </div>

      <p
        title={session.counselorName}
        className="truncate pr-4 font-semibold text-slate-700"
      >
        {session.counselorName}
      </p>

      <div className="pr-3">
        <p className="font-bold text-slate-800">{session.startDate}</p>
        <p className="text-xs font-semibold text-slate-500">
          {session.startTime}
        </p>
      </div>

      <p className="font-bold text-slate-800">{session.duration}</p>

      <StatusBadge status={session.status} />
    </div>
  );
}

function RecentSessionCompactCard({ session }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-white hover:shadow-[0_14px_35px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-xs font-extrabold text-[#5B4FE9] ring-1 ring-indigo-100">
            {getInitial(session.studentName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">
              {session.studentName}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {session.nim}
            </p>
          </div>
        </div>

        <StatusBadge status={session.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 rounded-2xl bg-white px-4 py-2.5 text-xs">
        <div>
          <p className="font-bold text-slate-400">Konselor</p>
          <p className="mt-1 truncate font-extrabold text-slate-700">
            {session.counselorName}
          </p>
        </div>

        <div>
          <p className="font-bold text-slate-400">Waktu</p>
          <p className="mt-1 font-extrabold text-slate-700">
            {session.startDate}
          </p>
          <p className="font-semibold text-slate-500">{session.startTime}</p>
        </div>

        <div>
          <p className="font-bold text-slate-400">Durasi</p>
          <p className="mt-1 font-extrabold text-slate-700">
            {session.duration}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Selesai: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Berlangsung: "border-amber-100 bg-amber-50 text-amber-700",
    Berjalan: "border-blue-100 bg-blue-50 text-blue-700",
    Dijadwalkan: "border-blue-100 bg-blue-50 text-blue-700",
    Dibatalkan: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-extrabold ${styles[status] || "border-slate-200 bg-slate-50 text-slate-600"
        }`}
    >
      {status}
    </span>
  );
}

function buildConicGradient(distribution) {
  let current = 0;

  const stops = distribution.map((item) => {
    const start = current;
    const end = current + item.value;
    current = end;

    return `${EMOTION_COLORS[item.name]} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function buildEmotionDistribution(reports) {
  const emotionCounts = {
    Senang: 0,
    Sedih: 0,
    Marah: 0,
    Takut: 0,
    Netral: 0,
  };

  reports.forEach((report) => {
    const summary =
      report.emotionSummary ||
      report.summary ||
      report.emotions ||
      report.emotionCounts ||
      {};

    Object.keys(emotionCounts).forEach((emotion) => {
      const value =
        summary[emotion] ||
        summary[emotion.toLowerCase()] ||
        report[emotion] ||
        report[emotion.toLowerCase()] ||
        0;

      emotionCounts[emotion] += Number(value) || 0;
    });

    if (
      report.dominantEmotion &&
      emotionCounts[report.dominantEmotion] !== undefined
    ) {
      emotionCounts[report.dominantEmotion] += 1;
    }
  });

  const total = Object.values(emotionCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  if (total <= 0) return [];

  return Object.entries(emotionCounts)
    .map(([name, count]) => ({
      name,
      count,
      value: Number(((count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

function getDominantPercentage(distribution, dominantEmotion) {
  const item = distribution.find((emotion) => emotion.name === dominantEmotion);
  return item ? item.value : 0;
}

function normalizeSession(item, fallbackStatus = "Selesai") {
  return {
    id: item.sessionId || item.id || item.reportId || `KS-${Date.now()}`,
    studentName:
      item.studentName ||
      item.student?.name ||
      item.name ||
      item.namaMahasiswa ||
      "-",
    nim: item.nim || item.student?.nim || "-",
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
    status:
      item.status === "active" ? "Berlangsung" : item.status || fallbackStatus,
  };
}

function removeDuplicateReports(items) {
  const map = new Map();

  items.forEach((item, index) => {
    const key = item.reportId || item.id || item.sessionId || `report-${index}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values());
}

function removeDuplicateSessions(items) {
  const map = new Map();

  items.forEach((item, index) => {
    const key = item.id || item.sessionId || `session-${index}`;
    if (!map.has(key)) map.set(key, item);
  });

  return Array.from(map.values());
}

function isUsingSampleSession(sessions) {
  return sessions.some((session) => session.id === "KS-20240512-001");
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
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

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function getInitial(name) {
  if (!name || name === "-") return "-";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default DashboardPage;