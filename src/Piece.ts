// import { waitMs } from "./functions";

export class Piece {
	color: number;
	colorIsVisible: boolean;

	button: any;

	constructor(options: { color: number; button: any }) {
		this.color = options.color;
		// TODO: Set to true initially. Make the frameCoroutine work.
		this.colorIsVisible = false;

		this.button = options.button;
	}

	// *frameCoroutine(): IterableIterator<void> {
	// 	yield* waitMs(1000);
	// 	this.colorIsVisible = false;
	// }

	draw(_context: CanvasRenderingContext2D) {
		this.button.textContent = this.colorIsVisible ? this.color.toString() : "*";

		// TODO
	}
}
