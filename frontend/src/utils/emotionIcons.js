export const EMOTION_ICON = {
  Senang: "/emotions/senang.svg",
  Sedih: "/emotions/sedih.svg",
  Marah: "/emotions/marah.svg",
  Takut: "/emotions/takut.svg",
  Netral: "/emotions/netral.svg",
};

export const normalizeEmotionName = (emotion) => {
  const value = String(emotion || "Netral").trim().toLowerCase();

  const map = {
    senang: "Senang",
    sedih: "Sedih",
    marah: "Marah",
    takut: "Takut",
    netral: "Netral",
  };

  return map[value] || "Netral";
};

export const getEmotionIcon = (emotion) => {
  const key = normalizeEmotionName(emotion);
  return EMOTION_ICON[key] || EMOTION_ICON.Netral;
};