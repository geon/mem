export class Coord2 {
	x: number;
	y: number;

	constructor(coord: { x: number; y: number }) {
		this.x = coord.x;
		this.y = coord.y;
	}

	scaled(factor: number) {
		return Coord2.scale(this, factor);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalized() {
		return Coord2.scale(this, 1 / this.length());
	}

	static distance(a: Coord2, b: Coord2) {
		return Coord2.subtract(a, b).length();
	}

	static add(a: Coord2, b: Coord2) {
		return new Coord2({
			x: a.x + b.x,
			y: a.y + b.y,
		});
	}

	static subtract(a: Coord2, b: Coord2) {
		return new Coord2({
			x: a.x - b.x,
			y: a.y - b.y,
		});
	}

	static scale(coord: Coord2, factor: number) {
		return new Coord2({
			x: coord.x * factor,
			y: coord.y * factor,
		});
	}
}
