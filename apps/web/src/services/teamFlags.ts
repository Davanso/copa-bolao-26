const teamFlagCodes: Record<string, string> = {
  "África do Sul": "za",
  Alemanha: "de",
  Argélia: "dz",
  Argentina: "ar",
  "Arábia Saudita": "sa",
  Austrália: "au",
  Bélgica: "be",
  "Bósnia e Herzegovina": "ba",
  Brasil: "br",
  "Cabo Verde": "cv",
  Canadá: "ca",
  Catar: "qa",
  Colômbia: "co",
  "Coreia do Sul": "kr",
  "Costa do Marfim": "ci",
  Croácia: "hr",
  Curaçao: "cw",
  Egito: "eg",
  Equador: "ec",
  Escócia: "gb-sct",
  Espanha: "es",
  "Estados Unidos": "us",
  França: "fr",
  Haiti: "ht",
  Holanda: "nl",
  Inglaterra: "gb-eng",
  Irã: "ir",
  Iraque: "iq",
  Japão: "jp",
  Marrocos: "ma",
  México: "mx",
  Noruega: "no",
  "Nova Zelândia": "nz",
  Paraguai: "py",
  Portugal: "pt",
  "República Tcheca": "cz",
  Senegal: "sn",
  Suécia: "se",
  Suíça: "ch",
  Tunísia: "tn",
  Turquia: "tr",
  Uruguai: "uy",
};

export function flagUrlForTeam(teamName: string) {
  const code = teamFlagCodes[teamName];

  if (!code) {
    return "";
  }

  return `https://flagcdn.com/w40/${code}.png`;
}
