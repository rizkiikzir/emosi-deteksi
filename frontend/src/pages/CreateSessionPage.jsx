import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";
import {
  Search,
  Users,
  Plus,
  Check,
  UserRound,
  FileText,
  CalendarClock,
  Clock3,
  ShieldCheck,
  Settings,
  Info,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

const STUDENTS_STORAGE_KEY = "studentsData";

const DEFAULT_FORM = {
  studentId: "",
  studentName: "",
  nim: "",
  programStudy: "",
  counselorName: "Hendrawaty, ST., MT",

  title: "",
  counselingType: "Konseling Akademik",
  topic: "",
  method: "Tatap Muka",
  location: "Ruang Konseling Unit BK PNL",
  purpose: "",
  initialNote: "",

  date: new Date().toISOString().slice(0, 10),
  startTime: "",
  duration: "00:30:00",
};

const STEPS = [
  {
    id: 1,
    title: "Mahasiswa",
    desc: "Pilih data",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Informasi",
    desc: "Detail sesi",
    icon: FileText,
  },
  {
    id: 3,
    title: "Jadwal",
    desc: "Waktu sesi",
    icon: CalendarClock,
  },
  {
    id: 4,
    title: "Konfirmasi",
    desc: "Tinjau data",
    icon: ClipboardCheck,
  },
];

const DETECTED_EMOTIONS = [
  { name: "Senang", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  { name: "Sedih", bg: "bg-blue-50", ring: "ring-blue-100" },
  { name: "Marah", bg: "bg-rose-50", ring: "ring-rose-100" },
  { name: "Takut", bg: "bg-amber-50", ring: "ring-amber-100" },
  { name: "Netral", bg: "bg-slate-50", ring: "ring-slate-100" },
];

function CreateSessionPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [students, setStudents] = useState([]);
  const [studentKeyword, setStudentKeyword] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    const savedStudents = safeParse(localStorage.getItem(STUDENTS_STORAGE_KEY));

    if (Array.isArray(savedStudents)) {
      setStudents(savedStudents);
    }
  }, []);

  const filteredStudents = useMemo(() => {
    const search = studentKeyword.toLowerCase().trim();

    if (!search) return students;

    return students.filter((student) => {
      return (
        student.name?.toLowerCase().includes(search) ||
        student.nim?.toLowerCase().includes(search) ||
        student.programStudy?.toLowerCase().includes(search)
      );
    });
  }, [students, studentKeyword]);

  const todayText = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-500 disabled:shadow-none";

  const textareaClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-slate-800 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50";

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectStudent = (student) => {
    setFormData((prev) => ({
      ...prev,
      studentId: student.id || student.nim,
      studentName: student.name || "",
      nim: student.nim || "",
      programStudy: student.programStudy || "",
    }));
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDuration = (duration) => {
    const map = {
      "00:15:00": "15 menit",
      "00:30:00": "30 menit",
      "00:45:00": "45 menit",
      "01:00:00": "60 menit",
    };

    return map[duration] || duration || "-";
  };

  const getStepTitle = () => {
    if (step === 1) return "Pilih Mahasiswa";
    if (step === 2) return "Informasi Dasar Sesi";
    if (step === 3) return "Jadwal dan Durasi Sesi";
    return "Konfirmasi Sesi Konseling";
  };

  const getStepSubtitle = () => {
    if (step === 1) {
      return "Pilih mahasiswa dari data yang sudah terdaftar sebelum membuat sesi.";
    }

    if (step === 2) return "Lengkapi informasi utama sesi konseling.";
    if (step === 3) return "Atur tanggal, waktu mulai, dan estimasi durasi sesi.";
    return "Periksa kembali seluruh data sebelum memulai monitoring emosi.";
  };

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.studentName.trim() &&
        formData.nim.trim() &&
        formData.programStudy.trim()
      );
    }

    if (step === 2) {
      return (
        formData.title.trim() &&
        formData.counselingType.trim() &&
        formData.topic.trim() &&
        formData.location.trim() &&
        formData.purpose.trim()
      );
    }

    if (step === 3) {
      return formData.date && formData.startTime && formData.duration;
    }

    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      alert("Lengkapi data wajib terlebih dahulu.");
      return;
    }

    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (step === 1) {
      navigate("/sesi-konseling");
      return;
    }

    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateSessionId = () => {
    return `KS-${Date.now().toString().slice(-8)}`;
  };

  const handleStartMonitoring = () => {
    const sessionId = generateSessionId();

    const newSession = {
      id: sessionId,
      sessionId,

      studentId: formData.studentId,
      studentName: formData.studentName.trim(),
      nim: formData.nim.trim(),
      programStudy: formData.programStudy.trim(),
      counselorName: formData.counselorName.trim(),

      title: formData.title.trim(),
      counselingType: formData.counselingType,
      topic: formData.topic.trim(),
      method: formData.method,
      location: formData.location.trim(),
      purpose: formData.purpose.trim(),
      initialNote: formData.initialNote.trim(),

      startDate: formatDateForDisplay(formData.date),
      startTime: formData.startTime,
      duration: formData.duration,

      modelName: "LightExNet V2",
      detectedEmotions: ["Senang", "Sedih", "Marah", "Takut", "Netral"],

      status: "Berjalan",
      createdAt: new Date().toISOString(),
    };

    const existingSessions =
      safeParse(localStorage.getItem("counselingSessions")) || [];

    const updatedSessions = [newSession, ...existingSessions];

    localStorage.setItem("counselingSessions", JSON.stringify(updatedSessions));
    localStorage.setItem("currentCounselingSession", JSON.stringify(newSession));

    navigate("/monitoring", {
      state: {
        session: newSession,
      },
    });
  };

  return (
    <AppLayout
      title="Buat Sesi Konseling Baru"
      subtitle="Lengkapi data sesi sebelum memulai pemantauan emosi"
      showSessionStatus={false}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <StepProgress steps={STEPS} activeStep={step} />

          <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-extrabold text-slate-950">
                {getStepTitle()}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {getStepSubtitle()}
              </p>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="space-y-6">
                  <StudentPicker
                    students={filteredStudents}
                    keyword={studentKeyword}
                    setKeyword={setStudentKeyword}
                    selectedStudentId={formData.studentId}
                    onSelect={handleSelectStudent}
                    onAddStudent={() => navigate("/mahasiswa")}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nama Mahasiswa">
                      <input
                        className={inputClass}
                        value={formData.studentName}
                        disabled
                        placeholder="Akan terisi otomatis"
                      />
                    </Field>

                    <Field label="NIM">
                      <input
                        className={inputClass}
                        value={formData.nim}
                        disabled
                        placeholder="Akan terisi otomatis"
                      />
                    </Field>

                    <Field label="Program Studi">
                      <input
                        className={inputClass}
                        value={formData.programStudy}
                        disabled
                        placeholder="Akan terisi otomatis"
                      />
                    </Field>

                    <Field label="Nama Konselor">
                      <input
                        className={inputClass}
                        value={formData.counselorName}
                        onChange={(e) =>
                          updateForm("counselorName", e.target.value)
                        }
                        placeholder="Nama konselor"
                      />
                    </Field>
                  </div>

                  <DetectionSettingsPanel />
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Judul Sesi Konseling" required>
                    <input
                      className={inputClass}
                      value={formData.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="Contoh: Konseling Perkembangan Akademik"
                    />
                  </Field>

                  <Field label="Jenis Konseling" required>
                    <select
                      className={inputClass}
                      value={formData.counselingType}
                      onChange={(e) =>
                        updateForm("counselingType", e.target.value)
                      }
                    >
                      <option value="Konseling Akademik">
                        Konseling Akademik
                      </option>
                      <option value="Konseling Pribadi">
                        Konseling Pribadi
                      </option>
                      <option value="Konseling Karier">Konseling Karier</option>
                      <option value="Konseling Sosial">Konseling Sosial</option>
                    </select>
                  </Field>

                  <Field label="Topik Konseling" required>
                    <input
                      className={inputClass}
                      value={formData.topic}
                      onChange={(e) => updateForm("topic", e.target.value)}
                      placeholder="Contoh: Kesulitan belajar"
                    />
                  </Field>

                  <Field label="Lokasi" required>
                    <input
                      className={inputClass}
                      value={formData.location}
                      onChange={(e) => updateForm("location", e.target.value)}
                      placeholder="Contoh: Ruang Konseling Unit BK PNL"
                    />
                  </Field>

                  <Field label="Tujuan Konseling" required>
                    <textarea
                      className={`${textareaClass} min-h-28 resize-none`}
                      value={formData.purpose}
                      onChange={(e) => updateForm("purpose", e.target.value)}
                      placeholder="Tuliskan tujuan sesi konseling..."
                      maxLength={300}
                    />
                    <p className="mt-1 text-right text-xs font-semibold text-slate-400">
                      {formData.purpose.length}/300
                    </p>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Catatan Awal">
                      <textarea
                        className={`${textareaClass} min-h-24 resize-none`}
                        value={formData.initialNote}
                        onChange={(e) =>
                          updateForm("initialNote", e.target.value)
                        }
                        placeholder="Catatan tambahan sebelum sesi dimulai..."
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Tanggal Sesi" required>
                      <input
                        type="date"
                        className={inputClass}
                        value={formData.date}
                        onChange={(e) => updateForm("date", e.target.value)}
                      />
                    </Field>

                    <Field label="Waktu Mulai" required>
                      <input
                        type="time"
                        className={inputClass}
                        value={formData.startTime}
                        onChange={(e) =>
                          updateForm("startTime", e.target.value)
                        }
                      />
                    </Field>

                    <Field label="Estimasi Durasi" required>
                      <select
                        className={inputClass}
                        value={formData.duration}
                        onChange={(e) => updateForm("duration", e.target.value)}
                      >
                        <option value="00:15:00">15 Menit</option>
                        <option value="00:30:00">30 Menit</option>
                        <option value="00:45:00">45 Menit</option>
                        <option value="01:00:00">60 Menit</option>
                      </select>
                    </Field>
                  </div>

                  <InfoBox>
                    Sistem akan menyiapkan sesi monitoring emosi real-time
                    berdasarkan data mahasiswa, informasi konseling, dan waktu
                    sesi yang sudah diatur.
                  </InfoBox>

                  <DetectionSettingsPanel compact />
                </div>
              )}

              {step === 4 && (
                <ReviewPanel
                  formData={formData}
                  formatDateForDisplay={formatDateForDisplay}
                  formatDuration={formatDuration}
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-6 py-5">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                {step === 1 ? "Batal" : "Sebelumnya"}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:brightness-105"
                >
                  Selanjutnya
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartMonitoring}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:brightness-105"
                >
                  Mulai Monitoring
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
        </main>

        <SessionSummary
          step={step}
          formData={formData}
          todayText={todayText}
          formatDateForDisplay={formatDateForDisplay}
          formatDuration={formatDuration}
        />
      </div>
    </AppLayout>
  );
}

function StudentPicker({
  students,
  keyword,
  setKeyword,
  selectedStudentId,
  onSelect,
  onAddStudent,
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-base font-extrabold text-slate-950">
            Pilih Mahasiswa Terdaftar
          </h4>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Data mahasiswa diambil dari halaman Data Mahasiswa.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddStudent}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-extrabold text-[#2563EB] transition hover:border-blue-200 hover:bg-blue-100"
        >
          <Plus size={16} />
          Tambah Data Mahasiswa
        </button>
      </div>

      <div className="relative mt-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari nama mahasiswa, NIM, atau program studi..."
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
        />
      </div>

      <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
        {students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#5B4FE9] ring-1 ring-indigo-100">
              <Users size={21} />
            </div>

            <p className="mt-3 text-sm font-extrabold text-slate-800">
              Data mahasiswa belum tersedia
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Tambahkan data mahasiswa terlebih dahulu di halaman Data
              Mahasiswa.
            </p>
          </div>
        ) : (
          students.map((student) => {
            const isSelected = selectedStudentId === (student.id || student.nim);

            return (
              <button
                key={student.id || student.nim}
                type="button"
                onClick={() => onSelect(student)}
                className={[
                  "w-full rounded-2xl border p-4 text-left transition",
                  isSelected
                    ? "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50 shadow-sm ring-1 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ring-1",
                      isSelected
                        ? "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] text-white ring-blue-100"
                        : "bg-blue-50 text-[#2563EB] ring-blue-100",
                    ].join(" ")}
                  >
                    {getInitial(student.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-extrabold leading-5 text-slate-950">
                      {student.name || "-"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {student.nim || "-"} • {student.programStudy || "-"}
                    </p>
                  </div>

                  <div
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                      isSelected
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-slate-300 text-transparent",
                    ].join(" ")}
                  >
                    <Check size={15} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function StepProgress({ steps, activeStep }) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.055)]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon;
          const isActive = activeStep === item.id;
          const isDone = activeStep > item.id;

          return (
            <div key={item.id} className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold transition",
                    isActive
                      ? "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
                      : isDone
                        ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
                  ].join(" ")}
                >
                  {isDone ? <Check size={18} /> : <Icon size={18} />}
                </div>

                <div className="min-w-0">
                  <p
                    className={[
                      "truncate text-sm font-extrabold",
                      isActive ? "text-[#2563EB]" : "text-slate-800",
                    ].join(" ")}
                  >
                    {item.title}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="ml-14 mt-3 hidden h-1 rounded-full bg-slate-100 md:block">
                <div
                  className={[
                    "h-1 rounded-full transition-all",
                    isDone
                      ? "bg-[#38BDF8]"
                      : isActive
                        ? "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8]"
                        : "",
                  ].join(" ")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DetectionSettingsPanel({ compact = false }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
      {!compact && (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-950">
                Pengaturan Deteksi Emosi
              </h4>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
                Sistem akan mendeteksi 5 emosi utama secara real-time selama
                sesi konseling berlangsung.
              </p>
            </div>
          </div>
        </>
      )}

      <div className={compact ? "" : "mt-5"}>
        <p className="mb-3 text-sm font-extrabold text-slate-800">
          Emosi yang Dideteksi
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {DETECTED_EMOTIONS.map((emotion) => (
            <div
              key={emotion.name}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm"
            >
              <div
                className={[
                  "mx-auto flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1",
                  compact ? "h-11 w-11" : "h-14 w-14",
                  emotion.ring,
                ].join(" ")}
              >
                <img
                  src={getEmotionIcon(emotion.name)}
                  alt={emotion.name}
                  className={compact ? "h-7 w-7 object-contain" : "h-10 w-10 object-contain"}
                />
              </div>

              <p className="mt-2 text-sm font-extrabold text-slate-800">
                {emotion.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-sm ring-1 ring-indigo-100">
            <Settings size={19} />
          </div>

          <div>
            <p className="text-sm font-extrabold text-[#2563EB]">
              Model yang Digunakan
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                CNN LightExNet V2 (Lightweight)
              </p>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-700 ring-1 ring-sky-100">
                Aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({ formData, formatDateForDisplay, formatDuration }) {
  const groups = [
    {
      title: "Data Mahasiswa",
      rows: [
        ["Nama Mahasiswa", formData.studentName],
        ["NIM", formData.nim],
        ["Program Studi", formData.programStudy],
        ["Konselor", formData.counselorName],
      ],
    },
    {
      title: "Informasi Sesi",
      rows: [
        ["Judul Sesi", formData.title],
        ["Jenis Konseling", formData.counselingType],
        ["Topik Konseling", formData.topic],
        ["Lokasi", formData.location],
      ],
    },
    {
      title: "Jadwal dan Deteksi",
      rows: [
        ["Tanggal", formatDateForDisplay(formData.date)],
        ["Waktu Mulai", formData.startTime ? `${formData.startTime} WIB` : "-"],
        ["Estimasi Durasi", formatDuration(formData.duration)],
        ["Model AI", "LightExNet V2"],
        ["Mode", "Real-Time"],
        ["Emosi yang Dideteksi", "Senang, Sedih, Marah, Takut, Netral"],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {groups.map((group, groupIndex) => (
          <div
            key={group.title}
            className={groupIndex > 0 ? "border-t border-slate-100" : ""}
          >
            <div className="bg-slate-50/90 px-5 py-3">
              <h4 className="text-sm font-extrabold text-slate-950">
                {group.title}
              </h4>
            </div>

            <div className="divide-y divide-slate-100">
              {group.rows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-2 px-5 py-3 text-sm md:grid-cols-[190px_1fr]"
                >
                  <p className="font-bold text-slate-500">{label}</p>
                  <p className="min-w-0 break-words font-extrabold leading-relaxed text-slate-900">
                    {value || "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewTextBox title="Tujuan Konseling" value={formData.purpose} />
        <ReviewTextBox
          title="Catatan Awal"
          value={formData.initialNote || "-"}
        />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold leading-relaxed text-blue-900">
          Data sesi sudah siap. Klik tombol <b>Mulai Monitoring</b> untuk
          memulai pemantauan emosi real-time.
        </p>
      </div>
    </div>
  );
}

function ReviewTextBox({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
        {value || "-"}
      </p>
    </div>
  );
}

function SessionSummary({
  step,
  formData,
  todayText,
  formatDateForDisplay,
  formatDuration,
}) {
  return (
    <aside className="h-fit rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] xl:sticky xl:top-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] text-base font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)]">
          {step}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-extrabold text-slate-950">
            Ringkasan Sesi
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            {step === 4 ? "Siap dimulai" : "Belum disimpan"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <MiniSection title="Mahasiswa">
          <MiniInfo label="Nama" value={formData.studentName} />
          <MiniInfo label="NIM" value={formData.nim} />
          <MiniInfo label="Prodi" value={formData.programStudy} />
        </MiniSection>

        <MiniSection title="Sesi">
          <MiniInfo label="Judul" value={formData.title} />
          <MiniInfo label="Jenis" value={formData.counselingType} />
          <MiniInfo label="Topik" value={formData.topic} />
        </MiniSection>

        <MiniSection title="Jadwal">
          <MiniInfo
            label="Tanggal"
            value={formatDateForDisplay(formData.date)}
          />
          <MiniInfo
            label="Waktu"
            value={formData.startTime ? `${formData.startTime} WIB` : "-"}
          />
          <MiniInfo label="Durasi" value={formatDuration(formData.duration)} />
        </MiniSection>

        <MiniSection title="Deteksi">
          <MiniInfo label="Model" value="LightExNet V2" />

          <div>
            <p className="text-xs font-bold text-slate-500">Mode</p>
            <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-700 ring-1 ring-sky-100">
              Real-Time
            </span>
          </div>
        </MiniSection>
      </div>

      <InfoBox className="mt-5">
        Pastikan data sudah sesuai sebelum monitoring dimulai.
      </InfoBox>

      <p className="mt-4 text-xs font-semibold text-slate-400">
        Tanggal hari ini: {todayText}
      </p>
    </aside>
  );
}

function InfoBox({ children, className = "" }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 ${className}`}
    >
      <Info size={18} className="mt-0.5 shrink-0 text-[#5B4FE9]" />
      <p className="text-sm font-semibold leading-relaxed text-indigo-900">
        {children}
      </p>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <p className="mb-2 text-sm font-extrabold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </p>
      {children}
    </label>
  );
}

function MiniSection({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-sm font-extrabold text-slate-950">{title}</h4>
      <div className="mt-3 space-y-2.5 text-sm">{children}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 line-clamp-2 break-words font-extrabold leading-snug text-slate-800">
        {value || "-"}
      </p>
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

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default CreateSessionPage;