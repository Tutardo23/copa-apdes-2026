export type School = {
  id: string;
  name: string;
  aliases: string[];
  crest: string;
  theme: {
    accent: string;
    soft: string;
    text: string;
  };
};

export const SCHOOLS: School[] = [
  {
    id: "portezuelo",
    name: "Portezuelo",
    aliases: ["PORTEZUELO", "Portezuelo"],
    crest: "/escudos/portezuelo.png",
    theme: { accent: "bg-cyan-700", soft: "bg-cyan-50", text: "text-cyan-800" },
  },
  {
    id: "torreon",
    name: "Torreón",
    aliases: ["TORREON", "TORREÓN", "Torreón", "Torreon"],
    crest: "/escudos/torreon.png",
    theme: { accent: "bg-sky-700", soft: "bg-sky-50", text: "text-sky-800" },
  },
  {
    id: "los-candiles",
    name: "Los Candiles",
    aliases: ["LCD", "LOS CANDILES", "Los Candiles"],
    crest: "/escudos/los-candiles.png",
    theme: { accent: "bg-orange-700", soft: "bg-orange-50", text: "text-orange-800" },
  },
  {
    id: "buen-ayre",
    name: "Buen Ayre",
    aliases: ["BUEN AYRE", "Buen Ayre"],
    crest: "/escudos/buen-ayre.png",
    theme: { accent: "bg-indigo-700", soft: "bg-indigo-50", text: "text-indigo-800" },
  },
  {
    id: "crisol",
    name: "Crisol",
    aliases: ["CRISOL", "Crisol"],
    crest: "/escudos/crisol.png",
    theme: { accent: "bg-rose-700", soft: "bg-rose-50", text: "text-rose-800" },
  },
  {
    id: "los-cerros",
    name: "Los Cerros",
    aliases: ["LOS CERROS", "Los Cerros"],
    crest: "/escudos/los-cerros.png",
    theme: { accent: "bg-violet-700", soft: "bg-violet-50", text: "text-violet-800" },
  },
  {
    id: "mirasoles",
    name: "Mirasoles",
    aliases: ["MIRASOLES", "Mirasoles"],
    crest: "/escudos/mirasoles.png",
    theme: { accent: "bg-emerald-700", soft: "bg-emerald-50", text: "text-emerald-800" },
  },
];

export function normalizeSchoolText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSchoolByName(value: string) {
  const normalized = normalizeSchoolText(value);

  return SCHOOLS.find((school) =>
    school.aliases.some((alias) => normalizeSchoolText(alias) === normalized)
  );
}

export function getSchoolByTeamName(teamName: string) {
  const normalized = normalizeSchoolText(teamName);

  return SCHOOLS.find((school) =>
    school.aliases.some((alias) => {
      const normalizedAlias = normalizeSchoolText(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    })
  );
}

export function getSchoolNameFromTeam(teamName: string) {
  return getSchoolByTeamName(teamName)?.name ?? teamName;
}

export function getSchoolCrestFromTeam(teamName: string) {
  return getSchoolByTeamName(teamName)?.crest ?? null;
}

export function isSchoolInMatch(teamA: string, teamB: string, selectedSchool: string | null) {
  if (!selectedSchool) return false;
  const selected = getSchoolByName(selectedSchool)?.name ?? selectedSchool;
  return getSchoolNameFromTeam(teamA) === selected || getSchoolNameFromTeam(teamB) === selected;
}
