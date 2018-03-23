import { Coord2 } from "./Coord2";
import { waitMs } from "./functions";
import * as Renderer from "./Renderer";

export class Piece {
	color: number;
	colorIsVisible: boolean;
	picked: boolean;
	frameCoroutine: IterableIterator<void>;

	constructor(options: { color: number }) {
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
		Renderer.draw(
			this.picked || this.colorIsVisible ? this.color : -1,
			position,
		);
	}
}
