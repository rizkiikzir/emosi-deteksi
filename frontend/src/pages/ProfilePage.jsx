import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { authApi, getAssetUrl } from "../services/api";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  LogOut,
  MonitorDot,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

const defaultProfile = {
  name: "Admin Unit BK",
  role: "Konselor / Admin",
  username: "admin",
  email: "admin@serin.local",
  unit: "Unit BK",
  status: "Aktif",
  photo_url: "",
};

const accessList = [
  {
    icon: <Database size={19} />,
    title: "Kelola Data Mahasiswa",
    desc: "Melihat dan mengelola data peserta konseling.",
    color: "blue",
  },
  {
    icon: <MonitorDot size={19} />,
    title: "Monitoring Emosi Real-Time",
    desc: "Membuat sesi dan memantau emosi mahasiswa.",
    color: "sky",
  },
  {
    icon: <FileText size={19} />,
    title: "Laporan Konseling",
    desc: "Melihat hasil sesi, riwayat, dan detail laporan.",
    color: "indigo",
  },
  {
    icon: <ShieldCheck size={19} />,
    title: "Unduh Laporan PDF",
    desc: "Mengunduh laporan sebagai dokumen pendukung.",
    color: "rose",
  },
];

function ProfilePage() {
  const navigate = useNavigate();

  const passwordSectionRef = useRef(null);

  const [profile, setProfile] = useState(defaultProfile);
  const [formProfile, setFormProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await authApi.getMe();

        const normalizedUser = {
          ...defaultProfile,
          ...user,
          photo_url: user.photo_url || "",
          status: user.status || "Aktif",
        };

        setProfile(normalizedUser);
        setFormProfile(normalizedUser);

        localStorage.setItem("serinUser", JSON.stringify(normalizedUser));
        window.dispatchEvent(new Event("serinUserProfileUpdated"));
      } catch {
        const savedUser = safeParse(localStorage.getItem("serinUser")) || {};

        const normalizedUser = {
          ...defaultProfile,
          ...savedUser,
          photo_url: savedUser.photo_url || "",
          status: savedUser.status || "Aktif",
        };

        setProfile(normalizedUser);
        setFormProfile(normalizedUser);
      }
    };

    loadProfile();
  }, []);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert("Format foto harus JPG, PNG, atau WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      alert("Ukuran foto maksimal 2MB.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const uploadResponse = await authApi.uploadPhoto(file);

      setFormProfile((current) => ({
        ...current,
        photo_url: uploadResponse.photo_url,
      }));
    } catch (error) {
      alert(error.message || "Gagal upload foto profil.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleChangeProfile = (field, value) => {
    setFormProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditProfile = () => {
    setFormProfile(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormProfile(profile);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const payload = {
      name: formProfile.name.trim() || defaultProfile.name,
      username: formProfile.username.trim() || defaultProfile.username,
      email: formProfile.email?.trim() || defaultProfile.email,
      unit: formProfile.unit.trim() || defaultProfile.unit,
      role: profile.role,
      status: profile.status || "Aktif",
      photo_url: formProfile.photo_url || "",
    };

    try {
      setIsSaving(true);

      const response = await authApi.updateMe(payload);

      const updatedUser = {
        ...defaultProfile,
        ...response.user,
        photo_url: response.user.photo_url || "",
      };

      setProfile(updatedUser);
      setFormProfile(updatedUser);

      localStorage.setItem("serinUser", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("serinUserProfileUpdated"));

      setIsEditing(false);
      alert("Profil berhasil diperbarui.");
    } catch (error) {
      alert(error.message || "Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });

    setShowPassword({
      current: false,
      new: false,
      confirm: false,
    });
  };

  const handleCancelChangePassword = () => {
    resetPasswordForm();
    setIsChangingPassword(false);
  };

  const handleSavePassword = async () => {
    if (!passwordForm.current_password) {
      alert("Password lama wajib diisi.");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert("Password baru minimal 6 karakter.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("Konfirmasi password baru tidak sesuai.");
      return;
    }

    try {
      setIsSavingPassword(true);

      await authApi.changePassword(passwordForm);

      resetPasswordForm();
      setIsChangingPassword(false);

      alert(
        "Password berhasil diperbarui. Silakan gunakan password baru saat login berikutnya."
      );
    } catch (error) {
      alert(error.message || "Gagal mengganti password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleOpenChangePassword = () => {
    setIsChangingPassword(true);
    setIsEditing(false);

    setTimeout(() => {
      passwordSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Yakin ingin logout dari SERIN?");

    if (!confirmLogout) return;

    localStorage.removeItem("serinUser");

    navigate("/login", { replace: true });
  };

  return (
    <AppLayout
      title="Profil Pengguna"
      subtitle="Dashboard > Pengguna > Profil Pengguna"
      showSessionStatus={false}
    >
      <div className="space-y-5">
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center">
              <AvatarImage
                name={profile.name}
                photoUrl={profile.photo_url}
                sizeClass="h-24 w-24 text-3xl"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                    {profile.name}
                  </h2>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#2563EB] ring-1 ring-blue-100">
                    {profile.role}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {profile.unit}
                </p>

                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {profile.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-[#2563EB] shadow-sm transition hover:bg-blue-100"
                >
                  <Pencil size={17} />
                  Edit Profil
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenChangePassword}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 text-sm font-extrabold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
              >
                <KeyRound size={17} />
                Ganti Password
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-5 text-sm font-extrabold text-[#2563EB] shadow-sm transition hover:bg-blue-50"
              >
                <ArrowLeft size={17} />
                Kembali
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-5 text-sm font-extrabold text-rose-700 shadow-sm transition hover:bg-rose-100"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-[#2563EB] ring-1 ring-blue-100">
              <UserRound size={16} />
              {profile.username}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700 ring-1 ring-indigo-100">
              <ShieldCheck size={16} />
              {profile.role}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 size={16} />
              {profile.status}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <SectionHeader
              icon={<UserRound size={21} />}
              title="Informasi Akun"
              desc="Identitas pengguna yang sedang mengakses dashboard SERIN."
            />

            {isEditing && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-extrabold text-slate-700">
                  Foto Profil
                </p>

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
                  <AvatarImage
                    name={formProfile.name}
                    photoUrl={formProfile.photo_url}
                    sizeClass="h-20 w-20 text-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-extrabold text-[#2563EB] shadow-sm transition hover:bg-blue-50">
                        {isUploading ? "Mengupload..." : "Pilih Foto"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handlePhotoChange}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>

                      {formProfile.photo_url && (
                        <button
                          type="button"
                          onClick={() => handleChangeProfile("photo_url", "")}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Format JPG, PNG, atau WEBP. Maksimal 2MB.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="mt-5 space-y-4">
                <ProfileInput
                  label="Nama Pengguna"
                  value={formProfile.name}
                  onChange={(value) => handleChangeProfile("name", value)}
                  placeholder="Masukkan nama pengguna"
                />

                <ProfileInput
                  label="Username"
                  value={formProfile.username}
                  onChange={(value) => handleChangeProfile("username", value)}
                  placeholder="Masukkan username"
                />

                <ProfileInput
                  label="Email"
                  value={formProfile.email}
                  onChange={(value) => handleChangeProfile("email", value)}
                  placeholder="Masukkan email"
                />

                <ProfileInput
                  label="Unit"
                  value={formProfile.unit}
                  onChange={(value) => handleChangeProfile("unit", value)}
                  placeholder="Masukkan unit kerja"
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500">Role</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {profile.role}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Role tidak dapat diubah dari halaman profil.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving || isUploading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.20)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={17} />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <X size={17} />
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <InfoCard label="Nama Pengguna" value={profile.name} />
                <InfoCard label="Username" value={profile.username} />
                <InfoCard label="Email" value={profile.email} />
                <InfoCard label="Unit" value={profile.unit} />
                <InfoCard label="Role" value={profile.role} />

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 md:col-span-2">
                  <p className="text-xs font-bold text-emerald-700">
                    Status Akun
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-emerald-800">
                    {profile.status} dan dapat mengakses dashboard SERIN
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <SectionHeader
              icon={<ShieldCheck size={21} />}
              title="Hak Akses Sistem"
              desc="Fitur yang dapat digunakan oleh konselor/admin."
            />

            <div className="mt-5 space-y-3">
              {accessList.map((item) => (
                <AccessCard key={item.title} item={item} />
              ))}
            </div>
          </section>
        </div>
        {isChangingPassword && (
          <section
            ref={passwordSectionRef}
            className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            <SectionHeader
              icon={<KeyRound size={21} />}
              title="Ganti Password"
              desc="Perbarui password akun untuk menjaga keamanan akses dashboard SERIN."
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <PasswordInput
                label="Password Lama"
                value={passwordForm.current_password}
                visible={showPassword.current}
                onToggle={() =>
                  setShowPassword((current) => ({
                    ...current,
                    current: !current.current,
                  }))
                }
                onChange={(value) => handlePasswordChange("current_password", value)}
                placeholder="Masukkan password lama"
              />

              <PasswordInput
                label="Password Baru"
                value={passwordForm.new_password}
                visible={showPassword.new}
                onToggle={() =>
                  setShowPassword((current) => ({
                    ...current,
                    new: !current.new,
                  }))
                }
                onChange={(value) => handlePasswordChange("new_password", value)}
                placeholder="Minimal 6 karakter"
              />

              <PasswordInput
                label="Konfirmasi Password Baru"
                value={passwordForm.confirm_password}
                visible={showPassword.confirm}
                onToggle={() =>
                  setShowPassword((current) => ({
                    ...current,
                    confirm: !current.confirm,
                  }))
                }
                onChange={(value) => handlePasswordChange("confirm_password", value)}
                placeholder="Ulangi password baru"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.20)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save size={17} />
                {isSavingPassword ? "Menyimpan..." : "Simpan Password"}
              </button>

              <button
                type="button"
                onClick={handleCancelChangePassword}
                disabled={isSavingPassword}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <X size={17} />
                Batal
              </button>
            </div>
          </section>
        )}
        <section className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100">
              <LockKeyhole size={21} />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-950">
                Akses Terbatas
              </h3>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-blue-950/80">
                Dashboard SERIN hanya digunakan oleh konselor atau admin Unit
                BK yang berwenang. Mahasiswa tidak memiliki akses login ke
                sistem dan hanya tercatat sebagai peserta sesi konseling.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function AvatarImage({ name, photoUrl, sizeClass }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 font-black text-[#2563EB] ring-1 ring-blue-100 shadow-sm ${sizeClass}`}
    >
      {photoUrl ? (
        <img
          src={getAssetUrl(photoUrl)}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function SectionHeader({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
        {icon}
      </div>

      <div>
        <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
          {desc}
        </p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold leading-6 text-slate-950">
        {value || "-"}
      </p>
    </div>
  );
}

function ProfileInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">
        {label}
      </span>

      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function AccessCard({ item }) {
  const colorClass = {
    blue: "bg-blue-50 text-[#2563EB] ring-blue-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${colorClass[item.color] || colorClass.blue
            }`}
        >
          {item.icon}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-slate-950">
            {item.title}
          </h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {item.desc}
          </p>
        </div>
      </div>
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

export default ProfilePage;