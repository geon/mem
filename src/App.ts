import { Renderer } from "./Renderer";
import { GameMode } from "./GameMode";
import { GameMode1p } from "./GameMode1p";

export class App {
	canvas: HTMLCanvasElement;
	renderer: Renderer;
	gameMode: GameMode;
	lastRenderTime: number;

	constructor() {
		this.canvas = document.getElementsByTagName("canvas")[0];
		this.renderer = new Renderer(this.canvas);
		this.gameMode = new GameMode1p({
			renderer: this.renderer,
			canvas: this.canvas,
		});
		this.lastRenderTime = 0;
	}

	async startGame() {
		const requestAnimFrame = () =>
			new Promise<number>(resolve => {
				(window.requestAnimationFrame ||
					(window as any).webkitRequestAnimationFrame ||
					(window as any).mozRequestAnimationFrame ||
					(window as any).oRequestAnimationFrame ||
					(window as any).msRequestAnimationFrame ||
					(callback => {
						window.setTimeout(callback, 1000 / 60, new Date().getTime());
					}))(resolve);
			});

		// Start the loop.
		for (;;) {
			const currentTime = await requestAnimFrame();

			// Calculate delta time. Cap it to make debugging easier.
			const deltaTime = Math.min(currentTime - this.lastRenderTime, 100);
			this.lastRenderTime = currentTime;

			const done = this.gameMode.frameCoroutine.next(deltaTime).done;
			this.gameMode.draw();

			// Restart the game after game over.
			if (done) {
				this.gameMode = new GameMode1p({
					renderer: this.renderer,
					canvas: this.canvas,
				});
			}
		}
	}
}
