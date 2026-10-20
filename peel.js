// Warp an AI-generated raster paper texture around a diagonal cylindrical fold.
// Canvas 2D keeps the animation available even when WebGL is disabled.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const panels = [...document.querySelectorAll('.photo')];
const replay = document.querySelector('.replay');
let activeRun = 0;
let completed = 0;
const image = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

function makePaper(panel, texture) {
  const canvas = panel.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let progress = 0;
  let frame = 0;
  if (!ctx) return {play: (_delay, done) => {canvas.classList.add('is-done');done();}, stop:()=>{}};
  panel.dataset.renderer = 'canvas2d';
  const draw = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const cw = Math.round(canvas.clientWidth * dpr);
    const ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {canvas.width = cw;canvas.height = ch;}
    ctx.clearRect(0, 0, cw, ch);
    const w = cw / 1.24, h = ch / 1.24;
    const ox = (cw - w) / 2, oy = (ch - h) / 2;
    const crease = (1.4 - progress * 2.55) * w;
    const radius = w * .11;
    const columns = 110;
    const strips = [];
    const fold = (x) => {
      const distance = x - crease;
      if (distance <= 0) return {x,z:0,angle:0};
      const angle = Math.min(Math.PI, distance / radius);
      const past = Math.max(0, distance - Math.PI * radius);
      return {x:crease + Math.sin(angle)*radius - past,z:radius*(1-Math.cos(angle)),angle};
    };
    for(let n = 0; n < columns; n++) {
      const a = fold(w*n/columns), b = fold(w*(n+1)/columns);
      strips.push({n,a,b,z:(a.z+b.z)/2});
    }
    // Draw the back of the sheet last so it naturally occludes the flat part.
    strips.sort((a,b)=>a.z-b.z);
    const fade = 1 - Math.max(0, (progress-.88)/.12);
    ctx.globalAlpha = Math.max(0,fade);
    if (progress > .12 && progress < .88) {
      const shadowX = ox + crease;
      const shadow = ctx.createLinearGradient(shadowX-radius*.4,0,shadowX+radius,0);
      shadow.addColorStop(0,'rgba(26,23,17,0)');
      shadow.addColorStop(.45,'rgba(26,23,17,.18)');
      shadow.addColorStop(1,'rgba(26,23,17,0)');
      ctx.fillStyle=shadow;ctx.fillRect(shadowX-radius*.4,oy,radius*1.4,h);
    }
    for(const {n,a,b,z} of strips){
      let dw = b.x-a.x;
      if(Math.abs(dw)<.08) continue;
      const scale=1+z/w*.45;
      const dy=oy-(h*(scale-1))*.45-z*.12;
      ctx.save();ctx.translate(ox+a.x,dy);ctx.scale(dw<0?-1:1,1);
      ctx.drawImage(texture,texture.width*n/columns,0,texture.width/columns+.6,texture.height,0,0,Math.abs(dw)+.8,h*scale);
      const shade=Math.sin((a.angle+b.angle)/2)*.19+(a.angle>Math.PI/2?.035:0);
      if(shade>.002){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=`rgba(45,38,27,${shade})`;ctx.fillRect(0,0,Math.abs(dw)+.8,h*scale);}
      ctx.restore();
    }
    ctx.globalAlpha=1;
  };
  const resize = new ResizeObserver(()=>{if(progress<1)draw();});
  resize.observe(canvas);
  return {
    stop(){cancelAnimationFrame(frame);},
    play(delay,done){
      cancelAnimationFrame(frame);
      progress=0;panel.classList.remove('is-revealed');canvas.classList.remove('is-done');draw();
      let start;
      const tick=(now)=>{
        start ??= now+delay;
        const t=Math.max(0,Math.min(1,(now-start)/2100));
        progress=t*t*(3-2*t);
        draw();
        if(t<1&&!motionPreference.matches) frame=requestAnimationFrame(tick);
        else{progress=1;ctx.clearRect(0,0,canvas.width,canvas.height);canvas.classList.add('is-done');panel.classList.add('is-revealed');done();}
      };
      frame=requestAnimationFrame(tick);
    }
  };
}

async function init(){
  try{
    const [paper]=await Promise.all([image('./assets/paper.png'),image('./assets/photos.png')]);
    const sheets=panels.map(panel=>makePaper(panel,paper));
    const play=()=>{
      const id=++activeRun;completed=0;
      sheets.forEach(sheet=>sheet.stop());
      if(motionPreference.matches){
        panels.forEach(panel=>{panel.querySelector('canvas').classList.add('is-done');panel.classList.add('is-revealed');});
        document.body.dataset.animation='reduced';return;
      }
      document.body.dataset.animation='playing';
      sheets.forEach((sheet,index)=>sheet.play(220+index*260,()=>{
        if(id!==activeRun)return;
        if(++completed===sheets.length)document.body.dataset.animation='complete';
      }));
    };
    replay.addEventListener('click',play);
    motionPreference.addEventListener('change',play);
    document.body.dataset.ready='true';
    play();
  }catch{
    panels.forEach(panel=>panel.querySelector('canvas').classList.add('is-done'));
    document.body.dataset.animation='fallback';replay.hidden=true;
  }
}
init();
