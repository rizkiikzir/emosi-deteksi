import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";
import { reportApi } from "../services/api";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  FileText,
  GraduationCap,
  Info,
  Lightbulb,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const emotionMeta = {
  Senang: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    activeBg: "bg-emerald-50",
    glow: "shadow-[0_14px_30px_rgba(16,185,129,0.12)]",
  },
  Sedih: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    activeBg: "bg-blue-50",
    glow: "shadow-[0_14px_30px_rgba(37,99,235,0.12)]",
  },
  Marah: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    activeBg: "bg-rose-50",
    glow: "shadow-[0_14px_30px_rgba(244,63,94,0.12)]",
  },
  Takut: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    activeBg: "bg-amber-50",
    glow: "shadow-[0_14px_30px_rgba(245,158,11,0.12)]",
  },
  Netral: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    activeBg: "bg-slate-50",
    glow: "shadow-[0_14px_30px_rgba(100,116,139,0.10)]",
  },
  Seri: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    activeBg: "bg-blue-50",
    glow: "shadow-[0_14px_30px_rgba(37,99,235,0.12)]",
  },
};

const emotionOrder = ["Senang", "Sedih", "Marah", "Takut", "Netral"];

function ReportDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadReportDetail = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await reportApi.getById(id);
        setReport(data);
      } catch (error) {
        if (location.state?.report) {
          setReport(location.state.report);
          setErrorMessage("");
          return;
        }

        setErrorMessage(error.message || "Gagal memuat detail laporan.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReportDetail();
  }, [id, location.state]);



  if (isLoading) {
    return (
      <AppLayout
        title="Detail Laporan"
        subtitle="Dashboard > Riwayat Laporan > Detail Laporan"
        showSessionStatus={false}
      >
        <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6 text-sm font-bold text-blue-700">
          Memuat detail laporan...
        </div>
      </AppLayout>
    );
  }

  if (!report || errorMessage) {
    return (
      <AppLayout
        title="Detail Laporan"
        subtitle="Dashboard > Riwayat Laporan > Detail Laporan"
        showSessionStatus={false}
      >
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
            <FileText size={28} />
          </div>

          <h3 className="mt-5 text-xl font-extrabold text-slate-950">
            Laporan tidak ditemukan
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
            {errorMessage ||
              "Silakan pilih laporan dari halaman riwayat laporan agar sistem dapat menampilkan detail evaluasi sesi konseling."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/riwayat-laporan")}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:brightness-105"
          >
            <ArrowLeft size={16} />
            Kembali ke Riwayat
          </button>
        </div>
      </AppLayout>
    );
  }

  const emotionSummary = parseJson(report.emotion_summary_json) || {};
  const sessionInfo = report.sessionInfo || report.session_info || {};

  const counts =
    report.counts ||
    emotionSummary.counts ||
    {};

  const percentages =
    report.percentages ||
    emotionSummary.percentages ||
    {};

  const markers =
    report.markers ||
    report.session_markers ||
    [];

  const dominantEmotion =
    report.dominantEmotion ||
    report.dominant_emotion ||
    getDominantEmotion(percentages);

  const dominantMain = formatEmotionMain(dominantEmotion);
  const dominantDetail = formatEmotionDetail(dominantEmotion);
  const dominantMeta = emotionMeta[dominantMain] || emotionMeta.Netral;

  const interpretation =
    report.interpretation ||
    generateFallbackInterpretation(
      dominantMain,
      percentages?.[dominantMain] || report.dominantPercent
    );

  const recommendation =
    report.recommendation || generateFallbackRecommendation(dominantMain);

  const totalDetections =
    report.total ||
    report.totalDetected ||
    report.total_detections ||
    Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

  const duration =
    report.duration ||
    report.totalDuration ||
    report.sessionDuration ||
    sessionInfo.duration ||
    "00:00:00";

  const accuracy = report.accuracy || report.model_accuracy || "92.41";

  const studentName =
    sessionInfo.studentName || report.studentName || report.name || "-";

  const nim = sessionInfo.nim || report.nim || "-";
  const programStudy =
    sessionInfo.programStudy || report.programStudy || "-";

  return (
    <AppLayout
      title="Detail Laporan"
      subtitle="Dashboard > Riwayat Laporan > Detail Laporan"
      showSessionStatus={false}
    >
      <div className="space-y-5">
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-base font-black text-[#2563EB] ring-1 ring-blue-100">
                {getInitial(studentName)}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-xl font-extrabold tracking-tight text-slate-950">
                  {studentName}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    {nim}
                  </span>

                  <span className="hidden text-slate-300 sm:inline">|</span>

                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {programStudy}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/riwayat-laporan")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_390px]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <SectionTitle
                icon={<Brain size={20} />}
                iconClass="bg-blue-50 text-[#2563EB] ring-blue-100"
                title="Ringkasan Emosi"
                description="Persentase dan jumlah deteksi emosi selama sesi berlangsung."
              />

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {emotionOrder.map((emotion) => {
                  const meta = emotionMeta[emotion] || emotionMeta.Netral;
                  const isDominant = emotion === dominantMain;

                  return (
                    <div
                      key={emotion}
                      className={[
                        "min-w-0 rounded-2xl border px-3 py-4 text-center transition hover:-translate-y-0.5",
                        isDominant
                          ? `${meta.border} ${meta.activeBg} ${meta.glow} ring-1 ring-white`
                          : "border-slate-200 bg-white shadow-sm hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ring-1",
                          isDominant
                            ? "bg-white ring-white shadow-sm"
                            : `${meta.bg} ring-slate-100`,
                        ].join(" ")}
                      >
                        <img
                          src={getEmotionIcon(emotion)}
                          alt={emotion}
                          className="h-10 w-10 object-contain"
                        />
                      </div>

                      <p
                        className={[
                          "mt-2 truncate text-xs font-extrabold",
                          isDominant ? meta.text : "text-slate-500",
                        ].join(" ")}
                      >
                        {emotion}
                      </p>

                      <h4
                        className={[
                          "mt-1 whitespace-nowrap text-2xl font-black leading-none tracking-tight",
                          isDominant ? meta.text : "text-slate-950",
                        ].join(" ")}
                      >
                        {formatPercent(percentages[emotion])}%
                      </h4>

                      <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                        {counts[emotion] || 0} deteksi
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <SectionTitle
                icon={<Sparkles size={20} />}
                iconClass="bg-blue-50 text-[#2563EB] ring-blue-100"
                title="Interpretasi Otomatis"
                description="Analisis awal berdasarkan emosi dominan dan distribusi deteksi."
              />

              <div className="mt-5 grid gap-3">
                <div
                  className={[
                    "rounded-2xl border px-4 py-4",
                    dominantMeta.border,
                    dominantMeta.activeBg,
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                      <img
                        src={getEmotionIcon(dominantMain)}
                        alt={dominantMain}
                        className="h-11 w-11 object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={[
                          "text-[10px] font-black uppercase tracking-[0.18em]",
                          dominantMeta.text,
                        ].join(" ")}
                      >
                        Emosi Dominan
                      </p>
                      <h3
                        className={[
                          "mt-1 truncate text-xl font-extrabold",
                          dominantMeta.text,
                        ].join(" ")}
                      >
                        {dominantMain || "-"}
                      </h3>

                      {dominantDetail && (
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {dominantDetail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Info size={16} className="text-[#2563EB]" />
                    <p className="text-sm font-extrabold text-slate-950">
                      Interpretasi Sistem
                    </p>
                  </div>

                  <p className="text-sm font-semibold leading-7 text-slate-700">
                    {interpretation}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-700" />
                    <p className="text-sm font-extrabold text-slate-950">
                      Rekomendasi Awal
                    </p>
                  </div>

                  <p className="text-sm font-semibold leading-7 text-slate-700">
                    {recommendation}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <SectionTitle
                icon={<MessageSquareText size={20} />}
                iconClass="bg-blue-50 text-blue-700 ring-blue-100"
                title="Momen Penting"
                description="Catatan penting yang ditandai konselor selama sesi."
              />

              <div className="mt-5">
                {markers.length ? (
                  <div className="space-y-3">
                    {markers.map((marker, index) => (
                      <div
                        key={marker.id || index}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563EB] ring-1 ring-blue-100">
                            {marker.timeLabel || marker.time || "-"}
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">
                            {marker.category || "Umum"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-extrabold text-slate-950">
                          {marker.title || "Momen penting"}
                        </p>

                        {marker.note && (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            <span className="font-extrabold text-slate-800">
                              Catatan:
                            </span>{" "}
                            {marker.note}
                          </p>
                        )}

                        {marker.analysis && (
                          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                            <p className="text-sm font-semibold leading-6 text-blue-900">
                              {cleanMomentAnalysis(marker.analysis)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                      <FileText size={18} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Tidak ada momen khusus yang ditandai.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <SectionTitle
                icon={<CalendarDays size={20} />}
                iconClass="bg-blue-50 text-[#2563EB] ring-blue-100"
                title="Informasi Sesi"
                description="Detail identitas dan metadata laporan."
                compact
              />

              <div className="mt-5 divide-y divide-slate-100">
                <InfoRow
                  label="ID Laporan"
                  value={report.reportId || report.report_code || `RPT-${String(report.id).padStart(4, "0")}`}
                />
                <InfoRow
                  label="ID Sesi"
                  value={report.sessionId || sessionInfo.sessionId}
                />
                <InfoRow
                  label="Tanggal"
                  value={sessionInfo.startDate || report.date}
                />
                <InfoRow
                  label="Waktu"
                  value={cleanTime(sessionInfo.startTime || report.time)}
                />
                <InfoRow
                  label="Durasi"
                  value={formatDurationDisplay(duration)}
                />
                <InfoRow
                  label="Topik"
                  value={sessionInfo.topic || report.topic || sessionInfo.title}
                />
                <InfoRow label="Metode" value={sessionInfo.method || "Tatap Muka"} />
                <InfoRow
                  label="Model AI"
                  value={report.modelName || report.model_name || sessionInfo.modelName || "LightExNet V2"}
                />
                <InfoRow label="Total Deteksi" value={totalDetections} />
              </div>
            </section>

            <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    Status Laporan
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-blue-900/80">
                    Laporan ini telah tersimpan di database sistem dan dapat digunakan
                    sebagai bahan evaluasi awal oleh konselor.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                  <BarChart3 size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-slate-950">
                    Validasi Model
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <ValidationRow
                      label="Model"
                      value={report.modelName || sessionInfo.modelName || "LightExNet V2"}
                    />
                    <ValidationRow label="Akurasi" value={`${accuracy}%`} />

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-blue-900/70">
                        Mode
                      </span>
                      <strong className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#2563EB] ring-1 ring-blue-100">
                        Real-Time
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

function SectionTitle({ icon, iconClass, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <strong className="max-w-[58%] break-words text-right font-extrabold leading-6 text-slate-900">
        {value || "-"}
      </strong>
    </div>
  );
}

function ValidationRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-bold text-blue-900/70">{label}</span>
      <strong className="text-right font-extrabold text-blue-950">
        {value || "-"}
      </strong>
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

function getDominantEmotion(percentages = {}) {
  const entries = Object.entries(percentages);

  if (!entries.length) return "-";

  const sorted = entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));

  return sorted[0]?.[0] || "-";
}

function formatPercent(value) {
  const number = Number(value || 0);

  if (Number.isNaN(number)) return "0.0";

  return number.toFixed(1);
}

function cleanTime(time) {
  if (!time) return "-";

  const cleaned = String(time).replace(/\s*WIB\s*/gi, "").trim();

  if (!cleaned || cleaned === "-") return "-";

  return `${cleaned} WIB`;
}

function formatDurationDisplay(duration) {
  if (!duration) return "-";

  const text = String(duration);

  if (text.includes(":")) return text;

  return text;
}

function cleanMomentAnalysis(text) {
  if (!text) return "";

  return String(text).replace(/responemosi/gi, "respons emosi");
}

function generateFallbackInterpretation(emotion, percent) {
  const value = Number(percent || 0).toFixed(1);

  if (emotion === "Senang") {
    return `Emosi Senang menjadi emosi dominan selama sesi dengan persentase ${value}%. Hal ini dapat mengindikasikan respons emosional yang positif dan kondisi mahasiswa yang relatif nyaman selama proses konseling.`;
  }

  if (emotion === "Sedih") {
    return `Emosi Sedih menjadi emosi dominan selama sesi dengan persentase ${value}%. Hal ini dapat mengindikasikan adanya tekanan emosional, kekecewaan, atau kebutuhan dukungan lebih lanjut pada mahasiswa.`;
  }

  if (emotion === "Marah") {
    return `Emosi Marah menjadi emosi dominan selama sesi dengan persentase ${value}%. Hal ini dapat mengindikasikan adanya frustrasi, ketegangan emosional, atau respons defensif selama proses konseling.`;
  }

  if (emotion === "Takut") {
    return `Emosi Takut menjadi emosi dominan selama sesi dengan persentase ${value}%. Hal ini dapat mengindikasikan adanya kecemasan, kekhawatiran, atau rasa tidak aman yang perlu diperhatikan oleh konselor.`;
  }

  if (emotion === "Netral") {
    return `Emosi Netral menjadi emosi dominan selama sesi dengan persentase ${value}%. Hal ini dapat menunjukkan kondisi ekspresi yang relatif stabil, namun tetap perlu dikaji bersama konteks percakapan konseling.`;
  }

  if (emotion === "Seri") {
    return `Hasil sesi menunjukkan lebih dari satu emosi dominan dengan proporsi yang relatif seimbang. Konselor dapat meninjau konteks percakapan dan momen penting untuk memahami perubahan respons mahasiswa secara lebih akurat.`;
  }

  return "Belum tersedia interpretasi otomatis untuk laporan ini.";
}

function generateFallbackRecommendation(emotion) {
  if (emotion === "Senang") {
    return "Konselor dapat mempertahankan pendekatan yang sudah berjalan baik dan tetap menggali faktor pendukung kondisi positif mahasiswa.";
  }

  if (emotion === "Sedih") {
    return "Konselor disarankan menggunakan pendekatan empatik, memberi ruang bagi mahasiswa untuk bercerita, dan meninjau kemungkinan kebutuhan sesi lanjutan.";
  }

  if (emotion === "Marah") {
    return "Konselor disarankan menurunkan tensi komunikasi, menggunakan pertanyaan terbuka, dan menghindari respons yang berpotensi meningkatkan resistensi mahasiswa.";
  }

  if (emotion === "Takut") {
    return "Konselor disarankan membangun rasa aman, menanyakan sumber kekhawatiran secara perlahan, dan memberikan dukungan yang menenangkan.";
  }

  if (emotion === "Netral") {
    return "Konselor dapat melanjutkan eksplorasi topik utama dan memperhatikan perubahan ekspresi yang muncul pada bagian tertentu sesi.";
  }

  if (emotion === "Seri") {
    return "Konselor disarankan meninjau distribusi emosi dan catatan momen penting untuk melihat bagian sesi yang memicu perubahan ekspresi mahasiswa.";
  }

  return "Belum tersedia rekomendasi awal untuk laporan ini.";
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

export default ReportDetailPage;
