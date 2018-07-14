import { Coord2 } from "./Coord2";
import { waitMs } from "./functions";
import { Renderer } from "./Renderer";

const cloakTime = 500;

export class Piece {
	renderer: Renderer;
	color: number;
	cloakFactor: number;
	frameCoroutine: IterableIterator<void>;

	constructor(options: { renderer: Renderer; color: number }) {
		this.renderer = options.renderer;
		this.color = options.color;
		this.cloakFactor = 0;
		this.frameCoroutine = this.makeInitCoroutine();
	}

	setPicked(picked: boolean) {
		this.frameCoroutine = picked
			? this.makeCloakCoroutine(1, 0)
			: this.makeCloakCoroutine(0, 1);
	}

	*makeInitCoroutine(): IterableIterator<void> {
		yield* waitMs(2000);
		yield* this.makeCloakCoroutine(0, 1);
	}

	*makeCloakCoroutine(from: number, to: number): IterableIterator<void> {
		for (this.cloakFactor = from; (to - from) * (to - this.cloakFactor) > 0; ) {
			const frameTime = yield;
			this.cloakFactor += (to - from) * (frameTime / cloakTime);
		}
		this.cloakFactor = to;
	}

	draw(position: Coord2) {
		if (this.cloakFactor < 1) {
			this.renderer.drawSphere(this.color, position);
		}

		if (this.cloakFactor > 0) {
			this.renderer.drawCloak(position, this.cloakFactor);
		}
	}
}
