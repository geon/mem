import { Coord2 } from "./Coord2";
import { Renderer } from "./Renderer";

export class Piece {
	renderer: Renderer;
	position: Coord2;
	color: number;
	cloakFactor: number;
	frameCoroutine: IterableIterator<void>;

	constructor(options: {
		renderer: Renderer;
		position: Coord2;
		color: number;
	}) {
		this.renderer = options.renderer;
		this.position = options.position;
		this.color = options.color;
		this.cloakFactor = 0;
	}

	setCloaked(cloaked: boolean, duration: number = 500) {
		this.frameCoroutine = cloaked
			? this.makeCloakCoroutine(this.cloakFactor, 1, duration)
			: this.makeCloakCoroutine(this.cloakFactor, 0, duration);
	}

	*makeCloakCoroutine(
		from: number,
		to: number,
		duration: number,
	): IterableIterator<void> {
		for (this.cloakFactor = from; (to - from) * (to - this.cloakFactor) > 0; ) {
			const frameTime = yield;
			this.cloakFactor += (to - from) * (frameTime / duration);
		}
		this.cloakFactor = to;
	}

	draw() {
		if (this.cloakFactor < 1) {
			this.renderer.drawSphere(this.color, this.position);
		}

		if (this.cloakFactor > 0) {
			this.renderer.drawCloak(this.position, this.cloakFactor);
		}
	}
}
