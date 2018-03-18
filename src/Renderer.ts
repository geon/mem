import { Coord2 } from "./Coord2";
import * as twgl from "twgl.js";
import { meshToWebglArrays, makeTesselatedSphereMesh } from "./functions";

const canvas = document.getElementsByTagName("canvas")[0] as HTMLCanvasElement;
export const gl = canvas.getContext("webgl") as WebGLRenderingContext;

let program: WebGLProgram | undefined;
let textures: {
	[key: string]: WebGLTexture;
};

export function init() {
	twgl.resizeCanvasToDisplaySize(canvas, window.devicePixelRatio);

	program = twgl.createProgramFromSources(gl, [
		`
			uniform mat4 u_worldViewProjection;
			uniform vec3 u_lightWorldPos;
			uniform mat4 u_world;
			uniform mat4 u_model;
			uniform mat4 u_viewInverse;
			uniform mat4 u_worldInverseTranspose;
			uniform vec4 u_position;

			attribute vec4 position;
			attribute vec3 normal;
			attribute vec3 texCoord;

			varying vec4 v_position;
			varying vec3 v_normal;
			varying vec3 v_texCoord;
			varying vec3 v_surfaceToLight;
			varying vec3 v_surfaceToView;

			void main() {
				v_position = u_worldViewProjection * ((u_model * position) + u_position);
				v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
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

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	textures = twgl.createTextures(gl, {
		earth: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/earth.jpg",
		},
		globe: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/globe.jpg",
		},
		eye: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/eye.jpg",
		},
		oneBall: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/1-ball.jpg",
		},
		thirteenBall: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/13-ball.jpg",
		},
		volley: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/volley.jpg",
		},
		tennis: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/tennis.jpg",
		},
		soccer: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/soccer.jpg",
		},
		animator: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/animator.jpg",
		},
		jupiter: {
			target: gl.TEXTURE_CUBE_MAP,
			src: "graphics/jupiter.jpg",
		},
	});

	clear();
}

const ballArrays = meshToWebglArrays(makeTesselatedSphereMesh(0.4, 8));
const bufferInfo = twgl.createBufferInfoFromArrays(gl, ballArrays);

export function clear() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function draw(color: number, position: Coord2) {
	const programInfo =
		program! && twgl.createProgramInfoFromProgram(gl, program!);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.useProgram(programInfo.program);

	twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

	const fov = 30 * Math.PI / 180;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.5;
	const zFar = 30;
	const projection = twgl.m4.perspective(fov, aspect, zNear, zFar);
	const eye = [1, 4, 12];
	const target = [0, 0, 0];
	const up = [0, 1, 0];

	const camera = twgl.m4.lookAt(eye, target, up);
	const view = twgl.m4.inverse(camera);
	const viewProjection = twgl.m4.multiply(projection, view);
	const world = twgl.m4.rotationY(0);
	const model = twgl.m4.rotationY(new Date().getTime() / 1000);

	const uniforms: any = {
		u_lightWorldPos: [-4, 8, 10],
		u_lightColor: [1, 0.8, 0.8, 1],
		u_ambient: [0.5, 0.5, 0.5, 1],
		u_specular: [0.5, 0.5, 0.5, 1],
		u_shininess: 50,
		u_specularFactor: 1,
		u_diffuseMap:
			textures[Object.keys(textures)[color % Object.keys(textures).length]],
		u_position: [position.x, position.y, 0, 0],
	};

	uniforms.u_viewInverse = camera;
	uniforms.u_world = world;
	uniforms.u_model = model;
	uniforms.u_worldInverseTranspose = twgl.m4.transpose(twgl.m4.inverse(world));
	uniforms.u_worldViewProjection = twgl.m4.multiply(viewProjection, world);

	twgl.setUniforms(programInfo, uniforms);

	twgl.drawBufferInfo(gl, bufferInfo);
}
