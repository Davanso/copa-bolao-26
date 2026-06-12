import type { Game } from "./types";

export type StageTab<T> = {
  id: string;
  label: string;
  items: T[];
};

export const stageTabsConfig = [
  {
    id: "group",
    label: "Fase de grupos",
    match: (game?: Game) => game?.stage === "Fase de grupos",
  },
  {
    id: "r32",
    label: "16 avos",
    match: (game?: Game) => game?.stage === "16 avos de final",
  },
  {
    id: "r16",
    label: "Oitavas",
    match: (game?: Game) => game?.stage === "Oitavas de final",
  },
  {
    id: "qf",
    label: "Quartas",
    match: (game?: Game) => game?.stage === "Quartas de final",
  },
  {
    id: "sf",
    label: "Semifinal",
    match: (game?: Game) => game?.stage === "Semifinal",
  },
  {
    id: "final",
    label: "Final",
    match: (game?: Game) => game?.stage === "Final",
  },
  {
    id: "third",
    label: "3º lugar",
    match: (game?: Game) => game?.stage === "Disputa de terceiro lugar",
  },
];

export function buildStageTabs<T>(
  items: T[],
  getGame: (item: T) => Game | undefined,
) {
  return stageTabsConfig
    .map((stage) => ({
      id: stage.id,
      items: items.filter((item) => stage.match(getGame(item))).sort((a, b) =>
        compareGames(getGame(a), getGame(b)),
      ),
      label: stage.label,
    }))
    .filter((stage) => stage.items.length > 0);
}

export function groupItemsForTab<T>(
  tab: StageTab<T> | undefined,
  getGame: (item: T) => Game | undefined,
) {
  if (!tab) {
    return [] as [string, T[]][];
  }

  const grouped = new Map<string, T[]>();

  for (const item of tab.items) {
    const game = getGame(item);
    const label =
      tab.id === "group" && game?.groupName
        ? `Grupo ${game.groupName}`
        : (game?.stage ?? "Sem jogo");

    grouped.set(label, [...(grouped.get(label) ?? []), item]);
  }

  return [...grouped.entries()]
    .map(
      ([label, groupedItems]) =>
        [
          label,
          [...groupedItems].sort((a, b) => compareGames(getGame(a), getGame(b))),
        ] as [string, T[]],
    )
    .sort(([first], [second]) => compareGroupLabels(first, second));
}

export function compareGames(firstGame?: Game, secondGame?: Game) {
  if (firstGame?.groupName && secondGame?.groupName) {
    const groupOrder = firstGame.groupName.localeCompare(
      secondGame.groupName,
      "pt-BR",
      { numeric: true },
    );

    if (groupOrder !== 0) {
      return groupOrder;
    }
  }

  return (
    Date.parse(firstGame?.startsAt ?? "") -
    Date.parse(secondGame?.startsAt ?? "")
  );
}

export function compareGroupLabels(firstLabel: string, secondLabel: string) {
  if (isGroupLabel(firstLabel) && isGroupLabel(secondLabel)) {
    return firstLabel.localeCompare(secondLabel, "pt-BR", { numeric: true });
  }

  return 0;
}

export function readStringSet(storageKey: string) {
  try {
    const storedGroups = localStorage.getItem(storageKey);

    if (!storedGroups) {
      return new Set<string>();
    }

    const parsedGroups = JSON.parse(storedGroups);

    if (!Array.isArray(parsedGroups)) {
      return new Set<string>();
    }

    return new Set(
      parsedGroups.filter((groupName) => typeof groupName === "string"),
    );
  } catch {
    return new Set<string>();
  }
}

function isGroupLabel(label: string) {
  return label.startsWith("Grupo ");
}
