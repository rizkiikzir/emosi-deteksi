export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  if (!file) return "File tidak ditemukan.";

  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return "Format foto harus JPG, PNG, atau WEBP.";
  }

  const maxSize = 2 * 1024 * 1024;

  if (file.size > maxSize) {
    return "Ukuran foto maksimal 2MB.";
  }

  return "";
}