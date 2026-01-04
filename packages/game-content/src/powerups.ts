export enum PowerUpType {
  Mushroom = "mushroom",
  FireFlower = "fire-flower",
  SuperLeaf = "super-leaf",
  TanookiSuit = "tanooki-suit",
  FrogSuit = "frog-suit",
  HammerSuit = "hammer-suit",
  Star = "starman",
  PWing = "p-wing",
  Cloud = "cloud",
  Hammer = "hammer",
  MusicBox = "music-box",
  Anchor = "anchor",
}

export type PowerUpUsageContext = "level-entry" | "map-target";

export type PowerUpEffectHandlerId =
  | "apply-suit-mushroom"
  | "apply-suit-fire"
  | "apply-suit-leaf"
  | "apply-suit-tanooki"
  | "apply-suit-frog"
  | "apply-suit-hammer"
  | "queue-pwing"
  | "queue-star"
  | "queue-cloud"
  | "map-hammer"
  | "map-music-box"
  | "map-anchor";

export interface PowerUpMetadata {
  name: string;
  icon: string;
  usage: PowerUpUsageContext;
  effectHandlerId: PowerUpEffectHandlerId;
}

export const POWERUP_METADATA = {
  [PowerUpType.Mushroom]: {
    name: "Super Mushroom",
    icon: "item-mushroom",
    usage: "level-entry",
    effectHandlerId: "apply-suit-mushroom",
  },
  [PowerUpType.FireFlower]: {
    name: "Fire Flower",
    icon: "item-fire-flower",
    usage: "level-entry",
    effectHandlerId: "apply-suit-fire",
  },
  [PowerUpType.SuperLeaf]: {
    name: "Super Leaf",
    icon: "item-super-leaf",
    usage: "level-entry",
    effectHandlerId: "apply-suit-leaf",
  },
  [PowerUpType.TanookiSuit]: {
    name: "Tanooki Suit",
    icon: "item-tanooki",
    usage: "level-entry",
    effectHandlerId: "apply-suit-tanooki",
  },
  [PowerUpType.FrogSuit]: {
    name: "Frog Suit",
    icon: "item-frog",
    usage: "level-entry",
    effectHandlerId: "apply-suit-frog",
  },
  [PowerUpType.HammerSuit]: {
    name: "Hammer Suit",
    icon: "item-hammer-suit",
    usage: "level-entry",
    effectHandlerId: "apply-suit-hammer",
  },
  [PowerUpType.Star]: {
    name: "Starman",
    icon: "item-star",
    usage: "level-entry",
    effectHandlerId: "queue-star",
  },
  [PowerUpType.PWing]: {
    name: "P-Wing",
    icon: "item-p-wing",
    usage: "level-entry",
    effectHandlerId: "queue-pwing",
  },
  [PowerUpType.Cloud]: {
    name: "Cloud",
    icon: "item-cloud",
    usage: "level-entry",
    effectHandlerId: "queue-cloud",
  },
  [PowerUpType.Hammer]: {
    name: "Hammer",
    icon: "item-hammer",
    usage: "map-target",
    effectHandlerId: "map-hammer",
  },
  [PowerUpType.MusicBox]: {
    name: "Music Box",
    icon: "item-music-box",
    usage: "map-target",
    effectHandlerId: "map-music-box",
  },
  [PowerUpType.Anchor]: {
    name: "Anchor",
    icon: "item-anchor",
    usage: "map-target",
    effectHandlerId: "map-anchor",
  },
} satisfies Record<PowerUpType, PowerUpMetadata>;

export const LEVEL_ENTRY_POWERUPS: PowerUpType[] = [
  PowerUpType.Mushroom,
  PowerUpType.FireFlower,
  PowerUpType.SuperLeaf,
  PowerUpType.TanookiSuit,
  PowerUpType.FrogSuit,
  PowerUpType.HammerSuit,
  PowerUpType.Star,
  PowerUpType.PWing,
  PowerUpType.Cloud,
];

export const MAP_TARGET_POWERUPS: PowerUpType[] = [
  PowerUpType.Hammer,
  PowerUpType.MusicBox,
  PowerUpType.Anchor,
];
