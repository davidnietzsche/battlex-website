import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setClearColor(0x000000,1);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x000000,.036);
const cam=new THREE.PerspectiveCamera(46,1,.1,200);
const RED=new THREE.Color('#D7000F');
const U={t:{value:0}};
// ---------- towers (instanced) with animated window emission
const N=23,SP=1.25,towers=[];
function hash(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return hash(ix,iy)*(1-u)*(1-v)+hash(ix+1,iy)*u*(1-v)+hash(ix,iy+1)*(1-u)*v+hash(ix+1,iy+1)*u*v}
for(let i=-N;i<=N;i++)for(let j=-N;j<=N;j++){
  if(i%4===0||j%4===0)continue;                       // streets
  const x=i*SP,z=j*SP,d=Math.hypot(x,z);if(d<4.2||d>26)continue;
  const n=noise(i*.35,j*.35),h=.7+n*3.4*Math.exp(-d*.045)+hash(i,j)*1.2+Math.max(0,5-d*.25)*.6;
  towers.push({x,z,w:.78+hash(j,i)*.2,d_:.78+hash(i+3,j)*.2,h});
}
const tGeo=new THREE.BoxGeometry(1,1,1);tGeo.translate(0,.5,0);
const tMat=new THREE.ShaderMaterial({uniforms:U,fog:true,
  vertexShader:`varying vec3 vP;varying vec3 vN;varying float vH;varying float vSeed;uniform float t;
  void main(){vec4 wp=instanceMatrix*vec4(position,1.);vP=wp.xyz;vN=normalize(mat3(instanceMatrix)*normal);vH=wp.y;vSeed=instanceMatrix[3].x*.37+instanceMatrix[3].z*.73;
   gl_Position=projectionMatrix*viewMatrix*wp;}`,
  fragmentShader:`precision highp float;varying vec3 vP;varying vec3 vN;varying float vH;varying float vSeed;uniform float t;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
    vec3 base=vec3(.0045,.0045,.006);
    float side=1.-abs(vN.y);
    vec2 g=vec2(vP.x+vP.z,vP.y)*vec2(3.2,4.4);vec2 id=floor(g),f=fract(g);
    float cell=step(.15,f.x)*step(f.x,.85)*step(.2,f.y)*step(f.y,.8);
    float on=step(.8,h(id+vSeed));float pulse=.5+.5*sin(t*(1.+h(id)*2.)+h(id+7.)*6.28);
    vec3 win=mix(vec3(.75,.04,.07),vec3(.9,.8,.78),h(id+3.)*.45)*(.18+.55*pulse);
    vec3 c=base+side*cell*on*win*.8;
    float top=smoothstep(.85,1.,fract(vP.y*0.0+vN.y));
    c+=vec3(.5,.02,.04)*top*.0;
    float edge=pow(1.-abs(dot(normalize(vN),vec3(0.,0.,1.))),6.)*0.;
    float rim=smoothstep(.0,3.,vH)*.0;
    gl_FragColor=vec4(c,1.);
    #include <fog_fragment>
  }`});
// fog needs the standard varying – use a simple manual fog instead
tMat.fog=false;
tMat.fragmentShader=tMat.fragmentShader.replace("#include <fog_fragment>","float dist=length(vP-cameraPosition);float fg=1.-exp(-dist*dist*.036*.036*1.1);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.0025,.0025,.004),clamp(fg,0.,1.));");
const mesh=new THREE.InstancedMesh(tGeo,tMat,towers.length);
const m4=new THREE.Matrix4();towers.forEach((t,i)=>{m4.compose(new THREE.Vector3(t.x,0,t.z),new THREE.Quaternion(),new THREE.Vector3(t.w,t.h,t.d_));mesh.setMatrixAt(i,m4)});
mesh.frustumCulled=false;scene.add(mesh);
// neon roof caps
const capGeo=new THREE.BoxGeometry(1,.03,1);capGeo.translate(0,0,0);
const caps=new THREE.InstancedMesh(capGeo,new THREE.MeshBasicMaterial({color:0x6a0009,transparent:true,opacity:.3}),towers.length);
towers.forEach((t,i)=>{m4.compose(new THREE.Vector3(t.x,t.h+.02,t.z),new THREE.Quaternion(),new THREE.Vector3(t.w*1.01,1,t.d_*1.01));caps.setMatrixAt(i,m4)});scene.add(caps);
// ---------- floor: reflective dark with grid and travelling data pulses along avenues
const floorMat=new THREE.ShaderMaterial({uniforms:U,transparent:false,
  vertexShader:'varying vec3 vP;void main(){vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}',
  fragmentShader:`precision highp float;varying vec3 vP;uniform float t;
  float h(float x){return fract(sin(x*127.1)*43758.5453);}
  void main(){
    vec2 p=vP.xz;float d=length(p);
    vec2 g=abs(fract(p/SP-.5)-.5)/fwidth(p/SP);float line=1.-min(min(g.x,g.y),1.);
    float lane=SP4;
    vec2 q=p/(SP*4.);vec2 ga=abs(fract(q-.5)-.5)/fwidth(q);float avenue=1.-min(min(ga.x,ga.y),1.);
    vec3 c=vec3(.0025,.0025,.004)+vec3(.55,.02,.05)*line*.12*exp(-d*.07)+vec3(.9,.04,.08)*avenue*.55*exp(-d*.05);
    // pulses
    float lx=floor(p.y/(SP*4.)+.5),lz=floor(p.x/(SP*4.)+.5);
    float ax=abs(p.y-lx*SP*4.),az=abs(p.x-lz*SP*4.);
    float sx=fract(p.x*.06*.0+(-p.x)*.045+t*.12*(h(lx)+.6)+h(lx*3.)),sz=fract((-p.y)*.045+t*.12*(h(lz)+.6)+h(lz*5.));
    float px=smoothstep(.04,.0,ax)*smoothstep(.06,.0,abs(fract(sx)-.5))*step(.5,h(lx+9.));
    float pz=smoothstep(.04,.0,az)*smoothstep(.06,.0,abs(fract(sz)-.5))*step(.5,h(lz+4.));
    c+=vec3(1.,.2,.16)*(px+pz)*1.1*exp(-d*.04);
    float core=exp(-d*.22);c+=vec3(.7,.03,.05)*core*.28;
    float fg=1.-exp(-length(vP-cameraPosition)*length(vP-cameraPosition)*.0013);c=mix(c,vec3(.0025,.0025,.004),clamp(fg,0.,1.));
    gl_FragColor=vec4(c,1.);}`.replace(/SP4/g,'0.').replace(/SP/g,'1.25')});
floorMat.extensions={derivatives:true};
const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),floorMat);floor.rotation.x=-Math.PI/2;scene.add(floor);
// ---------- the core: tall tower, orbiting rings, light beam
const core=new THREE.Group();scene.add(core);
const coreMat=new THREE.MeshStandardMaterial({color:0x08080a,metalness:.95,roughness:.22,emissive:0x2a0004,emissiveIntensity:.8});
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.3,12,6,1),coreMat);shaft.position.y=6;core.add(shaft);
const shEdges=new THREE.LineSegments(new THREE.EdgesGeometry(shaft.geometry),new THREE.LineBasicMaterial({color:0xff2a35}));shEdges.position.y=6;core.add(shEdges);
const rings=[];for(let i=0;i<4;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(2.1+i*.55,.035,8,160),new THREE.MeshBasicMaterial({color:0xff2230,transparent:true,opacity:.9}));r.position.y=3.2+i*2.4;r.rotation.x=Math.PI/2+(i%2?.18:-.18);core.add(r);rings.push(r);}
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.5,40,16,1,true),new THREE.MeshBasicMaterial({color:0xff1a28,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=26;core.add(beam);
const glow=new THREE.PointLight(0xff1a28,55,30);glow.position.set(0,7,0);scene.add(glow);
const key=new THREE.DirectionalLight(0xffffff,.9);key.position.set(5,10,8);scene.add(key);scene.add(new THREE.AmbientLight(0x331118,.6));
// ---------- 4 floating architecture slabs above the core (revealed in the "layers" section)
const slabs=[];for(let i=0;i<4;i++){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(5.2,.09,3.6),new THREE.MeshPhysicalMaterial({color:0x0c0c10,metalness:.9,roughness:.25,transparent:true,opacity:.85}));g.add(m);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xff3040})));
  const pts=[];for(let a=0;a<26;a++)pts.push((Math.random()-.5)*4.6,.06,(Math.random()-.5)*3);const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0xffffff,size:.07})));
  g.position.set(0,14+i*1.5,0);scene.add(g);slabs.push(g)}
// ---------- rising data motes
const NP=700,pa=new Float32Array(NP*3),sp=new Float32Array(NP);for(let i=0;i<NP;i++){pa[i*3]=(Math.random()-.5)*50;pa[i*3+1]=Math.random()*18;pa[i*3+2]=(Math.random()-.5)*50;sp[i]=.4+Math.random()}
const pgm=new THREE.BufferGeometry();pgm.setAttribute('position',new THREE.BufferAttribute(pa,3));
const motes=new THREE.Points(pgm,new THREE.PointsMaterial({color:0xff4a55,size:.06,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(motes);
// ---------- post
const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.55,.5,.55);comp.addPass(bloom);comp.addPass(new OutputPass());
function size(){const w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio,1.75);renderer.setPixelRatio(d);renderer.setSize(w,h,false);comp.setPixelRatio(d);comp.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);
// ---------- camera flight: one keyframe per section
const KF=[ // [pos],[look]
 {p:[9,5.5,23],l:[0,7.5,0]},        // 0 hero: low, facing the core
 {p:[-1.2,2.2,14],l:[0,4.5,-10]},        // 1 commerce: down the avenue
 {p:[16,22,4],l:[0,2,0]},              // 2 performance: high orbit
 {p:[-6,9,10],l:[0,8,0]},              // 3 services: close to the tower
 {p:[11,17,12],l:[0,17,0]},            // 4 architecture: framing the slabs
 {p:[0,34,30],l:[0,0,0]},              // 5 delivery (white section covers)
 {p:[0,2.5,26],l:[0,9,0]}];            // 6 cta: horizon
const secs=[...document.querySelectorAll('[data-k]')];
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function target(){const y=scrollY+innerHeight*.5;let i=0;secs.forEach((s,k)=>{if(s.offsetTop<=y)i=k});const s=secs[i],frac=Math.min(1,Math.max(0,(y-s.offsetTop)/s.offsetHeight));
  const a=KF[+s.dataset.k],b=KF[Math.min(KF.length-1,+s.dataset.k+1)],t=ss(.45,1,frac);
  const mix=(u,v)=>u.map((q,n)=>q+(v[n]-q)*t);return {p:mix(a.p,b.p),l:mix(a.l,b.l),slab:+s.dataset.k}}
let mx=0,my=0,smx=0,smy=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
const cp=new THREE.Vector3(9,5.5,23),cl=new THREE.Vector3(0,6.5,0);const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const qy=new URLSearchParams(location.search).get('y');if(qy)setTimeout(()=>scrollTo(0,+qy),50);
let slabT=0;const t0=performance.now();
function frame(now){requestAnimationFrame(frame);const t=(now-t0)/1000;U.t.value=t;smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
  const tg=target();
  const orbit=reduce?0:t*.05;const ox=Math.cos(orbit),oz=Math.sin(orbit);
  const p=new THREE.Vector3(tg.p[0],tg.p[1],tg.p[2]);p.applyAxisAngle(new THREE.Vector3(0,1,0),Math.sin(t*.12)*.18);
  cp.lerp(p.add(new THREE.Vector3(smx*1.6,-smy*.9,0)),.06);cl.lerp(new THREE.Vector3(tg.l[0]+smx*.8,tg.l[1]-smy*.4,tg.l[2]),.06);
  cam.position.copy(cp);cam.lookAt(cl);
  rings.forEach((r,i)=>{r.rotation.z=t*(.25+i*.12)*(i%2?-1:1)});beam.material.opacity=.28+.1*Math.sin(t*2);glow.intensity=50+8*Math.sin(t*1.6);
  const want=tg.slab>=4&&tg.slab<5?1:0;slabT+=(want-slabT)*.05;slabs.forEach((g,i)=>{g.position.y=7.2+i*(1.1+slabT*1.15);g.position.x=Math.sin(t*.4+i)*.25;g.rotation.y=t*.12*(i%2?1:-1)+slabT*.0;g.scale.setScalar(.85+slabT*.2);g.visible=true;g.children[0].material.opacity=.35+.5*slabT});
  const a=pgm.attributes.position;for(let i=0;i<NP;i++){let y=a.array[i*3+1]+sp[i]*.012;if(y>18)y=0;a.array[i*3+1]=y}a.needsUpdate=true;
  comp.render();window.__ready=true}
requestAnimationFrame(frame);
