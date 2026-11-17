export const canPickPhoto = false;
export async function pickPhoto(): Promise<string | undefined> {
  throw new Error("nativePhotoLater");
}
export async function resolvePhoto(id: string) {
  return id;
}
export function releasePhoto(_uri: string) {}
