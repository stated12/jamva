import { db, BUCKET } from "./db";
import { supabaseUrl } from "./env";
const IMG = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Image upload (max 3 MB; serverless request limit is 4 MB). Returns the public URL or null. */
export async function uploadImage(file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!file || typeof file === "string" || !(file as File).size) return null; const f = file as File;
  if (!IMG.includes(f.type) || f.size > 3 * 1024 * 1024) return null;
  const ext = f.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db().storage.from(BUCKET).upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: false });
  return error ? null : `${supabaseUrl()}/storage/v1/object/public/${BUCKET}/${path}`;
}
