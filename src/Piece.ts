import { Coord2 } from "./Coord2";
import { Renderer } from "./Renderer";

export class Piece {
	renderer: Renderer;
	position: Coord2;
	color: number;
	cloakFactor: number;
	frameCoroutine: IterableIterator<void>;
	cloakCoroutine?: IterableIterator<void>;
	moveCoroutine?: IterableIterator<void>;

	constructor(options: {
		renderer: Renderer;
		position: Coord2;
		color: number;
	}) {
		this.renderer = options.renderer;
		this.position = options.position;
		this.color = options.color;
		this.cloakFactor = 0;

		this.frameCoroutine = this.makeFrameCoroutine();
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		for (;;) {
			const frameTime = yield;
			this.cloakCoroutine && this.cloakCoroutine.next(frameTime);
			this.moveCoroutine && this.moveCoroutine.next(frameTime);
		}
	}

	setCloaked(cloaked: boolean, duration: number = 500) {
		this.cloakCoroutine = cloaked
			? this.makeCloakCoroutine(this.cloakFactor, 1, duration)
			: this.makeCloakCoroutine(this.cloakFactor, 0, duration);
	}

	*makeCloakCoroutine(
		from: number,
		to: number,
		duration: number,
	): IterableIterator<void> {
		for (let timeFactor = 0; timeFactor < 1; ) {
			const frameTime = yield;
			timeFactor += frameTime / duration;
			this.cloakFactor = from * (1 - timeFactor) + to * timeFactor;
		}
		this.cloakFactor = to;
	}

	move(position: Coord2, duration: number) {
		this.moveCoroutine = this.makeMoveCoroutine(
			this.position,
			position,
			duration,
		);
	}

	*makeMoveCoroutine(
		from: Coord2,
		to: Coord2,
		duration: number,
	): IterableIterator<void> {
		for (let timeFactor = 0; timeFactor < 1; ) {
			const frameTime = yield;
			timeFactor += frameTime / duration;
			this.position = Coord2.interpolate(from, to, timeFactor);
		}
		this.position = to;
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
