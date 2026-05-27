import AppLayout from "../components/AppLayout";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function MonitoringPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const secondCounterRef = useRef(0);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("-");
  const [confidence, setConfidence] = useState("-");
  const [logs, setLogs] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);
  const [sessionReport, setSessionReport] = useState(null);

  const [markers, setMarkers] = useState([]);
  const [markerTitle, setMarkerTitle] = useState("");
  const [markerCategory, setMarkerCategory] = useState("Akademik");
  const [markerNote, setMarkerNote] = useState("");

  const [sessionInfo, setSessionInfo] = useState({
    studentName: "",
    nim: "",
    programStudy: "",
    counselorName: "",
    topic: "",
    initialNote: "",
  });

  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [faceBox, setFaceBox] = useState(null);
  const [frameSize, setFrameSize] = useState(null);

  // Urutan grafik dari bawah ke atas:
  // Marah, Sedih, Takut, Netral, Senang
  const emotionToY = {
    Marah: 0,
    Sedih: 1,
    Takut: 2,
    Netral: 3,
    Senang: 4,
  };

  const emotionOrder = ["Marah", "Sedih", "Takut", "Netral", "Senang"];

  const emotionColors = {
    Senang: "#22c55e",
    Sedih: "#3b82f6",
    Marah: "#ef4444",
    Takut: "#f59e0b",
    Netral: "#6b7280",
  };

  const formatSecondToTime = (second) => {
    const minutes = Math.floor(second / 60);
    const seconds = second % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const handleSessionInfoChange = (field, value) => {
    setSessionInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadCameraDevices = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      tempStream.getTracks().forEach((track) => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      setCameraDevices(videoDevices);

      if (videoDevices.length > 0 && !selectedCameraId) {
        const externalCamera =
          videoDevices.find((device) =>
            device.label.toLowerCase().includes("usb")
          ) ||
          videoDevices.find((device) =>
            device.label.toLowerCase().includes("webcam")
          ) ||
          videoDevices.find((device) =>
            device.label.toLowerCase().includes("hd")
          ) ||
          videoDevices[0];

        setSelectedCameraId(externalCamera.deviceId);
      }
    } catch (error) {
      console.error("Gagal membaca daftar kamera:", error);
    }
  };

  const startCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCameraId
          ? {
            deviceId: { exact: selectedCameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
          : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setFaceBox(null);
      setFrameSize(null);
    } catch (error) {
      alert("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.");
      console.error(error);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
    setIsMonitoring(false);
    setFaceBox(null);
    setFrameSize(null);
  };

  const resetMonitoring = () => {
    secondCounterRef.current = 0;
    setLogs([]);
    setChartPoints([]);
    setCurrentEmotion("-");
    setConfidence("-");
    setSessionReport(null);
    setMarkers([]);
    setMarkerTitle("");
    setMarkerCategory("Akademik");
    setMarkerNote("");
    setFaceBox(null);
    setFrameSize(null);
  };

  const saveMarker = () => {
    if (!isMonitoring && chartPoints.length === 0) {
      alert("Mulai monitoring terlebih dahulu sebelum menandai momen.");
      return;
    }

    if (!markerTitle.trim()) {
      alert("Judul momen wajib diisi.");
      return;
    }

    const currentSecond = secondCounterRef.current;

    const newMarker = {
      id: Date.now(),
      timeSecond: currentSecond,
      timeLabel: formatSecondToTime(currentSecond),
      title: markerTitle,
      category: markerCategory,
      note: markerNote,
    };

    setMarkers((prev) => [...prev, newMarker]);

    setMarkerTitle("");
    setMarkerCategory("Akademik");
    setMarkerNote("");
  };

  const analyzeMarkerEmotion = (marker) => {
    const start = marker.timeSecond;
    const end = marker.timeSecond + 30;

    const relatedPoints = chartPoints.filter(
      (point) => point.x >= start && point.x <= end
    );

    if (relatedPoints.length === 0) {
      return "Belum ada data emosi yang cukup setelah momen ini.";
    }

    const counts = {
      Senang: 0,
      Sedih: 0,
      Marah: 0,
      Takut: 0,
      Netral: 0,
    };

    relatedPoints.forEach((point) => {
      counts[point.emotion] += 1;
    });

    const maxCount = Math.max(...Object.values(counts));

    const dominantEmotions = Object.keys(counts).filter(
      (emotion) => counts[emotion] === maxCount
    );

    const dominantText = dominantEmotions.join(" dan ");

    const negativeCount = counts.Sedih + counts.Marah + counts.Takut;
    const negativePercentage = (negativeCount / relatedPoints.length) * 100;

    if (negativePercentage >= 50) {
      return `Dalam 30 detik setelah momen ini, emosi ${dominantText} terlihat dominan. Sistem mengindikasikan adanya peningkatan respons emosi negatif pada segmen ini.`;
    }

    return `Dalam 30 detik setelah momen ini, emosi ${dominantText} terlihat dominan. Respons emosi mahasiswa pada segmen ini terpantau relatif stabil.`;
  };

  const finishSession = () => {
    setIsMonitoring(false);

    if (chartPoints.length === 0) {
      alert("Belum ada data deteksi untuk dibuat laporan.");
      return;
    }

    const total = chartPoints.length;

    const counts = {
      Senang: 0,
      Sedih: 0,
      Marah: 0,
      Takut: 0,
      Netral: 0,
    };

    chartPoints.forEach((point) => {
      counts[point.emotion] += 1;
    });

    const percentages = {};

    Object.keys(counts).forEach((emotion) => {
      percentages[emotion] = ((counts[emotion] / total) * 100).toFixed(1);
    });

    const maxCount = Math.max(...Object.values(counts));

    const dominantEmotions = Object.keys(counts).filter(
      (emotion) => counts[emotion] === maxCount
    );

    const dominantEmotion = dominantEmotions.join(" dan ");

    let interpretation = "";
    let recommendation = "";

    const sadFearPercentage =
      Number(percentages.Sedih) + Number(percentages.Takut);

    const stablePercentage =
      Number(percentages.Netral) + Number(percentages.Senang);

    if (sadFearPercentage > 50) {
      interpretation =
        "Terdapat indikasi tekanan emosional atau kecemasan yang cukup tinggi karena emosi Sedih dan Takut mendominasi selama sesi.";
      recommendation =
        "Konselor disarankan melakukan pendekatan yang lebih empatik, menggali faktor penyebab, dan mempertimbangkan sesi lanjutan.";
    } else if (Number(percentages.Marah) >= 30) {
      interpretation =
        "Terdapat indikasi resistensi atau frustrasi karena emosi Marah muncul cukup dominan selama sesi.";
      recommendation =
        "Konselor disarankan menurunkan tensi komunikasi dan menggunakan pendekatan yang lebih persuasif.";
    } else if (stablePercentage >= 50) {
      interpretation =
        "Kondisi emosional mahasiswa terindikasi relatif stabil karena emosi Netral dan Senang mendominasi selama sesi.";
      recommendation =
        "Konselor dapat melanjutkan alur konseling sesuai rencana awal dan tetap melakukan pemantauan pada sesi berikutnya.";
    } else {
      interpretation =
        "Emosi mahasiswa terlihat cukup bervariasi selama sesi konseling.";
      recommendation =
        "Konselor dapat meninjau bagian tertentu pada grafik sebaran untuk melihat momen perubahan emosi yang signifikan.";
    }

    setSessionReport({
      sessionInfo,
      total,
      counts,
      percentages,
      dominantEmotion,
      interpretation,
      recommendation,
    });
  };

  const captureAndPredict = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const response = await axios.post(
          "http://localhost:8000/predict",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const result = response.data;
        const emotion = result.dominant_emotion;
        const emotionY = emotionToY[emotion];

        if (result.face_box && result.frame_size) {
          setFaceBox(result.face_box);
          setFrameSize(result.frame_size);
        } else {
          setFaceBox(null);
          setFrameSize(result.frame_size || null);
        }

        if (emotionY === undefined) {
          setCurrentEmotion(emotion || "-");
          setConfidence(result.confidence ?? 0);
          console.warn("Emosi tidak dikenali:", emotion);
          return;
        }

        setCurrentEmotion(emotion);
        setConfidence(result.confidence);

        const newLog = {
          time: new Date().toLocaleTimeString(),
          emotion: emotion,
          confidence: result.confidence,
        };

        setLogs((prev) => [newLog, ...prev].slice(0, 10));

        setChartPoints((prev) => [
          ...prev,
          {
            x: secondCounterRef.current,
            y: emotionY,
            emotion: emotion,
            confidence: result.confidence,
          },
        ]);

        secondCounterRef.current += 1;
      } catch (error) {
        console.error("Gagal mengirim frame ke backend:", error);
      }
    }, "image/jpeg");
  };

  useEffect(() => {
    loadCameraDevices();
  }, []);

  useEffect(() => {
    let intervalId;

    if (isMonitoring) {
      intervalId = setInterval(() => {
        captureAndPredict();
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring]);

  const scatterData = {
    datasets: emotionOrder.map((emotion) => ({
      label: emotion,
      data: chartPoints.filter((point) => point.emotion === emotion),
      pointRadius: 6,
      pointHoverRadius: 8,
      backgroundColor: emotionColors[emotion],
    })),
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Waktu Sesi (detik)",
        },
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        min: -0.5,
        max: 4.5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            const labels = ["Marah", "Sedih", "Takut", "Netral", "Senang"];
            return labels[value] ?? "";
          },
        },
        title: {
          display: true,
          text: "Kelas Emosi",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = context.raw;
            return `${item.emotion} - Confidence: ${item.confidence}`;
          },
        },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <AppLayout>
      <div style={styles.page}>
        <div style={styles.sessionCard}>
          <div style={styles.sessionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Informasi Sesi Konseling</h2>
              <p style={styles.sectionSubtitle}>
                Lengkapi data sesi sebelum monitoring dimulai.
              </p>
            </div>

            <div style={isMonitoring ? styles.statusActive : styles.statusIdle}>
              {isMonitoring ? "Sesi Berlangsung" : "Sesi Belum Berjalan"}
            </div>
          </div>

          <div style={styles.sessionGrid}>
            <input
              type="text"
              placeholder="Nama Mahasiswa"
              value={sessionInfo.studentName}
              onChange={(e) =>
                handleSessionInfoChange("studentName", e.target.value)
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="NIM"
              value={sessionInfo.nim}
              onChange={(e) => handleSessionInfoChange("nim", e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Program Studi"
              value={sessionInfo.programStudy}
              onChange={(e) =>
                handleSessionInfoChange("programStudy", e.target.value)
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Nama Konselor"
              value={sessionInfo.counselorName}
              onChange={(e) =>
                handleSessionInfoChange("counselorName", e.target.value)
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Topik Konseling"
              value={sessionInfo.topic}
              onChange={(e) => handleSessionInfoChange("topic", e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Catatan Awal"
              value={sessionInfo.initialNote}
              onChange={(e) =>
                handleSessionInfoChange("initialNote", e.target.value)
              }
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Live Camera</h2>

            <div style={styles.cameraSelectBox}>
              <label style={styles.cameraLabel}>Pilih Kamera</label>

              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                style={styles.input}
              >
                {cameraDevices.length === 0 && (
                  <option value="">Kamera belum terdeteksi</option>
                )}

                {cameraDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.videoWrapper}>
              <video ref={videoRef} autoPlay playsInline style={styles.video} />

              {faceBox && frameSize && (
                <div
                  style={{
                    ...styles.faceBox,
                    left: `${(faceBox.x / frameSize.width) * 100}%`,
                    top: `${(faceBox.y / frameSize.height) * 100}%`,
                    width: `${(faceBox.w / frameSize.width) * 100}%`,
                    height: `${(faceBox.h / frameSize.height) * 100}%`,
                  }}
                >
                  <span style={styles.faceLabel}>{currentEmotion}</span>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div style={styles.buttonGroup}>
              <button onClick={startCamera} style={styles.button}>
                Aktifkan Kamera
              </button>

              <button
                onClick={() => setIsMonitoring(true)}
                disabled={!isCameraOn}
                style={
                  isCameraOn
                    ? styles.buttonPrimary
                    : { ...styles.buttonPrimary, ...styles.buttonDisabled }
                }
              >
                Mulai Monitoring
              </button>

              <button
                onClick={() => setIsMonitoring(false)}
                style={styles.buttonWarning}
              >
                Jeda
              </button>

              <button onClick={resetMonitoring} style={styles.button}>
                Reset
              </button>

              <button onClick={finishSession} style={styles.buttonFinish}>
                Akhiri Sesi
              </button>

              <button onClick={stopCamera} style={styles.buttonDanger}>
                Stop
              </button>
            </div>

            <div style={styles.markerBox}>
              <h3 style={styles.subTitle}>Tandai Momen Konseling</h3>

              <div style={styles.markerGrid}>
                <input
                  type="text"
                  placeholder="Judul momen, contoh: Membahas nilai akademik"
                  value={markerTitle}
                  onChange={(e) => setMarkerTitle(e.target.value)}
                  style={styles.input}
                />

                <select
                  value={markerCategory}
                  onChange={(e) => setMarkerCategory(e.target.value)}
                  style={styles.input}
                >
                  <option value="Akademik">Akademik</option>
                  <option value="Keluarga">Keluarga</option>
                  <option value="Finansial">Finansial</option>
                  <option value="Relasi Sosial">Relasi Sosial</option>
                  <option value="Motivasi Belajar">Motivasi Belajar</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <textarea
                placeholder="Catatan konselor, contoh: Mahasiswa terlihat tegang saat membahas nilai semester."
                value={markerNote}
                onChange={(e) => setMarkerNote(e.target.value)}
                style={styles.textarea}
              />

              <button onClick={saveMarker} style={styles.buttonMarker}>
                Tandai Momen Sekarang
              </button>

              {markers.length > 0 && (
                <div style={styles.markerList}>
                  <h4>Daftar Momen Ditandai</h4>

                  {markers.map((marker) => (
                    <div key={marker.id} style={styles.markerItem}>
                      <strong>
                        {marker.timeLabel} - {marker.category}
                      </strong>
                      <p style={styles.markerTitle}>{marker.title}</p>
                      {marker.note && (
                        <p style={styles.markerNote}>{marker.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Hasil Deteksi Saat Ini</h2>

            <div style={styles.emotionBox}>
              <p style={styles.emotionLabel}>Emosi Terdeteksi</p>
              <h1 style={styles.emotionText}>{currentEmotion}</h1>
              <p style={styles.confidenceText}>Confidence: {confidence}</p>
            </div>

            <h3 style={styles.subTitle}>Log Deteksi</h3>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Waktu</th>
                  <th style={styles.th}>Emosi</th>
                  <th style={styles.th}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{log.time}</td>
                    <td style={styles.td}>{log.emotion}</td>
                    <td style={styles.td}>{log.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.chartBox}>
              <h3 style={styles.subTitle}>Grafik Sebaran Emosi</h3>
              <div style={styles.chartCanvas}>
                <Scatter data={scatterData} options={scatterOptions} />
              </div>
            </div>

            {sessionReport && (
              <div style={styles.reportBox}>
                <h3>Ringkasan Laporan Sesi</h3>

                <div style={styles.identityBox}>
                  <h4 style={styles.reportSubTitle}>Identitas Sesi Konseling</h4>

                  <div style={styles.identityGrid}>
                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>Nama Mahasiswa</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.studentName || "-"}
                      </strong>
                    </div>

                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>NIM</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.nim || "-"}
                      </strong>
                    </div>

                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>Program Studi</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.programStudy || "-"}
                      </strong>
                    </div>

                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>Nama Konselor</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.counselorName || "-"}
                      </strong>
                    </div>

                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>Topik Konseling</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.topic || "-"}
                      </strong>
                    </div>

                    <div style={styles.identityItem}>
                      <span style={styles.identityLabel}>Catatan Awal</span>
                      <strong style={styles.identityValue}>
                        {sessionReport.sessionInfo.initialNote || "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={styles.reportGrid}>
                  <div style={styles.reportItem}>
                    <span>Total Deteksi</span>
                    <strong>{sessionReport.total}</strong>
                  </div>

                  <div style={styles.reportItem}>
                    <span>Emosi Dominan</span>
                    <strong>{sessionReport.dominantEmotion}</strong>
                  </div>
                </div>

                <h4>Persentase Emosi</h4>

                <div style={styles.percentageList}>
                  {Object.keys(sessionReport.percentages).map((emotion) => (
                    <div key={emotion} style={styles.percentageRow}>
                      <span>{emotion}</span>
                      <strong>{sessionReport.percentages[emotion]}%</strong>
                    </div>
                  ))}
                </div>

                <h4>Interpretasi Otomatis</h4>
                <p>{sessionReport.interpretation}</p>

                <h4>Rekomendasi Awal</h4>
                <p>{sessionReport.recommendation}</p>

                {markers.length > 0 && (
                  <>
                    <h4>Momen Penting Selama Sesi</h4>

                    <div style={styles.markerList}>
                      {markers.map((marker) => (
                        <div key={marker.id} style={styles.markerItem}>
                          <strong>
                            {marker.timeLabel} - {marker.category}
                          </strong>
                          <p style={styles.markerTitle}>{marker.title}</p>
                          {marker.note && (
                            <p style={styles.markerNote}>{marker.note}</p>
                          )}
                          <p style={styles.markerAnalysis}>
                            {analyzeMarkerEmotion(marker)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f3ff",
    fontFamily: "Arial, sans-serif",
  },
  statusActive: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "700",
  },
  statusIdle: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "24px",
  },
  card: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  cameraSelectBox: {
    marginBottom: "16px",
    display: "grid",
    gap: "8px",
  },
  cameraLabel: {
    fontWeight: "700",
    color: "#111827",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    background: "#111827",
    borderRadius: "16px",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    background: "#111827",
    objectFit: "cover",
  },
  faceBox: {
    position: "absolute",
    border: "3px solid #22c55e",
    borderRadius: "10px",
    boxSizing: "border-box",
    pointerEvents: "none",
    boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
  },
  faceLabel: {
    position: "absolute",
    top: "-34px",
    left: "0",
    background: "#22c55e",
    color: "#ffffff",
    padding: "4px 10px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "14px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  button: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "145px",
  },
  buttonPrimary: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#7c3aed",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "175px",
  },
  buttonWarning: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#f59e0b",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "90px",
  },
  buttonFinish: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "130px",
  },
  buttonDanger: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "90px",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  emotionBox: {
    background: "#ede9fe",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    textAlign: "center",
    border: "1px solid #ddd6fe",
  },
  emotionLabel: {
    margin: 0,
    color: "#4c1d95",
    fontSize: "16px",
    fontWeight: "700",
  },

  emotionText: {
    margin: "12px 0",
    color: "#111827",
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: 1.1,
  },

  confidenceText: {
    margin: 0,
    color: "#374151",
    fontSize: "16px",
    fontWeight: "600",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "10px",
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: "10px",
  },
  chartBox: {
    marginTop: "24px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e5e7eb",
  },
  chartCanvas: {
    height: "320px",
  },
  reportBox: {
    marginTop: "24px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "18px",
    color: "#14532d",
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  reportItem: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid #dcfce7",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  percentageList: {
    display: "grid",
    gap: "8px",
    marginBottom: "16px",
  },
  percentageRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#ffffff",
    borderRadius: "10px",
    padding: "10px 12px",
    border: "1px solid #dcfce7",
  },
  markerBox: {
    marginTop: "24px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
  },
  markerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: "12px",
    marginBottom: "12px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    background: "#ffffff",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    background: "#ffffff",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  buttonMarker: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "180px",
  },
  markerList: {
    marginTop: "16px",
    display: "grid",
    gap: "10px",
  },
  markerItem: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    color: "#111827",
  },
  markerTitle: {
    margin: "6px 0 4px 0",
    fontWeight: "700",
  },
  markerNote: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  markerAnalysis: {
    marginTop: "8px",
    padding: "10px",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1e3a8a",
    lineHeight: 1.5,
    fontSize: "14px",
  },
  sessionCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sessionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },
  sectionSubtitle: {
    margin: "6px 0 0 0",
    color: "#6b7280",
  },
  sessionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  cardTitle: {
    margin: "0 0 16px 0",
    color: "#111827",
    fontSize: "22px",
    fontWeight: "700",
    textAlign: "center",
  },

  subTitle: {
    margin: "0 0 14px 0",
    color: "#111827",
    fontSize: "18px",
    fontWeight: "700",
    textAlign: "center",
  },

  identityBox: {
    marginTop: "16px",
    marginBottom: "20px",
    background: "#ffffff",
    border: "1px solid #dcfce7",
    borderRadius: "14px",
    padding: "16px",
  },

  reportSubTitle: {
    margin: "0 0 12px 0",
    color: "#14532d",
    fontSize: "16px",
    fontWeight: "700",
  },

  identityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  identityItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#111827",
  },

  identityLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600",
  },

  identityValue: {
    fontSize: "15px",
    color: "#111827",
    fontWeight: "700",
    wordBreak: "break-word",
  },
};

export default MonitoringPage;