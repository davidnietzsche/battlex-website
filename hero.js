import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const canvas=document.getElementById('gl'),hero=canvas.parentElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setClearColor(0x050204,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.12;
const cam=new THREE.PerspectiveCamera(32,1,.1,80);cam.position.set(0,.6,13);
// backdrop: the generated server-hall painting, dimmed, parallaxed
const bgTex=new THREE.TextureLoader().load('img/hero-bg.webp');bgTex.colorSpace=THREE.SRGBColorSpace;
const bg=new THREE.Mesh(new THREE.PlaneGeometry(46,30.7),new THREE.MeshBasicMaterial({map:bgTex,color:0xffffff,fog:false,toneMapped:false}));bg.position.z=-14;scene.add(bg);
const rig=new THREE.Group();scene.add(rig);
// ---- the stack: four layers (experience / API / data+AI / cloud) of glass-metal slabs with lit circuitry
function rr(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const slabGeo=new THREE.ExtrudeGeometry(rr(4.6,3.3,.35),{depth:.12,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:4,curveSegments:20});slabGeo.rotateX(-Math.PI/2);slabGeo.center();
function circuit(seed){const c=document.createElement('canvas');c.width=512;c.height=384;const g=c.getContext('2d');g.fillStyle='#0a0a0d';g.fillRect(0,0,512,384);let s=seed*977;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  g.strokeStyle='rgba(215,0,15,.85)';g.lineWidth=2;for(let i=0;i<46;i++){let x=Math.floor(rnd()*32)*16,y=Math.floor(rnd()*24)*16;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){if(rnd()<.5)x+=(rnd()<.5?-1:1)*16*(1+(rnd()*5|0));else y+=(rnd()<.5?-1:1)*16*(1+(rnd()*4|0));g.lineTo(x,y)}g.stroke();g.fillStyle='#ff4a52';g.fillRect(x-3,y-3,6,6)}
  g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=1;for(let x=0;x<512;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,384);g.stroke()}for(let y=0;y<384;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const slabs=[];
for(let i=0;i<4;i++){
  const g=new THREE.Group();
  const body=new THREE.Mesh(slabGeo,new THREE.MeshPhysicalMaterial({color:0x0b0b0e,metalness:.92,roughness:.24,clearcoat:1,clearcoatRoughness:.2,emissive:0x120002,emissiveIntensity:.5}));g.add(body);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(4.3,3.0),new THREE.MeshBasicMaterial({map:circuit(i+2),transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));top.rotation.x=-Math.PI/2;top.position.y=.095;g.add(top);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo,30),new THREE.LineBasicMaterial({color:0xff3a45,transparent:true,opacity:.9})));
  g.userData={i};rig.add(g);slabs.push(g)}
// core column + beam
const col=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,7.4,24),new THREE.MeshBasicMaterial({color:0xff7078}));rig.add(col);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,7.8,32,1,true),new THREE.MeshBasicMaterial({color:0xff1a28,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));rig.add(beam);
const halo=new THREE.Mesh(new THREE.CircleGeometry(3.6,64),new THREE.MeshBasicMaterial({map:(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(255,40,50,.85)');r.addColorStop(.4,'rgba(215,0,15,.25)');r.addColorStop(1,'rgba(215,0,15,0)');g.fillStyle=r;g.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)})(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=-3.1;rig.add(halo);
// orbiting rings + nodes
const rings=[];for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(3.4+i*.55,.018,8,200),new THREE.MeshBasicMaterial({color:0xff3a45,transparent:true,opacity:.75}));r.rotation.x=Math.PI/2+(i-1)*.22;r.rotation.y=i*.5;r.userData={s:.2+i*.1};rig.add(r);rings.push(r)}
const nodes=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),new THREE.MeshBasicMaterial({color:i%3?0xff4a52:0xffffff}));m.userData={r:3.4+(i%3)*.55,a:i*.9,s:.25+(i%4)*.08,y:(i%5-2)*.35};rig.add(m);nodes.push(m)}
// rising data
const NP=420,pa=new Float32Array(NP*3),sp=new Float32Array(NP);for(let i=0;i<NP;i++){const a=Math.random()*6.283,r=Math.random()*2.6;pa[i*3]=Math.cos(a)*r;pa[i*3+1]=(Math.random()-.5)*8;pa[i*3+2]=Math.sin(a)*r;sp[i]=.5+Math.random()}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xff5a64,size:.04,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));rig.add(pts);
const l1=new THREE.PointLight(0xff1a28,36,22);l1.position.set(-3,2,4);scene.add(l1);const l2=new THREE.PointLight(0xffffff,10,18);l2.position.set(4,4,6);scene.add(l2);
const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,cam));comp.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.6,.5,.82));comp.addPass(new OutputPass());
let mx=0,my=0,vis=true;const t0=performance.now();addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
function size(){const w=hero.clientWidth,h=hero.clientHeight,d=Math.min(devicePixelRatio,1.75);renderer.setPixelRatio(d);renderer.setSize(w,h,false);comp.setPixelRatio(d);comp.setSize(w,h);cam.aspect=w/h;
  const wide=w/h>1.15;rig.position.set(wide?3.0:0,wide?-.1:1.2,0);rig.scale.setScalar(wide?.74:.55);cam.updateProjectionMatrix()}
size();addEventListener('resize',size);new IntersectionObserver(([e])=>vis=e.isIntersecting).observe(hero);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
let ex=0;
function frame(now){requestAnimationFrame(frame);if(!vis)return;const t=(now-t0)/1000,sc=Math.min(scrollY/innerHeight,1);
  ex+=(sc-ex)*.08;const intro=Math.min(1,t/2.2),ie=1-Math.pow(1-intro,3);
  rig.rotation.y+=((mx*.45)-rig.rotation.y)*.05;rig.rotation.x+=((my*.12)+.16-rig.rotation.x)*.05;
  slabs.forEach(g=>{const i=g.userData.i;const gap=(.85+ex*1.3)*ie*(reduce?1:1);g.position.y=(i-1.5)*gap+Math.sin(t*.7+i)*.05*(reduce?0:1);g.rotation.y=Math.sin(t*.25+i*1.3)*.28+ex*(i-1.5)*.35});
  col.scale.y=1+ex*.4;beam.material.opacity=.2+.08*Math.sin(t*2);beam.scale.y=1+ex*.4;
  rings.forEach((r,i)=>{r.rotation.z=t*r.userData.s*(i%2?-1:1)});
  nodes.forEach(m=>{const u=m.userData,a=u.a+t*u.s;m.position.set(Math.cos(a)*u.r,u.y*(1+ex),Math.sin(a)*u.r*.55)});
  const a=pg.attributes.position;for(let i=0;i<NP;i++){let y=a.array[i*3+1]+sp[i]*.014;if(y>4.6)y=-4.6;a.array[i*3+1]=y}a.needsUpdate=true;
  bg.position.x=-mx*1.1;bg.position.y=-my*.6;cam.position.z=13-ex*2.6;l1.position.x=-3+Math.sin(t*.6)*1.5;
  comp.render();window.__ready=true}
requestAnimationFrame(frame);
