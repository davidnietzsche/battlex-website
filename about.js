import * as THREE from 'three';
const canvas=document.getElementById('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setClearColor(0x030304,1);
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(40,1,.1,100);cam.position.set(0,0,8);scene.add(cam);
const TL=new THREE.TextureLoader();
const load=f=>{const t=TL.load('about/img/'+f);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t};
const PAINT=['p-sky','a-hall','a-desk','a-reunion','a-rescue','a-guardians','a-door'].map(n=>load(n+'.webp'));
// ---- painted backdrop: full-screen shader, dissolves between paintings with a brush-noise mask
const bgMat=new THREE.ShaderMaterial({
  uniforms:{A:{value:PAINT[0]},B:{value:PAINT[0]},m:{value:0},aspect:{value:1},mouse:{value:new THREE.Vector2()},zA:{value:1.05},zB:{value:1.05},ba:{value:1},bb:{value:1},t:{value:0}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`precision highp float;varying vec2 v;uniform sampler2D A,B;uniform float m,aspect,zA,zB,ba,bb,t;uniform vec2 mouse;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
  vec2 cover(vec2 uv,float imgA,float z,vec2 off){vec2 c=uv-.5;if(aspect>imgA)c.y*=imgA/aspect;else c.x*=aspect/imgA;return c/z+.5+off;}
  void main(){
    float k=fbm(v*vec2(aspect,1.)*3.2+t*.03);
    float mask=smoothstep(m-.18,m+.18,1.-k+(m*1.36-.18)*0.0+ (1.-m)*.0 - .0 + (m-.5)*.0 + (1.-2.*m)*.0 );
    // brush-noise dissolve: reveal B where noise < m
    float edge=smoothstep(0.,.08,m*1.3-k+.0);
    float r=clamp((m*1.25-k)*6.+.0,0.,1.);
    vec2 pa=cover(v,1.5,zA,mouse*.012),pb=cover(v,1.5,zB,mouse*.012);
    vec3 ca=texture2D(A,pa).rgb*ba,cb=texture2D(B,pb).rgb*bb;
    vec3 c=mix(ca,cb,m>=.999?1.:(m<=.001?0.:r));
    // ember rim on the dissolve front
    float front=smoothstep(.0,.25,r)*(1.-smoothstep(.25,.6,r))*step(.001,m)*step(m,.999);
    c+=vec3(.9,.12,.05)*front*.35;
    float d=length(v-.5);c*=1.-smoothstep(.45,.95,d)*.6;
    c+=(h(v*900.+t)-.5)*.04;
    gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false});
const bg=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bgMat);bg.frustumCulled=false;bg.renderOrder=-10;scene.add(bg);
// ---- hero depth layers (additive: painted black reads as transparent)
function layer(f,w,h,x,y,z,op){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:load(f),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));m.position.set(x,y,z);m.userData={bx:x,by:y,op};scene.add(m);return m}
const mid=layer('p-mid.webp',10,6.67,0,-1.15,0,.95);
const cloud=layer('p-cloud.webp',14,9.33,0,-2.6,3.2,.85);
const layers=[[mid,.35],[cloud,.8]];
// embers
const N=380,pa=new Float32Array(N*3),sp=new Float32Array(N);
for(let i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*16;pa[i*3+1]=(Math.random()-.5)*10;pa[i*3+2]=(Math.random()-.5)*8;sp[i]=.2+Math.random()*.6}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const embers=new THREE.Points(pg,new THREE.PointsMaterial({color:0xff5a30,size:.045,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(embers);
function size(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();bgMat.uniforms.aspect.value=w/h;
  const s=Math.max(1,(w/h)/1.5);mid.scale.setScalar(s);cloud.scale.setScalar(s)}
size();addEventListener('resize',size);
// ---- scroll → which painting
const secs=[...document.querySelectorAll('[data-p]')];
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function state(){
  const y=scrollY+innerHeight*.5;let i=0;
  secs.forEach((s,k)=>{if(s.offsetTop<=y)i=k});
  const s=secs[i],nx=secs[i+1]||s,frac=Math.min(1,Math.max(0,(y-s.offsetTop)/s.offsetHeight));
  const tt=ss(.78,1,frac);return {fa:frac,a:+s.dataset.p,b:+nx.dataset.p,ba:+s.dataset.b,bb:+nx.dataset.b,t:tt,same:+s.dataset.p===+nx.dataset.p}}
let mx=0,my=0,smx=0,smy=0,v=0;
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const t0=performance.now();const qy=new URLSearchParams(location.search).get('y');if(qy)setTimeout(()=>scrollTo(0,+qy),50);
function frame(now){requestAnimationFrame(frame);
  const t=(now-t0)/1000;smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
  const st=state(),u=bgMat.uniforms;
  u.A.value=PAINT[st.a];u.B.value=PAINT[st.b];u.t.value=t;
  const mm=st.same?0:st.t;u.m.value=mm;u.ba.value=st.ba;u.bb.value=st.same?st.ba:st.bb;if(st.same){u.B.value=PAINT[st.a];u.bb.value=st.ba;u.m.value=0}
  u.mouse.value.set(smx,-smy);
  const sc=Math.min(scrollY/innerHeight,1.2);
  u.zA.value=1.04+st.fa*.14;u.zB.value=1.04+(st.same?st.fa:0)*.14;
  // hero layers: parallax by depth, camera pushes forward and they dissolve past the lens
  cam.position.z=8-sc*3.6;
  layers.forEach(([m,d])=>{m.position.x=m.userData.bx-smx*d;m.position.y=m.userData.by+smy*d*.5+(reduce?0:Math.sin(t*.4+d)*.03);m.material.opacity=m.userData.op*(1-ss(.35,1,sc))});
  const pp=pg.attributes.position;for(let i=0;i<N;i++){let y=pp.array[i*3+1]+sp[i]*.006*(reduce?0:1);if(y>5)y=-5;pp.array[i*3+1]=y;pp.array[i*3]+=Math.sin(t+i)*.0008}pp.needsUpdate=true;
  embers.position.x=-smx*.5;embers.material.opacity=.9*(1-ss(.8,1.4,sc*1.0))*.9+.1;
  renderer.render(scene,cam);window.__ready=true}
requestAnimationFrame(frame);
