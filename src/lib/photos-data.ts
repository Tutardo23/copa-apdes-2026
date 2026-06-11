import { neon } from "@neondatabase/serverless";

export type PhotoStatus = "pending" | "approved" | "rejected";

export type CopaPhoto = {
  id: number;
  url: string;
  pathname: string;
  caption: string;
  school: string;
  category: string;
  uploadedBy: string;
  status: PhotoStatus;
  createdAt: string;
};

type PhotoRow = {
  id: number | string;
  url: string;
  pathname: string;
  caption: string | null;
  school: string | null;
  category: string | null;
  uploaded_by: string | null;
  status: PhotoStatus;
  created_at: string | Date;
};

type CreatePhotoInput = {
  url: string;
  pathname: string;
  caption: string;
  school: string;
  category: string;
  uploadedBy: string;
};

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta configurar DATABASE_URL.");
  }

  return neon(process.env.DATABASE_URL);
}

export function verifyAdminPassword(value: string | null) {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("Falta configurar ADMIN_PASSWORD.");
  }

  return value === process.env.ADMIN_PASSWORD;
}

export function verifyPhotoUploadPassword(value: string | null) {
  if (!process.env.PHOTO_UPLOAD_PASSWORD) {
    throw new Error("Falta configurar PHOTO_UPLOAD_PASSWORD.");
  }

  return value === process.env.PHOTO_UPLOAD_PASSWORD;
}

export async function getPhotos({ includeAll = false }: { includeAll?: boolean } = {}) {
  const sql = getSql();

  if (includeAll) {
    const rows = (await sql`
      SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
      FROM copa_photos
      ORDER BY created_at DESC
    `) as unknown as PhotoRow[];

    return rows.map(mapPhotoRow);
  }

  const rows = (await sql`
    SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
    FROM copa_photos
    WHERE status = 'approved'
    ORDER BY created_at DESC
  `) as unknown as PhotoRow[];

  return rows.map(mapPhotoRow);
}

export async function getPhotoById(id: number) {
  const sql = getSql();

  const rows = (await sql`
    SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
    FROM copa_photos
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as PhotoRow[];

  return rows[0] ? mapPhotoRow(rows[0]) : null;
}

export async function createPhoto(input: CreatePhotoInput) {
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO copa_photos (url, pathname, caption, school, category, uploaded_by, status)
    VALUES (
      ${input.url},
      ${input.pathname},
      ${input.caption},
      ${input.school},
      ${input.category},
      ${input.uploadedBy},
      'pending'
    )
    RETURNING id, url, pathname, caption, school, category, uploaded_by, status, created_at
  `) as unknown as PhotoRow[];

  if (!rows[0]) {
    throw new Error("No se pudo guardar la foto.");
  }

  return mapPhotoRow(rows[0]);
}

export async function updatePhotoStatus(id: number, status: PhotoStatus) {
  const sql = getSql();

  const rows = (await sql`
    UPDATE copa_photos
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, url, pathname, caption, school, category, uploaded_by, status, created_at
  `) as unknown as PhotoRow[];

  if (!rows[0]) {
    throw new Error("La foto no existe.");
  }

  return mapPhotoRow(rows[0]);
}

export async function deletePhotoRecord(id: number) {
  const sql = getSql();

  await sql`
    DELETE FROM copa_photos
    WHERE id = ${id}
  `;
}

function mapPhotoRow(row: PhotoRow): CopaPhoto {
  return {
    id: Number(row.id),
    url: row.url,
    pathname: row.pathname,
    caption: row.caption ?? "",
    school: row.school ?? "",
    category: row.category ?? "",
    uploadedBy: row.uploaded_by ?? "",
    status: row.status,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}
