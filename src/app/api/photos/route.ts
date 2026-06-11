import { del, put } from "@vercel/blob";
import {
  createPhoto,
  deletePhotoRecord,
  getPhotoById,
  getPhotos,
  updatePhotoStatus,
  verifyAdminPassword,
  verifyPhotoUploadPassword,
  type PhotoStatus,
} from "@/src/lib/photos-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "1";

    if (isAdmin && !verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json({ error: "Clave de administrador incorrecta." }, { status: 401 });
    }

    return Response.json({ photos: await getPhotos({ includeAll: isAdmin }) });
  } catch (error) {
    logPhotoError("GET", error);

    return Response.json(
      { error: readableError(error, "No se pudieron cargar las fotos."), debug: debugError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyPhotoUploadPassword(request.headers.get("x-photo-upload-password"))) {
      return Response.json({ error: "Clave para subir fotos incorrecta." }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { error: "Falta configurar BLOB_READ_WRITE_TOKEN para guardar las imágenes." },
        { status: 400 }
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (error) {
      logPhotoError("FORM_DATA", error);
      return Response.json(
        { error: "No se pudo leer el formulario. Volvé a intentar con otra imagen." },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("files")
      .filter(isFileEntry);

    if (files.length === 0) {
      return Response.json({ error: "Seleccioná al menos una imagen." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return Response.json({ error: `Subí como máximo ${MAX_FILES} imágenes por vez.` }, { status: 400 });
    }

    const school = cleanText(formData.get("school"), 80);
    const category = cleanText(formData.get("category"), 80);
    const caption = cleanText(formData.get("caption"), 160);
    const uploadedBy = cleanText(formData.get("uploadedBy"), 80);

    const created = [];

    for (const file of files) {
      const fileType = String(file.type || "").toLowerCase();
      const fileName = String(file.name || "foto");
      const lowerName = fileName.toLowerCase();

      if (HEIC_TYPES.has(fileType) || lowerName.endsWith(".heic") || lowerName.endsWith(".heif")) {
        return Response.json(
          { error: "Esa foto está en formato HEIC/HEIF. Enviála como JPG, PNG o WEBP para que se vea bien en la web." },
          { status: 400 }
        );
      }

      const allowedByExtension = [".jpg", ".jpeg", ".png", ".webp"].some((extension) =>
        lowerName.endsWith(extension)
      );

      if (!ALLOWED_TYPES.has(fileType) && !allowedByExtension) {
        return Response.json(
          { error: "Solo se permiten imágenes JPG, PNG o WEBP." },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE_BYTES) {
        return Response.json(
          { error: "Cada imagen puede pesar como máximo 5 MB." },
          { status: 400 }
        );
      }

      const extension = extensionFromFile(fileType, lowerName);
      const safeName = fileName.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
      const pathname = `copa-apdes/fotos/${Date.now()}-${safeName || `foto.${extension}`}`;

      let blob;
      try {
        blob = await put(pathname, file, {
          access: "public",
          addRandomSuffix: true,
        });
      } catch (error) {
        logPhotoError("BLOB_PUT", error);
        return Response.json(
          { error: readableError(error, "No se pudo guardar la imagen en Vercel Blob."), debug: debugError(error) },
          { status: 400 }
        );
      }

      try {
        const photo = await createPhoto({
          url: blob.url,
          pathname: blob.pathname,
          caption,
          school,
          category,
          uploadedBy,
        });

        created.push(photo);
      } catch (error) {
        logPhotoError("NEON_CREATE_PHOTO", error);

        // Si falló Neon después de subir a Blob, intentamos borrar el archivo para no dejar basura.
        try {
          await del(blob.pathname || blob.url);
        } catch (cleanupError) {
          logPhotoError("BLOB_CLEANUP", cleanupError);
        }

        return Response.json(
          { error: readableError(error, "La imagen se subió, pero no se pudo guardar el registro en Neon."), debug: debugError(error) },
          { status: 400 }
        );
      }
    }

    return Response.json({ photos: created });
  } catch (error) {
    logPhotoError("POST", error);

    return Response.json(
      { error: readableError(error, "No se pudieron subir las fotos."), debug: debugError(error) },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json({ error: "Clave de administrador incorrecta." }, { status: 401 });
    }

    const body = (await request.json()) as { id?: number; status?: PhotoStatus };

    if (!body.id || !Number.isInteger(body.id)) {
      return Response.json({ error: "Foto inválida." }, { status: 400 });
    }

    if (!body.status || !["pending", "approved", "rejected"].includes(body.status)) {
      return Response.json({ error: "Estado inválido." }, { status: 400 });
    }

    const photo = await updatePhotoStatus(body.id, body.status);
    return Response.json({ photo });
  } catch (error) {
    logPhotoError("PATCH", error);

    return Response.json(
      { error: readableError(error, "No se pudo actualizar la foto."), debug: debugError(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json({ error: "Clave de administrador incorrecta." }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Foto inválida." }, { status: 400 });
    }

    const photo = await getPhotoById(id);

    if (!photo) {
      return Response.json({ error: "La foto no existe." }, { status: 404 });
    }

    await del(photo.pathname || photo.url);
    await deletePhotoRecord(id);

    return Response.json({ ok: true });
  } catch (error) {
    logPhotoError("DELETE", error);

    return Response.json(
      { error: readableError(error, "No se pudo eliminar la foto."), debug: debugError(error) },
      { status: 400 }
    );
  }
}

function isFileEntry(item: FormDataEntryValue): item is File {
  return (
    typeof item === "object" &&
    item !== null &&
    "size" in item &&
    "type" in item &&
    "name" in item
  );
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function extensionFromFile(type: string, fileName: string) {
  if (type === "image/png" || fileName.endsWith(".png")) return "png";
  if (type === "image/webp" || fileName.endsWith(".webp")) return "webp";
  return "jpg";
}

function logPhotoError(scope: string, error: unknown) {
  console.error(`[api/photos:${scope}]`, error);
}

function debugError(error: unknown) {
  if (process.env.NODE_ENV === "production") return undefined;

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function readableError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  const message = error.message;
  const normalized = message.toLowerCase();

  const publicMessages = [
    "Falta configurar DATABASE_URL.",
    "Falta configurar ADMIN_PASSWORD.",
    "Falta configurar PHOTO_UPLOAD_PASSWORD.",
    "Falta configurar BLOB_READ_WRITE_TOKEN para guardar las imágenes.",
    "La foto no existe.",
  ];

  if (publicMessages.includes(message)) return message;

  if (
    normalized.includes("blob") ||
    normalized.includes("token") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("invalid") && normalized.includes("access")
  ) {
    return "No se pudo guardar la imagen en Vercel Blob. Revisá que BLOB_READ_WRITE_TOKEN exista en .env.local y en Vercel.";
  }

  if (
    normalized.includes("copa_photos") ||
    normalized.includes("relation") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema") ||
    normalized.includes("column")
  ) {
    return "Falta crear o actualizar la tabla copa_photos en Neon. Ejecutá database/photos.sql.";
  }

  if (
    normalized.includes("database_url") ||
    normalized.includes("connection") ||
    normalized.includes("neon") ||
    normalized.includes("fetch failed")
  ) {
    return "No se pudo conectar con Neon. Revisá DATABASE_URL.";
  }

  if (normalized.includes("payload") || normalized.includes("body") || normalized.includes("size")) {
    return "La imagen es demasiado grande. Probá con una imagen de menos de 5 MB.";
  }

  return fallback;
}
