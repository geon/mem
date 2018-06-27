// import { Coord2 } from "./Coord2";
import * as twgl from "twgl.js";
import { Coord3 } from "./Coord3";

export function* waitMs(duration: number): IterableIterator<void> {
	let elapsedTime = 0;

	while (elapsedTime < duration) {
		const deltaTime: number = yield;
		elapsedTime += deltaTime;
	}

	return elapsedTime;
}

export function* range(from: number, to: number): IterableIterator<number> {
	for (let i = from; i < to; ++i) {
		yield i;
	}
}

export function randomElement<T>(array: ReadonlyArray<T>) {
	return array[Math.floor(Math.random() * array.length)] as T | undefined;
}

// http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
export function fisherYatesArrayShuffle<T>(myArray: Array<T>) {
	let i = myArray.length;
	if (i === 0) {
		return;
	}
	while (--i) {
		const j = Math.floor(Math.random() * (i + 1));
		const tempi = myArray[i];
		const tempj = myArray[j];
		myArray[i] = tempj;
		myArray[j] = tempi;
	}
}

interface Vertex {
	position: Coord3;
	normal: Coord3;
	texCoord: Coord3;
}
type Triangle = [Vertex, Vertex, Vertex];
type TriangleSoup = ReadonlyArray<Triangle>;
type MutableTriangleSoup = Array<Triangle>;

export function makeTesselatedCubeMesh(tesselation: number): TriangleSoup {
	function makeSide(
		uAxis: Coord3,
		vAxis: Coord3,
		normal: Coord3,
	): TriangleSoup {
		const vertices: Array<Array<Vertex>> = [];
		for (let v = 0; v <= tesselation; ++v) {
			const vFactor = v / tesselation;

			vertices[v] = [];

			for (let u = 0; u <= tesselation; ++u) {
				const uFactor = u / tesselation;

				const position = Coord3.add(
					Coord3.add(
						uAxis.scaled(-1 + 2 * uFactor),
						vAxis.scaled(-1 + 2 * vFactor),
					),
					normal,
				);

				vertices[v][u] = {
					position,
					normal,
					texCoord: position.normalized(),
				};
			}
		}

		const triangles: MutableTriangleSoup = [];
		for (let v = 0; v < tesselation; ++v) {
			for (let u = 0; u < tesselation; ++u) {
				triangles.push([
					vertices[v + 0][u + 0],
					vertices[v + 0][u + 1],
					vertices[v + 1][u + 0],
				]);
				triangles.push([
					vertices[v + 1][u + 0],
					vertices[v + 0][u + 1],
					vertices[v + 1][u + 1],
				]);
			}
		}

		return triangles;
	}

	const sideArguments = [
		{
			uAxis: new Coord3({ x: 0, y: 1, z: 0 }),
			vAxis: new Coord3({ x: 0, y: 0, z: 1 }),
			normal: new Coord3({ x: 1, y: 0, z: 0 }),
		},
		{
			uAxis: new Coord3({ x: 0, y: -1, z: 0 }),
			vAxis: new Coord3({ x: 0, y: 0, z: 1 }),
			normal: new Coord3({ x: -1, y: 0, z: 0 }),
		},
		{
			uAxis: new Coord3({ x: -1, y: 0, z: 0 }),
			vAxis: new Coord3({ x: 0, y: 0, z: 1 }),
			normal: new Coord3({ x: 0, y: 1, z: 0 }),
		},
		{
			uAxis: new Coord3({ x: 1, y: 0, z: 0 }),
			vAxis: new Coord3({ x: 0, y: 0, z: 1 }),
			normal: new Coord3({ x: 0, y: -1, z: 0 }),
		},

		{
			uAxis: new Coord3({ x: 1, y: 0, z: 0 }),
			vAxis: new Coord3({ x: 0, y: 1, z: 0 }),
			normal: new Coord3({ x: 0, y: 0, z: 1 }),
		},
		{
			uAxis: new Coord3({ x: 1, y: 0, z: 0 }),
			vAxis: new Coord3({ x: 0, y: -1, z: 0 }),
			normal: new Coord3({ x: 0, y: 0, z: -1 }),
		},
	];

	return mergeMesh(
		([] as TriangleSoup).concat(
			...sideArguments.map(({ uAxis, vAxis, normal }) =>
				makeSide(uAxis, vAxis, normal),
			),
		),
	);
}
function mergeMesh(mesh: TriangleSoup): TriangleSoup {
	const newMesh: MutableTriangleSoup = [];
	const seenVertices: Array<Vertex> = [];

	for (const triangle of mesh) {
		newMesh.push(triangle.map(vertex => {
			// Replace each vertex with an existing one if it is identical.
			const existingVertex = seenVertices.find(seenVertex =>
				deepVertexEqual(seenVertex, vertex),
			);
			seenVertices.push(vertex);
			return existingVertex || vertex;
		}) as Triangle);
	}

	return newMesh;
}
function deepVertexEqual(a: Vertex, b: Vertex) {
	const epsilon = 0.00001;
	const propertyNames = ["position", "normal", "texCoord"] as ReadonlyArray<
		keyof Vertex
	>;
	return propertyNames.every(
		propertyName => Coord3.distance(a[propertyName], b[propertyName]) < epsilon,
	);
}

export function makeTesselatedSphereMesh(
	radius: number,
	tesselation: number,
): TriangleSoup {
	const mesh = makeTesselatedCubeMesh(tesselation) as MutableTriangleSoup;

	return mergeMesh(
		mesh.map(
			triangle =>
				triangle.map(vertex => {
					const normalizedPosition = vertex.position.normalized();
					return {
						position: normalizedPosition.scaled(radius),
						normal: normalizedPosition,
						texCoord: vertex.texCoord,
					};
				}) as Triangle,
		),
	);
}

// function coord2ToTwglVec2(coord: Coord2): Array<number> {
// 	return [coord.x, coord.y];
// }
function coord3ToTwglVec3(coord: Coord3): Array<number> {
	return [coord.x, coord.y, coord.z];
}
export function meshToWebglArrays(mesh: TriangleSoup): twgl.Arrays {
	const vertices: Array<Vertex> = [];
	const indices: Array<number> = [];

	for (const triangle of mesh) {
		for (const vertex of triangle) {
			const index = vertices.indexOf(vertex);
			if (index != -1) {
				indices.push(index);
			} else {
				indices.push(vertices.push(vertex) - 1);
			}
		}
	}

	return {
		position: {
			numComponents: 3,
			data: vertices
				.map(vertex => vertex.position)
				.map(coord3ToTwglVec3)
				.reduce((soFar, current) => {
					soFar.push(...current);
					return soFar;
				}, []),
		},
		normal: {
			numComponents: 3,
			data: vertices
				.map(vertex => vertex.normal)
				.map(coord3ToTwglVec3)
				.reduce((soFar, current) => {
					soFar.push(...current);
					return soFar;
				}, []),
		},
		texCoord: {
			numComponents: 3,
			data: vertices
				.map(vertex => vertex.texCoord)
				.map(coord3ToTwglVec3)
				.reduce((soFar, current) => {
					soFar.push(...current);
					return soFar;
				}, []),
		},
		indices: { numComponents: 3, data: indices },
	};
}

export function axisRotate(axis: Coord3, coord: Coord3, angleInDeg: number) {
	return twglVec3ToCoord3(
		twgl.m4.transformPoint(
			twgl.m4.axisRotate(
				twgl.m4.identity(),
				coord3ToTwglVec3(axis),
				angleInDeg / 360 * 2 * Math.PI,
			),
			coord3ToTwglVec3(coord),
		),
	);
}

function twglVec3ToCoord3(coord: twgl.Vec3): Coord3 {
	return new Coord3({ x: coord[0], y: coord[1], z: coord[2] });
}
