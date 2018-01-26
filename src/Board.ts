import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { waitMs, range, randomElement } from "./functions";

export class Board {
	gameMode: GameMode;
	frameCoroutine: IterableIterator<void>;
	pieces: Array<Piece | undefined>;
	queuedPiece: Piece;
	pickedPiece: Piece | undefined;

	constructor(options: { gameMode: GameMode }) {
		this.gameMode = options.gameMode;

		this.frameCoroutine = this.makeFrameCoroutine();
		this.pickedPiece = undefined;
		this.pieces = [];
		this.queuedPiece = new Piece({
			color: this.randomColor(),
			element: document.getElementById("queued-piece")!,
		});
		this.queuedPiece.setPicked(true);

		for (let i = 0; i < Board.size.x * Board.size.y; ++i) {
			const button = Board.getButtonForPieceIndex(i);
			button.addEventListener("click", () => this.pick(i));
		}
	}

	static getButtonForPieceIndex(index: number) {
		const coord = Board.indexToCoord(index);
		const table = document.getElementsByTagName("table")[0];
		const tr = table.children[0].children[coord.y];
		const td = tr.children[coord.x];
		const button = td.children[0];
		return button as HTMLElement;
	}

	static size = new Coord({ x: 4, y: 4 });
	static numColors = 10;

	static xyToIndex(x: number, y: number) {
		return x + y * Board.size.x;
	}

	static coordToIndex(coord: Coord) {
		return Board.xyToIndex(coord.x, coord.y);
	}

	static indexToCoord(index: number) {
		return new Coord({
			x: index % Board.size.x,
			y: Math.floor(index / Board.size.x),
		});
	}

	pick(index: number) {
		const piece = this.pieces[index];

		if (piece && !this.pickedPiece) {
			this.pickedPiece = piece;
			this.pickedPiece.setPicked(true);
		}
	}

	addPiece(color: number) {
		const pieceAddOrder = Array.from(
			range(0, Board.size.x * Board.size.y),
		).sort((a, b) => {
			// Meassure from center.
			const center = new Coord({
				x: (Board.size.x - 1) / 2,
				y: (Board.size.y - 1) / 2,
			});
			// With a small offset to make it deterministic.
			center.x += 0.1;
			center.x += 0.2;

			// Order by distance.
			const A = Coord.distance(Board.indexToCoord(a), center);
			const B = Coord.distance(Board.indexToCoord(b), center);
			return A - B;
		});

		for (const index of pieceAddOrder) {
			if (!this.pieces[index]) {
				const element = Board.getButtonForPieceIndex(index);
				this.pieces[index] = new Piece({
					color,
					element,
				});
				return true;
			}
		}

		return false;
	}

	randomColorFromExisting() {
		const possibleColors = Array.from(
			new Set(this.pieces.filter(piece => !!piece).map(piece => piece!.color)),
		);
		return randomElement(possibleColors);
	}

	randomColor() {
		const possibleColors = Array.from(range(0, Board.numColors));
		return randomElement(possibleColors)!;
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		const gameFlowCoroutine = this.gameFlowCoroutine();

		// Run the gameflow and pieces coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			const pieceCoroutines = this.pieces
				.filter(piece => !!piece)
				.map(piece => piece!.frameCoroutine);

			const allCoroutines = [
				gameFlowCoroutine,
				this.queuedPiece.frameCoroutine,
				...pieceCoroutines,
			];

			allCoroutines.forEach(coroutine => coroutine.next(deltaTime));
		}
	}

	*gameFlowCoroutine() {
		// Give the player a chance to see the queued piece.
		yield* waitMs(1000);

		yield* this.initializationCoroutine();

		// Normal gameplay.
		for (;;) {
			if (this.pickedPiece) {
				// Give the player a chance to compare the pieces visually.
				yield* waitMs(1000);

				if (this.pickedPiece.color == this.queuedPiece.color) {
					// The player found a pair.

					// Remove the picked piece from the board.
					this.pieces = this.pieces.map(
						piece => (piece != this.pickedPiece ? piece : undefined),
					);

					// Notify the game mode.
					this.gameMode.onUnlockedPair(this);

					if (this.pieces.filter(piece => !!piece).length < 2) {
						this.gameMode.onWin(this);
					}
				} else {
					// Punish player.
					const addedPieceSuccessfully = this.addPiece(this.queuedPiece!.color);

					// Detect game over.
					if (!addedPieceSuccessfully) {
						this.gameMode.onGameOver(this);

						// TODO: Clear board animation.

						break;
					}
				}

				// TODO: Should not queue up same color twice in a row.
				// Queue up a new piece.
				this.queuedPiece = new Piece({
					color: this.randomColorFromExisting()!,
					element: document.getElementById("queued-piece")!,
				});
				this.queuedPiece.setPicked(true);

				// Reset the picked piece.
				this.pickedPiece.setPicked(false);
				this.pickedPiece = undefined;
			}
			yield;
		}
	}

	*initializationCoroutine() {
		// Add initial pieces.
		for (let i = 0; i < Board.size.x * Board.size.y * 0.75; ++i) {
			const color = this.randomColor();
			this.addPiece(color);
			yield* waitMs(100);
		}
	}

	draw(context: CanvasRenderingContext2D) {
		this.queuedPiece.draw(context);

		for (let i = 0; i < Board.size.x * Board.size.y; ++i) {
			// Erase all buttons, since they stay after pieces are destroyed.
			const button = Board.getButtonForPieceIndex(i);
			button.textContent = "";

			const piece = this.pieces[i];
			if (piece) {
				piece.draw(context);
			}
		}
	}
}
