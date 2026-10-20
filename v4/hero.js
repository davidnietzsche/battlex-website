import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const canvas=document.getElementById('gl'),hero=canvas.parentElement;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.55;
const cam=new THREE.PerspectiveCamera(30,1,.1,60);cam.position.set(0,0,11);
function faceTex(a,b){const c=document.createElement('canvas');c.width=256;c.height=384;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,256,384);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,256,384);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const geo=new THREE.ExtrudeGeometry(roundedShape(2.2,3.1,.28),{depth:.07,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:6,curveSegments:24});geo.center();
const rig=new THREE.Group();scene.add(rig);
const defs=[{a:'#e0141f',b:'#3a0508',pos:[-.35,.25,0],rot:[.2,-.5,.5],m:.4,r:.12},{a:'#2a0306',b:'#080203',pos:[.35,.0,-.5],rot:[-.1,-.2,.1],m:.95,r:.14},{a:'#D7000F',b:'#1a0306',pos:[.95,-.4,.45],rot:[.1,-.65,-.2],m:.2,r:.1}];
const cards=defs.map((d,i)=>{
  const mat=new THREE.MeshPhysicalMaterial({map:faceTex(d.a,d.b),metalness:d.m,roughness:d.r,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.4});
  const m=new THREE.Mesh(geo,mat);m.position.set(...d.pos);m.rotation.set(...d.rot);m.userData={p:new THREE.Vector3(...d.pos),r:new THREE.Euler(...d.rot),i};
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,40),new THREE.LineBasicMaterial({color:0xef2b36,transparent:true,opacity:.65})));
  rig.add(m);return m});
const l1=new THREE.PointLight(0xd7000f,70,16);l1.position.set(-3,3,4);scene.add(l1);
const l2=new THREE.PointLight(0xffffff,30,14);l2.position.set(3,-2,5);scene.add(l2);
const key=new THREE.DirectionalLight(0xffd6d0,1.4);key.position.set(2,5,6);scene.add(key);
const N=260,pa=new Float32Array(N*3);for(let i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*12;pa[i*3+1]=(Math.random()-.5)*7;pa[i*3+2]=(Math.random()-.5)*5}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xef2b36,size:.03,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(pts);
let mx=0,my=0,vis=true;const t0=performance.now();
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
function size(){const w=hero.clientWidth,h=hero.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;const k=Math.min(1,w/h/1.5);rig.scale.setScalar(.9+.25*k);rig.position.set(0,w/h<1?.4:-.1,0);cam.updateProjectionMatrix()}
size();addEventListener('resize',size);
new IntersectionObserver(([e])=>vis=e.isIntersecting).observe(hero);
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
function frame(now){requestAnimationFrame(frame);if(!vis)return;
  const t=(now-t0)/1000,sc=Math.min(scrollY/innerHeight,1);
  rig.rotation.y+=((mx*.5)-rig.rotation.y)*.05;rig.rotation.x+=((my*.25)-rig.rotation.x)*.05;
  cards.forEach(c=>{const f=Math.sin(t*(reduce?0:.9)+c.userData.i*2)*.12;
    c.position.set(c.userData.p.x*(1+sc*1.2),c.userData.p.y+f-sc*1.3,c.userData.p.z+sc*1.5);
    c.rotation.set(c.userData.r.x+Math.sin(t*.5+c.userData.i)*.05,c.userData.r.y+t*(reduce?0:.12)*(c.userData.i-1)*.35,c.userData.r.z+sc*.5)});
  pts.rotation.y=t*.02;l1.position.x=-3+Math.sin(t*.6)*1.5;
  renderer.render(scene,cam);window.__ready=true}
requestAnimationFrame(frame);
