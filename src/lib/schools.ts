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
    name: "PORTEZUELO",
    aliases: ["PORTEZUELO", "Portezuelo"],
    crest: "/escudos/portezuelo.png",
    theme: { accent: "bg-cyan-700", soft: "bg-cyan-50", text: "text-cyan-800" },
  },
  {
    id: "torreon",
    name: "EL TORREON",
    aliases: [
      "TORREON",
      "TORREÓN",
      "Torreón",
      "Torreon",
      "EL TORREON",
      "EL TORREÓN",
      "El Torreón",
      "El Torreon",
    ],
    crest: "/escudos/torreon.png",
    theme: { accent: "bg-sky-700", soft: "bg-sky-50", text: "text-sky-800" },
  },
  {
    id: "los-candiles",
    name: "LOS CANDILES",
    aliases: ["LCD", "LOS CANDILES", "Los Candiles"],
    crest: "/escudos/los-candiles.png",
    theme: { accent: "bg-orange-700", soft: "bg-orange-50", text: "text-orange-800" },
  },
  {
    id: "buen-ayre",
    name: "EL BUEN AYRE",
    aliases: ["BUEN AYRE", "Buen Ayre", "EL BUEN AYRE", "El Buen Ayre"],
    crest: "/escudos/buen-ayre.png",
    theme: { accent: "bg-indigo-700", soft: "bg-indigo-50", text: "text-indigo-800" },
  },
  {
    id: "crisol",
    name: "CRISOL",
    aliases: ["CRISOL", "Crisol"],
    crest: "/escudos/crisol.png",
    theme: { accent: "bg-rose-700", soft: "bg-rose-50", text: "text-rose-800" },
  },
  {
    id: "los-cerros",
    name: "LOS CERROS",
    aliases: ["LOS CERROS", "Los Cerros"],
    crest: "/escudos/los-cerros.png",
    theme: { accent: "bg-violet-700", soft: "bg-violet-50", text: "text-violet-800" },
  },
  {
    id: "mirasoles",
    name: "MIRASOLES",
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
    [school.name, ...school.aliases].some(
      (alias) => normalizeSchoolText(alias) === normalized,
    ),
  );
}

export function getSchoolByTeamName(teamName: string) {
  const normalized = normalizeSchoolText(teamName);

  return SCHOOLS.find((school) =>
    [school.name, ...school.aliases].some((alias) => {
      const normalizedAlias = normalizeSchoolText(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    }),
  );
}

export function getSchoolNameFromTeam(teamName: string) {
  return getSchoolByTeamName(teamName)?.name ?? teamName;
}

export function getTeamDisplayName(teamName: string) {
  const school = getSchoolByTeamName(teamName);
  if (!school) return teamName;

  const suffix = teamName.match(/\s*(\([^)]+\))\s*$/)?.[1] ?? "";
  return suffix ? `${school.name} ${suffix.toUpperCase()}` : school.name;
}

export function getSchoolCrestFromTeam(teamName: string) {
  return getSchoolByTeamName(teamName)?.crest ?? null;
}

export function isSchoolInMatch(teamA: string, teamB: string, selectedSchool: string | null) {
  if (!selectedSchool) return false;

  const selected = getSchoolByName(selectedSchool);
  if (!selected) return false;

  return (
    getSchoolByTeamName(teamA)?.id === selected.id ||
    getSchoolByTeamName(teamB)?.id === selected.id
  );
}
