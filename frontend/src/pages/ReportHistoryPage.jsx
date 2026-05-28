import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";
import {
  Search,
  FileText,
  Eye,
  Download,
  CalendarDays,
  BarChart3,
  Clock,
  Smile,
  Filter,
  Trash2,
} from "lucide-react";

const emotionStyle = {
  Senang: {
    soft: "bg-emerald-50 ring-emerald-100",
  },
  Sedih: {
    soft: "bg-blue-50 ring-blue-100",
  },
  Marah: {
    soft: "bg-red-50 ring-red-100",
  },
  Takut: {
    soft: "bg-amber-50 ring-amber-100",
  },
  Netral: {
    soft: "bg-slate-100 ring-slate-200",
  },
};

const emotionOrder = ["Senang", "Sedih", "Marah", "Takut", "Netral"];

function ReportHistoryPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("Semua Tanggal");
  const [counselorFilter, setCounselorFilter] = useState("Semua Konselor");
  const [topicFilter, setTopicFilter] = useState("Semua Topik");
  const [emotionFilter, setEmotionFilter] = useState("Semua Emosi");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const savedReports = JSON.parse(
      localStorage.getItem("sessionReports") || "[]"
    );

    setReports(savedReports);
  }, []);

  const normalizedReports = useMemo(() => {
    return reports.map((report, index) => {
      const sessionInfo = report.sessionInfo || {};
      const dominant = report.dominantEmotion || "-";
      const dominantMain = formatEmotionMain(dominant);
      const dominantDetail = formatEmotionDetail(dominant);

      return {
        ...report,
        no: index + 1,
        id: report.id || `KS-${Date.now()}-${index}`,
        sessionId:
          report.sessionId ||
          report.sessionInfo?.sessionId ||
          report.id ||
          `KS-${Date.now()}-${index}`,
        studentName: sessionInfo.studentName || report.studentName || "-",
        nim: sessionInfo.nim || report.nim || "-",
        programStudy: sessionInfo.programStudy || report.programStudy || "-",
        topic:
          sessionInfo.topic ||
          report.topic ||
          sessionInfo.title ||
          report.title ||
          "-",
        counselor:
          sessionInfo.counselorName ||
          report.counselor ||
          "Hendrawaty, ST., MT",
        date: sessionInfo.startDate || report.date || "-",
        time: sessionInfo.startTime || report.time || "-",
        duration:
          report.duration ||
          report.totalDuration ||
          report.sessionDuration ||
          report.sessionInfo?.duration ||
          (report.durationSecond
            ? secondsToDuration(report.durationSecond)
            : "00:00:00"),
        dominantEmotion: dominant,
        dominantMain,
        dominantDetail,
        dominantPercent:
          getDominantPercent(report, dominant) ||
          report.dominantPercent ||
          "0.0",
        accuracy: report.accuracy || "92.41",
        total: report.total || report.totalDetected || 0,
        createdAt: report.createdAt,
      };
    });
  }, [reports]);

  const filteredReports = useMemo(() => {
    const search = keyword.toLowerCase();

    return normalizedReports.filter((report) => {
      const matchKeyword =
        report.studentName.toLowerCase().includes(search) ||
        report.nim.toLowerCase().includes(search) ||
        report.topic.toLowerCase().includes(search) ||
        report.sessionId.toLowerCase().includes(search) ||
        report.dominantEmotion.toLowerCase().includes(search) ||
        report.dominantMain.toLowerCase().includes(search) ||
        String(report.dominantDetail || "").toLowerCase().includes(search);

      const matchDate = matchDateFilter(report, dateFilter);

      const matchCounselor =
        counselorFilter === "Semua Konselor" ||
        report.counselor === counselorFilter;

      const matchTopic =
        topicFilter === "Semua Topik" || report.topic === topicFilter;

      const matchEmotion =
        emotionFilter === "Semua Emosi" ||
        normalizeEmotionText(report.dominantEmotion).includes(emotionFilter);

      return (
        matchKeyword &&
        matchDate &&
        matchCounselor &&
        matchTopic &&
        matchEmotion
      );
    });
  }, [
    normalizedReports,
    keyword,
    dateFilter,
    counselorFilter,
    topicFilter,
    emotionFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / rowsPerPage)
  );

  const visibleReports = filteredReports.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    dateFilter,
    counselorFilter,
    topicFilter,
    emotionFilter,
    rowsPerPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const topics = useMemo(() => {
    return [
      "Semua Topik",
      ...new Set(
        normalizedReports.map((report) => report.topic).filter(Boolean)
      ),
    ];
  }, [normalizedReports]);

  const counselors = useMemo(() => {
    return [
      "Semua Konselor",
      ...new Set(
        normalizedReports.map((report) => report.counselor).filter(Boolean)
      ),
    ];
  }, [normalizedReports]);

  const totalReports = reports.length;

  const thisMonthReports = normalizedReports.filter((report) =>
    matchDateFilter(report, "Bulan Ini")
  ).length;

  const mostDominantEmotion = getMostDominantEmotion(normalizedReports);
  const averageAccuracy = getAverageAccuracy(normalizedReports);
  const averageDuration = getAverageDuration(normalizedReports);

  const openDetail = (report) => {
    localStorage.setItem("selectedSessionReport", JSON.stringify(report));

    navigate(`/detail-laporan/${report.id}`, {
      state: {
        report,
      },
    });
  };

  const deleteReport = (id) => {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus laporan ini dari riwayat?"
    );

    if (!confirmDelete) return;

    const updatedReports = reports.filter((report) => report.id !== id);

    setReports(updatedReports);
    localStorage.setItem("sessionReports", JSON.stringify(updatedReports));

    const latest = JSON.parse(localStorage.getItem("latestSessionReport"));

    if (latest?.id === id) {
      localStorage.removeItem("latestSessionReport");
    }
  };

  const resetFilter = () => {
    setKeyword("");
    setDateFilter("Semua Tanggal");
    setCounselorFilter("Semua Konselor");
    setTopicFilter("Semua Topik");
    setEmotionFilter("Semua Emosi");
    setCurrentPage(1);
  };

  const firstItemNumber =
    filteredReports.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const lastItemNumber = Math.min(
    currentPage * rowsPerPage,
    filteredReports.length
  );

  return (
    <AppLayout
      title="Riwayat Laporan Konseling"
      subtitle="Dashboard > Laporan Konseling > Riwayat Laporan"
      showSessionStatus={false}
    >
      <div className="space-y-5">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<FileText size={21} />}
            iconClass="bg-indigo-50 text-[#5B4FE9] ring-indigo-100"
            label="Total Laporan"
            value={totalReports}
          />

          <StatCard
            icon={<CalendarDays size={21} />}
            iconClass="bg-teal-50 text-[#0D9488] ring-teal-100"
            label="Bulan Ini"
            value={thisMonthReports}
          />

          <StatCard
            icon={<Clock size={21} />}
            iconClass="bg-amber-50 text-amber-600 ring-amber-100"
            label="Rata-rata Durasi"
            value={averageDuration}
          />

          <StatCard
            icon={<Smile size={21} />}
            iconClass="bg-blue-50 text-blue-600 ring-blue-100"
            label="Emosi Dominan"
            value={mostDominantEmotion.label}
          />

          <StatCard
            icon={<BarChart3 size={21} />}
            iconClass="bg-rose-50 text-rose-600 ring-rose-100"
            label="Akurasi Model"
            value={`${averageAccuracy}%`}
          />
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_150px_170px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama mahasiswa, NIM, topik, atau ID sesi..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white px-5 text-sm font-extrabold text-[#5B4FE9] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              <Filter size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={() => exportReportsToCSV(filteredReports)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] px-6 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(91,79,233,0.22)] transition hover:brightness-105 active:scale-[0.99]"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Tanggal"
              value={dateFilter}
              onChange={setDateFilter}
              options={["Semua Tanggal", "Hari Ini", "Minggu Ini", "Bulan Ini"]}
              icon={<CalendarDays size={16} />}
            />

            <FilterSelect
              label="Konselor"
              value={counselorFilter}
              onChange={setCounselorFilter}
              options={counselors}
            />

            <FilterSelect
              label="Topik Konseling"
              value={topicFilter}
              onChange={setTopicFilter}
              options={topics}
            />

            <FilterSelect
              label="Emosi Dominan"
              value={emotionFilter}
              onChange={setEmotionFilter}
              options={["Semua Emosi", ...emotionOrder]}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-[44px_128px_minmax(0,1.75fr)_minmax(0,1.15fr)_126px_96px_130px_98px] items-center bg-slate-50/90 px-4 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">
            <div>No.</div>
            <div>ID</div>
            <div>Mahasiswa</div>
            <div>Topik</div>
            <div>Tanggal</div>
            <div>Durasi</div>
            <div>Emosi</div>
            <div className="text-right">Aksi</div>
          </div>

          <div>
            {visibleReports.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm font-semibold text-slate-400">
                Belum ada laporan yang tersimpan.
              </div>
            ) : (
              visibleReports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  rowNumber={(currentPage - 1) * rowsPerPage + index + 1}
                  onOpen={() => openDetail(report)}
                  onDownload={() =>
                    exportReportsToCSV(
                      [report],
                      shortSessionId(report.sessionId)
                    )
                  }
                  onDelete={() => deleteReport(report.id)}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Menampilkan {firstItemNumber} - {lastItemNumber} dari{" "}
              {filteredReports.length} laporan
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              >
                <option value={8}>8 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                {getPaginationPages(currentPage, totalPages).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-xl text-sm font-extrabold transition ${currentPage === page
                      ? "bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] text-white shadow-[0_10px_22px_rgba(91,79,233,0.20)]"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="group flex h-[124px] flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white px-4 py-4 text-center shadow-[0_14px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(15,23,42,0.08)]">
      <div
        className={`mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/60 ${iconClass}`}
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

function FilterSelect({ label, value, onChange, options, icon }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white ${icon ? "pl-11" : "pl-4"
            } pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50`}
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

function ReportRow({ report, rowNumber, onOpen, onDownload, onDelete }) {
  const mainEmotion =
    normalizeEmotionText(report.dominantEmotion)[0] || report.dominantMain || "Netral";
  const style = emotionStyle[mainEmotion] || emotionStyle.Netral;
  const initial = getInitial(report.studentName);
  const emotionMain = formatEmotionMain(report.dominantEmotion);
  const emotionDetail = formatEmotionDetail(report.dominantEmotion);

  return (
    <div className="grid grid-cols-[44px_128px_minmax(0,1.75fr)_minmax(0,1.15fr)_126px_96px_130px_98px] items-center border-t border-slate-100 px-4 py-3.5 text-sm transition hover:bg-slate-50/80">
      <div className="font-semibold text-slate-700">{rowNumber}</div>

      <div className="truncate pr-2 font-semibold text-slate-700">
        {shortSessionId(report.sessionId)}
      </div>

      <div className="flex min-w-0 items-center gap-3 pr-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-xs font-extrabold text-[#5B4FE9]">
          {initial}
        </div>

        <div className="min-w-0">
          <p
            title={report.studentName}
            className="line-clamp-2 font-extrabold leading-5 text-slate-950"
          >
            {report.studentName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {report.nim}
          </p>
        </div>
      </div>

      <div className="min-w-0 pr-3">
        <p className="line-clamp-2 font-medium leading-5 text-slate-700">
          {report.topic}
        </p>
      </div>

      <div className="min-w-0 pr-3">
        <p className="truncate font-bold leading-5 text-slate-800">
          {report.date}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold leading-4 text-slate-500">
          {cleanTime(report.time)}
        </p>
      </div>

      <div className="whitespace-nowrap font-bold text-slate-800">
        {report.duration}
      </div>

      <div className="flex min-w-0 items-center gap-2 pr-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ${style.soft}`}
        >
          <img
            src={getEmotionIcon(emotionMain)}
            alt={emotionMain}
            className="h-7 w-7 object-contain"
          />
        </div>

        <div className="min-w-0">
          <p
            title={String(report.dominantEmotion)}
            className="truncate font-extrabold leading-5 text-slate-950"
          >
            {emotionMain}
          </p>

          <p
            title={String(report.dominantEmotion)}
            className="mt-1 truncate text-xs font-semibold text-slate-500"
          >
            {emotionDetail || `${report.dominantPercent}%`}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onOpen}
          title="Lihat detail"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#5B4FE9] transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          <Eye size={14} />
        </button>

        <button
          type="button"
          onClick={onDownload}
          title="Unduh laporan"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#5B4FE9] transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          <Download size={14} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Hapus laporan"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
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

function normalizeEmotionText(value) {
  const text = String(value || "").trim();

  if (!text || text === "-") return [];

  const found = emotionOrder.filter((emotion) =>
    text.toLowerCase().includes(emotion.toLowerCase())
  );

  return found.length ? found : [text];
}

function formatEmotionMain(value) {
  const emotions = normalizeEmotionText(value);

  if (!emotions.length) return "-";
  if (emotions.length > 1) return "Seri";

  return emotions[0];
}

function formatEmotionDetail(value) {
  const emotions = normalizeEmotionText(value);

  if (!emotions.length) return null;
  if (emotions.length > 1) return emotions.join(", ");

  return null;
}

function getDominantPercent(report, dominantEmotion) {
  const emotions = normalizeEmotionText(dominantEmotion);

  if (!report.percentages || !emotions.length) return null;

  const values = emotions
    .map((emotion) => Number(report.percentages?.[emotion]))
    .filter((value) => !Number.isNaN(value));

  if (!values.length) return null;

  return Math.max(...values).toFixed(1);
}

function getMostDominantEmotion(reports) {
  if (!reports.length) {
    return {
      label: "-",
      subValue: "0.0% dari total sesi",
    };
  }

  const counts = reports.reduce((acc, report) => {
    const emotions = normalizeEmotionText(report.dominantEmotion);

    emotions.forEach((emotion) => {
      if (emotion && emotion !== "-") {
        acc[emotion] = (acc[emotion] || 0) + 1;
      }
    });

    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    return {
      label: "-",
      subValue: "0.0% dari total sesi",
    };
  }

  const maxCount = entries[0][1];

  const dominantEmotions = entries
    .filter(([, count]) => count === maxCount)
    .map(([emotion]) => emotion);

  const percent = ((maxCount / reports.length) * 100).toFixed(1);

  if (dominantEmotions.length > 1) {
    return {
      label: "Seri",
      subValue: `${dominantEmotions.join(", ")} • ${percent}%`,
    };
  }

  return {
    label: dominantEmotions[0],
    subValue: `${percent}% dari total sesi`,
  };
}

function getAverageAccuracy(reports) {
  if (!reports.length) return "0.0";

  const total = reports.reduce((sum, report) => {
    return sum + Number(report.accuracy || 92.41);
  }, 0);

  return (total / reports.length).toFixed(1);
}

function getAverageDuration(reports) {
  if (!reports.length) return "00:00:00";

  const seconds = reports.map((report) => durationToSeconds(report.duration));
  const average = Math.floor(
    seconds.reduce((sum, value) => sum + value, 0) / seconds.length
  );

  return secondsToDuration(average);
}

function durationToSeconds(duration) {
  if (!duration) return 0;

  const parts = String(duration).split(":").map(Number);

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  return 0;
}

function secondsToDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function cleanTime(time) {
  if (!time) return "-";

  const cleaned = String(time).replace(/\s*WIB\s*/gi, "").trim();

  if (!cleaned || cleaned === "-") return "-";

  return `${cleaned} WIB`;
}

function shortSessionId(id) {
  if (!id) return "-";

  const text = String(id);

  if (text.startsWith("RPT-")) {
    return `KS-${text.slice(-8)}`;
  }

  return text.length > 14 ? `${text.slice(0, 4)}-${text.slice(-8)}` : text;
}

function matchDateFilter(report, filter) {
  if (filter === "Semua Tanggal") return true;

  const createdAt = report.createdAt ? new Date(report.createdAt) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) return true;

  const now = new Date();

  const sameDay =
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth() &&
    createdAt.getDate() === now.getDate();

  const sameMonth =
    createdAt.getFullYear() === now.getFullYear() &&
    createdAt.getMonth() === now.getMonth();

  const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

  if (filter === "Hari Ini") return sameDay;
  if (filter === "Minggu Ini") return diffDays >= 0 && diffDays <= 7;
  if (filter === "Bulan Ini") return sameMonth;

  return true;
}

function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage === 1) return [1, 2, 3];

  if (currentPage === totalPages) {
    return [totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

function exportReportsToCSV(reports, suffix = "semua") {
  if (!reports.length) {
    alert("Tidak ada data laporan untuk diekspor.");
    return;
  }

  const headers = [
    "No",
    "ID Sesi",
    "Nama Mahasiswa",
    "NIM",
    "Topik Konseling",
    "Tanggal",
    "Waktu",
    "Durasi",
    "Emosi Dominan",
    "Persentase Emosi Dominan",
    "Akurasi Model",
  ];

  const rows = reports.map((report, index) => [
    index + 1,
    report.sessionId,
    report.studentName,
    report.nim,
    report.topic,
    report.date,
    cleanTime(report.time),
    report.duration,
    report.dominantEmotion,
    `${report.dominantPercent}%`,
    `${report.accuracy}%`,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `riwayat-laporan-konseling-${suffix}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default ReportHistoryPage;