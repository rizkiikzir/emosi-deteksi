import { useState } from "react";
import { useNavigate } from "react-router-dom";
import serinLogo from "../assets/serin-logo.png";
import serinIcon from "../assets/serin-icon.png";
import logoPnl from "../assets/logo-Pnl.png";
import { getEmotionIcon } from "../utils/emotionIcons";
import { Eye, EyeOff, Info, Lock, UserRound } from "lucide-react";

function LoginPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const updateForm = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errorMessage) setErrorMessage("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const username = formData.username.trim().toLowerCase();
        const password = formData.password.trim();

        const isCounselorLogin =
            (username === "konselor" || username === "hendrawaty") &&
            password === "konselor123";

        const isAdminLogin = username === "admin" && password === "admin123";

        if (!isCounselorLogin && !isAdminLogin) {
            setErrorMessage("Email/username atau password tidak sesuai.");
            return;
        }

        const authUser = {
            name: isAdminLogin ? "Admin Unit BK" : "Hendrawaty, ST., MT",
            role: isAdminLogin ? "Admin" : "Konselor",
            username,
            isLoggedIn: true,
            loginAt: new Date().toISOString(),
        };

        localStorage.setItem("authUser", JSON.stringify(authUser));
        localStorage.setItem("isAuthenticated", "true");

        navigate("/dashboard");
    };

    return (
        <main className="h-screen overflow-hidden bg-white text-slate-950">
            <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
                <section className="relative hidden overflow-hidden bg-gradient-to-br from-white via-[#EEF2FF]/60 to-[#E6FFFB]/45 px-8 py-5 lg:flex lg:flex-col">
                    <Decorations />

                    <div className="relative z-10 ml-3 w-fit">
                        <img
                            src={serinLogo}
                            alt="SERIN - Smart Emotion Recognition for Integrated Counseling"
                            className="w-[160px] object-contain"
                        />
                    </div>

                    <div className="relative z-10 mt-8 max-w-[560px]">
                        <h1 className="text-[28px] font-extrabold leading-[1.18] tracking-tight text-slate-950">
                            Selamat Datang di SERIN
                            <br />
                            <span className="bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] bg-clip-text text-transparent">
                                Sistem Deteksi Emosi Wajah
                            </span>
                            <br />
                            untuk Pendampingan Konseling Mahasiswa
                        </h1>

                        <p className="mt-4 max-w-[620px] text-sm font-medium leading-7 text-slate-600">
                            SERIN adalah sistem berbasis Artificial Intelligence dengan
                            arsitektur CNN LightExNet yang membantu konselor mendeteksi dan
                            memantau emosi wajah mahasiswa secara real-time selama sesi
                            konseling.
                        </p>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-[#5B4FE9]">
                                5 Emosi Utama yang Dideteksi
                            </p>

                            <div className="mt-3 grid grid-cols-5 gap-3">
                                {["Senang", "Sedih", "Marah", "Takut", "Netral"].map((label) => (
                                    <div key={label} className="text-center">
                                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                                            <img
                                                src={getEmotionIcon(label)}
                                                alt={label}
                                                className="h-8 w-8 object-contain"
                                            />
                                        </div>

                                        <p className="mt-2 text-xs font-semibold text-slate-800">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-5 flex items-center gap-3 border-t border-slate-100 pt-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                            <img
                                src={logoPnl}
                                alt="Logo Politeknik Negeri Lhokseumawe"
                                className="h-10 w-10 object-contain"
                            />
                        </div>

                        <div>
                            <h4 className="text-sm font-extrabold text-slate-950">
                                Unit BK Politeknik Negeri Lhokseumawe
                            </h4>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Mendukung layanan konseling berbasis teknologi.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex h-screen items-center justify-center overflow-hidden bg-white px-6 py-4 lg:-ml-16">
                    <div className="w-full max-w-[480px]">
                        <div className="mb-6 flex items-center gap-3 lg:hidden">
                            <img
                                src={serinLogo}
                                alt="SERIN - Emotion Recognition System"
                                className="w-[190px] object-contain"
                            />
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
                            <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] p-2 ring-1 ring-[#DBE1FF] shadow-sm">
                                    <img
                                        src={serinIcon}
                                        alt="SERIN"
                                        className="h-full w-full object-contain"
                                    />
                                </div>

                                <h2 className="mt-1.5 text-[20px] font-extrabold tracking-tight text-slate-950">
                                    Masuk ke SERIN
                                </h2>

                                <p className="mt-1 text-xs font-medium text-slate-600">
                                    Akses dashboard konseling dan monitoring emosi mahasiswa
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
                                <div>
                                    <label className="mb-2 block text-sm font-extrabold text-slate-950">
                                        Email atau Username
                                    </label>

                                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#5B4FE9] focus-within:ring-4 focus-within:ring-indigo-50">
                                        <UserRound size={20} className="shrink-0 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(event) =>
                                                updateForm("username", event.target.value)
                                            }
                                            placeholder="Masukkan email atau username"
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-extrabold text-slate-950">
                                        Password
                                    </label>

                                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#5B4FE9] focus-within:ring-4 focus-within:ring-indigo-50">
                                        <Lock size={20} className="shrink-0 text-slate-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(event) =>
                                                updateForm("password", event.target.value)
                                            }
                                            placeholder="Masukkan password"
                                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="text-slate-400 transition hover:text-[#5B4FE9]"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.remember}
                                            onChange={(event) =>
                                                updateForm("remember", event.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-slate-300 accent-[#5B4FE9]"
                                        />
                                        Ingat saya
                                    </label>

                                    <button
                                        type="button"
                                        className="text-xs font-bold text-[#5B4FE9] transition hover:text-[#4338CA]"
                                    >
                                        Lupa password?
                                    </button>
                                </div>

                                {errorMessage && (
                                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="serin-primary-button flex h-12 w-full items-center justify-center gap-3 rounded-2xl px-5 text-sm font-extrabold"
                                >
                                    <Lock size={18} />
                                    Login
                                </button>
                            </form>

                            <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-teal-100">
                                        <Lock size={20} />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-950">
                                            Aman & Terpercaya
                                        </h3>
                                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                                            Data sesi konseling tersimpan dengan aman dan hanya dapat
                                            diakses oleh pihak yang berwenang.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                                <div className="flex items-start gap-3">
                                    <Info
                                        size={18}
                                        className="mt-0.5 shrink-0 text-[#5B4FE9]"
                                    />
                                    <div>
                                        <h3 className="text-sm font-extrabold text-[#4338CA]">
                                            Akses Terbatas
                                        </h3>
                                        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                                            SERIN hanya dapat diakses oleh konselor dan admin Unit BK
                                            Politeknik Negeri Lhokseumawe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
                            © 2026 SERIN · Unit BK PNL.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Decorations() {
    return (
        <>
            <div className="absolute -bottom-20 -left-28 h-80 w-80 rounded-full bg-[#EEF2FF]/80" />
            <div className="absolute -right-32 top-1/2 h-72 w-72 rounded-full bg-[#E6FFFB]/70" />
            <div className="absolute right-10 top-32 grid grid-cols-8 gap-2 opacity-30">
                {Array.from({ length: 64 }).map((_, index) => (
                    <span
                        key={index}
                        className="h-1.5 w-1.5 rounded-full bg-[#5B4FE9]/35"
                    />
                ))}
            </div>
            <div className="absolute bottom-28 right-0 h-24 w-96 rounded-[50%] border-t border-[#14B8A6]/35" />
            <div className="absolute bottom-20 right-6 h-24 w-96 rounded-[50%] border-t border-[#5B4FE9]/25" />
            <div className="absolute bottom-12 right-12 h-24 w-96 rounded-[50%] border-t border-[#14B8A6]/25" />
        </>
    );
}

export default LoginPage;