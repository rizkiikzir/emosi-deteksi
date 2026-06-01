import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  Search,
  Users,
  UserCheck,
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { validateImageFile } from "../utils/imageUpload";
import { getAssetUrl, studentApi } from "../services/api";

const emptyForm = {
  nim: "",
  name: "",
  programStudy: "Teknik Informatika",
  generation: "2022",
  status: "Aktif",
  registeredAt: "",
  photo: "",
};

const mapStudentFromApi = (student) => ({
  id: student.id,
  studentCode: student.student_code,
  nim: student.nim,
  name: student.name,
  programStudy: student.program_study,
  generation: student.generation,
  status: student.status,
  registeredAt: student.registered_at || "-",
  photo: student.photo_url || "",
});

const mapStudentToApi = (student) => ({
  nim: student.nim.trim(),
  name: student.name.trim(),
  program_study: student.programStudy.trim(),
  generation: student.generation.trim() || "-",
  status: student.status,
  photo_url: student.photo || null,
  registered_at: student.registeredAt || null,
});

function StudentPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [programFilter, setProgramFilter] = useState("Semua");
  const [generationFilter, setGenerationFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalMode, setModalMode] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await studentApi.getAll();
      setStudents(data.map(mapStudentFromApi));
    } catch (error) {
      setErrorMessage(error.message || "Gagal memuat data mahasiswa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const programOptions = useMemo(() => {
    return [
      "Semua",
      ...new Set(students.map((student) => student.programStudy).filter(Boolean)),
    ];
  }, [students]);

  const generationOptions = useMemo(() => {
    return [
      "Semua",
      ...new Set(students.map((student) => student.generation).filter(Boolean)),
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search = keyword.toLowerCase().trim();

    return students.filter((student) => {
      const matchKeyword =
        student.name.toLowerCase().includes(search) ||
        student.nim.toLowerCase().includes(search) ||
        student.programStudy.toLowerCase().includes(search);

      const matchProgram =
        programFilter === "Semua" || student.programStudy === programFilter;

      const matchGeneration =
        generationFilter === "Semua" || student.generation === generationFilter;

      const matchStatus =
        statusFilter === "Semua" || student.status === statusFilter;

      return matchKeyword && matchProgram && matchGeneration && matchStatus;
    });
  }, [students, keyword, programFilter, generationFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / rowsPerPage)
  );

  const visibleStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, programFilter, generationFilter, statusFilter, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((student) => student.status === "Aktif").length;
    const programs = new Set(students.map((student) => student.programStudy)).size;

    return {
      total,
      active,
      programs,
    };
  }, [students]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedStudent(null);
    setFormData({
      ...emptyForm,
      registeredAt: getTodayDisplay(),
    });
  };

  const openViewModal = (student) => {
    setModalMode("view");
    setSelectedStudent(student);
    setFormData(student);
  };

  const openEditModal = (student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormData(student);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedStudent(null);
    setFormData(emptyForm);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStudentPhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const errorMessage = validateImageFile(file);

    if (errorMessage) {
      alert(errorMessage);
      event.target.value = "";
      return;
    }

    try {
      setIsLoading(true);

      const result = await studentApi.uploadPhoto(file);

      setFormData((current) => ({
        ...current,
        photo: result.photo_url,
      }));
    } catch (error) {
      alert(error.message || "Gagal mengupload foto mahasiswa.");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.nim.trim() ||
      !formData.name.trim() ||
      !formData.programStudy.trim()
    ) {
      alert("NIM, nama mahasiswa, dan program studi wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);

      if (modalMode === "add") {
        await studentApi.create(mapStudentToApi(formData));
        await loadStudents();
        closeModal();
        return;
      }

      if (modalMode === "edit" && selectedStudent) {
        await studentApi.update(selectedStudent.id, mapStudentToApi(formData));
        await loadStudents();
        closeModal();
      }
    } catch (error) {
      alert(error.message || "Gagal menyimpan data mahasiswa.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (student) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus data mahasiswa ${student.name}?`
    );

    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      await studentApi.remove(student.id);
      await loadStudents();
    } catch (error) {
      alert(error.message || "Gagal menghapus data mahasiswa.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilter = () => {
    setKeyword("");
    setProgramFilter("Semua");
    setGenerationFilter("Semua");
    setStatusFilter("Semua");
  };

  const firstItemNumber =
    filteredStudents.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const lastItemNumber = Math.min(
    currentPage * rowsPerPage,
    filteredStudents.length
  );

  return (
    <AppLayout
      title="Data Mahasiswa"
      subtitle="Dashboard > Data Mahasiswa"
      showSessionStatus={false}
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            Memuat data mahasiswa...
          </div>
        )}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={<Users size={21} />}
            iconClass="bg-gradient-to-br from-indigo-50 to-white text-[#4F46E5] ring-indigo-100"
            label="Total Mahasiswa"
            value={stats.total}
          />

          <StatCard
            icon={<UserCheck size={21} />}
            iconClass="bg-gradient-to-br from-sky-50 to-white text-[#2563EB] ring-sky-100"
            label="Mahasiswa Aktif"
            value={stats.active}
          />

          <StatCard
            icon={<GraduationCap size={21} />}
            iconClass="bg-gradient-to-br from-blue-50 to-white text-blue-600 ring-blue-100"
            label="Program Studi"
            value={stats.programs}
          />
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_150px_160px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama mahasiswa atau NIM..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-6 text-sm font-extrabold text-[#2563EB] shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <Filter size={16} />
              Reset
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="flex h-12 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-7 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:brightness-105"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <CompactSelect
              label="Program Studi"
              value={programFilter}
              onChange={setProgramFilter}
              options={programOptions}
            />

            <CompactSelect
              label="Angkatan"
              value={generationFilter}
              onChange={setGenerationFilter}
              options={generationOptions}
            />

            <CompactSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={["Semua", "Aktif", "Nonaktif"]}
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
            <div className="grid grid-cols-[42px_150px_minmax(0,1.6fr)_minmax(0,1.7fr)_90px_100px_112px_90px] items-center bg-slate-50/90 px-4 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <div>No</div>
              <div>NIM</div>
              <div>Nama Mahasiswa</div>
              <div>Program Studi</div>
              <div>Angkatan</div>
              <div>Status</div>
              <div>Terdaftar</div>
              <div className="text-right">Aksi</div>
            </div>

            {visibleStudents.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                  <Search size={22} />
                </div>
                <p className="mt-3 text-sm font-extrabold text-slate-600">
                  Data mahasiswa tidak ditemukan
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Coba ubah kata kunci atau reset filter.
                </p>
              </div>
            ) : (
              visibleStudents.map((student, index) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  rowNumber={(currentPage - 1) * rowsPerPage + index + 1}
                  onView={() => openViewModal(student)}
                  onEdit={() => openEditModal(student)}
                  onDelete={() => handleDelete(student)}
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
                {filteredStudents.length}
              </span>{" "}
              data
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
                    className={`h-9 w-9 rounded-xl text-sm font-extrabold transition ${currentPage === page
                      ? "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]"
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

        {modalMode && (
          <StudentModal
            mode={modalMode}
            formData={formData}
            onChange={handleChange}
            onPhotoChange={handleStudentPhotoChange}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
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

function StudentRow({ student, rowNumber, onView, onEdit, onDelete }) {
  const initial = getInitial(student.name);

  return (
    <div className="grid grid-cols-[42px_150px_minmax(0,1.6fr)_minmax(0,1.7fr)_90px_100px_112px_90px] items-center border-t border-slate-100 px-4 py-3.5 text-sm transition hover:bg-[#EEF2FF]/45">
      <div className="font-semibold text-slate-700">{rowNumber}</div>

      <div className="whitespace-nowrap pr-2 font-semibold text-slate-700">
        {student.nim}
      </div>

      <div className="flex min-w-0 items-center gap-3 pr-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xs font-extrabold text-[#2563EB] ring-1 ring-blue-100">
          {initial}
        </div>

        <p
          title={student.name}
          className="line-clamp-2 font-extrabold leading-5 text-slate-950"
        >
          {student.name}
        </p>
      </div>

      <div
        title={student.programStudy}
        className="pr-3 text-sm font-medium leading-5 text-slate-700"
      >
        {student.programStudy}
      </div>

      <div className="font-medium text-slate-700">{student.generation}</div>

      <div>
        <StatusBadge status={student.status} />
      </div>

      <div className="truncate font-medium text-slate-700">
        {student.registeredAt}
      </div>

      <div className="flex justify-end gap-1.5">
        <ActionButton
          title="Lihat detail"
          icon={<Eye size={14} />}
          onClick={onView}
          className="text-[#2563EB] hover:border-blue-200 hover:bg-blue-50"
        />

        <ActionButton
          title="Edit mahasiswa"
          icon={<Pencil size={14} />}
          onClick={onEdit}
          className="text-[#2563EB] hover:border-blue-200 hover:bg-blue-50"
        />

        <ActionButton
          title="Hapus mahasiswa"
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
  const isActive = status === "Aktif";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${isActive
        ? "bg-sky-50 text-sky-700 ring-sky-100"
        : "bg-amber-50 text-amber-700 ring-amber-100"
        }`}
    >
      {status}
    </span>
  );
}

function StudentModal({
  mode,
  formData,
  onChange,
  onPhotoChange,
  onClose,
  onSubmit,
}) {
  const isView = mode === "view";
  const title =
    mode === "add"
      ? "Tambah Mahasiswa"
      : mode === "edit"
        ? "Edit Mahasiswa"
        : "Detail Mahasiswa";

  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#5B4FE9] focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {isView
                ? "Informasi lengkap data mahasiswa."
                : "Lengkapi data mahasiswa dengan benar."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-extrabold text-slate-700">
              Foto Mahasiswa{" "}
              <span className="font-bold text-slate-400">(Opsional)</span>
            </p>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xl font-black text-[#2563EB] ring-1 ring-blue-100">
                {formData.photo ? (
                  <img
                    src={getAssetUrl(formData.photo)}
                    alt={formData.name || "Mahasiswa"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitial(formData.name || "Mahasiswa")
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isView ? (
                  <p className="text-sm font-semibold text-slate-500">
                    Foto mahasiswa hanya ditampilkan pada detail data.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-extrabold text-[#2563EB] shadow-sm transition hover:bg-blue-50">
                        Pilih Foto
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={onPhotoChange}
                          className="hidden"
                        />
                      </label>

                      {formData.photo && (
                        <button
                          type="button"
                          onClick={() => onChange("photo", "")}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Format JPG, PNG, atau WEBP. Maksimal 2MB.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Field label="NIM" required>
            <input
              disabled={isView}
              value={formData.nim}
              onChange={(e) => onChange("nim", e.target.value)}
              className={inputClass}
              placeholder="Contoh: 2022573010112"
            />
          </Field>

          <Field label="Nama Mahasiswa" required>
            <input
              disabled={isView}
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className={inputClass}
              placeholder="Contoh: Siti Rahmawati"
            />
          </Field>

          <Field label="Program Studi" required>
            <input
              disabled={isView}
              value={formData.programStudy}
              onChange={(e) => onChange("programStudy", e.target.value)}
              className={inputClass}
              placeholder="Contoh: Teknik Informatika"
            />
          </Field>

          <Field label="Angkatan">
            <input
              disabled={isView}
              value={formData.generation}
              onChange={(e) => onChange("generation", e.target.value)}
              className={inputClass}
              placeholder="Contoh: 2022"
            />
          </Field>

          <Field label="Status">
            <select
              disabled={isView}
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value)}
              className={inputClass}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </Field>

          <Field label="Terdaftar Sejak">
            <input
              disabled={isView}
              value={formData.registeredAt}
              onChange={(e) => onChange("registeredAt", e.target.value)}
              className={inputClass}
              placeholder="Contoh: 19 Mei 2026"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
          >
            {isView ? "Tutup" : "Batal"}
          </button>

          {!isView && (
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#38BDF8] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)] transition hover:brightness-105"
            >
              Simpan Data
            </button>
          )}
        </div>
      </div>
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

function getTodayDisplay() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default StudentPage;