import { Readable } from 'stream';

export interface IStorageService {
  /**
   * Generates a pre-signed URL for uploading a file directly to storage.
   * @param key The key (path) where the file will be stored.
   * @param contentType The content type of the file.
   * @param expiresIn Expiration time in seconds.
   */
  getPresignedUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<string>;

  /**
   * Uploads a file to storage.
   * @param key The key (path) where the file will be stored.
   * @param file The file content as a Buffer or Readable stream.
   * @param contentType The content type of the file.
   * @param cacheControl Optional Cache-Control header value.
   */
  upload(
    key: string,
    file: Buffer | Readable,
    contentType: string,
    cacheControl?: string,
  ): Promise<string>;

  /**
   * Downloads a file from storage.
   * @param key The key (path) of the file to download.
   */
  download(key: string): Promise<Readable>;
}
