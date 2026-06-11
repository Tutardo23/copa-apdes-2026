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

const MAX_FILES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "1";

    if (isAdmin && !verifyAdminPassword(request.headers.get("x-admin-password"))) {
      return Response.json({ error: "Clave de administrador incorrecta." }, { status: 401 });
    }

    return Response.json({ photos: await getPhotos({ includeAll: isAdmin }) });
  } catch (error) {
    return Response.json(
      { error: readableError(error, "No se pudieron cargar las fotos.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyPhotoUploadPassword(request.headers.get("x-photo-upload-password"))) {
      return Response.json({ error: "Clave para subir fotos incorrecta." }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);

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
      if (!ALLOWED_TYPES.has(file.type)) {
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

      const extension = extensionFromType(file.type);
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
      const pathname = `copa-apdes/fotos/${Date.now()}-${safeName || `foto.${extension}`}`;

      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: true,
      });

      const photo = await createPhoto({
        url: blob.url,
        pathname: blob.pathname,
        caption,
        school,
        category,
        uploadedBy,
      });

      created.push(photo);
    }

    return Response.json({ photos: created });
  } catch (error) {
    return Response.json(
      { error: readableError(error, "No se pudieron subir las fotos.") },
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
    return Response.json(
      { error: readableError(error, "No se pudo actualizar la foto.") },
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

    await del(photo.url);
    await deletePhotoRecord(id);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: readableError(error, "No se pudo eliminar la foto.") },
      { status: 400 }
    );
  }
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function readableError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  const publicMessages = [
    "Falta configurar DATABASE_URL.",
    "Falta configurar ADMIN_PASSWORD.",
    "Falta configurar PHOTO_UPLOAD_PASSWORD.",
    "La foto no existe.",
  ];

  return publicMessages.includes(error.message) ? error.message : fallback;
}
