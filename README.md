SERIN - Smart Emotion Recognition for Integrated Counseling

SERIN adalah sistem deteksi emosi wajah real-time yang dikembangkan untuk mendukung proses konseling mahasiswa. Sistem ini membantu konselor memantau ekspresi emosi selama sesi wawancara/konseling, mencatat perubahan emosi, menandai momen penting, serta menghasilkan laporan hasil sesi secara otomatis.

Proyek ini dikembangkan sebagai bagian dari penelitian tugas akhir dan ditujukan sebagai referensi open-source untuk pengembangan teknologi computer vision, artificial intelligence, dan sistem pendukung konseling mahasiswa.

Fitur Utama

* Deteksi emosi wajah secara real-time menggunakan kamera.
* Klasifikasi emosi ke dalam beberapa kategori, seperti Senang, Sedih, Marah, Takut, dan Netral.
* Monitoring sesi konseling secara langsung melalui dashboard.
* Pencatatan timeline emosi selama sesi berlangsung.
* Visualisasi distribusi dan perubahan emosi dalam bentuk grafik.
* Penandaan momen penting selama sesi konseling.
* Pembuatan laporan hasil sesi secara otomatis.
* Riwayat laporan sesi konseling.
* Dashboard antarmuka untuk konselor/admin.
* Backend API untuk mendukung proses deteksi, penyimpanan, dan pengelolaan data.

Teknologi yang Digunakan

Frontend

* React
* Vite
* JavaScript
* CSS

Backend

* Python
* FastAPI
* TensorFlow/Keras
* OpenCV
* Uvicorn

Machine Learning

* Model deep learning untuk klasifikasi emosi wajah.
* Dataset emosi wajah dengan beberapa kelas emosi.
* Evaluasi model menggunakan akurasi, precision, recall, F1-score, dan confusion matrix.

Struktur Project

emosi-deteksi/
├── backend/
│   ├── main.py
│   ├── model/
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── README.md
└── LICENSE

Cara Menjalankan Project

1. Clone Repository

git clone https://github.com/rizkiikzir/emosi-deteksi.git
cd emosi-deteksi

2. Menjalankan Backend

Masuk ke folder backend:

cd backend

Buat virtual environment:

python -m venv venv

Aktifkan virtual environment:

venv\Scripts\activate

Install dependency:

pip install -r requirements.txt

Jalankan server backend:

uvicorn main:app --reload

Backend akan berjalan di:

http://127.0.0.1:8000

3. Menjalankan Frontend

Buka terminal baru, lalu masuk ke folder frontend:

cd frontend

Install dependency:

npm install

Jalankan frontend:

npm run dev

Frontend akan berjalan di:

http://localhost:5173

Screenshot

Tambahkan screenshot tampilan dashboard atau halaman monitoring SERIN di bagian ini.

![Dashboard SERIN](./docs/dashboard-serin.png)

Status Pengembangan

Project ini masih dalam tahap pengembangan aktif. Beberapa fitur seperti integrasi database, penyimpanan laporan, dan peningkatan keamanan API akan terus dikembangkan.

Tujuan Project

SERIN bertujuan untuk membantu proses konseling mahasiswa dengan menyediakan alat bantu berbasis AI yang dapat memantau ekspresi emosi secara real-time. Sistem ini tidak dimaksudkan untuk menggantikan konselor, tetapi sebagai alat pendukung analisis selama sesi konseling.

Lisensi

Project ini menggunakan lisensi MIT. Lihat file LICENSE untuk informasi lebih lanjut.
