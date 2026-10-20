import * as THREE from 'three';
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const CREAM=0xf1e6d3;renderer.setClearColor(CREAM,1);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(CREAM,10,62);
const cam=new THREE.PerspectiveCamera(58,1,.1,200);scene.add(cam);
await document.fonts.load('700 120px Oswald').catch(()=>{});await document.fonts.load('italic 120px "Instrument Serif"').catch(()=>{});
const TL=new THREE.TextureLoader();
const load=f=>{const t=TL.load('about/img/'+f);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const PAINT=['b-portal','b-hall','b-desk','b-reunion','b-rescue','b-guardians','b-door'].map(n=>load(n+'.webp'));
// ---- painted backdrop (dissolves painting → painting with brush noise; slow push-in per scene)
const bgMat=new THREE.ShaderMaterial({
  uniforms:{A:{value:PAINT[0]},B:{value:PAINT[0]},m:{value:0},aspect:{value:1},mouse:{value:new THREE.Vector2()},zA:{value:1.05},zB:{value:1.05},t:{value:0},fog:{value:1}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`precision highp float;varying vec2 v;uniform sampler2D A,B;uniform float m,aspect,zA,zB,t;uniform vec2 mouse;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
  vec2 cover(vec2 uv,float ia,float z,vec2 off){vec2 c=uv-.5;if(aspect>ia)c.y*=ia/aspect;else c.x*=aspect/ia;return c/z+.5+off;}
  void main(){
    float k=fbm(v*vec2(aspect,1.)*3.4+t*.02);
    float r=clamp((m*1.25-k)*6.,0.,1.);
    vec3 ca=texture2D(A,cover(v,1.5,zA,mouse*.012)).rgb,cb=texture2D(B,cover(v,1.5,zB,mouse*.012)).rgb;
    vec3 c=mix(ca,cb,m>=.999?1.:(m<=.001?0.:r));
    float front=smoothstep(0.,.25,r)*(1.-smoothstep(.25,.6,r))*step(.001,m)*step(m,.999);
    c+=vec3(1.,.85,.55)*front*.28;
    float d=length(v-.5);c*=1.-smoothstep(.55,1.,d)*.22;
    c+=(h(v*900.+t)-.5)*.025;
    gl_FragColor=vec4(pow(max(c,0.),vec3(1./2.2)),1.);}`,depthTest:false,depthWrite:false});
const bg=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bgMat);bg.frustumCulled=false;bg.renderOrder=-10;scene.add(bg);
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
const portalMat=new THREE.MeshBasicMaterial({map:PAINT[0],transparent:true,fog:false});
const portal=new THREE.Mesh(new THREE.CircleGeometry(4.6,96),portalMat);portal.position.z=END+.2;
const pu=portal.geometry.attributes.uv,pp=portal.geometry.attributes.position;for(let i=0;i<pu.count;i++){pu.setXY(i,.5+pp.getX(i)/9.2*.7,.5+pp.getY(i)/9.2*.7*1.5)}
scene.add(portal);
const ringMat=new THREE.MeshBasicMaterial({color:0xD7000F,transparent:true,fog:false});
const ring=new THREE.Mesh(new THREE.TorusGeometry(4.7,.09,12,128),ringMat);ring.position.z=END+.25;scene.add(ring);
function size(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();bgMat.uniforms.aspect.value=w/h}
size();addEventListener('resize',size);
// ---- scroll model
const hero=document.querySelector('.hero'),secs=[...document.querySelectorAll('[data-p]:not(.hero)')];
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const ov=[...document.querySelectorAll('.ov')];
function heroP(){const L=hero.offsetHeight-innerHeight;return Math.min(1,Math.max(0,scrollY/L))}
function sect(){
  const y=scrollY+innerHeight*.5;let i=0;secs.forEach((s,k)=>{if(s.offsetTop<=y)i=k});
  const s=secs[i],nx=secs[i+1]||s,frac=Math.min(1,Math.max(0,(y-s.offsetTop)/s.offsetHeight));
  return {fa:frac,a:+s.dataset.p,b:+nx.dataset.p,t:ss(.74,1,frac),same:s===nx}}
let mx=0,my=0,smx=0,smy=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
const qp=new URLSearchParams(location.search).get('y');if(qp)setTimeout(()=>scrollTo(0,+qp),50);
const t0=performance.now();
function frame(now){requestAnimationFrame(frame);
  const t=(now-t0)/1000;smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
  const hp=heroP(),e=ease(hp);
  cam.position.set(smx*.35,-smy*.22,10-e*72);cam.rotation.z=Math.sin(hp*3.1)*.05;cam.lookAt(smx*.6,-smy*.4,cam.position.z-12);
  tun.rotation.y=hp*2.4;
  const open=1-ss(.9,1,hp);portalMat.opacity=open;ringMat.opacity=open;portal.visible=ring.visible=open>.01;
  const u=bgMat.uniforms,st=sect();
  u.A.value=PAINT[st.same?st.a:st.a];u.B.value=PAINT[st.b];u.m.value=st.same?0:st.t;
  u.zA.value=1.04+(hp<1?0:st.fa*.12)+(hp>=1?0:ss(.8,1,hp)*.0);u.zB.value=1.04;u.t.value=t;u.mouse.value.set(smx,-smy);
  if(hp<1){u.A.value=PAINT[0];u.B.value=PAINT[0];u.m.value=0;u.zA.value=u.zB.value=1.04+ss(.7,1,hp)*.04}
  ov.forEach(o=>{const a=+o.dataset.a,b=+o.dataset.b,f=.05;const v=Math.max(0,Math.min(1,Math.min(a<=0?1:(hp-a)/f,(b-hp)/f)));o.style.opacity=v});
  renderer.render(scene,cam);window.__ready=true}
requestAnimationFrame(frame);
