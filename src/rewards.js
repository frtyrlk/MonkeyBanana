const STORAGE_KEY='mbRewards';

const defaultInv=()=>({coins:0,bestScores:{},streakNoLoss:0,boosts:{}});

export function loadInventory(){
  try{const d=localStorage.getItem(STORAGE_KEY);if(!d)return defaultInv();const p=JSON.parse(d);return{...defaultInv(),...p,bestScores:{...(p.bestScores||{})},boosts:{...(p.boosts||{})}};}
  catch(e){return defaultInv();}
}

export function saveInventory(inv){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(inv));}catch(e){}
}

export function calcStars(levelDef,mode,gs,bs,lives,maxLives){
  if(mode==='b'){
    const b=bs;if(!b)return 0;
    const ratio=b.sc/b.L.goal;
    if(ratio>=1.8)return 3;
    if(ratio>=1.3)return 2;
    return ratio>=1?1:0;
  }
  const s=gs;if(!s)return 0;
  const livesRatio=lives/maxLives;
  const comboMax=s.combo;
  let stars=1;
  if(livesRatio>=0.8&&comboMax>=3)stars=3;
  else if(livesRatio>=0.5||comboMax>=2)stars=2;
  return stars;
}

export function shouldShowReward(lvIdx,stars,inventory){
  if((lvIdx+1)%10===0)return true;
  if(inventory.streakNoLoss>=8)return true;
  const prev=inventory.bestScores[lvIdx]||0;
  if(stars>prev)return true;
  return false;
}

const REWARD_POOL=[
  {type:'coins',amount:25,emoji:'🪙',label:'+25 coin'},
  {type:'coins',amount:50,emoji:'💰',label:'+50 coin'},
  {type:'coins',amount:100,emoji:'💎',label:'+100 coin'},
];

export function generateRewards(stars){
  const count=Math.max(1,stars);
  const rewards=[];
  for(let i=0;i<count;i++){
    rewards.push(REWARD_POOL[Math.floor(Math.random()*REWARD_POOL.length)]);
  }
  return rewards;
}

export function applyRewards(inventory,rewards){
  const inv={...inventory,bestScores:{...inventory.bestScores},boosts:{...(inventory.boosts||{})}};
  rewards.forEach(r=>{
    if(r.type==='coins')inv.coins=(inv.coins||0)+r.amount;
  });
  return inv;
}

export const SHOP_ITEMS=[
  {id:'extraLife',name:'Ekstra Can',desc:'+1 can ile başla',price:50,emoji:'❤️‍🔥',field:'extraLife'},
  {id:'startShield',name:'Kalkan',desc:'Level başında kalkan',price:75,emoji:'🛡️',field:'startShield'},
  {id:'slowStart',name:'Yavaşlatıcı',desc:'İlk kasa yavaş gelir',price:40,emoji:'🐌',field:'slowStart'},
  {id:'windResist',name:'Rüzgar Direnci',desc:'İlk kasa rüzgarsız',price:60,emoji:'🌬️',field:'windResist'},
];

export function purchaseItem(inventory,itemId){
  const item=SHOP_ITEMS.find(s=>s.id===itemId);
  if(!item)return{ok:false,inv:inventory};
  if((inventory.coins||0)<item.price)return{ok:false,inv:inventory};
  const inv={...inventory,coins:inventory.coins-item.price,boosts:{...(inventory.boosts||{})}};
  inv.boosts[item.field]=(inv.boosts[item.field]||0)+1;
  return{ok:true,inv};
}

