import { Coord2 } from "./Coord2";
import { Coord3 } from "./Coord3";
import { GameMode } from "./GameMode";
import { Piece } from "./Piece";
import { waitMs, range, randomElement } from "./functions";
import { Renderer } from "./Renderer";

export class Board {
	renderer: Renderer;
	canvas: HTMLCanvasElement;
	gameMode: GameMode;
	frameCoroutine: IterableIterator<void>;
	pieces: Array<Piece | undefined>;
	queuedPiece: Piece | undefined;
	pickedPiece: Piece | undefined;

	constructor(options: {
		renderer: Renderer;
		canvas: HTMLCanvasElement;
		gameMode: GameMode;
	}) {
		this.renderer = options.renderer;
		this.canvas = options.canvas;
		this.gameMode = options.gameMode;

		this.frameCoroutine = this.makeFrameCoroutine();
		this.queuedPiece = undefined;
		this.pickedPiece = undefined;
		this.pieces = [];

		this.canvas.addEventListener("click", event => {
			const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
			const boardWidth = Board.size.x + 2;
			const boardHeight = Board.size.y + 2;
			const visibleWidth = Math.max(boardWidth, boardWidth * aspect);
			const visibleHeight = Math.max(boardHeight, boardHeight / aspect);

			const mouseWorldCoordX =
				(event.offsetX / this.canvas.clientWidth - 0.5) * visibleWidth;
			const mouseWorldCoordY =
				-(event.offsetY / this.canvas.clientHeight - 0.5) * visibleHeight;

			const x = Math.floor(mouseWorldCoordX + Board.size.x / 2);
			const y = Math.floor(mouseWorldCoordY + Board.size.y / 2);

			if (x >= 0 && x < Board.size.x && y >= 0 && y < Board.size.y) {
				this.pick(Board.coordToIndex(new Coord2({ x, y })));
			}
		});
	}

	static size = new Coord2({ x: 4, y: 4 });
	static numColors = 13;
	static queuePosition = Coord3.fromCoord2(
		Coord2.add(Board.size.scaled(0.5), new Coord2({ x: 0.5, y: 0.5 })),
	);

	spawnPosition(position: Coord3) {
		return Coord3.add(
			position,
			new Coord3({ x: 0, y: 0, z: this.renderer.cameraDistance + 1 }),
		);
	}

	static xyToIndex(x: number, y: number) {
		return x + y * Board.size.x;
	}

	static coordToIndex(coord: Coord2) {
		return Board.xyToIndex(coord.x, coord.y);
	}

	static indexToCoord(index: number) {
		return new Coord2({
			x: index % Board.size.x,
			y: Math.floor(index / Board.size.x),
		});
	}

	pick(index: number) {
		const piece = this.pieces[index];

		if (piece && !this.pickedPiece) {
			this.pickedPiece = piece;
			this.pickedPiece.setCloaked(false);
		}
	}

	getFreePieceIndex() {
		const pieceAddOrder = Array.from(
			range(0, Board.size.x * Board.size.y),
		).sort((a, b) => {
			// Meassure from center.
			const center = new Coord2({
				x: (Board.size.x - 1) / 2,
				y: (Board.size.y - 1) / 2,
			});
			// With a small offset to make it deterministic.
			center.x += 0.1;
			center.x += 0.2;

			// Order by distance.
			const A = Coord2.distance(Board.indexToCoord(a), center);
			const B = Coord2.distance(Board.indexToCoord(b), center);
			return A - B;
		});

		for (const index of pieceAddOrder) {
			if (!this.pieces[index]) {
				return index;
			}
		}

		return undefined;
	}

	existingColors() {
		return Array.from(
			new Set(this.pieces.filter(piece => !!piece).map(piece => piece!.color)),
		);
	}

	allColors() {
		return Array.from(range(0, Board.numColors));
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		const gameFlowCoroutine = this.gameFlowCoroutine();

		// Run the gameflow and pieces coroutines concurrently.
		for (;;) {
			const deltaTime: number = yield;

			const pieceCoroutines = this.pieces
				.filter(piece => !!piece)
				.map(piece => piece!.frameCoroutine);

			const done = gameFlowCoroutine.next(deltaTime).done;

			[
				...(this.queuedPiece ? [this.queuedPiece.frameCoroutine] : []),
				...pieceCoroutines,
			].forEach(coroutine => coroutine.next(deltaTime));

			if (done) {
				return;
			}
		}
	}

	*gameFlowCoroutine() {
		// Give the player a chance to see the queued piece.
		yield* waitMs(1000);

		yield* this.initializationCoroutine();

		// Normal gameplay.
		for (;;) {
			// Wait for the player to pick a piece.
			if (this.pickedPiece && this.queuedPiece) {
				// Give the player a chance to compare the pieces visually.
				this.queuedPiece.cancelAnimations();
				yield* this.queuedPiece.makeCloakCoroutine(false);

				if (this.pickedPiece.color == this.queuedPiece.color) {
					// The player found a pair.

					// Notify the game mode.
					this.gameMode.onUnlockedPair(this);

					// Remove the picked piece from the board.
					this.pieces = this.pieces.map(
						piece => (piece != this.pickedPiece ? piece : undefined),
					);

					// Detect win.
					if (this.pieces.filter(piece => !!piece).length < 2) {
						// Notify the game mode.
						this.gameMode.onWin(this);

						// TODO: Move the notifying of winning to the return value?
						return;
					}
				} else {
					// Punish player.

					const index = this.getFreePieceIndex();
					// Detect game over.
					if (index === undefined) {
						this.gameMode.onGameOver(this);

						// TODO: Clear board animation.

						// TODO: Move the notifying of losing to the return value?
						return;
					}

					const newPosition = Coord3.fromCoord2(
						Coord2.add(
							Coord2.add(Board.indexToCoord(index), Board.size.scaled(-0.5)),
							new Coord2({ x: 0.5, y: 0.5 }),
						),
					);
					yield* this.queuedPiece.makeMoveCoroutine(newPosition, 500);
					yield* this.queuedPiece.makeCloakCoroutine(true, 1000);
					this.pieces[index] = this.queuedPiece;
				}

				// Queue up a new piece.
				this.queuedPiece = new Piece({
					renderer: this.renderer,
					position: this.spawnPosition(Board.queuePosition),

					// Pick any existing color (or finding the match is impossible), but
					// avoid queuing up the same color twice in a row, or the
					// color just picked.
					color:
						randomElement(
							this.existingColors().filter(
								color =>
									color != (this.queuedPiece && this.queuedPiece.color) &&
									color != (this.pickedPiece && this.pickedPiece.color),
							),
							// In case all colors were filtered out
						) || this.existingColors()[0],
				});
				this.queuedPiece.move(Board.queuePosition, 500);
				// Slowly cloak it.
				this.queuedPiece.setCloaked(true, 10000);

				// Reset the picked piece.
				this.pickedPiece.setCloaked(true);
				this.pickedPiece = undefined;
			}
			yield;
		}
	}

	*initializationCoroutine() {
		// Add initial pieces.
		for (let i = 0; i < Board.size.x * Board.size.y * 0.75; ++i) {
			const color = randomElement(this.allColors())!;
			const index = this.getFreePieceIndex() || 0;
			const newPosition = Coord3.fromCoord2(
				Coord2.add(
					Coord2.add(Board.indexToCoord(index), Board.size.scaled(-0.5)),
					new Coord2({ x: 0.5, y: 0.5 }),
				),
			);

			const piece = new Piece({
				renderer: this.renderer,
				position: this.spawnPosition(newPosition),
				color,
			});
			piece.move(newPosition, 1000);
			piece.wait(1000);
			piece.setCloaked(true, 2000);
			this.pieces[index] = piece;

			yield* waitMs(100);
		}

		yield* waitMs(2000);

		// There must be a queued up piece to play.
		this.queuedPiece = new Piece({
			renderer: this.renderer,
			position: Board.queuePosition,
			color: randomElement(this.existingColors())!,
		});
		// Slowly cloak it.
		this.queuedPiece.setCloaked(true, 10000);
	}

	draw() {
		this.renderer.clear();

		this.queuedPiece && this.queuedPiece.draw();

		for (const piece of this.pieces) {
			if (piece) {
				piece.draw();
			}
		}
	}
}
