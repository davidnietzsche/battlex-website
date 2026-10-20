import * as THREE from 'three';
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const CREAM=0xf1e6d3;renderer.setClearColor(CREAM,1);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(CREAM,16,95);
const cam=new THREE.PerspectiveCamera(58,1,.1,200);scene.add(cam);
await document.fonts.load('700 120px Oswald').catch(()=>{});await document.fonts.load('italic 120px "Instrument Serif"').catch(()=>{});
const TL=new THREE.TextureLoader();
const load=f=>{const t=TL.load('about/img/'+f);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const PAINT=['b-portal','b-hall','b-desk','b-reunion','b-rescue','b-guardians','b-door'].map(n=>load(n+'.webp'));
// ---- paper tube of type (OPPO reference) with a painted portal at its end
const R=5,LEN=70,END=-62;
function tunnelTex(){
  const c=document.createElement('canvas');c.width=4096;c.height=2048;const g=c.getContext('2d');
  g.fillStyle='#f1e6d3';g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<9000;i++){g.fillStyle=`rgba(120,90,50,${Math.random()*.05})`;g.fillRect(Math.random()*c.width,Math.random()*c.height,2,2)}
  const words=['DATA','HUMAN','RESULTS','ROAS','EMPATHY','LEADS','GROWTH','CPL','TRUST','CLICKS','STORY','ROI','PEOPLE','SALES','CRAFT','HEART','BATTLE'];
  let y=0,r=0;
  while(y<c.height){
    const h=[120,170,230,150,280][r%5],serif=r%4===1;
    g.font=serif?`italic 400 ${h*1.15}px "Instrument Serif", serif`:`700 ${h}px Oswald, Impact, sans-serif`;g.textBaseline='top';
    let x=-((r*397)%700);
    while(x<c.width){
      const w=words[(r*5+Math.floor(x/97))%words.length];const m=g.measureText(w+'  ').width;
      const hot=(r+Math.floor(x/m))%4===0;
      g.fillStyle=hot?'#D7000F':(r%3===0?'#2b1810':'#a89478');g.globalAlpha=hot?.95:(r%3===0?.85:.55);g.fillText(w,x,y);x+=m;
    }
    y+=h*.9;r++;
  }
  g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.repeat.set(-1,LEN/14);return t;
}
const tun=new THREE.Mesh(new THREE.CylinderGeometry(R,R,LEN,64,1,true),new THREE.MeshBasicMaterial({map:tunnelTex(),side:THREE.BackSide}));
tun.rotation.x=Math.PI/2;tun.position.z=-LEN/2+8;scene.add(tun);

// portal: painted disc + ring
const portalMat=new THREE.MeshBasicMaterial({map:load('c-sea.webp'),transparent:true,fog:false});
const portal=new THREE.Mesh(new THREE.CircleGeometry(4.6,96),portalMat);portal.position.z=END+.2;
const pu=portal.geometry.attributes.uv,pp=portal.geometry.attributes.position;for(let i=0;i<pu.count;i++){pu.setXY(i,.5+pp.getX(i)/9.2*.7,.5+pp.getY(i)/9.2*.7*1.5)}
scene.add(portal);
const ringMat=new THREE.MeshBasicMaterial({color:0xD7000F,transparent:true,fog:false});
const ring=new THREE.Mesh(new THREE.TorusGeometry(4.7,.09,12,128),ringMat);ring.position.z=END+.25;scene.add(ring);

// ---- the painted world: plates the camera flies through, cut-out figures, drifting 3D cloud banks
const TLp=new THREE.TextureLoader();
const ltex=(f)=>{const t=TLp.load('about/img/'+f);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const CL=['c-cloud1.png','c-cloud2.png','c-cloud3.png','c-cloud5.png'].map(ltex);
const SC=['c-sea.webp','b-hall.webp','b-desk.webp','b-reunion.webp','b-rescue.webp','b-guardians.webp','b-door.webp'];
const ZC=SC.map((_,k)=>-80-k*46);                     // camera hold z for each scene
function sprite(tex,w,aspect,x,y,z,op=1,fog=true){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/aspect),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:op,depthWrite:false,fog,side:THREE.DoubleSide}));m.position.set(x,y,z);m.userData={bx:x,by:y,bz:z};scene.add(m);return m}
const plates=SC.map((f,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(40,26.7),new THREE.MeshBasicMaterial({map:ltex(f),fog:true,transparent:true}));m.position.set(0,0,ZC[k]-12);m.userData={bx:0,by:0,bz:ZC[k]-12};scene.add(m);return m});
const drift=[];
// hero scene cut-outs (figures on rocks, cherubs) in front of the sea plate
const fig=sprite(ltex('c-figures.png'),9.5,1.59,0,-.6,ZC[0]-7.5,1);drift.push([fig,.0,.04]);
[['c-cherub0.png',-5.2,3.4,ZC[0]-6,3.2,1.2],['c-cherub1.png',0,5,ZC[0]-8,3.4,1.1],['c-cherub2.png',5.4,3.2,ZC[0]-5.5,3.4,1.15]].forEach(([f,x,y,z,w,a],i)=>{const m=sprite(ltex(f),w,a,x,y,z);drift.push([m,.35+i*.1,.18])});
// cloud banks around every scene and in the passages between them
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function bank(z0,z1,n){for(let i=0;i<n;i++){
  const z=z0+(z1-z0)*rnd(),low=rnd()<.72;const w=7+rnd()*10;const tex=CL[(rnd()*4)|0];
  const img=tex.image;const asp=1.7;
  const x=(rnd()-.5)*34,y=low?-5.4-rnd()*2.4+(1-Math.min(1,w/14))*1.2:5.2+rnd()*3;
  const m=sprite(tex,w,low?1.7:2.2,x,y,z,.96);if(!low)m.scale.y=-1;drift.push([m,(rnd()-.5)*.5,.0])}}
ZC.forEach((zc,k)=>{bank(zc-8,zc+5,16);if(k<ZC.length-1)bank(zc-44,zc-10,22)});
bank(END-6,ZC[0]+10,16);
function size(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
size();addEventListener('resize',size);
// ---- scroll model: hero zoom through the tube, then one continuous dolly through the scenes
const hero=document.querySelector('.hero'),secs=[...document.querySelectorAll('[data-p]:not(.hero)')];
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const ov=[...document.querySelectorAll('.ov')];
function heroP(){const L=hero.offsetHeight-innerHeight;return Math.min(1,Math.max(0,scrollY/L))}
function sectZ(){
  const y=scrollY+innerHeight*.5;let i=0;secs.forEach((s,k)=>{if(s.offsetTop<=y)i=k});
  const s=secs[i],frac=Math.min(1,Math.max(0,(y-s.offsetTop)/s.offsetHeight));
  const a=+s.dataset.p,b=Math.min(ZC.length-1,a+1);return ZC[a]+(ZC[b]-ZC[a])*(a===b?0:ss(.5,1,frac))}
let mx=0,my=0,smx=0,smy=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
const qp=new URLSearchParams(location.search).get('y');if(qp)setTimeout(()=>scrollTo(0,+qp),50);
const t0=performance.now();
function frame(now){requestAnimationFrame(frame);
  const t=(now-t0)/1000;smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
  const hp=heroP(),e=ease(hp);
  let z;
  if(hp<1)z=10-e*(10-ZC[0]);else z=sectZ();
  cam.position.set(smx*.9,-smy*.5+(hp<1?0:.0),z);cam.rotation.z=hp<1?Math.sin(hp*3.1)*.05:smx*-.015;cam.lookAt(smx*1.2,-smy*.7,z-12);
  tun.rotation.y=hp*2.4;
  const open=1-ss(.9,1,hp);portalMat.opacity=open;ringMat.opacity=open;portal.visible=ring.visible=open>.01;
  tun.visible=hp<1;
  drift.forEach(([m,vx,vy],i)=>{m.position.x=m.userData.bx+Math.sin(t*.25+i)*vx*3;m.position.y=m.userData.by+Math.sin(t*.4+i*1.7)*vy});
  plates.forEach(p=>{p.position.x=p.userData.bx-smx*.5;p.position.y=p.userData.by+smy*.3;const d=Math.abs(p.position.z-z);p.material.opacity=1-ss(13,28,d)});
  ov.forEach(o=>{const a=+o.dataset.a,b=+o.dataset.b,f=.05;const v=Math.max(0,Math.min(1,Math.min(a<=0?1:(hp-a)/f,(b-hp)/f)));o.style.opacity=v});
  renderer.render(scene,cam);window.__ready=true}
requestAnimationFrame(frame);
