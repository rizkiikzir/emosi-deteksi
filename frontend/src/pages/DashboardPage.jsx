import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";
import { reportApi, sessionApi, studentApi } from "../services/api";
import {
  Users,
  CalendarDays,
  Activity,
  FileText,
  BarChart3,
  Info,
  Smile,
} from "lucide-react";

const EMOTION_COLORS = {
  Senang: "#22c55e",
  Sedih: "#2563eb",
  Marah: "#ef4444",
  Takut: "#f59e0b",
  Netral: "#6b7280",
};

const mapSessionFromApi = (session) => ({
  id: session.id,
  sessionId: session.session_code,
  studentName: session.student_name || "-",
  nim: session.student_nim || "-",
  counselorName: "Konselor / Admin",
  startDate: formatDateDisplay(session.scheduled_date),
  startTime: session.scheduled_time || "-",
  duration: session.actual_duration || session.estimated_duration || "-",
  status: session.status || "Terjadwal",
  createdAt: session.created_at,
});

const mapReportFromApi = (report) => {
  const sessionInfo = report.sessionInfo || report.session_info || {};
  const emotionSummary = parseJson(report.emotion_summary_json) || {};

  return {
    id: report.id,
    reportId: report.reportId || report.report_code || `RPT-${String(report.id).padStart(4, "0")}`,

    sessionId:
      report.sessionId ||
      report.session_code ||
      report.session_id_code ||
      sessionInfo.sessionId ||
      sessionInfo.session_code ||
      `KS-${String(report.session_id || report.id).padStart(4, "0")}`,

    studentName:
      sessionInfo.studentName ||
      sessionInfo.student_name ||
      report.studentName ||
      report.student_name ||
      "-",

    nim:
      sessionInfo.nim ||
      sessionInfo.student_nim ||
      report.nim ||
      report.student_nim ||
      "-",

    counselorName:
      sessionInfo.counselorName ||
      sessionInfo.counselor_name ||
      report.counselorName ||
      report.counselor_name ||
      "Konselor / Admin",

    startDate: formatDateDisplay(
      sessionInfo.startDate ||
      sessionInfo.scheduled_date ||
      report.scheduled_date ||
      report.created_at ||
      report.createdAt
    ),

    startTime:
      sessionInfo.startTime ||
      sessionInfo.scheduled_time ||
      report.scheduled_time ||
      "-",

    duration:
      report.duration ||
      report.totalDuration ||
      report.actual_duration ||
      sessionInfo.duration ||
      sessionInfo.actual_duration ||
      "-",

    status: "Selesai",

    dominantEmotion:
      report.dominantEmotion ||
      report.dominant_emotion ||
      "-",

    counts:
      report.counts ||
      emotionSummary.counts ||
      {},

    percentages:
      report.percentages ||
      emotionSummary.percentages ||
      {},

    totalDetections:
      report.totalDetections ||
      report.total_detections ||
      emotionSummary.total ||
      0,

    createdAt:
      report.createdAt ||
      report.created_at,

    chartPoints:
      report.chartPoints ||
      report.chart_points ||
      emotionSummary.chartPoints ||
      emotionSummary.chart_points ||
      [],
  };
};

function DashboardPage() {
  const navigate = useNavigate();

  const counselorProfile =
    safeParse(localStorage.getItem("serinUser")) ||
    safeParse(localStorage.getItem("serinUserProfile")) ||
    {
      name: "Admin Unit BK",
    };

  const counselorName = counselorProfile.name || "Admin Unit BK";

  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [studentsData, sessionsData, reportsData] = await Promise.all([
          studentApi.getAll(),
          sessionApi.getAll(),
          reportApi.getAll(),
        ]);

        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setCurrentSession(null);
        setSessions(Array.isArray(sessionsData) ? sessionsData.map(mapSessionFromApi) : []);
        setReports(Array.isArray(reportsData) ? reportsData.map(mapReportFromApi) : []);
      } catch (error) {
        setErrorMessage(error.message || "Gagal memuat data dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
  }, [sessions]);

  const emotionDistribution = useMemo(() => {
    return buildEmotionDistribution(reports);
  }, [reports]);

  const dominantEmotion = useMemo(() => {
    if (emotionDistribution.length === 0) return "-";

    return [...emotionDistribution].sort((a, b) => b.value - a.value)[0].name;
  }, [emotionDistribution]);

  const totalEmotionDetections = useMemo(() => {
    return emotionDistribution.reduce((total, item) => total + item.count, 0);
  }, [emotionDistribution]);

  const scatterPoints = useMemo(() => {
    return reports
      .flatMap((report) => {
        const dateLabel = formatShortDate(report.createdAt || report.sessionInfo?.startDate);

        return (report.chartPoints || []).slice(0, 8).map((point) => ({
          day: dateLabel,
          emotion: point.emotion,
        }));
      })
      .slice(-35);
  }, [reports]);

  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
      totalSessions: sessions.length,
      todaySessions: sessions.filter(isTodaySession).length,
      totalReports: reports.length,
      dominantEmotion,
    };
  }, [students.length, sessions, reports.length, dominantEmotion]);

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
        {errorMessage && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            Memuat data dashboard...
          </div>
        )}
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-sky-100/80 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#EEF2FF]/80 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="flex flex-wrap items-center gap-2 text-xl font-black text-slate-950">
                <span>Selamat datang, {counselorName}</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
                  <Smile size={16} strokeWidth={2.4} />
                </span>
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Kelola sesi konseling dan pantau emosi mahasiswa secara real-time
                untuk pendampingan yang lebih efektif.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 text-[#2563EB] ring-1 ring-blue-100">
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
            iconClass="bg-gradient-to-br from-sky-50 to-white text-sky-600 ring-sky-100"
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

              <ScatterChart points={scatterPoints} />

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
                  className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-extrabold text-[#2563EB] transition hover:bg-blue-100"
                >
                  Lihat semua
                </button>
              </div>

              <div className="mt-4">
                {recentSessions.length ? (
                  recentSessions.slice(0, 1).map((session) => (
                    <RecentSessionCompactCard key={session.id} session={session} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                    Belum ada sesi konseling.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN: Distribusi + Emosi Dominan */}
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
                  {emotionDistribution.length ? (
                    emotionDistribution.map((item) => (
                      <DistributionRow key={item.name} item={item} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                      Belum ada data emosi.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
                  Emosi Dominan
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
                    <img
                      src={getEmotionIcon(dominantEmotion === "-" ? "Netral" : dominantEmotion)}
                      alt={dominantEmotion}
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-lg font-extrabold text-slate-950">
                      {dominantEmotion}
                    </h4>
                    <p className="mt-0.5 text-sm font-semibold text-slate-500">
                      {getDominantPercentage(emotionDistribution, dominantEmotion)}% dari
                      total deteksi
                    </p>

                    <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700">
                      Stabil
                    </span>
                  </div>
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
  const days = [...new Set(points.map((point) => point.day))].slice(-7);

  const safeDays = days.length ? days : ["-"];

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
            {safeDays.map((day) => (
              <div
                key={day}
                className="border-l border-slate-100 first:border-l-0"
              />
            ))}
          </div>

          {points.map((point, index) => {
            const xIndex = safeDays.indexOf(point.day);
            const yIndex = emotions.indexOf(point.emotion);

            if (xIndex === -1 || yIndex === -1) return null;

            const left =
              safeDays.length === 1
                ? "50%"
                : `${(xIndex / (safeDays.length - 1)) * 92 + 4}%`;
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
        {safeDays.map((day) => (
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
  if (!distribution.length) {
    return "conic-gradient(#e5e7eb 0% 100%)";
  }

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
      report.counts ||
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

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function isTodaySession(session) {
  const value = session?.createdAt || session?.startDate;

  if (!value || value === "-") return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatShortDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
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

function parseJson(value) {
  if (!value) return null;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default DashboardPage;