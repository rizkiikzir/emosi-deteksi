import { useNavigate } from "react-router-dom";
import serinIcon from "../assets/serin-icon.png";
import { getEmotionIcon } from "../utils/emotionIcons";
import heroIllustration from "../assets/serin-hero-illustration.png";
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
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
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
              className="text-[var(--serin-primary)]"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("tentang")}
              className="transition hover:text-[var(--serin-primary)]"
            >
              Tentang Sistem
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("fitur")}
              className="transition hover:text-[var(--serin-primary)]"
            >
              Fitur
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("kontak")}
              className="transition hover:text-[var(--serin-primary)]"
            >
              Kontak
            </button>
          </nav>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex h-12 items-center gap-3 rounded-2xl px-7 text-sm font-extrabold text-white shadow-[var(--serin-shadow-primary)] transition hover:-translate-y-0.5 hover:brightness-105 [background:var(--serin-gradient)]"
          >
            <UserRound size={18} />
            Login Konselor
          </button>
        </div>
      </header>

      <section
        id="beranda"
        className="relative overflow-hidden bg-gradient-to-br from-white via-[var(--serin-primary-soft)]/45 to-[var(--serin-accent-soft)]/45"
      >
        <HeroDecorations />

        <div className="mx-auto grid min-h-[calc(100vh-86px)] max-w-[1500px] grid-cols-1 items-center gap-12 px-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div className="relative z-10 -mt-4">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--serin-primary-border)] bg-white/80 px-4 py-2 text-xs font-extrabold text-[var(--serin-primary)] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--serin-accent)]" />
              SERIN • Real-Time Emotion Monitoring
            </div>

            <h2 className="max-w-[680px] text-[38px] font-black leading-[1.08] tracking-[-0.035em] text-slate-950 md:text-[48px]">
              SERIN untuk Monitoring Emosi{" "}
              <span className="bg-gradient-to-r from-[var(--serin-primary)] via-[#2563eb] to-[var(--serin-accent)] bg-clip-text text-transparent">
                Konseling Mahasiswa
              </span>
            </h2>

            <p className="mt-4 max-w-[600px] text-sm font-medium leading-7 text-slate-600">
              SERIN membantu konselor memantau ekspresi emosi mahasiswa selama sesi
              konseling melalui deteksi wajah real-time, grafik sebaran emosi,
              marker momen penting, serta laporan otomatis berbasis data.
            </p>

            <EmotionCards />

            <div className="mt-5 flex flex-wrap gap-5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="serin-primary-button flex h-12 items-center gap-3 rounded-2xl px-8 text-sm font-extrabold"
              >
                <Play size={17} />
                Masuk Dashboard Konselor
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

          <HeroIllustration />
        </div>
      </section>

      <section id="fitur" className="bg-white px-8 py-16 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-[var(--serin-primary-border)] bg-[var(--serin-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[var(--serin-primary)]">
              Fitur SERIN
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Fitur Utama Sistem
            </h2>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
              SERIN membantu proses konseling mulai dari pemantauan emosi real-time,
              pencatatan momen penting, hingga pembuatan laporan otomatis.
            </p>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full [background:var(--serin-gradient)]" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
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
              title="Data Tersimpan"
              description="Data mahasiswa, sesi, hasil deteksi, marker, dan laporan tersimpan di database sistem."
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
        className="bg-gradient-to-br from-white via-[var(--serin-primary-soft)]/45 to-[var(--serin-accent-soft)]/45 px-8 py-16 lg:px-10"
      >
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <span className="inline-flex rounded-full border border-[var(--serin-primary-border)] bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-wide text-[var(--serin-primary)] shadow-sm">
              Tentang Sistem
            </span>

            <h2 className="mt-6 max-w-[650px] text-[36px] font-black leading-[1.12] tracking-[-0.03em] text-slate-950">
              Apa itu Sistem Deteksi Emosi Wajah{" "}
              <span className="bg-gradient-to-r from-[var(--serin-primary)] via-[#2563eb] to-[var(--serin-accent)] bg-clip-text text-transparent">
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

function HeroIllustration() {
  return (
    <div className="relative z-10 -mt-2">
      <div className="absolute -inset-6 rounded-[36px] bg-[var(--serin-gradient-soft)] blur-2xl" />

      <div className="relative mx-auto max-w-[760px] overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-3 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <img
          src={heroIllustration}
          alt="Ilustrasi SERIN untuk monitoring emosi konseling mahasiswa"
          className="w-full rounded-[24px] object-cover"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.055)] transition hover:-translate-y-1 hover:border-[var(--serin-primary-border)] hover:shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--serin-primary-soft)] to-[var(--serin-accent-soft)] text-[var(--serin-primary)] ring-1 ring-[var(--serin-primary-border)] transition group-hover:text-[var(--serin-accent-dark)]">
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
  const insights = [
    {
      title: "Deteksi Real-Time",
      value: "5 Emosi",
      desc: "Senang, Sedih, Marah, Takut, dan Netral.",
      icon: <Camera size={24} />,
    },
    {
      title: "Marker Sesi",
      value: "Momen Penting",
      desc: "Konselor dapat menandai titik penting selama sesi.",
      icon: <Activity size={24} />,
    },
    {
      title: "Laporan Otomatis",
      value: "PDF Report",
      desc: "Ringkasan emosi, grafik, interpretasi, dan rekomendasi.",
      icon: <FileText size={24} />,
    },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute h-[380px] w-[380px] rounded-full bg-[var(--serin-gradient-soft)] blur-3xl" />

      <div className="relative w-full max-w-[660px] rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.10)]">
        <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--serin-primary)]">
              SERIN Insight
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Dari Deteksi Emosi ke Laporan Konseling
            </h3>
            <p className="mt-3 max-w-[520px] text-sm font-semibold leading-7 text-slate-500">
              SERIN membantu mengubah hasil deteksi wajah selama sesi menjadi
              data pendukung yang mudah dibaca oleh konselor.
            </p>
          </div>

          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--serin-primary-soft)] to-[var(--serin-accent-soft)] text-[var(--serin-primary)] ring-1 ring-[var(--serin-primary-border)] md:flex">
            <Brain size={28} />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {insights.map((item, index) => (
            <div
              key={item.title}
              className="group flex items-center gap-4 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-[var(--serin-primary-border)] hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--serin-primary)] shadow-sm ring-1 ring-slate-200">
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--serin-primary-soft)] text-xs font-black text-[var(--serin-primary)]">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-950">
                    {item.title}
                  </h4>
                </div>
                <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">
                  {item.desc}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm sm:block">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[22px] border border-[var(--serin-primary-border)] bg-[var(--serin-primary-soft)]/70 p-4">
          <p className="text-sm font-semibold leading-7 text-slate-600">
            <b className="text-[var(--serin-primary)]">Output utama:</b>{" "}
            grafik sebaran emosi, distribusi emosi, marker momen penting,
            interpretasi otomatis, dan laporan konseling berbentuk PDF.
          </p>
        </div>
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
            className="group relative rounded-[24px] border border-slate-200/80 bg-white p-5 text-center shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-[var(--serin-primary-border)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--serin-primary-border)] bg-[var(--serin-primary-soft)] text-xs font-extrabold text-[var(--serin-primary)]">
              {index + 1}
            </span>

            <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--serin-primary-soft)] to-[var(--serin-accent-soft)] text-[var(--serin-primary)] ring-1 ring-[var(--serin-primary-border)] transition group-hover:text-[var(--serin-accent-dark)]">
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
        <b className="text-[#4338CA]">Info:</b> Model LightExNet digunakan untuk
        mendukung proses klasifikasi emosi wajah secara real-time pada sistem
        konseling mahasiswa.
      </div>
    </div>
  );
}

function ArchItem({ icon, label }) {
  return (
    <div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--serin-primary-soft)] to-[var(--serin-accent-soft)] text-[var(--serin-primary)] ring-1 ring-[var(--serin-primary-border)]">
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-700">
        {label}
      </p>
    </div>
  );
}

function EmotionCards({ compact = false }) {
  const emotions = ["Senang", "Sedih", "Marah", "Takut", "Netral"];

  return (
    <div
      className={`grid max-w-[560px] grid-cols-5 gap-4 ${compact ? "mt-6" : "mt-5"
        }`}
    >
      {emotions.map((label) => (
        <div
          key={label}
          className="flex h-20 flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/90 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-sm ring-1 ring-slate-100">
            <img
              src={getEmotionIcon(label)}
              alt={label}
              className="h-7 w-7 object-contain"
            />
          </div>

          <p className="mt-2.5 text-sm font-semibold text-slate-800">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroDecorations() {
  return (
    <>
      <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[var(--serin-primary-soft)]/80" />
      <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-[var(--serin-accent-soft)]/70" />
      <div className="absolute bottom-0 left-0 h-32 w-[520px] rounded-[50%] border-t border-[var(--serin-accent)]/25" />
      <div className="absolute bottom-6 left-20 h-28 w-[520px] rounded-[50%] border-t border-[var(--serin-primary)]/20" />
      <div className="absolute right-[52%] top-56 grid grid-cols-7 gap-2 opacity-25">
        {Array.from({ length: 49 }).map((_, index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-[var(--serin-primary)]/35"
          />
        ))}
      </div>
    </>
  );
}

export default LandingPage;