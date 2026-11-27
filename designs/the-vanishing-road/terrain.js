import * as THREE from 'three';
import { roadPosition, smoothstep } from './tide.js';

const WORLD_X = 48;
const WORLD_Z = 32;
const DETAIL_X = 256;
const DETAIL_Z = 192;
const ROUTE_STEPS = 160;
const LANTERN = { x: 9.65, z: -1.6 };

function randomAt(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function noise(x, z) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const u = smoothstep(0, 1, x - i);
  const v = smoothstep(0, 1, z - j);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(randomAt(i, j), randomAt(i + 1, j), u),
    THREE.MathUtils.lerp(randomAt(i, j + 1), randomAt(i + 1, j + 1), u), v,
  );
}

function headland(x, z, cx, cz, rx, rz) {
  const nx = (x - cx) / rx;
  const nz = (z - cz) / rz;
  const angle = Math.atan2(nz, nx);
  const edge = 1 - Math.hypot(nx, nz) + .085 * Math.sin(angle * 5 + 1.8) + .055 * Math.cos(angle * 9);
  const grade = smoothstep(-.32, .44, edge);
  const summit = 1.45 * smoothstep(.22, .9, edge);
  const crags = (noise(x * 1.45, z * 1.45) - .48) * 1.24 + (noise(x * 4.4, z * 4.4) - .5) * .48;
  return -3.15 + 8.65 * grade + summit + crags * smoothstep(-.26, .06, edge);
}

function groundHeight(x, z) {
  const mainland = headland(x, z, -15.4, 3.15, 9.8, 7.0);
  const island = headland(x, z, 9.75, -1.7, 4.8, 4.2);
  const skerry = headland(x, z, 11.85, -6.35, 1.65, 1.0) * .65 - .65;
  const sandbar = -3.1 + 2.0 * Math.exp(-((z + .33 * x) ** 2) / 4.25) + .35 * noise(.35 * x, .35 * z);
  const height = Math.max(mainland, island, skerry, sandbar);
  const progress = (x + 9.1) / 16.25;
  if (progress < 0 || progress > 1) return height;
  const road = roadPosition(progress);
  const shoulder = 1 - smoothstep(.27, 1.0, Math.abs(z - road.z));
  const causewayBase = road.y - .45 - 2.2 * smoothstep(.2, .98, Math.abs(z - road.z));
  return THREE.MathUtils.lerp(height, causewayBase, shoulder);
}

function buildLand(scene) {
  const geometry = new THREE.PlaneGeometry(WORLD_X, WORLD_Z, DETAIL_X, DETAIL_Z);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    positions.setY(i, groundHeight(positions.getX(i), positions.getZ(i)));
  }
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const colors = new Float32Array(positions.count * 3);
  const sand = new THREE.Color('#b3a781');
  const granite = new THREE.Color('#777565');
  const grass = new THREE.Color('#85834d');
  const heath = new THREE.Color('#b2a564');
  const seabed = new THREE.Color('#276253');
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const fleck = noise(x * 2.8, z * 2.8);
    const slope = normals.getY(i);
    color.copy(grass).lerp(heath, noise(x * .8, z * .8) * .9)
      .lerp(granite, (1 - smoothstep(.55, .91, slope)) * smoothstep(1.4, 3.6, y))
      .lerp(sand, (1 - smoothstep(.45, 3.1, y)) * (.55 + .45 * slope))
      .lerp(seabed, (1 - smoothstep(-2.0, .3, y)) * .85)
      .multiplyScalar(.78 + .35 * fleck + .06 * Math.sin(y * 18 + noise(x, z) * 5));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .94 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 mineral;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nmineral = position;');
    shader.fragmentShader = `varying vec3 mineral;\n${shader.fragmentShader}`.replace('#include <color_fragment>', `
      #include <color_fragment>
      float grit = fract(sin(dot(floor(mineral * 87.0), vec3(37.31, 91.7, 13.7))) * 27439.31);
      diffuseColor.rgb *= 0.89 + grit * 0.22;
    `);
  };
  scene.add(new THREE.Mesh(geometry, material));
}

function addDetails(scene) {
  const rock = new THREE.DodecahedronGeometry(1, 0);
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: '#938c71', roughness: 1, flatShading: true });
  const rocks = new THREE.InstancedMesh(rock, stoneMaterial, 720);
  const tufts = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#95884c', roughness: 1, flatShading: true }), 1100);
  const dummy = new THREE.Object3D();
  const shade = new THREE.Color();
  let rockIndex = 0;
  let tuftIndex = 0;
  for (let i = 0; i < 7200; i++) {
    const x = -22 + randomAt(i, 114) * 37;
    const z = -8.4 + randomAt(i, 222) * 18.5;
    const y = groundHeight(x, z);
    const t = (x + 9.1) / 16.25;
    if (t >= 0 && t <= 1 && Math.abs(z - roadPosition(t).z) < .55) continue;
    if (Math.hypot(x - LANTERN.x, z - LANTERN.z) < .65) continue;
    const radius = randomAt(i, 37);
    dummy.position.set(x, y - .015, z);
    dummy.rotation.set(randomAt(i, 3), i * .618, randomAt(i, 18));
    if (rockIndex < rocks.count && y > -.25 && (y < 4.65 || radius > .92)) {
      const size = .068 + radius ** 5 * .39;
      dummy.scale.set(size * (1.1 + radius), size * .57, size * .91);
      dummy.updateMatrix();
      shade.setScalar(.63 + radius * .52);
      rocks.setMatrixAt(rockIndex, dummy.matrix);
      rocks.setColorAt(rockIndex++, shade);
    }
    if (tuftIndex < tufts.count && y > 3.45 && noise(x * 1.4, z * 1.4) > .34) {
      const size = .025 + radius ** 2 * .105;
      dummy.rotation.set(.13, i * .618, .11);
      dummy.scale.set(size, size * 1.65, size * .83);
      dummy.updateMatrix();
      shade.setScalar(.52 + randomAt(i, 42) * .62);
      tufts.setMatrixAt(tuftIndex, dummy.matrix);
      tufts.setColorAt(tuftIndex++, shade);
    }
  }
  rocks.count = rockIndex;
  tufts.count = tuftIndex;
  scene.add(rocks, tufts);
}

function ribbon(scene, width, top, lower = null) {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= ROUTE_STEPS; i++) {
    const p = roadPosition(i / ROUTE_STEPS);
    positions.push(p.x, p.y + top, p.z - width, p.x, p.y + top, p.z + width);
    if (lower !== null) positions.push(p.x, p.y + lower, p.z - width, p.x, p.y + lower, p.z + width);
    if (i === ROUTE_STEPS) continue;
    const step = lower === null ? 2 : 4;
    const a = i * step;
    const b = a + step;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
    if (lower !== null) indices.push(a, b, a + 2, a + 2, b, b + 2, a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: lower === null ? '#b8a87d' : '#706a55', roughness: .92, side: THREE.DoubleSide })));
}

function buildCauseway(scene) {
  ribbon(scene, .34, -.05, -1.9);
  ribbon(scene, .265, 0);
  const edges = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#978b70', roughness: 1 }), 160);
  const dummy = new THREE.Object3D();
  const shade = new THREE.Color();
  for (let i = 0; i < edges.count; i++) {
    const p = roadPosition((Math.floor(i / 2) + .5) / (edges.count / 2));
    const offset = i % 2 ? -.30 : .30;
    const variation = randomAt(i, 20);
    dummy.position.set(p.x, p.y - .025, p.z + offset);
    dummy.rotation.set(0, .12 + variation * .25, .05 * variation);
    dummy.scale.set(.175 + variation * .04, .1 + variation * .07, .09 + variation * .045);
    dummy.updateMatrix();
    edges.setMatrixAt(i, dummy.matrix);
    edges.setColorAt(i, shade.setScalar(.83 + .25 * variation));
  }
  scene.add(edges);

  const dry = new Float32Array(ROUTE_STEPS * 18);
  const wet = new Float32Array(ROUTE_STEPS * 18);
  function trace(color, positions, order) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return geometry;
  }
  const dryTrace = trace('#fae2a2', dry, 0);
  const wetTrace = trace('#ffa68b', wet, 3);

  function segment(array, count, a, b, aY, bY, half) {
    array.set([
      a.x, aY, a.z - half, a.x, aY, a.z + half, b.x, bY, b.z - half,
      b.x, bY, b.z - half, a.x, aY, a.z + half, b.x, bY, b.z + half,
    ], count * 18);
  }

  return level => {
    let drySegments = 0;
    let wetSegments = 0;
    for (let i = 0; i < ROUTE_STEPS; i++) {
      const a = roadPosition(i / ROUTE_STEPS);
      const b = roadPosition((i + 1) / ROUTE_STEPS);
      if ((a.y + b.y) / 2 > level) segment(dry, drySegments++, a, b, a.y + .018, b.y + .018, .036);
      else if (i % 6 < 3) segment(wet, wetSegments++, a, b, level + .026, level + .026, .052);
    }
    dryTrace.setDrawRange(0, drySegments * 6);
    wetTrace.setDrawRange(0, wetSegments * 6);
    dryTrace.attributes.position.needsUpdate = true;
    wetTrace.attributes.position.needsUpdate = true;
  };
}

function buildLighthouse(scene) {
  const lighthouse = new THREE.Group();
  lighthouse.position.set(LANTERN.x, groundHeight(LANTERN.x, LANTERN.z) - .10, LANTERN.z);
  scene.add(lighthouse);
  const chalk = new THREE.MeshStandardMaterial({ color: '#e7dfbf', roughness: .72 });
  const red = new THREE.MeshStandardMaterial({ color: '#a7452f', roughness: .62 });
  const iron = new THREE.MeshStandardMaterial({ color: '#283e35', roughness: .76 });
  const glass = new THREE.MeshStandardMaterial({ color: '#b7dbad', emissive: '#597549', emissiveIntensity: .25, roughness: .4 });
  const stone = new THREE.MeshStandardMaterial({ color: '#8c8c72', roughness: 1 });
  function part(geometry, material, x, y, z, group = lighthouse) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    group.add(item);
    return item;
  }
  const cylinder = (top, base, height, material, y) => part(new THREE.CylinderGeometry(top, base, height, 24), material, 0, y, 0);
  cylinder(.55, .60, .23, stone, .08);
  cylinder(.285, .41, 2.22, chalk, 1.18);
  cylinder(.322, .342, .36, red, 1.58);
  cylinder(.455, .37, .16, iron, 2.28);
  cylinder(.447, .447, .047, chalk, 2.38);
  cylinder(.258, .273, .44, glass, 2.61);
  cylinder(.07, .34, .32, red, 2.98);
  cylinder(.038, .038, .17, iron, 3.18);
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    part(new THREE.BoxGeometry(.025, .46, .025), iron, Math.cos(angle) * .269, 2.61, Math.sin(angle) * .269);
    part(new THREE.BoxGeometry(.017, .19, .017), iron, Math.cos(angle) * .425, 2.48, Math.sin(angle) * .425);
  }
  const rail = part(new THREE.TorusGeometry(.425, .014, 6, 28), iron, 0, 2.56, 0);
  rail.rotation.x = Math.PI / 2;
  part(new THREE.BoxGeometry(.17, .38, .06), iron, 0, .37, .39);
  part(new THREE.BoxGeometry(.112, .14, .06), iron, .045, 1.08, .355);

  const cottage = new THREE.Group();
  cottage.position.set(10.8, groundHeight(10.8, -.22) - .18, -.22);
  cottage.rotation.y = -.36;
  scene.add(cottage);
  part(new THREE.BoxGeometry(.92, .66, .69), chalk, 0, .33, 0, cottage);
  const roof = part(new THREE.CylinderGeometry(.53, .53, 1.02, 3), red, 0, .68, 0, cottage);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.x = -Math.PI / 6;
  roof.scale.x = .55;
  part(new THREE.BoxGeometry(.18, .34, .17), stone, .23, .98, -.12, cottage);
  part(new THREE.BoxGeometry(.15, .23, .02), iron, -.19, .33, .352, cottage);
  part(new THREE.BoxGeometry(.19, .37, .02), iron, .23, .247, .35, cottage);
}

function buildTideGauge(scene) {
  const position = roadPosition(.485);
  const unit = new THREE.CylinderGeometry(.028, .028, .17, 8);
  const paint = [new THREE.MeshStandardMaterial({ color: '#f8eac9' }), new THREE.MeshStandardMaterial({ color: '#ba4c35' })];
  for (let i = 0; i < 15; i++) {
    const strip = new THREE.Mesh(unit, paint[i % 2]);
    strip.position.set(position.x, position.y + i * .17 - .37, position.z + .52);
    scene.add(strip);
  }
}

function waterDepthTexture() {
  const width = 512;
  const height = 384;
  const data = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    const z = WORLD_Z * ((row + .5) / height - .5);
    for (let col = 0; col < width; col++) {
      const x = WORLD_X * ((col + .5) / width - .5);
      let y = groundHeight(x, z);
      const t = (x + 9.1) / 16.25;
      if (t >= 0 && t <= 1) {
        const road = roadPosition(t);
        if (Math.abs(z - road.z) < .34) y = Math.max(y, road.y);
      }
      data[row * width + col] = Math.round(255 * THREE.MathUtils.clamp((y + 4) / 14, 0, 1));
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RedFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function buildWater(scene) {
  const uniforms = {
    bathymetry: { value: waterDepthTexture() },
    level: { value: 0 },
    phase: { value: 0 },
    deep: { value: new THREE.Color('#174b48') },
    basin: { value: new THREE.Color('#238178') },
    shallow: { value: new THREE.Color('#86be9e') },
    foam: { value: new THREE.Color('#d2e6bd') },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      varying vec2 world;
      void main() {
        world = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D bathymetry;
      uniform float level, phase;
      uniform vec3 deep, basin, shallow, foam;
      varying vec2 world;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(21.71, 79.1))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+1.0),f.x),f.y);
      }
      void main() {
        vec2 uv = world / vec2(48.0, 32.0) + 0.5;
        float bottom = texture2D(bathymetry,uv).r * 14.0 - 4.0;
        float depth = max(0.0, level - bottom);
        float swell = noise(world * vec2(.72, 1.85) + vec2(phase * .036, -.06 * phase));
        float wash = noise(world * vec2(.24, .34));
        float ripple = sin(world.y * 19.0 + world.x * 2.3 + swell * 8.0 + phase * .20);
        float crossRipple = sin(world.y * 31.0 - world.x * 4.0 + wash * 14.0 - phase * .16);
        float wind = smoothstep(.42,.92,swell) * smoothstep(.2,1.1,ripple + crossRipple * .31);
        vec3 color = mix(basin, deep, smoothstep(1.35, 5.7, depth + wash * .8));
        color = mix(color, shallow, (1.0 - smoothstep(.12, 1.85, depth)) * (.8 + .2 * wash));
        color = mix(color, foam, wind * .095 + .52 * (1.0 - smoothstep(.02,.13,depth)) * (.35 + .65 * swell));
        float contour = smoothstep(.93,.993,cos((bottom + .035 * swell) * 10.0));
        color += contour * smoothstep(.25, .8, depth) * (1.0 - smoothstep(2.6, 4.6, depth)) * .021;
        color *= .88 + .24 * wash + .065 * swell;
        gl_FragColor = vec4(color, mix(.63, 1.0, smoothstep(.0, 2.5, depth)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(96, 96);
  geometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(geometry, material);
  water.renderOrder = 2;
  scene.add(water);
  return (level, minutes) => {
    water.position.y = level;
    uniforms.level.value = level;
    uniforms.phase.value = minutes;
  };
}

export function createTerrain(container, onProject, onLost) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setClearColor('#245b55');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', onLost);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#edede1', '#535d4c', 1.7));
  const sun = new THREE.DirectionalLight('#fff1c1', 2.0);
  sun.position.set(-9, 15, -4);
  scene.add(sun);
  buildLand(scene);
  addDetails(scene);
  const updateRoute = buildCauseway(scene);
  buildLighthouse(scene);
  buildTideGauge(scene);
  const updateWater = buildWater(scene);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 150);
  const left = roadPosition(.065);
  const low = roadPosition(.484);
  const vector = new THREE.Vector3();
  const north = new THREE.Vector3();
  let renderWidth = 0;
  let renderHeight = 0;
  function draw(level, minutes, plan) {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    const aspect = width / height;
    const span = Math.max(11.5, 27.8 / aspect, Math.min(21.6, (WORLD_X - 1) / aspect));
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.position.set(plan ? .6 : 3.6, plan ? 45 : 29, plan ? .22 : 34);
    camera.lookAt(.6, aspect > 1.65 && !plan ? 4.15 : 1.9, .2);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (width !== renderWidth || height !== renderHeight) {
      renderer.setSize(width, height, false);
      renderWidth = width;
      renderHeight = height;
    }
    updateRoute(level);
    updateWater(level, minutes);
    renderer.render(scene, camera);

    const anchor = (x, y, z) => {
      vector.set(x, y, z).project(camera);
      return [(vector.x + 1) * 50, (1 - vector.y) * 50];
    };
    const landmarks = {
      mainland: anchor(left.x - .95, Math.max(left.y, level) + .35, left.z),
      island: anchor(LANTERN.x, groundHeight(LANTERN.x, LANTERN.z) + (plan ? .2 : 3.4), LANTERN.z),
      saddle: anchor(low.x, Math.max(low.y, level) + .12, low.z),
    };
    vector.set(0, 0, 0).project(camera);
    north.set(0, 0, -4).project(camera);
    onProject(landmarks, Math.atan2((north.x - vector.x) * width, (north.y - vector.y) * height) * 180 / Math.PI);
  }
  return { draw };
}
