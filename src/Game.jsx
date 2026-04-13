import { useState, useEffect, useRef, useCallback } from "react";
import SFX from "./sfx";
import { DEV_LS_KEY, PF, safeT, safeB, safeX, safeR, btnStyle } from "./constants";
import { TUT_SCRIPTS } from "./tutorial";
import { L, getLivesForLevel } from "./levels";
import { spawn, bst } from "./mechanics";
import { calcStars, generateRewards, applyRewards, loadInventory, saveInventory, shouldShowReward, purchaseItem, SHOP_ITEMS } from "./rewards";

export default function Game(){
  const cvRef=useRef(null),gs=useRef(null),bs=useRef(null);
  const [scr,setScr]=useState('menu'),[lv,setLv]=useState(0),[hud,setHud]=useState(""),[cmb,setCmb]=useState("");
  const [tutPaused,setTutPaused]=useState(false),[tutText,setTutText]=useState("");
  const tutDone=useRef({});const tutPausedRef=useRef(false);
  const [beeW,setBeeW]=useState(false),[unlk,setUnlk]=useState(1),[msg,setMsg]=useState(""),[fMsg,setFMsg]=useState("");
  const [pIco,setPIco]=useState(""),[sOn,setSOn]=useState(true);
  const [lives,setLives]=useState(3);
  const [rwStars,setRwStars]=useState(0);
  const [rwItems,setRwItems]=useState([]);
  const [rwOpened,setRwOpened]=useState([]);
  const [inventory,setInventory]=useState(()=>loadInventory());
  const [devMode,setDevMode]=useState(()=>typeof window!=='undefined'&&localStorage.getItem(DEV_LS_KEY)==='1');
  const md=useRef("s"),tm=useRef({}),vfx=useRef({redFlash:0,goldGlow:0,shockwave:null});
  const toggleDev=()=>{setDevMode(v=>{const n=!v;try{localStorage.setItem(DEV_LS_KEY,n?'1':'0');}catch(e){}return n;});};
  const sT=(k,fn,txt,ms=1200)=>{fn(txt);clearTimeout(tm.current[k]);tm.current[k]=setTimeout(()=>fn(""),ms);};
  const checkTut=useCallback((trigger)=>{
    const s=gs.current;if(!s)return;const lvI=s.lv;const script=TUT_SCRIPTS[lvI];if(!script)return;
    for(const step of script){
      if(tutDone.current[step.id])continue;
      let match=false;
      if(step.trigger==='start'&&trigger==='start')match=true;
      else if(step.trigger==='spawn'&&trigger==='spawn'&&s.cr===step.cr)match=true;
      else if(step.trigger==='drop'&&trigger==='drop'&&s.cr===step.cr)match=true;
      else if(step.trigger==='combo'&&trigger==='combo'&&s.combo>=step.n)match=true;
      else if(step.trigger==='wind'&&trigger==='wind')match=true;
      if(match){tutDone.current[step.id]=true;setTutText(step.text);setTutPaused(true);return;}
    }
  },[]);
  const resumeTut=useCallback(()=>{SFX.click();setTutPaused(false);setTutText("");},[]);

  const triggerWin=useCallback((lvIdx,modeRef)=>{
    const mlv=L[lvIdx];const ml=mlv.lives??getLivesForLevel(lvIdx);
    setLives(prev=>{
      const stars=calcStars(mlv,modeRef,gs.current,bs.current,prev,ml);
      const inv=loadInventory();
      const best=inv.bestScores[lvIdx]||0;
      const fullLives=prev>=ml;
      if(fullLives)inv.streakNoLoss=(inv.streakNoLoss||0)+1;
      else inv.streakNoLoss=0;
      if(stars>best)inv.bestScores[lvIdx]=stars;
      const showRw=shouldShowReward(lvIdx,stars,inv);
      saveInventory(inv);setInventory(inv);
      if(showRw){
        if(inv.streakNoLoss>=8)inv.streakNoLoss=0;
        saveInventory(inv);
        const items=generateRewards(stars);
        setRwStars(stars);setRwItems(items);setRwOpened([]);
        setTimeout(()=>setScr("reward"),100);
      }else{
        setRwStars(stars);
        setTimeout(()=>setScr("win"),100);
      }
      return prev;
    });
  },[]);

  const startLv=useCallback((l)=>{
    const lv=L[l];
    const maxLives=lv.lives??getLivesForLevel(l);
    if(lv.t==="s")setLives(maxLives);
    if(lv.t==="b"){md.current="b";setLv(l);setScr("play");setCmb("");setMsg("");setFMsg("");
      const cv=cvRef.current;if(!cv)return;
      bs.current={W:cv.width,H:cv.height,L:lv,lv:l,alive:true,sc:0,combo:0,mx:0,
        monX:cv.width/2,mW:50,items:[],pts:[],timer:lv.time*60,maxT:lv.time*60,st:0,tX:cv.width/2};
      setHud(`🍌 0 / ${lv.goal}`);SFX.init();SFX.levelStart();return;}
    md.current="s";setLv(l);setScr("play");setTutPaused(false);setTutText("");setCmb("");setBeeW(false);setMsg("");setFMsg("");setPIco("");
    const cv=cvRef.current;if(!cv)return;
    const GY=cv.height-45;let CH=Math.floor((GY-60)/lv.goal);CH=Math.max(16,Math.min(42,CH));
    const IW=Math.min(130,cv.width*.38)*lv.nw;
    gs.current={W:cv.width,H:cv.height,GY,CH,IW,L:lv,lv:l,stack:[],mov:null,cr:0,combo:0,stars:0,score:0,alive:true,
      pts:[],fl:[],birds:[],bees:[],rain:[],mT:0,bTm:0,bST:0,
      wind:0,wTgt:0,wTm:0,bA:false,bT:0,bM:200,
      qX:0,qTm:0,qA:false,qC:0,mjTm:0,
      nWider:false,nSlow:false,nNoW:false,shield:false,wOvr:false,
      maxLives,grvT:0,fogPts:[],comboShield:0,scoreMult:1,qY:0,adCooldown:0};
    const inv=loadInventory();const bst2=inv.boosts||{};
    if(bst2.extraLife>0){const el=Math.min(bst2.extraLife,1);gs.current.maxLives+=el;setLives(prev=>prev+el);inv.boosts.extraLife--;saveInventory(inv);setInventory(inv);}
    if(bst2.startShield>0){gs.current.shield=true;inv.boosts.startShield--;saveInventory(inv);setInventory(inv);}
    if(bst2.slowStart>0){gs.current.nSlow=true;inv.boosts.slowStart--;saveInventory(inv);setInventory(inv);}
    if(bst2.windResist>0){gs.current.nNoW=true;inv.boosts.windResist--;saveInventory(inv);setInventory(inv);}
    if(lv.r){for(let i=0;i<70;i++)gs.current.rain.push({x:Math.random()*cv.width,y:Math.random()*cv.height,spd:4+Math.random()*5,len:8+Math.random()*14});}
    setHud(`📦 0 / ${lv.goal}`);SFX.init();SFX.levelStart();
    if(lv.tut){setTutPaused(false);setTutText("");setTimeout(()=>checkTut('start'),300);}
    spawn(gs.current);
  },[checkTut]);

  const handleStackMiss=useCallback(()=>{
    vfx.current.redFlash=20;
    setLives(prev=>{
      const next=prev-1;
      if(next<=0)queueMicrotask(()=>setScr("over"));
      else queueMicrotask(()=>{
        const s2=gs.current;
        if(!s2)return;
        s2.alive=true;
        sT("m",setMsg,"💔 -1 can",900);
        spawn(s2);
      });
      return next;
    });
  },[]);

  const drop=useCallback(()=>{
    const s=gs.current;if(!s||!s.mov||!s.alive)return;
    if(s.mov.ghost&&!s.mov.gv)return;
    const m=s.mov;s.mov=null;s.bA=false;setBeeW(false);
    if(m.rot)m.w=m.baseW;
    const pX=s.stack.length?s.stack[s.stack.length-1].x:(s.W-s.IW)/2;
    const pW=s.stack.length?s.stack[s.stack.length-1].w:s.IW;
    if(s.L.r>0){const sl=(Math.random()-.5)*s.L.r*5;m.x+=sl;if(Math.abs(sl)>1.5)bst(s,m.x+m.w/2,m.y+s.CH,'#6CA6CD',5);}
    const oL=Math.max(m.x,pX),oR=Math.min(m.x+m.w,pX+pW),ov=oR-oL;
    if(ov<=2){if(s.shield){s.shield=false;setPIco("");sT('f',setFMsg,'🍊 Kalkan!');m.x=pX;m.w=Math.min(pW,m.w);}
    else{s.alive=false;SFX.monkeySad();setTimeout(()=>handleStackMiss(),500);return;}}
    const perf=Math.abs(m.x-pX)<6;
    if(perf){m.x=pX;m.w=pW;s.combo++;
      const pts=Math.round(100*(1+s.combo*0.5)*s.scoreMult);
      s.score+=pts;
      bst(s,pX+pW/2,m.y,'#ffd93d',16);
      if(s.combo>=3)vfx.current.goldGlow=Math.min(25,s.combo*3);
      if(s.combo===5||s.combo===10||s.combo===15){
        SFX.comboMilestone();
        const ml=s.maxLives||3;
        setLives(prev=>{const n=Math.min(prev+1,ml);if(n>prev)sT('f',setFMsg,`❤️‍🔥 +1 can! (x${s.combo})`,1600);return n;});
      }
      sT('c',setCmb,s.combo>=5?`🔥🔥🔥 x${s.combo}!!!`:s.combo>=3?`🔥🔥 x${s.combo}`:s.combo>=2?`🔥 x${s.combo}`:' ✨ Mükemmel!');
      SFX.perfect();if(s.combo>=2)SFX.combo(s.combo);
    }else if(ov>4){const cW=m.w-ov;let fX=m.x<pX?m.x:oR;if(m.x<pX)m.x=pX;m.w=ov;
      s.fl.push({x:fX,y:m.y,w:cW,h:s.CH,wd:m.wd,vy:0,vx:fX<m.x?-2.5:2.5,rot:0,vr:(fX<m.x?-1:1)*.07});
      s.score+=Math.round(50*s.scoreMult);
      if(s.comboShield>0){s.comboShield--;sT('f',setFMsg,'🍇 Combo korundu!',700);}
      else{if(s.combo>=3)sT('c',setCmb,'💔',500);s.combo=0;setTimeout(()=>setCmb(""),500);}SFX.cut();}
    bst(s,m.x+m.w/2,m.y,m.wd[0],8);SFX.place();SFX.monkey();
    if(m.pf){const p=m.pf;if(p.power==='wider')s.nWider=true;else if(p.power==='slow')s.nSlow=true;else if(p.power==='shield')s.shield=true;else if(p.power==='nowind')s.nNoW=true;
      setPIco(p.emoji);sT('f',setFMsg,`${p.emoji} ${p.desc}`,1400);bst(s,m.x+m.w/2,m.y,p.color,15);SFX.powerUp();}
    if(m.gold){bst(s,m.x+m.w/2,m.y,'#FFD700',25);s.stars+=2;s.score+=200;sT('f',setFMsg,'⭐ +2 yıldız!',1200);SFX.gold();}
    if(m.nfData){const nf=m.nfData;
      switch(nf.fx){
        case'points':s.score+=Math.round(50*s.scoreMult);break;
        case'slow':s.nSlow=true;sT('f',setFMsg,`${nf.emoji} ${nf.desc}`,600);break;
        case'wider':s.nWider=true;sT('f',setFMsg,`${nf.emoji} ${nf.desc}`,600);break;
        case'comboShield':s.comboShield++;sT('f',setFMsg,`${nf.emoji} ${nf.desc}`,700);break;
        case'random':if(Math.random()<.25){const rp=PF[Math.floor(Math.random()*PF.length)];if(rp.power==='wider')s.nWider=true;else if(rp.power==='slow')s.nSlow=true;else if(rp.power==='shield')s.shield=true;else if(rp.power==='nowind')s.nNoW=true;setPIco(rp.emoji);sT('f',setFMsg,`${nf.emoji}→${rp.emoji} ${rp.desc}`,1000);bst(s,m.x+m.w/2,m.y,rp.color,12);SFX.powerUp();}break;
        case'windBlock':s.nNoW=true;sT('f',setFMsg,`${nf.emoji} ${nf.desc}`,600);break;
        case'scoreMult':s.scoreMult=Math.min(s.scoreMult+0.1,3);sT('f',setFMsg,`${nf.emoji} ${nf.desc}`,700);break;
      }bst(s,m.x+m.w/2,m.y,nf.color,5);}
    if(m.ice){m.slV=(Math.random()>.5?1:-1)*(.3+Math.random()*.4);m.slL=120+Math.random()*60;SFX.iceCrack();}else{m.slV=0;m.slL=0;}
    if(m.bomb){m.bmT=0;m.bmM=180;}
    if(m.bnc){m.bncVy=-4;m.bncOrig=m.y;m.bncing=true;SFX.bounce();}
    s.stack.push(m);s.cr=s.stack.length;setHud(`📦 ${s.cr} / ${s.L.goal}`);
    if(s.cr>=s.L.goal){s.alive=false;bst(s,s.W/2,m.y,'#ffd93d',40);setUnlk(p=>Math.max(p,s.lv+2));SFX.monkeyHappy();setTimeout(()=>triggerWin(s.lv,'s'),800);return;}
    if(s.L.tut&&s.combo>=2)setTimeout(()=>checkTut('combo'),150);
    if(s.L.tut)setTimeout(()=>checkTut('drop'),100);
    spawn(s);
    if(s.L.tut)setTimeout(()=>checkTut('spawn'),200);
    if(s.L.dbl>0&&Math.random()<s.L.dbl&&s.mov){s.mov.spd*=1.7;s.mov.rushT=0;s.mov.rushM=85;sT('f',setFMsg,'⚡ ÇİFT!',600);SFX.doubleDrop();}
  },[handleStackMiss,checkTut]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;const c=cv.getContext('2d');let raf;
    const rsz=()=>{const r=cv.parentElement.getBoundingClientRect();cv.width=r.width;cv.height=r.height;};
    rsz();window.addEventListener('resize',rsz);

    const bLoop=()=>{const b=bs.current;if(!b)return;const W=cv.width,H=cv.height;
      if(b.alive){b.timer--;if(b.timer<=0){b.alive=false;
        if(b.sc>=b.L.goal){setUnlk(p=>Math.max(p,b.lv+2));SFX.monkeyHappy();setTimeout(()=>triggerWin(b.lv,'b'),600);}
        else{SFX.monkeySad();setTimeout(()=>setScr("over"),600);}return;}
        b.st++;if(b.st>=b.L.sr){b.st=0;const isC=Math.random()<b.L.coco,isG2=!isC&&Math.random()<b.L.gold;
          b.items.push({x:30+Math.random()*(W-60),y:-20,vy:2.5+Math.random()*2+b.sc*.02,tp:isC?'c':isG2?'g':'b',rot:0,vr:(Math.random()-.5)*.08,ct:false,sz:20});}
        b.monX+=(b.tX-b.monX)*.15;b.monX=Math.max(25,Math.min(W-25,b.monX));
        b.items.forEach(it=>{if(it.ct)return;it.y+=it.vy;it.rot+=it.vr;
          const dy=H-55-it.y;if(dy<18&&dy>-10&&Math.abs(it.x-b.monX)<(b.mW/2+it.sz/2)){it.ct=true;
            if(it.tp==='c'){b.sc=Math.max(0,b.sc-2);b.combo=0;SFX.coconutHit();sT('f',setFMsg,'🥥 -2!',800);setCmb("");}
            else{const mul=1+Math.floor(b.combo/3)*0.25;const val=it.tp==='g'?Math.round(3*mul):Math.round(1*mul);b.sc+=val;b.combo++;b.mx=Math.max(b.mx,b.combo);SFX.bananaCatch();if(it.tp==='g')SFX.bananaGold();SFX.monkeyCatch();
              if(b.combo>=3)sT('c',setCmb,`🔥 x${b.combo}`);if(it.tp==='g')sT('f',setFMsg,`⭐ +${val}!`,600);else if(mul>1)sT('f',setFMsg,`🍌 +${val}`,500);}
            setHud(`🍌 ${b.sc} / ${b.L.goal}`);for(let j=0;j<6;j++)b.pts.push({x:it.x,y:it.y,vx:(Math.random()-.5)*4,vy:-Math.random()*3-1,life:1,sz:3,c:it.tp==='g'?'#FFD700':'#FFD600'});}});
        b.items=b.items.filter(it=>!it.ct&&it.y<H+30);}
      b.pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.1;p.life-=.025;});b.pts=b.pts.filter(p=>p.life>0);
      const gr=c.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#FF8F00');gr.addColorStop(.4,'#FFB300');gr.addColorStop(1,'#66BB6A');c.fillStyle=gr;c.fillRect(0,0,W,H);
      c.fillStyle='#5a9e4b';c.fillRect(0,H-40,W,40);c.fillStyle='#4a8e3b';c.fillRect(0,H-40,W,4);
      const tx=W/2;c.fillStyle='#6B4226';c.beginPath();c.moveTo(tx-12,H-36);c.lineTo(tx-6,30);c.lineTo(tx+6,30);c.lineTo(tx+12,H-36);c.closePath();c.fill();
      c.fillStyle='#2E7D32';c.beginPath();c.arc(tx,22,35,0,Math.PI*2);c.fill();c.fillStyle='#388E3C';c.beginPath();c.arc(tx-18,30,22,0,Math.PI*2);c.fill();c.beginPath();c.arc(tx+18,28,24,0,Math.PI*2);c.fill();
      b.items.forEach(it=>{if(it.ct)return;c.save();c.translate(it.x,it.y);c.rotate(it.rot);c.font=`${it.sz}px sans-serif`;c.textAlign='center';c.textBaseline='middle';
        if(it.tp==='g'){c.shadowColor='#FFD700';c.shadowBlur=10;}c.fillText(it.tp==='c'?'🥥':it.tp==='g'?'⭐':'🍌',0,0);c.shadowBlur=0;c.restore();});
      const mx=b.monX,my=H-55;
      c.fillStyle='#8D6E4C';c.beginPath();c.ellipse(mx,my,14,18,0,0,Math.PI*2);c.fill();c.fillStyle='#C4A97D';c.beginPath();c.ellipse(mx,my+3,9,12,0,0,Math.PI*2);c.fill();
      c.fillStyle='#8D6E4C';c.beginPath();c.arc(mx,my-22,14,0,Math.PI*2);c.fill();c.fillStyle='#C4A97D';c.beginPath();c.ellipse(mx,my-19,10,8,0,0,Math.PI*2);c.fill();
      c.fillStyle='#222';c.beginPath();c.arc(mx-4,my-22,2.5,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx+4,my-22,2.5,0,Math.PI*2);c.fill();
      c.strokeStyle='#8D6E4C';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(mx-12,my-5);c.lineTo(mx-28,my-15);c.stroke();c.beginPath();c.moveTo(mx+12,my-5);c.lineTo(mx+28,my-15);c.stroke();
      c.fillStyle='#C4A97D';c.beginPath();c.arc(mx-28,my-15,4,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx+28,my-15,4,0,Math.PI*2);c.fill();
      c.fillStyle='#8D6E4C';c.beginPath();c.arc(mx-13,my-22,5,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx+13,my-22,5,0,Math.PI*2);c.fill();
      b.pts.forEach(p=>{c.globalAlpha=p.life;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.sz,0,Math.PI*2);c.fill();});c.globalAlpha=1;
      const tp=b.timer/b.maxT;c.fillStyle='rgba(0,0,0,.2)';c.fillRect(W*.15,H-18,W*.7,6);c.fillStyle=tp<.25?'#ff1744':tp<.5?'#FF9800':'#4CAF50';c.fillRect(W*.15,H-18,W*.7*tp,6);
    };

    const sLoop=()=>{const s=gs.current;if(!s)return;const ni=s.L.ni;const lvI=s.lv;
      if(tutPausedRef.current)return;
      const gr=c.createLinearGradient(0,0,0,cv.height);
      let skyDark=false;
      if(ni){gr.addColorStop(0,'#0a1628');gr.addColorStop(.5,'#162040');gr.addColorStop(1,'#1a3a2a');skyDark=true;}
      else if(s.L.r){gr.addColorStop(0,'#546E7A');gr.addColorStop(.5,'#78909C');gr.addColorStop(1,'#7a9a6a');}
      else if(lvI<20){gr.addColorStop(0,'#FF8A65');gr.addColorStop(.4,'#FFB74D');gr.addColorStop(1,'#A5D6A7');}
      else if(lvI<50){gr.addColorStop(0,'#3A9BD5');gr.addColorStop(.5,'#6BB8E0');gr.addColorStop(1,'#98D4A8');}
      else if(lvI<80){gr.addColorStop(0,'#E65100');gr.addColorStop(.4,'#FF8F00');gr.addColorStop(.7,'#FFCC80');gr.addColorStop(1,'#66BB6A');}
      else{gr.addColorStop(0,'#1A237E');gr.addColorStop(.4,'#283593');gr.addColorStop(1,'#1B5E20');skyDark=true;}
      c.fillStyle=gr;c.fillRect(0,0,cv.width,cv.height);
      if(ni||skyDark){c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<30;i++){c.globalAlpha=(Math.sin(Date.now()*.003+i)*.3+.7)*.4;c.fillRect((i*137.5+13)%cv.width,(i*97.3+Date.now()*.001)%(cv.height*.4),1.5,1.5);}c.globalAlpha=1;c.fillStyle='#F5E6B8';c.beginPath();c.arc(cv.width-45,38,18,0,Math.PI*2);c.fill();c.fillStyle=ni?'#0a1628':'#1A237E';c.beginPath();c.arc(cv.width-39,34,14,0,Math.PI*2);c.fill();}
      else if(!s.L.r){c.fillStyle='rgba(255,255,255,.35)';const t=Date.now()*.00005;for(let i=0;i<4;i++){const px=((i*280+t*(150+i*30))%(cv.width+200))-100,py=18+i*28;c.beginPath();c.arc(px,py,16+i*3,0,Math.PI*2);c.fill();}}
      const mtTime=Date.now()*.00003;const mtBase=s.GY-s.L.goal*s.CH-60;
      for(let layer=0;layer<2;layer++){c.fillStyle=(ni||skyDark)?`rgba(15,25,20,${.12+layer*.06})`:(lvI<20?`rgba(180,120,80,${.06+layer*.04})`:(lvI<80?`rgba(40,80,60,${.06+layer*.04})`:`rgba(20,30,50,${.08+layer*.05})`));
        c.beginPath();c.moveTo(-10,mtBase+layer*30);for(let x=0;x<=cv.width+10;x+=8){c.lineTo(x,mtBase+layer*30-Math.sin(x*0.012+mtTime+layer*2.5)*(22+layer*14)-Math.sin(x*0.006+mtTime*1.7)*(14+layer*8));}c.lineTo(cv.width+10,cv.height);c.lineTo(-10,cv.height);c.closePath();c.fill();}

      if(s.L.w>0&&!s.wOvr){s.wTm++;if(s.wTm%60===0){s.wTgt=(Math.random()-.5)*2.5*s.L.w;if(s.wTm%120===0)SFX.wind();}s.wind+=(s.wTgt-s.wind)*.04;if(Math.random()<.005)s.wTgt=(Math.random()>.5?1:-1)*s.L.w*2;if(s.L.tut&&Math.abs(s.wind)>.3&&s.wTm===60)checkTut('wind');}
      if(s.wOvr)s.wind*=.9;

      if(s.mov&&s.mov.ghost){s.mov.gt++;const ph=(s.mov.gt%90)/90;const was=s.mov.gv;s.mov.gv=ph<.55;if(!was&&s.mov.gv)SFX.ghostWhoosh();}
      if(s.mov&&s.mov.rot){s.mov.rt+=.06;s.mov.w=s.mov.baseW*(.6+Math.sin(s.mov.rt)*.4);}

      if(s.adCooldown>0)s.adCooldown--;
      if(s.mov&&s.alive){let sm=1;if(s.L.bu){s.mov.bt++;if(s.mov.bt%120<25)sm=1.9;}s.mov.x+=(s.mov.spd*sm)*s.mov.dir+s.wind*2.5;if(s.mov.x+s.mov.w>s.W){s.mov.dir=-1;s.mov.x=s.W-s.mov.w;}if(s.mov.x<0){s.mov.dir=1;s.mov.x=0;}}

      if(s.mov&&s.alive&&s.mov.adMax>0){s.mov.adT++;const adPct=s.mov.adT/s.mov.adMax;if(adPct>=0.75&&s.mov.adT===Math.floor(s.mov.adMax*0.75))sT('m',setMsg,'⏳ Düşecek!',1200);if(adPct>=0.9){c.save();c.globalAlpha=Math.sin(s.mov.adT*.3)*.3+.3;c.fillStyle='#ff1744';c.fillRect(0,0,s.W,3);c.restore();}if(s.mov.adT>=s.mov.adMax){s.adCooldown=15;drop();}}
      if(s.L.mag&&s.mov&&s.alive){const scx=s.stack.length?s.stack[s.stack.length-1].x+s.stack[s.stack.length-1].w/2:s.W/2;const mcx=s.mov.x+s.mov.w/2;s.mov.x+=(scx-mcx)*s.L.mag*0.008;}
      if(s.L.shr&&s.mov&&s.alive){s.mov.w=Math.max(s.mov.baseW*0.35,s.mov.w-s.L.shr*0.06);}
      if(s.L.grv&&s.mov&&s.alive){s.grvT++;if(s.grvT%180<30)s.mov.y+=Math.sin(s.grvT*0.3)*1.2;}
      if(s.mov&&s.mov.rushT!==undefined&&s.alive){s.mov.rushT++;if(s.mov.rushT>=s.mov.rushM){s.fl.push({x:s.mov.x,y:s.mov.y,w:s.mov.w,h:s.CH,wd:s.mov.wd,vy:-2,vx:s.mov.dir*3,rot:0,vr:s.mov.dir*.08});s.mov=null;sT('m',setMsg,'⚡ Çok yavaş!',800);SFX.cut();handleStackMiss();}}

      s.stack.forEach((cr,idx)=>{if(cr.ice&&cr.slL>0){cr.slL--;const dx=cr.slV;cr.x+=dx;
        if(cr.x<0){cr.x=0;cr.slV*=-1;}if(cr.x+cr.w>s.W){cr.x=s.W-cr.w;cr.slV*=-1;}cr.slV*=.995;
        for(let j=idx+1;j<s.stack.length;j++){s.stack[j].x+=dx;}}});

      s.stack.forEach(cr=>{if(cr.bncing){cr.bncVy+=.3;cr.y+=cr.bncVy;if(cr.y>=cr.bncOrig){cr.y=cr.bncOrig;cr.bncing=false;cr.bncVy=0;}}});

      if(s.alive){for(let i=s.stack.length-1;i>=0;i--){const cr=s.stack[i];if(cr.bomb&&cr.bmT!==undefined){cr.bmT++;if(cr.bmT>cr.bmM*.6&&cr.bmT%15===0)SFX.bombTick();
        if(cr.bmT>=cr.bmM){bst(s,cr.x+cr.w/2,cr.y,'#ff4444',30);sT('m',setMsg,'💣 BOOM!',1200);SFX.bombExplode();vfx.current.shockwave={x:cr.x+cr.w/2,y:cr.y,r:0,maxR:120};
          s.fl.push({x:cr.x,y:cr.y,w:cr.w,h:s.CH,wd:cr.wd,vy:-3,vx:(Math.random()-.5)*4,rot:0,vr:(Math.random()-.5)*.15});
          s.stack.splice(i,1);for(let j=i;j<s.stack.length;j++){s.stack[j].y+=s.CH;}
          if(s.mov){s.mov.y+=s.CH;}
          s.cr=s.stack.length;setHud(`📦 ${s.cr} / ${s.L.goal}`);if(!s.mov)spawn(s);break;}}}}

      if(s.L.mj>0&&s.alive&&s.stack.length>2&&Math.random()<s.L.mj){
        const top=s.stack[s.stack.length-1];const push=(Math.random()-.5)*18;top.x+=push;
        sT('m',setMsg,'🐒💨',600);SFX.monkeyJump();}

      if(s.bA&&s.L.bee&&s.alive&&s.mov){s.bT++;if(s.bT>s.bM*.65)setBeeW(true);
        if(s.bT>=s.bM){setBeeW(false);const m=s.mov;s.fl.push({x:m.x,y:m.y,w:m.w,h:s.CH,wd:m.wd,vy:-3,vx:m.dir*4,rot:0,vr:m.dir*.1});s.mov=null;s.bA=false;sT('m',setMsg,'🐝 Kaçtı!',1000);SFX.beeFly();setTimeout(()=>{if(s.alive&&!s.mov)spawn(s);},500);}}
      if(s.L.bee&&s.alive){s.bST++;if(s.bST%45===0){const ty=s.stack.length?s.stack[s.stack.length-1].y:s.GY;s.bees.push({x:Math.random()>.5?-20:s.W+20,y:ty-Math.random()*70-20,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*1.5,fr:Math.random()*10,life:100+Math.random()*70});}}
      s.bees.forEach(b=>{b.fr+=.2;b.x+=b.vx+Math.sin(b.fr*.3)*.8;b.y+=b.vy+Math.cos(b.fr*.4)*.5;b.life--;});s.bees=s.bees.filter(b=>b.life>0);
      if(s.alive&&s.cr>=2){s.bTm++;if(s.bTm>=Math.max(80,200-s.cr*12)){s.bTm=0;const fl=Math.random()>.5;s.birds.push({x:fl?-50:s.W+50,y:s.GY-s.cr*s.CH*.5-Math.random()*60,dir:fl?1:-1,spd:2+Math.random()*2,fr:0});}}
      s.birds.forEach(b=>{b.fr+=.15;b.x+=b.dir*b.spd;});s.birds=s.birds.filter(b=>b.x>-80&&b.x<s.W+80);
      if(s.L.qk&&s.alive){s.qTm++;if(s.qTm%300===0&&s.stack.length>3){s.qA=true;s.qC=40;sT('m',setMsg,'🫨',1200);SFX.quake();}if(s.qA){s.qC--;const decay=s.qC/40;s.qX=Math.sin(s.qC*0.8)*decay*8;s.qY=Math.cos(s.qC*1.1)*decay*4;if(s.qC<=0){s.qA=false;s.qX=0;s.qY=0;}}else{s.qX*=.9;s.qY*=.9;}}
      if(s.L.r){s.rain.forEach(r=>{r.y+=r.spd;r.x+=s.wind*2;if(r.y>s.H){r.y=-10;r.x=Math.random()*s.W;}});}
      s.pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.02;});s.pts=s.pts.filter(p=>p.life>0);
      s.fl.forEach(f=>{f.x+=f.vx;f.vy+=.4;f.y+=f.vy;f.rot+=f.vr;});s.fl=s.fl.filter(f=>f.y<s.H+100);

      c.save();c.translate(s.qX||0,s.qY||0);
      const tx=s.W/2,base=s.GY,ttY=Math.max(60,s.GY-s.L.goal*s.CH-80);
      c.fillStyle=ni?'#4a2a16':'#6B4226';c.beginPath();c.moveTo(tx-14,base+4);c.lineTo(tx-8,ttY+40);c.lineTo(tx+8,ttY+40);c.lineTo(tx+14,base+4);c.closePath();c.fill();
      c.fillStyle=ni?'#1a4a1a':'#2E7D32';c.beginPath();c.arc(tx,ttY+22,34,0,Math.PI*2);c.fill();c.fillStyle=ni?'#1e5a1e':'#388E3C';c.beginPath();c.arc(tx-16,ttY+30,22,0,Math.PI*2);c.fill();c.beginPath();c.arc(tx+18,ttY+26,24,0,Math.PI*2);c.fill();
      c.fillStyle=ni?'#2a6a2a':'#43A047';c.beginPath();c.arc(tx,ttY+14,18,0,Math.PI*2);c.fill();
      c.fillStyle='#FFD600';for(let i=-1;i<=1;i++){c.beginPath();c.ellipse(tx+i*11,ttY+42,4,10,i*.2,0,Math.PI*2);c.fill();}
      const leafT=Date.now()*.001;for(let i=0;i<5;i++){const lx=tx-30+((leafT*15+i*60)%80),ly=ttY+35+((leafT*8+i*40)%60)+Math.sin(leafT+i*1.5)*6;c.save();c.translate(lx,ly);c.rotate(Math.sin(leafT*0.7+i)*0.4);c.fillStyle=ni?'#2a5a2a':'#4CAF50';c.globalAlpha=.5;c.beginPath();c.ellipse(0,0,4,2,.3,0,Math.PI*2);c.fill();c.restore();}
      c.fillStyle=ni?'#2a4a2a':'#5a9e4b';c.fillRect(-10,s.GY,s.W+20,s.H-s.GY+10);
      c.fillStyle=ni?'#1e3a1e':'#4a8e3b';c.fillRect(-10,s.GY,s.W+20,4);
      c.fillStyle=ni?'#3a5a3a':'#6ab85a';for(let i=0;i<25;i++){const gx=i*(s.W/24);c.beginPath();c.moveTo(gx,s.GY);c.lineTo(gx+3,s.GY-5-(i%3)*3);c.lineTo(gx+6,s.GY);c.fill();}

      const dCr=(bx,by,bw,wd,fr,fl={})=>{
        let al=1;if(fl.ghost&&!fl.gv)al=.08;else if(fl.ghost)al=.9;
        const rd=3;
        c.save();c.globalAlpha*=al;
        if(fl.gold){c.shadowColor='#FFD700';c.shadowBlur=12;}else if(fl.ice){c.shadowColor='#4FC3F7';c.shadowBlur=10;}
        else if(fl.bomb&&fl.bmT!==undefined&&fl.bmT/fl.bmM>.6){c.shadowColor='#ff1744';c.shadowBlur=10;}
        else if(fl.rot){c.shadowColor='#FF9800';c.shadowBlur=8;}
        else if(fl.bnc&&fl.bncing){c.shadowColor='#66BB6A';c.shadowBlur=10;}
        else if(fl.pf){c.shadowColor=fl.pf.color;c.shadowBlur=10;}
        else{c.shadowColor='rgba(0,0,0,.25)';c.shadowBlur=4;c.shadowOffsetY=2;}
        c.fillStyle=wd[0];c.beginPath();c.roundRect(bx,by,bw,s.CH,rd);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
        c.strokeStyle=wd[1];c.lineWidth=1;const n=Math.max(2,Math.floor(bw/24));
        for(let i=1;i<n;i++){const px=bx+i*(bw/n);c.globalAlpha=al*(.3+Math.sin(i*1.7)*.15);c.beginPath();c.moveTo(px,by+2);c.bezierCurveTo(px+1,by+s.CH*.3,px-1,by+s.CH*.7,px,by+s.CH-2);c.stroke();}
        c.globalAlpha=al;
        c.fillStyle=wd[1];c.beginPath();c.roundRect(bx,by,bw,3,{upperLeft:rd,upperRight:rd,lowerLeft:0,lowerRight:0});c.fill();
        c.beginPath();c.roundRect(bx,by+s.CH-3,bw,3,{upperLeft:0,upperRight:0,lowerLeft:rd,lowerRight:rd});c.fill();
        c.fillStyle=wd[2];c.globalAlpha=al*.2;c.beginPath();c.roundRect(bx+2,by+3,bw-4,s.CH*.3,2);c.fill();c.globalAlpha=al;
        if(bw>18){c.font=`${Math.min(16,bw*.28)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(fr,bx+bw/2,by+s.CH/2);}
        if(fl.gold){const sp=Date.now()*.005;c.fillStyle='rgba(255,255,200,.8)';for(let j=0;j<4;j++){const sx=bx+8+((j*bw/4+sp*25)%bw),sy=by+4+Math.sin(sp+j*1.8)*(s.CH*.3);c.beginPath();c.arc(sx,sy,1.5+Math.sin(sp*2+j)*.5,0,Math.PI*2);c.fill();}}
        if(fl.ice){c.fillStyle='rgba(180,230,255,.12)';c.beginPath();c.roundRect(bx,by,bw,s.CH,rd);c.fill();c.strokeStyle='rgba(200,240,255,.3)';c.lineWidth=1;c.beginPath();c.moveTo(bx+bw*.2,by+2);c.lineTo(bx+bw*.35,by+s.CH*.4);c.lineTo(bx+bw*.5,by+2);c.stroke();}
        if(fl.bomb&&fl.bmT!==undefined){const pc=fl.bmT/fl.bmM;c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.roundRect(bx+3,by-6,bw-6,4,2);c.fill();c.fillStyle=pc>.7?'#ff1744':'#4CAF50';c.beginPath();c.roundRect(bx+3,by-6,(bw-6)*(1-pc),4,2);c.fill();if(pc>.7){c.fillStyle=`rgba(255,0,0,${Math.sin(Date.now()*.03)*.12+.08})`;c.beginPath();c.roundRect(bx,by,bw,s.CH,rd);c.fill();}}
        c.restore();};

      s.stack.forEach(cr=>dCr(cr.x,cr.y,cr.w,cr.wd,cr.fr,cr));
      s.fl.forEach(f=>{c.save();c.translate(f.x+f.w/2,f.y+f.h/2);c.rotate(f.rot);c.globalAlpha=Math.max(.1,1-f.vy*.03);c.fillStyle=f.wd[0];c.fillRect(-f.w/2,-f.h/2,f.w,f.h);c.restore();});

      let mx2,my2;if(s.stack.length){const tt=s.stack[s.stack.length-1];mx2=tt.x+tt.w/2;my2=tt.y;}else{mx2=s.W/2;my2=s.GY;}
      s.mT+=.05;my2+=Math.sin(s.mT)*1.5-2;
      const mCombo=s.combo>=5;const mHappy=s.combo>=3;const mScared=!s.alive;
      c.fillStyle='#8D6E4C';c.beginPath();c.ellipse(mx2,my2-10,11,14,0,0,Math.PI*2);c.fill();
      c.fillStyle='#C4A97D';c.beginPath();c.ellipse(mx2,my2-7,7,9,0,0,Math.PI*2);c.fill();
      c.fillStyle='#8D6E4C';c.beginPath();c.arc(mx2,my2-28,11,0,Math.PI*2);c.fill();
      c.fillStyle='#C4A97D';c.beginPath();c.ellipse(mx2,my2-25.5,7.5,6.5,0,0,Math.PI*2);c.fill();
      if(mCombo){c.font='6px sans-serif';c.textAlign='center';c.fillText('⭐',mx2-3.5,my2-28);c.fillText('⭐',mx2+3.5,my2-28);}
      else if(mScared){c.strokeStyle='#222';c.lineWidth=1.5;c.beginPath();c.moveTo(mx2-5,my2-30);c.lineTo(mx2-2,my2-26);c.stroke();c.beginPath();c.moveTo(mx2-2,my2-30);c.lineTo(mx2-5,my2-26);c.stroke();c.beginPath();c.moveTo(mx2+2,my2-30);c.lineTo(mx2+5,my2-26);c.stroke();c.beginPath();c.moveTo(mx2+5,my2-30);c.lineTo(mx2+2,my2-26);c.stroke();}
      else{const eyeSz=mHappy?2.5:2;c.fillStyle='#222';c.beginPath();c.arc(mx2-3.5,my2-28,eyeSz,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx2+3.5,my2-28,eyeSz,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(mx2-2.8,my2-28.6,.8,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx2+4.2,my2-28.6,.8,0,Math.PI*2);c.fill();}
      if(mHappy&&!mScared){c.strokeStyle='#222';c.lineWidth=1.2;c.beginPath();c.arc(mx2,my2-23,3.5,0.1,Math.PI-0.1);c.stroke();}
      else if(mScared){c.fillStyle='#222';c.beginPath();c.ellipse(mx2,my2-23,3,2.5,0,0,Math.PI*2);c.fill();}
      c.fillStyle='#8D6E4C';c.beginPath();c.arc(mx2-11,my2-28,4.5,0,Math.PI*2);c.fill();c.beginPath();c.arc(mx2+11,my2-28,4.5,0,Math.PI*2);c.fill();
      c.strokeStyle='#8D6E4C';c.lineWidth=4;c.lineCap='round';const aw=Math.sin(s.mT*2)*(mHappy?5:3);
      c.beginPath();c.moveTo(mx2-8,my2-13);c.quadraticCurveTo(mx2-16,my2-36+aw,mx2-11,my2-(mHappy?45:42)+aw);c.stroke();
      c.beginPath();c.moveTo(mx2+8,my2-13);c.quadraticCurveTo(mx2+16,my2-36-aw,mx2+11,my2-(mHappy?45:42)-aw);c.stroke();
      if(s.alive&&s.cr<s.L.goal){c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(mx2+22,my2-50,16,10,0,0,Math.PI*2);c.fill();c.font='13px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(mHappy?'🎉':'🍌',mx2+22,my2-50);}
      if(s.mov){dCr(s.mov.x,s.mov.y,s.mov.w,s.mov.wd,s.mov.fr,s.mov);}
      c.restore();
      s.birds.forEach(b=>{c.save();c.translate(b.x,b.y);if(b.dir<0)c.scale(-1,1);const wf=Math.sin(b.fr)*.4;c.fillStyle='#5D4037';c.beginPath();c.ellipse(0,0,13,8,0,0,Math.PI*2);c.fill();c.fillStyle='#795548';c.beginPath();c.moveTo(-3,-5);c.quadraticCurveTo(-1,-16-wf*12,9,-8-wf*8);c.lineTo(3,-3);c.fill();c.fillStyle='#4E342E';c.beginPath();c.arc(11,-2,6,0,Math.PI*2);c.fill();c.fillStyle='#FF8F00';c.beginPath();c.moveTo(16,-2);c.lineTo(21,0);c.lineTo(16,2);c.fill();c.restore();});
      s.bees.forEach(be=>{c.save();c.translate(be.x,be.y);c.fillStyle='#FFD600';c.beginPath();c.ellipse(0,0,7,5,0,0,Math.PI*2);c.fill();c.fillStyle='#222';c.fillRect(-2,-5,4,2);c.fillRect(-3,-1,5,2);c.fillRect(-2,3,4,2);c.restore();});
      if(s.L.r){c.strokeStyle=ni?'rgba(100,150,200,.25)':'rgba(150,200,255,.3)';c.lineWidth=1.5;s.rain.forEach(r=>{c.beginPath();c.moveTo(r.x,r.y);c.lineTo(r.x+s.wind*3,r.y+r.len);c.stroke();});}
      if(s.L.w>0&&Math.abs(s.wind)>.04){const d2=s.wind>0?1:-1,str=Math.min(Math.abs(s.wind),1),now=Date.now(),
        flow=now*.0012*d2*(.55+str*.5),drift=now*.028*d2*str,cx=s.W/2;
        c.save();c.lineCap='round';c.lineJoin='round';
        const waveLine=(y0,amp,ph,w,col,a)=>{c.beginPath();for(let i=0;i<=36;i++){const u=i/36,px=u*s.W+drift*12+Math.sin(u*5+ph+flow)*14*d2,py=y0+Math.sin(u*6.28+ph*.7+flow*1.3)*(amp*(.6+str*.4));
          if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}c.strokeStyle=col;c.globalAlpha=a;c.lineWidth=w;c.stroke();};
        waveLine(26,10,.2,4+str*3,'rgba(1,87,155,.95)',.35+str*.25);
        waveLine(38,8,.8,3+str*2.2,'rgba(129,212,250,.9)',.45+str*.3);
        waveLine(50,11,1.4,2.2+str*1.8,'rgba(255,255,255,.92)',.3+str*.35);
        for(let k=0;k<11;k++){const y=16+(k*41)%(s.H*.22|0),x0=-50+((now*(.045+.04*str)*d2+k*67)%(s.W+100));
          c.beginPath();c.moveTo(x0,y);
          c.bezierCurveTo(x0+d2*42,y-14-str*6,x0+d2*88,y+12+str*4,x0+d2*130,y-3);
          c.strokeStyle=`rgba(227,242,253,${0.12+str*.22})`;c.lineWidth=1.4+str*1.2;c.globalAlpha=1;c.stroke();}
        for(let k=0;k<6;k++){const y=22+k*11,sw=28+str*22,ph=k+flow;
          c.beginPath();c.moveTo(cx-d2*sw+Math.sin(ph)*6,y);
          c.quadraticCurveTo(cx+d2*(sw*.45),y-16-str*5,cx+d2*sw+Math.sin(ph+1.2)*8,y+Math.sin(ph)*3);
          c.quadraticCurveTo(cx+d2*(sw*.25),y+12+str*3,cx-d2*(sw*.7),y+4);
          c.strokeStyle=k%2===0?'rgba(179,229,252,.75)':'rgba(255,255,255,.55)';c.lineWidth=2.2+str*1.5;c.stroke();}
        c.globalAlpha=1;c.font='bold 22px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
        const sx=cx+d2*(22+Math.sin(now*.0035)*10)+drift*.35;
        c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.5)';c.strokeText('💨',sx,18);c.fillStyle='#E1F5FE';c.fillText('💨',sx,18);c.restore();}
      if(ni){let fx,fy;if(s.stack.length){const t2=s.stack[s.stack.length-1];fx=t2.x+t2.w/2;fy=t2.y-20;}else{fx=s.W/2;fy=s.GY-20;}const ng=c.createRadialGradient(fx,fy,50,fx,fy,200);ng.addColorStop(0,'rgba(0,0,0,0)');ng.addColorStop(.5,'rgba(0,0,0,.3)');ng.addColorStop(1,'rgba(0,0,0,.75)');c.fillStyle=ng;c.fillRect(0,0,s.W,s.H);}
      if(s.L.fog){const now2=Date.now();c.save();for(let i=0;i<10;i++){const fx2=((now2*0.018+i*280)%(s.W+200))-100;const fy2=20+(i*71+Math.sin(now2*.0008+i)*25)%(s.H*.75);const fr2=35+i*12+Math.sin(now2*.0004+i*2)*12;const fg=c.createRadialGradient(fx2,fy2,0,fx2,fy2,fr2);fg.addColorStop(0,`rgba(190,200,210,${0.12+s.L.fog*0.15})`);fg.addColorStop(1,'rgba(190,200,210,0)');c.fillStyle=fg;c.beginPath();c.arc(fx2,fy2,fr2,0,Math.PI*2);c.fill();}c.restore();}
      s.pts.forEach(p=>{c.globalAlpha=p.life;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.sz,0,Math.PI*2);c.fill();});c.globalAlpha=1;
      if(vfx.current.redFlash>0){c.save();c.globalAlpha=vfx.current.redFlash/20*0.35;c.fillStyle='#ff1744';c.fillRect(0,0,s.W,s.H);c.restore();vfx.current.redFlash--;}
      if(vfx.current.goldGlow>0){c.save();const gg=vfx.current.goldGlow/25;const gEdge=c.createRadialGradient(s.W/2,s.H/2,s.H*.3,s.W/2,s.H/2,s.H*.7);gEdge.addColorStop(0,'rgba(255,215,0,0)');gEdge.addColorStop(1,`rgba(255,215,0,${gg*0.25})`);c.fillStyle=gEdge;c.fillRect(0,0,s.W,s.H);c.restore();vfx.current.goldGlow=Math.max(0,vfx.current.goldGlow-0.3);}
      if(vfx.current.shockwave){const sw=vfx.current.shockwave;sw.r+=6;c.save();c.globalAlpha=Math.max(0,1-sw.r/sw.maxR)*0.5;c.strokeStyle='#ff6600';c.lineWidth=3;c.beginPath();c.arc(sw.x,sw.y,sw.r,0,Math.PI*2);c.stroke();c.restore();if(sw.r>=sw.maxR)vfx.current.shockwave=null;}
      if(s.alive){const bw2=6,bh2=s.H*.3,bx2=10,by2=s.H*.36;c.fillStyle='rgba(0,0,0,.1)';c.beginPath();c.roundRect(bx2,by2,bw2,bh2,3);c.fill();const f2=Math.min(s.cr/s.L.goal,1),fh2=bh2*f2;const pg=c.createLinearGradient(0,by2+bh2-fh2,0,by2+bh2);pg.addColorStop(0,'#FFD600');pg.addColorStop(1,'#F57F17');c.fillStyle=pg;c.beginPath();c.roundRect(bx2,by2+bh2-fh2,bw2,Math.max(fh2,1),3);c.fill();}
      if(s.bA&&s.L.bee&&s.alive){const pc=s.bT/s.bM,bw3=60,bx3=s.W-bw3-10,by3=50;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.roundRect(bx3,by3,bw3,5,3);c.fill();c.fillStyle=pc>.65?'#ff1744':pc>.35?'#FF9800':'#4CAF50';c.beginPath();c.roundRect(bx3,by3,bw3*(1-pc),5,3);c.fill();}
    };

    const loop=()=>{c.clearRect(0,0,cv.width,cv.height);if(md.current==="b")bLoop();else sLoop();raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',rsz);};
  },[drop,handleStackMiss,checkTut]);

  useEffect(()=>{tutPausedRef.current=tutPaused;},[tutPaused]);
  useEffect(()=>{if(scr!=='play'){setTutPaused(false);setTutText("");}},[scr]);

  const ptrLocalX=useCallback(e=>{const cv=cvRef.current;if(!cv)return 0;const r=cv.getBoundingClientRect();return e.clientX-r.left;},[]);
  const hPtr=useCallback(e=>{e.preventDefault();if(scr!=='play')return;SFX.init();
    if(tutPausedRef.current)return;
    if(md.current==='b'&&bs.current){bs.current.tX=ptrLocalX(e);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}}
    if(md.current==='s'&&gs.current&&gs.current.mov&&!(gs.current.adCooldown>0))drop();
  },[scr,drop,ptrLocalX]);
  const hMov=useCallback(e=>{if(md.current==='b'&&bs.current&&scr==='play')bs.current.tX=ptrLocalX(e);},[scr,ptrLocalX]);
  const hPtrEnd=useCallback(e=>{try{e.currentTarget.releasePointerCapture(e.pointerId);}catch(_){}},[]);

  const maxLivesForLv=L[lv]?.lives??getLivesForLevel(lv);

  return(
    <div className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden touch-none" style={{touchAction:'none',userSelect:'none',WebkitUserSelect:'none'}}>
      <canvas ref={cvRef} className="absolute inset-0 w-full h-full" onPointerDown={hPtr} onPointerMove={hMov} onPointerUp={hPtrEnd} onPointerCancel={hPtrEnd}/>

      {scr==='play'&&(<>
        <div className="absolute left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full max-w-[92vw]" style={{top:safeT,background:'rgba(0,0,0,.3)',fontFamily:"'Lilita One',cursive",fontSize:'clamp(13px,3.8vw,17px)',color:'#fff',pointerEvents:'none'}}>{hud}</div>
        <div className="absolute z-10 px-2 py-1 rounded-full" style={{top:safeT,left:safeX,background:L[lv].t==='b'?'rgba(255,180,0,.4)':'rgba(0,0,0,.3)',color:'#ffd93d',fontFamily:"'Lilita One',cursive",fontSize:'clamp(9px,2.8vw,12px)',pointerEvents:'none'}}>{L[lv].t==='b'?'BONUS ':''}{L[lv].icon} {lv+1}</div>
        <div className="absolute z-10 flex flex-row items-center gap-1" style={{top:safeT,right:safeR,pointerEvents:'none'}}>
          {pIco&&<div className="px-1.5 py-0.5 rounded-full shrink-0" style={{background:'rgba(0,0,0,.35)',fontSize:'clamp(12px,3.5vw,16px)'}}>{pIco}</div>}
          {L[lv].t==="s"&&(
            <div className="flex flex-row items-center gap-0.5 px-2 py-1 rounded-full shrink-0" style={{background:'rgba(0,0,0,.5)',boxShadow:'0 0 0 1px rgba(255,255,255,.12)'}} role="status" aria-label={`Kalan can: ${lives}`}>
              {Array.from({length:maxLivesForLv},(_,i)=>(<span key={i} style={{fontSize:'clamp(15px,4.2vw,20px)',lineHeight:1,opacity:i<lives?1:0.22,filter:i<lives?'none':'grayscale(1) brightness(1.2)'}}>{i<lives?'❤️':'🤍'}</span>))}
            </div>
          )}
        </div>
        {cmb&&<div className="absolute left-1/2 -translate-x-1/2 z-10" style={{top:'calc(env(safe-area-inset-top, 0px) + 2.75rem)',fontFamily:"'Lilita One',cursive",fontSize:'clamp(11px,3.2vw,15px)',color:'#ffd93d',pointerEvents:'none'}}>{cmb}</div>}
        {fMsg&&<div className="absolute left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full max-w-[90vw]" style={{top:'calc(env(safe-area-inset-top, 0px) + 3.5rem)',background:'rgba(0,0,0,.4)',fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,2.9vw,12px)',color:'#fff',pointerEvents:'none',textAlign:'center'}}>{fMsg}</div>}
        {msg&&<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-pulse px-2" style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(18px,5vw,24px)',color:'#ff6b6b',textShadow:'0 0 10px rgba(255,107,107,.5)',pointerEvents:'none',textAlign:'center'}}>{msg}</div>}
        {beeW&&<div className="absolute left-1/2 -translate-x-1/2 z-10 animate-pulse" style={{bottom:'calc(env(safe-area-inset-bottom, 0px) + 3rem)',fontFamily:"'Lilita One',cursive",fontSize:'clamp(13px,3.8vw,17px)',color:'#ff1744',pointerEvents:'none'}}>🐝 ÇABUK!</div>}
        {tutPaused&&tutText&&(
          <div className="absolute inset-0 z-[20] flex items-end justify-center" style={{background:'rgba(0,0,0,.45)',paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 2rem)'}}>
            <div className="w-[min(92vw,26rem)] px-4 py-3 rounded-2xl flex flex-col gap-2" style={{background:'rgba(0,30,40,.92)',border:'1.5px solid rgba(255,214,0,.4)',boxShadow:'0 6px 30px rgba(0,0,0,.5)'}}>
              <p style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(12px,3.4vw,15px)',color:'#fff',margin:0,lineHeight:1.45,textAlign:'center'}}>{tutText}</p>
              <button type="button" className="self-center min-h-[48px] px-6 rounded-full touch-manipulation active:scale-95 transition-transform" style={{...btnStyle,fontSize:'clamp(13px,3.6vw,16px)',padding:'12px 28px'}} onClick={e=>{e.stopPropagation();resumeTut();}}>Anladım 👆</button>
            </div>
          </div>
        )}
        {L[lv].t==='b'&&lv<=10&&!tutPaused&&<p className="absolute left-1/2 -translate-x-1/2 z-10 text-center opacity-75 max-w-[70vw]" style={{bottom:'calc(env(safe-area-inset-bottom, 0px) + 3.35rem)',fontFamily:"'Lilita One',cursive",fontSize:'clamp(9px,2.5vw,11px)',color:'#fff',pointerEvents:'none',margin:0}}>👆 Parmağını sürükle</p>}
        <button type="button" className="absolute z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center" style={{bottom:safeB,right:'max(0.35rem, env(safe-area-inset-right, 0px))',background:'rgba(0,0,0,.35)',fontSize:16,border:'none',cursor:'pointer',color:'#fff',touchAction:'manipulation'}} onClick={e=>{e.stopPropagation();setSOn(SFX.toggle());}} aria-label={sOn?'Sesi kapat':'Sesi aç'}>{sOn?'🔊':'🔇'}</button>
      </>)}

      {scr==='menu'&&(
        <div className="absolute inset-0 z-20 flex flex-col items-center overflow-y-auto overscroll-contain" style={{background:'radial-gradient(ellipse,rgba(78,173,213,.98),rgba(20,60,40,.99))',paddingTop:'max(0.75rem, env(safe-area-inset-top))',paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))',paddingLeft:'max(0.5rem, env(safe-area-inset-left))',paddingRight:'max(0.5rem, env(safe-area-inset-right))'}}>
          <div className="pt-1 pb-1 text-center w-full shrink-0">
            <div className="text-4xl sm:text-3xl mb-0.5">🐒</div>
            <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.25rem, 5vw, 1.5rem)',color:'#ffd93d',textShadow:'2px 3px 0 rgba(0,0,0,.3)'}}>Muza Ulaş!</div>
            <p style={{color:'rgba(255,255,255,.5)',fontSize:'clamp(9px,2.6vw,11px)',marginTop:4}}>Mobil oyun · {L.length} level · 🪙 {inventory.coins}</p>
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
              <button type="button" onClick={()=>{SFX.click();setScr("shop");}} className="min-h-[44px] touch-manipulation" style={{...btnStyle,fontSize:'clamp(11px,3vw,13px)',padding:'8px 18px',background:'linear-gradient(135deg,#7B1FA2,#4A148C)'}}>🏪 Dükkan</button>
              <label className="flex items-center justify-center gap-2 cursor-pointer select-none min-h-[44px] px-2" style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,3vw,12px)',color:'rgba(255,255,255,.9)',touchAction:'manipulation'}}>
                <input type="checkbox" checked={devMode} onChange={toggleDev} className="accent-amber-400 w-5 h-5 shrink-0"/>
                Dev
              </label>
            </div>
          </div>
          {[{label:'🌅 Şafak',from:0,to:11,bg:'linear-gradient(90deg,rgba(255,138,101,.15),rgba(255,183,77,.08))'},
            {label:'☀️ Gündüz',from:11,to:31,bg:'linear-gradient(90deg,rgba(58,155,213,.15),rgba(107,184,224,.08))'},
            {label:'🌇 Gün Batımı',from:31,to:61,bg:'linear-gradient(90deg,rgba(230,81,0,.15),rgba(255,143,0,.08))'},
            {label:'🌙 Gece',from:61,to:81,bg:'linear-gradient(90deg,rgba(26,35,126,.2),rgba(40,53,147,.08))'},
            {label:'🔥 Ultra',from:81,to:91,bg:'linear-gradient(90deg,rgba(183,28,28,.2),rgba(136,14,79,.08))'},
            {label:'👑 Final',from:91,to:100,bg:'linear-gradient(90deg,rgba(255,215,0,.2),rgba(255,143,0,.08))'},
          ].map(zone=>(
            <div key={zone.label} className="w-full max-w-md px-1 mb-2">
              <div className="rounded-lg px-2 py-1 mb-1" style={{background:zone.bg}}>
                <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,2.8vw,12px)',color:'#ffd93d',opacity:.8}}>{zone.label} ({zone.from+1}-{zone.to})</div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {L.slice(zone.from,zone.to).map((lv2,idx)=>{const i=zone.from+idx;const lk=!devMode&&i+1>unlk;const isB=lv2.t==='b';return(
                  <button type="button" key={i} onClick={()=>{if(!lk){SFX.init();SFX.click();startLv(i);}}} className="rounded-lg p-1.5 text-left transition-transform active:scale-95 min-h-[44px] touch-manipulation" style={{background:lk?'rgba(0,0,0,.3)':isB?'linear-gradient(135deg,#FF8F00,#F57F17)':i>=95?'linear-gradient(135deg,#b71c1c,#880e4f)':i>=90?'linear-gradient(135deg,#4a148c,#311b92)':i>=80?'linear-gradient(135deg,#1A237E,#283593)':'rgba(255,255,255,.12)',border:lk?'1px solid rgba(255,255,255,.05)':isB?'1.5px solid #FFD600':'1px solid rgba(255,255,255,.12)',opacity:lk?.3:1,cursor:lk?'not-allowed':'pointer'}}>
                    <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(8px,2.2vw,10px)',color:'#ffd93d'}}>{lk?'🔒':lv2.icon} {i+1}</div>
                    <div style={{fontSize:'clamp(7px,1.9vw,8px)',color:'#fff',fontWeight:700,marginTop:1,lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lv2.name}</div>
                    {!lk&&inventory.bestScores[i]>0&&<div style={{fontSize:'clamp(6px,1.6vw,8px)',marginTop:1,lineHeight:1}}>{'⭐'.repeat(inventory.bestScores[i])}</div>}
                    {!lk&&i+1===unlk&&i>0&&<div style={{fontSize:'clamp(5px,1.5vw,7px)',color:'#76FF03',fontWeight:700,marginTop:1}}>NEW</div>}
                  </button>
                );})}
              </div>
            </div>
          ))}
          <div className="h-4 shrink-0"/>
        </div>
      )}

      {scr==='over'&&(
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4" style={{background:'radial-gradient(ellipse,rgba(100,50,20,.96),rgba(40,20,10,.98))',paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)'}}>
          <div className="text-6xl sm:text-5xl mb-2">🙈</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.1rem,4.5vw,1.5rem)',color:'#ffd93d',textAlign:'center'}}>{L[lv].t==='b'?'Süre Doldu!':'Kule Yıkıldı!'}</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.75rem,8vw,2.4rem)',color:'#ffd93d',margin:'8px 0'}}>
            {md.current==='b'?(bs.current?.sc||0):(gs.current?.cr||0)} / {L[lv].goal}
          </div>
          {md.current==='s'&&gs.current&&<div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,3vw,13px)',color:'#fff',opacity:.7}}>Puan: {gs.current.score}</div>}
          <div className="flex flex-wrap gap-2 mt-3 justify-center w-full max-w-sm"><button type="button" className="min-h-[48px] min-w-[120px] touch-manipulation" onClick={()=>{SFX.click();startLv(lv);}} style={{...btnStyle,fontSize:'clamp(14px,3.8vw,16px)',padding:'12px 28px'}}>TEKRAR</button><button type="button" className="min-h-[48px] min-w-[120px] touch-manipulation" onClick={()=>{SFX.click();setScr("menu");}} style={{...btnStyle,background:'linear-gradient(135deg,#555,#333)',fontSize:'clamp(14px,3.8vw,16px)',padding:'12px 28px'}}>MENÜ</button></div>
        </div>
      )}

      {scr==='reward'&&(
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 gap-3" style={{background:'radial-gradient(ellipse,rgba(40,20,60,.97),rgba(15,8,30,.99))',paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)'}}>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.1rem,4.5vw,1.5rem)',color:'#ffd93d',textAlign:'center'}}>{L[lv].t==='b'?'Bonus Tamam!':'Level '+(lv+1)+' Tamam!'}</div>
          <div className="flex gap-1">{[1,2,3].map(i=>(<span key={i} style={{fontSize:'clamp(24px,7vw,36px)',opacity:i<=rwStars?1:.2,filter:i<=rwStars?'none':'grayscale(1)',transition:'all .3s'}}>{i<=rwStars?'⭐':'☆'}</span>))}</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,3vw,13px)',color:'#fff',opacity:.7}}>
            {md.current==='b'?`🍌 ${bs.current?.sc||0} puan`:`📦 ${gs.current?.cr||0} kasa · ${gs.current?.score||0} puan`}
          </div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(11px,3.2vw,14px)',color:'#e0e0e0',marginTop:4}}>Ödül sandıkların ({rwStars}):</div>
          <div className="flex gap-3 justify-center flex-wrap">
            {rwItems.map((item,i)=>{const opened=rwOpened.includes(i);return(
              <button key={i} type="button" onClick={()=>{if(!opened){SFX.gold();setRwOpened(p=>[...p,i]);const inv=applyRewards(inventory,[item]);setInventory(inv);saveInventory(inv);}}}
                className="flex flex-col items-center justify-center rounded-xl transition-all active:scale-90 touch-manipulation"
                style={{width:'clamp(70px,20vw,90px)',height:'clamp(70px,20vw,90px)',background:opened?'linear-gradient(135deg,#FFD600,#FF8F00)':'linear-gradient(135deg,#6B4226,#4E342E)',border:opened?'2px solid #FFD600':'2px solid #8D6E4C',boxShadow:opened?'0 0 20px rgba(255,214,0,.4)':'0 4px 12px rgba(0,0,0,.5)',cursor:opened?'default':'pointer'}}>
                {opened?(<>
                  <span style={{fontSize:'clamp(24px,7vw,32px)'}}>{item.emoji}</span>
                  <span style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(8px,2.2vw,10px)',color:'#fff',marginTop:2,textAlign:'center'}}>{item.label}</span>
                </>):(<>
                  <span style={{fontSize:'clamp(28px,8vw,36px)'}}>📦</span>
                  <span style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(8px,2.2vw,10px)',color:'#ccc',marginTop:2}}>Dokun!</span>
                </>)}
              </button>
            );})}
          </div>
          {rwOpened.length>0&&<div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,2.8vw,12px)',color:'#ffd93d',marginTop:2}}>🪙 {inventory.coins} coin</div>}
          {rwOpened.length===rwItems.length&&(
            <div className="flex flex-wrap gap-2 mt-2 justify-center w-full max-w-sm">
              {lv<L.length-1&&<button type="button" className="min-h-[48px] touch-manipulation" onClick={()=>{SFX.click();startLv(lv+1);}} style={{...btnStyle,fontSize:'clamp(13px,3.5vw,16px)',padding:'12px 22px'}}>SONRAKİ →</button>}
              <button type="button" className="min-h-[48px] min-w-[120px] touch-manipulation" onClick={()=>{SFX.click();setScr("menu");}} style={{...btnStyle,background:'linear-gradient(135deg,#555,#333)',fontSize:'clamp(14px,3.8vw,16px)',padding:'12px 28px'}}>MENÜ</button>
            </div>
          )}
        </div>
      )}

      {scr==='win'&&(
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4" style={{background:'radial-gradient(ellipse,rgba(78,173,213,.97),rgba(34,110,70,.98))',paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)'}}>
          <div className="text-6xl sm:text-5xl mb-2">🍌🐒🎉</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.1rem,4.5vw,1.5rem)',color:'#ffd93d',textAlign:'center'}}>{L[lv].t==='b'?'Bonus Tamam!':'Level '+(lv+1)+' Tamam!'}</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(12px,3.5vw,15px)',color:'#fff',marginTop:6,textAlign:'center'}}>{L[lv].name}</div>
          <div className="flex gap-1 mt-2">{[1,2,3].map(i=>(<span key={i} style={{fontSize:'clamp(20px,5.5vw,28px)',opacity:i<=rwStars?1:.2,filter:i<=rwStars?'none':'grayscale(1)'}}>{i<=rwStars?'⭐':'☆'}</span>))}</div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,3vw,12px)',color:'#ffd93d',marginTop:6}}>
            {md.current==='b'?`🍌 ${bs.current?.sc||0} puan`:`📦 ${gs.current?.cr||0} kasa · ${gs.current?.score||0} puan`}
          </div>
          <div className="flex flex-wrap gap-2 mt-5 justify-center w-full max-w-sm">{lv<L.length-1&&<button type="button" className="min-h-[48px] touch-manipulation" onClick={()=>{SFX.click();startLv(lv+1);}} style={{...btnStyle,fontSize:'clamp(13px,3.5vw,16px)',padding:'12px 22px'}}>SONRAKİ →</button>}<button type="button" className="min-h-[48px] min-w-[120px] touch-manipulation" onClick={()=>{SFX.click();setScr("menu");}} style={{...btnStyle,background:'linear-gradient(135deg,#555,#333)',fontSize:'clamp(14px,3.8vw,16px)',padding:'12px 28px'}}>MENÜ</button></div>
        </div>
      )}

      {scr==='shop'&&(
        <div className="absolute inset-0 z-20 flex flex-col items-center overflow-y-auto overscroll-contain" style={{background:'radial-gradient(ellipse,rgba(40,25,60,.98),rgba(15,8,30,.99))',paddingTop:'max(0.75rem, env(safe-area-inset-top))',paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))',paddingLeft:'max(0.5rem, env(safe-area-inset-left))',paddingRight:'max(0.5rem, env(safe-area-inset-right))'}}>
          <div className="pt-2 pb-2 text-center w-full shrink-0">
            <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(1.2rem,5vw,1.5rem)',color:'#ffd93d',textShadow:'2px 3px 0 rgba(0,0,0,.3)'}}>🏪 Dükkan</div>
            <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(11px,3vw,14px)',color:'#fff',opacity:.7,marginTop:4}}>🪙 {inventory.coins} coin</div>
          </div>
          <div style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(11px,3vw,14px)',color:'#e0e0e0',marginTop:8,marginBottom:6}}>⚡ Güçlendirici</div>
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm px-2">
            {SHOP_ITEMS.map(item=>{const owned=(inventory.boosts||{})[item.field]||0;const canBuy=inventory.coins>=item.price;return(
              <button key={item.id} type="button" onClick={()=>{if(!canBuy)return;SFX.click();const{ok,inv:ni}=purchaseItem(inventory,item.id);if(ok){saveInventory(ni);setInventory(ni);SFX.powerUp();}}}
                className="flex flex-col items-center rounded-xl p-3 transition-all active:scale-95 touch-manipulation"
                style={{background:canBuy?'linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04))':'rgba(0,0,0,.3)',border:canBuy?'1.5px solid rgba(255,214,0,.4)':'1.5px solid rgba(255,255,255,.08)',opacity:canBuy?1:.5,cursor:canBuy?'pointer':'not-allowed'}}>
                <span style={{fontSize:'clamp(24px,7vw,32px)'}}>{item.emoji}</span>
                <span style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(10px,2.8vw,13px)',color:'#ffd93d',marginTop:4}}>{item.name}</span>
                <span style={{fontSize:'clamp(8px,2.2vw,10px)',color:'#ccc',marginTop:2}}>{item.desc}</span>
                <span style={{fontFamily:"'Lilita One',cursive",fontSize:'clamp(9px,2.5vw,11px)',color:canBuy?'#FFD600':'#999',marginTop:4}}>🪙 {item.price}</span>
                {owned>0&&<span style={{fontSize:'clamp(7px,2vw,9px)',color:'#76FF03',marginTop:2}}>x{owned} envanter</span>}
              </button>
            );})}
          </div>
          <button type="button" className="mt-6 mb-4 min-h-[48px] min-w-[120px] touch-manipulation" onClick={()=>{SFX.click();setScr("menu");}} style={{...btnStyle,background:'linear-gradient(135deg,#555,#333)',fontSize:'clamp(14px,3.8vw,16px)',padding:'12px 28px'}}>← MENÜ</button>
        </div>
      )}
    </div>
  );
}
