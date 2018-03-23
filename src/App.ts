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
			this.render(currentTime);
		}
	}

	render(currentTime: number) {
		// Calculate delta time. Cap it to make debugging easier.
		const deltaTime = Math.min(currentTime - this.lastRenderTime, 100);
		this.lastRenderTime = currentTime;

		// // Draw the board background.
		// this.context.fillStyle = "rgba(0, 0, 0, 1)";
		// this.context.fillRect(0, 0, this.getWidth(), this.getHeight());

		// Boards and avatars.
		this.gameMode.frameCoroutine.next(deltaTime);
		this.gameMode.draw();

		// FPS counter.
		// this.context.fillStyle = "black";
		// this.context.font = "16px Palatino";
		// this.context.fillText("FPS: " + Math.floor(1000/deltaTime), 10, 20);
	}
}
