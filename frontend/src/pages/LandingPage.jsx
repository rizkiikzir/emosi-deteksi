import { useNavigate } from "react-router-dom";
import serinIcon from "../assets/serin-icon.png";
import {
  Activity,
  BarChart3,
  Camera,
  Database,
  FileText,
  Info,
  Lock,
  Monitor,
  Play,
  ShieldCheck,
  Smile,
  UserRound,
  Brain,
  LineChart,
  Users,
} from "lucide-react";

function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[86px] max-w-[1500px] items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-indigo-100">
              <img
                src={serinIcon}
                alt="SERIN"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-slate-950">
                SERIN
              </h1>
              <p className="text-xs font-semibold leading-tight text-slate-500">
                Emotion Recognition System
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-700 lg:flex">
            <button
              type="button"
              onClick={() => scrollToSection("beranda")}
              className="text-[#5B4FE9]"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("tentang")}
              className="transition hover:text-[#5B4FE9]"
            >
              Tentang Sistem
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("fitur")}
              className="transition hover:text-[#5B4FE9]"
            >
              Fitur
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("kontak")}
              className="transition hover:text-[#5B4FE9]"
            >
              Kontak
            </button>
          </nav>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="serin-primary-button flex h-12 items-center gap-3 rounded-2xl px-7 text-sm font-extrabold"
          >
            <UserRound size={18} />
            Login Konselor
          </button>
        </div>
      </header>

      <section
        id="beranda"
        className="relative overflow-hidden bg-gradient-to-br from-white via-[#EEF2FF]/45 to-[#E6FFFB]/35"
      >
        <HeroDecorations />

        <div className="mx-auto grid min-h-[calc(100vh-86px)] max-w-[1500px] grid-cols-1 items-center gap-10 px-10 pb-5 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10 -mt-4">
            <h2 className="max-w-[620px] text-[34px] font-extrabold leading-[1.15] tracking-tight text-slate-950">
              Sistem Deteksi Emosi Wajah Real-Time untuk{" "}
              <span className="bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] bg-clip-text text-transparent">
                Pendampingan Konseling Mahasiswa
              </span>
            </h2>

            <p className="mt-4 max-w-[600px] text-sm font-medium leading-7 text-slate-600">
              Sistem berbasis Artificial Intelligence dengan arsitektur CNN
              LightExNet yang mampu mendeteksi 5 emosi utama secara real-time
              dan menyajikan analisis serta interpretasi untuk mendukung
              konselor dalam memahami kondisi emosional mahasiswa.
            </p>

            <EmotionCards />

            <div className="mt-5 flex flex-wrap gap-5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="serin-primary-button flex h-12 items-center gap-3 rounded-2xl px-8 text-sm font-extrabold"
              >
                <Play size={17} />
                Mulai Sesi Konseling
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("tentang")}
                className="serin-soft-button flex h-12 items-center gap-3 rounded-2xl px-8 text-sm font-extrabold"
              >
                <Info size={17} />
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      <section id="fitur" className="bg-white px-10 py-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-950">
              Fitur Utama Sistem
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6]" />
          </div>

          <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <FeatureCard
              icon={<Activity size={28} />}
              title="Deteksi Real-Time"
              description="Deteksi 5 emosi utama secara real-time menggunakan arsitektur CNN LightExNet yang efisien."
            />
            <FeatureCard
              icon={<LineChart size={28} />}
              title="Grafik Sebaran Emosi"
              description="Visualisasi rekam jejak emosi mahasiswa dalam bentuk grafik sebaran selama sesi konseling."
            />
            <FeatureCard
              icon={<FileText size={28} />}
              title="Laporan & Interpretasi"
              description="Sistem menghasilkan laporan statistik dan interpretasi otomatis sebagai alat bantu keputusan."
            />
            <FeatureCard
              icon={<ShieldCheck size={28} />}
              title="Aman & Terpercaya"
              description="Data sesi konseling tersimpan dengan aman dan hanya dapat diakses oleh pihak yang berwenang."
            />
            <FeatureCard
              icon={<Monitor size={28} />}
              title="Ringan & Stabil"
              description="Dirancang agar ringan dan stabil berjalan pada perangkat standar tanpa lagging di lingkungan kampus."
            />
          </div>
        </div>
      </section>

      <section
        id="tentang"
        className="bg-gradient-to-br from-white via-[#EEF2FF]/45 to-[#E6FFFB]/35 px-10 py-14"
      >
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <span className="inline-flex rounded-full border border-[#DBE1FF] bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-[#5B4FE9] shadow-sm">
              Tentang Sistem
            </span>

            <h2 className="mt-6 max-w-[650px] text-[38px] font-extrabold leading-[1.16] tracking-tight text-slate-950">
              Apa itu Sistem Deteksi Emosi Wajah{" "}
              <span className="bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] bg-clip-text text-transparent">
                Real-Time?
              </span>
            </h2>

            <p className="mt-6 max-w-[650px] text-base font-medium leading-8 text-slate-600">
              Sistem ini merupakan solusi berbasis Artificial Intelligence (AI)
              untuk mendeteksi dan menganalisis emosi wajah mahasiswa secara
              real-time selama sesi konseling. Sistem dirancang khusus untuk
              membantu konselor Unit BK Politeknik Negeri Lhokseumawe dalam
              memahami kondisi emosional mahasiswa melalui data visual yang
              akurat, objektif, dan mudah diinterpretasi.
            </p>

            <p className="mt-5 max-w-[650px] text-base font-medium leading-8 text-slate-600">
              Sistem ini hanya mengenali 5 emosi utama sesuai kebutuhan
              konseling:{" "}
              <b className="text-slate-950">
                Senang, Sedih, Marah, Takut, dan Netral.
              </b>
            </p>

            <EmotionCards compact />
          </div>

          <InfoVisual />
        </div>

        <div className="mx-auto mt-10 grid max-w-[1500px] gap-6 lg:grid-cols-[1fr_430px]">
          <HowItWorks />
          <ArchitectureCard />
        </div>
      </section>

      <section
        id="kontak"
        className="border-t border-slate-200 bg-white px-10 py-8"
      >
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 text-sm font-semibold text-slate-500 md:flex-row md:items-center">
          <p>© 2026 Unit BK Politeknik Negeri Lhokseumawe.</p>
          <p>
            Sistem Deteksi Emosi Wajah untuk Pendampingan Konseling Mahasiswa.
          </p>
        </div>
      </section>
    </main>
  );
}

function HeroMockup() {
  return (
    <div className="relative z-10 -mt-2">
      <div className="rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.10)]">
        <div className="flex h-9 items-center gap-2 border-b border-slate-200 px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>

        <div className="p-4">
          <h3 className="text-sm font-extrabold text-slate-950">
            Monitoring Emosi Real-Time
          </h3>

          <div className="mt-3 grid gap-3 lg:grid-cols-[220px_105px_1fr]">
            <div className="rounded-xl bg-slate-100 p-2.5">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-200">
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  🙂
                </div>
                <div className="absolute inset-10 rounded-xl border-2 border-emerald-500" />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-600">● Deteksi Berjalan</span>
                <span className="text-slate-500">FPS: 24.3</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs font-bold text-slate-500">
                Emosi Saat Ini
              </p>
              <div className="mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                😊
              </div>
              <h4 className="mt-2 text-lg font-extrabold text-emerald-700">
                Senang
              </h4>
              <p className="mt-4 text-xs font-bold text-slate-500">
                Confidence
              </p>
              <p className="text-2xl font-extrabold text-emerald-600">
                87.3%
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[87%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-extrabold text-slate-950">
                Grafik Sebaran Emosi (Real-Time)
              </h4>
              <FakeScatter />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <p className="mb-3 text-sm font-extrabold text-slate-950">
              Ringkasan Sesi
            </p>
            <div className="grid gap-4 text-xs font-semibold text-slate-600 md:grid-cols-4">
              <SummaryMini
                icon={<UserRound size={16} />}
                label="Mahasiswa"
                value="Muhammad Rizki"
              />
              <SummaryMini
                icon={<Users size={16} />}
                label="Konselor"
                value="Hendrawaty, ST., MT"
              />
              <SummaryMini
                icon={<Activity size={16} />}
                label="Durasi"
                value="00:15:00"
              />
              <SummaryMini
                icon={<Camera size={16} />}
                label="Waktu"
                value="12 Mei 2024"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-2.5 text-xs font-semibold text-[#4338CA]">
            <Info size={15} />
            Sistem mendeteksi dan menganalisis emosi secara real-time.
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeScatter() {
  const points = [
    ["10%", "78%", "bg-emerald-500"],
    ["28%", "68%", "bg-slate-400"],
    ["42%", "45%", "bg-yellow-500"],
    ["52%", "31%", "bg-red-500"],
    ["61%", "88%", "bg-emerald-500"],
    ["74%", "20%", "bg-blue-500"],
    ["84%", "62%", "bg-yellow-500"],
    ["90%", "38%", "bg-red-500"],
  ];

  return (
    <div className="relative mt-3 h-44 rounded-xl bg-white">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-5">
        {Array.from({ length: 30 }).map((_, index) => (
          <div key={index} className="border border-slate-100" />
        ))}
      </div>

      <div className="absolute left-0 top-2 text-[10px] font-semibold text-slate-500">
        Senang
      </div>
      <div className="absolute left-0 top-[42%] text-[10px] font-semibold text-slate-500">
        Takut
      </div>
      <div className="absolute bottom-1 left-0 text-[10px] font-semibold text-slate-500">
        Sedih
      </div>

      {points.map(([left, top, color], index) => (
        <span
          key={index}
          className={`absolute h-2.5 w-2.5 rounded-full ${color}`}
          style={{ left, top }}
        />
      ))}
    </div>
  );
}

function SummaryMini({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#5B4FE9]">{icon}</span>
      <div>
        <p className="text-slate-400">{label}</p>
        <p className="truncate font-extrabold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E6FFFB] text-[#5B4FE9] ring-1 ring-indigo-100 transition group-hover:text-[#14B8A6]">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-extrabold text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InfoVisual() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute h-[360px] w-[360px] rounded-full bg-[#E6FFFB]/70 blur-2xl" />

      <div className="relative w-full max-w-[680px]">
        <div className="mx-auto rounded-[28px] border border-slate-300 bg-slate-900 p-3 shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
          <div className="rounded-2xl bg-white p-5">
            <div className="grid grid-cols-[120px_1fr] overflow-hidden rounded-xl border border-slate-200">
              <div className="bg-slate-900 p-4 text-white">
                <p className="text-xs font-extrabold">SERIN</p>
                {[
                  "Dashboard",
                  "Sesi Konseling",
                  "Monitoring",
                  "Laporan",
                  "Riwayat",
                ].map((item) => (
                  <p
                    key={item}
                    className="mt-4 text-[11px] font-semibold text-slate-300"
                  >
                    {item}
                  </p>
                ))}
              </div>

              <div className="p-5">
                <h3 className="text-sm font-extrabold text-slate-950">
                  Grafik Sebaran Emosi
                </h3>
                <FakeScatter />
              </div>
            </div>
          </div>
        </div>

        <FloatingInfo
          icon={<LineChart size={34} />}
          title="Analisis"
          sub="Objektif"
          top="0"
          right="0"
        />
        <FloatingInfo
          icon={<Lock size={30} />}
          title="Data Aman"
          sub="& Terpercaya"
          top="120px"
          right="-10px"
        />
        <FloatingInfo
          icon={<Users size={32} />}
          title="Pendukung"
          sub="Keputusan Konselor"
          top="250px"
          right="0"
        />
      </div>
    </div>
  );
}

function FloatingInfo({ icon, title, sub, top, right }) {
  return (
    <div
      className="absolute hidden items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] xl:flex"
      style={{ top, right }}
    >
      <div className="text-[#5B4FE9]">{icon}</div>
      <div>
        <p className="text-sm font-extrabold text-slate-950">{title}</p>
        <p className="text-sm font-semibold text-slate-700">{sub}</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    [
      "Akuisisi Data",
      "Webcam menangkap citra wajah mahasiswa secara real-time selama sesi konseling berlangsung.",
      <Camera size={34} />,
    ],
    [
      "Deteksi Wajah",
      "Sistem mendeteksi dan mengekstraksi area wajah menggunakan algoritma Haar Cascade.",
      <Smile size={34} />,
    ],
    [
      "Klasifikasi Emosi",
      "Model CNN LightExNet menganalisis fitur wajah dan mengklasifikasikan ke dalam 5 emosi utama.",
      <Brain size={34} />,
    ],
    [
      "Visualisasi Real-Time",
      "Hasil prediksi ditampilkan secara real-time dalam grafik sebaran berdasarkan waktu.",
      <BarChart3 size={34} />,
    ],
    [
      "Laporan & Interpretasi",
      "Sistem merangkum data sesi dan memberikan interpretasi otomatis berdasarkan aturan konseling.",
      <FileText size={34} />,
    ],
  ];

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-extrabold text-slate-950">
        Cara Kerja Sistem
      </h2>

      <div className="mt-7 grid gap-5 lg:grid-cols-5">
        {steps.map(([title, desc, icon], index) => (
          <div
            key={title}
            className="group relative rounded-[22px] border border-slate-200/80 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#DBE1FF] bg-[#EEF2FF] text-xs font-extrabold text-[#5B4FE9]">
              {index + 1}
            </span>

            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E6FFFB] text-[#5B4FE9] ring-1 ring-indigo-100 transition group-hover:text-[#14B8A6]">
              {icon}
            </div>

            <h3 className="mt-5 text-sm font-extrabold text-slate-950">
              {title}
            </h3>

            <p className="mt-3 text-xs font-medium leading-6 text-slate-600">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureCard() {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <h2 className="text-xl font-extrabold text-slate-950">
        Arsitektur Model
      </h2>

      <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
        Sistem menggunakan arsitektur CNN LightExNet yang ringan dan efisien
        untuk deteksi real-time.
      </p>

      <div className="mt-7 grid grid-cols-4 gap-4 text-center">
        <ArchItem icon={<Database size={32} />} label="Input Citra Wajah" />
        <ArchItem icon={<Brain size={32} />} label="CNN LightExNet" />
        <ArchItem icon={<BarChart3 size={32} />} label="Klasifikasi 5 Emosi" />
        <ArchItem icon={<FileText size={32} />} label="Output Prediksi" />
      </div>

      <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-medium leading-6 text-slate-600">
        <b className="text-[#4338CA]">Info:</b> LightExNet dirancang agar mampu
        berjalan real-time dengan akurasi tinggi namun tetap ringan untuk
        perangkat standar.
      </div>
    </div>
  );
}

function ArchItem({ icon, label }) {
  return (
    <div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E6FFFB] text-[#5B4FE9] ring-1 ring-indigo-100">
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-700">
        {label}
      </p>
    </div>
  );
}

function EmotionCards({ compact = false }) {
  const emotions = [
    ["😊", "Senang"],
    ["😟", "Sedih"],
    ["😠", "Marah"],
    ["😨", "Takut"],
    ["😐", "Netral"],
  ];

  return (
    <div
      className={`grid max-w-[560px] grid-cols-5 gap-4 ${
        compact ? "mt-6" : "mt-5"
      }`}
    >
      {emotions.map(([emoji, label]) => (
        <div
          key={label}
          className="flex h-20 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
        >
          <span className="text-3xl">{emoji}</span>
          <p className="mt-3 text-sm font-semibold text-slate-800">{label}</p>
        </div>
      ))}
    </div>
  );
}

function HeroDecorations() {
  return (
    <>
      <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#EEF2FF]/80" />
      <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#E6FFFB]/70" />
      <div className="absolute bottom-0 left-0 h-32 w-[520px] rounded-[50%] border-t border-[#14B8A6]/25" />
      <div className="absolute bottom-6 left-20 h-28 w-[520px] rounded-[50%] border-t border-[#5B4FE9]/20" />
      <div className="absolute right-[52%] top-56 grid grid-cols-7 gap-2 opacity-25">
        {Array.from({ length: 49 }).map((_, index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-[#5B4FE9]/35"
          />
        ))}
      </div>
    </>
  );
}

export default LandingPage;