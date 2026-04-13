const SFX=(()=>{
  let ctx=null,mu=false;
  const init=()=>{if(!ctx)try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){};if(ctx&&ctx.state==='suspended')ctx.resume();};
  const G=(v=0.3)=>{if(!ctx)return null;const g=ctx.createGain();g.gain.value=v;g.connect(ctx.destination);return g;};
  const play=(t,f,d,v=0.2)=>{if(!ctx||mu)return;try{const o=ctx.createOscillator(),g=G(v);if(!g)return;o.type=t;o.frequency.value=f;o.connect(g);o.start(ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch(e){}};
  const chirp=(f1,f2,d,v=0.2)=>{if(!ctx||mu)return;try{const o=ctx.createOscillator(),g=G(v);if(!g)return;o.type='sine';o.frequency.setValueAtTime(f1,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(f2,ctx.currentTime+d*0.7);o.connect(g);o.start(ctx.currentTime);g.gain.setValueAtTime(v,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+d);o.stop(ctx.currentTime+d);}catch(e){}};
  const noise=(d,v=0.1)=>{if(!ctx||mu)return;try{const buf=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),dt=buf.getChannelData(0);for(let i=0;i<dt.length;i++)dt[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=buf;const g=G(v);if(!g)return;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=800;s.connect(f);f.connect(g);s.start();s.stop(ctx.currentTime+d);}catch(e){}};
  return{init,toggle:()=>{mu=!mu;return!mu;},
    monkey:()=>{chirp(320,520,0.2,0.5);setTimeout(()=>chirp(520,320,0.18,0.45),220);setTimeout(()=>chirp(320,480,0.15,0.4),440);},
    monkeyHappy:()=>{[0,130,260,390,520].forEach((t,i)=>setTimeout(()=>chirp(350+i*70,550+i*70,0.14,0.5),t));},
    monkeySad:()=>{chirp(450,180,0.45,0.5);setTimeout(()=>chirp(220,120,0.55,0.4),450);},
    monkeyCatch:()=>{chirp(450,750,0.1,0.4);},
    monkeyJump:()=>{chirp(300,700,0.15,0.4);setTimeout(()=>chirp(700,400,0.12,0.35),160);},
    place:()=>{play('sine',90,0.12,0.25);play('sine',55,0.08,0.15);},
    perfect:()=>{[523,659,784].forEach((f,i)=>setTimeout(()=>play('sine',f,0.15,0.3),i*90));},
    combo:(n)=>{[0,60,120].forEach((t,i)=>setTimeout(()=>play('sine',500+n*50+i*90,0.12,0.25),t));},
    cut:()=>{play('sine',200,0.08,0.12);play('sine',150,0.06,0.08);},
    gold:()=>{[600,750,900,1050].forEach((f,i)=>setTimeout(()=>play('sine',f,0.12,0.28),i*75));},
    powerUp:()=>{[440,660,880].forEach((f,i)=>setTimeout(()=>play('sine',f,0.12,0.25),i*90));},
    bombTick:()=>{play('square',900,0.04,0.18);},
    bombExplode:()=>{if(!ctx||mu)return;try{const t=ctx.currentTime;const buf=ctx.createBuffer(1,ctx.sampleRate*0.6,ctx.sampleRate),dt=buf.getChannelData(0);for(let i=0;i<dt.length;i++)dt[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.15));const s=ctx.createBufferSource();s.buffer=buf;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(600,t);lp.frequency.exponentialRampToValueAtTime(80,t+0.4);const g=G(0.35);if(!g)return;s.connect(lp);lp.connect(g);g.gain.setValueAtTime(0.35,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);s.start(t);s.stop(t+0.6);const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(80,t);o.frequency.exponentialRampToValueAtTime(30,t+0.3);const g2=G(0.25);if(!g2)return;o.connect(g2);g2.gain.setValueAtTime(0.25,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.start(t);o.stop(t+0.35);}catch(e){}},
    iceCrack:()=>{noise(0.06,0.2);play('sine',2500,0.05,0.15);},
    ghostWhoosh:()=>{chirp(200,900,0.25,0.15);},
    beeFly:()=>{chirp(200,700,0.3,0.2);},
    quake:()=>{noise(0.6,0.3);play('sine',35,0.5,0.2);},
    bounce:()=>{chirp(200,400,0.1,0.2);},
    vine:()=>{},
    levelStart:()=>{[400,500,650].forEach((f,i)=>setTimeout(()=>play('sine',f,0.15,0.2),i*100));},
    click:()=>{play('sine',600,0.05,0.15);},
    bananaCatch:()=>{chirp(600,900,0.08,0.3);},
    bananaGold:()=>{chirp(700,1200,0.12,0.35);},
    coconutHit:()=>{if(!ctx||mu)return;try{const t=ctx.currentTime;const o1=ctx.createOscillator();o1.type='sine';o1.frequency.setValueAtTime(160,t);o1.frequency.exponentialRampToValueAtTime(55,t+0.18);const g1=G(0.35);if(!g1)return;o1.connect(g1);g1.gain.setValueAtTime(0.35,t);g1.gain.exponentialRampToValueAtTime(0.001,t+0.2);o1.start(t);o1.stop(t+0.2);const o2=ctx.createOscillator();o2.type='triangle';o2.frequency.setValueAtTime(420,t);o2.frequency.exponentialRampToValueAtTime(180,t+0.08);const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=350;bp.Q.value=2.5;const g2=G(0.2);if(!g2)return;o2.connect(bp);bp.connect(g2);g2.gain.setValueAtTime(0.2,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.1);o2.start(t);o2.stop(t+0.1);const len=0.04;const buf=ctx.createBuffer(1,ctx.sampleRate*len,ctx.sampleRate),dt=buf.getChannelData(0);for(let i=0;i<dt.length;i++)dt[i]=(Math.random()*2-1)*Math.pow(1-i/dt.length,3);const s=ctx.createBufferSource();s.buffer=buf;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;const g3=G(0.12);if(!g3)return;s.connect(lp);lp.connect(g3);s.start(t);s.stop(t+len);}catch(e){}},
    wind:()=>{if(!ctx||mu)return;try{const d=0.8,buf=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),dt=buf.getChannelData(0);for(let i=0;i<dt.length;i++)dt[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=buf;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=400;const g=G(0.001);if(!g)return;g.gain.exponentialRampToValueAtTime(0.08,ctx.currentTime+0.15);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+d);s.connect(lp);lp.connect(g);s.start();s.stop(ctx.currentTime+d);}catch(e){}},
    magnet:()=>{chirp(180,400,0.2,0.2);},
    fogIn:()=>{noise(0.4,0.06);chirp(100,200,0.4,0.08);},
    shrink:()=>{chirp(600,300,0.15,0.15);},
    mirror:()=>{chirp(800,200,0.2,0.25);setTimeout(()=>chirp(200,800,0.15,0.2),200);},
    gravFlip:()=>{chirp(150,600,0.3,0.3);noise(0.15,0.2);},
    doubleDrop:()=>{play('sine',90,0.1,0.2);setTimeout(()=>play('sine',120,0.1,0.2),80);},
    lifeGain:()=>{[660,880,1100].forEach((f,i)=>setTimeout(()=>play('sine',f,0.14,0.3),i*100));},
    comboMilestone:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>play('sine',f,0.18,0.35),i*80));},
  };
})();

export default SFX;
