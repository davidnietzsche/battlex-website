import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const host=document.getElementById('stage');
if(host){
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setClearColor(0,0);host.appendChild(renderer.domElement);renderer.domElement.style.cssText='width:100%;height:100%;display:block';
const scene=new THREE.Scene();const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.35;
const cam=new THREE.PerspectiveCamera(36,1,.1,100);cam.position.set(0,.6,9);
{const pl=new THREE.PointLight(0xff1a28,60,20);pl.position.set(-3,3,4);scene.add(pl);}const k=new THREE.DirectionalLight(0xffffff,1.1);k.position.set(3,5,6);scene.add(k);
const dark=new THREE.MeshStandardMaterial({color:0x0b0b0e,metalness:.92,roughness:.28});
const red=new THREE.MeshBasicMaterial({color:0xff2230});const glass=new THREE.MeshPhysicalMaterial({color:0x141418,metalness:.6,roughness:.12,transparent:true,opacity:.75,clearcoat:1});
const edge=c=>new THREE.LineBasicMaterial({color:c||0xff3040});
const G=[0,1,2,3,4].map(()=>{const g=new THREE.Group();g.visible=false;scene.add(g);return g});
function boxE(w,h,d,mat,parent,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edge()));parent.add(m);return m}
// 0 WEB — exploded browser windows assembling, cursor clicking
const wins=[];for(let i=0;i<3;i++){const w=new THREE.Group();const base=boxE(4.2,2.7,.06,glass,w,0,0,0);
  const bar=boxE(4.2,.28,.07,dark,w,0,1.21,.01);for(let d=0;d<3;d++){const dot=new THREE.Mesh(new THREE.CircleGeometry(.04,12),red);dot.position.set(-1.9+d*.14,1.21,.06);w.add(dot)}
  for(let b=0;b<4;b++)boxE(1.8-b*.15,.12,.02,b?dark:new THREE.MeshBasicMaterial({color:0xd7000f}),w,-.9+(b?0:0),.65-b*.28,.05);
  boxE(1.4,1.2,.03,dark,w,1.2,-.2,.05);G[0].add(w);wins.push(w)}
const cur=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,3),new THREE.MeshBasicMaterial({color:0xffffff}));cur.rotation.z=.5;G[0].add(cur);
// 1 APP — phone with scrolling interface
const cv=document.createElement('canvas');cv.width=256;cv.height=512;const cx=cv.getContext('2d');const ctex=new THREE.CanvasTexture(cv);ctex.colorSpace=THREE.SRGBColorSpace;
const phone=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(1.7,3.5,.16),dark);phone.add(body);body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),edge()));
const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.5,3.3),new THREE.MeshBasicMaterial({map:ctex}));scr.position.z=.085;phone.add(scr);G[1].add(phone);
function paintPhone(t){cx.fillStyle='#070709';cx.fillRect(0,0,256,512);const o=(t*40)%110;for(let i=-1;i<6;i++){const y=i*110-o+30;cx.fillStyle=i%2?'#1a1a20':'#2a0a0e';cx.beginPath();cx.roundRect(14,y,228,92,14);cx.fill();cx.fillStyle='#D7000F';cx.fillRect(26,y+16,60,10);cx.fillStyle='#4a4a54';cx.fillRect(26,y+38,150,8);cx.fillRect(26,y+54,110,8)}cx.fillStyle='#070709';cx.fillRect(0,0,256,26);cx.fillStyle='#fff';cx.fillRect(100,8,56,6);ctex.needsUpdate=true}
// 2 HOST — server blades, blinking LEDs, cloud lattice
const blades=[];for(let i=0;i<8;i++){const b=boxE(3,.34,1.8,dark,G[2],0,-1.8+i*.42,0);const led=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.02),new THREE.MeshBasicMaterial({color:0xff2230}));led.position.set(1.3,0,.91);b.add(led);const bar=new THREE.Mesh(new THREE.BoxGeometry(1.4,.05,.02),new THREE.MeshBasicMaterial({color:0x33333a}));bar.position.set(-.3,0,.91);b.add(bar);blades.push(led)}
const cloud=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.1,2)),new THREE.LineBasicMaterial({color:0xff3040,transparent:true,opacity:.7}));cloud.scale.set(1.5,.85,1);cloud.position.y=2.4;G[2].add(cloud);
const rain=[];const rg=new THREE.BufferGeometry();const rp=new Float32Array(160*3);for(let i=0;i<160;i++){rp[i*3]=(Math.random()-.5)*2.4;rp[i*3+1]=Math.random()*2;rp[i*3+2]=(Math.random()-.5)*1.2}rg.setAttribute('position',new THREE.BufferAttribute(rp,3));const rain_=new THREE.Points(rg,new THREE.PointsMaterial({color:0xff4a55,size:.05,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));G[2].add(rain_);
// 3 AI — neural network with travelling pulses
const layers=[4,6,6,3];const nodes=[];layers.forEach((n,L)=>{for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshStandardMaterial({color:0x111114,emissive:0xff1a28,emissiveIntensity:.6,metalness:.8,roughness:.2}));m.position.set(-3+L*2,(i-(n-1)/2)*.62,(Math.sin(i*2+L)*.4));G[3].add(m);nodes.push({m,L})}});
const edges=[];const eg=[];nodes.forEach(a=>nodes.forEach(b=>{if(b.L===a.L+1)edges.push([a,b])}));
const lp=[];edges.forEach(([a,b])=>lp.push(a.m.position.x,a.m.position.y,a.m.position.z,b.m.position.x,b.m.position.y,b.m.position.z));const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));G[3].add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x6a1018,transparent:true,opacity:.7})));
const pulses=[];for(let i=0;i<26;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),red);G[3].add(m);pulses.push({m,e:edges[(Math.random()*edges.length)|0],t:Math.random()})}
// 4 LOYALTY — loop ring with orbiting coins
const ringL=new THREE.Mesh(new THREE.TorusGeometry(1.9,.07,16,160),red);G[4].add(ringL);const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.3,.04,16,120),new THREE.MeshBasicMaterial({color:0x8a0a14}));G[4].add(ring2);
const coins=[];for(let i=0;i<8;i++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.07,36),new THREE.MeshStandardMaterial({color:0x15151a,metalness:1,roughness:.2,emissive:0x3a0006}));c.rotation.x=Math.PI/2;G[4].add(c);coins.push(c)}
const hub=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),new THREE.MeshStandardMaterial({color:0x0c0c0f,metalness:1,roughness:.18,emissive:0x4a0008,wireframe:false}));G[4].add(hub);hub.add(new THREE.LineSegments(new THREE.EdgesGeometry(hub.geometry),edge()));
let idx=0,mx=0,my=0;window.svcPick=i=>{idx=i;G.forEach((g,j)=>g.visible=j===i)};svcPick(0);
host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=((e.clientY-r.top)/r.height)*2-1});
function size(){const w=host.clientWidth||600,h=host.clientHeight||440;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);let vis=true;new IntersectionObserver(([e])=>vis=e.isIntersecting).observe(host);
const t0=performance.now();
function frame(now){requestAnimationFrame(frame);if(!vis)return;const t=(now-t0)/1000;
  const g=G[idx];g.rotation.y+=((mx*.7+Math.sin(t*.3)*.25)-g.rotation.y)*.05;g.rotation.x+=((my*.25)-g.rotation.x)*.05;
  if(idx===0){const a=(Math.sin(t*.8)*.5+.5);wins.forEach((w,i)=>{w.position.set((i-1)*.7*a,(1-i)*.45*a*.6,(i-1)*1.3*a-i*.1);w.rotation.y=(i-1)*.18*a});
    const c=(t*.6)%2;cur.position.set(-1.4+c*1.2,.5-c*.5,1.6);cur.scale.setScalar(c>1.6?.8:1)}
  if(idx===1){paintPhone(t);phone.rotation.y=Math.sin(t*.6)*.35;phone.position.y=Math.sin(t)*.1}
  if(idx===2){blades.forEach((l,i)=>l.material.color.setHex(Math.sin(t*3+i*1.7)>.1?0xff2230:0x3a0508));cloud.rotation.y=t*.3;const a=rain_.geometry.attributes.position;for(let i=0;i<160;i++){let y=a.array[i*3+1]-.025;if(y<0)y=2;a.array[i*3+1]=y+0}a.needsUpdate=true;rain_.position.y=.9}
  if(idx===3){pulses.forEach(p=>{p.t+=.012;if(p.t>1){p.t=0;p.e=edges[(Math.random()*edges.length)|0]}const A=p.e[0].m.position,B=p.e[1].m.position;p.m.position.lerpVectors(A,B,p.t)});nodes.forEach((n,i)=>n.m.material.emissiveIntensity=.5+.5*Math.sin(t*2+i))}
  if(idx===4){ringL.rotation.x=t*.5;ringL.rotation.y=t*.3;ring2.rotation.x=-t*.7;hub.rotation.y=t*.8;coins.forEach((c,i)=>{const a=t*.9+i/8*6.283;c.position.set(Math.cos(a)*1.9,Math.sin(a*1.3)*.6,Math.sin(a)*1.9);c.rotation.z=t*2+i})}
  renderer.render(scene,cam)}
requestAnimationFrame(frame);
}
