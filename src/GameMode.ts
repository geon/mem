import { Board } from "./Board";

export interface GameMode {
	onUnlockedPair: (board: Board) => void;
	onGameOver: (board: Board) => void;
	frameCoroutine: () => IterableIterator<void>;
	draw: (context: CanvasRenderingContext2D) => void;
}
