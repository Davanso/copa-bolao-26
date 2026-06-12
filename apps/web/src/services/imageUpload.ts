const MAX_UPLOAD_FILE_BYTES = 20_000_000;
const MAX_IMAGE_DIMENSION = 720;
const TARGET_IMAGE_BYTES = 380_000;
const MIN_QUALITY = 0.5;
const DEFAULT_QUALITY = 0.82;

export class ImageUploadError extends Error {}

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("Escolha um arquivo de imagem.");
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new ImageUploadError("Use uma imagem de até 20 MB.");
  }
}

export async function compressImageToDataUrl(file: File) {
  validateImageFile(file);

  const image = await loadImage(file);
  const { height, width } = fitWithinBounds(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new ImageUploadError("Não foi possível preparar a imagem.");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = DEFAULT_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_IMAGE_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  return blobToDataUrl(blob);
}

function fitWithinBounds(width: number, height: number) {
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageUploadError("Não foi possível ler a imagem."));
    };
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageUploadError("Não foi possível comprimir a imagem."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new ImageUploadError("Não foi possível finalizar a imagem."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(blob);
  });
}
