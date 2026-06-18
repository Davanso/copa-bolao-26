const teamFlagCodes: Record<string, string> = {
  "africa do sul": "za",
  alemanha: "de",
  algeria: "dz",
  argelia: "dz",
  argentina: "ar",
  "arabia saudita": "sa",
  at: "at",
  aut: "at",
  australia: "au",
  austria: "at",
  belgica: "be",
  belgium: "be",
  bosnia: "ba",
  "bosnia h": "ba",
  "bosnia and herzegovina": "ba",
  "bosnia e herzegovina": "ba",
  bih: "ba",
  brasil: "br",
  brazil: "br",
  br: "br",
  bra: "br",
  "cabo verde": "cv",
  ca: "ca",
  canada: "ca",
  can: "ca",
  catar: "qa",
  colombia: "co",
  "coreia do sul": "kr",
  "costa do marfim": "ci",
  croacia: "hr",
  curacao: "cw",
  "czech republic": "cz",
  egito: "eg",
  equador: "ec",
  escocia: "gb-sct",
  espanha: "es",
  "estados unidos": "us",
  france: "fr",
  franca: "fr",
  cd: "cd",
  cod: "cd",
  congo: "cd",
  "congo dr": "cd",
  "congo rd": "cd",
  "democratic republic of congo": "cd",
  "dr congo": "cd",
  gana: "gh",
  ghana: "gh",
  gha: "gh",
  haiti: "ht",
  holanda: "nl",
  inglaterra: "gb-eng",
  ira: "ir",
  iraque: "iq",
  japao: "jp",
  jo: "jo",
  jordan: "jo",
  jordania: "jo",
  jor: "jo",
  marrocos: "ma",
  mexico: "mx",
  mex: "mx",
  mx: "mx",
  morocco: "ma",
  netherlands: "nl",
  noruega: "no",
  "nova zelandia": "nz",
  panama: "pa",
  paraguai: "py",
  portugal: "pt",
  "rd congo": "cd",
  "republica democratica do congo": "cd",
  "republica tcheca": "cz",
  senegal: "sn",
  "south africa": "za",
  "south korea": "kr",
  spain: "es",
  suecia: "se",
  suica: "ch",
  sweden: "se",
  switzerland: "ch",
  tunisia: "tn",
  turquia: "tr",
  turkey: "tr",
  uruguai: "uy",
  uzbequistao: "uz",
  uzbekistan: "uz",
};

export function flagUrlForTeam(teamName: string) {
  const code = teamFlagCodes[normalizeTeamName(teamName)];

  if (!code) {
    return "";
  }

  return `https://flagcdn.com/w40/${code}.png`;
}

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
