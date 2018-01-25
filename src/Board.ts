import { Coord } from "./Coord";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { waitMs, range } from "./functions";

export class Board {
	gameMode: GameMode;

	pieces: Array<Piece | undefined>;
	pickedA: Piece | undefined;
	pickedB: Piece | undefined;

	numColors: number;

	constructor(options: { gameMode: GameMode }) {
		this.gameMode = options.gameMode;

		this.pickedA = undefined;
		this.pickedB = undefined;
		this.numColors = 10;
		this.pieces = [];

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
		return button;
	}

	static size: Coord = new Coord({ x: 4, y: 4 });

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
		const pickedPiece = this.pieces[index];
		if (!this.pickedA) {
			this.pickedA = pickedPiece;
		} else if (!this.pickedB) {
			this.pickedB = pickedPiece;
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
				const button = Board.getButtonForPieceIndex(index);
				this.pieces[index] = new Piece({
					color,
					button,
				});
				return true;
			}
		}

		return false;
	}

	randomColor(limitToExisting: boolean) {
		const possibleColors = limitToExisting
			? Array.from(
					new Set(
						this.pieces.filter(piece => !!piece).map(piece => piece!.color),
					),
				)
			: Array.from(range(0, this.numColors));

		return possibleColors[Math.floor(Math.random() * possibleColors.length)];
	}

	*frameCoroutine(): IterableIterator<void> {
		// TODO: Move to a member, just like in `Piece`.
		const gameFlowCoroutine = this.gameFlowCoroutine();

		// TODO: Abstract away.
		// Run the gameflow and pieces coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			gameFlowCoroutine.next(deltaTime);

			for (const piece of this.pieces) {
				if (piece) {
					piece.frameCoroutine.next(deltaTime);
				}
			}
		}
	}

	private *gameFlowCoroutine() {
		// TODO: Must add colors in pairs initially, or board is not solvable.
		// Add initial pieces.
		for (let i = 0; i < Board.size.x * Board.size.y * 0.75; ++i) {
			this.addPiece(this.randomColor(false));
			yield* waitMs(100);
		}

		for (;;) {
			if (this.pickedA && this.pickedB) {
				// Give the player a chance to compare the pieces visually.
				yield* waitMs(1000);
				if (this.pickedA.color == this.pickedB.color) {
					// The player found a pair.
					// Remove the picked pieces from the board.
					this.pieces = this.pieces.map(
						piece =>
							piece != this.pickedA && piece != this.pickedB
								? piece
								: undefined,
					);
					// Notify the game mode.
					this.gameMode.onUnlockedPair(this);
				} else {
					// Punish player.
					const addedPieceSuccessfully = this.addPiece(this.randomColor(true));
					// Detect game over.
					if (!addedPieceSuccessfully) {
						this.gameMode.onGameOver(this);
					}
				}
				// Reset the picked pieces.
				this.pickedA = undefined;
				this.pickedB = undefined;
			}
			yield;
		}
	}

	draw(context: CanvasRenderingContext2D) {
		for (let i = 0; i < Board.size.x * Board.size.y; ++i) {
			// Erase all buttons, since they stay after pieces are destroyed.
			const button = Board.getButtonForPieceIndex(i);
			button.textContent = "";

			const piece = this.pieces[i];
			if (piece) {
				piece.draw(context);
			}
		}

		const pickedA = document.getElementById("pickedA")!;
		const pickedB = document.getElementById("pickedB")!;
		pickedA.textContent = this.pickedA ? this.pickedA.color.toString() : "";
		pickedB.textContent = this.pickedB ? this.pickedB.color.toString() : "";
	}
}
