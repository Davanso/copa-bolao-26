const teamTranslations: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Austria: "Áustria",
  AUT: "Áustria",
  Belgium: "Bélgica",
  Bosnia: "Bósnia",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  BRA: "Brasil",
  Canada: "Canadá",
  CAN: "Canadá",
  "Cape Verde": "Cabo Verde",
  Colombia: "Colômbia",
  Croatia: "Croácia",
  "Czech Republic": "República Tcheca",
  Curaçao: "Curaçao",
  "DR Congo": "RD Congo",
  COD: "RD Congo",
  "Congo DR": "RD Congo",
  "Democratic Republic of the Congo": "RD Congo",
  Ecuador: "Equador",
  Egypt: "Egito",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  GHA: "Gana",
  Haiti: "Haiti",
  Iran: "Irã",
  Iraq: "Iraque",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Jordan: "Jordânia",
  JOR: "Jordânia",
  Mexico: "México",
  MEX: "México",
  Morocco: "Marrocos",
  Netherlands: "Holanda",
  "New Zealand": "Nova Zelândia",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguai",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arábia Saudita",
  Scotland: "Escócia",
  Senegal: "Senegal",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Spain: "Espanha",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Tunisia: "Tunísia",
  Turkey: "Turquia",
  USA: "Estados Unidos",
  "United States": "Estados Unidos",
  Uruguay: "Uruguai",
  Uzbekistan: "Uzbequistão",
};

export function translateTeam(value?: string) {
  if (!value) {
    return "A definir";
  }

  return teamTranslations[value] ?? translatePlaceholder(value);
}

function translatePlaceholder(value: string) {
  return value
    .replace("Winner", "Vencedor")
    .replace("Loser", "Perdedor")
    .replace("Runner-up", "2º lugar")
    .replace("Group", "Grupo")
    .replace("Match", "Jogo")
    .replace("3rd", "3º lugar");
}
