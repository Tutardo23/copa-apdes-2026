import "server-only";

import { neon } from "@neondatabase/serverless";

export type PhotoStatus = "pending" | "approved" | "rejected";

export type PhotoItem = {
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
  id: number;
  url: string;
  pathname: string;
  caption: string | null;
  school: string | null;
  category: string | null;
  uploaded_by: string | null;
  status: PhotoStatus;
  created_at: string;
};

function database() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta configurar DATABASE_URL.");
  }

  return neon(connectionString);
}

function mapPhoto(row: PhotoRow): PhotoItem {
  return {
    id: Number(row.id),
    url: row.url,
    pathname: row.pathname,
    caption: row.caption ?? "",
    school: row.school ?? "",
    category: row.category ?? "",
    uploadedBy: row.uploaded_by ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

export function verifyPhotoUploadPassword(value: string | null) {
  const expected = process.env.PHOTO_UPLOAD_PASSWORD;

  if (!expected) {
    throw new Error("Falta configurar PHOTO_UPLOAD_PASSWORD.");
  }

  return value === expected;
}

export function verifyAdminPassword(value: string | null) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    throw new Error("Falta configurar ADMIN_PASSWORD.");
  }

  return value === expected;
}

export async function getPhotos({ includeAll = false }: { includeAll?: boolean } = {}) {
  const sql = database();

  if (includeAll) {
    const rows = await sql<PhotoRow[]>`
      SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
      FROM copa_photos
      ORDER BY created_at DESC
    `;

    return rows.map(mapPhoto);
  }

  const rows = await sql<PhotoRow[]>`
    SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
    FROM copa_photos
    WHERE status = 'approved'
    ORDER BY created_at DESC
  `;

  return rows.map(mapPhoto);
}

export async function createPhoto(input: {
  url: string;
  pathname: string;
  caption: string;
  school: string;
  category: string;
  uploadedBy: string;
}) {
  const sql = database();

  const rows = await sql<PhotoRow[]>`
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
  `;

  return mapPhoto(rows[0]);
}

export async function updatePhotoStatus(id: number, status: PhotoStatus) {
  const sql = database();

  const rows = await sql<PhotoRow[]>`
    UPDATE copa_photos
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, url, pathname, caption, school, category, uploaded_by, status, created_at
  `;

  if (!rows[0]) throw new Error("La foto no existe.");

  return mapPhoto(rows[0]);
}

export async function getPhotoById(id: number) {
  const sql = database();

  const rows = await sql<PhotoRow[]>`
    SELECT id, url, pathname, caption, school, category, uploaded_by, status, created_at
    FROM copa_photos
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ? mapPhoto(rows[0]) : null;
}

export async function deletePhotoRecord(id: number) {
  const sql = database();

  await sql`
    DELETE FROM copa_photos
    WHERE id = ${id}
  `;
}
