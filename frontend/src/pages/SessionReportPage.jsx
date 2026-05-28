import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEmotionIcon } from "../utils/emotionIcons";

import {
  CalendarDays,
  Download,
  FileText,
  Info,
  UserRound,
  Clock,
  Timer,
  CheckCircle2,
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

function SessionReportPage() {
  const location = useLocation();
  const reportRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const savedReport = localStorage.getItem("latestSessionReport");

  const report =
    location.state?.report || (savedReport ? JSON.parse(savedReport) : null);

  const emotionColors = {
    Senang: "#22c55e",
    Sedih: "#2563eb",
    Marah: "#ef4444",
    Takut: "#f59e0b",
    Netral: "#6b7280",
  };

  const emotionOrder = ["Senang", "Sedih", "Marah", "Takut", "Netral"];
  const scatterEmotionOrder = ["Marah", "Sedih", "Takut", "Netral", "Senang"];

  const fallbackReport = {
    sessionInfo: {
      studentName: "-",
      nim: "-",
      programStudy: "-",
      counselorName: "Hendrawaty, ST., MT",
      topic: "-",
      method: "-",
      initialNote: "-",
      startDate: "12 Mei 2024",
      startTime: "-",
    },
    total: 0,
    counts: {
      Senang: 0,
      Sedih: 0,
      Marah: 0,
      Takut: 0,
      Netral: 0,
    },
    percentages: {
      Senang: "0.0",
      Sedih: "0.0",
      Marah: "0.0",
      Takut: "0.0",
      Netral: "0.0",
    },
    dominantEmotion: "-",
    interpretation:
      "Belum ada data deteksi yang tersedia. Laporan akan terisi setelah sesi monitoring selesai.",
    recommendation:
      "Silakan lakukan monitoring terlebih dahulu untuk menghasilkan rekomendasi awal.",
    chartPoints: [],
    logs: [],
    markers: [],
  };

  const data = report || fallbackReport;

  const sessionInfo = data.sessionInfo || fallbackReport.sessionInfo;
  const counts = data.counts || fallbackReport.counts;
  const percentages = data.percentages || fallbackReport.percentages;
  const chartPoints = data.chartPoints || [];
  const markers = data.markers || [];

  const totalDetected = data.total || chartPoints.length || 0;

  const duration = useMemo(() => {
    if (data.duration || data.totalDuration) {
      return data.duration || data.totalDuration;
    }

    const maxSecond = chartPoints.length
      ? Math.max(...chartPoints.map((point) => Number(point.x || 0)))
      : 0;

    return formatSecondToTime(maxSecond);
  }, [data.duration, data.totalDuration, chartPoints]);

  const distributionData = emotionOrder
    .map((emotion) => ({
      name: emotion,
      value: counts[emotion] || 0,
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

  const timeline = useMemo(() => {
    if (chartPoints.length === 0) return [];

    const maxSecond = Math.max(...chartPoints.map((point) => point.x || 0));
    const totalMinutes = Math.max(1, Math.ceil((maxSecond + 1) / 60));

    const result = [];

    for (let minute = 0; minute < totalMinutes; minute++) {
      const start = minute * 60;
      const end = start + 59;

      const points = chartPoints.filter(
        (point) => point.x >= start && point.x <= end
      );

      if (points.length === 0) {
        result.push({
          range: `${formatMinuteRange(start, end)}`,
          emotion: "-",
          color: "#94a3b8",
        });
        continue;
      }

      const minuteCounts = {
        Senang: 0,
        Sedih: 0,
        Marah: 0,
        Takut: 0,
        Netral: 0,
      };

      points.forEach((point) => {
        minuteCounts[point.emotion] += 1;
      });

      const maxCount = Math.max(...Object.values(minuteCounts));
      const dominant = Object.keys(minuteCounts).find(
        (emotion) => minuteCounts[emotion] === maxCount
      );

      result.push({
        range: `${formatMinuteRange(start, end)}`,
        emotion: dominant,
        color: emotionColors[dominant],
      });
    }

    return result;
  }, [chartPoints]);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 14;
      const contentWidth = pageWidth - marginX * 2;
      let y = 18;

      const pdfColors = {
        Senang: [34, 197, 94],
        Sedih: [37, 99, 235],
        Marah: [239, 68, 68],
        Takut: [245, 158, 11],
        Netral: [107, 114, 128],

        violet: [124, 58, 237],
        violetSoft: [245, 243, 255],
        violetLine: [221, 214, 254],

        slateDark: [15, 23, 42],
        slate: [71, 85, 105],
        slateMuted: [100, 116, 139],
        lightBorder: [226, 232, 240],
        lightBg: [248, 250, 252],
        white: [255, 255, 255],

        redSoft: [254, 242, 242],
        redLine: [254, 202, 202],
        redText: [185, 28, 28],

        blueSoft: [239, 246, 255],
        blueLine: [191, 219, 254],
        blueText: [30, 64, 175],

        amberSoft: [255, 251, 235],
        amberLine: [253, 230, 138],
        amberText: [180, 83, 9],
      };

      const safeName = (sessionInfo.studentName || "Sesi")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      const dominantEmotion = data.dominantEmotion || "-";
      const dominantPercent = percentages[dominantEmotion] || "0.0";

      const setText = (
        size = 10,
        style = "normal",
        color = pdfColors.slateDark
      ) => {
        pdf.setFont("helvetica", style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
      };

      const drawCard = (
        x,
        yPos,
        w,
        h,
        fill = pdfColors.white,
        stroke = pdfColors.lightBorder
      ) => {
        pdf.setFillColor(...fill);
        pdf.setDrawColor(...stroke);
        pdf.setLineWidth(0.25);
        pdf.roundedRect(x, yPos, w, h, 3, 3, "FD");
      };

      const addFooter = () => {
        const totalPages = pdf.internal.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, pageHeight - 13, pageWidth, 13, "F");

          pdf.setDrawColor(...pdfColors.lightBorder);
          pdf.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

          setText(7.5, "normal", pdfColors.slateMuted);
          pdf.text(
            "Laporan otomatis sistem deteksi emosi wajah",
            marginX,
            pageHeight - 6
          );

          pdf.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
            align: "right",
          });
        }
      };

      const addHeader = (title = "LAPORAN HASIL KONSELING", subtitle = "Sistem Deteksi Emosi Wajah") => {
        pdf.setFillColor(...pdfColors.violet);
        pdf.rect(0, 0, pageWidth, 18, "F");

        setText(13, "bold", [255, 255, 255]);
        pdf.text(title, marginX, 11.5);

        setText(8, "normal", [255, 255, 255]);
        pdf.text(subtitle, pageWidth - marginX, 11.5, {
          align: "right",
        });

        y = 28;
      };

      const addSectionTitle = (title) => {
        y += 2;

        setText(11.5, "bold", pdfColors.slateDark);
        pdf.text(title, marginX, y);

        pdf.setDrawColor(...pdfColors.violetLine);
        pdf.setLineWidth(0.5);
        pdf.line(marginX, y + 2.5, marginX + 42, y + 2.5);

        y += 8;
      };

      const addWrappedText = (text, x, maxWidth, lineHeight = 5) => {
        const lines = pdf.splitTextToSize(String(text || "-"), maxWidth);

        setText(9, "normal", pdfColors.slate);
        pdf.text(lines, x, y);

        y += lines.length * lineHeight;
      };

      const addKeyValue = (label, value, x, yPos, labelWidth = 36, valueWidth = 50) => {
        setText(8.5, "normal", pdfColors.slateMuted);
        pdf.text(String(label), x, yPos);

        setText(8.7, "bold", pdfColors.slateDark);
        const valueLines = pdf.splitTextToSize(String(value || "-"), valueWidth);
        pdf.text(valueLines, x + labelWidth, yPos);

        return Math.max(6, valueLines.length * 4.5);
      };


      const drawEmotionSummaryCards = (x, yPos, w) => {
        const gap = 4;
        const cardW = (w - gap * 4) / 5;
        const cardH = 28;

        emotionOrder.forEach((emotion, index) => {
          const cx = x + index * (cardW + gap);
          const isDominant = emotion === dominantEmotion;
          const emotionColor = pdfColors[emotion] || pdfColors.slateMuted;

          drawCard(
            cx,
            yPos,
            cardW,
            cardH,
            isDominant ? pdfColors.redSoft : pdfColors.white,
            isDominant ? pdfColors.redLine : pdfColors.lightBorder
          );

          pdf.setFillColor(...emotionColor);
          pdf.circle(cx + 8, yPos + 9, 3.3, "F");

          setText(8, "bold", isDominant ? pdfColors.redText : pdfColors.slate);
          pdf.text(emotion, cx + 15, yPos + 8);

          setText(12, "bold", isDominant ? pdfColors.redText : pdfColors.slateDark);
          pdf.text(`${percentages[emotion] || "0.0"}%`, cx + 15, yPos + 16);

          setText(7.2, "normal", pdfColors.slateMuted);
          pdf.text(`${counts[emotion] || 0} deteksi`, cx + 15, yPos + 23);
        });

        return yPos + cardH + 8;
      };

      const drawEmotionBarChart = () => {
        addSectionTitle("Grafik Batang Persentase Emosi");

        const chartX = marginX;
        const chartY = y;
        const chartW = contentWidth;
        const chartH = 54;

        drawCard(chartX, chartY, chartW, chartH);

        const labelW = 27;
        const barX = chartX + labelW + 8;
        const barMaxW = chartW - labelW - 30;
        let rowY = chartY + 10;

        emotionOrder.forEach((emotion) => {
          const percent = Number(percentages[emotion] || 0);
          const barW = (percent / 100) * barMaxW;
          const color = pdfColors[emotion] || pdfColors.slateMuted;

          setText(8, "bold", pdfColors.slateDark);
          pdf.text(emotion, chartX + 8, rowY + 3);

          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(barX, rowY, barMaxW, 4, 2, 2, "F");

          pdf.setFillColor(...color);
          pdf.roundedRect(barX, rowY, Math.max(1, barW), 4, 2, 2, "F");

          setText(8, "bold", pdfColors.slateDark);
          pdf.text(`${percent.toFixed(1)}%`, chartX + chartW - 8, rowY + 3.5, {
            align: "right",
          });

          rowY += 8.5;
        });

        y += chartH + 8;
      };

      const drawScatterPlot = () => {
        addSectionTitle("Grafik Sebaran Emosi Selama Sesi");

        const chartX = marginX;
        const chartY = y;
        const chartW = contentWidth;
        const chartH = 82;

        drawCard(chartX, chartY, chartW, chartH);

        const plotX = chartX + 25;
        const plotY = chartY + 12;
        const plotW = chartW - 35;
        const plotH = chartH - 28;

        const maxSecond = chartPoints.length
          ? Math.max(...chartPoints.map((point) => Number(point.x || 0)))
          : 1;

        const emotionToYForPdf = {
          Marah: 0,
          Sedih: 1,
          Takut: 2,
          Netral: 3,
          Senang: 4,
        };

        const yLabels = ["Marah", "Sedih", "Takut", "Netral", "Senang"];

        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);

        for (let i = 0; i <= 4; i++) {
          const yy = plotY + plotH - (i / 4) * plotH;
          pdf.line(plotX, yy, plotX + plotW, yy);

          setText(7.3, "normal", pdfColors.slateMuted);
          pdf.text(yLabels[i], plotX - 4, yy + 2, { align: "right" });
        }

        for (let i = 0; i <= 5; i++) {
          const xx = plotX + (i / 5) * plotW;
          pdf.line(xx, plotY, xx, plotY + plotH);

          const label = Math.round((i / 5) * maxSecond);
          setText(7, "normal", pdfColors.slateMuted);
          pdf.text(String(label), xx, plotY + plotH + 7, { align: "center" });
        }

        chartPoints.forEach((point) => {
          const emotion = point.emotion;
          const emotionY = emotionToYForPdf[emotion];

          if (emotionY === undefined) return;

          const px =
            plotX + (Number(point.x || 0) / Math.max(maxSecond, 1)) * plotW;
          const py = plotY + plotH - (emotionY / 4) * plotH;

          pdf.setFillColor(...(pdfColors[emotion] || pdfColors.slateMuted));
          pdf.circle(px, py, 1.45, "F");
        });

        setText(8, "normal", pdfColors.slateMuted);
        pdf.text("Waktu Sesi (detik)", plotX + plotW / 2, chartY + chartH - 5, {
          align: "center",
        });

        y += chartH + 8;
      };

      const drawDistributionTable = () => {
        addSectionTitle("Distribusi Emosi Keseluruhan");

        const startX = marginX;
        const rowH = 8.5;
        const tableW = contentWidth;
        const tableH = 13 + emotionOrder.length * rowH + 5;

        drawCard(startX, y, tableW, tableH);

        setText(8.7, "bold", pdfColors.slateDark);
        pdf.text("Emosi", startX + 8, y + 8);
        pdf.text("Persentase", startX + 78, y + 8);
        pdf.text("Jumlah Deteksi", startX + tableW - 8, y + 8, {
          align: "right",
        });

        pdf.setDrawColor(...pdfColors.lightBorder);
        pdf.line(startX + 8, y + 11, startX + tableW - 8, y + 11);

        y += 17;

        emotionOrder.forEach((emotion) => {
          pdf.setFillColor(...(pdfColors[emotion] || pdfColors.slateMuted));
          pdf.circle(startX + 9, y - 2, 2, "F");

          setText(8.7, "normal", pdfColors.slateDark);
          pdf.text(emotion, startX + 15, y);

          setText(8.7, "bold", pdfColors.slateDark);
          pdf.text(`${percentages[emotion] || "0.0"}%`, startX + 78, y);
          pdf.text(`${counts[emotion] || 0}`, startX + tableW - 8, y, {
            align: "right",
          });

          y += rowH;
        });

        y += 6;
      };

      const drawTimelineTable = () => {
        addSectionTitle("Timeline Emosi Dominan per Menit");

        if (!timeline.length) {
          drawCard(marginX, y, contentWidth, 20, pdfColors.lightBg);
          setText(8.8, "normal", pdfColors.slateMuted);
          pdf.text("Belum ada timeline emosi yang tersedia.", marginX + 8, y + 12);
          y += 28;
          return;
        }

        const visibleTimeline = timeline.slice(0, 8);
        const rowH = 8.5;
        const tableH = 13 + visibleTimeline.length * rowH + 5;

        drawCard(marginX, y, contentWidth, tableH);

        setText(8.7, "bold", pdfColors.slateDark);
        pdf.text("Rentang Waktu", marginX + 8, y + 8);
        pdf.text("Emosi Dominan", marginX + 82, y + 8);

        pdf.setDrawColor(...pdfColors.lightBorder);
        pdf.line(marginX + 8, y + 11, pageWidth - marginX - 8, y + 11);

        y += 17;

        visibleTimeline.forEach((item) => {
          const color = pdfColors[item.emotion] || pdfColors.slateMuted;

          setText(8.7, "normal", pdfColors.slateDark);
          pdf.text(item.range || "-", marginX + 8, y);

          pdf.setFillColor(...color);
          pdf.circle(marginX + 84, y - 2, 2, "F");

          setText(8.7, "bold", pdfColors.slateDark);
          pdf.text(item.emotion || "-", marginX + 90, y);

          y += rowH;
        });

        y += 6;
      };

      const drawMoments = () => {
        addSectionTitle("Momen Penting Selama Sesi");

        if (!markers || markers.length === 0) {
          drawCard(marginX, y, contentWidth, 20, pdfColors.lightBg);
          setText(8.8, "normal", pdfColors.slateMuted);
          pdf.text(
            "Tidak ada momen khusus yang ditandai selama sesi.",
            marginX + 8,
            y + 12
          );
          y += 28;
          return;
        }

        markers.slice(0, 4).forEach((marker, index) => {
          const cardH = 28;
          drawCard(marginX, y, contentWidth, cardH, pdfColors.lightBg);

          setText(8.8, "bold", pdfColors.slateDark);
          pdf.text(
            `${index + 1}. ${marker.timeLabel || "-"} - ${marker.category || "Umum"}`,
            marginX + 8,
            y + 8
          );

          setText(8.5, "normal", pdfColors.slate);
          const note = marker.title || marker.note || "-";
          const lines = pdf.splitTextToSize(note, contentWidth - 16);
          pdf.text(lines.slice(0, 2), marginX + 8, y + 15);

          y += cardH + 4;
        });
      };

      const drawInterpretation = () => {
        addSectionTitle("Interpretasi Otomatis");

        const gap = 6;
        const topH = 28;
        const infoH = 34;
        const recH = 32;
        const colW = (contentWidth - gap) / 2;

        drawCard(marginX, y, contentWidth, topH, pdfColors.redSoft, pdfColors.redLine);

        setText(7.8, "bold", pdfColors.redText);
        pdf.text("Emosi Dominan", marginX + 8, y + 9);

        setText(15, "bold", pdfColors.redText);
        pdf.text(dominantEmotion, marginX + 8, y + 21);

        setText(15, "bold", pdfColors.redText);
        pdf.text(`${dominantPercent}%`, pageWidth - marginX - 8, y + 21, {
          align: "right",
        });

        y += topH + 8;

        drawCard(marginX, y, colW, infoH, pdfColors.blueSoft, pdfColors.blueLine);
        drawCard(marginX + colW + gap, y, colW, infoH, pdfColors.amberSoft, pdfColors.amberLine);

        setText(8.2, "bold", pdfColors.blueText);
        pdf.text("Interpretasi Sistem", marginX + 7, y + 8);

        setText(7.4, "normal", pdfColors.slateDark);
        const interpretationLines = pdf.splitTextToSize(
          data.interpretation || "-",
          colW - 14
        );
        pdf.text(interpretationLines.slice(0, 4), marginX + 7, y + 16);

        const recX = marginX + colW + gap;

        setText(8.2, "bold", pdfColors.amberText);
        pdf.text("Rekomendasi Awal", recX + 7, y + 8);

        setText(7.4, "normal", pdfColors.slateDark);
        const recommendationLines = pdf.splitTextToSize(
          data.recommendation || "-",
          colW - 14
        );
        pdf.text(recommendationLines.slice(0, 4), recX + 7, y + 16);

        y += Math.max(infoH, recH) + 10;
      };

      const drawNotes = () => {
        addSectionTitle("Catatan");

        drawCard(marginX, y, contentWidth, 24, pdfColors.violetSoft, pdfColors.violetLine);

        const noteText =
          "Laporan ini dihasilkan otomatis sebagai bahan pertimbangan awal konselor. Hasil sistem tidak menggantikan penilaian profesional.";

        setText(7.6, "normal", pdfColors.slateDark);
        const lines = pdf.splitTextToSize(noteText, contentWidth - 16);
        pdf.text(lines.slice(0, 2), marginX + 8, y + 10);

        y += 32;
      };

      // =========================
      // PAGE 1
      // =========================
      addHeader();

      addSectionTitle("Identitas Sesi Konseling");

      drawCard(marginX, y, contentWidth, 54);

      const rightX = marginX + contentWidth / 2 + 5;
      let leftY = y + 10;
      let rightY = y + 10;

      leftY += addKeyValue(
        "Nama Mahasiswa",
        sessionInfo.studentName,
        marginX + 8,
        leftY,
        38,
        48
      );
      leftY += addKeyValue("NIM", sessionInfo.nim, marginX + 8, leftY, 38, 48);
      leftY += addKeyValue(
        "Program Studi",
        sessionInfo.programStudy,
        marginX + 8,
        leftY,
        38,
        48
      );
      leftY += addKeyValue(
        "Konselor",
        sessionInfo.counselorName,
        marginX + 8,
        leftY,
        38,
        48
      );

      rightY += addKeyValue("Topik", sessionInfo.topic, rightX, rightY, 28, 55);
      rightY += addKeyValue(
        "Tanggal",
        sessionInfo.startDate,
        rightX,
        rightY,
        28,
        55
      );
      rightY += addKeyValue(
        "Waktu",
        cleanTimeForPdf(sessionInfo.startTime),
        rightX,
        rightY,
        28,
        55
      );
      rightY += addKeyValue("Durasi", duration, rightX, rightY, 28, 55);

      y += 64;

      addSectionTitle("Informasi Sistem");

      drawCard(marginX, y, contentWidth, 34);

      let sysY = y + 9;
      let sysRightY = y + 9;

      sysY += addKeyValue("ID Sesi", data.sessionId || data.id || "KS-20240512-001", marginX + 8, sysY, 34, 55);
      sysY += addKeyValue("Lokasi", "Ruang Konseling Unit BK PNL", marginX + 8, sysY, 34, 55);
      sysY += addKeyValue("Model AI", "LightExNet V2", marginX + 8, sysY, 34, 55);

      sysRightY += addKeyValue("Mode Deteksi", "Real-Time", rightX, sysRightY, 36, 45);
      sysRightY += addKeyValue("Total Deteksi", totalDetected, rightX, sysRightY, 36, 45);
      sysRightY += addKeyValue("Akurasi Model", "92.41%", rightX, sysRightY, 36, 45);

      y += 44;

      addSectionTitle("Ringkasan Emosi Selama Sesi");
      y = drawEmotionSummaryCards(marginX, y, contentWidth);

      drawEmotionBarChart();

      // =========================
      // PAGE 2
      // =========================
      pdf.addPage();
      y = 18;

      addHeader("ANALISIS EMOSI SESI", "Sebaran, distribusi, dan timeline emosi");

      drawScatterPlot();
      drawDistributionTable();
      drawTimelineTable();
      drawMoments();

      // =========================
      // PAGE 3
      // =========================
      pdf.addPage();
      y = 18;

      addHeader("INTERPRETASI DAN REKOMENDASI", "Analisis otomatis sistem");

      drawInterpretation();
      drawNotes();

      addFooter();

      pdf.save(`Laporan-Konseling-${safeName}.pdf`);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      alert("Gagal membuat PDF. Cek console browser untuk detail error.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AppLayout
      title="Laporan Hasil Konseling"
      subtitle="Dashboard > Laporan Konseling > Hasil Sesi"
      showSessionStatus={false}
      headerActions={
        <>
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm">
            <CalendarDays size={17} className="text-indigo-600" />
            {sessionInfo.startDate || "12 Mei 2024"}
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex h-11 items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 text-sm font-extrabold text-indigo-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={17} />
            {isDownloading ? "Membuat PDF..." : "Unduh PDF"}
          </button>
        </>
      }
    >
      <div ref={reportRef} className="space-y-5">
        <SessionIdentityCard sessionInfo={sessionInfo} duration={duration} />

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <EmotionSummaryCards
              counts={counts}
              percentages={percentages}
              emotionOrder={emotionOrder}
              emotionColors={emotionColors}
              dominantEmotion={data.dominantEmotion}
            />

            <ScatterReportCard
              scatterData={scatterData}
              scatterOptions={scatterOptions}
            />

            <EmotionTimelineCard timeline={timeline} chartPoints={chartPoints} />

            <ImportantMomentsCard markers={markers} />

            <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm font-medium text-violet-800">
              <Info size={18} className="shrink-0" />
              Laporan ini dihasilkan secara otomatis oleh sistem dan dapat
              digunakan sebagai bahan pertimbangan awal bagi konselor.
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5">
            <SessionInfoCard
              sessionInfo={sessionInfo}
              report={data}
              duration={duration}
              totalDetected={totalDetected}
            />

            <DistributionReportCard
              distributionData={distributionData}
              counts={counts}
              percentages={percentages}
              totalDetected={totalDetected}
              emotionOrder={emotionOrder}
              emotionColors={emotionColors}
            />

            <AutomaticInterpretationCard
              interpretation={data.interpretation}
              recommendation={data.recommendation}
              dominantEmotion={data.dominantEmotion}
            />
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}

function SessionIdentityCard({ sessionInfo, duration }) {
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
    <section className="grid overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <IdentityItem key={item.label} item={item} />
      ))}
    </section>
  );
}

function IdentityItem({ item }) {
  return (
    <div className="flex min-w-0 items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 md:border-r md:even:border-r-0 xl:border-b-0 xl:even:border-r xl:last:border-r-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
        {item.icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold leading-5 text-slate-500">
          {item.label}
        </p>

        <h4
          className="mt-1 line-clamp-1 text-sm font-extrabold leading-5 text-slate-950"
          title={item.value || "-"}
        >
          {item.value || "-"}
        </h4>

        <p
          className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500"
          title={item.subValue || "-"}
        >
          {item.subValue || "-"}
        </p>
      </div>
    </div>
  );
}

function EmotionSummaryCards({
  counts,
  percentages,
  emotionOrder,
  emotionColors,
  dominantEmotion,
}) {
  const dominantLabel = getDominantEmotionLabel(dominantEmotion);

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950">
            Ringkasan Emosi Selama Sesi
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Persentase dan jumlah deteksi dari seluruh frame sesi.
          </p>
        </div>

        <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700">
          Total ringkasan
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {emotionOrder.map((emotion) => {
          const isDominant = emotion === dominantLabel;
          const tone = getEmotionTone(emotion);

          return (
            <div
              key={emotion}
              className={[
                "rounded-2xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]",
                isDominant
                  ? `${tone.bg} ${tone.border} ring-4 ${tone.ring}`
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <img
                  src={getEmotionIcon(emotion)}
                  alt={emotion}
                  className="h-10 w-10 object-contain"
                />
              </div>

              <p
                className={[
                  "mt-3 text-xs font-extrabold",
                  isDominant ? tone.text : "text-slate-500",
                ].join(" ")}
              >
                {emotion}
              </p>

              <h4
                className={[
                  "mt-1 text-2xl font-black tracking-tight",
                  isDominant ? tone.text : "text-slate-950",
                ].join(" ")}
              >
                {percentages[emotion] || "0.0"}%
              </h4>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                {counts[emotion] || 0} deteksi
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScatterReportCard({ scatterData, scatterOptions }) {
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <h3 className="mb-4 text-lg font-extrabold text-slate-950">
        Grafik Sebaran Emosi Selama Sesi
      </h3>

      <div className="h-[330px]">
        <Scatter data={scatterData} options={scatterOptions} />
      </div>

      <div className="mt-4 flex gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm font-medium text-slate-600">
        <Info size={18} className="mt-0.5 shrink-0 text-violet-700" />
        <p>
          Setiap titik merepresentasikan hasil prediksi emosi pada interval
          waktu tertentu selama sesi berlangsung.
        </p>
      </div>
    </section>
  );
}

function SessionInfoCard({ sessionInfo, report, duration, totalDetected }) {
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <CalendarDays size={20} />
        </div>

        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950">
            Informasi Sesi
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Detail identitas dan metadata laporan.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <InfoRow label="ID Laporan" value={report.reportId || report.id || "-"} />
        <InfoRow label="ID Sesi" value={report.sessionId || sessionInfo.sessionId || sessionInfo.id || "-"} />
        <InfoRow label="Lokasi" value={sessionInfo.location || "Ruang Konseling Unit BK PNL"} />
        <InfoRow label="Konselor" value={sessionInfo.counselorName} />
        <InfoRow label="Durasi" value={duration} />
        <InfoRow label="Model AI" value={sessionInfo.modelName || "LightExNet V2"} />
        <InfoRow label="Mode Deteksi" value="Real-Time" badge />
        <InfoRow label="Total Deteksi" value={totalDetected} />
        <InfoRow label="Akurasi Model" value="92.41%" />
      </div>
    </section>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-2.5">
      <span className="font-bold text-slate-500">{label}</span>

      {badge ? (
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700 ring-1 ring-teal-100">
          {value}
        </span>
      ) : (
        <strong className="max-w-[210px] text-right font-extrabold leading-5 text-slate-800">
          {value || "-"}
        </strong>
      )}
    </div>
  );
}

function DistributionReportCard({
  distributionData,
  counts,
  percentages,
  totalDetected,
  emotionOrder,
  emotionColors,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-lg font-extrabold leading-tight text-slate-950">
        Distribusi Emosi Keseluruhan
      </h3>

      <div className="flex justify-center">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={
                  distributionData.length
                    ? distributionData
                    : [{ name: "Kosong", value: 1, color: "#e5e7eb" }]
                }
                innerRadius={54}
                outerRadius={78}
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
            <span className="text-xs font-bold text-slate-500">Total</span>
            <strong className="text-2xl font-extrabold leading-none text-slate-950">
              {totalDetected}
            </strong>
            <span className="mt-1 text-xs font-medium text-slate-500">
              Deteksi
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {emotionOrder.map((emotion) => {
          const percent = Number(percentages[emotion] || 0);

          return (
            <div
              key={emotion}
              className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5 transition hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                <img
                  src={getEmotionIcon(emotion)}
                  alt={emotion}
                  className="h-7 w-7 object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-700">
                  {emotion}
                </p>

                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full opacity-90"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: emotionColors[emotion],
                    }}
                  />
                </div>
              </div>

              <span className="whitespace-nowrap text-right text-sm font-extrabold text-slate-800">
                {percentages[emotion] || "0.0"}% ({counts[emotion] || 0})
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmotionTimelineCard({ timeline, chartPoints }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-extrabold text-slate-950">
        Timeline Emosi Dominan per Menit
      </h3>

      {chartPoints.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
          Belum ada timeline emosi yang tersedia.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-4 font-bold">Rentang Waktu</th>
                <th className="px-4 py-4 font-bold">Emosi Dominan</th>
                <th className="px-4 py-4 font-bold">Visual</th>
              </tr>
            </thead>

            <tbody>
              {timeline.map((item, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="px-4 py-3.5 font-medium text-slate-700">
                    {item.range}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-slate-900">
                    {item.emotion}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                      <img
                        src={getEmotionIcon(item.emotion)}
                        alt={item.emotion}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm font-medium text-slate-600">
        <Info size={18} className="mt-0.5 shrink-0 text-violet-700" />
        <p>
          Timeline menunjukkan emosi yang paling dominan pada setiap interval
          waktu satu menit.
        </p>
      </div>
    </section>
  );
}

function ImportantMomentsCard({ markers }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-extrabold text-slate-950">
        Momen Penting Selama Sesi
      </h3>

      {markers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
          Tidak ada momen khusus yang ditandai selama sesi.
        </div>
      ) : (
        <div className="space-y-3">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <strong className="text-sm text-slate-950">
                  {marker.timeLabel} - {marker.category}
                </strong>
              </div>

              <p className="mt-2 text-sm font-extrabold text-slate-800">
                {marker.title}
              </p>

              {marker.note && (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {marker.note}
                </p>
              )}

              {marker.analysis && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                  {marker.analysis}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AutomaticInterpretationCard({
  interpretation,
  recommendation,
  dominantEmotion,
}) {
  const dominantLabel = getDominantEmotionLabel(dominantEmotion);
  const tone = getEmotionTone(dominantLabel);

  return (
    <section className="rounded-[26px] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center gap-3 text-teal-800">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <h3 className="text-lg font-black tracking-tight">Interpretasi Otomatis</h3>
          <p className="text-sm font-semibold text-teal-700/80">
            Analisis awal berdasarkan distribusi emosi.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm font-semibold leading-6 text-slate-700">
        <div
          className={[
            "flex items-center gap-4 rounded-2xl border bg-white/80 p-4",
            tone.border,
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <img
              src={getEmotionIcon(dominantLabel)}
              alt={dominantLabel}
              className="h-11 w-11 object-contain"
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Emosi Dominan
            </p>
            <p className={["mt-1 text-xl font-black", tone.text].join(" ")}>
              {dominantEmotion || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <p className="font-extrabold text-slate-950">Interpretasi Sistem</p>
          <p className="mt-2 leading-7">{interpretation}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="font-extrabold text-slate-950">Rekomendasi Awal</p>
          <p className="mt-2 leading-7">{recommendation}</p>
        </div>
      </div>
    </section>
  );
}

function getInitial(name) {
  if (!name || name === "-") return "-";

  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function cleanTimeForPdf(time) {
  if (!time) return "-";

  const cleaned = String(time).replace(/\s*WIB\s*/gi, "").trim();

  if (!cleaned || cleaned === "-") return "-";

  return `${cleaned} WIB`;
}

function formatSecondToTime(second) {
  const hours = Math.floor(second / 3600);
  const minutes = Math.floor((second % 3600) / 60);
  const seconds = second % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function formatMinuteRange(start, end) {
  const startMinute = Math.floor(start / 60);
  const endMinute = Math.floor(end / 60);

  return `${startMinute}-${endMinute + 1} menit`;
}

function getEmotionTone(emotion) {
  const tones = {
    Senang: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      ring: "ring-emerald-100",
    },
    Sedih: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      ring: "ring-blue-100",
    },
    Marah: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      ring: "ring-rose-100",
    },
    Takut: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      ring: "ring-amber-100",
    },
    Netral: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-700",
      ring: "ring-slate-100",
    },
  };

  return tones[emotion] || tones.Netral;
}

function getDominantEmotionLabel(dominantEmotion) {
  if (!dominantEmotion || dominantEmotion === "-") return "-";
  return String(dominantEmotion).split(" dan ")[0];
}


export default SessionReportPage;