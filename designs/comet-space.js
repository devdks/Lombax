import {
  Color, Mesh, PerspectiveCamera, Scene, ShaderMaterial, SphereGeometry,
  SRGBColorSpace, TextureLoader, Vector2, WebGLRenderer,
} from 'three'

const vertexShader = /* glsl */ `
  varying vec3 sphere;

  void main() {
    sphere = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D art;
  uniform float aspect;
  uniform float hasArt;
  uniform vec3 tint;
  uniform vec2 look;
  uniform float tick;
  uniform float reveal;
  varying vec3 sphere;

  void main() {
    vec3 n = normalize(sphere);
    vec2 uv = 0.5 + (n.xy * 0.51 + look * (n.z - 0.25))
      * vec2(min(1.0, 1.0 / aspect), min(1.0, aspect));
    vec3 artwork = mix(tint * 0.30, texture2D(art, clamp(uv, 0.002, 0.998)).rgb, hasArt);
    vec3 light = normalize(vec3(-0.65 + look.x, 0.72 + look.y, 0.65));
    float diffuse = max(dot(n, light), 0.0);
    float rim = pow(1.0 - max(0.0, n.z), 3.1);
    float glint = pow(max(0.0, dot(n, normalize(light + vec3(0.0, 0.0, 1.0)))), 21.0);
    float pulse = 0.94 + sin(tick * 1.3) * 0.06;
    vec3 color = artwork * (0.46 + diffuse * 0.43 + n.z * 0.14)
      + tint * (rim * (0.14 + diffuse * 0.53) * pulse + glint * (0.11 + reveal * 0.09));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

export function createSpace(canvas, projects, invalidate) {
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const distance = 1900
  const camera = new PerspectiveCamera(40, 1, 10, 2400)
  camera.position.z = distance
  const geometry = new SphereGeometry(1, 48, 32)
  const loader = new TextureLoader()

  const bodies = projects.map(project => {
    const uniforms = {
      art: { value: null },
      aspect: { value: 1 },
      hasArt: { value: 0 },
      tint: { value: new Color(project.color) },
      look: { value: new Vector2() },
      tick: { value: 0 },
      reveal: { value: 0 },
    }
    loader.load(project.image, texture => {
      texture.colorSpace = SRGBColorSpace
      uniforms.art.value = texture
      uniforms.aspect.value = texture.image.width / texture.image.height
      uniforms.hasArt.value = 1
      project.button.dataset.artReady = ''
      invalidate()
    })
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    const body = new Mesh(geometry, material)
    scene.add(body)
    return body
  })

  let width = 0
  let height = 0
  function resize(w, h) {
    if (!w || !h || (w === width && h === height)) return
    width = w
    height = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = 2 * Math.atan(h / (2 * distance)) * 180 / Math.PI
    camera.updateProjectionMatrix()
  }

  function draw(projects, time, lookX, lookY) {
    projects.forEach((project, index) => {
      const body = bodies[index]
      body.visible = project.visible
      if (!body.visible) return
      const z = project.depth + project.reveal * 225
      const scale = (distance - z) / distance
      body.position.set((project.x - width / 2) * scale, (height / 2 - project.y) * scale, z)
      body.scale.setScalar(project.r * scale * .984)
      const { uniforms } = body.material
      uniforms.look.value.set(-lookX * .105 + Math.sin(time * .47 + index) * .025, lookY * .09)
      uniforms.tick.value = time + index * .59
      uniforms.reveal.value = project.reveal
    })
    renderer.render(scene, camera)
  }

  return { resize, draw }
}
