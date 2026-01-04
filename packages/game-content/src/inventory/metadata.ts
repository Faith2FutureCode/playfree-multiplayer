import { PowerUpType, POWERUP_METADATA } from "../powerups";

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  icon: string;
  usage: "level-entry" | "map-target";
  effectHandlerId: string;
}

export const INVENTORY_POWERUPS: PowerUpConfig[] = Object.entries(POWERUP_METADATA).map(
  ([key, meta]) => ({
    type: key as PowerUpType,
    name: meta.name,
    icon: meta.icon,
    usage: meta.usage,
    effectHandlerId: meta.effectHandlerId,
  })
);
