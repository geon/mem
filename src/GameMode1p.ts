import { Board } from "./Board";
import { GameMode } from "./GameMode";

export class GameMode1p implements GameMode {
	board: Board;
	frameCoroutine: IterableIterator<void>;

	constructor() {
		this.board = new Board({ gameMode: this });
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	onUnlockedPair(_board: Board) {
		// TODO
	}

	onGameOver(_board: Board) {
		// TODO
		alert("game over");
	}

	onWin(_board: Board) {
		// TODO
		alert("you won");
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		for (;;) {
			// The player board.
			const deltaTime: number = yield;
			const next = this.board.frameCoroutine.next(deltaTime);

			// Yes, I could have used a simple for-of, but I expect to add more stuff to run in concurrently.
			if (next.done) {
				return;
			}
		}
	}

	draw() {
		// The player board.
		this.board.draw();
	}
}
