"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Image as ImageIcon, KeyRound, RefreshCw, Trash2, XCircle } from "lucide-react";

type PhotoStatus = "pending" | "approved" | "rejected";

type PhotoItem = {
  id: number;
  url: string;
  caption: string;
  school: string;
  category: string;
  uploadedBy: string;
  status: PhotoStatus;
  createdAt: string;
};

type StatusFilter = "all" | PhotoStatus;

export default function AdminFotosPage() {
  const [password, setPassword] = useState("");
  const [adminReady, setAdminReady] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("copa-admin-password");
    if (saved) {
      setPassword(saved);
      setAdminReady(true);
      void loadPhotos(saved);
    }
  }, []);

  const visiblePhotos = useMemo(() => {
    if (statusFilter === "all") return photos;
    return photos.filter((photo) => photo.status === statusFilter);
  }, [photos, statusFilter]);

  const counters = useMemo(() => {
    return {
      pending: photos.filter((photo) => photo.status === "pending").length,
      approved: photos.filter((photo) => photo.status === "approved").length,
      rejected: photos.filter((photo) => photo.status === "rejected").length,
    };
  }, [photos]);

  const loadPhotos = async (adminPassword = password) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/photos?admin=1", {
        headers: { "x-admin-password": adminPassword },
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las fotos.");

      setPhotos(data.photos ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las fotos.");
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sessionStorage.setItem("copa-admin-password", password);
    setAdminReady(true);
    await loadPhotos(password);
  };

  const updateStatus = async (id: number, status: PhotoStatus) => {
    setBusyId(id);
    setError("");

    try {
      const response = await fetch("/api/photos", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la foto.");

      setPhotos((current) => current.map((photo) => (photo.id === id ? data.photo : photo)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "No se pudo actualizar la foto.");
    } finally {
      setBusyId(null);
    }
  };

  const deletePhoto = async (id: number) => {
    if (!confirm("¿Eliminar esta foto definitivamente?")) return;

    setBusyId(id);
    setError("");

    try {
      const response = await fetch(`/api/photos?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la foto.");

      setPhotos((current) => current.filter((photo) => photo.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la foto.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-14">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#74786a]">Administración</p>
            <h1 className="text-[2.4rem] font-black leading-[0.92] tracking-[-0.075em] md:text-6xl">
              Fotos de la Copa
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#62675d]">
              Aprobá, ocultá o eliminá las fotos que suban las profesoras. Solo las aprobadas aparecen en la galería pública.
            </p>
          </div>

          {adminReady && (
            <button
              onClick={() => void loadPhotos()}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded9cc] bg-white/80 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#74786a] hover:text-[#151711]"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          )}
        </header>

        {!adminReady ? (
          <form onSubmit={authenticate} className="max-w-md rounded-[30px] border border-[#ded9cc] bg-white/85 p-5 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151711] text-[#d7c77a]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-[-0.05em]">Entrar a fotos</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#74786a]">Usá la misma contraseña del panel de administración.</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-5 w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
              placeholder="Contraseña admin"
              required
            />
            {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button className="mt-4 w-full rounded-2xl bg-[#151711] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white">
              Entrar
            </button>
          </form>
        ) : (
          <>
            <section className="mb-5 grid gap-3 sm:grid-cols-3">
              <Counter label="Pendientes" value={counters.pending} tone="pending" />
              <Counter label="Aprobadas" value={counters.approved} tone="approved" />
              <Counter label="Ocultas" value={counters.rejected} tone="rejected" />
            </section>

            <section className="mb-5 rounded-[28px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <Filter active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} label="Pendientes" />
                <Filter active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")} label="Aprobadas" />
                <Filter active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")} label="Ocultas" />
                <Filter active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="Todas" />
              </div>
            </section>

            {error && <p className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}

            {loading ? (
              <Empty title="Cargando fotos" text="Un segundo..." />
            ) : visiblePhotos.length === 0 ? (
              <Empty title="No hay fotos en este filtro" text="Cuando suban imágenes, van a aparecer acá." />
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePhotos.map((photo) => (
                  <article key={photo.id} className="overflow-hidden rounded-[28px] border border-[#ded9cc] bg-white/85 shadow-sm">
                    <div className="relative h-64 bg-[#151711]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption || "Foto Copa APDES"} className="h-full w-full object-cover" />
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${statusClass(photo.status)}`}>
                        {statusLabel(photo.status)}
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {photo.school && <Tag>{photo.school}</Tag>}
                        {photo.category && <Tag>{photo.category}</Tag>}
                        {photo.uploadedBy && <Tag>{photo.uploadedBy}</Tag>}
                      </div>

                      <p className="min-h-12 text-sm font-bold leading-6 text-[#151711]">
                        {photo.caption || "Sin mensaje."}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          disabled={busyId === photo.id}
                          onClick={() => updateStatus(photo.id, "approved")}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar
                        </button>

                        <button
                          disabled={busyId === photo.id}
                          onClick={() => updateStatus(photo.id, "rejected")}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151711] px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
                          Ocultar
                        </button>

                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#74786a] hover:text-[#151711]"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </a>

                        <button
                          disabled={busyId === photo.id}
                          onClick={() => void deletePhoto(photo.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-700 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          Borrar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: "pending" | "approved" | "rejected" }) {
  return (
    <article className="rounded-[24px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#74786a]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#151711]">{value}</p>
      <span className={`mt-3 inline-flex h-2 w-full rounded-full ${tone === "approved" ? "bg-emerald-500" : tone === "pending" ? "bg-[#d7c77a]" : "bg-[#151711]"}`} />
    </article>
  );
}

function Filter({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${active ? "bg-[#151711] text-white" : "border border-[#ded9cc] bg-[#fbfaf6] text-[#74786a] hover:text-[#151711]"}`}
    >
      {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#f0ede3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">{children}</span>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-[30px] border border-dashed border-[#ded9cc] bg-white/75 p-10 text-center">
      <ImageIcon className="mx-auto mb-4 h-10 w-10 text-[#b7b0a0]" />
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold text-[#74786a]">{text}</p>
    </section>
  );
}

function statusLabel(status: PhotoStatus) {
  if (status === "approved") return "Aprobada";
  if (status === "rejected") return "Oculta";
  return "Pendiente";
}

function statusClass(status: PhotoStatus) {
  if (status === "approved") return "bg-emerald-600 text-white";
  if (status === "rejected") return "bg-[#151711] text-white";
  return "bg-[#d7c77a] text-[#151711]";
}
