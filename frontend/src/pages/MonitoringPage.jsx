import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import AppLayout from "../components/AppLayout";

import {
  Activity,
  BookmarkPlus,
  Camera,
  Clock,
  FileText,
  Info,
  Square,
  Timer,
  UserRound,
} from "lucide-react";

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Scatter } from "react-chartjs-2";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const DEFAULT_SESSION_INFO = {
  id: `KS-${Date.now().toString().slice(-8)}`,
  sessionId: `KS-${Date.now().toString().slice(-8)}`,
  studentName: "Belum ada mahasiswa",
  nim: "-",
  programStudy: "-",
  counselorName: "Hendrawaty, ST., MT",
  title: "Sesi Konseling",
  topic: "-",
  counselingType: "Konseling Akademik",
  method: "Tatap Muka (Offline)",
  location: "Ruang Konseling Unit BK PNL",
  purpose: "-",
  initialNote: "",
  startDate: new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }),
  startTime: new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  duration: "00:00:00",
  modelName: "LightExNet V2",
  status: "active",
  createdAt: new Date().toISOString(),
};

const normalizeSessionInfo = (rawSession) => {
  const session = rawSession || {};

  return {
    ...DEFAULT_SESSION_INFO,
    ...session,
    id: session.id || session.sessionId || DEFAULT_SESSION_INFO.id,
    sessionId: session.sessionId || session.id || DEFAULT_SESSION_INFO.sessionId,
    studentName: session.studentName || session.namaMahasiswa || DEFAULT_SESSION_INFO.studentName,
    nim: session.nim || session.NIM || DEFAULT_SESSION_INFO.nim,
    programStudy: session.programStudy || session.prodi || DEFAULT_SESSION_INFO.programStudy,
    counselorName: session.counselorName || session.konselor || DEFAULT_SESSION_INFO.counselorName,
    title: session.title || session.judul || DEFAULT_SESSION_INFO.title,
    topic: session.topic || session.topik || session.counselingType || DEFAULT_SESSION_INFO.topic,
    counselingType: session.counselingType || session.jenisKonseling || DEFAULT_SESSION_INFO.counselingType,
    method: session.method || session.metode || DEFAULT_SESSION_INFO.method,
    location: session.location || session.lokasi || DEFAULT_SESSION_INFO.location,
    purpose: session.purpose || session.tujuan || DEFAULT_SESSION_INFO.purpose,
    initialNote: session.initialNote || session.catatanAwal || "",
    startDate: session.startDate || session.tanggal || DEFAULT_SESSION_INFO.startDate,
    startTime: session.startTime || session.waktuMulai || DEFAULT_SESSION_INFO.startTime,
    duration: session.duration || session.durasi || DEFAULT_SESSION_INFO.duration,
    modelName: session.modelName || "LightExNet V2",
  };
};

const getSavedSessionInfo = () => {
  try {
    const savedSession = localStorage.getItem("currentCounselingSession");

    if (!savedSession) {
      return null;
    }

    return normalizeSessionInfo(JSON.parse(savedSession));
  } catch (error) {
    console.error("Gagal membaca sesi dari localStorage:", error);
    return null;
  }
};

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

const getMonitoringProgressKey = (sessionId) => {
  return `monitoringProgress:${sessionId}`;
};

function MonitoringPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const secondCounterRef = useRef(0);
  const hasLoadedProgressRef = useRef(false);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const [currentEmotion, setCurrentEmotion] = useState("-");
  const [confidence, setConfidence] = useState("-");
  const [logs, setLogs] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [faceBox, setFaceBox] = useState(null);
  const [frameSize, setFrameSize] = useState(null);

  const [scores, setScores] = useState({
    Senang: 0,
    Sedih: 0,
    Marah: 0,
    Takut: 0,
    Netral: 0,
  });

  const [markers, setMarkers] = useState([]);
  const [markerTitle, setMarkerTitle] = useState("");
  const [markerCategory, setMarkerCategory] = useState("Akademik");
  const [markerNote, setMarkerNote] = useState("");

  const [sessionInfo, setSessionInfo] = useState(() => {
    const sessionFromRoute = location.state?.session || location.state?.sessionInfo;

    if (sessionFromRoute) {
      return normalizeSessionInfo(sessionFromRoute);
    }

    return getSavedSessionInfo() || DEFAULT_SESSION_INFO;
  });
  const [durationTick, setDurationTick] = useState(0);

  useEffect(() => {
    const sessionFromRoute = location.state?.session || location.state?.sessionInfo;
    const savedSession = getSavedSessionInfo();

    if (sessionFromRoute) {
      const normalized = normalizeSessionInfo(sessionFromRoute);
      setSessionInfo(normalized);
      localStorage.setItem("currentCounselingSession", JSON.stringify(normalized));
      return;
    }

    if (savedSession) {
      setSessionInfo(savedSession);
    }
  }, [location.state]);

  useEffect(() => {
    if (!sessionInfo?.sessionId) return;

    hasLoadedProgressRef.current = false;

    const savedProgress = safeParse(
      localStorage.getItem(getMonitoringProgressKey(sessionInfo.sessionId))
    );

    if (savedProgress) {
      secondCounterRef.current = Number(savedProgress.durationSecond || 0);
      setDurationTick(Number(savedProgress.durationSecond || 0));

      setLogs(Array.isArray(savedProgress.logs) ? savedProgress.logs : []);
      setChartPoints(
        Array.isArray(savedProgress.chartPoints) ? savedProgress.chartPoints : []
      );
      setMarkers(Array.isArray(savedProgress.markers) ? savedProgress.markers : []);
      setCurrentEmotion(savedProgress.currentEmotion || "-");
      setConfidence(savedProgress.confidence || "-");

      setScores(
        savedProgress.scores || {
          Senang: 0,
          Sedih: 0,
          Marah: 0,
          Takut: 0,
          Netral: 0,
        }
      );
    } else {
      secondCounterRef.current = 0;
      setDurationTick(0);
      setLogs([]);
      setChartPoints([]);
      setMarkers([]);
      setCurrentEmotion("-");
      setConfidence("-");
      setScores({
        Senang: 0,
        Sedih: 0,
        Marah: 0,
        Takut: 0,
        Netral: 0,
      });
    }

    setTimeout(() => {
      hasLoadedProgressRef.current = true;
    }, 0);
  }, [sessionInfo?.sessionId]);

  useEffect(() => {
    if (!sessionInfo?.sessionId) return;
    if (!hasLoadedProgressRef.current) return;

    const progress = {
      sessionId: sessionInfo.sessionId,
      durationSecond: durationTick,
      logs,
      chartPoints,
      markers,
      scores,
      currentEmotion,
      confidence,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      getMonitoringProgressKey(sessionInfo.sessionId),
      JSON.stringify(progress)
    );
  }, [
    sessionInfo?.sessionId,
    durationTick,
    logs,
    chartPoints,
    markers,
    scores,
    currentEmotion,
    confidence,
  ]);

  const emotionToY = {
    Marah: 0,
    Sedih: 1,
    Takut: 2,
    Netral: 3,
    Senang: 4,
  };

  const emotionOrder = ["Senang", "Sedih", "Marah", "Takut", "Netral"];

  const scatterEmotionOrder = ["Marah", "Sedih", "Takut", "Netral", "Senang"];

  const emotionColors = {
    Senang: "#22c55e",
    Sedih: "#2563eb",
    Marah: "#ef4444",
    Takut: "#f59e0b",
    Netral: "#6b7280",
  };

  const emotionIcon = {
    Senang: "😊",
    Sedih: "😟",
    Marah: "😠",
    Takut: "😨",
    Netral: "😐",
  };

  const formatSecondToTime = (second) => {
    const hours = Math.floor(second / 3600);
    const minutes = Math.floor((second % 3600) / 60);
    const seconds = second % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
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
      console.error("Gagal membaca kamera:", error);
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
  };

  const resetMonitoring = () => {
    secondCounterRef.current = 0;
    setDurationTick(0);
    setLogs([]);
    setChartPoints([]);
    setCurrentEmotion("-");
    setConfidence("-");
    setMarkers([]);
    setMarkerTitle("");
    setMarkerCategory("Akademik");
    setMarkerNote("");
    setScores({
      Senang: 0,
      Sedih: 0,
      Marah: 0,
      Takut: 0,
      Netral: 0,
    });
    setFaceBox(null);

    if (sessionInfo?.sessionId) {
      localStorage.removeItem(getMonitoringProgressKey(sessionInfo.sessionId));
    }

    hasLoadedProgressRef.current = true;
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

    const markerTimeLabel =
      currentSecond < 60
        ? `Detik ke-${currentSecond}`
        : `Menit ${formatSecondToTime(currentSecond).slice(3)}`;

    const newMarker = {
      id: Date.now(),
      timeSecond: currentSecond,
      timeLabel: markerTimeLabel,
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
      if (counts[point.emotion] !== undefined) {
        counts[point.emotion] += 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts));
    const dominantEmotions = Object.keys(counts).filter(
      (emotion) => counts[emotion] === maxCount
    );

    const dominantText = dominantEmotions.join(" dan ");

    const negativeCount = counts.Sedih + counts.Marah + counts.Takut;
    const positiveStableCount = counts.Senang + counts.Netral;

    const negativePercentage = (negativeCount / relatedPoints.length) * 100;
    const positiveStablePercentage =
      (positiveStableCount / relatedPoints.length) * 100;

    const isNegativeDominant = dominantEmotions.some((emotion) =>
      ["Sedih", "Marah", "Takut"].includes(emotion)
    );

    const isStableDominant = dominantEmotions.some((emotion) =>
      ["Senang", "Netral"].includes(emotion)
    );

    if (isNegativeDominant && negativePercentage >= 50) {
      return `Dalam 30 detik setelah momen ini, emosi ${dominantText} terlihat dominan. Sistem mengindikasikan adanya peningkatan respons emosi negatif pada segmen ini.`;
    }

    if (isStableDominant && positiveStablePercentage >= 50) {
      return `Dalam 30 detik setelah momen ini, emosi ${dominantText} terlihat dominan. Respons emosi mahasiswa pada segmen ini terpantau relatif stabil atau positif.`;
    }

    return `Dalam 30 detik setelah momen ini, emosi ${dominantText} terlihat dominan, namun pola emosi pada segmen ini masih cukup bervariasi. Konselor dapat meninjau konteks pembicaraan pada momen tersebut.`;
  };

  const buildSessionReport = () => {
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
      percentages[emotion] =
        total === 0 ? "0.0" : ((counts[emotion] / total) * 100).toFixed(1);
    });

    const maxCount = Math.max(...Object.values(counts));
    const dominantEmotions = Object.keys(counts).filter(
      (emotion) => counts[emotion] === maxCount
    );

    const dominantEmotion = dominantEmotions.join(" dan ");

    let interpretation = "";
    let recommendation = "";

    const dominantList = dominantEmotions;
    const dominantText = dominantEmotion;
    const dominantPercentages = dominantList.map((emotion) =>
      Number(percentages[emotion] || 0)
    );
    const averageDominantPercentage =
      dominantPercentages.length === 0
        ? 0
        : dominantPercentages.reduce((sum, value) => sum + value, 0) /
        dominantPercentages.length;

    const negativeTotal =
      Number(percentages.Sedih || 0) +
      Number(percentages.Marah || 0) +
      Number(percentages.Takut || 0);

    if (dominantList.includes("Sedih") && dominantList.length === 1) {
      interpretation = `Emosi Sedih menjadi emosi dominan selama sesi dengan persentase ${Number(
        percentages.Sedih || 0
      ).toFixed(
        1
      )}%. Hal ini dapat mengindikasikan adanya tekanan emosional, rasa tidak nyaman, atau beban psikologis yang perlu diperhatikan lebih lanjut oleh konselor.`;

      recommendation =
        "Konselor disarankan menggunakan pendekatan yang lebih empatik, memberi ruang mahasiswa untuk bercerita, serta menggali faktor penyebab munculnya emosi sedih selama sesi.";
    } else if (dominantList.includes("Marah") && dominantList.length === 1) {
      interpretation = `Emosi Marah menjadi emosi dominan selama sesi dengan persentase ${Number(
        percentages.Marah || 0
      ).toFixed(
        1
      )}%. Hal ini dapat mengindikasikan adanya resistensi, frustrasi, atau ketegangan emosional pada mahasiswa selama proses konseling.`;

      recommendation =
        "Konselor disarankan menurunkan tensi komunikasi, menggunakan pertanyaan terbuka, dan menghindari respons yang berpotensi meningkatkan resistensi mahasiswa.";
    } else if (dominantList.includes("Takut") && dominantList.length === 1) {
      interpretation = `Emosi Takut menjadi emosi dominan selama sesi dengan persentase ${Number(
        percentages.Takut || 0
      ).toFixed(
        1
      )}%. Hal ini dapat mengindikasikan adanya kecemasan, kekhawatiran, atau rasa tidak aman dalam membahas topik tertentu.`;

      recommendation =
        "Konselor disarankan menciptakan suasana yang lebih aman dan menenangkan, serta memastikan mahasiswa merasa nyaman sebelum menggali topik yang sensitif.";
    } else if (dominantList.includes("Senang") && dominantList.length === 1) {
      interpretation = `Emosi Senang menjadi emosi dominan selama sesi dengan persentase ${Number(
        percentages.Senang || 0
      ).toFixed(
        1
      )}%. Hal ini menunjukkan respons emosional yang positif dan keterlibatan mahasiswa yang cukup baik selama sesi.`;

      recommendation =
        "Konselor dapat mempertahankan pendekatan yang digunakan dan tetap memantau perubahan emosi mahasiswa pada bagian sesi yang lebih sensitif.";
    } else if (dominantList.includes("Netral") && dominantList.length === 1) {
      if (negativeTotal >= 40) {
        interpretation = `Emosi Netral menjadi emosi dominan selama sesi dengan persentase ${Number(
          percentages.Netral || 0
        ).toFixed(
          1
        )}%, namun emosi negatif seperti Sedih, Marah, atau Takut juga muncul dalam proporsi yang cukup terlihat. Hal ini menunjukkan kondisi emosi mahasiswa relatif terkendali, tetapi tetap terdapat indikasi tekanan emosional pada beberapa bagian sesi.`;

        recommendation =
          "Konselor disarankan meninjau bagian sesi ketika emosi negatif meningkat dan menggali konteks pembicaraan pada momen tersebut.";
      } else {
        interpretation = `Emosi Netral menjadi emosi dominan selama sesi dengan persentase ${Number(
          percentages.Netral || 0
        ).toFixed(
          1
        )}%. Hal ini menunjukkan ekspresi mahasiswa relatif stabil dan tidak menunjukkan perubahan emosi yang terlalu kuat selama sesi.`;

        recommendation =
          "Konselor dapat melanjutkan pendekatan konseling sesuai rencana dan tetap memperhatikan momen ketika terjadi perubahan emosi yang signifikan.";
      }
    } else {
      interpretation = `Terdapat beberapa emosi dominan dengan proporsi yang seimbang, yaitu ${dominantText}, dengan rata-rata persentase sekitar ${averageDominantPercentage.toFixed(
        1
      )}%. Hal ini menunjukkan respons emosi mahasiswa cukup bervariasi selama sesi.`;

      recommendation =
        "Konselor disarankan meninjau grafik sebaran emosi dan momen penting untuk memahami konteks perubahan emosi mahasiswa secara lebih menyeluruh.";
    }

    const markerAnalysis = markers.map((marker) => ({
      ...marker,
      analysis: analyzeMarkerEmotion(marker),
    }));

    return {
      sessionInfo,
      duration: formatSecondToTime(secondCounterRef.current),
      totalDuration: formatSecondToTime(secondCounterRef.current),
      durationSecond: secondCounterRef.current,

      total,
      counts,
      percentages,
      dominantEmotion,
      interpretation,
      recommendation,
      chartPoints,
      logs,
      markers: markerAnalysis,
      timeline: [],
    };
  };

  const finishSession = () => {
    setIsMonitoring(false);

    if (chartPoints.length === 0) {
      alert("Belum ada data deteksi untuk dibuat laporan.");
      return;
    }

    const report = buildSessionReport();
    const reportId = `RPT-${Date.now()}`;

    const reportWithMeta = {
      ...report,
      id: reportId,
      reportId,
      sessionId: sessionInfo.sessionId,
      createdAt: new Date().toISOString(),
      status: "Selesai",
    };

    localStorage.setItem("latestSessionReport", JSON.stringify(reportWithMeta));

    const savedReports = JSON.parse(
      localStorage.getItem("sessionReports") || "[]"
    );

    const updatedReports = [reportWithMeta, ...savedReports];

    localStorage.setItem("sessionReports", JSON.stringify(updatedReports));

    const savedSessions = JSON.parse(
      localStorage.getItem("counselingSessions") || "[]"
    );

    const finishedSession = {
      ...sessionInfo,
      status: "Selesai",
      duration: formatSecondToTime(secondCounterRef.current),
      reportId,
      finishedAt: new Date().toISOString(),
    };

    const updatedSessions = savedSessions.map((session) => {
      const sameSession =
        session.sessionId === sessionInfo.sessionId ||
        session.id === sessionInfo.id;

      return sameSession ? { ...session, ...finishedSession } : session;
    });

    localStorage.setItem("counselingSessions", JSON.stringify(updatedSessions));
    localStorage.removeItem("currentCounselingSession");
    localStorage.removeItem(getMonitoringProgressKey(sessionInfo.sessionId));

    navigate("/laporan-sesi", {
      state: {
        report: reportWithMeta,
      },
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

        if (result.success && result.face_box && result.frame_size) {
          setFaceBox(result.face_box);
          setFrameSize(result.frame_size);
        } else {
          setFaceBox(null);
          setFrameSize(null);
        }

        if (result.scores) {
          setScores((prev) => ({
            ...prev,
            ...result.scores,
          }));
        }

        if (emotionY === undefined) {
          setCurrentEmotion(emotion || "Tidak Terdeteksi");
          setConfidence(result.confidence || 0);
          return;
        }

        setCurrentEmotion(emotion);
        setConfidence(result.confidence);

        const newLog = {
          time: new Date().toLocaleTimeString(),
          emotion,
          confidence: result.confidence,
        };

        setLogs((prev) => [newLog, ...prev].slice(0, 8));

        setChartPoints((prev) => [
          ...prev,
          {
            x: secondCounterRef.current,
            y: emotionY,
            emotion,
            confidence: result.confidence,
          },
        ]);

        secondCounterRef.current += 1;
        setDurationTick(secondCounterRef.current);
      } catch (error) {
        console.error("Gagal mengirim frame ke backend:", error);
      }
    }, "image/jpeg");
  };

  useEffect(() => {
    loadCameraDevices();

    return () => {
      const stream = videoRef.current?.srcObject;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
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

  const totalDetected = chartPoints.length;

  const counts = useMemo(() => {
    const result = {
      Senang: 0,
      Sedih: 0,
      Marah: 0,
      Takut: 0,
      Netral: 0,
    };

    chartPoints.forEach((point) => {
      result[point.emotion] += 1;
    });

    return result;
  }, [chartPoints]);

  const dominantEmotion = useMemo(() => {
    if (chartPoints.length === 0) return "-";

    const maxCount = Math.max(...Object.values(counts));
    const result = Object.keys(counts).filter(
      (emotion) => counts[emotion] === maxCount
    );

    return result.join(" dan ");
  }, [counts, chartPoints.length]);

  const distributionData = emotionOrder
    .map((emotion) => ({
      name: emotion,
      value: counts[emotion],
      color: emotionColors[emotion],
    }))
    .filter((item) => item.value > 0);

  const scatterData = {
    datasets: scatterEmotionOrder.map((emotion) => ({
      label: emotion,
      data: chartPoints.filter((point) => point.emotion === emotion),
      pointRadius: 4.5,
      pointHoverRadius: 7,
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
        grid: {
          color: "#e5e7eb",
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
        grid: {
          color: "#e5e7eb",
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

  const statusText =
    currentEmotion === "Netral" || currentEmotion === "Senang"
      ? "Stabil"
      : currentEmotion === "-"
        ? "-"
        : "Perlu Perhatian";

  const resolutionText = frameSize
    ? `${frameSize.width} x ${frameSize.height}`
    : "-";

  return (
    <AppLayout
      title="Monitoring Emosi Real-Time"
      subtitle="Dashboard > Sesi Konseling > Monitoring Real-Time"
      showSessionStatus={isMonitoring}
      sessionDuration={formatSecondToTime(durationTick)}
    >
      <div className="space-y-5">
        <SessionInfoBar
          sessionInfo={sessionInfo}
          duration={formatSecondToTime(durationTick)}
        />

        <section className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
          <CameraPanel
            cameraDevices={cameraDevices}
            selectedCameraId={selectedCameraId}
            setSelectedCameraId={setSelectedCameraId}
            videoRef={videoRef}
            canvasRef={canvasRef}
            isCameraOn={isCameraOn}
            currentEmotion={currentEmotion}
            confidence={confidence}
            emotionIcon={emotionIcon}
            faceBox={faceBox}
            frameSize={frameSize}
            startCamera={startCamera}
            stopCamera={stopCamera}
            resetMonitoring={resetMonitoring}
            setIsMonitoring={setIsMonitoring}
          />

          <RightPanel
            currentEmotion={currentEmotion}
            dominantEmotion={dominantEmotion}
            confidence={confidence}
            statusText={statusText}
            emotionIcon={emotionIcon}
            totalDetected={totalDetected}
            resolutionText={resolutionText}
            counts={counts}
            emotionOrder={emotionOrder}
            emotionColors={emotionColors}
            distributionData={distributionData}
          />
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)] gap-5">
          <MiddlePanel
            scores={scores}
            logs={logs}
            emotionOrder={emotionOrder}
            emotionColors={emotionColors}
            emotionIcon={emotionIcon}
          />
        </section>

        <section className="grid grid-cols-[minmax(0,1fr)_420px] gap-5">
          <ScatterPanel scatterData={scatterData} scatterOptions={scatterOptions} />

          <MomentMarkerCard
            markerTitle={markerTitle}
            setMarkerTitle={setMarkerTitle}
            markerCategory={markerCategory}
            setMarkerCategory={setMarkerCategory}
            markerNote={markerNote}
            setMarkerNote={setMarkerNote}
            saveMarker={saveMarker}
            markers={markers}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="flex items-center gap-3 rounded-[22px] border border-indigo-100 bg-white p-4 text-sm font-semibold leading-relaxed text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.055)]">
            <Info size={18} className="shrink-0 text-indigo-600" />
            <p>
              Pastikan pencahayaan wajah cukup dan posisi mahasiswa menghadap kamera
              untuk hasil deteksi yang optimal.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setIsMonitoring((prev) => !prev)}
              disabled={!isCameraOn}
              className="rounded-2xl border border-indigo-100 bg-white px-5 py-4 text-sm font-extrabold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isMonitoring ? "Jeda Deteksi" : "Lanjut Deteksi"}
            </button>

            <button
              type="button"
              onClick={resetMonitoring}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reset Deteksi
            </button>

            <button
              type="button"
              onClick={finishSession}
              className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(244,63,94,0.22)] transition hover:brightness-105"
            >
              Akhiri Sesi
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function SessionInfoBar({ sessionInfo, duration }) {
  const items = [
    {
      icon: <UserRound size={21} />,
      label: "Mahasiswa",
      value: sessionInfo.studentName,
      subValue: sessionInfo.nim,
    },
    {
      icon: <FileText size={21} />,
      label: "Topik Konseling",
      value: sessionInfo.topic,
      subValue: sessionInfo.programStudy,
    },
    {
      icon: <Clock size={21} />,
      label: "Mulai Sesi",
      value: sessionInfo.startDate,
      subValue: sessionInfo.startTime,
    },
    {
      icon: <Timer size={21} />,
      label: "Durasi Berjalan",
      value: duration,
      subValue: "Real-time",
    },
  ];

  return (
    <section className="grid grid-cols-4 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 items-center gap-4 border-r border-slate-100 px-5 py-5 last:border-r-0"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-teal-50 text-[#5B4FE9] ring-1 ring-indigo-100">
            {item.icon}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold leading-5 text-slate-500">
              {item.label}
            </p>

            <h4 className="mt-1 text-sm font-extrabold leading-5 text-slate-950">
              {item.value || "-"}
            </h4>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {item.subValue || "-"}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function CameraPanel({
  cameraDevices,
  selectedCameraId,
  setSelectedCameraId,
  videoRef,
  canvasRef,
  isCameraOn,
  currentEmotion,
  confidence,
  emotionIcon,
  faceBox,
  frameSize,
  startCamera,
  stopCamera,
  resetMonitoring,
  setIsMonitoring,
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-slate-950">
            Deteksi Emosi Secara Real-Time
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Kamera aktif untuk memantau ekspresi wajah mahasiswa.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
          LIVE
        </span>
      </div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        Pilih Kamera
      </label>
      <select
        value={selectedCameraId}
        onChange={(e) => setSelectedCameraId(e.target.value)}
        className="mb-4 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
      >
        {cameraDevices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Kamera ${index + 1}`}
          </option>
        ))}
      </select>

      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />

        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-400">
            Kamera belum aktif
          </div>
        )}

        {faceBox && frameSize && (
          <div
            className="absolute rounded-xl border-4 border-emerald-500"
            style={{
              left: `${(faceBox.x / frameSize.width) * 100}%`,
              top: `${(faceBox.y / frameSize.height) * 100}%`,
              width: `${(faceBox.w / frameSize.width) * 100}%`,
              height: `${(faceBox.h / frameSize.height) * 100}%`,
            }}
          >
            <span className="absolute -top-9 left-0 rounded-lg bg-emerald-500 px-3 py-1 text-sm font-extrabold text-white">
              {currentEmotion}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            Emosi Terdeteksi
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl">{emotionIcon[currentEmotion] || "•"}</span>
            <h2 className="text-2xl font-extrabold text-slate-950">
              {currentEmotion}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">Probabilitas</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-950">
            {confidence === "-" ? "-" : confidence}
          </p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-4 grid grid-cols-4 gap-3">
        <ActionButton onClick={startCamera} variant="light">
          <Camera size={16} />
          Aktifkan Kamera
        </ActionButton>

        <ActionButton
          onClick={() => setIsMonitoring(true)}
          disabled={!isCameraOn}
          variant="primary"
        >
          <Activity size={16} />
          Mulai Deteksi
        </ActionButton>

        <ActionButton onClick={resetMonitoring} variant="light">
          Reset
        </ActionButton>

        <ActionButton onClick={stopCamera} variant="danger">
          <Square size={16} />
          Stop Kamera
        </ActionButton>
      </div>
    </div>
  );
}

function MiddlePanel({
  scores,
  logs,
  emotionOrder,
  emotionColors,
  emotionIcon,
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <h3 className="mb-5 text-center text-lg font-extrabold text-slate-950">
          Probabilitas Emosi Real-Time
        </h3>

        <div className="space-y-4">
          {emotionOrder.map((emotion) => (
            <div
              key={emotion}
              className="grid grid-cols-[92px_minmax(0,1fr)_48px] items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-white"
                  style={{ backgroundColor: emotionColors[emotion] }}
                >
                  {emotionIcon[emotion]}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {emotion}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Number(scores[emotion] || 0) * 100, 100)}%`,
                    backgroundColor: emotionColors[emotion],
                  }}
                />
              </div>

              <span className="text-right text-sm font-extrabold text-slate-800">
                {Number(scores[emotion] || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-medium text-slate-600">
          <Info size={18} className="mt-0.5 shrink-0 text-[#5B4FE9]" />
          <p>
            Probabilitas menunjukkan tingkat keyakinan model terhadap setiap
            emosi pada frame saat ini.
          </p>
        </div>
      </div>

      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <h3 className="mb-4 text-lg font-extrabold text-slate-950">
          Log Deteksi Terbaru
        </h3>

        <div className="max-h-[240px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-3 font-extrabold">Waktu</th>
                <th className="pb-3 font-extrabold">Emosi</th>
                <th className="pb-3 text-right font-extrabold">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="py-6 text-center text-sm font-semibold text-slate-400"
                  >
                    Belum ada data deteksi.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={`${log.time}-${index}`} className="border-b border-slate-50">
                    <td className="py-3 text-slate-600">{log.time}</td>
                    <td className="py-3 font-bold text-slate-800">{log.emotion}</td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      {log.confidence}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RightPanel({
  currentEmotion,
  dominantEmotion,
  statusText,
  emotionIcon,
  totalDetected,
  resolutionText,
  counts,
  emotionOrder,
  emotionColors,
  distributionData,
}) {
  return (
    <aside className="space-y-5">
      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <h3 className="text-lg font-extrabold text-slate-950">
          Ringkasan Deteksi Saat Ini
        </h3>

        <div className="mt-5 flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-3xl">
            {emotionIcon[currentEmotion] || "•"}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">
              Emosi Dominan
            </p>
            <h2 className="truncate text-2xl font-extrabold text-slate-950">
              {dominantEmotion}
            </h2>
            <span
              className={[
                "mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold",
                statusText === "Stabil"
                  ? "bg-emerald-50 text-emerald-700"
                  : statusText === "-"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {statusText}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <SummaryRow label="Total Frame" value={totalDetected} />
          <SummaryRow
            label="Frame Terdeteksi"
            value={`${totalDetected} (${totalDetected > 0 ? "100%" : "0%"})`}
          />
          <SummaryRow label="Model AI" value="LightExNet V2" />
          <SummaryRow label="Mode" value="Real-Time" badge />
          <SummaryRow label="Resolusi" value={resolutionText} />
        </div>
      </div>

      <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <h3 className="text-lg font-extrabold text-slate-950">
          Distribusi Emosi Sementara
        </h3>

        <div className="mt-5 flex items-center gap-5">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    distributionData.length
                      ? distributionData
                      : [{ name: "Kosong", value: 1, color: "#e5e7eb" }]
                  }
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(distributionData.length
                    ? distributionData
                    : [{ color: "#e5e7eb" }]
                  ).map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-500">Total</span>
              <strong className="text-lg font-extrabold text-slate-950">
                {totalDetected}
              </strong>
              <span className="text-xs text-slate-500">Deteksi</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            {emotionOrder.map((emotion) => {
              const value = counts[emotion];
              const percentage =
                totalDetected === 0
                  ? 0
                  : ((value / totalDetected) * 100).toFixed(1);

              return (
                <div
                  key={emotion}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: emotionColors[emotion] }}
                    ></span>
                    <span className="font-bold text-slate-700">{emotion}</span>
                  </div>

                  <span className="font-extrabold text-slate-700">
                    {percentage}% ({value})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-medium text-slate-600">
          <Info size={18} className="mt-0.5 shrink-0 text-[#5B4FE9]" />
          <p>
            Distribusi dihitung berdasarkan seluruh deteksi sejak sesi dimulai
            hingga saat ini.
          </p>
        </div>
      </div>
    </aside>
  );
}

function ScatterPanel({ scatterData, scatterOptions }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <h3 className="mb-4 text-lg font-extrabold text-slate-950">
        Grafik Sebaran Emosi Selama Sesi
      </h3>

      <div className="h-[320px]">
        <Scatter data={scatterData} options={scatterOptions} />
      </div>

      <div className="mt-4 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-medium text-slate-600">
        <Info size={18} className="mt-0.5 shrink-0 text-[#5B4FE9]" />
        <p>
          Setiap titik merepresentasikan hasil prediksi emosi pada interval
          waktu tertentu selama sesi berlangsung.
        </p>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, disabled, variant = "light" }) {
  const variants = {
    light:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50",
    primary:
      "border border-transparent bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] text-white shadow-[0_14px_28px_rgba(91,79,233,0.22)] hover:brightness-105",
    danger:
      "border border-rose-100 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value, badge }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-slate-500">{label}</span>
      {badge ? (
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {value}
        </span>
      ) : (
        <strong className="text-right font-bold text-slate-800">{value}</strong>
      )}
    </div>
  );
}

function MomentMarkerCard({
  markerTitle,
  setMarkerTitle,
  markerCategory,
  setMarkerCategory,
  markerNote,
  setMarkerNote,
  saveMarker,
  markers,
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">
            Tandai Momen Konseling
          </h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
            Catat pertanyaan atau topik penting selama sesi berjalan.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <BookmarkPlus size={20} />
        </div>
      </div>

      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Judul momen, contoh: Membahas nilai akademik"
          value={markerTitle}
          onChange={(e) => setMarkerTitle(e.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
        />

        <select
          value={markerCategory}
          onChange={(e) => setMarkerCategory(e.target.value)}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
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
        className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
      />

      <button
        type="button"
        onClick={saveMarker}
        className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#5B4FE9] to-[#14B8A6] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(91,79,233,0.20)] transition hover:brightness-105"
      >
        Tandai Momen Sekarang
      </button>

      {markers.length > 0 && (
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-extrabold text-slate-950">
            Daftar Momen Ditandai
          </h4>

          {markers.map((marker) => (
            <div
              key={marker.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <strong className="text-sm text-slate-950">
                {marker.timeLabel} - {marker.category}
              </strong>

              <p className="mt-2 text-sm font-bold text-slate-800">
                {marker.title}
              </p>

              {marker.note && (
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {marker.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MonitoringPage;