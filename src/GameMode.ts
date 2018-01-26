import { Board } from "./Board";

export interface GameMode {
	frameCoroutine: IterableIterator<void>;

	onUnlockedPair: (board: Board) => void;
	onGameOver: (board: Board) => void;
	onWin: (board: Board) => void;
	makeFrameCoroutine: () => IterableIterator<void>;
	draw: (context: CanvasRenderingContext2D) => void;
}
