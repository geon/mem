import { waitMs } from "./functions";

export class Piece {
	color: number;
	colorIsVisible: boolean;
	frameCoroutine: IterableIterator<void>;

	button: any;

	constructor(options: { color: number; button: any }) {
		this.color = options.color;
		this.colorIsVisible = true;
		this.frameCoroutine = this.makeFrameCoroutine();

		this.button = options.button;
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		yield* waitMs(1000);
		this.colorIsVisible = false;
	}

	draw(_context: CanvasRenderingContext2D) {
		this.button.textContent = this.colorIsVisible ? this.color.toString() : "*";

		// TODO
	}
}
