import { Coord2 } from "./Coord2";
import { Renderer } from "./Renderer";
import { animateInterpolation, easings } from "./functions";

export class Piece {
	renderer: Renderer;
	position: Coord2;
	color: number;
	cloakFactor: number;
	frameCoroutine: IterableIterator<void>;
	animationQueue: Array<IterableIterator<void>>;

	constructor(options: {
		renderer: Renderer;
		position: Coord2;
		color: number;
	}) {
		this.renderer = options.renderer;
		this.position = options.position;
		this.color = options.color;
		this.cloakFactor = 0;

		this.animationQueue = [];
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	cancelAnimations() {
		this.animationQueue = [];
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		for (;;) {
			const animationCoroutine = this.animationQueue.shift();
			if (!animationCoroutine) {
				yield;
				continue;
			}

			let done = false;
			while (!done) {
				const frameTime = yield;
				done = animationCoroutine.next(frameTime).done;
			}
		}
	}

	setCloaked(cloaked: boolean, duration?: number) {
		this.animationQueue.push(this.makeCloakCoroutine(cloaked, duration));
	}

	*makeCloakCoroutine(
		cloaked: boolean,
		duration: number = 500,
	): IterableIterator<void> {
		const from = this.cloakFactor;
		const to = cloaked ? 1 : 0;

		yield* animateInterpolation(duration, timeFactor => {
			this.cloakFactor = from * (1 - timeFactor) + to * timeFactor;
		});
	}

	move(position: Coord2, duration: number) {
		this.animationQueue.push(this.makeMoveCoroutine(position, duration));
	}

	*makeMoveCoroutine(
		position: Coord2,
		duration: number,
		easing: (t: number) => number = easings.inOutCubic,
	): IterableIterator<void> {
		const from = this.position;
		const to = position;

		yield* animateInterpolation(duration, timeFactor => {
			this.position = Coord2.interpolate(from, to, easing(timeFactor));
		});
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
