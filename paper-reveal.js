// One continuous raster sheet peels away over the reference composition.
// Text stays native HTML; the photography retains its original torn silhouette.
const stage = document.querySelector('.hero');
const canvas = document.querySelector('.paper-reveal');
const photo = document.querySelector('.hero-photography');
const replay = document.querySelector('.replay');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ctx = canvas.getContext('2d', {alpha: true});
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});
let progress = 1;
let animationFrame = 0;
let paper;
let width = 0;
let height = 0;
let startedAt;
let resizeFrame;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 1.25);
  width = Math.round(stage.clientWidth * dpr);
  height = Math.round(stage.clientHeight * dpr);
  canvas.width = width;
  canvas.height = height;
  paper = document.createElement('canvas');
  paper.width = width;
  paper.height = height;
  const paperCtx = paper.getContext('2d');
  paperCtx.fillStyle = '#faf9f6';
  paperCtx.fillRect(0, 0, width, height);
  if (texture) {
    paperCtx.globalCompositeOperation = 'multiply';
    paperCtx.globalAlpha = .075;
    // Only sample the flat interior of the raster paper, not its outer border.
    paperCtx.drawImage(texture, texture.width*.1, texture.height*.1, texture.width*.8, texture.height*.8, 0, 0, width, height);
  }
  if (progress < 1) draw(progress);
}

function draw(p) {
  ctx.clearRect(0, 0, width, height);
  if (p >= 1) return;
  const crease = (1.32 - p * 2.72) * width;
  const radius = width * .038;
  const alpha = 1 - Math.max(0, (p-.93)/.07);
  ctx.globalAlpha = alpha;
  // Flat front: one raster draw clipped to the moving diagonal edge.
  const diagonal=.58*width;
  const lineTop=crease-diagonal*.5, lineBottom=crease+diagonal*.5;
  ctx.save();
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(lineTop,0);ctx.lineTo(lineBottom,height);ctx.lineTo(0,height);ctx.closePath();ctx.clip();
  ctx.drawImage(paper,0,0);ctx.restore();
  // Thin cast shadow follows the crease; it is lighting, not a drawn asset.
  if(p>.08 && p<.93){
    ctx.save();ctx.transform(1,0,diagonal/height,1,lineTop,0);
    const shadow=ctx.createLinearGradient(-radius*.12,0,radius*.75,0);
    shadow.addColorStop(0,'rgba(25,22,17,.12)');shadow.addColorStop(1,'rgba(25,22,17,0)');
    ctx.fillStyle=shadow;ctx.fillRect(-radius*.12,0,radius*.87,height);ctx.restore();
  }
  // Continuous bands run along the diagonal fold, avoiding faceted mesh edges.
  const bands=110, slope=diagonal/height;
  for(let n=0;n<bands;n++){
    const a=Math.PI*n/bands, b=Math.PI*(n+1)/bands;
    const middle=(a+b)/2, distance=radius*middle;
    const yStart=Math.max(0,-(lineTop+distance)/slope);
    const yEnd=Math.min(height,(width-lineTop-distance)/slope);
    if(yEnd<=yStart)continue;
    const xA=radius*Math.sin(a), xB=radius*Math.sin(b);
    const span=xB-xA;
    if(Math.abs(span)<.02)continue;
    const z=radius*(1-Math.cos(middle));
    ctx.save();
    ctx.transform(1,0,slope,1,lineTop,0);
    ctx.translate(xA,yStart-z*.15);
    ctx.scale(span<0?-1:1,1);
    ctx.drawImage(paper,width*n/bands,yStart,width/bands+.5,yEnd-yStart,0,0,Math.abs(span)+.5,yEnd-yStart);
    const shadow=Math.sin(middle)*.21+(middle>Math.PI/2?.035:0);
    if (shadow > .002) {
      ctx.fillStyle=`rgba(45,40,30,${shadow})`;
      ctx.fillRect(0,0,Math.abs(span)+.5,yEnd-yStart);
    }
    ctx.restore();
  }
  // Back of the sheet is an exact mirrored/skewed plane after the bend.
  ctx.save();
  ctx.transform(-1,0,2*diagonal/height,1,2*lineTop+Math.PI*radius,-2*radius*.15);
  ctx.beginPath();ctx.moveTo(lineTop+Math.PI*radius,0);ctx.lineTo(width,0);ctx.lineTo(width,height);ctx.lineTo(lineBottom+Math.PI*radius,height);ctx.closePath();ctx.clip();
  ctx.drawImage(paper,0,0);
  ctx.fillStyle='rgba(50,43,32,.035)';ctx.fillRect(0,0,width,height);ctx.restore();
  ctx.globalAlpha=1;
}

function finish(state='complete') {
  cancelAnimationFrame(animationFrame);
  progress=1;
  if(ctx)ctx.clearRect(0,0,width,height);
  canvas.classList.add('is-done');
  document.body.dataset.animation=state;
}

function play() {
  cancelAnimationFrame(animationFrame);
  if(reduceMotion.matches){finish('reduced');return;}
  if(!ctx || !paper){finish('fallback');return;}
  startedAt=undefined;
  progress=0;
  document.body.dataset.animation='playing';
  canvas.classList.remove('is-done');
  draw(0);
  const tick = (now) => {
    startedAt ??= now+160;
    const t=Math.max(0,Math.min(1,(now-startedAt)/2600));
    // A slow lift, a decisive peel, then a soft release.
    progress=t*t*(3-2*t);
    draw(progress);
    if(t<1 && !reduceMotion.matches)animationFrame=requestAnimationFrame(tick);
    else finish(reduceMotion.matches?'reduced':'complete');
  };
  animationFrame=requestAnimationFrame(tick);
}

let texture;
async function init(){
  try {
    [texture] = await Promise.all([loadImage('./assets/paper.jpg'),photo.decode(),loadImage('./assets/hero-cutouts.png')]);
    if(!ctx){finish('fallback');return;}
    resize();
    new ResizeObserver(()=>{
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(resize);
    }).observe(stage);
    replay.addEventListener('click',play);
    reduceMotion.addEventListener('change',play);
    document.addEventListener('visibilitychange',()=>{if(document.hidden && progress<1)finish();});
    document.body.dataset.ready='true';
    const frame=new URLSearchParams(location.search).get('reveal');
    const fixed=frame===null?NaN:Number(frame);
    if(Number.isFinite(fixed)&&fixed>=0&&fixed<=1){
      if(fixed===1)finish();
      else{progress=fixed;canvas.classList.remove('is-done');draw(progress);document.body.dataset.animation='preview';}
    }else play();
  } catch {
    finish('fallback');
    replay.hidden=true;
  }
}
init();
