import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Produto } from '../lib/catalogo';

/* =====================================================================
   Vitrine giratória: as fotos reais dos produtos em painéis curvos,
   formando um anel. Entra girando rápido e desacelera; gira com o
   dedo/mouse (com inércia); a peça sob o mouse ganha borda limão; tocar
   abre o produto. Rolando a página, o anel inclina e se afasta.
   ===================================================================== */

export type ItemVitrine = { produto: Produto; url: string };

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMapa;
  uniform float uTemMapa;
  uniform float uDestaque;
  uniform float uAspecto;
  uniform float uRevela;
  varying vec2 vUv;

  // Retângulo de cantos arredondados (distância com sinal)
  float caixa(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspecto, 1.0);
    float d = caixa(p, vec2(uAspecto * 0.5, 0.5), 0.06);
    if (d > 0.0) discard;

    vec3 base = vec3(0.114, 0.125, 0.102);
    vec3 cor = mix(base, texture2D(uMapa, vUv).rgb, uTemMapa);
    // O verso do painel (lado de dentro do anel) fica escuro: dá profundidade.
    if (!gl_FrontFacing) cor *= 0.16;
    vec3 lima = vec3(0.55, 0.9, 0.03);
    float borda = smoothstep(-0.018, -0.004, d);
    cor = mix(cor, lima, borda * uDestaque);
    cor *= uRevela;
    gl_FragColor = vec4(cor, 1.0);
    #include <colorspace_fragment>
  }
`;

type Painel = { geo: THREE.CylinderGeometry; mat: THREE.ShaderMaterial; centro: number };

function usePaineis(itens: ItemVitrine[], raio: number) {
  return useMemo(() => {
    const n = itens.length;
    const passo = (Math.PI * 2) / n;
    const largura = passo * 0.84; // folga entre os painéis
    const altura = raio * largura * 0.75; // fotos 4:3
    const loader = new THREE.TextureLoader();
    return itens.map((item, i): Painel => {
      const centro = i * passo;
      const geo = new THREE.CylinderGeometry(raio, raio, altura, 28, 1, true, centro - largura / 2, largura);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
        uniforms: {
          uMapa: { value: null },
          uTemMapa: { value: 0 },
          uDestaque: { value: 0 },
          uAspecto: { value: (raio * largura) / altura },
          uRevela: { value: 0 },
        },
      });
      loader.load(item.url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        mat.uniforms.uMapa.value = tex;
        mat.uniforms.uTemMapa.value = 1;
      });
      return { geo, mat, centro };
    });
  }, [itens, raio]);
}

function Anel({
  itens,
  aoAbrir,
  aoMudarFrente,
  estatico,
}: {
  itens: ItemVitrine[];
  aoAbrir: (p: Produto) => void;
  aoMudarFrente: (i: number) => void;
  estatico: boolean;
}) {
  const { size, gl, pointer, camera } = useThree();
  const celular = size.width < 768;
  const raio = celular ? 2.75 : 4.1;

  // No computador a câmera fica mais longe: o anel inteiro cabe sem cobrir o texto.
  useEffect(() => {
    camera.position.z = celular ? 10.5 : 13.5;
    camera.position.y = celular ? 0.6 : 1.1;
    camera.lookAt(0, 0, 0);
  }, [camera, celular]);
  const paineis = usePaineis(itens, raio);
  const anel = useRef<THREE.Group>(null);
  const inclinacao = useRef<THREE.Group>(null);
  // Ângulo e velocidade em refs: nada disso passa pelo React a cada quadro.
  const angulo = useRef(estatico ? 0 : -2.6);
  const velocidade = useRef(estatico ? 0 : 3.2);
  const arrastando = useRef<{ x: number; t: number } | null>(null);
  const destaque = useRef(-1);
  const frente = useRef(-1);
  const inicio = useRef<number | null>(null);

  useEffect(() => () => paineis.forEach((p) => { p.geo.dispose(); p.mat.uniforms.uMapa.value?.dispose(); p.mat.dispose(); }), [paineis]);

  // Arrastar na horizontal gira o anel; na vertical a página rola (touch-action: pan-y).
  useEffect(() => {
    const el = gl.domElement;
    const baixo = (e: PointerEvent) => { arrastando.current = { x: e.clientX, t: performance.now() }; };
    const move = (e: PointerEvent) => {
      const a = arrastando.current;
      if (!a) return;
      const agora = performance.now();
      const dx = e.clientX - a.x;
      const giro = dx * (celular ? 0.009 : 0.0055);
      angulo.current += giro;
      velocidade.current = giro / Math.max(0.016, (agora - a.t) / 1000);
      arrastando.current = { x: e.clientX, t: agora };
    };
    const cima = () => { arrastando.current = null; };
    el.addEventListener('pointerdown', baixo);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', cima);
    window.addEventListener('pointercancel', cima);
    return () => {
      el.removeEventListener('pointerdown', baixo);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', cima);
      window.removeEventListener('pointercancel', cima);
    };
  }, [gl, celular]);

  useFrame((state, delta) => {
    if (inicio.current === null) inicio.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - inicio.current;
    const dt = Math.min(delta, 0.05);

    // Giro: inércia que decai até a velocidade de passeio.
    const passeio = estatico ? 0 : -0.12;
    if (!arrastando.current) {
      velocidade.current = THREE.MathUtils.damp(velocidade.current, passeio, 1.1, dt);
      angulo.current += velocidade.current * dt;
    }
    if (anel.current) anel.current.rotation.y = angulo.current;

    // Rolagem da página inclina e afasta o anel; mouse dá um leve paralaxe.
    const rolagem = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    if (inclinacao.current) {
      const alvoX = (celular ? 0.13 : 0.16) + rolagem * 0.5 - (celular ? 0 : pointer.y * 0.06);
      const alvoZ = celular ? 0 : pointer.x * -0.04;
      inclinacao.current.rotation.x = THREE.MathUtils.damp(inclinacao.current.rotation.x, alvoX, 4, dt);
      inclinacao.current.rotation.z = THREE.MathUtils.damp(inclinacao.current.rotation.z, alvoZ, 4, dt);
      inclinacao.current.position.y = THREE.MathUtils.damp(inclinacao.current.position.y, (celular ? 0.05 : -0.75) - rolagem * 0.8, 4, dt);
    }

    // Qual painel está de frente pra câmera (legenda embaixo do anel).
    const n = paineis.length;
    const passo = (Math.PI * 2) / n;
    const idx = ((Math.round(-angulo.current / passo) % n) + n) % n;
    if (idx !== frente.current) { frente.current = idx; aoMudarFrente(idx); }

    paineis.forEach((p, i) => {
      // Entrada em cascata: cada painel acende um pouco depois do anterior.
      const alvoRevela = estatico ? 1 : THREE.MathUtils.clamp((t - i * 0.06) / 0.6, 0, 1);
      p.mat.uniforms.uRevela.value = alvoRevela;
      const alvo = i === destaque.current ? 1 : 0;
      p.mat.uniforms.uDestaque.value = THREE.MathUtils.damp(p.mat.uniforms.uDestaque.value, alvo, 10, dt);
    });
  });

  const clique = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    // Só conta como toque se não foi um arraste.
    if (e.delta > 8) return;
    e.stopPropagation();
    aoAbrir(itens[i].produto);
  };

  return (
    <group ref={inclinacao}>
      <group ref={anel}>
        {paineis.map((p, i) => (
          <mesh
            key={i}
            geometry={p.geo}
            material={p.mat}
            onClick={clique(i)}
            onPointerOver={(e) => { e.stopPropagation(); destaque.current = i; document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { if (destaque.current === i) destaque.current = -1; document.body.style.cursor = ''; }}
          />
        ))}
      </group>
    </group>
  );
}

export default function Vitrine({
  itens,
  aoAbrir,
  aoMudarFrente,
  pausado,
  estatico,
}: {
  itens: ItemVitrine[];
  aoAbrir: (p: Produto) => void;
  aoMudarFrente: (i: number) => void;
  pausado: boolean;
  estatico: boolean;
}) {
  return (
    <Canvas
      frameloop={pausado ? 'never' : 'always'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 10.5], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
      aria-hidden
    >
      <Anel itens={itens} aoAbrir={aoAbrir} aoMudarFrente={aoMudarFrente} estatico={estatico} />
    </Canvas>
  );
}
