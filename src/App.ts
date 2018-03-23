import * as Renderer from "./Renderer";
import { GameMode } from "./GameMode";
import { GameMode1p } from "./GameMode1p";

export class App {
	gameMode: GameMode;

	lastRenderTime: number;

	constructor() {
		this.gameMode = new GameMode1p();
		this.lastRenderTime = 0;
	}

	async startGame() {
		// Set up the renderer.

		Renderer.init();

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

			this.gameMode.frameCoroutine.next(deltaTime);
			this.gameMode.draw();
		}
	}
}
