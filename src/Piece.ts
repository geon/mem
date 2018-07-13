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
			? this.makeUnCloakCoroutine()
			: this.makeCloakCoroutine();
	}

	*makeInitCoroutine(): IterableIterator<void> {
		yield* waitMs(2000);
		yield* this.makeCloakCoroutine();
	}

	*makeCloakCoroutine(): IterableIterator<void> {
		for (this.cloakFactor = 0; this.cloakFactor < 1; ) {
			const frameTime = yield;
			this.cloakFactor += frameTime / cloakTime;
		}
		this.cloakFactor = 1;
	}

	*makeUnCloakCoroutine(): IterableIterator<void> {
		for (this.cloakFactor = 1; this.cloakFactor > 0; ) {
			const frameTime = yield;
			this.cloakFactor -= frameTime / cloakTime;
		}
		this.cloakFactor = 0;
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
