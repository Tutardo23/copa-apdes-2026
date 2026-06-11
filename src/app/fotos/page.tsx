"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Heart, RefreshCw, Sparkles, type LucideIcon } from "lucide-react";

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

  const featured = visiblePhotos[0] ?? null;
  const rest = featured ? visiblePhotos.slice(1) : visiblePhotos;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-14">
        <header className="mb-7 overflow-hidden rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_24px_70px_rgba(21,23,17,0.18)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
                Momentos positivos
              </p>

              <h1 className="max-w-4xl text-[2.7rem] font-black leading-[0.92] tracking-[-0.08em] md:text-7xl">
                Momentos de la Copa
              </h1>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/65">
                Una galería con fotos aprobadas por la organización para compartir el espíritu de equipo, la alegría y los mejores momentos de la jornada.
              </p>
            </div>

            <button
              onClick={() => void loadPhotos()}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </header>

        <section className="mb-7 rounded-[28px] border border-[#ded9cc] bg-white/75 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#74786a]">
                Galería pública
              </p>
              <p className="mt-1 text-sm font-bold text-[#62675d]">
                Solo aparecen las fotos aprobadas por administración.
              </p>
            </div>

            {schools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <FilterButton active={schoolFilter === "todos"} label="Todos" onClick={() => setSchoolFilter("todos")} />
                {schools.map((school) => (
                  <FilterButton key={school} active={schoolFilter === school} label={school} onClick={() => setSchoolFilter(school)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {error && (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <EmptyState icon={RefreshCw} title="Cargando fotos" text="Estamos buscando los momentos aprobados." />
        ) : visiblePhotos.length === 0 ? (
          <EmptyState icon={Camera} title="Todavía no hay fotos aprobadas" text="Cuando la organización apruebe imágenes, van a aparecer acá." />
        ) : (
          <section className="space-y-5">
            {featured && <FeaturedPhoto photo={featured} />}

            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function FeaturedPhoto({ photo }: { photo: PhotoItem }) {
  return (
    <article className="grid overflow-hidden rounded-[34px] border border-[#ded9cc] bg-white shadow-sm lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative min-h-[280px] overflow-hidden bg-[#151711] md:min-h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption || "Foto de la Copa"} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#151711]">
          Foto destacada
        </div>
      </div>

      <div className="flex flex-col justify-between p-5 md:p-7">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f5edc9] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6f6125]">
            <Sparkles className="h-4 w-4" />
            Momento APDES
          </div>

          <h2 className="text-3xl font-black leading-[0.95] tracking-[-0.06em] text-[#151711] md:text-5xl">
            {photo.caption || "Un gran momento de la Copa"}
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {photo.school && <Tag>{photo.school}</Tag>}
            {photo.category && <Tag>{photo.category}</Tag>}
          </div>
        </div>

        <p className="mt-8 text-sm font-semibold leading-6 text-[#74786a]">
          Compartido para celebrar la alegría, el compañerismo y el espíritu deportivo de la jornada.
        </p>
      </div>
    </article>
  );
}

function PhotoCard({ photo }: { photo: PhotoItem }) {
  return (
    <article className="group overflow-hidden rounded-[30px] border border-[#ded9cc] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(21,23,17,0.10)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#151711]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption || "Foto de la Copa"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          {photo.school && <DarkTag>{photo.school}</DarkTag>}
          {photo.category && <DarkTag>{photo.category}</DarkTag>}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 text-[#d7c77a]">
          <Heart className="h-4 w-4 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#74786a]">
            Momento positivo
          </span>
        </div>

        <h3 className="text-lg font-black leading-tight tracking-[-0.04em] text-[#151711]">
          {photo.caption || "Foto de la Copa"}
        </h3>

        {photo.uploadedBy && (
          <p className="mt-3 text-xs font-bold text-[#74786a]">
            Compartida por {photo.uploadedBy}
          </p>
        )}
      </div>
    </article>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active ? "bg-[#151711] text-white" : "border border-[#ded9cc] bg-[#fbfaf6] text-[#74786a] hover:text-[#151711]"
      }`}
    >
      {label}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#ded9cc] bg-[#fbfaf6] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#74786a]">
      {children}
    </span>
  );
}

function DarkTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#151711] backdrop-blur">
      {children}
    </span>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <section className="rounded-[34px] border border-dashed border-[#ded9cc] bg-white/70 p-10 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#151711] text-[#d7c77a]">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="text-2xl font-black tracking-[-0.05em] text-[#151711]">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#74786a]">{text}</p>
    </section>
  );
}
