import { Coord3 } from "./Coord3";
import { Renderer } from "./Renderer";
import { animateInterpolation, easings, queue } from "./functions";

export class Piece {
	renderer: Renderer;
	position: Coord3;
	color: number;
	cloakFactor: number;
	frameCoroutine: IterableIterator<void>;
	animationCoroutine?: IterableIterator<void>;

	constructor(options: {
		renderer: Renderer;
		position: Coord3;
		color: number;
	}) {
		this.renderer = options.renderer;
		this.position = options.position;
		this.color = options.color;
		this.cloakFactor = 0;
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	cancelAnimations() {
		this.animationCoroutine = undefined;
		this.frameCoroutine = this.makeFrameCoroutine();
	}

	queueUpAnimation(newPart: IterableIterator<void>) {
		this.animationCoroutine = this.animationCoroutine
			? queue([this.animationCoroutine, newPart])
			: queue([newPart]);
	}

	*makeFrameCoroutine(): IterableIterator<void> {
		if (this.animationCoroutine) {
			yield* this.animationCoroutine;
		}
	}

	// TODO: Remove. Running animation from here makes it disconncted from the rest of the code. Hacky.
	setCloaked(cloaked: boolean, duration?: number) {
		this.queueUpAnimation(this.makeCloakCoroutine(cloaked, duration));
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

	*makeMoveCoroutine(
		position: Coord3,
		duration: number,
		easing: (t: number) => number = easings.inOutCubic,
	): IterableIterator<void> {
		const from = this.position;
		const to = position;

		yield* animateInterpolation(duration, timeFactor => {
			this.position = Coord3.interpolate(from, to, easing(timeFactor));
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
