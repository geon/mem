import { Coord2 } from "./Coord2";
import * as twgl from "twgl.js";
import { meshToWebglArrays, makeTesselatedSphereMesh } from "./functions";
import { Board } from "./Board";
import { vertexShader, fragmentShader } from "./shaders";
import { textureInfo } from "./textures";

export class Renderer {
	gl: WebGLRenderingContext;
	programInfo: twgl.ProgramInfo;
	textures: {
		[key: string]: WebGLTexture;
	};
	ballArrays: twgl.Arrays;
	bufferInfo: twgl.BufferInfo;

	constructor(canvas: HTMLCanvasElement) {
		this.gl = canvas.getContext("webgl")!;

		const program = twgl.createProgramFromSources(this.gl, [
			vertexShader,
			fragmentShader,
		]);

		this.programInfo = twgl.createProgramInfoFromProgram(this.gl, program);

		this.ballArrays = meshToWebglArrays(makeTesselatedSphereMesh(0.4, 8));
		this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, this.ballArrays);

		twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);

		this.textures = twgl.createTextures(this.gl, textureInfo(this.gl));

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.useProgram(this.programInfo.program);

		twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);

		const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
		const boardWidth = Board.size.x + 2;
		const boardHeight = Board.size.y + 2;
		const halfVisibleWidth = Math.max(boardWidth, boardWidth * aspect) / 2;
		const halfVisibleHeight = Math.max(boardHeight, boardHeight / aspect) / 2;
		const zNear = 0.5;
		const zFar = 30;
		const projection = twgl.m4.ortho(
			-halfVisibleWidth,
			halfVisibleWidth,
			-halfVisibleHeight,
			halfVisibleHeight,
			zNear,
			zFar,
		);
		const eye = [1, 4, 12];
		const target = [0, 0, 0];
		const up = [0, 1, 0];

		const camera = twgl.m4.lookAt(eye, target, up);
		const view = twgl.m4.inverse(camera);
		const viewProjection = twgl.m4.multiply(projection, view);
		const world = twgl.m4.rotationY(0);

		twgl.setUniforms(this.programInfo, {
			u_lightWorldPos: [-4, 8, 10],
			u_lightColor: [1, 0.8, 0.8, 1],
			u_ambient: [0.5, 0.5, 0.5, 1],
			u_specular: [0.5, 0.5, 0.5, 1],
			u_shininess: 50,
			u_specularFactor: 1,
			u_viewInverse: camera,
			u_world: world,
			u_worldInverseTranspose: twgl.m4.transpose(twgl.m4.inverse(world)),
			u_worldViewProjection: twgl.m4.multiply(viewProjection, world),
		});

		this.clear();
	}

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	draw(color: number, position: Coord2) {
		const model = twgl.m4.multiply(
			twgl.m4.translation([position.x, position.y, 0, 0]),
			twgl.m4.multiply(
				twgl.m4.rotationY(new Date().getTime() / 1000),
				twgl.m4.rotationX(new Date().getTime() / 1341),
			),
		);

		twgl.setUniforms(this.programInfo, {
			u_model: model,
			u_diffuseMap: this.textures[
				Object.keys(this.textures)[color % Object.keys(this.textures).length]
			],
		});

		twgl.drawBufferInfo(this.gl, this.bufferInfo);
	}
}
