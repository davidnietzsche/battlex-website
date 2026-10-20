import * as THREE from 'three';
const host=document.getElementById('stage');
if(host){
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setClearColor(0,0);host.appendChild(renderer.domElement);renderer.domElement.style.cssText='width:100%;height:100%;display:block';
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(34,1,.1,50);cam.position.set(0,0,9);
const TL=new THREE.TextureLoader();const U={t:{value:0}};
const files=['o-web','o-app','o-host','o-ai','o-loyalty'];
const items=files.map((f,i)=>{
  const t=TL.load('img/'+f+'.webp');t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:t},t:U.t,op:{value:i?0:1},ph:{value:i*.37}},
   vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`precision highp float;varying vec2 v;uniform sampler2D map;uniform float t,op,ph;
    void main(){vec4 c=texture2D(map,v);if(c.a<.01)discard;float lum=dot(c.rgb,vec3(.3,.5,.2));
     float d=v.x*.75+(1.-v.y)*.45;float s=fract(t*.18+ph);float w=abs(d*.62-(s*1.9-.35));float sweep=smoothstep(.1,.0,w);
     c.rgb+=vec3(1.,.5,.45)*sweep*(.2+lum*1.5);gl_FragColor=vec4(c.rgb*c.a*op,c.a*op);}`});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);const img=new Image();img.onload=()=>{const h=5.2,w=h*img.width/img.height,s=Math.min(1,6.4/w);m.scale.set(w*s,h*s,1)};img.src='img/'+f+'.webp';scene.add(m);return {m,mat}});
// halo + orbiting sparks behind
const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(255,40,50,.8)');r.addColorStop(.5,'rgba(215,0,15,.22)');r.addColorStop(1,'rgba(215,0,15,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
const halo=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.z=-1;scene.add(halo);
const N=120,pa=new Float32Array(N*3),ph=new Float32Array(N);for(let i=0;i<N;i++){ph[i]=Math.random()*6.283}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xff5a64,size:.05,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(pts);
let idx=0,prev=0,tsw=1,mx=0,my=0;window.svcPick=i=>{if(i===idx)return;prev=idx;idx=i;tsw=0};
host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=((e.clientY-r.top)/r.height)*2-1});
function size(){const w=host.clientWidth||600,h=host.clientHeight||440;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);let vis=true;new IntersectionObserver(([e])=>vis=e.isIntersecting).observe(host);
const t0=performance.now();const e3=x=>1-Math.pow(1-x,3);
function frame(now){requestAnimationFrame(frame);if(!vis)return;const t=(now-t0)/1000;U.t.value=t;tsw=Math.min(1,tsw+.025);const k=e3(tsw);
  items.forEach((it,i)=>{const on=i===idx,was=i===prev&&tsw<1;const o=on?k:(was?1-k:0);it.mat.uniforms.op.value=o;it.m.visible=o>.01;
    const base=on?1.12-.12*k:(was?1+.1*k:1);it.m.position.set(-mx*.25+(on?(1-k)*.9:(was?-k*.9:0)),Math.sin(t*.9)*.1+my*.12,0);it.m.rotation.set(my*.08,mx*.22+Math.sin(t*.4)*.08,0);it.m.userData.s=base});
  items.forEach(it=>{if(it.m.userData.s&&it.m.scale.x){const sx=it.m.scale.x/(it.m.userData.ps||it.m.scale.x);}});
  halo.scale.setScalar(1+Math.sin(t*1.5)*.05);
  const a=pg.attributes.position;for(let i=0;i<N;i++){const an=ph[i]+t*(.25+(i%5)*.06),rr=2.6+(i%7)*.22;a.array[i*3]=Math.cos(an)*rr;a.array[i*3+1]=Math.sin(an*1.3+i)*1.8;a.array[i*3+2]=Math.sin(an)*1.2}a.needsUpdate=true;
  renderer.render(scene,cam)}
requestAnimationFrame(frame);
}
