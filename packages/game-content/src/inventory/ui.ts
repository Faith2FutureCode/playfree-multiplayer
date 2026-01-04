import { InventoryState } from "./types";
import { PowerUpType, POWERUP_METADATA } from "../powerups";

export interface InventoryRenderableSlot {
  type: PowerUpType | null;
  icon: string | null;
  name: string | null;
  count: number;
}

export interface InventoryViewModel {
  slots: InventoryRenderableSlot[];
  cursorIndex: number;
  hint: string;
  open: boolean;
  selectedName: string | null;
  blocksOverworldInput: boolean;
}

export function buildInventoryView(state: InventoryState): InventoryViewModel {
  const slots: InventoryRenderableSlot[] = state.slots.map((powerUp) => {
    if (!powerUp) {
      return { type: null, icon: null, name: null, count: 0 };
    }
    const meta = POWERUP_METADATA[powerUp];
    return { type: powerUp, icon: meta.icon, name: meta.name, count: 1 };
  });

  const selected = slots[state.cursor];

  return {
    slots,
    cursorIndex: state.cursor,
    hint: selected?.type ? "Use" : "Close",
    open: state.isOpen,
    selectedName: selected?.name ?? null,
    blocksOverworldInput: state.isOpen,
  };
}
