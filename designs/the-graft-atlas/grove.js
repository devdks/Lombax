import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { gsap } from 'gsap'
import { random, hash } from './ink.js'

const vec = (x, y, z) => new T.Vector3(x, y, z)
const tau = Math.PI * 2
function tube(points, start, end, rng) {
  const curve = new T.CatmullRomCurve3(points),
    rings = 9,
    sides = 9
  const frames = curve.computeFrenetFrames(rings, false),
    pos = [],
    indices = []
  const phase = rng() * tau
  for (let j = 0; j <= rings; j++) {
    const t = j / rings,
      p = curve.getPointAt(t),
      r = T.MathUtils.lerp(start, end, t)
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * tau,
        flute = r * (1 + 0.15 * Math.cos(a * 3 + t * 6 + phase))
      const v = p
        .clone()
        .addScaledVector(frames.normals[j], flute * Math.cos(a))
        .addScaledVector(frames.binormals[j], flute * Math.sin(a))
      pos.push(v.x, v.y, v.z)
      if (j < rings) {
        const i = j * sides + k,
          h = j * sides + ((k + 1) % sides)
        indices.push(i, h, h + sides, i, h + sides, i + sides)
      }
    }
  }
  const geo = new T.BufferGeometry()
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}
function seedFruit() {
  const group = new T.Group()
  const skin = new T.SphereGeometry(0.23, 32, 24),
    position = skin.getAttribute('position'),
    tints = []
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i),
      a = Math.atan2(z, x),
      v = y / 0.23
    const ridge = 1 + 0.045 * Math.cos(a * 6) * (1 - v * v)
    position.setXYZ(i, x * ridge, y * (1 - 0.12 * v * v), z * ridge)
    const hue = (Math.sin(4 * a + v * 3) + 1) * 0.5,
      shade = new T.Color('#8b302b').lerp(new T.Color('#c95b42'), hue * 0.68 + (v + 1) * 0.12)
    tints.push(shade.r, shade.g, shade.b)
  }
  skin.setAttribute('color', new T.Float32BufferAttribute(tints, 3))
  skin.computeVertexNormals()
  group.add(
    new T.Mesh(
      skin,
      new T.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.1,
        emissive: 0x62161a,
        emissiveIntensity: 0.32,
      }),
    ),
  )
  const petals = [],
    sides = 12
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * tau,
      b = ((i + 1) / sides) * tau,
      m = (a + b) * 0.5
    const low = i % 2 === 0 ? -0.296 : -0.248
    petals.push(
      0.047 * Math.cos(a),
      -0.19,
      0.047 * Math.sin(a),
      0.048 * Math.cos(b),
      -0.19,
      0.048 * Math.sin(b),
      0.083 * Math.cos(m),
      low,
      0.083 * Math.sin(m),
    )
  }
  const sepals = new T.BufferGeometry()
  sepals.setAttribute('position', new T.Float32BufferAttribute(petals, 3))
  sepals.computeVertexNormals()
  group.add(new T.Mesh(sepals, new T.MeshStandardMaterial({ color: 0xa45b40, side: T.DoubleSide })))
  return group
}
function tree(seed, variant = 0, young = false) {
  const rng = random(seed),
    bark = [],
    leaves = [],
    colors = [],
    fruit = [],
    grain = []
  const woodColor = variant ? 0x625247 : 0x766353
  function foliage(p, a, length) {
    const across = vec(Math.cos(a + Math.PI / 2), 0.29, Math.sin(a + Math.PI / 2)).multiplyScalar(
      length * 0.16,
    )
    const tip = p
      .clone()
      .add(vec(Math.cos(a) * length, length * (rng() * 0.6 - 0.37), Math.sin(a) * length))
    const mid = p.clone().lerp(tip, 0.55),
      ridge = mid.clone().add(vec(0, 0.065, 0))
    const left = mid.clone().add(across),
      right = mid.clone().sub(across)
    const palette = variant
      ? ['#787950', '#526146', '#7e704d', '#89966a', '#626f57']
      : ['#77886a', '#405e50', '#687d5e', '#a39c6d', '#486351']
    const col = new T.Color(palette[Math.floor(rng() * palette.length)])
    for (const [a, b, c] of [
      [p, left, ridge],
      [left, tip, ridge],
      [tip, right, ridge],
      [right, p, ridge],
    ]) {
      for (const v of [a, b, c]) {
        leaves.push(v.x, v.y, v.z)
        colors.push(col.r, col.g, col.b)
      }
    }
  }
  function grow(base, a, h, reach, r, depth) {
    const tip = base.clone().add(vec(Math.cos(a) * reach, h, Math.sin(a) * reach))
    const mid = base
      .clone()
      .lerp(tip, 0.48)
      .add(vec(Math.sin(a) * 0.18, h * 0.07, Math.cos(a) * 0.15))
    bark.push(tube([base, mid, tip], r, r * (depth ? 0.43 : 0.12), rng))
    if (depth) {
      const count = depth > 2 ? 3 : 2
      for (let i = 0; i < count; i++) {
        const start = i === 0 ? mid : tip
        grow(
          start,
          a + (i === 0 ? -1 : 1) * (0.45 + rng() * 1.12) + (i === 2 ? 2 : 0),
          h * (0.48 + rng() * 0.35),
          reach * (0.51 + rng() * 0.39),
          r * 0.49,
          depth - 1,
        )
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const p = mid.clone().lerp(tip, i / 8)
        foliage(
          p,
          a + (i % 2 ? 1 : -1) * (0.4 + rng() * 0.9),
          young ? 0.85 + rng() * 0.52 : 0.24 + rng() * 0.29,
        )
      }
      if (rng() < 0.095) fruit.push(tip)
    }
  }
  const crotch = vec(0.12, 1.84, -0.1)
  bark.push(
    tube(
      [vec(0, -0.12, 0), vec(-0.19, 0.68, 0.12), vec(0.02, 1.28, 0.02), crotch],
      0.29,
      0.16,
      rng,
    ),
  )
  const stem = new T.CatmullRomCurve3([
    vec(0, -0.12, 0),
    vec(-0.19, 0.68, 0.12),
    vec(0.02, 1.28, 0.02),
    crotch,
  ])
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * tau,
      points = []
    for (let j = 0; j < 11; j++) {
      const t = j / 10,
        p = stem.getPoint(t),
        r = 0.285 - 0.13 * t,
        angle = a + 0.48 * Math.sin(4 * t + a)
      points.push(p.add(vec(r * Math.cos(angle), 0, r * Math.sin(angle))))
    }
    grain.push(tube(points, 0.016 + rng() * 0.011, 0.004, rng))
  }
  for (let i = 0; i < (young ? 4 : 9); i++) {
    const a = (i / (young ? 4 : 9)) * tau + rng() * 0.48
    grow(
      i < 3 ? vec(-0.1, 1.02, 0.04) : crotch,
      a,
      1.02 + rng() * 0.64,
      0.72 + rng() * 0.78,
      0.11 + rng() * 0.07,
      young ? 0 : 3,
    )
    bark.push(
      tube(
        [
          vec(0, 0.22, 0),
          vec(Math.cos(a) * 0.31, 0.035, Math.sin(a) * 0.31),
          vec(Math.cos(a) * 0.78, -0.07, Math.sin(a) * 0.83),
        ],
        0.135,
        0.011,
        rng,
      ),
    )
  }
  const group = new T.Group(),
    geometry = mergeGeometries(bark)
  bark.forEach((g) => g.dispose())
  group.add(new T.Mesh(geometry, new T.MeshStandardMaterial({ color: woodColor, roughness: 0.8 })))
  const striae = mergeGeometries(grain)
  grain.forEach((g) => g.dispose())
  group.add(new T.Mesh(striae, new T.MeshStandardMaterial({ color: 0x504637, roughness: 0.95 })))
  const lg = new T.BufferGeometry()
  lg.setAttribute('position', new T.Float32BufferAttribute(leaves, 3))
  lg.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  lg.computeVertexNormals()
  const canopy = new T.Mesh(
    lg,
    new T.MeshStandardMaterial({
      vertexColors: true,
      side: T.DoubleSide,
      metalness: 0.13,
      roughness: 0.7,
    }),
  )
  group.add(canopy)
  group.userData.canopy = canopy
  const berry = seedFruit()
  const fruits = young ? [] : fruit.slice(0, 10)
  for (const part of berry.children) {
    const batch = new T.InstancedMesh(part.geometry, part.material, fruits.length)
    fruits.forEach((p, i) => {
      const m = new T.Matrix4().makeScale(0.58, 0.58, 0.58)
      m.setPosition(p.x, p.y - 0.13 + part.position.y * 0.58, p.z)
      batch.setMatrixAt(i, m)
    })
    group.add(batch)
  }
  return group
}
function soil() {
  const group = new T.Group(),
    rng = random(591),
    verts = [],
    cols = []
  const layers = [
    [0.01, 0.08],
    [0.54, 0.06],
    [0.86, 0.02],
    [1, -0.13],
    [0.98, -0.37],
    [0.95, -0.52],
    [0.84, -0.79],
    [0.62, -1.13],
    [0.005, -1.42],
  ]
  const tones = [
    '#464b3c',
    '#404536',
    '#383b32',
    '#3b3336',
    '#63524b',
    '#443a3b',
    '#312c34',
    '#211f2a',
  ]
  function pt(i, j) {
    const a = (i / 104) * tau,
      [r, y] = layers[j],
      w = 1 + 0.035 * Math.sin(5 * a + 0.3) + 0.02 * Math.cos(9 * a)
    const seam = (j > 2 ? 0.09 : 0.022) * Math.sin(7 * a + j * 0.31)
    return [Math.cos(a) * r * 5.8 * w, y + seam, Math.sin(a) * r * 3.1 * w]
  }
  for (let j = 0; j < layers.length - 1; j++)
    for (let i = 0; i < 104; i++) {
      const color = new T.Color(tones[j]).multiplyScalar(0.92 + rng() * 0.13)
      for (const [a, b] of [
        [i, j],
        [i + 1, j + 1],
        [i + 1, j],
        [i, j],
        [i, j + 1],
        [i + 1, j + 1],
      ]) {
        verts.push(...pt(a, b))
        cols.push(color.r, color.g, color.b)
      }
    }
  const geo = new T.BufferGeometry()
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3))
  geo.computeVertexNormals()
  group.add(
    new T.Mesh(
      geo,
      new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 1 }),
    ),
  )
  // Grass and fallen leaves follow the elliptical island.
  const litter = [],
    tone = []
  for (let i = 0; i < 1800; i++) {
    const a = rng() * tau,
      r = Math.sqrt(rng()) * 0.92,
      x = Math.cos(a) * r * 5.8,
      z = Math.sin(a) * r * 3.1
    const h = 0.025 + rng() * 0.13,
      col = new T.Color(rng() > 0.6 ? '#626849' : '#414f42')
    litter.push(x, 0.075, z, x + 0.023, 0.075, z + 0.025, x + 0.05, 0.075 + h, z + 0.03)
    for (let k = 0; k < 3; k++) tone.push(col.r, col.g, col.b)
  }
  const grass = new T.BufferGeometry()
  grass.setAttribute('position', new T.Float32BufferAttribute(litter, 3))
  grass.setAttribute('color', new T.Float32BufferAttribute(tone, 3))
  group.add(new T.Mesh(grass, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })))
  const exposed = []
  for (let i = 0; i < 53; i++) {
    const a = rng() * tau,
      x = 5.5 * Math.cos(a),
      z = 2.97 * Math.sin(a),
      drop = 0.55 + rng() * 1.27
    const end = vec(x * 0.84, -drop, z * 0.86)
    exposed.push(
      tube(
        [
          vec(x, -0.18, z),
          vec(x * 0.99, -0.45, z + 0.07),
          vec(x * 0.91, -drop * 0.72, z * 0.95),
          end,
        ],
        0.013 + rng() * 0.022,
        0.003,
        rng,
      ),
    )
    exposed.push(
      tube(
        [
          vec(x * 0.95, -drop * 0.56, z * 0.98),
          vec(x * 0.94 + 0.12, -drop * 0.73, z * 0.96),
          vec(x * 0.89 + 0.15, -drop * 0.86, z * 0.94),
        ],
        0.011,
        0.002,
        rng,
      ),
    )
  }
  const roots = mergeGeometries(exposed)
  exposed.forEach((g) => g.dispose())
  group.add(new T.Mesh(roots, new T.MeshStandardMaterial({ color: 0xa08460, roughness: 1 })))
  return group
}

export function createGrove(canvas, placePins, reduced) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(32, 1, 0.1, 120)
  scene.add(new T.HemisphereLight(0xcbd9dc, 0x4c3940, 1.36))
  const sun = new T.DirectionalLight(0xffdfa9, 2.35)
  sun.position.set(-5, 8, 5)
  scene.add(sun)
  const rim = new T.DirectionalLight(0xffb393, 2.35)
  rim.position.set(3, 5, -5)
  scene.add(rim)
  scene.add(soil())
  const family = new T.Group()
  scene.add(family)
  let labels = [],
    timeline,
    orbitTween,
    angle = 0.18,
    children = [],
    adults = [],
    active = true,
    frame = 0
  const framing = { zoom: 1, look: 2.05 }
  function render() {
    if (!active) return
    const w = canvas.clientWidth,
      h = canvas.clientHeight
    if (!w || !h) return
    const pixel = renderer.getPixelRatio()
    if (Math.abs(canvas.width - w * pixel) > 1 || Math.abs(canvas.height - h * pixel) > 1)
      renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const distance = Math.max(14.9, 23 / camera.aspect) * framing.zoom
    camera.position.set(Math.sin(angle) * distance, 5.3, Math.cos(angle) * distance)
    camera.lookAt(0, framing.look, 0)
    renderer.render(scene, camera)
    placePins(
      labels.map((n) => {
        const v = n.at.clone().project(camera)
        return { ...n, x: (v.x + 1) * 50, y: (1 - v.y) * 50 }
      }),
    )
  }
  function invalidate() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      render()
    })
  }
  function empty() {
    timeline?.progress(1).kill()
    timeline = null
    family.traverse((node) => {
      node.geometry?.dispose()
      node.material?.dispose()
    })
    family.clear()
    children = []
    adults = []
    labels = []
  }
  function set(kin, partner) {
    active = true
    empty()
    const addTree = (person, x, z, s, role, variant) => {
      const g = tree(hash(person.id), variant, role === 'Child' && !person.issue)
      g.position.set(x, 0.06, z)
      g.scale.setScalar(s)
      family.add(g)
      const at = role === 'Child' ? vec(x, 0.04, z + 1.1) : vec(x * 1.37, 0.6, z + 0.3)
      labels.push({ person, role, at })
      return { id: person.id, g, s }
    }
    adults.push(addTree(kin.focus, partner ? -2.15 : 0, -0.45, 1, 'Rootstock', 0))
    if (partner) adults.push(addTree(partner, 2.16, -0.55, 0.93, 'Partner', 1))
    if (partner) {
      const tie = tube(
        [
          vec(-2.14, 1.75, -0.46),
          vec(-1.12, 2.62, 0.03),
          vec(0, 2.74, 0.15),
          vec(1.02, 2.96, -0.03),
          vec(2.13, 2.21, -0.53),
        ],
        0.075,
        0.055,
        random(44),
      )
      family.add(new T.Mesh(tie, new T.MeshStandardMaterial({ color: 0x855c46, roughness: 0.72 })))
      for (let i = 0; i < 6; i++) {
        const wrap = new T.Mesh(
          new T.TorusGeometry(0.087, 0.018, 6, 18),
          new T.MeshStandardMaterial({ color: 0xcf795e }),
        )
        wrap.rotation.y = 1.4
        wrap.position.set(-0.2 + i * 0.065, 2.73 + i * 0.009, 0.14)
        family.add(wrap)
      }
    }
    children = kin.children.map((p, i) => {
      const x = (i - (kin.children.length - 1) / 2) * 2.05
      return addTree(p, x, 1.49 + Math.abs(x) * 0.12, 0.32 + (i % 2) * 0.035, 'Child', i % 2)
    })
    render()
  }
  function grow(id, birth = true) {
    timeline?.progress(1).kill()
    const subject = (birth ? children : adults).find((item) => item.id === id)
    if (!subject || reduced.matches) {
      render()
      return
    }
    const { g, s } = subject
    g.scale.setScalar(0.001)
    timeline = gsap.timeline({ onUpdate: invalidate, onComplete: render })
    if (birth) {
      const fruit = seedFruit(),
        dest = g.position
      const joined = new T.Vector3()
      adults.forEach((item) => joined.add(item.g.position))
      joined.divideScalar(adults.length)
      fruit.position.set(joined.x, 2.57, joined.z + 0.65)
      fruit.scale.setScalar(0.01)
      family.add(fruit)
      const ripple = new T.Mesh(
        new T.RingGeometry(0.19, 0.225, 56),
        new T.MeshBasicMaterial({
          color: 0xf9bf80,
          transparent: true,
          opacity: 0,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      )
      ripple.rotation.x = -Math.PI / 2
      ripple.position.copy(dest)
      ripple.position.y = 0.104
      family.add(ripple)
      timeline
        .to(fruit.scale, { x: 1.85, y: 1.85, z: 1.85, duration: 0.65, ease: 'sine.out' })
        .to(fruit.rotation, { z: 0.23, y: 0.5, duration: 0.35, yoyo: true, repeat: 1 })
        .to(fruit.position, { x: dest.x, y: 0.26, z: dest.z, duration: 0.74, ease: 'power2.in' })
        .to(fruit.scale, { x: 0.48, y: 0.24, z: 0.48, duration: 0.24 })
        .to(fruit.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.38 })
        .call(() => {
          family.remove(fruit)
          fruit.traverse((n) => {
            n.geometry?.dispose()
            n.material?.dispose()
          })
        })
      const impact = 2.09
      timeline
        .to(framing, { zoom: 0.88, look: 1.83, duration: 0.92, ease: 'sine.inOut' }, 0)
        .set(ripple.material, { opacity: 0.72 }, impact)
        .to(ripple.scale, { x: 5, y: 5, duration: 0.6, ease: 'power2.out' }, impact)
        .to(ripple.material, { opacity: 0, duration: 0.6 }, impact)
        .call(() => {
          family.remove(ripple)
          ripple.geometry.dispose()
          ripple.material.dispose()
        })
    }
    g.userData.canopy.visible = false
    timeline
      .to(
        g.scale,
        { x: s * 0.62, y: s, z: s * 0.62, duration: 1.15, ease: 'power2.out' },
        birth ? '-=.24' : 0,
      )
      .call(() => {
        g.userData.canopy.visible = true
      })
      .fromTo(
        g.userData.canopy.scale,
        { x: 0.09, z: 0.09 },
        { x: 1, z: 1, duration: 0.62, ease: 'sine.out' },
      )
      .to(g.scale, { x: s, z: s, duration: 0.65, ease: 'sine.out' }, '<')
    if (birth)
      timeline.to(framing, { zoom: 1, look: 2.05, duration: 0.68, ease: 'sine.inOut' }, '-=.55')
    render()
  }
  return {
    set,
    grow,
    resize: invalidate,
    hide() {
      timeline?.progress(1)
      active = false
      orbitTween?.kill()
    },
    stop() {
      timeline?.progress(1)
      orbitTween?.progress(1)
    },
    rotate(delta, smooth = true) {
      const state = { a: angle }
      orbitTween?.kill()
      if (reduced.matches || !smooth) {
        angle += delta
        render()
        return
      }
      orbitTween = gsap.to(state, {
        a: angle + delta,
        duration: 0.48,
        ease: 'power2.out',
        onUpdate() {
          angle = state.a
          invalidate()
        },
      })
    },
  }
}
