const HEIC_EXTENSIONS = [".heic", ".heif"];

export const IMAGE_FILE_ACCEPT = "image/*,.heic,.heif";

const getExtension = (fileName: string) => {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart >= 0
    ? fileName.slice(extensionStart).toLowerCase()
    : "";
};

export const isImageFile = (file: File) =>
  file.type.startsWith("image/") ||
  HEIC_EXTENSIONS.includes(getExtension(file.name));

const isHeicFile = (file: File) => {
  const mimeType = file.type.toLowerCase();
  return (
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    HEIC_EXTENSIONS.includes(getExtension(file.name))
  );
};

const replaceExtension = (fileName: string, extension: string) => {
  const extensionStart = fileName.lastIndexOf(".");
  const baseName =
    extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
  return `${baseName}${extension}`;
};

const convertHeicToJpeg = async (file: File) => {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  const jpegBlob = Array.isArray(result) ? result[0] : result;

  if (!jpegBlob) {
    throw new Error(`Unable to convert ${file.name}`);
  }

  return new File([jpegBlob], replaceExtension(file.name, ".jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
};

export const prepareImageFiles = async (files: File[]) => {
  const supportedFiles = files.filter(isImageFile);
  return Promise.all(
    supportedFiles.map((file) =>
      isHeicFile(file) ? convertHeicToJpeg(file) : file,
    ),
  );
};
