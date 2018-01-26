import { waitMs } from "./functions";

export class Piece {
	color: number;
	colorIsVisible: boolean;
	picked: boolean;
	frameCoroutine: IterableIterator<void>;

	element: HTMLElement;

	constructor(options: { color: number; element: HTMLElement }) {
		this.color = options.color;
		this.colorIsVisible = true;
		this.picked = false;
		this.frameCoroutine = this.makeFrameCoroutine();

		this.element = options.element;
	}

	setPicked(picked: boolean) {
		this.picked = picked;
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		yield* waitMs(1000);
		this.colorIsVisible = false;
	}

	draw(_context: CanvasRenderingContext2D) {
		this.element.textContent =
			this.picked || this.colorIsVisible ? this.color.toString() : "*";

		// TODO
	}
}
