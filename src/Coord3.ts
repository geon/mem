import { Coord2 } from "./Coord2";

export class Coord3 {
	x: number;
	y: number;
	z: number;

	constructor(coord: { x: number; y: number; z: number }) {
		this.x = coord.x;
		this.y = coord.y;
		this.z = coord.z;
	}

	static fromCoord2(a: Coord2) {
		return new Coord3({ x: a.x, y: a.y, z: 0 });
	}

	scaled(factor: number) {
		return Coord3.scale(this, factor);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	normalized() {
		return Coord3.scale(this, 1 / this.length());
	}

	static distance(a: Coord3, b: Coord3) {
		return Coord3.subtract(a, b).length();
	}

	static add(a: Coord3, b: Coord3) {
		return new Coord3({
			x: a.x + b.x,
			y: a.y + b.y,
			z: a.z + b.z,
		});
	}

	static subtract(a: Coord3, b: Coord3) {
		return new Coord3({
			x: a.x - b.x,
			y: a.y - b.y,
			z: a.z - b.z,
		});
	}

	static scale(coord: Coord3, factor: number) {
		return new Coord3({
			x: coord.x * factor,
			y: coord.y * factor,
			z: coord.z * factor,
		});
	}

	static interpolate(from: Coord3, to: Coord3, factor: number) {
		return Coord3.add(Coord3.scale(from, 1 - factor), Coord3.scale(to, factor));
	}
}
