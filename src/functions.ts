// import { Coord2 } from "./Coord2";
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
	// texcoord: Coord2;
}
interface Mesh {
	vertices: ReadonlyArray<Vertex>;
	indices: ReadonlyArray<number>;
}
interface MutableMesh {
	vertices: Array<Vertex>;
	indices: Array<number>;
}
export function makeTesselatedCubeMesh(tesselation: number): Mesh {
	function makeSide(uAxis: Coord3, vAxis: Coord3, normal: Coord3): Mesh {
		const vertices: Array<Vertex> = [];
		const indices: Array<number> = [];

		for (let v = 0; v <= tesselation; ++v) {
			const vFactor = v / tesselation;

			for (let u = 0; u <= tesselation; ++u) {
				const uFactor = u / tesselation;

				vertices.push({
					position: Coord3.add(
						Coord3.add(
							uAxis.scaled(-1 + 2 * uFactor),
							vAxis.scaled(-1 + 2 * vFactor),
						),
						normal,
					),
					normal: normal,
					// texcoord: new Coord2({ x: -1, y: -1 }),
				});
			}
		}

		for (let v = 0; v < tesselation; ++v) {
			for (let u = 0; u < tesselation; ++u) {
				const i = u + v * (tesselation + 1);
				indices.push(i, i + 1, i + (tesselation + 1));
				indices.push(i + 1, i + 1 + (tesselation + 1), i + (tesselation + 1));
			}
		}

		return {
			vertices,
			indices,
		};
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

	return mergeMeshes(
		sideArguments.map(({ uAxis, vAxis, normal }) =>
			makeSide(uAxis, vAxis, normal),
		),
	);
}
function mergeMeshes(meshes: ReadonlyArray<Mesh>): Mesh {
	let indexStart = 0;
	return meshes.reduce(
		(soFar: MutableMesh, current) => {
			soFar.vertices.push(...current.vertices);
			soFar.indices.push(...current.indices.map(index => index + indexStart));
			indexStart += current.vertices.length;
			return soFar;
		},
		{
			vertices: [],
			indices: [],
		} as MutableMesh,
	);
}

export function makeTesselatedSphereMesh(tesselation: number): Mesh {
	const mesh = makeTesselatedCubeMesh(tesselation) as MutableMesh;

	mesh.vertices = mesh.vertices.map(vertex => {
		const normalizedPosition = vertex.position.normalized();
		return {
			position: normalizedPosition,
			normal: normalizedPosition,
			// texcoord: vertex.texcoord,
		};
	});

	return mesh;
}

// function coord2ToTwglVec2(coord: Coord2): Array<number> {
// 	return [coord.x, coord.y];
// }
function coord3ToTwglVec3(coord: Coord3): Array<number> {
	return [coord.x, coord.y, coord.z];
}
export function meshToWebglArrays(mesh: Mesh): { [key: string]: number[] } {
	return {
		position: mesh.vertices
			.map(vertex => vertex.position)
			.map(coord3ToTwglVec3)
			.reduce((soFar, current) => {
				soFar.push(...current);
				return soFar;
			}, []),
		normal: mesh.vertices
			.map(vertex => vertex.normal)
			.map(coord3ToTwglVec3)
			.reduce((soFar, current) => {
				soFar.push(...current);
				return soFar;
			}, []),
		// texcoords: mesh.vertices
		// 	.map(vertex => vertex.texcoord)
		// 	.map(coord2ToTwglVec2)
		// 	.reduce((soFar, current) => {
		// 		soFar.push(...current);
		// 		return soFar;
		// 	}, []),
		indices: mesh.indices as Array<number>,
	};
}
