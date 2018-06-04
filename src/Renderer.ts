import { Coord2 } from "./Coord2";
import * as twgl from "twgl.js";
import { meshToWebglArrays, makeTesselatedSphereMesh } from "./functions";
import { Board } from "./Board";

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
		this.ballArrays = meshToWebglArrays(makeTesselatedSphereMesh(0.4, 8));
		this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, this.ballArrays);

		twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);

		const program = twgl.createProgramFromSources(this.gl, [
			`
			uniform mat4 u_worldViewProjection;
			uniform vec3 u_lightWorldPos;
			uniform mat4 u_world;
			uniform mat4 u_model;
			uniform mat4 u_viewInverse;
			uniform mat4 u_worldInverseTranspose;

			attribute vec4 position;
			attribute vec3 normal;
			attribute vec3 texCoord;

			varying vec4 v_position;
			varying vec3 v_normal;
			varying vec3 v_texCoord;
			varying vec3 v_surfaceToLight;
			varying vec3 v_surfaceToView;

			void main() {
				v_position = u_worldViewProjection * u_model * position;
				v_normal = (u_worldInverseTranspose * u_model * vec4(normal, 0)).xyz;
				v_texCoord = texCoord;
				v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
				v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
				gl_Position = v_position;
			}
		`,
			`
			precision mediump float;

			varying vec4 v_position;
			varying vec3 v_normal;
			varying vec3 v_texCoord;
			varying vec3 v_surfaceToLight;
			varying vec3 v_surfaceToView;

			uniform vec4 u_lightColor;
			uniform vec4 u_ambient;
			uniform vec4 u_specular;
			uniform float u_shininess;
			uniform float u_specularFactor;
			uniform samplerCube u_diffuseMap;

			vec4 lit(float l ,float h, float m) {
				return vec4(
					1.0,
					max(l, 0.0),
					(l > 0.0) ? pow(max(0.0, h), m) : 0.0,
					1.0
				);
			}

			void main() {
				vec4 diffuseColor = textureCube(u_diffuseMap, normalize(v_texCoord));
				vec3 a_normal = normalize(v_normal);
				vec3 surfaceToLight = normalize(v_surfaceToLight);
				vec3 surfaceToView = normalize(v_surfaceToView);
				vec3 halfVector = normalize(surfaceToLight + surfaceToView);
				vec4 litR = lit(
					dot(a_normal, surfaceToLight),
					dot(a_normal, halfVector),
					u_shininess
				);
				vec4 outColor = vec4(
					(u_lightColor * (
						diffuseColor * litR.y + diffuseColor * u_ambient +
						u_specular * litR.z * u_specularFactor
					)).rgb,
					diffuseColor.a
				);
				gl_FragColor = outColor;
			}
		`,
		]);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);

		this.textures = twgl.createTextures(this.gl, {
			earth: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/earth.jpg",
			},
			globe: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/globe.jpg",
			},
			eye: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/eye.jpg",
			},
			oneBall: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/1-ball.jpg",
			},
			thirteenBall: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/13-ball.jpg",
			},
			volley: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/volley.jpg",
			},
			tennis: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/tennis.jpg",
			},
			soccer: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/soccer.jpg",
			},
			animator: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/animator.jpg",
			},
			jupiter: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/jupiter.jpg",
			},
			poke: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/poke.png",
			},
			balance: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/balance.jpg",
			},
			basket: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/basket.jpg",
			},
			hidden: {
				target: this.gl.TEXTURE_CUBE_MAP,
				src: "graphics/hidden.jpg",
			},
		});

		this.programInfo =
			program && twgl.createProgramInfoFromProgram(this.gl, program)!;

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
