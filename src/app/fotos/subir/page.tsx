"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Lock, UploadCloud, X } from "lucide-react";

const SCHOOLS = ["Portezuelo", "Torreón", "Los Candiles", "Crisol", "Buen Ayre", "Mirasoles", "Los Cerros"];
const CATEGORIES = [
  "Categoría 1 Federado",
  "Categoría 2 Federado",
  "Categoría 3 Federado",
  "Categoría 1 Colegial",
  "Categoría 2 Colegial",
  "Categoría 3 Colegial",
  "General",
];

export default function SubirFotosPage() {
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [category, setCategory] = useState("General");
  const [caption, setCaption] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (files.length === 0) {
      setError("Seleccioná al menos una imagen.");
      return;
    }

    const formData = new FormData();
    formData.set("school", school);
    formData.set("category", category);
    formData.set("caption", caption);
    formData.set("uploadedBy", uploadedBy);

    for (const file of files) {
      formData.append("files", file);
    }

    setBusy(true);

    try {
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: {
          "x-photo-upload-password": password,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "No se pudieron subir las fotos.");

      setFiles([]);
      setCaption("");
      setSuccess("Fotos subidas. Quedan pendientes de aprobación de la organización.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudieron subir las fotos.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f4ee] text-[#151711]">
      <section className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-14">
        <header className="mb-7 rounded-[34px] bg-[#151711] p-5 text-white shadow-[0_24px_70px_rgba(21,23,17,0.18)] md:p-8">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#d7c77a]">
            Subida privada
          </p>
          <h1 className="text-[2.5rem] font-black leading-[0.92] tracking-[-0.08em] md:text-6xl">
            Subir fotos de la Copa
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/65">
            Las imágenes quedan pendientes hasta que la organización las apruebe. Así cuidamos que la galería sea linda, positiva y segura.
          </p>
        </header>

        <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Clave para subir">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74786a]" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-[#151711]"
                    placeholder="Clave"
                    required
                  />
                </div>
              </Field>

              <Field label="Quién sube">
                <input
                  value={uploadedBy}
                  onChange={(event) => setUploadedBy(event.target.value)}
                  className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
                  placeholder="Nombre opcional"
                />
              </Field>

              <Field label="Colegio">
                <select
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
                >
                  <option value="">General</option>
                  {SCHOOLS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>

              <Field label="Categoría">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold outline-none focus:border-[#151711]"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Mensaje positivo">
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-28 w-full resize-none rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-[#151711]"
                placeholder="Ej: Gran jornada compartida, mucho espíritu de equipo..."
                maxLength={160}
              />
            </Field>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-[#ded9cc] bg-[#fbfaf6] p-8 text-center transition hover:border-[#151711]">
              <ImagePlus className="mb-3 h-10 w-10 text-[#74786a]" />
              <span className="text-sm font-black uppercase tracking-[0.18em] text-[#151711]">
                Elegir imágenes
              </span>
              <span className="mt-2 text-xs font-bold text-[#74786a]">
                JPG, PNG o WEBP · máximo 5 MB cada una
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
            </label>

            {error && <Alert tone="error" text={error} />}
            {success && <Alert tone="success" text={success} />}

            <button
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151711] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {busy ? "Subiendo" : "Subir y enviar a aprobación"}
            </button>
          </section>

          <aside className="rounded-[30px] border border-[#ded9cc] bg-white/85 p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#74786a]">Vista previa</p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">{files.length} imagen{files.length === 1 ? "" : "es"}</h2>
              </div>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="rounded-full bg-[#f0ede3] p-2 text-[#74786a] hover:text-[#151711]"
                  aria-label="Quitar fotos"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {previews.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#ded9cc] bg-[#fbfaf6] p-8 text-center">
                <ImagePlus className="mx-auto mb-3 h-8 w-8 text-[#b7b0a0]" />
                <p className="text-sm font-bold text-[#74786a]">Todavía no elegiste imágenes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {previews.map((preview) => (
                  <div key={`${preview.file.name}-${preview.file.size}`} className="overflow-hidden rounded-2xl bg-[#151711]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url} alt="Vista previa" className="h-32 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <Link href="/fotos" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#ded9cc] bg-[#fbfaf6] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#74786a] hover:text-[#151711]">
              Ver galería pública
            </Link>
          </aside>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-[#74786a]">{label}</span>
      {children}
    </label>
  );
}

function Alert({ tone, text }: { tone: "error" | "success"; text: string }) {
  return (
    <p className={`mt-4 rounded-2xl p-4 text-sm font-bold ${tone === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
      {tone === "success" && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
      {text}
    </p>
  );
}
