import { App } from "./App";

const app = new App();

try {
	app.startGame();
} catch (error) {
	console.error("Could not start game.", error);
}
