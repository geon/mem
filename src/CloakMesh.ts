import { Coord3 } from "./Coord3";
import { axisRotate, meshToWebglArrays } from "./functions";
import * as twgl from "twgl.js";

interface Vertex {
	position: Coord3;
	normal: Coord3;
	texCoord: Coord3;
}
type Triangle = [Vertex, Vertex, Vertex];
type MutableTriangleSoup = Array<Triangle>;

// TODO: Rewrite to keep a twgl.createAugmentedTypedArray and update it with new data.
export class CloakMesh {
	triangles: twgl.Arrays;
	uTesselation: number;
	vTesselation: number;
	innerRadius: number;
	thickness: number;

	constructor(innerRadius: number, thickness: number, uTesselation: number) {
		this.uTesselation = uTesselation;
		this.vTesselation = uTesselation * 4;
		this.innerRadius = innerRadius;
		this.thickness = thickness;
	}

	tesselate(_cloakFactor: number): twgl.Arrays {
		const posY = new Coord3({ x: 0, y: 1, z: 0 });
		const negX = new Coord3({ x: -1, y: 0, z: 0 });
		const posZ = new Coord3({ x: 0, y: 0, z: 1 });
		const startingPoint = negX.scaled(this.innerRadius + this.thickness);

		const triangles: MutableTriangleSoup = [];

		const sphereVertices: Array<Array<Vertex>> = [];

		// Half sphere - cap.
		{
			for (let v = 0; v <= this.vTesselation; ++v) {
				const vFactor = v / this.vTesselation;

				sphereVertices[v] = [];
				for (let u = 0; u <= this.uTesselation; ++u) {
					const uFactor = u / this.uTesselation;

					const position = axisRotate(
						negX,
						axisRotate(posY, startingPoint, uFactor * 90),
						vFactor * 360,
					);

					const normal = position.normalized();

					sphereVertices[v][u] = {
						position,
						normal,
						texCoord: normal,
					};
				}
			}
			for (let v = 0; v < this.vTesselation; ++v) {
				for (let u = 0; u < this.uTesselation; ++u) {
					triangles.push([
						sphereVertices[v + 0][u + 0],
						sphereVertices[v + 0][u + 1],
						sphereVertices[v + 1][u + 0],
					]);
					triangles.push([
						sphereVertices[v + 1][u + 0],
						sphereVertices[v + 0][u + 1],
						sphereVertices[v + 1][u + 1],
					]);
				}
			}
		}

		// Cap.
		{
			const startingNormal = startingPoint.normalized();
			const startingVertex = {
				position: startingPoint,
				normal: startingNormal,
				texCoord: startingNormal,
			};
			for (let i = 0; i < this.vTesselation; ++i) {
				triangles.push([
					sphereVertices[i][0],
					sphereVertices[i + 1][0],
					startingVertex,
				]);
			}
		}

		// Rim
		{
			const rimRadius = this.thickness / 2;
			const rimCenter = posZ.scaled(this.innerRadius + rimRadius);

			const rimVertices: Array<Array<Vertex>> = [];
			const rimTesselation = this.uTesselation;
			for (let v = 0; v <= this.vTesselation; ++v) {
				const vFactor = v / this.vTesselation;

				rimVertices[v] = [];
				for (let u = 0; u <= rimTesselation; ++u) {
					const uFactor = u / rimTesselation;

					const position = axisRotate(
						negX,
						Coord3.add(
							axisRotate(posY, posZ.scaled(rimRadius), uFactor * 180),
							rimCenter,
						),
						vFactor * 360,
					);

					const normal = axisRotate(
						negX,
						axisRotate(posY, posZ.scaled(rimRadius), uFactor * 180),
						vFactor * 360,
					);

					rimVertices[v][u] = {
						position,
						normal,
						texCoord: normal,
					};
				}
			}
			for (let v = 0; v < this.vTesselation; ++v) {
				for (let u = 0; u < rimTesselation; ++u) {
					triangles.push([
						rimVertices[v + 0][u + 0],
						rimVertices[v + 0][u + 1],
						rimVertices[v + 1][u + 0],
					]);
					triangles.push([
						rimVertices[v + 1][u + 0],
						rimVertices[v + 0][u + 1],
						rimVertices[v + 1][u + 1],
					]);
				}
			}
		}

		return meshToWebglArrays(triangles);
	}
}
