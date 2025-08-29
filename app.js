// DJ's Drum-Kit — Object Detect MVP v3
// Adds: freemium unlock, social keys storage, visual clones, demo video mode
const UI = {
  gate: document.getElementById('gate'),
  enableBtn: document.getElementById('enableBtn'),
  // tabs
  tabPlay: document.getElementById('tab-play'),
  tabSettings: document.getElementById('tab-settings'),
  tabDemo: document.getElementById('tab-demo'),
  tabBtns: Array.from(document.querySelectorAll('.tabBtn')),
  // play
  stage: document.getElementById('stage'),
  video: document.getElementById('video'),
  draw: document.getElementById('draw'),
  padsLayer: document.getElementById('pads'),
  listDetected: document.getElementById('detectedList'),
  listPads: document.getElementById('padList'),
  clearPads: document.getElementById('clearPads'),
  saveProject: document.getElementById('saveProject'),
  loadProject: document.getElementById('loadProject'),
  exportProject: document.getElementById('exportProject'),
  importBtn: document.getElementById('importBtn'),
  importProject: document.getElementById('importProject'),
  shareProject: document.getElementById('shareProject'),
  deleteProject: document.getElementById('deleteProject'),
  bpm: document.getElementById('bpm'),
  showBoxes: document.getElementById('showBoxes'),
  recBtn: document.getElementById('recBtn'),
  stopBtn: document.getElementById('stopBtn'),
  downloadLink: document.getElementById('downloadLink'),
  // settings
  unlockCode: document.getElementById('unlockCode'),
  unlockBtn: document.getElementById('unlockBtn'),
  licenseFile: document.getElementById('licenseFile'),
  proStatus: document.getElementById('proStatus'),
  keyInstagram: document.getElementById('keyInstagram'),
  keyTikTok: document.getElementById('keyTikTok'),
  keyYouTube: document.getElementById('keyYouTube'),
  keyFacebook: document.getElementById('keyFacebook'),
  keyX: document.getElementById('keyX'),
  saveKeys: document.getElementById('saveKeys'),
  keysSaved: document.getElementById('keysSaved'),
  // demo
  demoVideoFile: document.getElementById('demoVideoFile'),
  useDemoBtn: document.getElementById('useDemoBtn'),
};

// Tabs
UI.tabBtns.forEach(btn => btn.addEventListener('click', () => {
  const t = btn.dataset.tab;
  UI.tabPlay.classList.toggle('hidden', t!=='play');
  UI.tabSettings.classList.toggle('hidden', t!=='settings');
  UI.tabDemo.classList.toggle('hidden', t!=='demo');
}));

// ---- Sounds & Freemium ----
const SOUND_LIST_FREE = ['kick','snare','hihatC','hihatO','tomH','crash','clap','shaker'];
const SOUND_LIST_PRO  = ['tomM','tomL','ride','rim','cowbell','tamb','congaH','congaL','bongo','triangle','woodblock','kick']; // 12 pro
const SOUND_LIST = [...SOUND_LIST_FREE, ...SOUND_LIST_PRO];

function proUnlocked() { return localStorage.getItem('djs-pro') === '1'; }
function setProUnlocked(v) { localStorage.setItem('djs-pro', v ? '1' : '0'); UI.proStatus.textContent = 'Pro: ' + (v?'unlocked':'locked'); }

// ---- Drum Synth (same as earlier v2, omitted for brevity) ----
class DrumSynth {
  constructor(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
  }
  _env(node, a=0.001, d=0.12, r=0.12, peak=1.0) {
    const t = this.ctx.currentTime;
    node.gain.setValueAtTime(0.0001, t);
    node.gain.linearRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r);
  }
  _noise(dur=0.2) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate*dur, this.ctx.sampleRate);
    const ch = b.getChannelData(0);
    for (let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;
    const src = this.ctx.createBufferSource(); src.buffer=b; return src;
  }
  kick(vel=1){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(55,t+.12);this._env(g,.002,.18,.12,.9*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.35);}
  snare(vel=1){const t=this.ctx.currentTime,n=this._noise(.2),hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1200;const g=this.ctx.createGain();this._env(g,.001,.12,.08,.8*vel);n.connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+.2);}
  hihatC(vel=1){this._hat(vel,false)}
  hihatO(vel=1){this._hat(vel,true)}
  _hat(vel,open){const t=this.ctx.currentTime,d=open?.45:.07,n=this._noise(d),bp=this.ctx.createBiquadFilter(),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();bp.type='bandpass';bp.frequency.value=8000;bp.Q.value=.7;hp.type='highpass';hp.frequency.value=6000;this._env(g,.001,d*.6,d*.4,.6*vel);n.connect(bp).connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+d);}
  tomH(vel=1){this._tom(vel,240)} tomM(vel=1){this._tom(vel,180)} tomL(vel=1){this._tom(vel,140)}
  _tom(vel,p){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(p,t);o.frequency.exponentialRampToValueAtTime(p*.6,t+.08);this._env(g,.001,.12,.1,.8*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.24);}
  crash(vel=1){const t=this.ctx.currentTime,d=1.2,n=this._noise(d),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();hp.type='highpass';hp.frequency.value=4000;this._env(g,.002,.8,.4,.6*vel);n.connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+d);const bell=this.ctx.createOscillator(),gb=this.ctx.createGain();bell.type='triangle';bell.frequency.setValueAtTime(700,t);this._env(gb,.001,.05,.15,.2*vel);bell.connect(gb).connect(this.master);bell.start(t);bell.stop(t+.2);}
  ride(vel=1){const t=this.ctx.currentTime,d=1.6,n=this._noise(d),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();hp.type='highpass';hp.frequency.value=3000;this._env(g,.001,1.2,.4,.5*vel);n.connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+d);const ping=this.ctx.createOscillator(),gp=this.ctx.createGain();ping.type='sine';ping.frequency.setValueAtTime(1000,t);this._env(gp,.001,.06,.2,.15*vel);ping.connect(gp).connect(this.master);ping.start(t);ping.stop(t+.15);}
  clap(vel=1){const t=this.ctx.currentTime,n=this._noise(.2),bp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();bp.type='bandpass';bp.frequency.value=1000;bp.Q.value=0.5;this._env(g,.001,.12,.08,.8*vel);n.connect(bp).connect(g).connect(this.master);n.start(t);n.stop(t+.2);}
  rim(vel=1){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g	this.ctx.createGain();o.type='square';o.frequency.setValueAtTime(1500,t);this._env(g,.001,.04,.08,.4*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.1);}
  cowbell(vel=1){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),o2=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o2.type='square';o.frequency.setValueAtTime(540,t);o2.frequency.setValueAtTime(800,t);this._env(g,.001,.2,.12,.5*vel);o.connect	g).connect(this.master);o2.connect(g);o.start(t);o2.start(t);o.stop(t+.25);o2.stop(t+.25);}
  shaker(vel=1){const t=this.ctx.currentTime,n=this._noise(.25),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();hp.type='highpass';hp.frequency.value=8000;this._env(g,.001,.15,.1,.5*vel);n.connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+.25);}
  tamb(vel=1){const t=this.ctx.currentTime,d=.6,n=this._noise(d),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();hp.type='highpass';hp.frequency.value=2500;this._env(g,.001,.4,.2,.5*vel);n.connect(hp).connect(g).connect(this.master);n.start(t);n.stop(t+d);}
  congaH(vel=1){this._conga(vel,520)} congaL(vel=1){this._conga(vel,300)}
  _conga(vel,p){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(p,t);this._env(g,.001,.12,.1,.7*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.2);}
  bongo(vel=1){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(650,t);this._env(g,.001,.08,.08,.6*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.16);}
  triangle(vel=1){const t=this.ctx.currentTime,o	this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(1500,t);this._env(g,.001,.06,.1,.25*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.12);}
  woodblock(vel=1){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.setValueAtTime(1200,t);this._env(g,.001,.05,.08,.3*vel);o.connect(g).connect(this.master);o.start(t);o.stop(t+.1);}
}

// WAV encoder + Recorder (unchanged from v2)
class WavEncoder {
  static encodeWav(samples, sampleRate=44100){
    function f16(view, off, input){for(let i=0;i<input.length;i++,off+=2){let s=Math.max(-1,Math.min(1,input[i]));s=s<0?s*0x8000:s*0x7FFF;view.setInt16(off,s,true);}}
    const buffer = new ArrayBuffer(44 + samples.length*2);
    const view = new DataView(buffer);
    function ws(v,o,s){for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));}
    ws(view,0,'RIFF'); view.setUint32(4,36+samples.length*2,true); ws(view,8,'WAVE');
    ws(view,12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
    ws(view,36,'data'); view.setUint32(40,samples.length*2,true); f16(view,44,samples);
    return new Blob([view],{type:'audio/wav'});
  }
}
class Recorder {
  constructor(ctx, sourceNode){
    this.ctx=ctx; this.src=sourceNode; this.mode=null; this.mr=null; this.script=null; this.buf=[]; this.maxSamples=ctx.sampleRate*30;
  }
  supported(){return typeof MediaRecorder!=='undefined' && MediaRecorder.isTypeSupported('audio/webm');}
  start(){
    this.buf=[];
    if(this.supported()){
      const dest=this.ctx.createMediaStreamDestination(); this.src.connect(dest);
      this.mr=new MediaRecorder(dest.stream,{mimeType:'audio/webm'}); const chunks=[];
      this.mr.ondataavailable=(e)=>e.data.size&&chunks.push(e.data);
      this.mr.onstop=()=>{this.oncomplete&&this.oncomplete(new Blob(chunks,{type:'audio/webm'}));};
      this.mr.start(); this.mode='mr';
    }else{
      const size=4096; this.script=this.ctx.createScriptProcessor(size,1,1);
      this.script.onaudioprocess=(e)=>{const d=e.inputBuffer.getChannelData(0); this.buf.push(new Float32Array(d)); if(this.buf.length*size>=this.maxSamples){this.stop();}};
      this.src.connect(this.script); this.script.connect(this.ctx.destination); this.mode='wav';
    }
  }
  stop(){
    if(this.mode==='mr'&&this.mr){this.mr.stop();}
    else if(this.mode==='wav'){let total=0; for(const b of this.buf) total+=b.length; const m=new Float32Array(total); let o=0; for(const b of this.buf){m.set(b,o); o+=b.length;} this.oncomplete&&this.oncomplete(WavEncoder.encodeWav(m,this.ctx.sampleRate)); try{this.script.disconnect();}catch{}}
    this.mode=null;
  }
}

// ---- App (detections, pads, clones, loops) ----
const App = {
  model:null, usingDemo:false,
  audio:null, synth:null, recorder:null,
  pads:[], detections:[], lastDetectionsAt:0,
  loopTimer:null,

  async start(){
    // audio
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audio = new AudioCtx({ latencyHint: 'interactive', sampleRate: 44100 });
    this.synth = new DrumSynth(this.audio);
    this.recorder = new Recorder(this.audio, this.synth.master);

    // camera required for normal play
    await this.startCamera();

    UI.gate.classList.add('hidden');
    switchTab('play');

    UI.draw.width = UI.stage.clientWidth; UI.draw.height = UI.stage.clientHeight;
    window.addEventListener('resize', ()=>{
      UI.draw.width = UI.stage.clientWidth; UI.draw.height = UI.stage.clientHeight;
      this.layoutPads();
    });

    // model
    this.model = await cocoSsd.load({base:'lite_mobilenet_v2'});
    this.tick();
    updateLoopScheduler();
    updateProUI();
  },

  async startCamera(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' }, audio:false });
      UI.video.srcObject = stream; await UI.video.play();
    }catch(e){
      alert('Camera is required to play. Please allow camera and try again.');
      throw e;
    }
  },

  useDemoVideo(file){
    const url = URL.createObjectURL(file);
    UI.video.srcObject = null;
    UI.video.src = url;
    UI.video.loop = true;
    UI.video.play();
    this.usingDemo = true;
    switchTab('play');
  },

  videoToCanvasRect(bbox){
    const vw = UI.video.videoWidth, vh = UI.video.videoHeight;
    const cw = UI.draw.width, ch = UI.draw.height;
    if(vw===0||vh===0) return [0,0,0,0];
    const scale = Math.max(cw/vw, ch/vh);
    const dx = (cw - vw*scale)/2;
    const dy = (ch - vh*scale)/2;
    const [x,y,w,h] = bbox;
    return [x*scale+dx, y*scale+dy, w*scale, h*scale];
  },

  async tick(){
    const ctx = UI.draw.getContext('2d');
    const run = async () => {
      // draw + detect
      ctx.clearRect(0,0,UI.draw.width,UI.draw.height);
      if(UI.showBoxes.checked) ctx.strokeStyle = 'rgba(255,255,0,.8)';

      const now = performance.now();
      if(now - this.lastDetectionsAt > 120){
        try{ this.detections = await this.model.detect(UI.video); }catch{ this.detections = []; }
        this.lastDetectionsAt = now;
        this.renderDetectedList();
      }

      if(UI.showBoxes.checked){
        ctx.lineWidth = 2; ctx.font = '12px system-ui';
        this.detections.forEach(d => {
          const [x,y,w,h] = this.videoToCanvasRect(d.bbox);
          ctx.strokeRect(x,y,w,h);
          ctx.fillStyle='rgba(0,0,0,.6)';
          ctx.fillRect(x,y-14, Math.max(60, d.class.length*7+30), 14);
          ctx.fillStyle='#fff';
          ctx.fillText(`${d.class} ${(d.score*100|0)}%`, x+4, y-3);
        });
      }

      this.updatePadTriggers(ctx);
      requestAnimationFrame(run);
    };
    run();
  },

  renderDetectedList(){
    const map = new Map();
    for(const d of this.detections) map.set(d.class, (map.get(d.class)||0)+1);
    UI.listDetected.innerHTML = '';
    Array.from(map.entries()).slice(0,14).forEach(([cls,count])=>{
      const div = document.createElement('div');
      div.className='detect';
      const btn = document.createElement('button');
      btn.textContent='Add pad';
      btn.onclick=()=>this.addPad(cls);
      div.innerHTML = `<span>${cls} × ${count}</span>`;
      div.appendChild(btn);
      UI.listDetected.appendChild(div);
    });
  },

  addPad(cls){
    const W = UI.draw.width, H = UI.draw.height;
    const pad = {
      id: 'p'+Math.random().toString(36).slice(2,8),
      cls, x: W*0.3, y: H*0.3, w: W*0.36, h: H*0.22,
      sound: 'snare', loop:false, inside:false, el:null, thumb:null
    };
    const el = document.createElement('div');
    el.className = 'pad';
    el.innerHTML = `<span class="title">${cls}</span> <span class="handle">⠿</span><br>
      <span class="small">sound:</span> <select class="select soundSel"></select>
      <label class="inline"><input type="checkbox" class="loopChk"> Loop</label>
      <div class="thumb"><canvas class="thumbCanvas" width="160" height="68"></canvas></div>`;
    UI.padsLayer.appendChild(el);
    pad.el = el;
    pad.thumb = el.querySelector('.thumbCanvas');

    this.fillSoundSelect(el.querySelector('.soundSel'), pad.sound);
    el.querySelector('.soundSel').onchange = (e)=> pad.sound = e.target.value;
    el.querySelector('.loopChk').onchange = (e)=> pad.loop = e.target.checked;

    // drag
    let dragging=false, ox=0, oy=0;
    const handle=el.querySelector('.handle');
    handle.addEventListener('pointerdown',(ev)=>{dragging=true; ox=ev.clientX - pad.x; oy=ev.clientY - pad.y; handle.setPointerCapture(ev.pointerId)});
    handle.addEventListener('pointermove',(ev)=>{if(!dragging) return; pad.x=ev.clientX-ox; pad.y=ev.clientY-oy; this.layoutPads();});
    handle.addEventListener('pointerup',()=>dragging=false);

    this.pads.push(pad);
    this.renderPadList();
    this.layoutPads();
  },

  fillSoundSelect(sel, current){
    sel.innerHTML='';
    // Free first
    const make = (s, disabled=false) => {
      const opt=document.createElement('option'); opt.value=s; opt.textContent = s + (disabled?' (PRO)':''); if(s===current) opt.selected=true; opt.disabled=disabled; return opt;
    };
    SOUND_LIST_FREE.forEach(s => sel.appendChild(make(s,false)));
    const proOff = !proUnlocked();
    SOUND_LIST_PRO.forEach(s => sel.appendChild(make(s, proOff)));
  },

  renderPadList(){
    UI.listPads.innerHTML='';
    for(const p of this.pads){
      const row=document.createElement('div'); row.className='detect';
      const del=document.createElement('button'); del.textContent='Remove';
      del.onclick=()=>{p.el.remove(); this.pads=this.pads.filter(x=>x!==p); this.renderPadList();};
      row.innerHTML=`<span>${p.cls} → ${p.sound} ${p.loop?'(loop)': ''}</span>`;
      row.appendChild(del);
      UI.listPads.appendChild(row);
    }
  },

  layoutPads(){
    const W = UI.draw.width, H = UI.draw.height;
    for(const p of this.pads){
      p.x = Math.max(0, Math.min(W - p.w, p.x));
      p.y = Math.max(0, Math.min(H - p.h, p.y));
      p.el.style.left = p.x+'px';
      p.el.style.top  = p.y+'px';
      p.el.style.width = p.w+'px';
      p.el.style.height= p.h+'px';
    }
  },

  // Intersection enter/leave + clone thumbnail
  updatePadTriggers(ctx){
    for(const p of this.pads){
      let hit=false, hitDet=null;
      for(const d of this.detections){
        if(d.class!==p.cls) continue;
        const [x,y,w,h] = this.videoToCanvasRect(d.bbox);
        const cx = x + w/2, cy = y + h/2;
        if(cx>=p.x && cx<=p.x+p.w && cy>=p.y && cy<=p.y+p.h){ hit=true; hitDet={x,y,w,h}; break; }
      }
      if(hit && !p.inside){
        // entering
        if(this.canPlay(p.sound)){
          this.trigger(p.sound, 1.0);
          // visual clone (copy ROI into pad thumb)
          if(hitDet && p.thumb){
            const tc = p.thumb.getContext('2d');
            tc.clearRect(0,0,p.thumb.width,p.thumb.height);
            // draw scaled snapshot
            tc.drawImage(UI.video, hitDet.x, hitDet.y, hitDet.w, hitDet.h, 0, 0, p.thumb.width, p.thumb.height);
          }
        }
        p.inside = true;
      }else if(!hit && p.inside){
        p.inside = false;
      }
    }
  },

  canPlay(sound){
    if(SOUND_LIST_FREE.includes(sound)) return true;
    return proUnlocked();
  },

  trigger(sound, vel){
    try{
      const fn = this.synth[sound];
      if(typeof fn === 'function') fn.call(this.synth, vel);
    }catch{}
  },

  // Save/Load/Export/Import/Share
  save(){
    const data = {
      bpm: Number(UI.bpm.value)||96,
      pads: this.pads.map(p=>({id:p.id,cls:p.cls,x:p.x,y:p.y,w:p.w,h:p.h,sound:p.sound,loop:p.loop})),
      pro: proUnlocked() ? 1 : 0
    };
    localStorage.setItem('djs-project', JSON.stringify(data));
    alert('Saved.');
  },
  load(){
    const t = localStorage.getItem('djs-project');
    if(!t) { alert('No saved project'); return; }
    try{
      const data = JSON.parse(t);
      UI.bpm.value = data.bpm||96;
      setProUnlocked(!!data.pro);
      this.pads.forEach(p=>p.el.remove()); this.pads=[];
      for(const pd of data.pads){
        this.addPad(pd.cls);
        const p = this.pads[this.pads.length-1];
        p.x=pd.x; p.y=pd.y; p.w=pd.w; p.h=pd.h; p.sound=pd.sound; p.loop=!!pd.loop;
        const sel=p.el.querySelector('.soundSel'); this.fillSoundSelect(sel, p.sound); sel.value=p.sound;
        p.el.querySelector('.loopChk').checked=p.loop;
      }
      this.layoutPads(); this.renderPadList();
    }catch{ alert('Failed to load'); }
  },
  export(){
    const data = {
      bpm: Number(UI.bpm.value)||96,
      pads: this.pads.map(p=>({id:p.id,cls:p.cls,x:p.x,y:p.y,w:p.w,h:p.h,sound:p.sound,loop:p.loop})),
      pro: proUnlocked() ? 1 : 0
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='djs-drumkit-project.json'; a.click();
  },
  async share(){
    const t = localStorage.getItem('djs-project') || '{}';
    if(navigator.share){
      try{ await navigator.share({ title: "DJ's Drum-Kit Project", text: t }); }catch{}
    }else alert('Share not supported.');
  },
  deleteSaved(){ localStorage.removeItem('djs-project'); alert('Deleted saved project.'); },

  startRec(){
    this.recorder.oncomplete = (blob)=>{
      UI.downloadLink.href = URL.createObjectURL(blob);
      UI.downloadLink.classList.remove('hidden');
    };
    this.recorder.start();
    UI.recBtn.disabled=true; UI.stopBtn.disabled=false;
  },
  stopRec(){
    this.recorder.stop();
    UI.recBtn.disabled=false; UI.stopBtn.disabled=true;
  },
};

// --- Helpers ---
function switchTab(name){
  UI.tabPlay.classList.toggle('hidden', name!=='play');
  UI.tabSettings.classList.toggle('hidden', name!=='settings');
  UI.tabDemo.classList.toggle('hidden', name!=='demo');
}

// Loop scheduler
function updateLoopScheduler(){
  if(App.loopTimer) clearInterval(App.loopTimer);
  const bpm = Math.max(40, Math.min(200, Number(UI.bpm.value)||96));
  const intervalMs = (60_000 / bpm);
  App.loopTimer = setInterval(()=>{
    for(const p of App.pads){
      if(p.loop && App.canPlay(p.sound)){ App.trigger(p.sound, 0.9); }
    }
  }, intervalMs);
}
function updateProUI(){ UI.proStatus.textContent = 'Pro: ' + (proUnlocked()?'unlocked':'locked'); }

// Wire UI
UI.enableBtn.addEventListener('click', ()=>App.start().catch(()=>{}));
UI.clearPads.addEventListener('click', ()=>{ App.pads.forEach(p=>p.el.remove()); App.pads=[]; App.renderPadList(); });
UI.saveProject.addEventListener('click', ()=>App.save());
UI.loadProject.addEventListener('click', ()=>App.load());
UI.exportProject.addEventListener('click', ()=>App.export());
UI.importBtn.addEventListener('click', ()=>UI.importProject.click());
UI.importProject.addEventListener('change',(e)=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{
    try{ localStorage.setItem('djs-project', r.result); App.load(); }catch{ alert('Invalid file'); }
  }; r.readAsText(f);
});
UI.shareProject.addEventListener('click', ()=>App.share());
UI.deleteProject.addEventListener('click', ()=>App.deleteSaved());
UI.recBtn.addEventListener('click', ()=>App.startRec());
UI.stopBtn.addEventListener('click', ()=>App.stopRec());
UI.bpm.addEventListener('change', updateLoopScheduler);
UI.showBoxes.addEventListener('change', ()=>{});

// Freemium unlock
UI.unlockBtn.addEventListener('click', ()=>{
  const code = (UI.unlockCode.value||'').trim();
  if(code.length>=6){ setProUnlocked(true); alert('Pro unlocked locally.'); } else { alert('Enter a valid code.'); }
});
UI.licenseFile.addEventListener('change',(e)=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{
    try{
      const obj = JSON.parse(r.result);
      if(obj && obj.pro===true){ setProUnlocked(true); alert('Pro unlocked by license.'); }
      else alert('Invalid license file.');
    }catch{ alert('Invalid license file.'); }
  }; r.readAsText(f);
});

// Social keys save
function loadKeys(){
  UI.keyInstagram.value = localStorage.getItem('keyInstagram')||'';
  UI.keyTikTok.value    = localStorage.getItem('keyTikTok')||'';
  UI.keyYouTube.value   = localStorage.getItem('keyYouTube')||'';
  UI.keyFacebook.value  = localStorage.getItem('keyFacebook')||'';
  UI.keyX.value         = localStorage.getItem('keyX')||'';
}
UI.saveKeys.addEventListener('click', ()=>{
  localStorage.setItem('keyInstagram', UI.keyInstagram.value.trim());
  localStorage.setItem('keyTikTok', UI.keyTikTok.value.trim());
  localStorage.setItem('keyYouTube', UI.keyYouTube.value.trim());
  localStorage.setItem('keyFacebook', UI.keyFacebook.value.trim());
  localStorage.setItem('keyX', UI.keyX.value.trim());
  UI.keysSaved.textContent = 'Saved locally.';
  setTimeout(()=>UI.keysSaved.textContent='', 2000);
});
loadKeys(); updateProUI();

// Demo video
UI.useDemoBtn.addEventListener('click', ()=>{
  const f = UI.demoVideoFile.files && UI.demoVideoFile.files[0];
  if(!f){ alert('Choose a video file first.'); return; }
  App.useDemoVideo(f);
});

// PWA
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>navigator.serviceWorker.register('sw.js').catch(()=>{})); }
