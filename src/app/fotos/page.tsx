"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, Heart, Image as ImageIcon, RefreshCw, UploadCloud } from "lucide-react";

type PhotoItem = {
  id: number;
  url: string;
  caption: string;
  school: string;
  category: string;
  uploadedBy: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export default function FotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("todos");

  const loadPhotos = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/photos", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las fotos.");

      setPhotos(data.photos ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las fotos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPhotos();
  }, []);

  const schools = useMemo(() => {
    return Array.from(new Set(photos.map((photo) => photo.school).filter(Boolean))).sort();
  }, [photos]);

  const visiblePhotos = useMemo(() => {
    if (schoolFilter === "todos") return photos;
    return photos.filter((photo) => photo.school === schoolFilter);
  }, [photos, schoolFilter]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-14">
        <header className="mb-8 rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_24px_70px_rgba(21,23,17,0.18)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
                Momentos positivos
              </p>

              <h1 className="max-w-4xl text-[2.8rem] font-black leading-[0.92] tracking-[-0.08em] md:text-7xl">
                Momentos de la Copa
              </h1>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/65">
                Una galería para compartir fotos lindas del torneo, el espíritu de equipo y la alegría de cada jornada.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/fotos/subir"
                className="inline-flex items-center gap-2 rounded-full bg-[#d7c77a] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#151711] transition hover:scale-[1.02]"
              >
                <UploadCloud className="h-4 w-4" />
                Subir fotos
              </Link>

              <button
                onClick={() => void loadPhotos()}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {schools.length > 0 && (
          <section className="mb-6 rounded-[28px] border border-[#ded9cc] bg-white/80 p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#74786a]">
              Filtrar por colegio
            </p>

            <div className="flex flex-wrap gap-2">
              <FilterButton active={schoolFilter === "todos"} label="Todos" onClick={() => setSchoolFilter("todos")} />
              {schools.map((school) => (
                <FilterButton key={school} active={schoolFilter === school} label={school} onClick={() => setSchoolFilter(school)} />
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <EmptyState icon={ImageIcon} title="Cargando fotos" text="Estamos trayendo los momentos aprobados." />
        ) : error ? (
          <EmptyState icon={Camera} title="No se pudo cargar" text={error} />
        ) : visiblePhotos.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Todavía no hay fotos aprobadas"
            text="Cuando la organización apruebe las imágenes subidas, van a aparecer acá."
          />
        ) : (
          <section className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {visiblePhotos.map((photo, index) => (
              <article
                key={photo.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-[30px] border border-[#ded9cc] bg-white/85 shadow-sm"
              >
                <div className="relative bg-[#151711]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto de ${photo.school || "la Copa APDES"}`}
                    className="h-auto w-full object-cover"
                    loading={index < 6 ? "eager" : "lazy"}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
                </div>

                <div className="p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {photo.school && <Tag>{photo.school}</Tag>}
                    {photo.category && <Tag>{photo.category}</Tag>}
                  </div>

                  <p className="text-sm font-bold leading-6 text-[#151711]">
                    {photo.caption || "Un momento compartido de la Copa APDES."}
                  </p>

                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
                    Espíritu APDES
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
        active ? "bg-[#151711] text-white" : "border border-[#ded9cc] bg-[#fbfaf6] text-[#74786a] hover:text-[#151711]"
      }`}
    >
      {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f0ede3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#74786a]">
      {children}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Camera;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-[34px] border border-dashed border-[#ded9cc] bg-white/75 p-10 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-[#b7b0a0]" />
      <h2 className="text-2xl font-black tracking-[-0.05em] text-[#151711]">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[#74786a]">{text}</p>
    </section>
  );
}
