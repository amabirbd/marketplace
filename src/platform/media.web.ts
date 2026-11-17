import { readValue, writeValue } from "./storage.web";
export async function pickPhoto(): Promise<string | undefined> {
  const file = await new Promise<File | undefined>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = () => resolve(input.files?.[0]);
    input.oncancel = () => resolve(undefined);
    input.click();
  });
  if (!file) return;
  if (
    file.size > 10 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("photoTypeError");
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("photoTypeError"))),
      "image/jpeg",
      0.82,
    ),
  );
  const id = `media:${crypto.randomUUID()}`;
  await writeValue(id, blob);
  return id;
}
export async function resolvePhoto(id: string) {
  const blob = await readValue<Blob>(id);
  if (!blob) throw new Error("photoUnavailable");
  return URL.createObjectURL(blob);
}
export function releasePhoto(uri: string) {
  URL.revokeObjectURL(uri);
}
export const canPickPhoto = true;
