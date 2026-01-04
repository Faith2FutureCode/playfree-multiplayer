import { InventoryState } from "./types";

export function moveCursor(
  state: InventoryState,
  delta: { x: number; y: number },
  gridSize = { cols: 7, rows: 4 }
): void {
  const index = state.cursor;
  const col = index % gridSize.cols;
  const row = Math.floor(index / gridSize.cols);
  const nextCol = (col + delta.x + gridSize.cols) % gridSize.cols;
  const nextRow = (row + delta.y + gridSize.rows) % gridSize.rows;
  state.cursor = nextRow * gridSize.cols + nextCol;
}

export function clampCursor(state: InventoryState, gridSize = { cols: 7, rows: 4 }): void {
  const maxIndex = gridSize.cols * gridSize.rows - 1;
  if (state.cursor < 0) {
    state.cursor = 0;
  }
  if (state.cursor > maxIndex) {
    state.cursor = maxIndex;
  }
}
