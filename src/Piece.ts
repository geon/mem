import { Coord } from "./Coord";
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
		yield* waitMs(1000);
		this.colorIsVisible = false;
	}

	draw(position: Coord) {
		if (this.picked || this.colorIsVisible) {
			Renderer.draw(this.color, position);
		}
	}
}
