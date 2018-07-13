import * as twgl from "twgl.js";
import { Coord3 } from "./Coord3";

interface Vertex {
	position: Coord3;
	normal: Coord3;
	texCoord: Coord3;
}

type Triangle = [Vertex, Vertex, Vertex];

export class TriangleSoup {
	arrays: twgl.Arrays;

	positions: twgl.primitives.AugmentedTypedArray;
	normals: twgl.primitives.AugmentedTypedArray;
	texCoords: twgl.primitives.AugmentedTypedArray;

	constructor(numTriangles: number) {
		const numComponents = 3;
		const numVertices = numTriangles * 3;

		this.positions = twgl.primitives.createAugmentedTypedArray(
			numComponents,
			numVertices,
		);
		this.texCoords = twgl.primitives.createAugmentedTypedArray(
			numComponents,
			numVertices,
		);
		this.normals = twgl.primitives.createAugmentedTypedArray(
			numComponents,
			numVertices,
		);

		this.arrays = {
			position: {
				numComponents,
				data: this.positions.buffer as ArrayBuffer,
			},
			texCoord: {
				numComponents,
				data: this.texCoords.buffer as ArrayBuffer,
			},
			normal: { numComponents, data: this.normals.buffer as ArrayBuffer },
		};
	}

	push(triangle: Triangle) {
		for (const vertex of triangle) {
			this.positions.push(
				vertex.position.x,
				vertex.position.y,
				vertex.position.z,
			);
			this.texCoords.push(
				vertex.texCoord.x,
				vertex.texCoord.y,
				vertex.texCoord.z,
			);
			this.normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
		}
	}
}
