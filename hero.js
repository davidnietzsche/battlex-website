import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const canvas=document.getElementById('gl'),hero=canvas.parentElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setClearColor(0x050204,1);
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(32,1,.1,80);cam.position.set(0,0,13);
const TL=new THREE.TextureLoader();const tex=f=>{const t=TL.load('img/'+f);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const U={t:{value:0}};
const bg=new THREE.Mesh(new THREE.PlaneGeometry(46,30.7),new THREE.MeshBasicMaterial({map:tex('hero-bg.webp'),toneMapped:false}));bg.position.z=-14;scene.add(bg);
const rig=new THREE.Group();scene.add(rig);
// photoreal gpt-image-2 objects as depth layers, with a travelling light sweep and float/parallax motion
function layer(f,h,x,y,z,sw){
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:tex(f)},t:U.t,ph:{value:sw||0},amp:{value:.0}},
   vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`precision highp float;varying vec2 v;uniform sampler2D map;uniform float t,ph,amp;
    void main(){vec4 c=texture2D(map,v);if(c.a<.01)discard;
     float lum=dot(c.rgb,vec3(.3,.5,.2));
     float d=v.x*.75+(1.-v.y)*.45;float band=smoothstep(.09,.0,abs(fract(d*.9-t*.16-ph)-.5)-.38)*0.;
     float s=fract(t*.14+ph);float w=abs(d*.62-(s*1.9-.35));float sweep=smoothstep(.1,.0,w);
     c.rgb+=vec3(1.,.55,.5)*sweep*(.25+lum*1.6)*.9;
     c.rgb*=1.+amp*.15;gl_FragColor=vec4(c.rgb*c.a,c.a);}`});
  const img=new Image();const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);
  img.onload=()=>{m.scale.set(h*img.width/img.height,h,1)};img.src='img/'+f;
  m.position.set(x,y,z);m.userData={bx:x,by:y,bz:z,depth:z};rig.add(m);return m}
function halo(x,y,z,s,a){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,`rgba(255,40,50,${a})`);r.addColorStop(.45,`rgba(215,0,15,${a*.3})`);r.addColorStop(1,'rgba(215,0,15,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.set(x,y,z);m.userData={bx:x,by:y,bz:z,depth:z};rig.add(m);return m}
const hl=halo(0,-.2,-1.2,10,.42);
const card1=layer('o-card1.webp',3.1,-2.7,1.7,-.8,.3);
const main=layer('o-hero.webp',7.2,0,0,0,0);
const phone=layer('o-card2.webp',4.3,2.7,-1.25,1.4,.6);
// embers
const N=320,pa=new Float32Array(N*3),sp=new Float32Array(N);for(let i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*14;pa[i*3+1]=(Math.random()-.5)*9;pa[i*3+2]=(Math.random()-.5)*5;sp[i]=.3+Math.random()}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xff4a52,size:.045,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));rig.add(pts);
const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,cam));comp.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.5,.6,.78));comp.addPass(new OutputPass());
let mx=0,my=0,vis=true;const t0=performance.now();addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
function size(){const w=hero.clientWidth,h=hero.clientHeight,d=Math.min(devicePixelRatio,1.75);renderer.setPixelRatio(d);renderer.setSize(w,h,false);comp.setPixelRatio(d);comp.setSize(w,h);cam.aspect=w/h;
  const wide=w/h>1.15;rig.position.set(wide?2.9:0,wide?-.1:1.3,0);rig.scale.setScalar(wide?.72:.5);cam.updateProjectionMatrix()}
size();addEventListener('resize',size);new IntersectionObserver(([e])=>vis=e.isIntersecting).observe(hero);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;let ex=0;
function frame(now){requestAnimationFrame(frame);if(!vis)return;const t=(now-t0)/1000;U.t.value=t;const sc=Math.min(scrollY/innerHeight,1);ex+=(sc-ex)*.08;
  const intro=Math.min(1,t/1.8),ie=1-Math.pow(1-intro,3);
  rig.children.forEach(m=>{const u=m.userData;if(u.depth===undefined)return;const k=1+u.depth*.22;
    m.position.x=u.bx*(1+ex*.9*Math.abs(u.depth+1))+(-mx)*.55*k;m.position.y=u.by+(-my)*-.28*k*-1+Math.sin(t*.8+u.bx)*.09*(reduce?0:1)+ex*u.depth*.4-(1-ie)*(u.depth+1.5)*.6;
    m.position.z=u.bz+ex*u.depth*1.2;if(m.material.uniforms)m.rotation.y=mx*.18*(1+u.depth*.4)+Math.sin(t*.5+u.bx)*.05;});
  hl.scale.setScalar(1+Math.sin(t*1.6)*.05+ex*.4);
  const a=pg.attributes.position;for(let i=0;i<N;i++){let y=a.array[i*3+1]+sp[i]*.012;if(y>4.5)y=-4.5;a.array[i*3+1]=y}a.needsUpdate=true;
  bg.position.x=-mx*1.0;bg.position.y=-my*.5;cam.position.z=13-ex*2.2;
  comp.render();window.__ready=true}
requestAnimationFrame(frame);
