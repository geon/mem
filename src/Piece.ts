import { Coord2 } from "./Coord2";
import { waitMs } from "./functions";
import { Renderer } from "./Renderer";
import { Board } from "./Board";

export class Piece {
	renderer: Renderer;
	color: number;
	colorIsVisible: boolean;
	picked: boolean;
	frameCoroutine: IterableIterator<void>;

	constructor(options: { renderer: Renderer; color: number }) {
		this.renderer = options.renderer;
		this.color = options.color;
		this.colorIsVisible = true;
		this.picked = false;
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	setPicked(picked: boolean) {
		this.picked = picked;
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		yield* waitMs(2000);
		this.colorIsVisible = false;
	}

	draw(position: Coord2) {
		this.renderer.drawSphere(
			this.picked || this.colorIsVisible ? this.color : Board.numColors,
			position,
		);
	}
}
