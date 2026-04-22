export class ImageKitService {
  async uploadImage(): Promise<never> {
    throw new Error("ImageKit is not configured");
  }

  async deleteFile(): Promise<never> {
    throw new Error("ImageKit is not configured");
  }
}

export const imagekitService = new ImageKitService();
