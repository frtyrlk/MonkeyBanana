import { PF, NF, WOODS, GOLD_W, ICE_W, BOMB_W } from './constants';

export function spawn(s){
  if(!s.alive)return;
  const pw=s.stack.length?s.stack[s.stack.length-1].w:s.IW;
  const y=(s.stack.length?s.stack[s.stack.length-1].y:s.GY)-s.CH;
  let spd=Math.min(s.L.spd+s.cr*0.12,9),w=pw,dir=s.L.alt?(s.cr%2===0?1:-1):(s.lv>=5&&Math.random()>.5?-1:1);
  if(s.nWider){w=Math.min(w+12,Math.min(pw*1.15,s.IW));s.nWider=false;}
  if(s.nSlow){spd*=0.5;s.nSlow=false;}
  if(s.nNoW){s.wOvr=true;}else{s.wOvr=false;}
  const isG=Math.random()<.12,isGh=!isG&&s.L.gh>0&&Math.random()<s.L.gh;
  const isI=!isG&&!isGh&&s.L.ic>0&&Math.random()<s.L.ic;
  const isB=!isG&&!isGh&&!isI&&s.L.bo>0&&Math.random()<s.L.bo;
  const isR=!isG&&!isGh&&!isI&&!isB&&s.L.rot>0&&Math.random()<s.L.rot;
  const isBnc=!isG&&!isGh&&!isI&&!isB&&!isR&&s.L.bnc>0&&Math.random()<s.L.bnc;
  const hasP=!isG&&!isGh&&!isI&&!isB&&!isR&&!isBnc&&Math.random()<.2;
  const pf=hasP?PF[Math.floor(Math.random()*PF.length)]:null;
  let fr,wd;
  if(isG){fr='⭐';wd=GOLD_W;}else if(isGh){fr='👻';wd=WOODS[s.cr%4];}
  else if(isI){fr='🧊';wd=ICE_W;}else if(isB){fr='💣';wd=BOMB_W;}
  else if(isR){fr='🔄';wd=WOODS[s.cr%4];}else if(isBnc){fr='⬆️';wd=WOODS[s.cr%4];}
  else if(pf){fr=pf.emoji;wd=WOODS[s.cr%4];}
  else{const nfObj=NF[s.cr%NF.length];fr=nfObj.emoji;wd=WOODS[s.cr%4];}
  const nfData=(!isG&&!isGh&&!isI&&!isB&&!isR&&!isBnc&&!pf)?NF[s.cr%NF.length]:null;
  const adMax=s.lv<30?0:s.lv<60?600:s.lv<85?420:300;
  s.mov={x:dir===1?-w-10:s.W+10,y,w,baseW:w,dir,spd,wd,fr,
    gold:isG,ghost:isGh,ice:isI,bomb:isB,rot:isR,bnc:isBnc,pf,nfData,
    bt:0,gt:0,gv:true,rt:Math.random()*Math.PI*2,adT:0,adMax};
  if(s.L.bee){s.bA=true;s.bT=0;s.bM=Math.max(70,200-s.cr*8);}
}

export function bst(s,x,y,c,n){
  for(let i=0;i<n;i++){
    const a=Math.PI*2/n*i,sp=2+Math.random()*5;
    s.pts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,sz:2+Math.random()*4,c});
  }
}
