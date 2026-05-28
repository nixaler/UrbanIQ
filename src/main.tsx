import React, { useState, useEffect, useRef, useMemo, useCallback, Component } from 'react';
import ReactDOM from 'react-dom/client';

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
window.onerror = (msg, src, line, col, err) => {
  console.error('Global error:', msg, 'at', src, line, col, err);
};
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{children:React.ReactNode},{hasError:boolean,error:any}> {
  constructor(props:any){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error:any){return{hasError:true,error};}
  componentDidCatch(error:any,info:any){console.error('React error:',error,info);}
  render(){
    if(this.state.hasError){
      return <div style={{padding:20,fontFamily:'monospace',color:'red',background:'#fff0f0',minHeight:'100vh'}}>
        <h2>App Error</h2>
        <pre style={{whiteSpace:'pre-wrap',fontSize:12}}>{String(this.state.error)}</pre>
      </div>;
    }
    return this.props.children;
  }
}


// ══════════════════════════════════════════════════════
// CARD SYSTEM
// ══════════════════════════════════════════════════════
const CARD_RARITY={
  COMMON:   {id:"common",   label:"Common",   color:"#778899",glow:"rgba(119,136,153,.25)",weight:55},
  UNCOMMON: {id:"uncommon", label:"Uncommon", color:"#0060A9",glow:"rgba(0,96,169,.3)",    weight:28},
  RARE:     {id:"rare",     label:"Rare",     color:"#BF0000",glow:"rgba(191,0,0,.35)",     weight:13},
  LEGENDARY:{id:"legendary",label:"Legendary",color:"#c8a800",glow:"rgba(200,168,0,.45)", weight:4},
};
const CARD_DROP={
  easy:  {common:70,uncommon:22,rare:7, legendary:1},
  medium:{common:55,uncommon:28,rare:13,legendary:4},
  hard:  {common:38,uncommon:30,rare:22,legendary:10},
  pro:   {common:22,uncommon:30,rare:30,legendary:18},
};
const CARD_GAME_TYPE={dc:"transit",pdx:"transit",balt:"transit",la:"transit",states:"geography",nfl:"sports"};
const CARD_TYPE_ADV={transit:{beats:"geography",bonus:1.18},geography:{beats:"sports",bonus:1.18},sports:{beats:"transit",bonus:1.18}};

const DC_UNIQUE_CARDS={
  "Metro Center":{rarity:"legendary",ability:{name:"Transfer Rush",icon:"🔄",description:"Reveals all connecting lines at today's target station before your first guess.",type:"hint",cooldownHours:24,battleEffect:{type:"power_bonus",value:14,desc:"+14 power"}}},
  "Pentagon":{rarity:"legendary",ability:{name:"Security Clearance",icon:"🔐",description:"Your opponent's strongest card is removed from Round 1 of battle.",type:"battle",cooldownHours:48,battleEffect:{type:"disable_top",value:0,desc:"Opponent's top card sits out Round 1"}}},
  "Union Station":{rarity:"legendary",ability:{name:"Grand Terminus",icon:"🏛️",description:"Reveals Zone AND Direction. Grants +15 battle power.",type:"hint",cooldownHours:36,battleEffect:{type:"power_bonus",value:15,desc:"+15 power"}}},
  "Foggy Bottom-GWU":{rarity:"legendary",ability:{name:"Academic Intel",icon:"🎓",description:"Reveals the first letter of today's answer AND +10 battle power.",type:"hint",cooldownHours:24,battleEffect:{type:"power_bonus",value:10,desc:"+10 power"}}},
  "Dupont Circle":{rarity:"rare",ability:{name:"Circle Line",icon:"♻️",description:"Reveals every station on the same Metro line as today's answer.",type:"hint",cooldownHours:32,battleEffect:{type:"power_bonus",value:7,desc:"+7 power"}}},
  "Capitol South":{rarity:"rare",ability:{name:"Legislative Power",icon:"🏛️",description:"Blocks all opponent abilities for the entire battle.",type:"battle",cooldownHours:48,battleEffect:{type:"freeze_ability",value:0,desc:"Blocks all opponent abilities"}}},
  "Stadium-Armory":{rarity:"rare",ability:{name:"Crowd Roar",icon:"📣",description:"Random power bonus +5 to +35 in battle.",type:"battle",cooldownHours:24,battleEffect:{type:"random_bonus",min:5,max:35,desc:"Random +5 to +35"}}},
  "L'Enfant Plaza":{rarity:"rare",ability:{name:"Underground Network",icon:"🕸️",description:"Reveals all stations in the same Zone as today's answer.",type:"hint",cooldownHours:36,battleEffect:{type:"power_bonus",value:8,desc:"+8 power"}}},
  "Navy Yard-Ballpark":{rarity:"rare",ability:{name:"Home Field",icon:"⚾",description:"+20 battle power when your deck has all 5 cards.",type:"battle",cooldownHours:24,battleEffect:{type:"deck_bonus",value:20,desc:"+20 full deck"}}},
};
const STATE_UNIQUE_CARDS={
  "California":{rarity:"legendary",ability:{name:"Golden State",icon:"✨",description:"All Legendary cards in your deck receive +10 power for this battle.",type:"battle",cooldownHours:48,battleEffect:{type:"legendary_boost",value:10,desc:"All Legendaries +10"}}},
  "Texas":{rarity:"legendary",ability:{name:"Lone Star",icon:"⭐",description:"Immune to ALL opponent ability effects this battle.",type:"battle",cooldownHours:48,battleEffect:{type:"immunity",value:0,desc:"Immune to all abilities"}}},
  "New York":{rarity:"legendary",ability:{name:"Empire State",icon:"🏙️",description:"Auto-wins Round 1 AND Round 5.",type:"battle",cooldownHours:72,battleEffect:{type:"auto_win_rounds",rounds:[0,4],desc:"Auto-wins Rounds 1 and 5"}}},
  "Florida":{rarity:"rare",ability:{name:"Wildcard State",icon:"🎲",description:"Coin flip: +35 power or -10. Classic Florida energy.",type:"battle",cooldownHours:24,battleEffect:{type:"coin_flip_bonus",win:35,lose:-10,desc:"Coin flip: +35 or -10"}}},
  "Alaska":{rarity:"rare",ability:{name:"Last Frontier",icon:"🏔️",description:"+8 power for every round you're currently losing.",type:"battle",cooldownHours:36,battleEffect:{type:"comeback_scaling",value:8,desc:"+8 per round behind"}}},
  "Colorado":{rarity:"rare",ability:{name:"Rocky Mountain High",icon:"⛰️",description:"+2 power for every day in your current streak.",type:"battle",cooldownHours:24,battleEffect:{type:"streak_scaling",value:2,desc:"+2 per streak day"}}},
  "Massachusetts":{rarity:"rare",ability:{name:"Revolution",icon:"🔥",description:"When losing by 2+ rounds, triggers +22 comeback power.",type:"battle",cooldownHours:36,battleEffect:{type:"comeback_bonus",threshold:2,value:22,desc:"+22 if losing by 2+"}}},
};
const NFL_UNIQUE_CARDS={
  "Dallas Cowboys":{rarity:"legendary",ability:{name:"America's Team",icon:"⭐",description:"Your highest-power card always goes first in battle.",type:"battle",cooldownHours:48,battleEffect:{type:"first_strike",value:0,desc:"Strongest card always first"}}},
  "New England Patriots":{rarity:"legendary",ability:{name:"Dynasty",icon:"🏆",description:"Win 3+ rounds and earn +25 bonus score.",type:"battle",cooldownHours:72,battleEffect:{type:"dynasty_bonus",threshold:3,value:25,desc:"+25 if 3+ round wins"}}},
  "Green Bay Packers":{rarity:"legendary",ability:{name:"Frozen Tundra",icon:"🧊",description:"All opponent cards lose 12 power for the entire battle.",type:"battle",cooldownHours:48,battleEffect:{type:"debuff_all",value:-12,desc:"All opponents -12 power"}}},
  "Kansas City Chiefs":{rarity:"rare",ability:{name:"Arrowhead Thunder",icon:"⚡",description:"+18 power in Rounds 1 and 2.",type:"battle",cooldownHours:36,battleEffect:{type:"early_boost",rounds:[0,1],value:18,desc:"+18 Rounds 1-2"}}},
  "Baltimore Ravens":{rarity:"rare",ability:{name:"Nevermore",icon:"🦅",description:"Win margin from each round is doubled into the next.",type:"battle",cooldownHours:36,battleEffect:{type:"counter_double",value:0,desc:"Win margin doubled forward"}}},
  "Philadelphia Eagles":{rarity:"rare",ability:{name:"Underdog",icon:"🦅",description:"+25 comeback power when losing by 2+ rounds.",type:"battle",cooldownHours:36,battleEffect:{type:"comeback_bonus",threshold:2,value:25,desc:"+25 if losing by 2+"}}},
  "Pittsburgh Steelers":{rarity:"rare",ability:{name:"Steel Curtain",icon:"🛡️",description:"Blocks ALL opponent ability effects for the entire battle.",type:"battle",cooldownHours:48,battleEffect:{type:"freeze_ability",value:0,desc:"Blocks all opponent abilities"}}},
};

// Transit (BALT/PDX specific unique cards)
const TRANSIT_UNIQUE_CARDS:{[k:string]:any}={
  "Lexington Market":{rarity:"rare",ability:{name:"Market Wisdom",icon:"🛒",description:"Reveals both Zone AND a surprise fact clue about today's station.",type:"hint",cooldownHours:24,battleEffect:{type:"power_bonus",value:7,desc:"+7 power"}}},
  "BWI Airport":{rarity:"rare",ability:{name:"Departure Gate",icon:"✈️",description:"Skip any one failed guess — it doesn't count against you.",type:"boost",cooldownHours:36,battleEffect:{type:"power_bonus",value:6,desc:"+6 power"}}},
  "Washington Park":{rarity:"rare",ability:{name:"Deep Station",icon:"⛏️",description:"Reveals the year the target station opened.",type:"hint",cooldownHours:24,battleEffect:{type:"power_bonus",value:7,desc:"+7 power"}}},
  "Pioneer Square North":{rarity:"rare",ability:{name:"Living Room",icon:"🏛️",description:"Reveals which lines serve today's target station.",type:"hint",cooldownHours:24,battleEffect:{type:"power_bonus",value:6,desc:"+6 power"}}},
};
const LA_UNIQUE_CARDS:{[k:string]:any}={
  "Union Station":{rarity:"legendary",ability:{name:"Grand Terminus",icon:"🏛️",description:"Reveals Zone, Year, AND all connecting lines. Grants +18 battle power.",type:"hint",cooldownHours:36,battleEffect:{type:"power_bonus",value:18,desc:"+18 power"}}},
  "7th St/Metro Center":{rarity:"legendary",ability:{name:"System Hub",icon:"🔄",description:"Your deck is treated as if it has 5 cards for the entire battle — even if it doesn't.",type:"battle",cooldownHours:48,battleEffect:{type:"deck_bonus",value:25,desc:"+25 full deck bonus"}}},
  "Downtown Santa Monica":{rarity:"legendary",ability:{name:"End of the Line",icon:"🌊",description:"Auto-wins Round 5 AND reveals today's zone before guessing.",type:"battle",cooldownHours:72,battleEffect:{type:"auto_win_rounds",rounds:[4],desc:"Auto-wins Round 5"}}},
  "Hollywood/Highland":{rarity:"rare",ability:{name:"Star Power",icon:"⭐",description:"+22 battle power when any opponent card's rarity is Legendary.",type:"battle",cooldownHours:36,battleEffect:{type:"counter_legendary",value:22,desc:"+22 vs Legendary"}}},
  "Downtown Inglewood":{rarity:"rare",ability:{name:"SoFi Surge",icon:"🏟️",description:"Random power bonus +8 to +40 in battle — home field energy.",type:"battle",cooldownHours:24,battleEffect:{type:"random_bonus",min:8,max:40,desc:"Random +8 to +40"}}},
};

const CARD_FALLBACKS={
  transit:{
    common:[
      {name:"Local Knowledge",icon:"📍",description:"Reveals the Zone of today's answer.",cooldownHours:24,battleEffect:{type:"power_bonus",value:3}},
      {name:"Rush Hour Boost",icon:"🚇",description:"Grants one extra guess in today's puzzle.",cooldownHours:24,battleEffect:{type:"power_bonus",value:4}},
      {name:"Transfer Point",icon:"🔄",description:"Reveals which line group the answer belongs to.",cooldownHours:24,battleEffect:{type:"power_bonus",value:4}},
      {name:"End of Line",icon:"🔚",description:"Reveals whether today's station is a terminus or mid-line.",cooldownHours:24,battleEffect:{type:"power_bonus",value:3}},
    ],
    uncommon:[
      {name:"Commuter Intel",icon:"📋",description:"Reveals the Direction clue before guessing.",cooldownHours:24,battleEffect:{type:"power_bonus",value:6}},
      {name:"Platform Knowledge",icon:"🚉",description:"Reveals whether the station is busy, moderate, or quiet.",cooldownHours:24,battleEffect:{type:"power_bonus",value:5}},
      {name:"Express Service",icon:"⚡",description:"Skip one failed guess — it doesn't count against you.",cooldownHours:36,battleEffect:{type:"power_bonus",value:6}},
    ],
    rare:[
      {name:"Signal Priority",icon:"🟢",description:"Reveals Zone AND Year for today's target.",cooldownHours:28,battleEffect:{type:"power_bonus",value:9}},
      {name:"Night Owl",icon:"🦉",description:"Permanently cut this card's cooldown to 12 hours.",cooldownHours:12,battleEffect:{type:"power_bonus",value:8}},
    ],
  },
  geography:{
    common:[
      {name:"State Pride",icon:"🏳️",description:"Reveals the Region of today's target state.",cooldownHours:24,battleEffect:{type:"power_bonus",value:3}},
      {name:"Compass Rose",icon:"🧭",description:"Reveals the Direction clue for today's answer.",cooldownHours:24,battleEffect:{type:"power_bonus",value:4}},
      {name:"Border Crossing",icon:"🛤️",description:"Reveals whether today's state is Coastal, Inland, or Great Lakes.",cooldownHours:24,battleEffect:{type:"power_bonus",value:3}},
    ],
    uncommon:[
      {name:"Regional Expert",icon:"🗺️",description:"Reveals Region AND Coast of today's answer.",cooldownHours:28,battleEffect:{type:"power_bonus",value:6}},
      {name:"Census Data",icon:"📊",description:"Reveals population tier and direction together.",cooldownHours:24,battleEffect:{type:"power_bonus",value:5}},
    ],
    rare:[
      {name:"Cartographer",icon:"🗺️",description:"Reveals Region, Coast, AND population tier.",cooldownHours:32,battleEffect:{type:"power_bonus",value:10}},
    ],
  },
  sports:{
    common:[
      {name:"Home Game",icon:"🏟️",description:"+5 battle power. Home field advantage.",cooldownHours:24,battleEffect:{type:"power_bonus",value:5}},
      {name:"Fan Base",icon:"📣",description:"Reveals the Conference (AFC/NFC) of today's answer.",cooldownHours:24,battleEffect:{type:"power_bonus",value:4}},
      {name:"Division Rival",icon:"⚔️",description:"Reveals the Division of today's target team.",cooldownHours:24,battleEffect:{type:"power_bonus",value:4}},
    ],
    uncommon:[
      {name:"Film Room",icon:"📽️",description:"Reveals Conference AND Division before guessing.",cooldownHours:28,battleEffect:{type:"power_bonus",value:6}},
      {name:"Rivalry Week",icon:"🔥",description:"Extra guess AND reveals the geographic region.",cooldownHours:36,battleEffect:{type:"power_bonus",value:7}},
    ],
    rare:[
      {name:"Championship Pedigree",icon:"🏆",description:"Reveals conference, division, and Super Bowl count.",cooldownHours:32,battleEffect:{type:"power_bonus",value:10}},
    ],
  },
};

const CARD_ROUND_MODS=[
  {id:"blitz",label:"⚡ Blitz",desc:"All powers doubled.",effect:"double_power"},
  {id:"defense",label:"🛡️ Defense",desc:"All abilities locked.",effect:"lock_abilities"},
  {id:"wildcard",label:"🎲 Wildcard",desc:"Coin flip decides winner.",effect:"coin_flip"},
  {id:"rush",label:"🚄 Rush Hour",desc:"Transit cards +20 power.",effect:"transit_boost"},
  {id:"std",label:"Standard",desc:"Normal rules.",effect:"none"},
  {id:"std",label:"Standard",desc:"Normal rules.",effect:"none"},
  {id:"std",label:"Standard",desc:"Normal rules.",effect:"none"},
];

function getCardUnique(name, gameType){
  if(gameType==="dc") return DC_UNIQUE_CARDS[name]||null;
  if(gameType==="states") return STATE_UNIQUE_CARDS[name]||null;
  if(gameType==="nfl") return NFL_UNIQUE_CARDS[name]||null;
  if(gameType==="la") return LA_UNIQUE_CARDS[name]||null;
  if(gameType==="balt"||gameType==="pdx") return TRANSIT_UNIQUE_CARDS[name]||null;
  return null;
}
function rollCardRarity(diff="medium"){
  const r=CARD_DROP[diff]||CARD_DROP.medium, roll=Math.random()*100;
  let c=0;
  for(const[id,w]of Object.entries(r)){c+=w;if(roll<c)return id;}
  return "common";
}
function getCardFallback(gameType, rarityId){
  const pool=(CARD_FALLBACKS[CARD_GAME_TYPE[gameType]]||CARD_FALLBACKS.transit);
  const bucket=pool[rarityId]||pool.common;
  const b=bucket[Math.floor(Math.random()*bucket.length)];
  return{...b,id:b.name.toLowerCase().replace(/\s+/g,"-"),type:"hint"};
}
function calcCardPower(rarityId, unique){
  const base={common:12,uncommon:30,rare:55,legendary:78}[rarityId]||12;
  return Math.min(100,base+Math.floor(Math.random()*18)+(unique?6:0));
}
function generateCard(name, gameType, difficulty="medium", extraMeta={}){
  const u=getCardUnique(name,gameType);
  const rarityId=u?u.rarity:rollCardRarity(difficulty);
  const rarity=CARD_RARITY[rarityId.toUpperCase()]||CARD_RARITY.COMMON;
  const ability=u?{...u.ability,id:u.ability.name.toLowerCase().replace(/\s+/g,"-")}:getCardFallback(gameType,rarityId);
  return{
    id:`${gameType}-${name.toLowerCase().replace(/\s+/g,"-")}-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
    name,gameType,cardType:CARD_GAME_TYPE[gameType]||"transit",rarityId,rarity,ability,
    power:calcCardPower(rarityId,!!u),meta:extraMeta,
    earnedAt:new Date().toISOString(),powerupUsedAt:null,isUnique:!!u,
  };
}
function scoreCardDeck(cards){
  if(!cards?.length)return 0;
  return cards.reduce((s,c)=>s+c.power+({common:0,uncommon:5,rare:15,legendary:30}[c.rarityId]||0),0);
}
function canUseCardPowerup(c){
  if(!c.powerupUsedAt)return true;
  return(Date.now()-new Date(c.powerupUsedAt).getTime())>=(c.ability?.cooldownHours||24)*3600000;
}
function markCardPowerupUsed(c){return{...c,powerupUsedAt:new Date().toISOString()};}
function rarityGrad(id){
  return({common:"linear-gradient(135deg,#1a1a1a,#2a2a2a)",uncommon:"linear-gradient(135deg,#0a1a35,#0d2a55)",rare:"linear-gradient(135deg,#1a0000,#350a0a)",legendary:"linear-gradient(135deg,#1a1400,#332800)"})[id]||"linear-gradient(135deg,#1a1a1a,#2a2a2a)";
}

const wikiImageCache=new Map<string,Promise<string|null>>();
async function getWikiImage(title:string):Promise<string|null>{
  if(!wikiImageCache.has(title)){
    wikiImageCache.set(title,
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
        .then(r=>r.json())
        .then(d=>d?.thumbnail?.source??null)
        .catch(()=>null)
    );
  }
  return wikiImageCache.get(title)!;
}

function CardVisual({card,size="md",onClick,selected,disabled}){
  const r=CARD_RARITY[card.rarityId?.toUpperCase()]||CARD_RARITY.COMMON;
  const gConf=GAMES[card.gameType]||Object.values(GAMES)[0];
  const D={sm:{w:108,h:148,icon:28,nm:8},md:{w:152,h:204,icon:42,nm:10},lg:{w:188,h:252,icon:52,nm:12}}[size]||{w:152,h:204,icon:42,nm:10};
  const[wikiImg,setWikiImg]=useState<string|null>(null);
  const[imgLoaded,setImgLoaded]=useState(false);
  useEffect(()=>{
    if(!card.name)return;
    let cancelled=false;
    getWikiImage(card.name).then(url=>{if(!cancelled)setWikiImg(url||null);});
    return()=>{cancelled=true;};
  },[card.name]);
  return(
    <div onClick={disabled?undefined:onClick} style={{width:D.w,height:D.h,borderRadius:10,flexShrink:0,background:rarityGrad(card.rarityId),border:`1.5px solid ${selected?"#fff":r.color}`,boxShadow:selected?`0 0 0 2px #fff,0 0 20px ${r.glow}`:`0 0 10px ${r.glow}`,cursor:disabled?"default":"pointer",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",transition:"transform .18s,box-shadow .18s",transform:selected?"scale(1.06)":"scale(1)",opacity:disabled?.4:1}}>
      <div style={{height:3,background:r.color,flexShrink:0}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:size==="sm"?"3px 5px":"5px 8px",flexShrink:0}}>
        <span style={{fontSize:size==="sm"?11:14}}>{gConf.emoji}</span>
        <span style={{fontSize:size==="sm"?6:7.5,fontWeight:700,color:r.color,letterSpacing:.5}}>{r.label.toUpperCase()}</span>
      </div>
      <div style={{position:"absolute",top:size==="sm"?16:22,right:size==="sm"?5:8,background:r.color+"33",border:`1px solid ${r.color}55`,borderRadius:6,padding:size==="sm"?"2px 5px":"3px 7px",fontSize:size==="sm"?8:10,fontWeight:700,color:r.color}}>{card.power}</div>
      {/* Wikipedia image or icon fallback */}
      <div style={{flex:1,position:"relative",overflow:"hidden",background:`radial-gradient(ellipse at center,${r.color}15 0%,transparent 70%)`}}>
        {wikiImg&&(
          <img src={wikiImg} alt={card.name}
            onLoad={()=>setImgLoaded(true)}
            onError={()=>setWikiImg(null)}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:imgLoaded?0.82:0,transition:"opacity .35s"}}/>
        )}
        {wikiImg&&imgLoaded&&<div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,transparent 40%,${rarityGrad(card.rarityId).split(",")[1]?.replace(")","")?.trim()||"#1a1a1a"} 100%)`}}/>}
        {(!wikiImg||!imgLoaded)&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:D.icon}}>{card.ability?.icon||"🃏"}</div>}
      </div>
      <div style={{padding:size==="sm"?"3px 5px":"5px 8px",flexShrink:0,background:"rgba(0,0,0,.4)",borderTop:`1px solid ${r.color}33`}}>
        <div style={{fontSize:D.nm,fontWeight:700,color:"#fff",lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.name}</div>
        {size!=="sm"&&<div style={{fontSize:7,color:"rgba(255,255,255,.4)",marginTop:1}}>{gConf.name}</div>}
      </div>
      {size!=="sm"&&card.ability&&(
        <div style={{padding:"3px 8px 5px",flexShrink:0,background:"rgba(0,0,0,.5)"}}>
          <div style={{fontSize:7.5,color:r.color,fontWeight:700,letterSpacing:.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.ability.icon} {card.ability.name}</div>
        </div>
      )}
      {card.isUnique&&size!=="sm"&&<div style={{position:"absolute",top:6,left:8,fontSize:7,color:"#c8a800",fontWeight:700,letterSpacing:.5}}>UNIQUE</div>}
    </div>
  );
}

function PackOpening({card,onDone,isDaily=false}:{card:any,onDone:()=>void,isDaily?:boolean}){
  const[phase,setPhase]=useState(isDaily?"intro":"closed");
  const r=CARD_RARITY[card?.rarityId?.toUpperCase()]||CARD_RARITY.COMMON;
  useEffect(()=>{
    let cancelled=false;
    const timers:ReturnType<typeof setTimeout>[]=[];
    function delay(ms:number){return new Promise<void>(res=>{const id=setTimeout(()=>{if(!cancelled)res();},ms);timers.push(id);});}
    async function go(){
      if(isDaily){
        await delay(2800);if(!cancelled)setPhase("closed");
        await delay(500);if(!cancelled)setPhase("shaking");
      }else{
        await delay(400);if(!cancelled)setPhase("shaking");
      }
      await delay(900);if(!cancelled)setPhase("open");
      await delay(500);if(!cancelled)setPhase("reveal");
    }
    go();
    return()=>{cancelled=true;timers.forEach(clearTimeout);};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,gap:24,fontFamily:"'JetBrains Mono',monospace"}}>
      <style>{`
        @keyframes dailyCardIntroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dailyCardPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes dailyCardFadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-16px)}}
      `}</style>
      {phase==="intro"&&(
        <div style={{textAlign:"center",animation:"dailyCardIntroIn .6s ease both"}}>
          <div style={{fontSize:64,marginBottom:18,animation:"dailyCardPulse 1.8s ease-in-out infinite"}}>🎁</div>
          <div style={{fontSize:13,letterSpacing:4,color:"rgba(255,255,255,.35)",fontWeight:700,marginBottom:10}}>DAILY REWARD</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:10,letterSpacing:.5}}>You earned a free card!</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.9,maxWidth:280,margin:"0 auto"}}>
            Every day you open UrbanIQ, you get a new collectible card — no games required.
          </div>
          <div style={{marginTop:22,fontSize:10,letterSpacing:3,color:"rgba(255,255,255,.18)"}}>OPENING IN A MOMENT...</div>
        </div>
      )}
      {phase!=="intro"&&phase!=="reveal"&&<div style={{width:120,height:160,borderRadius:14,background:"linear-gradient(135deg,#1a1a2e,#16213e)",border:`2px solid ${r.color}`,boxShadow:`0 0 40px ${r.glow}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,animation:phase==="shaking"?"cardShake .18s infinite":"none"}}>🃏</div>}
      {phase==="reveal"&&<div style={{animation:"cardReveal .55s ease both"}}><CardVisual card={card} size="lg"/></div>}
      <div style={{textAlign:"center"}}>
        {phase==="reveal"&&<div style={{textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:700,color:r.color,marginBottom:4}}>{card.name}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:6}}>{r.label} · Power {card.power}{card.isUnique?" · ✦ UNIQUE":""}</div>
          <div style={{fontSize:12,color:r.color,marginBottom:4}}>{card.ability?.icon} {card.ability?.name}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",maxWidth:260,lineHeight:1.7,textAlign:"center",margin:"0 auto 8px"}}>{card.ability?.description}</div>
          {card.ability?.battleEffect?.desc&&<div style={{fontSize:9,color:"rgba(255,255,255,.25)",letterSpacing:.5}}>⚔️ {card.ability.battleEffect.desc}</div>}
        </div>}
        {phase!=="intro"&&phase!=="reveal"&&<div style={{color:"rgba(255,255,255,.5)",fontSize:12,letterSpacing:3,marginTop:8}}>{phase==="shaking"?"OPENING...":"YOU GOT A CARD!"}</div>}
      </div>
      {phase==="reveal"&&<button onClick={onDone} style={{background:"#BF0000",border:"none",borderRadius:10,padding:"12px 32px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:2,fontFamily:"inherit"}}>ADD TO COLLECTION</button>}
    </div>
  );
}

function getOrCreatePlayerId():string{let id=localStorage.getItem("urbaniq_player_id");if(!id){id=Date.now().toString(36)+Math.random().toString(36).slice(2,9);localStorage.setItem("urbaniq_player_id",id);}return id;}

function CardSystemTab({pendingCard,onClearPending,onActivePowerup}:{pendingCard:any,onClearPending:()=>void,onActivePowerup?:(card:any)=>string}){
  const CARD_STORAGE={col:"tgg-card-col",deck:"tgg-card-deck"};
  const[tab,setTab]=useState("collection");
  const[col,setCol]=useState(()=>{try{return JSON.parse(localStorage.getItem(CARD_STORAGE.col)||"[]");}catch{return [];}});
  const[deck,setDeck]=useState(()=>{try{return JSON.parse(localStorage.getItem(CARD_STORAGE.deck)||"[]");}catch{return [];}});
  const[sel,setSel]=useState(null);
  const[showPack,setShowPack]=useState(false);
  const[revealCard,setRevealCard]=useState(null);
  // Local battle
  const[battleResult,setBattleResult]=useState(null);
  const[battling,setBattling]=useState(false);
  // PvP state
  const[battleMode,setBattleMode]=useState<"local"|"pvp">("local");
  const[pvpPhase,setPvpPhase]=useState<"idle"|"submitting"|"waiting"|"resolved"|"error">("idle");
  const[pvpBattleId,setPvpBattleId]=useState<string|null>(null);
  const[pvpResult,setPvpResult]=useState<any>(null);
  const[pvpHistory,setPvpHistory]=useState<any[]>([]);
  const[pvpLb,setPvpLb]=useState<any[]>([]);
  const[pvpErr,setPvpErr]=useState<string|null>(null);
  const[pollTick,setPollTick]=useState(10);
  const[powerupMsg,setPowerupMsg]=useState<string|null>(null);
  const[openGroupKey,setOpenGroupKey]=useState<string|null>(null);
  const[lbLoading,setLbLoading]=useState(false);
  const playerId=React.useMemo(()=>getOrCreatePlayerId(),[]);

  useEffect(()=>{localStorage.setItem(CARD_STORAGE.col,JSON.stringify(col));},[col]);
  useEffect(()=>{localStorage.setItem(CARD_STORAGE.deck,JSON.stringify(deck));},[deck]);
  useEffect(()=>{if(pendingCard){setRevealCard(pendingCard);setShowPack(true);}},[pendingCard]);

  // Poll for battle resolution
  useEffect(()=>{
    if(pvpPhase!=="waiting"||!pvpBattleId)return;
    let t=10;setPollTick(t);
    const iv=setInterval(async()=>{t--;setPollTick(t);if(t<=0){t=10;setPollTick(t);await checkStatus();}},1000);
    return()=>clearInterval(iv);
  },[pvpPhase,pvpBattleId]);

  useEffect(()=>{if(tab==="battle")loadHistory();},[tab]);
  useEffect(()=>{if(tab==="leaderboard"){setLbLoading(true);loadLb().finally(()=>setLbLoading(false));}},[tab]);

  async function loadHistory(){try{const r=await fetch(`/api/battle/history/${playerId}`);if(r.ok){const d=await r.json();if(Array.isArray(d))setPvpHistory(d);}}catch{}}
  async function loadLb(){try{const r=await fetch("/api/battle/leaderboard");if(r.ok){const d=await r.json();if(Array.isArray(d))setPvpLb(d);}}catch{}}
  async function checkStatus(){
    if(!pvpBattleId)return;
    try{const r=await fetch(`/api/battle/status/${pvpBattleId}`);if(!r.ok)return;const d=await r.json();if(d.status==="resolved"){setPvpResult(d);setPvpPhase("resolved");loadHistory();}}catch{}
  }
  async function submitPvP(){
    if(!deck.length){setPvpErr("Add at least 1 card to your deck first");return;}
    setPvpErr(null);setPvpPhase("submitting");
    try{
      const prof=localStorage.getItem("tgg-profile");
      const playerName=prof?(JSON.parse(prof)?.name||"Challenger"):"Challenger";
      const r=await fetch("/api/battle/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId,playerName,deck})});
      if(!r.ok)throw new Error("API error");
      const d=await r.json();
      setPvpBattleId(d.battleId);
      if(d.status==="resolved"){setPvpResult(d.record||d);setPvpPhase("resolved");loadHistory();}
      else setPvpPhase("waiting");
    }catch{setPvpErr("Battle server unavailable. PvP requires the deployed app — use Local Battle for now.");setPvpPhase("error");}
  }

  function packDone(){if(revealCard)setCol(p=>[...p,revealCard]);setShowPack(false);setRevealCard(null);if(onClearPending)onClearPending();}
  function usePowerup(card){
    if(onActivePowerup){
      const result=onActivePowerup(card);
      if(result==="no-game"){setPowerupMsg("Go to the Play tab and start a round, then come back to use this power-up.");return;}
      if(result==="battle"){setPowerupMsg("⚔️ Battle ability — this card's power activates automatically when you include it in your battle deck.");setCol(p=>p.map(c=>c.id===card.id?markCardPowerupUsed(c):c));setSel(null);return;}
    }
    setCol(p=>p.map(c=>c.id===card.id?markCardPowerupUsed(c):c));setSel(null);
  }
  function toggleDeck(card){if(deck.find(c=>c.id===card.id))setDeck(p=>p.filter(c=>c.id!==card.id));else if(deck.length<5)setDeck(p=>[...p,card]);setSel(null);}
  async function runBattle(){
    if(!deck.length)return;
    setBattling(true);
    await new Promise(r=>setTimeout(r,1200));
    const pool=col.filter(c=>!deck.find(d=>d.id===c.id));
    const opp=pool.sort(()=>Math.random()-.5).slice(0,5);
    if(!opp.length){setBattling(false);return;}
    let pW=0,oW=0;
    const rounds=deck.map((pC,i)=>{
      const oC=opp[i];if(!oC)return{winner:"player",pCard:pC,oCard:null};
      const mod=CARD_ROUND_MODS[Math.floor(Math.random()*CARD_ROUND_MODS.length)];
      let ps=pC.power+(Math.random()*12),os=oC.power+(Math.random()*12);
      if(mod.effect==="double_power"){ps*=2;os*=2;}
      if(mod.effect==="coin_flip"){const w=Math.random()>.5?"player":"opponent";if(w==="player")pW++;else oW++;return{winner:w,pCard:pC,oCard:oC,modifier:mod,note:"🎲 Coin flip!"};}
      const pT=pC.cardType,oT=oC.cardType;
      if(CARD_TYPE_ADV[pT]?.beats===oT)ps*=CARD_TYPE_ADV[pT].bonus;
      if(CARD_TYPE_ADV[oT]?.beats===pT)os*=CARD_TYPE_ADV[oT].bonus;
      const be=pC.ability?.battleEffect;
      if(be?.type==="random_bonus")ps+=be.min+Math.random()*(be.max-be.min);
      if(be?.type==="power_bonus")ps+=be.value;
      const w=ps>=os?"player":"opponent";
      if(w==="player")pW++;else oW++;
      return{winner:w,pCard:pC,oCard:oC,pScore:Math.round(ps),oScore:Math.round(os),modifier:mod};
    });
    setBattleResult({winner:pW>=oW?"player":"opponent",playerWins:pW,opponentWins:oW,rounds});
    setBattling(false);
  }

  const CTABS=[{id:"collection",icon:"📦",label:"Cards"},{id:"battle",icon:"⚔️",label:"Battle"},{id:"leaderboard",icon:"🏆",label:"Top 10"}];
  const bg="#f4f5f7",card="#fff",border="rgba(0,0,0,.08)",txt="#111",txt2="rgba(0,0,0,.55)",txt3="rgba(0,0,0,.28)";
  const win="#28b050",lose="#c43030",gold="#c8a800";

  return(
    <div style={{background:bg,minHeight:"100%",fontFamily:"'JetBrains Mono',monospace",color:txt,paddingBottom:60}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`${card}ee`,boxShadow:"0 1px 4px rgba(0,0,0,.06)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>🃏 Card Collection</div>
          <div style={{fontSize:8,color:txt3,letterSpacing:3,marginTop:2}}>{col.length} CARDS · {col.filter(c=>c.rarityId==="legendary").length} LEGENDARY · {col.filter(c=>c.isUnique).length} UNIQUE</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:13,fontWeight:700,color:gold}}>{col.filter(c=>c.rarityId==="legendary").length} ✦</div>
          <div style={{fontSize:7,color:txt3}}>LEGENDARY</div>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${border}`,background:`${card}ee`,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>
        {CTABS.map(t=><div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"11px 4px",textAlign:"center",cursor:"pointer",borderBottom:`2px solid ${tab===t.id?gold:"transparent"}`,transition:"all .15s"}}>
          <div style={{fontSize:16}}>{t.icon}</div>
          <div style={{fontSize:8,color:tab===t.id?gold:txt3,letterSpacing:1,marginTop:2,fontWeight:tab===t.id?700:400}}>{t.label}</div>
        </div>)}
      </div>

      <div style={{padding:"14px 16px"}}>
        {/* ── COLLECTION TAB ── */}
        {tab==="collection"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
              {["legendary","rare","uncommon","common"].map(r=>{
                const rc=CARD_RARITY[r.toUpperCase()]?.color||"#555";
                return<div key={r} style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:700,color:rc,lineHeight:1}}>{col.filter(c=>c.rarityId===r).length}</div>
                  <div style={{fontSize:6.5,color:txt3,letterSpacing:1,marginTop:2,textTransform:"uppercase"}}>{r}</div>
                </div>;
              })}
            </div>
            {col.length===0?(
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:32,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12}}>🃏</div>
                <div style={{fontSize:12,color:txt2,marginBottom:6}}>No cards yet</div>
                <div style={{fontSize:11,color:txt3,lineHeight:1.8}}>Win a daily puzzle round to earn your first card. Pro difficulty gives the best legendary drop rates.</div>
              </div>
            ):(()=>{
              const gameOrder=["pdx","dc","balt","la","nyc","chi","states","nfl"];
              const groups=gameOrder.map(gk=>({key:gk,cards:col.filter((c:any)=>c.gameType===gk)})).filter(g=>g.cards.length>0);
              return<div>{groups.map(g=>{
                const G2=GAMES[g.key]||{emoji:"🎮",name:g.key.toUpperCase()};
                const isOpen=openGroupKey===g.key;
                return<div key={g.key} style={{marginBottom:8}}>
                  <div onClick={()=>setOpenGroupKey(k=>k===g.key?null:g.key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:card,border:`1px solid ${border}`,borderRadius:isOpen?"10px 10px 0 0":10,cursor:"pointer",userSelect:"none" as const}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:16}}>{G2.emoji}</span>
                      <span style={{fontSize:11,fontWeight:700,color:txt}}>{G2.name}</span>
                      <span style={{fontSize:9,color:txt3,background:"rgba(0,0,0,.05)",borderRadius:4,padding:"1px 6px"}}>{g.cards.length}</span>
                    </div>
                    <span style={{fontSize:10,color:txt3,display:"inline-block",transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                  </div>
                  {isOpen&&<div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"10px",border:`1px solid ${border}`,borderTop:"none",borderRadius:"0 0 10px 10px",background:card}}>
                    {g.cards.map((c:any)=>(
                      <div key={c.id} style={{position:"relative"}}>
                        <CardVisual card={c} size="md" onClick={()=>setSel(c)} selected={!!deck.find((d:any)=>d.id===c.id)}/>
                        {!canUseCardPowerup(c)&&<div style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.7)",borderRadius:4,padding:"2px 5px",fontSize:8,color:"#ff9900"}}>CD</div>}
                      </div>
                    ))}
                  </div>}
                </div>;
              })}</div>;
            })()}
          </div>
        )}

        {/* ── BATTLE TAB ── */}
        {tab==="battle"&&(
          <div>
            {/* Mode toggle */}
            <div style={{display:"flex",gap:6,marginBottom:14,background:card,border:`1px solid ${border}`,borderRadius:10,padding:4}}>
              {(["local","pvp"] as const).map(m=>(
                <button key={m} onClick={()=>{setBattleMode(m);setBattleResult(null);setPvpPhase("idle");setPvpErr(null);}} style={{flex:1,background:battleMode===m?"#0a0a0a":"transparent",color:battleMode===m?"#fff":txt3,border:"none",borderRadius:7,padding:"8px",fontSize:10,fontWeight:700,letterSpacing:2,cursor:"pointer",transition:"all .18s"}}>
                  {m==="local"?"🤖 LOCAL":"🌐 PvP"}
                </button>
              ))}
            </div>

            {/* Deck builder (shared) */}
            <div style={{background:`${card}ee`,border:`1px solid ${border}`,borderRadius:12,padding:16,marginBottom:14,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontSize:8,color:txt3,letterSpacing:3,marginBottom:2}}>BATTLE DECK</div>
                  <div style={{fontSize:11,color:txt2}}>{deck.length}/5 cards · Power {scoreCardDeck(deck)}</div>
                </div>
                {battleMode==="local"
                  ?<button onClick={runBattle} disabled={!deck.length||battling} style={{background:deck.length?lose:"rgba(0,0,0,.06)",border:"none",borderRadius:8,padding:"10px 16px",color:deck.length?"#fff":txt3,fontSize:10,fontWeight:700,cursor:deck.length?"pointer":"not-allowed",fontFamily:"inherit",letterSpacing:1}}>{battling?"BATTLING...":"⚔️ BATTLE"}</button>
                  :<button onClick={submitPvP} disabled={pvpPhase==="submitting"||pvpPhase==="waiting"} style={{background:deck.length?"#0a3a8f":"rgba(0,0,0,.06)",border:"none",borderRadius:8,padding:"10px 16px",color:deck.length?"#fff":txt3,fontSize:10,fontWeight:700,cursor:deck.length?"pointer":"not-allowed",fontFamily:"inherit",letterSpacing:1}}>{pvpPhase==="submitting"?"SUBMITTING...":pvpPhase==="waiting"?`WAITING ${pollTick}s...`:"🌐 FIND OPPONENT"}</button>
                }
              </div>
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                {deck.map(c=><CardVisual key={c.id} card={c} size="sm" onClick={()=>setDeck(p=>p.filter(x=>x.id!==c.id))}/>)}
                {Array.from({length:5-deck.length}).map((_,i)=><div key={i} style={{width:90,height:120,borderRadius:10,flexShrink:0,border:`1.5px dashed ${border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:txt3}}>+</div>)}
              </div>
            </div>

            {/* PvP error */}
            {battleMode==="pvp"&&pvpErr&&(
              <div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:11,color:"#7a4f00",lineHeight:1.6}}>
                ⚠️ {pvpErr}
                <button onClick={()=>{setPvpErr(null);setPvpPhase("idle");}} style={{display:"block",marginTop:8,background:"transparent",border:`1px solid #ffc107`,borderRadius:6,padding:"5px 12px",fontSize:10,color:"#7a4f00",cursor:"pointer",fontFamily:"inherit"}}>DISMISS</button>
              </div>
            )}

            {/* PvP waiting screen */}
            {battleMode==="pvp"&&pvpPhase==="waiting"&&(
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:24,textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:30,marginBottom:10,animation:"spin 2s linear infinite",display:"inline-block"}}>⏳</div>
                <div style={{fontSize:13,fontWeight:700,color:txt,marginBottom:4}}>Waiting for an opponent...</div>
                <div style={{fontSize:10,color:txt3,marginBottom:16}}>Checking again in <strong>{pollTick}s</strong> · Your deck is in the matchmaking queue</div>
                <button onClick={()=>{setPvpPhase("idle");setPvpBattleId(null);}} style={{background:"rgba(0,0,0,.05)",border:`1px solid ${border}`,borderRadius:8,padding:"9px 20px",fontSize:10,color:txt2,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:1}}>CANCEL</button>
              </div>
            )}

            {/* Local battle result */}
            {battleMode==="local"&&battling&&(
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:24,textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:30,marginBottom:10}}>⚔️</div>
                <div style={{fontSize:12,color:txt2,letterSpacing:2}}>BATTLE IN PROGRESS...</div>
              </div>
            )}
            {battleMode==="local"&&battleResult&&(
              <div style={{background:card,border:`1px solid ${battleResult.winner==="player"?win:lose}`,borderRadius:12,padding:20,marginBottom:14}}>
                <div style={{textAlign:"center",marginBottom:14}}>
                  <div style={{fontSize:32,marginBottom:6}}>{battleResult.winner==="player"?"🏆":"💀"}</div>
                  <div style={{fontSize:18,fontWeight:700,color:battleResult.winner==="player"?win:lose,marginBottom:4}}>{battleResult.winner==="player"?"VICTORY!":"DEFEATED"}</div>
                  <div style={{fontSize:11,color:txt2}}>{battleResult.playerWins} rounds won vs {battleResult.opponentWins}</div>
                </div>
                {battleResult.rounds.map((r,i)=>(
                  <div key={i} style={{background:"#f8f8fc",borderRadius:8,padding:"8px 12px",marginBottom:5,border:`1px solid ${border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:8,color:txt3,width:16,flexShrink:0}}>R{i+1}</div>
                      <div style={{flex:1,fontSize:10,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.pCard?.name||"—"}</div>
                      <div style={{fontSize:10,color:r.winner==="player"?win:lose,fontWeight:700,flexShrink:0}}>{r.winner==="player"?"WIN":"LOSS"}</div>
                      <div style={{flex:1,fontSize:10,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.oCard?.name||"—"}</div>
                    </div>
                    {r.modifier?.effect!=="none"&&<div style={{fontSize:8,color:"#7B2FBE",marginTop:3}}>{r.modifier.label}</div>}
                  </div>
                ))}
                <button onClick={()=>setBattleResult(null)} style={{width:"100%",background:"rgba(0,0,0,.05)",border:`1px solid ${border}`,borderRadius:10,padding:"10px",color:txt2,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,marginTop:10}}>BATTLE AGAIN</button>
              </div>
            )}

            {/* PvP result */}
            {battleMode==="pvp"&&pvpPhase==="resolved"&&pvpResult&&(()=>{
              const isWin=pvpResult.result==="win",isDraw=pvpResult.result==="draw";
              const col2=isWin?win:isDraw?"#c8a800":lose;
              return(
                <div style={{background:card,border:`1px solid ${col2}`,borderRadius:12,padding:20,marginBottom:14}}>
                  <div style={{textAlign:"center",marginBottom:14}}>
                    <div style={{fontSize:32,marginBottom:6}}>{isWin?"🏆":isDraw?"🤝":"💀"}</div>
                    <div style={{fontSize:18,fontWeight:700,color:col2,marginBottom:4}}>{isWin?"VICTORY!":isDraw?"DRAW":"DEFEATED"}</div>
                    <div style={{fontSize:10,color:txt3,marginBottom:2}}>vs <strong style={{color:txt}}>{pvpResult.opponentName||"Opponent"}</strong></div>
                    <div style={{fontSize:11,color:txt2}}>{pvpResult.winsA} — {pvpResult.winsB} rounds</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:4,alignItems:"center",marginBottom:10,fontSize:9,color:txt3,fontWeight:700,letterSpacing:1,textAlign:"center"}}>
                    <div>YOU</div><div style={{opacity:.4}}>vs</div><div>OPPONENT</div>
                  </div>
                  {(pvpResult.rounds||[]).map((r:any,i:number)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:4,alignItems:"center",marginBottom:5,background:"#f8f8fc",borderRadius:8,padding:"7px 10px",border:`1px solid ${border}`}}>
                      <div style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:r.winner==="a"?700:400,color:r.winner==="a"?win:txt2}}>{r.nameA||"—"}<span style={{fontSize:8,color:txt3}}> {r.sA}</span></div>
                      <div style={{fontSize:8,color:txt3,textAlign:"center",fontWeight:700}}>{r.winner==="a"?"←":"→"}</div>
                      <div style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:r.winner==="b"?700:400,color:r.winner==="b"?lose:txt2,textAlign:"right"}}><span style={{fontSize:8,color:txt3}}>{r.sB} </span>{r.nameB||"—"}</div>
                    </div>
                  ))}
                  <button onClick={()=>{setPvpPhase("idle");setPvpResult(null);setPvpBattleId(null);}} style={{width:"100%",background:"rgba(0,0,0,.05)",border:`1px solid ${border}`,borderRadius:10,padding:"10px",color:txt2,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,marginTop:10}}>BATTLE AGAIN</button>
                </div>
              );
            })()}

            {/* PvP history */}
            {battleMode==="pvp"&&pvpPhase!=="waiting"&&pvpHistory.length>0&&(
              <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:14,marginBottom:14}}>
                <div style={{fontSize:8,color:txt3,letterSpacing:3,marginBottom:10}}>RECENT PvP BATTLES</div>
                {pvpHistory.slice(0,5).map((h:any,i:number)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<Math.min(pvpHistory.length,5)-1?`1px solid ${border}`:"none"}}>
                    <div style={{fontSize:14,flexShrink:0}}>{h.result==="win"?"🏆":h.result==="draw"?"🤝":"💀"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:h.result==="win"?win:h.result==="draw"?"#c8a800":lose}}>{h.result?.toUpperCase()}</div>
                      <div style={{fontSize:9,color:txt3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>vs {h.opponentName||"Challenger"}</div>
                    </div>
                    <div style={{fontSize:9,color:txt3,flexShrink:0}}>{h.winsA}–{h.winsB}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Collection picker */}
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:14}}>
              <div style={{fontSize:8,color:txt3,letterSpacing:3,marginBottom:4}}>YOUR COLLECTION</div>
              <div style={{fontSize:9,color:txt3,marginBottom:12}}>⚡ Transit beats 🗺️ Geography · 🗺️ Geography beats 🏈 Sports · 🏈 Sports beats ⚡ Transit</div>
              {col.length===0
                ?<div style={{textAlign:"center",padding:"16px 0",color:txt3,fontSize:11}}>Earn cards by winning rounds first.</div>
                :<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{col.map(c=><CardVisual key={c.id} card={c} size="sm" selected={!!deck.find(x=>x.id===c.id)} disabled={!deck.find(x=>x.id===c.id)&&deck.length>=5} onClick={()=>{if(deck.find(x=>x.id===c.id))setDeck(p=>p.filter(x=>x.id!==c.id));else if(deck.length<5)setDeck(p=>[...p,c]);}}/>)}</div>
              }
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab==="leaderboard"&&(
          <div>
            <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontSize:8,color:txt3,letterSpacing:3,marginBottom:4}}>🏆 PvP BATTLE LEADERBOARD</div>
              <div style={{fontSize:10,color:txt3,marginBottom:16,lineHeight:1.6}}>Top players by PvP wins. Only available on the deployed app — battles are server-side.</div>
              {lbLoading?(
                <div style={{textAlign:"center",padding:"24px 0",color:txt3,fontSize:12}}>Loading...</div>
              ):pvpLb.length===0?(
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <div style={{fontSize:28,marginBottom:8}}>🏆</div>
                  <div style={{fontSize:11,color:txt2,marginBottom:4}}>No battles yet</div>
                  <div style={{fontSize:10,color:txt3}}>Be the first to win a PvP battle!</div>
                </div>
              ):(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"24px 1fr 36px 36px 40px",gap:6,padding:"6px 8px",marginBottom:4}}>
                    {["#","PLAYER","W","L","WIN%"].map(h=><div key={h} style={{fontSize:8,color:txt3,letterSpacing:1,fontWeight:700,textAlign:h==="#"||h==="PLAYER"?"left":"center"}}>{h}</div>)}
                  </div>
                  {pvpLb.map((p:any,i:number)=>{
                    const pct=p.games>0?Math.round((p.wins/p.games)*100):0;
                    const medals=["🥇","🥈","🥉"];
                    return(
                      <div key={p.playerId||i} style={{display:"grid",gridTemplateColumns:"24px 1fr 36px 36px 40px",gap:6,padding:"10px 8px",background:p.playerId===playerId?"rgba(200,168,0,.07)":"transparent",border:`1px solid ${p.playerId===playerId?gold:border}`,borderRadius:8,marginBottom:4,alignItems:"center"}}>
                        <div style={{fontSize:14}}>{medals[i]||`${i+1}`}</div>
                        <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:p.playerId===playerId?gold:txt}}>{p.playerName||"Challenger"}{p.playerId===playerId?" ★":""}</div>
                        <div style={{fontSize:12,fontWeight:700,color:win,textAlign:"center"}}>{p.wins}</div>
                        <div style={{fontSize:12,color:lose,textAlign:"center"}}>{p.losses}</div>
                        <div style={{fontSize:10,color:txt2,textAlign:"center",fontWeight:700}}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={()=>{setLbLoading(true);loadLb().finally(()=>setLbLoading(false));}} style={{width:"100%",marginTop:12,background:"transparent",border:`1px solid ${border}`,borderRadius:8,padding:"9px",color:txt3,fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:700,letterSpacing:1}}>↻ REFRESH</button>
            </div>
          </div>
        )}
      </div>

      {sel&&(
        <div onClick={()=>{setSel(null);setPowerupMsg(null);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:`${card}f0`,border:`1.5px solid ${CARD_RARITY[sel.rarityId?.toUpperCase()]?.color||"#555"}`,borderRadius:16,width:"100%",maxWidth:340,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <div style={{flex:1,overflowY:"auto",padding:24,paddingBottom:12}}>
              <div style={{display:"flex",gap:14,marginBottom:18}}>
                <CardVisual card={sel} size="md"/>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:3,lineHeight:1.3}}>{sel.name}</div>
                  <div style={{fontSize:10,color:txt3,marginBottom:8}}>{GAMES[sel.gameType]?.emoji} {GAMES[sel.gameType]?.name}</div>
                  <div style={{background:`${CARD_RARITY[sel.rarityId?.toUpperCase()]?.color}20`,border:`1px solid ${CARD_RARITY[sel.rarityId?.toUpperCase()]?.color}40`,color:CARD_RARITY[sel.rarityId?.toUpperCase()]?.color,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700,display:"inline-block"}}>{sel.rarityId?.toUpperCase()}{sel.isUnique?" · UNIQUE":""}</div>
                </div>
              </div>
              <div style={{background:"#f8f8fc",border:`1px solid ${border}`,borderRadius:10,padding:14,marginBottom:powerupMsg?10:0}}>
                <div style={{fontSize:13,fontWeight:700,color:CARD_RARITY[sel.rarityId?.toUpperCase()]?.color,marginBottom:5}}>{sel.ability?.icon} {sel.ability?.name}</div>
                <div style={{fontSize:11,color:txt2,lineHeight:1.7,marginBottom:8}}>{sel.ability?.description}</div>
                {sel.ability?.battleEffect?.desc&&<div style={{fontSize:9,color:txt3,fontWeight:700}}>⚔️ BATTLE: {sel.ability.battleEffect.desc}</div>}
                <div style={{fontSize:9,color:txt3,marginTop:6}}>Cooldown: {sel.ability?.cooldownHours}h{!canUseCardPowerup(sel)?<span style={{color:lose}}> · On cooldown</span>:""}</div>
              </div>
              {powerupMsg&&<div style={{background:"rgba(40,120,200,.07)",border:"1px solid rgba(40,120,200,.2)",borderRadius:8,padding:"10px 12px",fontSize:11,color:"#1a4f8a",lineHeight:1.6,marginTop:0}}>{powerupMsg}</div>}
            </div>
            <div style={{padding:"12px 24px 20px",display:"flex",flexDirection:"column",gap:8,borderTop:`1px solid ${border}`,flexShrink:0}}>
              <button onClick={()=>{if(canUseCardPowerup(sel))usePowerup(sel);}} disabled={!canUseCardPowerup(sel)} style={{background:canUseCardPowerup(sel)?CARD_RARITY[sel.rarityId?.toUpperCase()]?.color:"rgba(0,0,0,.06)",border:`1px solid ${canUseCardPowerup(sel)?CARD_RARITY[sel.rarityId?.toUpperCase()]?.color:border}`,borderRadius:10,padding:"11px",color:canUseCardPowerup(sel)?"#fff":txt3,fontSize:11,fontWeight:700,cursor:canUseCardPowerup(sel)?"pointer":"not-allowed",fontFamily:"inherit",letterSpacing:1}}>
                {canUseCardPowerup(sel)?`${sel.ability?.icon} USE POWER-UP`:"⏳ ON COOLDOWN"}
              </button>
              <button onClick={()=>toggleDeck(sel)} style={{background:deck.find(c=>c.id===sel.id)?"rgba(196,48,48,.08)":"rgba(40,176,80,.08)",border:`1px solid ${deck.find(c=>c.id===sel.id)?lose:win}`,borderRadius:10,padding:"11px",color:deck.find(c=>c.id===sel.id)?lose:win,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>
                {deck.find(c=>c.id===sel.id)?"− REMOVE FROM DECK":"+ ADD TO BATTLE DECK"}
              </button>
              <button onClick={()=>{setSel(null);setPowerupMsg(null);}} style={{background:"transparent",border:`1px solid ${border}`,borderRadius:10,padding:"11px",color:txt3,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
      {showPack&&revealCard&&<PackOpening card={revealCard} onDone={packDone}/>}
    </div>
  );
}


// ── LINE COLORS ───────────────────────────────────────────────────────────────
const PDX_LINES:{[k:string]:{bg:string,text:string}}={Blue:{bg:"#0060A9",text:"#fff"},Red:{bg:"#D02B27",text:"#fff"},Green:{bg:"#028A48",text:"#fff"},Yellow:{bg:"#FFC72C",text:"#111"},Orange:{bg:"#D35B2C",text:"#fff"}};
const DC_LINES:{[k:string]:{bg:string,text:string}}={Red:{bg:"#BF0000",text:"#fff"},Orange:{bg:"#ED8B00",text:"#fff"},Silver:{bg:"#919D9D",text:"#fff"},Blue:{bg:"#009CDE",text:"#fff"},Yellow:{bg:"#FFD100",text:"#111"},Green:{bg:"#00B140",text:"#fff"}};
const BALT_LINES:{[k:string]:{bg:string,text:string}}={Metro:{bg:"#003087",text:"#fff"},"Light Rail":{bg:"#F0A500",text:"#000"}};
const LA_LINES:{[k:string]:{bg:string,text:string}}={A:{bg:"#0072bc",text:"#fff"},B:{bg:"#e3131b",text:"#fff"},C:{bg:"#58a738",text:"#fff"},D:{bg:"#a05da5",text:"#fff"},E:{bg:"#f7b618",text:"#111"},K:{bg:"#e96bb0",text:"#fff"}};
const NYC_LINES:{[k:string]:{bg:string,text:string}}={"1":{bg:"#EE352E",text:"#fff"},"2":{bg:"#EE352E",text:"#fff"},"3":{bg:"#EE352E",text:"#fff"},"4":{bg:"#00933C",text:"#fff"},"5":{bg:"#00933C",text:"#fff"},"6":{bg:"#00933C",text:"#fff"},"7":{bg:"#B933AD",text:"#fff"},"A":{bg:"#0039A6",text:"#fff"},"C":{bg:"#0039A6",text:"#fff"},"E":{bg:"#0039A6",text:"#fff"},"B":{bg:"#FF6319",text:"#fff"},"D":{bg:"#FF6319",text:"#fff"},"F":{bg:"#FF6319",text:"#fff"},"M":{bg:"#FF6319",text:"#fff"},"G":{bg:"#6CBE45",text:"#000"},"J":{bg:"#996633",text:"#fff"},"Z":{bg:"#996633",text:"#fff"},"L":{bg:"#A7A9AC",text:"#000"},"N":{bg:"#FCCC0A",text:"#000"},"Q":{bg:"#FCCC0A",text:"#000"},"R":{bg:"#FCCC0A",text:"#000"},"W":{bg:"#FCCC0A",text:"#000"},"S":{bg:"#808183",text:"#fff"}};
const CHI_LINES:{[k:string]:{bg:string,text:string}}={Red:{bg:"#C60C30",text:"#fff"},Blue:{bg:"#00A1DE",text:"#fff"},Brown:{bg:"#62361B",text:"#fff"},Green:{bg:"#009B3A",text:"#fff"},Orange:{bg:"#F9461C",text:"#fff"},Pink:{bg:"#E27EA6",text:"#000"},Purple:{bg:"#522398",text:"#fff"},Yellow:{bg:"#F9E300",text:"#000"}};

// ── ZONE DATA ─────────────────────────────────────────────────────────────────
const PDX_ZONE_DIST:{[k:string]:number}={"Downtown Portland":0,"Lloyd District":1,"North Portland":1,"SW Portland":1,"Inner East":1,"NE Portland":2,"SE Portland":2,"Airport":3,"East Portland":3,"Beaverton":3,"Milwaukie":3,"Gresham":4,"Hillsboro":4,"Clackamas":4};
const PDX_ZONE_COORDS:{[k:string]:[number,number]}={"Downtown Portland":[0,0],"Lloyd District":[2,0],"North Portland":[0,3],"SW Portland":[-1,-1],"Inner East":[2,-1],"NE Portland":[3,2],"SE Portland":[2,-3],"Airport":[4,2],"East Portland":[4,0],"Beaverton":[-4,0],"Milwaukie":[1,-4],"Gresham":[6,0],"Hillsboro":[-6,0],"Clackamas":[3,-5]};
const PDX_ADJ:{[k:string]:string[]}={"Downtown Portland":["Lloyd District","North Portland","SW Portland","Inner East","Beaverton"],"Lloyd District":["Downtown Portland","NE Portland","Inner East","Airport"],"North Portland":["Downtown Portland","NE Portland"],"SW Portland":["Downtown Portland","Beaverton","Milwaukie"],"Inner East":["Downtown Portland","Lloyd District","SE Portland"],"NE Portland":["Lloyd District","North Portland","East Portland","Airport"],"SE Portland":["Inner East","Milwaukie","Clackamas"],"Airport":["NE Portland","East Portland"],"East Portland":["NE Portland","Airport","Gresham"],"Beaverton":["Downtown Portland","SW Portland","Hillsboro"],"Milwaukie":["SW Portland","SE Portland"],"Gresham":["East Portland"],"Hillsboro":["Beaverton"],"Clackamas":["SE Portland"]};
const DC_ZONE_DIST:{[k:string]:number}={"Downtown DC":0,"Penn Quarter/SW":0,"Capitol Hill":1,"NW DC":2,"Columbia Heights":2,"NE DC":2,"SE DC":2,"Arlington VA":2,"Alexandria VA":2,"Montgomery County MD":3,"Prince George's County MD":3,"Fairfax VA":4,"Tysons/Dulles VA":5};
const DC_ZONE_COORDS:{[k:string]:[number,number]}={"Downtown DC":[0,0],"Penn Quarter/SW":[-1,-1],"Capitol Hill":[2,0],"NW DC":[-3,3],"Columbia Heights":[-1,3],"NE DC":[2,3],"SE DC":[2,-3],"Arlington VA":[-3,-2],"Alexandria VA":[-2,-4],"Montgomery County MD":[-2,6],"Prince George's County MD":[5,3],"Fairfax VA":[-7,-1],"Tysons/Dulles VA":[-9,0]};
const DC_ADJ:{[k:string]:string[]}={"Downtown DC":["Penn Quarter/SW","Capitol Hill","NW DC","Columbia Heights","Arlington VA"],"Penn Quarter/SW":["Downtown DC","Capitol Hill","SE DC","Arlington VA","Alexandria VA"],"Capitol Hill":["Downtown DC","Penn Quarter/SW","NE DC","SE DC","Prince George's County MD"],"NW DC":["Downtown DC","Columbia Heights","Montgomery County MD"],"Columbia Heights":["NW DC","Downtown DC","NE DC"],"NE DC":["Columbia Heights","Capitol Hill","Prince George's County MD","Montgomery County MD"],"SE DC":["Penn Quarter/SW","Capitol Hill","Prince George's County MD","Alexandria VA"],"Arlington VA":["Downtown DC","Penn Quarter/SW","Alexandria VA","Fairfax VA","Tysons/Dulles VA"],"Alexandria VA":["Arlington VA","Fairfax VA","Penn Quarter/SW","SE DC"],"Montgomery County MD":["NW DC","NE DC"],"Prince George's County MD":["Capitol Hill","NE DC","SE DC"],"Fairfax VA":["Arlington VA","Alexandria VA"],"Tysons/Dulles VA":["Fairfax VA","Arlington VA"]};
const REGION_DIST:{[k:string]:number}={"Northeast":0,"Mid-Atlantic":1,"Southeast":2,"Midwest":2,"Southwest":3,"Mountain West":3,"Pacific":4};
const REGION_COORDS:{[k:string]:[number,number]}={"Northeast":[4,4],"Mid-Atlantic":[4,3],"Southeast":[3,1],"Midwest":[2,3],"Southwest":[1,1],"Mountain West":[0,2],"Pacific":[-1,2]};
const REGION_ADJ:{[k:string]:string[]}={"Northeast":["Mid-Atlantic","Midwest"],"Mid-Atlantic":["Northeast","Southeast","Midwest"],"Southeast":["Mid-Atlantic","Midwest","Southwest"],"Midwest":["Northeast","Mid-Atlantic","Southeast","Southwest","Mountain West"],"Southwest":["Southeast","Midwest","Mountain West"],"Mountain West":["Midwest","Southwest","Pacific"],"Pacific":["Mountain West"]};
const COAST_ADJ:{[k:string]:string[]}={"Atlantic":["Gulf"],"Gulf":["Atlantic"],"Pacific":[],"Great Lakes":["Landlocked"],"Landlocked":["Great Lakes"]};

// ── BALTIMORE MTA ZONE DATA ────────────────────────────────────────────────────
const BALT_ZONE_DIST:{[k:string]:number}={"Downtown":0,"Midtown":1,"North Baltimore":2,"Northwest Baltimore":2,"South Baltimore":2,"East Baltimore":2,"Baltimore County N":3,"BWI Corridor":3};
const BALT_ZONE_COORDS:{[k:string]:[number,number]}={"Downtown":[0,0],"Midtown":[0,1],"North Baltimore":[0,2],"Northwest Baltimore":[-1,2],"South Baltimore":[0,-2],"East Baltimore":[2,1],"Baltimore County N":[0,4],"BWI Corridor":[-1,-3]};
const BALT_ADJ:{[k:string]:string[]}={"Downtown":["Midtown","South Baltimore","East Baltimore"],"Midtown":["Downtown","North Baltimore","Northwest Baltimore"],"North Baltimore":["Midtown","Northwest Baltimore","Baltimore County N","East Baltimore"],"Northwest Baltimore":["North Baltimore","Midtown","Baltimore County N"],"South Baltimore":["Downtown","BWI Corridor"],"East Baltimore":["Downtown","North Baltimore"],"Baltimore County N":["North Baltimore","Northwest Baltimore"],"BWI Corridor":["South Baltimore","Downtown"]};

const LA_ZONE_DIST:{[k:string]:number}={"Downtown LA":0,"Mid-Wilshire":1,"Hollywood":2,"East LA":2,"South LA":2,"North Hollywood":3,"Inglewood/Crenshaw":3,"Pasadena/SGV":3,"Long Beach":4,"South Bay/LAX":4,"West LA/Santa Monica":4,"Pomona/Azusa":5};
const LA_ZONE_COORDS:{[k:string]:[number,number]}={"Downtown LA":[0,0],"Mid-Wilshire":[-2,1],"Hollywood":[0,3],"East LA":[3,0],"South LA":[0,-2],"North Hollywood":[-1,4],"Inglewood/Crenshaw":[-1,-3],"Pasadena/SGV":[5,2],"Long Beach":[2,-5],"South Bay/LAX":[-2,-4],"West LA/Santa Monica":[-5,0],"Pomona/Azusa":[8,2]};
const LA_ADJ:{[k:string]:string[]}={"Downtown LA":["Mid-Wilshire","Hollywood","East LA","South LA"],"Mid-Wilshire":["Downtown LA","Hollywood","West LA/Santa Monica","Inglewood/Crenshaw"],"Hollywood":["Downtown LA","Mid-Wilshire","North Hollywood"],"East LA":["Downtown LA","Pasadena/SGV","South LA"],"South LA":["Downtown LA","East LA","Inglewood/Crenshaw","Long Beach"],"North Hollywood":["Hollywood"],"Inglewood/Crenshaw":["Mid-Wilshire","South LA","West LA/Santa Monica","South Bay/LAX"],"Pasadena/SGV":["East LA","Pomona/Azusa"],"Long Beach":["South LA","South Bay/LAX"],"South Bay/LAX":["Inglewood/Crenshaw","Long Beach"],"West LA/Santa Monica":["Mid-Wilshire","Inglewood/Crenshaw"],"Pomona/Azusa":["Pasadena/SGV"]};

const NYC_ZONE_DIST:{[k:string]:number}={"Manhattan":0,"Brooklyn":1,"Queens":1,"Bronx":1};
const NYC_ZONE_COORDS:{[k:string]:[number,number]}={"Manhattan":[0,0],"Brooklyn":[1,-2],"Queens":[2,1],"Bronx":[0,3]};
const NYC_ADJ:{[k:string]:string[]}={"Manhattan":["Brooklyn","Queens","Bronx"],"Brooklyn":["Manhattan","Queens"],"Queens":["Manhattan","Brooklyn","Bronx"],"Bronx":["Manhattan","Queens"]};

const CHI_ZONE_DIST:{[k:string]:number}={"Loop":0,"Near North":1,"Near West":1,"South Loop":1,"North":1,"Northwest":2,"West":2,"Southwest":2,"South":2,"North Shore":3};
const CHI_ZONE_COORDS:{[k:string]:[number,number]}={"Loop":[0,0],"Near North":[0,1],"Near West":[-1,0],"South Loop":[0,-1],"North":[0,3],"Northwest":[-2,2],"West":[-3,0],"Southwest":[-1,-2],"South":[0,-3],"North Shore":[0,5]};
const CHI_ADJ:{[k:string]:string[]}={"Loop":["Near North","Near West","South Loop","North","Northwest","West","Southwest","South"],"Near North":["Loop","North","Northwest"],"Near West":["Loop","West","Northwest","Southwest"],"South Loop":["Loop","South","Southwest"],"North":["Loop","Near North","Northwest","North Shore"],"Northwest":["Loop","Near North","Near West","North","West"],"West":["Loop","Near West","Northwest","Southwest"],"Southwest":["Loop","Near West","West","South","South Loop"],"South":["Loop","South Loop","Southwest"],"North Shore":["North"]};

// ── DIRECTION HELPERS ─────────────────────────────────────────────────────────
function dirFromCoords(fx:number,fy:number,tx:number,ty:number,fd:number,td:number){
  if(td<fd)return{label:"→ Closer In",sub:"Toward center"};
  if(td>fd)return{label:"← Further Out",sub:"Away from center"};
  const a=Math.atan2(ty-fy,tx-fx)*180/Math.PI;
  if(a>45&&a<=135)return{label:"↑ Go North",sub:""};
  if(a>-135&&a<=-45)return{label:"↓ Go South",sub:""};
  if(a>-45&&a<=45)return{label:"→ Go East",sub:""};
  return{label:"← Go West",sub:""};
}
function getPDXDir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=PDX_ZONE_DIST[f]??2,td=PDX_ZONE_DIST[t]??2;
  const[fx,fy]=PDX_ZONE_COORDS[f]||[0,0];const[tx,ty]=PDX_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ City Center",sub:"Toward downtown"};
  if(r.label==="← Further Out")return{label:"← Away from City",sub:"Further out"};
  if(r.label==="↑ Go North")return{label:"↑ Go North",sub:"Toward Expo"};
  if(r.label==="↓ Go South")return{label:"↓ Go South",sub:"Toward Milwaukie"};
  if(r.label==="→ Go East")return{label:"→ Go East",sub:"Toward Gresham"};
  return{label:"← Go West",sub:"Toward Hillsboro"};
}
function getDCDir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=DC_ZONE_DIST[f]??2,td=DC_ZONE_DIST[t]??2;
  const[fx,fy]=DC_ZONE_COORDS[f]||[0,0];const[tx,ty]=DC_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward the Mall",sub:"Closer to DC"};
  if(r.label==="← Further Out")return{label:"← Away from DC",sub:"Further out"};
  if(r.label==="↑ Go North")return{label:"↑ Toward Maryland",sub:""};
  if(r.label==="↓ Go South")return{label:"↓ Toward Virginia",sub:""};
  if(r.label==="→ Go East")return{label:"→ Toward PG County",sub:""};
  return{label:"← Toward Dulles",sub:""};
}
function getBALTDir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=BALT_ZONE_DIST[f]??2,td=BALT_ZONE_DIST[t]??2;
  const[fx,fy]=BALT_ZONE_COORDS[f]||[0,0];const[tx,ty]=BALT_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward Downtown",sub:"Closer to Inner Harbor"};
  if(r.label==="← Further Out")return{label:"← Away from Downtown",sub:"Further out"};
  if(r.label==="↑ Go North")return{label:"↑ Go North",sub:"Toward Hunt Valley"};
  if(r.label==="↓ Go South")return{label:"↓ Go South",sub:"Toward BWI/Glen Burnie"};
  if(r.label==="→ Go East")return{label:"→ Go East",sub:"Toward Hopkins/East"};
  return{label:"← Go West",sub:"Toward Owings Mills"};
}
function getLADir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=LA_ZONE_DIST[f]??2,td=LA_ZONE_DIST[t]??2;
  const[fx,fy]=LA_ZONE_COORDS[f]||[0,0];const[tx,ty]=LA_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward Downtown LA",sub:"Closer to city center"};
  if(r.label==="← Further Out")return{label:"← Away from Downtown",sub:"Further out"};
  if(r.label==="↑ Go North")return{label:"↑ Go North",sub:"Toward Hollywood/NoHo"};
  if(r.label==="↓ Go South")return{label:"↓ Go South",sub:"Toward Long Beach"};
  if(r.label==="→ Go East")return{label:"→ Go East",sub:"Toward Pasadena/Pomona"};
  return{label:"← Go West",sub:"Toward Santa Monica"};
}
function getNYCDir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=NYC_ZONE_DIST[f]??1,td=NYC_ZONE_DIST[t]??1;
  const[fx,fy]=NYC_ZONE_COORDS[f]||[0,0];const[tx,ty]=NYC_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward Manhattan",sub:"Closer to Midtown"};
  if(r.label==="← Further Out")return{label:"← Away from Manhattan",sub:"Outer borough"};
  if(r.label==="↑ Go North")return{label:"↑ Go North",sub:"Toward the Bronx"};
  if(r.label==="↓ Go South")return{label:"↓ Go South",sub:"Toward Brooklyn"};
  if(r.label==="→ Go East")return{label:"→ Go East",sub:"Toward Queens"};
  return{label:"← Go West",sub:"Toward Manhattan"};
}
function getCHIDir(f:string,t:string){
  if(f===t)return{label:"✓ MATCH",sub:""};
  const fd=CHI_ZONE_DIST[f]??2,td=CHI_ZONE_DIST[t]??2;
  const[fx,fy]=CHI_ZONE_COORDS[f]||[0,0];const[tx,ty]=CHI_ZONE_COORDS[t]||[0,0];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward the Loop",sub:"Closer to downtown"};
  if(r.label==="← Further Out")return{label:"← Away from the Loop",sub:"Further out"};
  if(r.label==="↑ Go North")return{label:"↑ Go North",sub:"Toward Howard/Evanston"};
  if(r.label==="↓ Go South")return{label:"↓ Go South",sub:"Toward the South Side"};
  if(r.label==="→ Go East")return{label:"→ Go East",sub:"Toward the Lakefront"};
  return{label:"← Go West",sub:"Toward O'Hare"};
}
function getStateDir(f:string,t:string){
  if(f===t)return{label:"✓ SAME REGION",sub:""};
  const fd=REGION_DIST[f]??2,td=REGION_DIST[t]??2;
  const[fx,fy]=REGION_COORDS[f]||[2,2];const[tx,ty]=REGION_COORDS[t]||[2,2];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward East Coast",sub:"More central/east"};
  if(r.label==="← Further Out")return{label:"← Toward West",sub:"More remote/west"};
  return r;
}

// ── NFL REGION HELPERS ────────────────────────────────────────────────────────
const NFL_REGION_DIST:{[k:string]:number}={"Northeast":0,"Mid-Atlantic":1,"Southeast":2,"Midwest":2,"South":3,"Mountain/SW":4,"Pacific":5};
const NFL_REGION_COORDS:{[k:string]:[number,number]}={"Northeast":[4,4],"Mid-Atlantic":[4,3],"Southeast":[3,1],"Midwest":[2,3],"South":[2,1],"Mountain/SW":[0,2],"Pacific":[-1,2]};
const NFL_REGION_ADJ:{[k:string]:string[]}={"Northeast":["Mid-Atlantic"],"Mid-Atlantic":["Northeast","Southeast","Midwest"],"Southeast":["Mid-Atlantic","Midwest","South"],"Midwest":["Northeast","Mid-Atlantic","Southeast","South","Mountain/SW"],"South":["Southeast","Midwest","Mountain/SW"],"Mountain/SW":["South","Midwest","Pacific"],"Pacific":["Mountain/SW"]};
function getNFLDir(f:string,t:string){
  if(f===t)return{label:"✓ SAME REGION",sub:""};
  const fd=NFL_REGION_DIST[f]??2,td=NFL_REGION_DIST[t]??2;
  const[fx,fy]=NFL_REGION_COORDS[f]||[2,2];const[tx,ty]=NFL_REGION_COORDS[t]||[2,2];
  const r=dirFromCoords(fx,fy,tx,ty,fd,td);
  if(r.label==="→ Closer In")return{label:"→ Toward East",sub:"Closer to coast"};
  if(r.label==="← Further Out")return{label:"← Toward West",sub:"Further west"};
  return r;
}
function cmpNFLConf(g:string,t:string){return g===t?"green":"red";}
function cmpNFLDiv(gConf:string,gDiv:string,tConf:string,tDiv:string){if(gConf===tConf&&gDiv===tDiv)return"green";if(gConf===tConf)return"yellow";return"red";}
function cmpNFLRegion(g:string,t:string){if(g===t)return"green";if(NFL_REGION_ADJ[g]?.includes(t))return"yellow";return"red";}
function cmpSB(g:number,t:number){if(g===t)return{color:"green",arrow:""};return{color:Math.abs(g-t)===1?"yellow":"red",arrow:t>g?"▲":"▼"};}
const sbLabel=(n:number)=>n===0?"🏆 Zero":n===1?"🏆 One":n<=3?`🏆 ${["","One","Two","Three"][n]}`:n<=5?`🏆 ${["","","","","Four","Five"][n]}`:`🏆 ${n}`;

// ── DIFFICULTY CONFIGS ────────────────────────────────────────────────────────
const TRANSIT_DIFF:{[k:string]:any}={
  easy:  {label:"Easy",  emoji:"🟢",hints:2,clues:["year"],maxGuesses:6,hardLocks:false,cols:["lines","zone","busy"],grid:"2.2fr 1.3fr 1fr 1fr .45fr",headers:["STATION","LINES","ZONE","BUSY","✓"],desc:"2 hints · Year clue · 6 guesses"},
  medium:{label:"Medium",emoji:"🟡",hints:1,clues:[],maxGuesses:6,hardLocks:false,cols:["lines","zone","busy","direction"],grid:"2fr 1.2fr .9fr .9fr 1fr .45fr",headers:["STATION","LINES","ZONE","BUSY","DIR","✓"],desc:"1 hint · No clues · 6 guesses"},
  hard:  {label:"Hard",  emoji:"🔴",hints:1,clues:[],maxGuesses:5,hardLocks:true,cols:["lines","zone","busy","direction","year"],grid:"2fr 1.1fr .8fr .8fr .85fr .65fr .45fr",headers:["STATION","LINES","ZONE","BUSY","DIR","YEAR","✓"],desc:"1 hint · No clues · Hard locks · 5 guesses"},
  pro:   {label:"Pro",   emoji:"⚫",hints:0,clues:[],maxGuesses:4,hardLocks:true,cols:["lines","zone","busy","direction","year"],grid:"2fr 1.1fr .8fr .8fr .85fr .65fr .45fr",headers:["STATION","LINES","ZONE","BUSY","DIR","YEAR","✓"],desc:"No hints · No clues · 4 guesses"},
};
const STATES_DIFF:{[k:string]:any}={
  easy:  {label:"Easy",  emoji:"🟢",hints:2,clues:["year"],maxGuesses:6,hardLocks:false,cols:["region","coast","pop"],grid:"2.2fr 1.3fr 1.1fr 1.1fr .45fr",headers:["STATE","REGION","COAST","POP","✓"],desc:"2 hints · Year clue · 6 guesses"},
  medium:{label:"Medium",emoji:"🟡",hints:1,clues:[],maxGuesses:6,hardLocks:false,cols:["region","coast","pop","direction"],grid:"2fr 1.1fr 1fr .95fr 1.1fr .45fr",headers:["STATE","REGION","COAST","POP","DIR","✓"],desc:"1 hint · No clues · 6 guesses"},
  hard:  {label:"Hard",  emoji:"🔴",hints:1,clues:[],maxGuesses:5,hardLocks:true,cols:["region","coast","pop","direction","year"],grid:"2fr 1.1fr .95fr .85fr 1.05fr .7fr .45fr",headers:["STATE","REGION","COAST","POP","DIR","YEAR","✓"],desc:"1 hint · No clues · Hard locks · 5 guesses"},
  pro:   {label:"Pro",   emoji:"⚫",hints:0,clues:[],maxGuesses:4,hardLocks:true,cols:["region","coast","pop","direction","year","size"],grid:"1.8fr 1fr .9fr .8fr 1fr .65fr .7fr .45fr",headers:["STATE","REGION","COAST","POP","DIR","YEAR","SIZE","✓"],desc:"No hints · No clues · 4 guesses"},
};
const NFL_DIFF:{[k:string]:any}={
  easy:  {label:"Easy",  emoji:"🟢",hints:2,clues:["year"],maxGuesses:6,hardLocks:false,cols:["conf","div","region"],grid:"2.2fr .9fr 1fr 1.4fr .45fr",headers:["TEAM","CONF","DIV","REGION","✓"],desc:"2 hints · Year clue · 6 guesses"},
  medium:{label:"Medium",emoji:"🟡",hints:1,clues:[],maxGuesses:6,hardLocks:false,cols:["conf","div","region","sb"],grid:"2fr .85fr .9fr 1.2fr .9fr .45fr",headers:["TEAM","CONF","DIV","REGION","SB","✓"],desc:"1 hint · No clues · 6 guesses"},
  hard:  {label:"Hard",  emoji:"🔴",hints:1,clues:[],maxGuesses:5,hardLocks:true,cols:["conf","div","region","sb","year"],grid:"1.9fr .8fr .85fr 1.1fr .85fr .65fr .45fr",headers:["TEAM","CONF","DIV","REGION","SB","YEAR","✓"],desc:"1 hint · No clues · Hard locks · 5 guesses"},
  pro:   {label:"Pro",   emoji:"⚫",hints:0,clues:[],maxGuesses:4,hardLocks:true,cols:["conf","div","region","sb","year"],grid:"1.9fr .8fr .85fr 1.1fr .85fr .65fr .45fr",headers:["TEAM","CONF","DIV","REGION","SB","YEAR","✓"],desc:"No hints · No clues · 4 guesses"},
};

// ── GAME CONFIG ───────────────────────────────────────────────────────────────
const GAMES:{[k:string]:any}={
  pdx:{key:"pdx",name:"Portland MAX",short:"PDX",emoji:"🌹",sub:"TriMet · Portland, OR",accent:"#028A48",accentDark:"#2ecc71",bgDark:"#020a02",bgLight:"#ffffff",winText:"All Aboard!",itemLabel:"station",itemEmoji:"🚊",diffConfig:TRANSIT_DIFF,lineColors:PDX_LINES,adj:PDX_ADJ,zDist:PDX_ZONE_DIST,zCoords:PDX_ZONE_COORDS,getDir:getPDXDir,type:"transit"},
  dc: {key:"dc", name:"DC Metro",    short:"DC", emoji:"🌸",sub:"WMATA · Washington, D.C.",accent:"#BF0000",accentDark:"#e03030",bgDark:"#030610",bgLight:"#f8faff",winText:"Doors Opening!",itemLabel:"station",itemEmoji:"🚇",diffConfig:TRANSIT_DIFF,lineColors:DC_LINES,adj:DC_ADJ,zDist:DC_ZONE_DIST,zCoords:DC_ZONE_COORDS,getDir:getDCDir,type:"transit"},
  states:{key:"states",name:"US States",short:"STATES",emoji:"🦅",sub:"50 States · Geography Puzzle",accent:"#1a3a8f",accentDark:"#4a8aff",bgDark:"#020414",bgLight:"#ffffff",winText:"Liberty!",itemLabel:"state",itemEmoji:"🗺️",diffConfig:STATES_DIFF,lineColors:null,adj:REGION_ADJ,getDir:getStateDir,type:"states"},
  nfl: {key:"nfl", name:"NFL Teams",  short:"NFL", emoji:"🏈",sub:"All 32 Franchises · Football Puzzle",accent:"#013369",accentDark:"#4a7aff",bgDark:"#010614",bgLight:"#f0f4f8",winText:"Touchdown!",itemLabel:"team",itemEmoji:"🏈",diffConfig:NFL_DIFF,lineColors:null,adj:NFL_REGION_ADJ,getDir:getNFLDir,type:"nfl"},
  balt:{key:"balt",name:"Baltimore MTA",short:"BALT",emoji:"🦀",sub:"MTA Maryland · Baltimore, MD",accent:"#003087",accentDark:"#4a7aff",bgDark:"#01030f",bgLight:"#f5f7ff",winText:"Next Train!",itemLabel:"station",itemEmoji:"🚉",diffConfig:TRANSIT_DIFF,lineColors:BALT_LINES,adj:BALT_ADJ,zDist:BALT_ZONE_DIST,zCoords:BALT_ZONE_COORDS,getDir:getBALTDir,type:"transit"},
  la:{key:"la",name:"LA Metro",short:"LA",emoji:"🌴",sub:"Metro Rail · Los Angeles, CA",accent:"#0072bc",accentDark:"#2aa8ff",bgDark:"#01061a",bgLight:"#f0f7ff",winText:"Doors are closing!",itemLabel:"station",itemEmoji:"🚇",diffConfig:TRANSIT_DIFF,lineColors:LA_LINES,adj:LA_ADJ,zDist:LA_ZONE_DIST,zCoords:LA_ZONE_COORDS,getDir:getLADir,type:"transit"},
  nyc:{key:"nyc",name:"NYC Subway",short:"NYC",emoji:"🗽",sub:"MTA · New York City, NY",accent:"#EE352E",accentDark:"#ff6666",bgDark:"#0a0002",bgLight:"#fff5f5",winText:"Stand clear of the closing doors!",itemLabel:"station",itemEmoji:"🚇",diffConfig:TRANSIT_DIFF,lineColors:NYC_LINES,adj:NYC_ADJ,zDist:NYC_ZONE_DIST,zCoords:NYC_ZONE_COORDS,getDir:getNYCDir,type:"transit"},
  chi:{key:"chi",name:"Chicago L",short:"CHI",emoji:"🌬️",sub:"CTA · Chicago, IL",accent:"#C60C30",accentDark:"#ff3355",bgDark:"#0a0002",bgLight:"#fff5f5",winText:"Doors closing!",itemLabel:"station",itemEmoji:"🚊",diffConfig:TRANSIT_DIFF,lineColors:CHI_LINES,adj:CHI_ADJ,zDist:CHI_ZONE_DIST,zCoords:CHI_ZONE_COORDS,getDir:getCHIDir,type:"transit"},
};

// ── COMPARE HELPERS ───────────────────────────────────────────────────────────
const busyLabel=(t:number)=>({1:"🌑 Ghost",2:"🌒 Quiet",3:"🌓 Moderate",4:"🌔 Busy",5:"🌕 Packed"}[t]||"");
const popLabel=(t:number)=>({1:"🌑 Tiny",2:"🌒 Small",3:"🌓 Medium",4:"🌔 Large",5:"🌕 Massive"}[t]||"");
const sizeLabel=(t:number)=>({1:"🔹 Micro",2:"🔸 Small",3:"🔶 Medium",4:"🔷 Large",5:"💠 Massive"}[t]||"");
const EMOJI_MAP:{[k:string]:string}={green:"🟩",yellow:"🟨",red:"🟥"};
const SHAPE:{[k:string]:string}={green:"●",yellow:"◆",red:"■"};
function cmpLines(g:string[],t:string[]){const gs=new Set(g),ts=new Set(t);if([...gs].every((l:string)=>ts.has(l))&&[...ts].every((l:string)=>gs.has(l)))return"green";if([...gs].some((l:string)=>ts.has(l)))return"yellow";return"red";}
function cmpZone(g:string,t:string,adj:{[k:string]:string[]}){if(g===t)return"green";if(adj[g]?.includes(t))return"yellow";return"red";}
function cmpTraffic(g:number,t:number){if(g===t)return{color:"green",arrow:""};return{color:Math.abs(g-t)===1?"yellow":"red",arrow:t>g?"▲":"▼"};}
function cmpYear(g:number,t:number,range=5){if(g===t)return{color:"green",arrow:""};return{color:Math.abs(g-t)<=range?"yellow":"red",arrow:t>g?"▲":"▼"};}
function cmpRegion(g:string,t:string){if(g===t)return"green";if(REGION_ADJ[g]?.includes(t))return"yellow";return"red";}
function cmpCoast(g:string,t:string){if(g===t)return"green";if(COAST_ADJ[g]?.includes(t))return"yellow";return"red";}
function cmpPop(g:number,t:number){if(g===t)return{color:"green",arrow:""};return{color:Math.abs(g-t)===1?"yellow":"red",arrow:t>g?"▲":"▼"};}
function cmpSize(g:number,t:number){if(g===t)return{color:"green",arrow:""};return{color:Math.abs(g-t)===1?"yellow":"red",arrow:t>g?"▲":"▼"};}
function buildGuess(item:any,target:any,gameKey:string){
  if(gameKey==="nfl"){return{item,confColor:cmpNFLConf(item.conf,target.conf),divColor:cmpNFLDiv(item.conf,item.div,target.conf,target.div),regionColor:cmpNFLRegion(item.region,target.region),sbResult:cmpSB(item.sb,target.sb),dirInfo:getNFLDir(item.region,target.region),yearResult:cmpYear(item.year,target.year,10)};}
  if(gameKey==="states"){return{item,regionColor:cmpRegion(item.region,target.region),coastColor:cmpCoast(item.coast,target.coast),popResult:cmpPop(item.pop,target.pop),dirInfo:getStateDir(item.region,target.region),yearResult:cmpYear(item.year,target.year,15),sizeResult:cmpSize(item.size,target.size)};}
  const adj=gameKey==="pdx"?PDX_ADJ:gameKey==="balt"?BALT_ADJ:gameKey==="la"?LA_ADJ:gameKey==="nyc"?NYC_ADJ:gameKey==="chi"?CHI_ADJ:DC_ADJ;
  const dirFn=gameKey==="pdx"?getPDXDir:gameKey==="balt"?getBALTDir:gameKey==="la"?getLADir:gameKey==="nyc"?getNYCDir:gameKey==="chi"?getCHIDir:getDCDir;
  return{item,linesColor:cmpLines(item.lines,target.lines),zoneColor:cmpZone(item.zone,target.zone,adj),trafficResult:cmpTraffic(item.traffic,target.traffic),dirInfo:dirFn(item.zone,target.zone),yearResult:cmpYear(item.year,target.year,5)};
}
function getFocusHint(guesses:any[],gameKey:string){
  if(!guesses.length)return null;
  const g=guesses[guesses.length-1];
  if(gameKey==="nfl"){
    if(g.yearResult?.color==="yellow")return`💡 YEAR close — go ${g.yearResult.arrow==="▲"?"later":"earlier"} ${g.yearResult.arrow}`;
    if(g.sbResult?.color==="yellow")return`💡 SUPER BOWLS one off ${g.sbResult.arrow}`;
    if(g.divColor==="yellow")return"💡 Same conference — different division";
    if(g.regionColor==="yellow")return"💡 REGION adjacent — check direction";
    return null;
  }
  if(gameKey==="states"){
    if(g.yearResult?.color==="yellow")return`💡 YEAR close — go ${g.yearResult.arrow==="▲"?"later":"earlier"} ${g.yearResult.arrow}`;
    if(g.popResult?.color==="yellow")return`💡 POPULATION one tier off ${g.popResult.arrow}`;
    if(g.regionColor==="yellow")return"💡 REGION is adjacent — adjust direction";
    if(g.coastColor==="yellow")return"💡 COAST TYPE is close";
    return null;
  }
  if(g.yearResult?.color==="yellow")return`💡 YEAR close — go ${g.yearResult.arrow==="▲"?"later":"earlier"} ${g.yearResult.arrow}`;
  if(g.trafficResult?.color==="yellow")return`💡 BUSY one level off ${g.trafficResult.arrow}`;
  if(g.zoneColor==="yellow")return"💡 ZONE is adjacent — check direction";
  if(g.linesColor==="yellow")return"💡 LINES have partial overlap";
  return null;
}
function buildShare(guesses:any[],won:boolean,dayNum:number,gameKey:string,diff:string,targetName?:string){
  const G=GAMES[gameKey];const D=G.diffConfig[diff];
  const rows=guesses.map((g:any)=>{
    if(gameKey==="nfl")return[EMOJI_MAP[g.confColor],EMOJI_MAP[g.divColor],EMOJI_MAP[g.regionColor]].join("");
    if(gameKey==="states")return[EMOJI_MAP[g.regionColor],EMOJI_MAP[g.coastColor],EMOJI_MAP[g.popResult.color]].join("");
    return[EMOJI_MAP[g.linesColor],EMOJI_MAP[g.zoneColor],EMOJI_MAP[g.trafficResult.color]].join("");
  });
  const result=won?`${guesses.length}/${D.maxGuesses}`:"X";
  return`UrbanIQ Day #${dayNum} | ${G.name} | ${result}\n${rows.join("\n")}\nurbaniq.quest`;
}
function buildAllRoundsShare(rounds:any[],gameKey:string,diff:string,dayNum:number,streak:number){
  const G=GAMES[gameKey];
  const played=rounds.filter((r:any)=>r.alreadyPlayed);
  const won=played.filter((r:any)=>r.won).length;
  const roundEmojis=rounds.map((r:any)=>{if(!r.alreadyPlayed)return"⬜";return r.won?"🟩":"⬛";}).join("");
  const lines=[`UrbanIQ Day #${dayNum} | ${G.name} | ${won}/${played.length} ${roundEmojis}`,""];
  rounds.forEach((r:any,i:number)=>{
    if(!r.alreadyPlayed)return;
    const grid=r.guesses.map((g:any)=>{
      if(gameKey==="nfl")return[EMOJI_MAP[g.confColor],EMOJI_MAP[g.divColor],EMOJI_MAP[g.regionColor]].join("");
      if(gameKey==="states")return[EMOJI_MAP[g.regionColor],EMOJI_MAP[g.coastColor],EMOJI_MAP[g.popResult.color]].join("");
      return[EMOJI_MAP[g.linesColor],EMOJI_MAP[g.zoneColor],EMOJI_MAP[g.trafficResult.color]].join("");
    }).join(" ");
    lines.push(`R${i+1}: ${r.won?"✅":"❌"} ${grid}`);
  });
  lines.push("");
  if(streak>1)lines.push(`🔥 ${streak} day streak`);
  lines.push("urbaniq.quest");
  return lines.join("\n");
}

// ── RICH HINTS ─────────────────────────────────────────────────────────────────
// Each station/state gets [hint1 (broad, cultural), hint2 (specific, cheat-code)]
const PDX_HINTS:Record<string,[string,string]>={
  "Pioneer Square South":["You're basically standing in Portland's living room — every rally, festival, and protest ends up here","The south end of the square where the old courthouse still stands — look for the 100-year-old wishing fountain"],
  "Morrison/SW 3rd Avenue":["The bridge named after this street has connected east and west Portland since before your grandparents were born","You're on the transit mall between the bridges — the Morrison spans the Willamette right here"],
  "Yamhill District":["Portland's original commercial waterfront — the city's skeleton before it grew into what it is now","Named for SW Yamhill St, part of the very first street grid laid out in 1851. You're in the oldest part of Portland."],
  "Oak Street/SW 1st Avenue":["Steps from Tom McCall Waterfront Park — where Portlanders run, picnic, and watch the bridges go up","One of the original 1986 opening-day stations. The Saturday Market is a short walk toward the river."],
  "Old Town/Chinatown":["Portland's Saturday Market — the largest continuously operating outdoor arts market in the entire US — is literally around the corner","This is where Portland's original Chinatown gate stands. Old Town's neon signs and brick streets haven't changed much since the 1800s."],
  "Library/SW 9th Avenue":["One of the most visited public library systems in the country is your landmark here — and it's gorgeous inside","Multnomah County Central Library. If you've ever been to a library event in Portland, it was probably here."],
  "Galleria/SW 10th Avenue":["The Pearl District starts just north — the warehouses-turned-lofts that define Portland's upscale rebrand","This is your jump-on for the Portland Streetcar headed through the Pearl. The Galleria building itself is a converted department store."],
  "Pioneer Courthouse/SW 6th":["Every MAX line essentially passes through here. If downtown Portland is the hub, this is the axle.","The Green and Yellow lines share this platform. Pioneer Courthouse — the oldest federal building in the Pacific Northwest — is right above you."],
  "Pioneer Place/SW 5th":["The mall that's basically holding downtown retail together is your landmark here","Pioneer Place opened in 1990. The Green and Orange lines stop here — you're on the 5th Ave side of the transit mall."],
  "SW 5th & Oak Street":["Downtown shopping corridor — you're in the heart of Portland's main commercial drag","Part of the 2009 transit mall rebuild. If you've shopped on 5th, you've walked past this stop."],
  "SW 6th & Madison Street":["Portland City Hall is steps away — the civic center that's been here since 1895","6th and Madison puts you right next to city government. The Green and Yellow lines both come through here."],
  "SW 6th & Pine Street":["The Pearl District starts about a block north from here — the boundary between downtown and the fancy part","This is your jump-off for the Pearl. Powell's main store is a short walk up Burnside."],
  "NW 5th & Couch Street":["You're at the southern tip of the Pearl District — named for a sea captain who claimed this land in the 1840s","Captain John Couch's street. The Green and Orange lines both stop here — you're just south of Powell's Books."],
  "NW 6th & Davis Street":["Northern end of the downtown transit mall — a few blocks more and you're in the Pearl proper","Green and Yellow share this one. You're almost to Union Station territory."],
  "City Hall/SW 5th & Jefferson St":["Portland City Hall — one of the oldest functioning city halls in the Pacific Northwest — is literally right here","SW 5th and Jefferson. Green and Orange lines. The building has been running city business since 1895."],
  "Union Station/NW 5th & Glisan St":["The Amtrak station with the famous clock tower — Coast Starlight, Empire Builder, Cascades all depart from here","If you're catching a train to Seattle or LA, this is your stop. The 5th Ave entrance faces the ornate 1896 station building."],
  "Union Station/NW 6th & Hoyt St":["Portland's most iconic clock tower is your landmark — you can see it from blocks away","The 6th Ave entrance to Union Station. Green and Yellow lines. That tower has been welcoming travelers since 1896."],
  "PSU Urban Center/SW 5th & Mill":["Oregon's biggest university occupies this whole area — 27,000 students call this campus home","Portland State's main MAX connection. SW 5th and Mill. Green and Orange. The Urban Center building is right here."],
  "PSU Urban Center/SW 6th & Montgomery":["Same campus, other side of the street — PSU's urban sprawl fills this whole block","SW 6th and Montgomery. The College of Urban and Public Affairs building is what you're looking for."],
  "PSU South/SW 5th & Jackson St":["Southern end of the transit mall — this is where the downtown corridor wraps up","SW 5th and Jackson. Green and Orange. Added in 2012 to improve the southern terminus flexibility."],
  "PSU South/SW 6th & College St":["You're at the corner of a street literally called College — PSU's academic edge","SW 6th and College St. Green and Yellow. The College of Urban and Public Affairs is your landmark."],
  "Providence Park":["On Timbers match days, this is the loudest station in the system — 25,000 soccer fans is not quiet","Here, home of the Portland Timbers. Blue and Red lines. MLS cup runs through this stop."],
  "Goose Hollow/SW Jefferson Street":["One of Portland's oldest neighborhoods — named for the actual geese that used to roam here in the 1800s","Goose Hollow is where Bud Clark, Portland's most colorful mayor, lived. SW Jefferson, Blue and Red."],
  "Washington Park":["260 feet underground — one of the deepest light rail stations in all of North America. It's basically a cave.","You'll know it by the elevator and the tunnel. The Oregon Zoo is above you. Blue and Red lines."],
  "South Waterfront/South Moody":["The Portland Aerial Tram — that gondola going up to OHSU — departs practically from this platform","South Waterfront's newest urban district. Orange Line. The tram to the hospital is the giveaway."],
  "OMSI/SE Water":["One of the Pacific Northwest's top science museums is your landmark — and a real decommissioned submarine sits outside","Orange Line. East bank of the Willamette. The submarine out front has been there for decades."],
  "Lincoln Street/SE 3rd Avenue":["The Central Eastside — Portland's mix of food halls, breweries, and tech offices — starts here","SE 3rd and Lincoln. Orange Line. This is the jumping-off point for the warehouse district turned hipster corridor."],
  "Clinton Street/SE 12th Avenue":["Division Street's restaurant corridor is a short walk — it's been called one of America's best food streets","SE 12th and Clinton. Orange Line. Pok Pok made Division famous. You're a few blocks away."],
  "SE 17th Avenue & Rhine Street":["Sellwood's antique row and bungalow charm — this is about as Old Portland as it gets","SE 17th and Rhine. Orange Line. Sellwood is the neighborhood that Instagram thinks Portland looks like."],
  "SE 17th Avenue & Holgate Blvd":["Woodstock neighborhood — Portland's quieter, more residential side of the Orange Line","SE 17th and Holgate. Orange Line. This is a neighborhood stop, not a destination one."],
  "SE Bybee Boulevard":["Sellwood-Moreland — consistently rated one of Portland's most desirable places to live","SE Bybee Blvd. Orange Line. Family-friendly, close to the river, exactly what people imagine when they say 'Portland neighborhood.'"],
  "SE Powell Boulevard":["One of Portland's great east-west arterials — it's been connecting neighborhoods since the streetcar days","Green Line. Inner SE residential stretch. This corridor has run through Portland history since the beginning."],
  "SE Holgate Boulevard":["Classic Portland bungalow territory — one of the calmer, more residential Green Line stops","Green Line. SE Holgate. Woodstock is nearby. This one's for the locals."],
  "SE Division Street":["This street has been ranked one of America's best food corridors — a single famous Thai restaurant put it on the map","Green Line. Inner SE Portland. If you smell amazing food and hear someone arguing about natural wine, you're here."],
  "Lents Town Center/SE Foster Road":["This outer SE neighborhood was its own independent city before Portland annexed it in 1912 — it still has that blue-collar feel","Green Line. SE Foster Road. One of Portland's oldest outer neighborhoods and one of the most underrated."],
  "SE Flavel Street":["Brentwood-Darlington — quiet, residential, definitively outer SE Portland","Green Line. SE Flavel. If you're not from here you've probably never heard of it. That's the point."],
  "SE Tacoma/Johnson Creek":["The urban creek running under these tracks was restored from a polluted drainage ditch into a functioning stream — a genuine Portland environmental success","Orange Line. Southeast Portland. Look for the restored creek under the tracks — it's genuinely impressive."],
  "Milwaukie/Main Street":["Dark Horse Comics — publisher of Hellboy, Sin City, and The Mask — was founded in this town","Orange Line. Downtown Milwaukie. If you're a comic book person, this is a pilgrimage stop."],
  "SE Park Avenue":["Southern terminus of the Orange Line — the line opened in 2015, the newest in the TriMet system","Orange Line. SE Park Ave. End of the line heading south. From here you'd need a bus or a car."],
  "Rose Quarter Transit Center":["The Trail Blazers have played here since 1970 — on game nights this station is absolute chaos","Moda Center is right here. Blue, Green, Red. If you've seen a Blazers game, you've used this stop."],
  "Convention Center":["The twin green glass spires here are impossible to miss — they're on every Portland skyline photo","Blue, Green, Red. Lloyd District. Those spires are a Portland landmark. One of the biggest convention venues in the PNW."],
  "NE 7th Avenue":["Lloyd District — where the streetcar meets MAX and you can get to the Rose Quarter without taking a game-day shuttle","Blue, Green, Red. NE 7th. Also a Portland Streetcar connection. This is the quiet hub between the arena and downtown."],
  "Lloyd Center/NE 11th Avenue":["One of America's first enclosed shopping malls is your landmark — and it still has an indoor ice skating rink","Blue, Green, Red. NE 11th. The rink has been there since 1960. It's weird and wonderful."],
  "Interstate/Rose Quarter":["Where the Yellow Line peels north — this is the fork where MAX splits toward North Portland","Yellow Line. This is where it diverges. If you're going to North Portland, you transfer or start here."],
  "Albina/Mississippi":["The avenue here was ranked one of America's coolest streets — the Yellow Line sparked the entire neighborhood renaissance","Yellow Line. The bars, restaurants, and record shops along this stretch are a direct result of MAX access."],
  "Overlook Park":["One of Portland's best views of the Willamette River and downtown skyline is right here — and most people don't know about it","Yellow Line. The bluffs give you a panoramic view of the river that's better than most tourists ever see."],
  "Kenton/North Denver Avenue":["A 31-foot Paul Bunyan statue has been standing here since 1959. You can't miss it.","Yellow Line. Kenton neighborhood. The giant Bunyan was built for the World's Fair. It's gloriously out of place."],
  "North Prescott Street":["Arbor Lodge — classic North Portland bungalow neighborhood, the kind that's been there forever","Yellow Line. North Prescott. Quiet residential. If you don't live here you're probably visiting someone who does."],
  "North Killingsworth Street":["This North Portland corridor has had a whole food and arts renaissance since MAX arrived — look for the murals","Yellow Line. North Portland. The street has transformed significantly since the line opened in 2004."],
  "North Lombard Transit Center":["One of the Yellow Line's busiest bus hubs — practically every North Portland bus route comes through here","Yellow Line. N Lombard. If you need to get literally anywhere in North Portland, you transfer here."],
  "Rosa Parks":["Named for one of the most important figures in American civil rights history — they renamed this station in 2019","Yellow Line. A station whose name honors the 1955 Montgomery bus boycott. One of the most meaningfully named stops in the Pacific Northwest."],
  "Delta Park/Vanport":["An entire city of 40,000 people was buried under this site by a catastrophic Columbia River flood in a single afternoon in 1948","Yellow Line. Delta Park. The whole area is flat because that city's remains are under the ground here. Real Portland history."],
  "Expo Center":["The northern tip of the Yellow Line — the expo and events center here is steps from the Oregon/Washington border","Yellow Line northern terminus. The Columbia River is right there. You're basically in Washington at this point."],
  "NE 60th Avenue":["Beaumont Village — one of Northeast Portland's most charming commercial districts, with coffee shops and bookstores","Blue, Green, Red. NE 60th. Beaumont-Wilshire neighborhood. Very walkable, very Portland."],
  "NE 82nd Avenue":["This avenue is one of Oregon's most diverse dining corridors — Vietnamese, Ethiopian, Mexican, and Filipino restaurants all on one road","Blue, Green, Red. Outer East Portland. This is where Portland's immigrant communities built something lasting."],
  "Hollywood/NE 42nd Avenue":["An independent cinema here has shown films continuously since 1926 — it's the kind of place Portland is fiercely protective of","Blue, Green, Red. NE 42nd. The neighborhood is named for that cinema. Portland's independent film crown jewel."],
  "Parkrose/Sumner Transit Center":["Park-and-ride hub for northeast Portland — the gateway for commuters heading to PDX or downtown","Red Line. Parkrose neighborhood. Big park-and-ride. This is where NE Portland connects to the airport line."],
  "Cascades":["Part of the Airport Way industrial and office corridor — opened in 2007 to serve the expanding Columbia Corridor","Red Line. Opened 2007. Named for the mountain range visible to the east on clear days."],
  "Gateway North":["The newest MAX station in the whole system — opened in 2024 as part of the Red Line double-track project","Red Line. Opened in 2024. If you've been playing since day one, this station is younger than this game."],
  "Mount Hood Avenue":["One stop from PDX Airport — and on clear days you can see the mountain it's named after looming to the east","Red Line. One stop from the airport. Mount Hood is visible from here on clear days — it's a good sign you're close."],
  "Portland International Airport":["PDX has the best airport carpet in America. The Portlanders who got that put on a t-shirt are geniuses.","Red Line terminus. The airport. You're at PDX — the carpet is on the floor of the terminal, but you knew that."],
  "Beaverton Central":["Intel's largest US campus is just a few miles west — you're in the heart of Oregon's Silicon Forest","Blue, Red. Beaverton's downtown station. The tech money starts here and radiates outward."],
  "Beaverton Creek":["A rare natural wetland oasis in the middle of the Silicon Forest suburbs — the creek is a real ecosystem","Blue Line. One of the few genuine green spaces in the otherwise very built-out Beaverton corridor."],
  "Merlo Road/SW 158th Avenue":["Western Beaverton suburbs — Washington County territory, getting further from the city","Blue Line. SW 158th. Merlo Road. You're in the suburban stretch heading toward Hillsboro."],
  "Elmonica/SW 170th Avenue":["One of the quieter Blue Line stations in Beaverton's western residential neighborhoods","Blue Line. Elmonica neighborhood. SW 170th. Suburbia, but with light rail."],
  "Sunset Transit Center":["The largest park-and-ride facility on the entire Blue/Red corridor — Washington County commuters fill this lot","Blue, Red. Sunset TC. Massive park-and-ride. The West Hills tunnel is right here — you're about to go underground."],
  "Washington/SW Cedar Hills Blvd":["Cedar Hills Crossing shopping area — one of Washington County's main retail destinations","Blue Line. Cedar Hills. The shopping center anchors this stop."],
  "Cedar Hills":["Quiet western Beaverton residential neighborhood — far enough from Portland to feel suburban","Blue Line. Residential. This one's for the people who live here."],
  "Barnes Road":["One stop from Nike World Headquarters — the Swoosh campus is that close to the MAX line","Blue, Red. Nike's Oregon headquarters is just down the road. Oregon's most valuable company."],
  "Beaverton TC":["The biggest transportation hub in all of Washington County — MAX, WES commuter rail, and every major bus route meet here","Blue, Red, WES. The WES Commuter Rail is the only other rail line in TriMet's system."],
  "Hall/Nimbus":["Nimbus business district — quiet Blue Line stop in western Beaverton's commercial corridor","Blue Line. Hall Blvd and Nimbus Ave. Low-key business stop."],
  "Quatama":["Hillsboro's eastern edge — the 2003 expansion brought MAX out to the newer residential developments","Blue Line. Opened 2003. You're entering Hillsboro territory."],
  "Hawthorn Farm":["Near Intel's massive Ronler Acres campus — the tech jobs are what this part of the line is about","Blue Line. Intel's nearby. Silicon Forest territory."],
  "Orenco/NW 231st Avenue":["This community is the textbook example of transit-oriented development — urban planners worldwide study this neighborhood","Blue Line. Hillsboro area. If you've ever taken a planning class, you've heard of this place. Dense, walkable, built around the station."],
  "Fair Complex/Hillsboro Airport":["A general aviation airport and county fairgrounds share this stop — the fairgrounds see huge seasonal crowds","Blue, Red. Small planes fly out of here regularly. The Washington County Fair brings big crowds every summer."],
  "Hillsboro Central/SE 3rd Avenue TC":["You're in the heart of Oregon's Silicon Forest — Intel's biggest US campus is right here in this city","Blue Line. Downtown hub. Intel. The tech corridor that turned a farm town into a global tech center."],
  "Hillsboro Health District":["A major medical center campus — the hospital here was rebranded in 2021 but locals still call it by the old name","Blue Line. The hospital campus. Tuality to Hillsboro Medical Center — same place, new sign."],
  "Washington/SE 12th Avenue":["Quiet residential stretch in southern Hillsboro — one of the low-key suburban stops on the outer Blue Line","Blue Line. SE 12th Ave, Hillsboro. Near the Tualatin Valley Highway."],
  "Hatfield Government Center":["The absolute western terminus of the MAX system — named for a longtime Oregon senator who championed public transit","Blue Line western terminus. The westernmost light rail station in the entire TriMet network."],
  "SE Fuller Road":["Big park-and-ride, quiet Green Line stop — 630 spaces if you're driving from south of here","Green Line. One of the largest park-and-rides on the Green Line."],
  "SE Main Street":["Pleasant Valley area near the Clackamas County border — calm, suburban, and not where many people are going","Green Line. SE Main St. Near Clackamas County. Quiet residential."],
  "Clackamas Town Center TC":["One of the Portland metro's biggest shopping malls is the whole reason this station exists","Green Line southern terminus. Clackamas Town Center. The mall. You're shopping or you're transferring."],
  "Gateway/NE 99th Ave TC":["The big fork — Blue, Green, and Red all diverge here heading east. Miss your transfer and you're going somewhere different.","Blue, Green, Red. Gateway TC. The eastern hub. If you're confused about which line to take east, this is where to figure it out."],
  "E 102nd Avenue":["This outer East Portland corridor is one of the metro's most multicultural stretches — it's changed a lot since 1986","Blue, Green, Red. Outer East Portland. The neighborhood has transformed dramatically over the decades."],
  "E 122nd Avenue":["One of East Portland's most multicultural corridors — global food, global community all along this stretch","Blue, Green, Red. International food market territory. More languages spoken here than almost anywhere in the metro."],
  "E 148th Avenue":["Outer East Portland near the Gresham border — you're getting to the edges of Portland proper","Blue, Green, Red. E 148th. Almost Gresham."],
  "E 162nd Avenue":["Far outer East Portland — residential neighborhoods that blur into Gresham","Blue, Green, Red. E 162nd. The city is still technically Portland here but just barely."],
  "E 172nd Avenue":["Eastern gateway to Gresham — part of the original 1986 Blue Line","Blue Line. E 172nd. You've crossed into Gresham territory."],
  "Rockwood/E 188th Ave TC":["One of the most diverse communities in the entire metro area — the Green Line added frequency that genuinely changed access here","Blue, Green, Red. 188th Ave. One of outer Portland's most vibrant multicultural neighborhoods."],
  "Ruby Junction/E 197th Ave":["TriMet's main MAX maintenance and storage facility is right here — this is where the trains sleep","Blue, Green, Red. Ruby Junction. The trains park here. It's the mothership."],
  "Civic Drive":["Gresham City Hall — Oregon's 4th largest city runs its government from right here","Blue, Green, Red. Gresham is bigger than most people think."],
  "Gresham City Hall":["The downtown core of Oregon's 4th largest city — the underrated eastern anchor of the entire MAX system","Blue, Green, Red. City Hall is steps away. Bigger city than most Portland commuters realize."],
  "Gresham Central TC":["The main downtown hub of Oregon's 4th largest city — where regional buses and MAX converge at the eastern terminus","Blue, Green, Red. End of the eastern corridor is close. The transit center here connects half of outer east Portland."],
  "Cleveland Avenue":["The final stop of the original 1986 Blue Line — you've reached the eastern terminus","Blue, Green, Red eastern terminus. Cleveland Ave. This is where the original system ended in 1986. End of the line."],
};

const DC_HINTS:Record<string,[string,string]>={
  "Metro Center":["The busiest station in the entire DC Metro — four lines, constant foot traffic, heart of downtown Washington","Red, Orange, Silver, Blue all meet here. If you're lost in DC, this station is where you regroup."],
  "Gallery Place-Chinatown":["Capital One Arena is right above you — Capitals and Wizards games send this station into overdrive","Red, Yellow, Green. The arena is literally the building on top. Chinatown's historic gate is steps away."],
  "Farragut North":["K Street — DC's lobbying corridor — is your address. The people in expensive suits walking by are not politicians.","Red Line. The power brokers work in these buildings. The CVS nearby is where they buy their aspirin."],
  "Farragut West":["Connected to Farragut North by an underground concourse — two stations, one neighborhood, the heart of DC's business district","Orange, Silver, Blue. The concourse between North and West is a DC insider shortcut. White House is a short walk."],
  "McPherson Square":["Steps from the White House grounds — close enough that security is always nearby","Orange, Silver, Blue. The park here is the green space across the street. K Street business district."],
  "Federal Triangle":["The Justice Department, IRS, and a cluster of massive neoclassical federal buildings fill every block around here","Orange, Silver, Blue. A complex of Depression-era limestone buildings surrounds this stop. Very imposing."],
  "Smithsonian":["Every museum on the National Mall is free and within walking distance — this is the station for all of them","Orange, Silver, Blue. The Mall stretches in both directions from here. Air and Space, Natural History, American History — all free."],
  "L'Enfant Plaza":["Five Metro lines converge here — it's named for the guy who designed DC's entire street grid in the 1790s","Orange, Silver, Blue, Yellow, Green. The most lines of any station outside downtown. L'Enfant designed DC's spoke layout."],
  "Federal Center SW":["Southwest DC's federal office complex — the cluster of agencies that make government run behind the scenes","Orange, Silver, Blue. Quiet federal workers on weekdays, empty on weekends."],
  "Archives-Navy Memorial":["The Declaration of Independence and Constitution are stored one block away — this is literally history's Metro stop","Yellow, Green. The National Archives is your landmark. Pennsylvania Avenue stretches in both directions."],
  "Mt Vernon Sq/7th St-Convention Center":["The Walter E. Washington Convention Center — DC's largest at 2.3 million square feet — is your landmark","Yellow, Green. The convention center fills the whole block. Mount Vernon Square is the park in front."],
  "Judiciary Square":["DC Superior Court and the municipal government buildings — the less glamorous but very necessary part of government","Red Line. Court buildings surround this stop. Lawyers are the usual passengers."],
  "Waterfront":["The Wharf — DC's $3.6 billion waterfront transformation — is basically this station's whole reason for existing now","Green Line. The Wharf district. Fish market, restaurants, concert venue, marina. Southwest DC's glow-up."],
  "Navy Yard-Ballpark":["Nationals Park is right here — on game nights this is the highest-ridership event station in the system","Green Line. The baseball stadium. Nationals games. The ballpark glow is visible from the platform."],
  "Capitol South":["The primary Metro stop for the US Capitol — members of Congress and their staffs walk this platform daily","Orange, Silver, Blue. Capitol Hill. The dome is visible from the entrance. This is the workday stop for democracy."],
  "Eastern Market":["The historic public market here has run continuously since 1873 — fresh produce, local art, and Saturday crowds since before DC had a Metro","Orange, Silver, Blue. The market is a few blocks east. Capitol Hill neighborhood. Beloved institution."],
  "Potomac Ave":["Quieter Capitol Hill residential streets — the kind of blocks with rowhouses and Hill staffers walking dogs","Orange, Silver, Blue. Residential Capitol Hill. One stop past Eastern Market."],
  "Stadium-Armory":["RFK Stadium's old footprint — once home to the Redskins and DC United, possibly future home to a new NFL stadium","Orange, Silver, Blue. The stadium site is right there. History and maybe future history."],
  "Union Station":["DC's Amtrak hub — Acela, Northeast Regional, and trains to everywhere depart from this Beaux-Arts masterpiece","Red Line. The station is enormous and gorgeous. The food hall alone is worth the trip."],
  "Dupont Circle":["The heart of DC's restaurant scene, gallery district, and LGBTQ+ community — the neighborhood everybody wants to live in","Red Line. The circular park here has a famous fountain at its center. Every cuisine, every kind of person. Very DC."],
  "Woodley Park-Zoo/Adams Morgan":["The Smithsonian National Zoo is uphill from this station — free, and one of the best in the world","Red Line. The zoo is the landmark. Adams Morgan nightlife is a walk in the other direction."],
  "Cleveland Park":["President Grover Cleveland had his summer home here — a quiet upscale neighborhood that's stayed quiet","Red Line. Residential, leafy. The Uptown Theatre is a neighborhood landmark."],
  "Van Ness-UDC":["DC's only public university — University of the District of Columbia — is your campus here","Red Line. UDC. Van Ness neighborhood. This is DC's undersung university stop."],
  "Tenleytown-AU":["American University's international affairs school is the landmark — diplomats of the future study here","Red Line. Tenleytown. American University. AU's School of International Service is known worldwide."],
  "Friendship Heights":["The DC-Maryland border runs right through this shopping district — Chevy Chase, Lord & Taylor, upscale retail","Red Line. The boundary between DC and Montgomery County. High-end shopping, suburban feel."],
  "Foggy Bottom-GWU":["George Washington University, the State Department, and the Kennedy Center — this station serves the foreign policy world","Orange, Silver, Blue. Foggy Bottom. GWU students, State Dept workers, and Kennedy Center regulars all use this stop."],
  "U Street/Afr-Amer Civil War Memorial":["Black Broadway — Duke Ellington grew up blocks from here, and the jazz clubs that shaped American music were on this street","Yellow, Green. U Street corridor. The African American Civil War Memorial is right here. Lincoln Theatre is around the corner."],
  "Shaw-Howard University":["Howard University, founded in 1867, is one of the most historically significant HBCUs in America — you're at their Metro stop","Yellow, Green. Shaw neighborhood. Howard's campus is up the hill. Half the prominent Black Americans in history went here."],
  "Columbia Heights":["One of DC's most diverse and vibrant neighborhoods — a gateway community for Latino, Caribbean, and African communities","Yellow, Green. The Giant food store plaza is the landmark. DC's melting pot neighborhood."],
  "Georgia Ave-Petworth":["Petworth is one of DC's fastest-changing neighborhoods — historic character meeting new development in real time","Yellow, Green. Petworth. Georgia Avenue. The neighborhood debate about change is happening loudly here."],
  "New York Ave-Florida Ave-Gallaudet U":["The first new Metro station built in DC in over a decade when it opened in 2004 — NoMa before NoMa was a thing","Red Line. NoMa neighborhood. Gallaudet University — the world's leading university for Deaf students — is nearby."],
  "Rhode Island Ave-Brentwood":["One of Metro's original 1976 stations anchoring the Rhode Island Avenue corridor in northeast DC","Red Line. Rhode Island Ave. One of the original stops. NE DC, working-class neighborhood."],
  "Brookland-CUA":["Catholic University of America is your campus — the neighborhood is literally called 'Little Rome' for its concentration of Catholic institutions","Red Line. CUA. More Catholic institutions per square mile than almost anywhere in the United States."],
  "Fort Totten":["One of only two stations where the Red Line meets the Yellow and Green Lines — essential transfer point","Red, Yellow, Green. Civil War fortification remnants are nearby. Key cross-system transfer point."],
  "Anacostia":["Frederick Douglass spent his final years in a house you can visit near this station — it's now a National Historic Site","Green Line. Historic neighborhood east of the river. Frederick Douglass National Historic Site. Cedar Hill."],
  "Congress Heights":["One of DC's most historic communities east of the Anacostia River — underserved by transit for decades, now connected","Green Line. SE DC. The neighborhood has been advocating for better transit for years."],
  "Southern Avenue":["The street here literally marks the boundary between Washington DC and Prince George's County, Maryland","Green Line. The DC-Maryland line. PG County begins here."],
  "Naylor Road":["One of the quieter stations on the Green Line's southern branch — residential SE DC","Green Line. SE Washington. Not many people getting off here who don't live nearby."],
  "Suitland":["The US Census Bureau headquarters is here — the people who count America work in this community","Green Line. PG County. Census Bureau. They counted you from this building."],
  "Branch Ave":["Southern terminus of the Green Line — end of the line in Prince George's County","Green Line southern terminus. PG County. You can't go further south on Metro."],
  "Medical Center":["The National Institutes of Health campus — the largest biomedical research facility in the world — is right here","Red Line. NIH. Walter Reed National Military hospital is also here. Science and medicine."],
  "Bethesda":["One of the wealthiest communities in America has one of the Metro system's most vibrant downtowns — this is it","Red Line. Downtown on Wisconsin Avenue. Restaurants, boutiques, money. Montgomery County's showpiece."],
  "Grosvenor-Strathmore":["Strathmore Music Center is one of the DC region's premier performing arts venues — this is its Metro stop","Red Line. Grosvenor. Strathmore. If you're seeing a concert in Montgomery County, this is often how you get there."],
  "White Flint":["Pike & Rose — one of Maryland's largest mixed-use transit-oriented developments — is this station's big project","Red Line. Pike & Rose development. Rockville Pike corridor."],
  "Twinbrook":["One of Montgomery County's most affordable and diverse residential neighborhoods — the kind Metro was built for","Red Line. Rockville area. Diverse, accessible, understated."],
  "Rockville":["The county seat of Montgomery County — Maryland's most populous county — has a solid little downtown here","Red Line. County seat. MARC train also stops nearby."],
  "Shady Grove":["Northwestern terminus of the Red Line — the gateway to Montgomery County's biotech and tech corridor","Red Line western terminus. The other end of the Red Line from Glenmont."],
  "Takoma":["This neighborhood is so politically progressive they call it the 'People's Republic' — affectionately","Red Line. Park side on the DC/Maryland border. Cooperative groceries, yard signs, very much its own thing."],
  "Silver Spring":["This downtown has transformed into one of the DC region's most vibrant dining and entertainment scenes in 20 years","Red Line. Downtown outside the Beltway. The AFI Silver Theatre is here. It went from declining mall to destination."],
  "Forest Glen":["196 feet underground and there are no escalators — only elevators. One of the deepest stations in Metro.","Red Line. You descend by elevator only. The depth is legitimately disorienting."],
  "Wheaton":["The longest escalator in the Western Hemisphere is at this station — 230 feet, takes 2.5 minutes to ride","Red Line. The escalator is the experience. Ride it. It takes longer than you expect."],
  "Glenmont":["Northern terminus of the Red Line — the end of the line in Silver Spring, Maryland","Red Line northern terminus. The other end from Shady Grove."],
  "New Carrollton":["Major regional hub where Metro, Amtrak, and MARC commuter rail all converge — gateway to Prince George's County","Orange, Silver. The Amtrak connection makes this a real inter-city hub."],
  "Landover":["Suburban Prince George's County — one of the lower-ridership Orange Line stations","Orange Line. PG County. FedEx Field is nearby."],
  "Cheverly":["One of the first planned communities in the DC region — incorporated in 1939, it still feels like a small town","Orange Line. Tiny incorporated town. Historic planned community."],
  "Deanwood":["One of Washington's oldest African American neighborhoods — this community has been here since the 1890s","Orange Line. NE DC. Historical African American neighborhood with deep roots."],
  "Minnesota Ave":["The eastern edge of Washington DC — a corridor in the far northeast where the city boundary with Maryland is very close","Orange Line. Eastern DC edge."],
  "Benning Road":["The road here marks the boundary between eastern DC and Prince George's County","Blue, Silver. Eastern edge. Stadium-Armory is nearby."],
  "Capitol Heights":["Just across the DC border in Prince George's County — close enough to feel like DC, technically Maryland","Blue, Silver. PG County suburb."],
  "Addison Road-Seat Pleasant":["Seat Pleasant is one of the older incorporated municipalities in Prince George's County","Blue, Silver. Seat Pleasant. Addison Road. Historic PG County community."],
  "Morgan Boulevard":["Opened in 2004 as part of the Blue Line's extension toward Largo — outer Prince George's County","Blue, Silver. Morgan Blvd. Opened 2004. FedEx Field is nearby."],
  "Largo Town Center":["Eastern terminus of both the Blue and Silver Lines — end of the line in Prince George's County","Blue, Silver eastern terminus. PG County. The mall anchors this end of the line."],
  "West Hyattsville":["A PG County suburb at the start of the Yellow/Green line's suburban stretch — gateway to University of Maryland territory","Yellow, Green. Just inside Prince George's County — the urban density of DC gives way to suburban scale here."],
  "Hyattsville Crossing":["Renamed from Prince George's Plaza in 2023 — one of Maryland's largest shopping centers anchors this stop","Yellow, Green. PG County. The mall reopened with major updates — the station name change marked a new chapter for the corridor."],
  "College Park-U of MD":["Maryland's flagship state university — one of the nation's top public research institutions — is right here","Yellow, Green. Terrapins territory. The campus is enormous and walkable from the station."],
  "Greenbelt":["NASA's Goddard Space Flight Center is nearby — the people who track satellites work just down the road","Yellow, Green northern terminus. NASA Goddard. Space science happens here."],
  "Rosslyn":["The gateway to Virginia — this station's distinctive office tower skyline marks where DC ends and Arlington begins","Orange, Silver, Blue. Right across the Potomac. The Key Bridge is nearby."],
  "Court House":["Arlington County courthouse and government offices — Arlington is one of the most densely populated counties in America","Orange, Silver, Blue. Arlington County government. Dense, walkable, DC-adjacent."],
  "Clarendon":["One of the DC area's top dining and nightlife corridors — this station has bars, restaurants, and bars about those bars","Orange, Silver, Blue. Wilson Blvd. The bar scene here is legendary among DC-area twentysomethings."],
  "Virginia Square-GMU":["George Mason University's Arlington campus is your institution here","Orange, Silver, Blue. Virginia Square. GMU Arlington. Policy school territory."],
  "Ballston-MU":["Ballston is one of the DC region's most celebrated transit-oriented development success stories — mixed-use, dense, walkable","Orange, Silver, Blue. Ballston. Marymount University nearby. The development here is the textbook example."],
  "East Falls Church":["The boundary between Arlington County and the City of Falls Church — key park-and-ride transfer point","Orange, Silver. The park-and-ride fills up with Fairfax County commuters."],
  "Pentagon":["The world's largest office building is your landmark — the US Department of Defense employs 23,000 people here","Blue, Yellow. DoD HQ. Security is not subtle around this station."],
  "Pentagon City":["The underground mall here connects directly to the platform — Amazon HQ2 is nearby in Crystal City","Blue, Yellow. Underground mall connection. Amazon territory starts here."],
  "Crystal City":["Amazon chose this neighborhood for HQ2 — before that it was just very well-connected DC office space","Blue, Yellow. Amazon HQ2. Very transit-rich, very suited to Amazon's commuter culture."],
  "Reagan National Airport":["One of the few US airports with a direct downtown subway connection — no shuttle, no tram, actual Metro","Blue, Yellow. Reagan National. DCA. The planes are visible from the platform and that's not an exaggeration."],
  "Arlington Cemetery":["Arlington National Cemetery — 400,000 veterans, including President Kennedy — is steps from this platform","Blue Line. The Tomb of the Unknown Soldier is here. Changing of the guard happens daily."],
  "Braddock Road":["Del Ray neighborhood in Alexandria — eclectic small-business corridor, local restaurants, very anti-chain","Blue, Yellow. Del Ray. The kind of Alexandria neighborhood that locals keep to themselves."],
  "Potomac Yard":["The newest station in the entire DC Metro system — opened May 2023, serving Virginia Tech's Innovation Campus","Blue, Yellow. Newest station. Virginia Tech Innovation Campus. Opened 2023."],
  "King Street-Old Town":["Old Town Alexandria — one of the best-preserved 18th-century streetscapes in America, founded 1749","Blue, Yellow. Old Town. King Street. The waterfront is a short walk. History, cobblestones, and a lot of good wine bars."],
  "Eisenhower Avenue":["Eisenhower Valley in Alexandria — named for the general who was also President — growing tech corridor","Yellow Line. Eisenhower Ave. Alexandria's tech and office corridor. The WMATA yard is nearby."],
  "Huntington":["Southern terminus of the Yellow Line — the end of the line in Fairfax County near Alexandria","Yellow Line southern terminus. Fairfax County. From here it's buses or driving."],
  "Van Dorn Street":["One of the quieter western Alexandria stations — popular with park-and-ride commuters from Fairfax","Blue Line. Van Dorn St. Western Alexandria. Low-key, park-and-ride crowd."],
  "Franconia-Springfield":["Western terminus of the Blue Line — the I-95/I-495 interchange is your landmark","Blue Line western terminus. The mixing bowl interchange. End of the line."],
  "West Falls Church-VT/UVA":["Virginia Tech and UVA operate graduate campuses here — the academic extension corridor","Orange, Silver. West Falls Church. VT and UVA. Academic outpost in Northern Virginia."],
  "Dunn Loring-Merrifield":["The Mosaic District — a major mixed-use development with Angelika Film Center and local restaurants — is your landmark","Orange, Silver. Merrifield. Mosaic District. The good Fairfax shopping."],
  "Vienna/Fairfax-GMU":["Western terminus of the Orange Line — one of Metro's most heavily used park-and-ride stations","Orange Line western terminus. Vienna. GMU is nearby. The park-and-ride lot is massive."],
  "McLean":["First Silver Line station after crossing into Tysons — the start of the Tysons transformation","Silver Line. Gateway to Tysons. The commercial corridor here feels like a different world from DC."],
  "Tysons Corner":["Virginia's largest shopping mall is your landmark — the Silver Line transformed how people get to this suburban behemoth","Silver Line. The mall. Retail therapy, Northern Virginia edition."],
  "Greensboro":["Part of the Tysons transformation — Fairfax County's plan to turn the car-dependent suburb into a walkable district","Silver Line. Tysons Corner. One of four Silver Line Tysons stations."],
  "Spring Hill":["Outer Tysons Corner — the Silver Line reaches deep into what was pure car-dependent suburbia","Silver Line. Outer Tysons. Fairfax County."],
  "Wiehle-Reston East":["End of the Silver Line Phase 1 from 2014 to 2022 — eight years as the terminus before Dulles finally got connected","Silver Line. The station that waited for Dulles. Eastern Reston."],
  "Reston Town Center":["Robert Simon's planned community from 1964 finally connected to DC by Metro in 2022 — better late than never","Silver Line. Robert Simon's vision. The 'town center' concept was revolutionary in 1964."],
  "Herndon":["Historic Northern Virginia town — now firmly part of the tech corridor stretching toward Dulles","Silver Line. A historic town, surrounded by tech campuses — commuters outnumber locals."],
  "Innovation Center":["The Dulles Technology Corridor is your context — aerospace, defense, and tech companies cluster here","Silver Line. Dulles Tech Corridor. Aerospace and government contractors."],
  "Dulles International Airport":["After decades of waiting — and decades of debate — Dulles Airport finally got Metro service in 2022","Silver Line. Dulles Airport. IAD. The airport that waited for the Silver Line longer than anyone thought reasonable."],
  "Ashburn":["The western terminus of the entire Silver Line — also home to the world's largest concentration of data centers","Silver Line western terminus. Data center capital of the world. Loudoun County."],
};

const STATE_HINTS:Record<string,[string,string]>={
  "Maine":["90% of America's lobster comes from this state — if you've had a lobster roll, this state made it possible","The easternmost state in the US, and the first to see sunrise. Stephen King sets most of his horror novels here."],
  "New Hampshire":["The first colony to declare independence from Britain — months before the Declaration of Independence was even signed","Live Free or Die. No income tax, no sales tax, and a presidential primary every four years that the whole country watches."],
  "Vermont":["The largest maple syrup producer in the US — if it's real maple syrup, there's a good chance it came from here","Bernie Sanders represented this state for decades. Ben & Jerry's was founded here. Small, progressive, and very dairy-forward."],
  "Massachusetts":["Home of Harvard, MIT, and the American Revolution — three things that shaped the modern world from one state","The Red Sox, Celtics, Patriots, and Bruins all play here. Boston cream pie is the official state dessert. Dunkin' is religion."],
  "Rhode Island":["The smallest state in America has over 400 miles of coastline — more coast per square mile than almost any state","The last state to ratify the US Constitution — it held out until 1790, two years after everyone else. Tiny but stubborn."],
  "Connecticut":["Insurance capital of the world — Hartford is where America's insurance industry was basically invented","Yale is here. ESPN is headquartered here. And somehow it's the state that quietly runs some of America's oldest institutions."],
  "New York":["The state that contains the country's most famous city plus Niagara Falls — most people forget there are 19 million people outside that city","First US capital under the Constitution. Four NFL teams, two MLB teams, two NBA teams — all in one state. Times Square. The Adirondacks."],
  "New Jersey":["The most densely packed state in America — and the state that invented the diner, the phonograph, and the light bulb","Bruce Springsteen, Bon Jovi, Frank Sinatra — NJ has produced more rock legends than it gets credit for. Also: real pizza."],
  "Pennsylvania":["Philadelphia was the US capital for a decade — the Declaration of Independence was signed in this state","Rocky is from here. The Philly cheesesteak. The Pittsburgh Steelers' six Super Bowl titles. Hershey's chocolate. Groundhog Day."],
  "Delaware":["The first state to ratify the US Constitution — December 7, 1787 — which is why it calls itself the First State","More corporations are legally incorporated here than in any other state. Tiny state, enormous legal footprint."],
  "Maryland":["The Star-Spangled Banner was written during the Battle of Baltimore in this state — the anthem was written here","Old Bay seasoning and blue crabs are the state religion. Johns Hopkins is here. The Naval Academy is in Annapolis."],
  "Virginia":["More US presidents were born here than any other state — eight, including Washington, Jefferson, and Madison","The Pentagon is here. Arlington Cemetery is here. So is Colonial Williamsburg and the Shenandoah Valley."],
  "West Virginia":["The only state formed by breaking off from a neighboring state during the Civil War — it refused to secede with that neighbor","Almost entirely mountains. John Denver wrote 'Take Me Home, Country Roads' about this state. Coal and bluegrass music."],
  "North Carolina":["The Wright Brothers made the world's first powered airplane flight at Kitty Hawk in this state in 1903","Michael Jordan is from here. Research Triangle Park is one of the country's biggest tech hubs. Barbecue is a serious religion."],
  "South Carolina":["The first state to secede from the Union in December 1860 — the Civil War essentially started here","Sweet tea, peaches, and the Grand Strand. Clemson-Carolina is one of the most intense college football rivalries in the South."],
  "Georgia":["Hartsfield-Jackson Atlanta International is the busiest passenger airport in the world — and it's in this state","Coca-Cola was invented here. CNN is headquartered here. The Braves, Falcons, and Hawks all play here. REM and Outkast are from here."],
  "Florida":["The longest coastline of any contiguous state — and the home of Disney World, the Kennedy Space Center, and countless bizarre internet crime headlines","Miami, Orlando, Tampa, Jacksonville — it's basically four cities stapled together. Alligators in suburban pools are a real thing."],
  "Alabama":["Rosa Parks refused to give up her bus seat in Montgomery in 1955, starting the civil rights movement — that happened here","College football is the state religion. Nick Saban. The Iron Bowl. Also: Muscle Shoals, where the Rolling Stones recorded."],
  "Mississippi":["Birthplace of the blues — the musical tradition that gave birth to rock and roll, jazz, and soul started here","The poorest state by income, but culturally one of the richest. Elvis Presley was born in Tupelo. Robert Johnson. B.B. King."],
  "Tennessee":["Nashville is the capital of country music; Memphis is where rock and roll and soul were born — no state has shaped American music more","Dolly Parton is from here. Elvis lived and died in Memphis. Jack Daniel's is made here. The Smoky Mountains are spectacular."],
  "Kentucky":["95% of the world's bourbon whiskey is made in this state — if it's bourbon, it's probably from here","The world's most famous horse race runs here every May — the most famous two minutes in sports. Mammoth Cave is the world's longest known cave system. Fried chicken."],
  "Arkansas":["The only US state with a commercial diamond mine where visitors can dig and keep what they find","Walmart was founded here in Bentonville. Bill Clinton is from Hope. The Ozarks start here. Crystal Bridges Museum is world-class."],
  "Louisiana":["The only US state with parishes instead of counties — a legacy of French and Spanish colonial rule","Mardi Gras. Jazz music. Cajun and Creole cuisine. The most unique food culture of any US state. Beignets at Café Du Monde."],
  "Ohio":["This state has produced more presidents born in-state than almost any other — Grant, Hayes, Garfield, Harrison, McKinley, Taft, and Harding all called it home","LeBron James, Neil Armstrong, and John Glenn are all from this state. The Rock and Roll Hall of Fame is in Cleveland."],
  "Michigan":["The only US state with two separate land masses — the Upper and Lower Peninsula, connected by the Mackinac Bridge","Detroit invented the American automobile industry. Motown Records changed music. The Great Lakes border this state on three sides."],
  "Indiana":["The Indy 500 — the world's largest single-day sporting event — happens at a legendary Midwestern oval every Memorial Day weekend","Larry Bird is from here. John Mellencamp is from here. The corn is everywhere. Race day crowds top 300,000 people."],
  "Illinois":["Chicago has more drawbridges than any other city in the world — and they're all in this state","Deep dish pizza. The Chicago Bulls dynasty. Obama's political career launched here. Springfield is Lincoln's hometown."],
  "Wisconsin":["America's Dairyland — this state makes 26% of all US cheese — and they wear cheese on their heads at Packers games","Green Bay Packers are the only community-owned franchise in major US sports. Summerfest is the world's largest music festival."],
  "Minnesota":["This state has more shoreline than three of the most coastal states combined — '10,000 lakes' is actually an undercount","Prince is from Minneapolis. The Mall of America is here. Garrison Keillor's Prairie Home Companion. Brutal winters, cheerful people."],
  "Iowa":["This state produces more corn than any other and feeds a significant portion of the world's population","The presidential caucuses here kick off every primary season. Field of Dreams was filmed here. Excellent pork tenderloin sandwiches."],
  "Missouri":["The Gateway Arch in St. Louis is the tallest man-made monument in the Western Hemisphere at 630 feet","Route 66 starts in Chicago and passes through here. Kansas City barbecue is world-famous. Harry Truman was from Independence."],
  "North Dakota":["The least-visited US state — but it produces more oil per capita than any other state and has a huge budget surplus","Theodore Roosevelt ranched here and it changed him. The Badlands are spectacular. Very flat, very cold, very underrated."],
  "South Dakota":["Mount Rushmore took 14 years to carve and was completed in 1941 — four presidents' faces in the Black Hills","The Badlands National Park. Crazy Horse Memorial (larger than Rushmore, still being carved). Wall Drug signs. Sturgis motorcycle rally."],
  "Nebraska":["This state has more miles of rivers than any other — over 10,000 miles of flowing water","Omaha Steaks. Warren Buffett lives in Omaha in the same house he bought in 1958. Runza sandwiches. Cornhuskers football."],
  "Kansas":["The geographic center of the contiguous 48 states lies here — a small town in this state marks the exact middle","Dorothy's from here. The Wizard of Oz was set here. Sunflowers everywhere in summer. BBQ and wheat fields."],
  "Texas":["This state was an independent republic for 10 years before joining the US — and it never quite forgot that","Biggest state in the lower 48. The Cowboys, Astros, Spurs, Longhorns. Tex-Mex. Blue Bell ice cream. Don't mess with it."],
  "Oklahoma":["This state has more tornadoes per square mile than any other on Earth","Route 66 passes through here. Woody Guthrie was from Okemah. The Land Run of 1889. Native American cultural heritage."],
  "New Mexico":["Santa Fe, founded in 1610, is the oldest state capital in the US — over 400 years old","Georgia O'Keeffe painted here. Breaking Bad and Better Call Saul were filmed here. Green chile is a religion."],
  "Arizona":["The Grand Canyon is one of the Seven Natural Wonders of the World — and it's entirely within this state","Phoenix is the hottest major city in the US. Sedona's red rocks. The Suns, Cardinals, Coyotes, and Diamondbacks all play here."],
  "Montana":["Three times more cattle than people, and the largest grizzly bear population in the lower 48 states","Big Sky Country. Yellowstone's northern entrance is here. The mountains are genuinely overwhelming. Very few traffic lights."],
  "Idaho":["This state produces one-third of all potatoes grown in the United States — the Russet Burbank was bred here","Boise is one of the fastest-growing cities in America. Sun Valley is a world-class ski resort. Hells Canyon is deeper than the Grand Canyon."],
  "Wyoming":["The first state to grant women the right to vote, in 1869 — over 50 years before the 19th Amendment","Yellowstone National Park is mostly in this state. Devils Tower. Jackson Hole. More pronghorn antelope than people."],
  "Colorado":["This state has 58 mountain peaks over 14,000 feet — more than any other state — called 'fourteeners'","Skiing in Vail and Aspen. First state to legalize recreational marijuana. Denver Broncos. Coors beer. Red Rocks Amphitheatre."],
  "Utah":["The Great Salt Lake is up to 8 times saltier than the ocean — you can float without swimming","Five national parks: Zion, Bryce, Arches, Canyonlands, Capitol Reef. The Mormon Tabernacle Choir. Sundance Film Festival."],
  "Nevada":["The driest state in the US at 7 inches of rain per year — and home to Las Vegas, the most water-wasteful city","Las Vegas. Area 51. The Hoover Dam. Gambling revenue funds most of this state's government."],
  "Washington":["This state produces 70% of all the apples grown in the United States","Starbucks was founded in Seattle. Amazon, Microsoft, and Boeing are all headquartered here. Mount Rainier. Nirvana is from here."],
  "Oregon":["The only US state flag with a different design on each side — a beaver on one side, the state seal on the other","Nike was founded here. Powell's Books in Portland is the world's largest independent bookstore. Crater Lake is 1,943 feet deep."],
  "California":["If this state were a country, it would have the 5th largest economy in the world — bigger than the UK","Hollywood. Silicon Valley. Napa Valley wine. In-N-Out Burger. The Golden Gate Bridge. 40 million people."],
  "Alaska":["This state has more coastline than all other US states combined — 33,904 miles of tidal shoreline","The midnight sun in summer, the Northern Lights in winter. Brown bears, moose, and bald eagles everywhere. Iditarod sled race."],
  "Hawaii":["The only US state that grows coffee commercially — Kona coffee comes from the Big Island","The only island state. Eight main islands. Active volcanoes. Lilo & Stitch was set here. Obama was born here."],
};

function generateHints(target:any,gameKey:string):[string,string]{
  // hint1 = broad cultural clue (never reveals the name)
  // hint2 = structural data clue built only from data fields — never contains target.name, city, or capital
  if(gameKey==="nfl"){
    const cultural=(NFL_HINTS[target.name]||["",""])[0]||`${target.conf} Conference · ${target.div} Division`;
    const sb=target.sb===0?"0 Super Bowl wins":target.sb===1?"1 Super Bowl win":`${target.sb} Super Bowl wins`;
    const structural=`${target.conf} Conference · ${target.div} Division · ${target.region} region · ${sb} · Est. ${target.year}`;
    return[cultural,structural];
  }
  if(gameKey==="states"){
    const cultural=(STATE_HINTS[target.name]||["",""])[0]||`${target.region} region state`;
    const pop=target.pop<=2?"small state (under 3M people)":target.pop<=3?"mid-size state (3–7M)":target.pop===4?"large state (7–15M)":"major state (15M+)";
    const coast=target.coast==="Both"?"borders both coasts":target.coast==="None"?"landlocked":target.coast==="East"?"East Coast state":"West Coast state";
    const structural=`${target.region} · ${coast} · ${pop} · Admitted ${target.year}`;
    return[cultural,structural];
  }
  // Transit games — get cultural hint from the hints dict (index 0 only, safe)
  let cultural:string|null=null;
  if(gameKey==="la"){cultural=(LA_HINTS[target.name]||["",""])[0]||null;}
  else if(gameKey==="nyc"){cultural=(NYC_HINTS[target.name]||["",""])[0]||null;}
  else if(gameKey==="chi"){cultural=(CHI_HINTS[target.name]||["",""])[0]||null;}
  else if(gameKey==="pdx"){cultural=(PDX_HINTS[target.name]||["",""])[0]||null;}
  else if(gameKey==="dc"){cultural=(DC_HINTS[target.name]||["",""])[0]||null;}
  // Safe structural hint from data fields only
  const decade=`${Math.floor((target.year||2000)/10)*10}s`;
  const traffic=target.traffic>=4?"very busy stop":target.traffic>=3?"moderately busy":"a quieter stop";
  const lines=Array.isArray(target.lines)&&target.lines.length?`Lines: ${target.lines.join(", ")} · `:"";
  const zone=target.zone?`Zone: ${target.zone} · `:"";
  const structural=`${lines}${zone}Opened: ${decade} · ${traffic}`;
  const fallbackCultural=`${zone.replace(" · ","").trim()||"Transit station"} · Opened in the ${decade}`;
  return[cultural||fallbackCultural,structural];
}

// ── MAP PEEK ─────────────────────────────────────────────────────────────────
const PEEK_LINES:Record<string,{name:string,color:string,start:string,end:string}[]>={
  pdx:[
    {name:"Blue",  color:"#0066CC",start:"Hillsboro",          end:"Gresham"},
    {name:"Red",   color:"#CC0000",start:"Beaverton TC",        end:"PDX Airport"},
    {name:"Green", color:"#009933",start:"City Center",         end:"Clackamas TC"},
    {name:"Orange",color:"#FF6600",start:"S Waterfront",        end:"Milwaukie"},
    {name:"Yellow",color:"#FFCC00",start:"Expo Center",         end:"City Center"},
  ],
  dc:[
    {name:"Red",   color:"#BF0000",start:"Shady Grove",         end:"Glenmont"},
    {name:"Blue",  color:"#0066CC",start:"Franconia-Springfield",end:"Largo TC"},
    {name:"Orange",color:"#FF8000",start:"Vienna",              end:"New Carrollton"},
    {name:"Silver",color:"#A0A8B0",start:"Ashburn",             end:"Largo TC"},
    {name:"Green", color:"#009933",start:"Branch Ave",          end:"Greenbelt"},
    {name:"Yellow",color:"#CCAA00",start:"Huntington",          end:"Greenbelt"},
  ],
  balt:[
    {name:"Metro",      color:"#003087",start:"Owings Mills",end:"Johns Hopkins Hosp"},
    {name:"Light Rail", color:"#F0A500",start:"Hunt Valley", end:"Cromwell / Glen Burnie"},
  ],
  nyc:[
    {name:"1/2/3",  color:"#EE352E",start:"South Ferry",      end:"Van Cortlandt/Wakefield"},
    {name:"4/5/6",  color:"#00933C",start:"Bowling Green",    end:"Pelham Bay/Woodlawn"},
    {name:"A/C/E",  color:"#0039A6",start:"Far Rockaway",     end:"Inwood-207 St"},
    {name:"B/D/F/M",color:"#FF6319",start:"Coney Island",     end:"Norwood/Jamaica"},
    {name:"N/Q/R/W",color:"#FCCC0A",start:"Bay Ridge-95 St",  end:"Astoria-Ditmars Blvd"},
    {name:"L",      color:"#A7A9AC",start:"8 Av",             end:"Canarsie-Rockaway Pkwy"},
    {name:"7",      color:"#B933AD",start:"34 St-Hudson Yards",end:"Flushing-Main St"},
  ],
  chi:[
    {name:"Red",   color:"#C60C30",start:"95th/Dan Ryan",     end:"Howard"},
    {name:"Blue",  color:"#00A1DE",start:"Forest Park",       end:"O'Hare"},
    {name:"Brown", color:"#62361B",start:"Kimball",           end:"Loop"},
    {name:"Green", color:"#009B3A",start:"Harlem/Lake",       end:"Cottage Grove"},
    {name:"Orange",color:"#F9461C",start:"Midway",            end:"Loop"},
    {name:"Pink",  color:"#E27EA6",start:"54th/Cermak",       end:"Loop"},
    {name:"Purple",color:"#522398",start:"Linden",            end:"Howard"},
  ],
};
const PEEK_POS:Record<string,Record<string,Record<string,number>>>={
  pdx:{
    Blue:   {"SW Portland":0.27,"Downtown Portland":0.46,"Lloyd District":0.58,"NE Portland":0.70,"East Portland":0.80,"Gresham":0.93},
    Red:    {"SW Portland":0.22,"Downtown Portland":0.46,"Lloyd District":0.60,"Airport":0.92},
    Green:  {"Downtown Portland":0.12,"Inner East":0.32,"SE Portland":0.55,"Milwaukie":0.82},
    Orange: {"SW Portland":0.08,"Inner East":0.28,"SE Portland":0.56,"Milwaukie":0.84},
    Yellow: {"North Portland":0.22,"Lloyd District":0.68,"Downtown Portland":0.88},
  },
  dc:{
    Red:   {"Montgomery County MD":0.12,"NW DC":0.28,"Downtown DC":0.48,"Columbia Heights":0.53,"Capitol Hill":0.57,"NE DC":0.68,"Prince George's County MD":0.80},
    Blue:  {"Fairfax VA":0.10,"Alexandria VA":0.20,"Arlington VA":0.30,"NW DC":0.40,"Penn Quarter/SW":0.47,"Downtown DC":0.50,"Capitol Hill":0.58,"Prince George's County MD":0.88},
    Orange:{"Fairfax VA":0.08,"Arlington VA":0.28,"NW DC":0.40,"Downtown DC":0.50,"Capitol Hill":0.58,"Prince George's County MD":0.88},
    Silver:{"Tysons/Dulles VA":0.05,"Fairfax VA":0.14,"Arlington VA":0.28,"NW DC":0.40,"Downtown DC":0.50,"Capitol Hill":0.58,"Prince George's County MD":0.88},
    Green: {"SE DC":0.10,"Capitol Hill":0.24,"Penn Quarter/SW":0.37,"Downtown DC":0.45,"Columbia Heights":0.56,"NE DC":0.68,"Prince George's County MD":0.88},
    Yellow:{"Alexandria VA":0.10,"Arlington VA":0.20,"Penn Quarter/SW":0.38,"Downtown DC":0.46,"Columbia Heights":0.57,"NE DC":0.70,"Prince George's County MD":0.88},
  },
  balt:{
    Metro:       {"Baltimore County N":0.08,"Northwest Baltimore":0.25,"North Baltimore":0.38,"Midtown":0.55,"Downtown":0.68,"East Baltimore":0.90},
    "Light Rail":{"Baltimore County N":0.08,"North Baltimore":0.28,"Midtown":0.50,"Downtown":0.62,"South Baltimore":0.75,"BWI Corridor":0.88},
  },
  nyc:{
    "1/2/3": {"Bronx":0.10,"Manhattan":0.50,"Brooklyn":0.85},
    "4/5/6": {"Bronx":0.12,"Manhattan":0.48,"Queens":0.78},
    "A/C/E": {"Manhattan":0.40,"Brooklyn":0.65,"Queens":0.72},
    "B/D/F/M":{"Manhattan":0.42,"Brooklyn":0.70,"Queens":0.82},
    "N/Q/R/W":{"Manhattan":0.38,"Brooklyn":0.62,"Queens":0.78},
    "L":     {"Manhattan":0.22,"Brooklyn":0.75},
    "7":     {"Manhattan":0.30,"Queens":0.82},
  },
  chi:{
    "Red":   {"South":0.12,"Loop":0.40,"North":0.68,"North Shore":0.88},
    "Blue":  {"West":0.88,"Loop":0.55,"Northwest":0.22},
    "Brown": {"North Shore":0.92,"North":0.65,"Northwest":0.42,"Loop":0.12},
    "Green": {"West":0.12,"South":0.78,"Loop":0.45},
    "Orange":{"Southwest":0.82,"Loop":0.15},
    "Pink":  {"West":0.82,"Northwest":0.50,"Loop":0.12},
    "Purple":{"North Shore":0.90,"North":0.60,"Loop":0.15},
  },
};
function getPeekPos(zone:string,lineName:string,gk:string):number{
  const p=PEEK_POS[gk]?.[lineName]?.[zone];
  if(p!==undefined)return p;
  const fallback:Record<string,number>={"Downtown Portland":0.48,"Downtown DC":0.50,"Downtown":0.62,"Midtown":0.53,"NW DC":0.30,"Arlington VA":0.28,"Alexandria VA":0.20,"Virginia":0.20,"Maryland":0.80,"NE DC":0.68,"SE DC":0.10};
  return fallback[zone]??0.50;
}

// ── SOUND ENGINE ─────────────────────────────────────────────────────────────
const SoundEngine=(()=>{
  let ctx:AudioContext|null=null;
  let enabled=true;
  function ac():AudioContext{
    if(!ctx)ctx=new(window.AudioContext||(window as any).webkitAudioContext)();
    if(ctx.state==="suspended")ctx.resume();
    return ctx;
  }
  function tone(freq:number,type:OscillatorType,t:number,dur:number,vol:number,_ac:AudioContext){
    try{
      const o=_ac.createOscillator(),g=_ac.createGain();
      o.connect(g);g.connect(_ac.destination);
      o.type=type;o.frequency.setValueAtTime(freq,t);
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.start(t);o.stop(t+dur+0.02);
    }catch(e){}
  }
  const defs:{[k:string]:()=>void}={
    intro(){
      const a=ac(),t=a.currentTime;
      [[261.63,0],[329.63,.13],[392,.27],[523.25,.42],[659.25,.58],[783.99,.72]].forEach(([f,d])=>{
        tone(f as number,"sine",t+(d as number),.55,.16,a);
        tone((f as number)*2,"sine",t+(d as number),.3,.05,a);
      });
    },
    click(){const a=ac();tone(1100,"sine",a.currentTime,.05,.07,a);},
    select(){
      const a=ac(),t=a.currentTime;
      tone(440,"sine",t,.08,.12,a);tone(660,"sine",t+.07,.14,.12,a);
    },
    navigate(){
      const a=ac(),t=a.currentTime;
      tone(660,"sine",t,.07,.1,a);tone(880,"sine",t+.06,.1,.08,a);
    },
    guess(){const a=ac();tone(340,"triangle",a.currentTime,.07,.1,a);},
    correct(){
      const a=ac(),t=a.currentTime;
      [[523.25,0],[659.25,.1],[783.99,.2],[1046.5,.33]].forEach(([f,d])=>{
        tone(f as number,"sine",t+(d as number),.38,.18,a);
      });
    },
    win(){
      const a=ac(),t=a.currentTime;
      [[261.63,0],[329.63,.09],[392,.18],[523.25,.28],[659.25,.38],[783.99,.48],[1046.5,.6],[1318.5,.72]].forEach(([f,d])=>{
        tone(f as number,"sine",t+(d as number),.5,.18,a);
        tone((f as number)*1.5,"sine",t+(d as number),.35,.07,a);
      });
    },
    wrong(){
      const a=ac(),t=a.currentTime;
      tone(200,"sawtooth",t,.14,.1,a);tone(160,"sawtooth",t+.08,.18,.07,a);
    },
    lose(){
      const a=ac(),t=a.currentTime;
      [[392,0],[349,.15],[294,.31],[247,.5]].forEach(([f,d])=>tone(f as number,"sine",t+(d as number),.5,.14,a));
    },
    hint(){
      const a=ac(),t=a.currentTime;
      [[1046.5,0],[1318.5,.09],[1046.5,.18]].forEach(([f,d])=>tone(f as number,"sine",t+(d as number),.15,.1,a));
    },
    reveal(){const a=ac();tone(700+Math.random()*400,"sine",a.currentTime,.05,.06,a);},
    blitzStart(){
      const a=ac(),t=a.currentTime;
      [[523.25,0],[523.25,.09],[523.25,.18],[783.99,.29]].forEach(([f,d])=>tone(f as number,"square",t+(d as number),.12,.11,a));
    },
    blitzCorrect(){
      const a=ac(),t=a.currentTime;
      tone(783.99,"sine",t,.08,.14,a);tone(1046.5,"sine",t+.06,.1,.12,a);
    },
    blitzWrong(){const a=ac();tone(200,"sawtooth",a.currentTime,.12,.1,a);},
    tick(){const a=ac();tone(500+Math.floor(Math.random()*5)*80,"sine",a.currentTime,.04,.05,a);},
  };
  return{
    setEnabled(v:boolean){enabled=v;},
    play(name:string){if(!enabled)return;try{defs[name]?.();}catch(e){}},
    prime(){try{ac();}catch(e){}},
  };
})();

// ── STORAGE ───────────────────────────────────────────────────────────────────
async function sk(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
async function getFromStorage(k,def=null){try{const r=localStorage.getItem(k);return r?JSON.parse(r):def;}catch(e){return def;}}
const getStats=async(gk2:string)=>await getFromStorage(`${gk2}:stats`,{streak:0,played:0,wins:0,totalGuesses:0,dist:{1:0,2:0,3:0,4:0,5:0,6:0},hardWins:0,proWins:0,lastPlayed:null});
const saveStats=async(gk2:string,s:any)=>sk(`${gk2}:stats`,s);
const getTodayData=async(gk2:string,d:string)=>await getFromStorage(`${gk2}:today:${d}`,null);
const saveTodayData=async(gk2:string,d:string,data:any)=>sk(`${gk2}:today:${d}`,data);
const getProfile=async()=>await getFromStorage("app:profile",{name:"",emoji:"🎯",bio:"",optIn:false});
const saveProfile=async(p:any)=>sk("app:profile",p);
const getSettings=async()=>await getFromStorage("app:settings",{dark:false,colorblind:false,textSize:"medium",highContrast:false,sounds:true});
const saveSettings=async(s:any)=>sk("app:settings",s);
const getUnlocked=async(gk2:string)=>await getFromStorage(`${gk2}:ach`,[]);
const saveUnlocked=async(gk2:string,a:any)=>sk(`${gk2}:ach`,a);
const getBlitzBest=async(gk2:string)=>await getFromStorage(`${gk2}:blitz:best`,0);
const saveBlitzBest=async(gk2:string,n:number)=>sk(`${gk2}:blitz:best`,n);
const getPlayHistory=async(gk2:string)=>await getFromStorage(`${gk2}:history`,[]);
const savePlayHistory=async(gk2:string,h:any)=>sk(`${gk2}:history`,h);
const getLbSubmitted=async(key:string)=>await getFromStorage(`lb:submitted:${key}`,false);
const setLbSubmitted=async(key:string)=>sk(`lb:submitted:${key}`,true);
const getActivityLog=async():Promise<Record<number,number>>=>{try{const r=localStorage.getItem("tgg:activity");return r?JSON.parse(r):{};}catch{return {};}};
const markActivityDay=async(day:number)=>{try{const log=await getActivityLog();if(!log[day]){log[day]=1;localStorage.setItem("tgg:activity",JSON.stringify(log));}}catch{}};

// ── STREAK SHIELD HELPERS ──────────────────────────────────────────────────────
function getShieldYM(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function shieldAvailableForSupporter(){return!!localStorage.getItem("supporter_email")&&!localStorage.getItem(`tgg:shield:${getShieldYM()}`);}
function markShieldUsed(){localStorage.setItem(`tgg:shield:${getShieldYM()}`,"1");}
function daysSinceDate(dateStr:string){const[y,m,d]=dateStr.split("-").map(Number);const last=new Date(y,m-1,d);last.setHours(0,0,0,0);const now=new Date();now.setHours(0,0,0,0);return Math.round((now.getTime()-last.getTime())/86400000);}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function getToday(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getDayNum(){const n=new Date();return Math.floor((n.getTime()-new Date(n.getFullYear(),0,0).getTime())/86400000);}
function _h(n:number):number{let x=(n^0xdeadbeef)>>>0;x=Math.imul(x^(x>>>16),0x45d9f3b)>>>0;x=Math.imul(x^(x>>>13),0xc2b2ae35)>>>0;return(x^(x>>>16))>>>0;}
function _dayTargets(items:any[],day:number,gameKey:string):number[]{const gk=gameKey==="pdx"?1:gameKey==="dc"?2:gameKey==="nfl"?4:gameKey==="balt"?5:3;const base=_h(_h(day*48271)^_h(gk*22695477));const used=new Set<number>();const out:number[]=[];for(let a=0;out.length<Math.min(3,items.length)&&a<items.length*4;a++){const idx=(_h(base^_h(a+1)))%items.length;if(!used.has(idx)){used.add(idx);out.push(idx);}}return out;}
function getTarget(items:any[],gameKey:string,round:number){return items[_dayTargets(items,getDayNum(),gameKey)[round]??0];}
function getYesterday(items:any[],gameKey:string){return items[_dayTargets(items,getDayNum()-1,gameKey)[0]??0];}
function getDailyTrivia(questions:any[]){const day=getDayNum();const selected:any[]=[];const used=new Set<number>();for(let i=0;i<20&&selected.length<5;i++){const x=Math.abs((day*7+i)*1103515245+12345)&0x7fffffff;const idx=x%questions.length;if(!used.has(idx)){used.add(idx);selected.push({...questions[idx],id:idx});}}return selected;}

// ── THEME ─────────────────────────────────────────────────────────────────────
function getTheme(gameKey:string,settings:any={}){
  const G=GAMES[gameKey];
  const dark=settings.dark===true,hc=!!settings.highContrast,cb=!!settings.colorblind;
  const sz=settings.textSize||"medium",sm=sz==="small"?.88:sz==="large"?1.14:1;
  const accent=G.accent,accentB=dark?G.accentDark:G.accent;
  const bg=dark?G.bgDark:G.bgLight;
  const surface=dark?(gameKey==="pdx"?"#030d03":gameKey==="dc"?"#040916":gameKey==="nfl"?"#020814":gameKey==="balt"?"#01030f":"#040824"):(gameKey==="states"?"#f2f4fa":gameKey==="nfl"?"#eef2f8":gameKey==="balt"?"#eef1fa":"#f4f4f4");
  const card=dark?(gameKey==="pdx"?"#051a0f":gameKey==="dc"?"#060d20":gameKey==="nfl"?"#060c1a":gameKey==="balt"?"#050a20":"#060d20"):(gameKey==="states"?"#e8edf8":gameKey==="nfl"?"#dde6f2":gameKey==="balt"?"#dde4f5":"#ebebeb");
  const border=dark?(gameKey==="pdx"?"#0d1e0d":gameKey==="dc"?"#0a1428":gameKey==="nfl"?"#091430":gameKey==="balt"?"#0a1440":"#0a1840"):(gameKey==="states"?"#c8d0e0":gameKey==="nfl"?"#b8c8dc":gameKey==="balt"?"#b8c8e8":"#d0d0d0");
  const text=dark?(hc?"#fff":"#e0e8e0"):(hc?"#000":"#0a0a0a");
  const textSub=dark?(gameKey==="pdx"?"#6aaa7a":gameKey==="dc"?"#5a7aaa":gameKey==="nfl"?"#4a6aaa":gameKey==="balt"?"#5a7acc":"#5a7aaa"):(gameKey==="pdx"?"#1a4a2a":gameKey==="dc"?"#1a2a6a":gameKey==="nfl"?"#0a1a5a":gameKey==="balt"?"#1a2a7a":"#1a2a6a");
  const textMuted=dark?(gameKey==="pdx"?"#2a4a2a":gameKey==="dc"?"#1a2a4a":gameKey==="nfl"?"#1a2a50":gameKey==="balt"?"#1a2a55":"#1a2a5a"):(gameKey==="pdx"?"#666":gameKey==="nfl"?"#446":gameKey==="balt"?"#446":"#556");
  const cellBg:{[k:string]:string}={green:dark?"#041508":"#d4f5e0",yellow:dark?"#1a1400":"#fffacc",red:dark?"#180404":"#fdd0d0"};
  const cellBorder:{[k:string]:string}={green:"#28b050",yellow:"#c8a800",red:hc?"#cc0000":"#c43030"};
  const cellText:{[k:string]:string}={green:dark?"#ffffff":"#005020",yellow:dark?"#ffffff":"#5a3800",red:dark?"#ffffff":"#5a0000"};
  const fs=(b:number)=>`${Math.round((b+2)*sm)}px`;
  return{dark,hc,cb,sm,accent,accentB,bg,surface,card,border,text,textSub,textMuted,cellBg,cellBorder,cellText,fs,SHAPE};
}

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS=[
  {id:"first",   icon:"🎯",name:"First Stop",    desc:"Win your first game",               check:(s:any)=>s.wins>=1},
  {id:"bullseye",icon:"💫",name:"Bullseye",       desc:"Guess correctly on the first try",  check:(s:any)=>s.wins>=1&&s.lastGuesses===1},
  {id:"express", icon:"⚡",name:"Express",        desc:"Win in 2 guesses or fewer",          check:(s:any)=>s.wins>=1&&s.lastGuesses<=2},
  {id:"streak3", icon:"🔥",name:"On A Roll",      desc:"Win 3 days in a row",               check:(s:any)=>s.streak>=3},
  {id:"streak7", icon:"🏅",name:"Week Pass",      desc:"Win 7 days in a row",               check:(s:any)=>s.streak>=7},
  {id:"streak14",icon:"🌟",name:"Fortnight",      desc:"Win 14 days in a row",              check:(s:any)=>s.streak>=14},
  {id:"streak30",icon:"👑",name:"Monthly Pass",   desc:"Win 30 days in a row",              check:(s:any)=>s.streak>=30},
  {id:"played10",icon:"🗺️",name:"Regular",       desc:"Play 10 times",                     check:(s:any)=>s.played>=10},
  {id:"played30",icon:"📍",name:"Expert",         desc:"Play 30 times",                     check:(s:any)=>s.played>=30},
  {id:"played100",icon:"🏆",name:"Centurion",     desc:"Play 100 times",                    check:(s:any)=>s.played>=100},
  {id:"nohints", icon:"👁️",name:"No Peeking",    desc:"Win without using any hints",       check:(s:any)=>s.wins>=1&&!s.usedHints},
  {id:"hardwin", icon:"💪",name:"Hard Mode",      desc:"Win in Hard Mode",                  check:(s:any)=>(s.hardWins||0)>=1},
  {id:"prowin",  icon:"⚫",name:"Pro Mode",       desc:"Win in Pro Mode",                   check:(s:any)=>(s.proWins||0)>=1},
  {id:"wins10",  icon:"🌈",name:"10 Wins",        desc:"Win 10 times total",                check:(s:any)=>s.wins>=10},
  {id:"wins50",  icon:"💎",name:"50 Wins",        desc:"Win 50 times total",                check:(s:any)=>s.wins>=50},
  {id:"comeback",icon:"🦅",name:"Close Call",     desc:"Win on your last allowed guess",    check:(s:any)=>s.wins>=1&&s.lastGuesses===s.lastMaxGuesses},
];
const EMOJIS=["🎯","⭐","🔥","💎","🏆","💫","🌹","🌸","🦅","🌲","🏔️","🌉","🦁","🦊","🐺","🌊","🎮","🎵","🚀","🌈","⚡","🔑","🎨","🦋","🌙","☀️","🍁","🐉","🌻","🎭","🦄","🐧","🦩","🦚","🐬","🦈","🐻","🦖","🌺","🍀","🌴","🏝️","🚂","🛸","🎸","🥁","🎺","🏀","⚽","🎾","🥊","🎯","🧊","🌋","🗽","🏰","🎡","🎢","🎠","🌠","🪐"];
const PDX_DYK=["Portland MAX opened September 5, 1986 — among the first modern US light rail systems.","Washington Park station is 260 feet underground — one of the deepest in North America.","The Red Line to PDX Airport opened in 2001, just days before September 11.","The Orange Line crosses Tilikum Crossing — America's first car-free bridge, opened 2015.","Ruby Junction is where the entire MAX fleet is stored and maintained.","Rosa Parks station on the Yellow Line was renamed in honor of the civil rights icon in 2019.","Orenco Station near Hillsboro is cited as one of the best transit-oriented developments in the US.","Gateway North opened in 2024 — the newest station in the entire MAX system.","Beaverton TC is the largest park-and-ride station in the entire TriMet system.","The Yellow Line opened in 2004, bringing MAX to North Portland for the first time."];
const DC_DYK=["The DC Metro opened March 27, 1976 — one of the world's most architecturally acclaimed subways.","Wheaton station has the longest escalator in the Western Hemisphere — 230 feet, 2.5 minutes to ride.","Forest Glen is one of Metro's deepest stations at 196 feet — so deep it has no escalators, only elevators.","The Silver Line to Dulles Airport finally opened in 2022, after decades of planning.","Metro Center is the system's busiest station, where the Red Line meets Blue, Orange, and Silver.","Fort Totten is one of only two stations where the Red Line meets the Yellow and Green Lines.","Amazon HQ2 chose Crystal City — the Metro-connected neighborhood in Arlington.","Ashburn, western terminus of the Silver Line, is home to the world's largest concentration of data centers.","Reagan National Airport was one of the first US airports connected directly to a city's subway system.","The DC Metro's coffered vault ceiling design by architect Harry Weese is now an iconic worldwide landmark."];

// ── STATION DATA ──────────────────────────────────────────────────────────────
const PDX_RAW:any[]=[
  ["Pioneer Square North",["Blue","Red"],"Downtown Portland",5,1986,"North side of Portland's living room","Portland's busiest downtown MAX stretch — the original Blue Line opened here September 5, 1986."],
  ["Pioneer Square South",["Blue","Red"],"Downtown Portland",5,1986,"South side of Pioneer Courthouse Square","Steps from the historic US Courthouse, one of Portland's most central public spaces."],
  ["Morrison/SW 3rd Avenue",["Blue","Red"],"Downtown Portland",4,1986,"Serves the Morrison Bridge corridor","One of the original 1986 stations — the Morrison Bridge has connected Portland east and west since 1887."],
  ["Yamhill District",["Blue","Red"],"Downtown Portland",4,1986,"Historic Yamhill District, Portland's original commercial waterfront","Named for SW Yamhill Street, part of Portland's commercial grid since the city's founding in 1851."],
  ["Oak Street/SW 1st Avenue",["Blue","Red"],"Downtown Portland",3,1986,"Near the Willamette waterfront and Saturday Market","Steps from Tom McCall Waterfront Park — one of the original opening day stations from 1986."],
  ["Old Town/Chinatown",["Blue","Red"],"Downtown Portland",3,1986,"Portland's historic Old Town and Chinatown district","Home of the famous Saturday Market — the largest continuously operating outdoor arts market in the US."],
  ["Library/SW 9th Avenue",["Blue","Red"],"Downtown Portland",4,1986,"Multnomah County Central Library — one of the US's most visited","The Multnomah County Library system is among the most used public library systems in the entire country."],
  ["Galleria/SW 10th Avenue",["Blue","Red"],"Downtown Portland",3,1986,"Transfer point for the Portland Streetcar NS Line","A key connection between MAX and the Portland Streetcar running through the Pearl District."],
  ["Pioneer Courthouse/SW 6th",["Green","Yellow"],"Downtown Portland",5,2009,"Heart of the MAX system, all lines nearby","When the Transit Mall opened in 2009, this became the central hub for Green and Yellow Line service."],
  ["Pioneer Place/SW 5th",["Green","Orange"],"Downtown Portland",5,2009,"Pioneer Place shopping mall — downtown retail anchor","Pioneer Place opened in 1990 and remains one of downtown Portland's key retail destinations."],
  ["SW 5th & Oak Street",["Green","Orange"],"Downtown Portland",3,2009,"Downtown shopping corridor on the transit mall","Part of the 2009 Portland Transit Mall rebuild that added light rail along the main shopping street."],
  ["SW 6th & Madison Street",["Green","Yellow"],"Downtown Portland",3,2009,"City hall corridor and government district","Steps from Portland City Hall — the civic center of Oregon's largest city since 1895."],
  ["SW 6th & Pine Street",["Green","Yellow"],"Downtown Portland",3,2009,"Gateway to the Pearl District neighborhood","The Pearl District — just north — transformed from industrial warehouses to Portland's most upscale neighborhood."],
  ["NW 5th & Couch Street",["Green","Orange"],"Downtown Portland",3,2009,"Southern edge of the Pearl District","Named for Captain John Couch, one of Portland's earliest founders who claimed the Pearl District land."],
  ["NW 6th & Davis Street",["Green","Yellow"],"Downtown Portland",3,2009,"Northern end of the downtown transit mall","Part of the 2009 transit mall redesign adding light rail along Portland's main commercial corridor."],
  ["City Hall/SW 5th & Jefferson St",["Green","Orange"],"Downtown Portland",3,2009,"Steps from Portland City Hall","Portland City Hall is one of the oldest functioning city halls in the Pacific Northwest, built in 1895."],
  ["Union Station/NW 5th & Glisan St",["Green","Orange"],"Downtown Portland",3,2009,"MAX to Amtrak — Coast Starlight and Cascades","Portland Union Station opened in 1896 — this stop connects MAX to national Amtrak rail service."],
  ["Union Station/NW 6th & Hoyt St",["Green","Yellow"],"Downtown Portland",3,2009,"NW 6th Ave entrance to Portland Union Station","One of two adjacent MAX stops for Union Station — the ornate clock tower is a beloved Portland landmark."],
  ["PSU Urban Center/SW 5th & Mill",["Green","Orange"],"Downtown Portland",4,2009,"Portland State University main campus","PSU is Oregon's largest university with over 27,000 students — this is its primary MAX connection."],
  ["PSU Urban Center/SW 6th & Montgomery",["Green","Yellow"],"Downtown Portland",4,2009,"6th Ave side of PSU's Urban Center campus","Both PSU Urban Center stops serve the same campus — one of Portland's most transit-rich university corridors."],
  ["PSU South/SW 5th & Jackson St",["Green","Orange"],"Downtown Portland",3,2012,"Southern transit mall stop near PSU","Marks the southern end of the downtown transit mall, added in 2012 to improve service flexibility."],
  ["PSU South/SW 6th & College St",["Green","Yellow"],"Downtown Portland",3,2012,"SW 6th Ave end of the PSU transit mall","Serves the southern edge of Portland State University's College of Urban and Public Affairs campus."],
  ["Providence Park",["Blue","Red"],"SW Portland",4,1997,"Home of the Portland Timbers MLS club","On Portland Timbers match days this is among the busiest stations — MLS has filled Providence Park since 1996."],
  ["Goose Hollow/SW Jefferson Street",["Blue","Red"],"SW Portland",3,1998,"Historic Goose Hollow — one of Portland's oldest neighborhoods","Named for the 19th-century settlement with actual roaming geese — home of former Portland mayor Bud Clark."],
  ["Washington Park",["Blue","Red"],"SW Portland",3,1998,"260 feet underground — Portland's deepest station","One of the deepest light rail stations in North America — carved through the West Hills in the highway tunnel."],
  ["South Waterfront/South Moody",["Orange"],"SW Portland",3,2015,"Portland's newest urban district, aerial tram nearby","Connected to OHSU hospital by the Portland Aerial Tram — a scenic gondola visible from the platform."],
  ["OMSI/SE Water",["Orange"],"Inner East",3,2015,"Oregon Museum of Science and Industry","OMSI is one of the Pacific Northwest's top science museums — the Orange Line brought a new generation of visitors."],
  ["Lincoln Street/SE 3rd Avenue",["Orange"],"Inner East",2,2015,"Central Eastside — culinary and tech hub","The Central Eastside transformed from pure warehousing into Portland's most vibrant mixed-use district after 2015."],
  ["Clinton Street/SE 12th Avenue",["Orange"],"Inner East",2,2015,"Steps from Division Street restaurant corridor","Division Street — Portland's most celebrated dining corridor — is just a short walk from this Orange Line stop."],
  ["SE 17th Avenue & Rhine Street",["Orange"],"SE Portland",2,2015,"Inner Sellwood neighborhood, charming residential","Serves Sellwood — known for antique shops, vintage stores, and classic Portland bungalow homes along the Willamette."],
  ["SE 17th Avenue & Holgate Blvd",["Orange"],"SE Portland",2,2015,"Woodstock neighborhood corridor, residential area","One of the quieter Orange Line stations, serving Portland's Woodstock neighborhood and its food scene."],
  ["SE Bybee Boulevard",["Orange"],"SE Portland",2,2015,"Sellwood-Moreland — one of Portland's top family neighborhoods","Sellwood-Moreland is consistently rated one of Portland's most desirable residential communities."],
  ["SE Powell Boulevard",["Green"],"SE Portland",2,2009,"Powell Boulevard — major east-west arterial","SE Powell Boulevard is one of Portland's historic main streets connecting outer neighborhoods to downtown."],
  ["SE Holgate Boulevard",["Green"],"SE Portland",2,2009,"Quiet residential stretch near Woodstock","One of the calmer Green Line stations, surrounded by Portland's classic bungalow neighborhoods."],
  ["SE Division Street",["Green"],"SE Portland",3,2009,"Portland's Division Street — top US restaurant corridor","Division Street has been ranked among the best food streets in America — Pok Pok made it famous nationwide."],
  ["Lents Town Center/SE Foster Road",["Green"],"SE Portland",2,2009,"Lents — historic blue-collar Portland neighborhood","Lents is one of Portland's oldest outer neighborhoods, originally a separate city before 1912 annexation."],
  ["SE Flavel Street",["Green"],"SE Portland",2,2009,"Brentwood-Darlington neighborhood, outer SE","One of the quieter Green Line stations serving the residential Brentwood-Darlington neighborhood."],
  ["SE Tacoma/Johnson Creek",["Orange"],"Milwaukie",2,2015,"Named for the restored Johnson Creek urban stream","Johnson Creek was transformed from a polluted drainage ditch into a functioning urban stream — a Portland success story."],
  ["Milwaukie/Main Street",["Orange"],"Milwaukie",2,2015,"Downtown Milwaukie — birthplace of Dark Horse Comics","Milwaukie is where Dark Horse Comics was founded — publisher of Hellboy, Sin City, and The Mask."],
  ["SE Park Avenue",["Orange"],"Milwaukie",1,2015,"Southern terminus of the Orange Line","The southern end of the Orange Line — the newest MAX line, opened September 12, 2015."],
  ["Rose Quarter Transit Center",["Blue","Green","Red"],"Lloyd District",4,1986,"Moda Center — home of the Portland Trail Blazers","The Trail Blazers have called Portland home since 1970 — this station was built to handle massive game night crowds."],
  ["Convention Center",["Blue","Green","Red"],"Lloyd District",4,1990,"Oregon Convention Center — Pacific Northwest's largest","The Oregon Convention Center's twin green glass spires are among Portland's most recognizable skyline features."],
  ["NE 7th Avenue",["Blue","Green","Red"],"Lloyd District",3,1986,"Lloyd District, Portland Streetcar connection","A key transfer hub where MAX connects to Portland Streetcar's Loop Service through the Lloyd District."],
  ["Lloyd Center/NE 11th Avenue",["Blue","Green","Red"],"Lloyd District",3,1986,"Lloyd Center — one of America's first enclosed malls","Lloyd Center opened in 1960 as one of the US's largest enclosed malls — it famously features an indoor ice rink."],
  ["Interstate/Rose Quarter",["Yellow"],"Lloyd District",3,2004,"Where Yellow Line splits north from the main corridor","This station marks where the Yellow Line diverges from the Blue/Red/Green corridor toward North Portland."],
  ["Albina/Mississippi",["Yellow"],"North Portland",3,2004,"Mississippi Ave — Portland's top dining and arts street","Mississippi Avenue was ranked one of America's coolest streets — the Yellow Line sparked an entire neighborhood renaissance."],
  ["Overlook Park",["Yellow"],"North Portland",2,2004,"Sweeping views of the Willamette River and downtown","Overlook Park sits on the bluffs above the Willamette — one of Portland's great viewpoints, now MAX-accessible."],
  ["Kenton/North Denver Avenue",["Yellow"],"North Portland",2,2004,"Known for its giant Paul Bunyan statue","The 31-foot Paul Bunyan statue at this stop was built in 1959 and is a beloved North Portland landmark."],
  ["North Prescott Street",["Yellow"],"North Portland",2,2004,"Arbor Lodge neighborhood — quiet residential area","Arbor Lodge is one of Portland's classic North Portland neighborhoods, known for bungalow homes and leafy streets."],
  ["North Killingsworth Street",["Yellow"],"North Portland",3,2004,"Killingsworth corridor — revitalizing commercial street","Killingsworth Street has undergone a significant restaurant and arts renaissance since the Yellow Line opened."],
  ["North Lombard Transit Center",["Yellow"],"North Portland",3,2004,"Major bus transfer hub on Lombard Street","One of the Yellow Line's busiest bus transfer stations, connecting North Portland to regional routes."],
  ["Rosa Parks",["Yellow"],"North Portland",3,2004,"Named for civil rights icon Rosa Parks","Renamed in honor of Rosa Parks — one of the most meaningfully named transit stations in the Pacific Northwest."],
  ["Delta Park/Vanport",["Yellow"],"North Portland",2,2004,"Named for Vanport — WWII city destroyed by 1948 flooding","Vanport was a city of 40,000 built in 1942. A catastrophic 1948 Columbia River flood destroyed it entirely in one afternoon."],
  ["Expo Center",["Yellow"],"North Portland",2,2004,"Northern terminus — Portland Expo Center, Columbia River","The northern end of the Yellow Line serves the Portland Expo Center steps from the Oregon/Washington border."],
  ["NE 60th Avenue",["Blue","Green","Red"],"NE Portland",2,1986,"NE 60th Ave corridor, Beaumont-Wilshire neighborhood","Serves walkable Beaumont Village — one of Northeast Portland's most charming commercial districts."],
  ["NE 82nd Avenue",["Blue","Green","Red"],"NE Portland",3,1986,"82nd Avenue — diverse global food corridor","NE/SE 82nd is one of Oregon's most diverse dining streets, with Vietnamese, Ethiopian, Mexican, and Filipino cuisines."],
  ["Hollywood/NE 42nd Avenue",["Blue","Green","Red"],"NE Portland",3,1986,"Named for the Hollywood Theatre, independent cinema since 1926","The Hollywood Theatre has shown films continuously since 1926 — one of Portland's most beloved indie cinemas."],
  ["Parkrose/Sumner Transit Center",["Red"],"Airport",2,2001,"Park-and-ride hub for northeast Portland commuters","One of the Red Line's busiest park-and-ride stations — a gateway for northeast Portland residents heading to PDX."],
  ["Cascades",["Red"],"Airport",2,2007,"Serves development along Airport Way corridor","Opened in 2007 to serve the expanding Columbia Corridor industrial and office campus along Airport Way."],
  ["Gateway North",["Red"],"Airport",2,2024,"Newest MAX station — opened 2024 as part of Red Line upgrades","Gateway North opened in 2024 as part of the Red Line double-track project improving airport service reliability."],
  ["Mount Hood Avenue",["Red"],"Airport",2,2001,"One stop from Portland International Airport","Named for Oregon's iconic stratovolcano — Mount Hood is visible from this station on clear days to the east."],
  ["Portland International Airport",["Red"],"Airport",5,2001,"PDX — Portland International Airport","PDX Airport ranks among the best US airports for food, shopping, and the famous carpet beloved by Portlanders."],
  ["Beaverton Central",["Blue","Red"],"Beaverton",3,1998,"Beaverton's main downtown station","Beaverton is the heart of Oregon's Silicon Forest — Intel's largest US campus is just miles west."],
  ["Beaverton Creek",["Blue"],"Beaverton",2,1998,"Beaverton Creek wetlands, tech corridor","Serves the Beaverton Creek wetland area — one of the rare natural oases in the suburbs of the Silicon Forest."],
  ["Merlo Road/SW 158th Avenue",["Blue"],"Beaverton",2,1998,"Merlo Road corridor west of Beaverton","Serves the western Beaverton suburbs in the heart of Washington County."],
  ["Elmonica/SW 170th Avenue",["Blue"],"Beaverton",2,1998,"Elmonica neighborhood in Beaverton","One of the quieter Blue Line stations in Beaverton's western suburbs."],
  ["Sunset Transit Center",["Blue","Red"],"Beaverton",3,1998,"Park-and-ride, Washington County","The largest park-and-ride facility on the Blue/Red corridor, serving Washington County commuters heading into Portland."],
  ["Washington/SW Cedar Hills Blvd",["Blue"],"Beaverton",2,1998,"Cedar Hills Crossing shopping area","Serves the Cedar Hills Crossing retail district — one of Washington County's major commercial destinations."],
  ["Cedar Hills",["Blue"],"Beaverton",2,1998,"Cedar Hills neighborhood, western Beaverton","A quiet western Beaverton station serving the Cedar Hills residential community."],
  ["Barnes Road",["Blue","Red"],"Beaverton",3,1998,"Tualatin Valley Highway and Nike campus area","One stop from the Nike World Headquarters campus — Nike is Oregon's most valuable company."],
  ["Beaverton TC",["Blue","Red","WES"],"Beaverton",4,1998,"Largest park-and-ride in TriMet system","Beaverton TC is the main transportation hub for all of Washington County — the WES Commuter Rail also connects here."],
  ["Tigard Transit Center",["WES"],"Tigard",2,2009,"Downtown Tigard — Washington County suburb south of Beaverton","Tigard TC serves Oregon's 12th most populous city; WES ridership here is driven heavily by Intel and Nike employees commuting from the Tualatin Valley."],
  ["Tualatin",["WES"],"Tualatin",2,2009,"Tualatin River plain — quiet Washington County suburb","Tualatin's name derives from the Atfalati people who inhabited the Tualatin Valley for thousands of years before European contact."],
  ["Wilsonville",["WES"],"Wilsonville",2,2009,"Southern terminus of the WES Commuter Rail — connects to SMART bus service","Wilsonville is a regional multimodal hub: WES meets South Metro Area Regional Transit (SMART) here, linking Washington and Clackamas counties."],
  ["Hall/Nimbus",["Blue"],"Beaverton",2,1998,"Hall Blvd and Nimbus Ave intersection","A quiet Blue Line station serving western Beaverton near the Nimbus business district."],
  ["Quatama",["Blue"],"Hillsboro",2,2003,"Quatama area in outer Hillsboro","Quatama opened in 2003 with Hillsboro's eastern expansion — serving newer residential development."],
  ["Hawthorn Farm",["Blue"],"Hillsboro",2,2003,"Hawthorn Farm development area","Serves the Hawthorn Farm area of Hillsboro — near Intel's massive Ronler Acres campus."],
  ["Orenco/NW 231st Avenue",["Blue"],"Hillsboro",2,2003,"Celebrated transit-oriented development community","Orenco Station is one of the most-cited examples of successful transit-oriented development in the US."],
  ["Fair Complex/Hillsboro Airport",["Blue","Red"],"Hillsboro",2,1998,"Hillsboro Airport and Washington County Fairgrounds","Serves general aviation and the Washington County Fair."],
  ["Hillsboro Central/SE 3rd Avenue TC",["Blue"],"Hillsboro",2,1998,"Downtown Hillsboro — capital of Oregon's Silicon Forest","Hillsboro is home to Intel's largest US campus — the center of Oregon's technology industry."],
  ["Hillsboro Health District",["Blue"],"Hillsboro",2,1998,"Hillsboro Medical Center campus","Formerly Tuality Hospital — renamed in 2021 to reflect the expanded Hillsboro Medical Center campus."],
  ["Washington/SE 12th Avenue",["Blue"],"Hillsboro",1,1998,"Quiet residential corridor in southern Hillsboro","Serves a residential stretch near the Tualatin Valley Highway."],
  ["Hatfield Government Center",["Blue"],"Hillsboro",2,1998,"Western terminus of the Blue Line","Named for Oregon Senator Mark Hatfield — the westernmost station in the entire TriMet MAX system."],
  ["SE Fuller Road",["Green"],"Clackamas",2,2009,"Large park-and-ride, 630 spaces","SE Fuller Road has one of the largest park-and-ride facilities on the Green Line with 630 spaces."],
  ["SE Main Street",["Green"],"Clackamas",2,2009,"Pleasant Valley area near Clackamas County border","Serves the Pleasant Valley area near the Clackamas County border."],
  ["Clackamas Town Center TC",["Green"],"Clackamas",3,2009,"Southern terminus of the Green Line — major shopping center","Clackamas Town Center is one of the Portland metro's largest shopping centers — the Green Line opened access in 2009."],
  ["Gateway/NE 99th Ave TC",["Blue","Green","Red"],"East Portland",3,1986,"Gateway — hub for all three eastern lines","Gateway Transit Center is where the Blue, Green, and Red Lines diverge heading east — a major transfer hub."],
  ["E 102nd Avenue",["Blue","Green","Red"],"East Portland",2,1986,"102nd Ave corridor in outer East Portland","Serves the diverse 102nd Avenue neighborhood in outer East Portland."],
  ["E 122nd Avenue",["Blue","Green","Red"],"East Portland",3,1986,"122nd Ave — diverse East Portland neighborhood","122nd Avenue is one of East Portland's most multicultural corridors."],
  ["E 148th Avenue",["Blue","Green","Red"],"East Portland",2,1986,"Outer East Portland near the Gresham border","One of the gateway stations to Gresham from East Portland."],
  ["E 162nd Avenue",["Blue","Green","Red"],"East Portland",2,1986,"162nd Ave, far outer East Portland","Serves the residential community of outer East Portland near the Gresham boundary."],
  ["E 172nd Avenue",["Blue"],"Gresham",2,1986,"Eastern gateway to Gresham","Part of the original 1986 Blue Line extension into Gresham."],
  ["Rockwood/E 188th Ave TC",["Blue","Green","Red"],"Gresham",3,1986,"Rockwood neighborhood — diverse community","Rockwood is one of East Portland's most diverse communities — the Green Line added frequency in 2009."],
  ["Ruby Junction/E 197th Ave",["Blue","Green","Red"],"Gresham",2,1986,"Near TriMet's main MAX maintenance facility","Ruby Junction is the home of TriMet's main MAX vehicle maintenance and storage facility."],
  ["Civic Drive",["Blue","Green","Red"],"Gresham",2,1986,"Gresham City Hall and government buildings","Serves Gresham's civic center — Oregon's 4th largest city and the eastern anchor of the MAX system."],
  ["Gresham City Hall",["Blue","Green","Red"],"Gresham",2,1986,"Gresham City Hall station","The central station of Gresham's downtown — Oregon's 4th largest city."],
  ["Gresham Central TC",["Blue","Green","Red"],"Gresham",3,1986,"Gresham's main downtown hub","Gresham Central is the main transit hub for the eastern MAX terminus."],
  ["Cleveland Avenue",["Blue","Green","Red"],"Gresham",2,1986,"Eastern terminus of the Blue, Green, and Red Lines","The final station of the original Blue Line from 1986 — the eastern end of Portland's light rail system."],
];
const PDX_IMG:Record<string,string>={
  "Pioneer Courthouse/SW 6th":"Pioneer_Courthouse_Square_Portland.jpg",
  "Pioneer Square North":"Pioneer_Courthouse_Square_Portland.jpg",
  "Providence Park":"Portland_TriMet_MAX_at_Providence_Park.jpg",
  "Washington Park":"Washington_Park_MAX_station_underground.jpg",
  "Old Town/Chinatown":"Portland_Old_Town_Chinatown.jpg",
  "Union Station/NW 5th & Glisan St":"Portland_Union_Station.jpg",
  "Rose Quarter Transit Center":"Rose_Quarter_Transit_Center_Portland_MAX.jpg",
  "Convention Center":"Oregon_Convention_Center.jpg",
  "Lloyd Center/NE 11th Avenue":"Lloyd_Center_Mall.jpg",
  "Hollywood/NE 42nd Avenue":"Hollywood_District_Portland.jpg",
  "Gateway/NE 99th Ave TC":"Gateway_TC_Portland_MAX.jpg",
  "Portland International Airport":"Portland_International_Airport_MAX.jpg",
  "Beaverton TC":"Beaverton_Transit_Center.jpg",
  "Sunset Transit Center":"Sunset_TC_MAX_Portland.jpg",
  "Hillsboro Central/SE 3rd Avenue TC":"Hillsboro_Oregon_downtown.jpg",
  "Hatfield Government Center":"Hillsboro_Oregon_downtown.jpg",
  "Orenco/NW 231st Avenue":"Orenco_Station_Hillsboro.jpg",
  "Gresham Central TC":"Gresham_Oregon.jpg",
  "South Waterfront/South Moody":"South_Waterfront_Portland.jpg",
  "OMSI/SE Water":"OMSI_Portland.jpg",
  "Expo Center":"Expo_Center_Portland_MAX.jpg",
  "Clackamas Town Center TC":"Clackamas_Town_Center.jpg",
};
const PDX_STATIONS=PDX_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:PDX_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${PDX_IMG[name]}`:""}));

const DC_RAW:any[]=[
  ["Metro Center",["Red","Orange","Silver","Blue"],"Downtown DC",5,1976,"System hub — Red and Blue/Orange/Silver transfer","Metro Center is the busiest station in the WMATA system and the geographic heart of Washington's transit network."],
  ["Gallery Place-Chinatown",["Red","Yellow","Green"],"Downtown DC",5,1976,"Red/Yellow/Green transfer — Chinatown and Capital One Arena","One of the system's busiest stations, serving the Capital One Arena where the Capitals and Wizards play."],
  ["Farragut North",["Red"],"Downtown DC",4,1976,"K Street corridor — Washington's lobbying hub","Farragut North serves Washington's famous K Street corridor — home to the nation's most influential lobbying firms."],
  ["Farragut West",["Orange","Silver","Blue"],"Downtown DC",4,1977,"Connects to Farragut North via underground concourse","Farragut North and West are connected by an underground concourse — together they serve the heart of DC's business district."],
  ["McPherson Square",["Orange","Silver","Blue"],"Downtown DC",3,1977,"White House area and K Street business district","Steps from the White House grounds and McPherson Square park — one of DC's most historically significant blocks."],
  ["Federal Triangle",["Orange","Silver","Blue"],"Downtown DC",3,1977,"Justice Department, IRS, and federal office buildings","Serves the Federal Triangle complex — a cluster of massive neoclassical federal buildings housing thousands of government workers."],
  ["Smithsonian",["Orange","Silver","Blue"],"Penn Quarter/SW",4,1977,"National Mall and Smithsonian museums","Steps from the Smithsonian museums — the most visited museum complex in the world, all free to the public."],
  ["L'Enfant Plaza",["Orange","Silver","Blue","Yellow","Green"],"Penn Quarter/SW",4,1977,"Five-line transfer — busiest multi-line hub outside downtown","L'Enfant Plaza is where five Metro lines intersect — named for Pierre Charles L'Enfant who designed Washington DC's street grid."],
  ["Federal Center SW",["Orange","Silver","Blue"],"Penn Quarter/SW",3,1977,"Southwest federal office complex","Serves a cluster of federal agencies in the Southwest waterfront area."],
  ["Archives-Navy Memorial",["Yellow","Green"],"Penn Quarter/SW",3,1983,"National Archives, Navy Memorial, Pennsylvania Ave","The National Archives houses the Declaration of Independence and Constitution — this is their Metro stop."],
  ["Mt Vernon Sq/7th St-Convention Center",["Yellow","Green"],"Penn Quarter/SW",3,2001,"DC Convention Center and Mount Vernon Square","Serves the Walter E. Washington Convention Center — DC's largest convention facility at 2.3 million square feet."],
  ["Judiciary Square",["Red"],"Penn Quarter/SW",2,1977,"DC Superior Court and Municipal Center","Serves DC's court complex and municipal government buildings."],
  ["Waterfront",["Green"],"Penn Quarter/SW",2,1991,"SW Waterfront — The Wharf entertainment district","Serves The Wharf — a $3.6 billion waterfront development that transformed Southwest DC's Potomac riverfront."],
  ["Navy Yard-Ballpark",["Green"],"Capitol Hill",3,1991,"Nationals Park — Washington Nationals MLB stadium","When the Nationals play, this station sees some of the largest single-event ridership surges in the system."],
  ["Capitol South",["Orange","Silver","Blue"],"Capitol Hill",4,1977,"US Capitol Building and House of Representatives","The primary Metro stop for the US Capitol — members of Congress and their staffs use this station daily."],
  ["Eastern Market",["Orange","Silver","Blue"],"Capitol Hill",3,1977,"Eastern Market — DC's historic public market since 1873","Eastern Market has operated continuously since 1873 — one of Washington's most beloved neighborhood institutions."],
  ["Potomac Ave",["Orange","Silver","Blue"],"Capitol Hill",2,1977,"Capitol Hill residential neighborhood","A quieter Capitol Hill station serving the residential streets east of the Capitol campus."],
  ["Stadium-Armory",["Orange","Silver","Blue"],"Capitol Hill",2,1977,"RFK Stadium site — future home of DC United","Once home to the Washington Redskins and DC United, this site may become a new NFL stadium."],
  ["Union Station",["Red"],"Capitol Hill",4,1976,"Major Amtrak hub — Acela, Northeast Regional, and more","Washington Union Station is one of the busiest transportation hubs in the US — Amtrak's most used station."],
  ["Dupont Circle",["Red"],"NW DC",4,1977,"Dupont Circle — DC's most vibrant neighborhood hub","Dupont Circle is the heart of Washington's restaurant, gallery, and LGBTQ+ community scene."],
  ["Woodley Park-Zoo/Adams Morgan",["Red"],"NW DC",3,1981,"National Zoo and Adams Morgan neighborhood","Serves the Smithsonian National Zoo — one of the world's oldest and most visited free zoos."],
  ["Cleveland Park",["Red"],"NW DC",2,1981,"Cleveland Park neighborhood — historic residential area","A quiet upscale neighborhood where President Grover Cleveland once had his summer home."],
  ["Van Ness-UDC",["Red"],"NW DC",2,1981,"University of the District of Columbia","Serves UDC, DC's only public university."],
  ["Tenleytown-AU",["Red"],"NW DC",3,1984,"American University and Tenleytown neighborhood","Serves American University, known for its School of International Service."],
  ["Friendship Heights",["Red"],"NW DC",3,1984,"Upscale shopping district at the DC-Maryland border","Friendship Heights is one of DC's premier retail destinations, sitting directly on the boundary with Montgomery County."],
  ["Foggy Bottom-GWU",["Orange","Silver","Blue"],"NW DC",3,1977,"George Washington University and State Department","Serves GWU, the State Department, and the John F. Kennedy Center for the Performing Arts."],
  ["U Street/Afr-Amer Civil War Memorial",["Yellow","Green"],"Columbia Heights",3,1991,"U Street Corridor — DC's historic Black Broadway","U Street was known as Black Broadway in the early 20th century — home of Duke Ellington, Pearl Bailey, and jazz history."],
  ["Shaw-Howard University",["Yellow","Green"],"Columbia Heights",3,1991,"Howard University and the Shaw neighborhood","Howard University, founded in 1867, is one of the most historically significant HBCUs in the United States."],
  ["Columbia Heights",["Yellow","Green"],"Columbia Heights",4,1999,"One of DC's most culturally diverse neighborhoods","Columbia Heights is one of DC's most diverse neighborhoods — a gateway for Latino, Caribbean, and African communities."],
  ["Georgia Ave-Petworth",["Yellow","Green"],"Columbia Heights",3,1999,"Petworth neighborhood — rapidly changing DC community","Petworth is one of DC's fastest-changing neighborhoods, balancing historic character with new development."],
  ["New York Ave-Florida Ave-Gallaudet U",["Red"],"Columbia Heights",2,2004,"NoMa neighborhood — Gallaudet University nearby","Opened in 2004, this was the first new Metro station built in DC in over a decade."],
  ["Rhode Island Ave-Brentwood",["Red"],"NE DC",2,1976,"Rhode Island Ave corridor in NE Washington","One of Metro's original 1976 stations, anchoring the Rhode Island Avenue commercial corridor."],
  ["Brookland-CUA",["Red"],"NE DC",2,1978,"Catholic University of America and Brookland neighborhood","Serves the Catholic University of America — Brookland is known as 'Little Rome.'"],
  ["Fort Totten",["Red","Yellow","Green"],"NE DC",2,1978,"Three-line transfer — Red meets Yellow and Green","One of only two stations where the Red Line meets the Yellow and Green Lines — a key cross-system transfer point."],
  ["Anacostia",["Green"],"SE DC",2,1983,"Anacostia neighborhood and Frederick Douglass NHS","Near the Frederick Douglass National Historic Site."],
  ["Congress Heights",["Green"],"SE DC",2,1983,"Congress Heights — southeastern DC neighborhood","Serves the Congress Heights neighborhood — one of DC's most historically significant communities east of the Anacostia."],
  ["Southern Avenue",["Green"],"SE DC",1,1983,"Southern boundary of DC and Maryland","Southern Avenue marks the border of Washington DC and Prince George's County, Maryland."],
  ["Naylor Road",["Green"],"SE DC",1,1983,"Naylor Road neighborhood in SE Washington","Serves the Naylor Road residential area — one of the quieter stations on the Green Line's southern branch."],
  ["Suitland",["Green"],"SE DC",1,1983,"Suitland — crosses into Prince George's County, Maryland","Suitland is home to the Census Bureau headquarters."],
  ["Branch Ave",["Green"],"SE DC",1,1983,"Southern terminus of the Green Line","The southern end of the Green Line, serving the suburbs of Prince George's County just south of DC."],
  ["Medical Center",["Red"],"Montgomery County MD",3,1984,"NIH and Walter Reed National Military Medical Center","Serves the National Institutes of Health campus — the world's largest biomedical research facility."],
  ["Bethesda",["Red"],"Montgomery County MD",4,1984,"Downtown Bethesda — Montgomery County's busiest station","Bethesda is one of the wealthiest communities in the United States — this station serves its vibrant downtown."],
  ["Grosvenor-Strathmore",["Red"],"Montgomery County MD",2,1984,"Strathmore Music Center and Grosvenor neighborhood","Serves the Strathmore Music Center, one of the DC region's premier performing arts venues."],
  ["White Flint",["Red"],"Montgomery County MD",2,1984,"White Flint area — major Pike & Rose development","White Flint's Pike & Rose is one of Maryland's largest mixed-use transit-oriented developments."],
  ["Twinbrook",["Red"],"Montgomery County MD",2,1984,"Twinbrook neighborhood in Rockville","Serves Twinbrook — one of Montgomery County's most affordable and diverse residential neighborhoods."],
  ["Rockville",["Red"],"Montgomery County MD",2,1984,"Downtown Rockville — Montgomery County seat","Rockville is the county seat of Montgomery County — Maryland's most populous county."],
  ["Shady Grove",["Red"],"Montgomery County MD",3,1984,"Northwestern terminus of the Red Line","Shady Grove is the western terminus of the Red Line, serving as the gateway to Montgomery County's tech corridor."],
  ["Takoma",["Red"],"Montgomery County MD",2,1978,"Takoma Park — DC's 'hippie suburb'","Takoma Park is affectionately known as the 'People's Republic of Takoma Park' for its progressive political culture."],
  ["Silver Spring",["Red"],"Montgomery County MD",3,1978,"Downtown Silver Spring — thriving urban hub","Silver Spring has transformed into one of the DC region's most vibrant dining and entertainment destinations."],
  ["Forest Glen",["Red"],"Montgomery County MD",1,1998,"One of Metro's deepest stations at 196 feet","Forest Glen is one of the deepest Metro stations — riders descend 196 feet by escalator."],
  ["Wheaton",["Red"],"Montgomery County MD",2,1990,"Wheaton — world's longest escalator","Wheaton has the longest escalator in the Western Hemisphere at 230 feet — it takes 2.5 minutes to ride."],
  ["Glenmont",["Red"],"Montgomery County MD",2,1998,"Northern terminus of the Red Line","The northern end of the Red Line, serving Glenmont in Silver Spring, Maryland."],
  ["New Carrollton",["Orange","Silver"],"Prince George's County MD",3,1978,"Major PG County hub — Amtrak and MARC connections","New Carrollton is a major regional transportation hub connecting Metro, Amtrak, and MARC commuter rail."],
  ["Landover",["Orange"],"Prince George's County MD",1,1978,"Landover — suburban Prince George's County","Serves the Landover area of Prince George's County."],
  ["Cheverly",["Orange"],"Prince George's County MD",1,1978,"Cheverly — small-town feel near DC","Cheverly is a small incorporated town near DC, known as one of the first planned communities in the region."],
  ["Deanwood",["Orange"],"Prince George's County MD",1,1978,"Deanwood neighborhood in northeastern DC area","Serves the historic Deanwood community — one of Washington's oldest African American neighborhoods."],
  ["Minnesota Ave",["Orange"],"Prince George's County MD",1,1978,"Minnesota Avenue corridor in eastern DC","Serves the Minnesota Avenue corridor at the eastern edge of Washington, DC."],
  ["Benning Road",["Blue","Silver"],"Prince George's County MD",1,1978,"Benning Road in eastern DC area","Serves the Benning Road corridor at the boundary between eastern DC and Prince George's County."],
  ["Capitol Heights",["Blue","Silver"],"Prince George's County MD",1,1978,"Capitol Heights — suburban Prince George's County","Capitol Heights is an unincorporated suburb just across the DC border in Prince George's County."],
  ["Addison Road-Seat Pleasant",["Blue","Silver"],"Prince George's County MD",1,1978,"Seat Pleasant — historic PG County community","Seat Pleasant is one of Prince George's County's older incorporated municipalities."],
  ["Morgan Boulevard",["Blue","Silver"],"Prince George's County MD",1,2004,"Morgan Boulevard — outer PG County suburban area","Morgan Boulevard opened in 2004 as part of the Blue Line's extension toward Largo Town Center."],
  ["Largo Town Center",["Blue","Silver"],"Prince George's County MD",2,2004,"Eastern terminus of Blue and Silver Lines","The eastern terminus of both Blue and Silver Lines, serving Largo Town Center in Prince George's County."],
  ["West Hyattsville",["Yellow","Green"],"Prince George's County MD",1,1993,"West Hyattsville — Prince George's County suburb","Serves the western end of Hyattsville."],
  ["Hyattsville Crossing",["Yellow","Green"],"Prince George's County MD",2,1993,"Hyattsville Crossing — major PG County retail hub (formerly Prince George's Plaza)","The station was renamed from Prince George's Plaza to Hyattsville Crossing in November 2023 — the mall remains one of Maryland's largest."],
  ["College Park-U of MD",["Yellow","Green"],"Prince George's County MD",3,1993,"University of Maryland — flagship state university","Serves the University of Maryland, College Park — one of the nation's top public research universities."],
  ["Greenbelt",["Yellow","Green"],"Prince George's County MD",2,1993,"Northern terminus of Yellow/Green Lines — NASA Goddard area","Greenbelt is near NASA's Goddard Space Flight Center — one of the nation's premier space research facilities."],
  ["Rosslyn",["Orange","Silver","Blue"],"Arlington VA",4,1977,"Rosslyn — major transfer hub between DC and Virginia","Rosslyn's distinctive skyline marks the gateway to Virginia — one of the system's busiest transfer stations."],
  ["Court House",["Orange","Silver","Blue"],"Arlington VA",3,1979,"Arlington County courthouse and government offices","Serves Arlington County's government complex — Arlington is one of the most densely populated counties in the US."],
  ["Clarendon",["Orange","Silver","Blue"],"Arlington VA",3,1979,"Clarendon — one of the DC area's top dining destinations","Clarendon has emerged as one of the DC region's most vibrant dining and nightlife corridors."],
  ["Virginia Square-GMU",["Orange","Silver","Blue"],"Arlington VA",2,1979,"George Mason University Arlington campus","Serves George Mason University's Arlington campus."],
  ["Ballston-MU",["Orange","Silver","Blue"],"Arlington VA",3,1979,"Ballston — major transit-oriented development hub","Ballston is one of the DC region's most successful transit-oriented development corridors."],
  ["East Falls Church",["Orange","Silver"],"Arlington VA",2,1986,"East Falls Church — transfer point between Arlington and Fairfax","A key park-and-ride station at the boundary between Arlington County and the City of Falls Church."],
  ["Pentagon",["Blue","Yellow"],"Arlington VA",4,1977,"US Department of Defense headquarters","The Pentagon is the world's largest office building — this is the primary Metro stop for DoD employees."],
  ["Pentagon City",["Blue","Yellow"],"Arlington VA",3,1977,"Pentagon City mall and Crystal City area","Serves the Pentagon City mall and is connected underground to the Crystal City neighborhood."],
  ["Crystal City",["Blue","Yellow"],"Arlington VA",3,1977,"Crystal City — major office and residential development","Crystal City is one of the DC region's most transit-accessible neighborhoods — Amazon HQ2 chose this area."],
  ["Reagan National Airport",["Blue","Yellow"],"Arlington VA",4,1977,"Ronald Reagan Washington National Airport","Reagan National is one of the few US airports directly connected to a city's downtown by Metro."],
  ["Arlington Cemetery",["Blue"],"Arlington VA",2,1977,"Arlington National Cemetery — America's most honored burial ground","Arlington National Cemetery honors over 400,000 veterans, including Presidents Kennedy and Taft."],
  ["Braddock Road",["Blue","Yellow"],"Alexandria VA",2,1983,"Braddock Road neighborhood in Alexandria","Braddock Road station sits in Alexandria's Del Ray neighborhood — a historic streetcar suburb now known for its eclectic small-business corridor."],
  ["Potomac Yard",["Blue","Yellow"],"Alexandria VA",2,2023,"Potomac Yard redevelopment — Virginia Tech Innovation Campus","Opened in May 2023, Potomac Yard is the newest station on the DC Metro system and serves Virginia Tech's 65-acre Innovation Campus."],
  ["King Street-Old Town",["Blue","Yellow"],"Alexandria VA",3,1983,"Old Town Alexandria — historic waterfront community","Old Town Alexandria is one of the best-preserved 18th-century streetscapes in America — founded in 1749."],
  ["Eisenhower Avenue",["Yellow"],"Alexandria VA",2,1983,"Eisenhower Avenue corridor in Alexandria","Named for the 34th President who led the D-Day invasion — this station anchors Alexandria's growing Eisenhower Valley tech corridor."],
  ["Huntington",["Yellow"],"Fairfax VA",2,1983,"Southern terminus of the Yellow Line","The southern end of the Yellow Line, serving the Huntington neighborhood in Fairfax County near Alexandria."],
  ["Van Dorn Street",["Blue"],"Alexandria VA",1,1991,"Van Dorn Street area in western Alexandria","Serves Alexandria's western neighborhoods — one of the system's quieter stations, popular with park-and-ride commuters."],
  ["Franconia-Springfield",["Blue"],"Fairfax VA",2,1997,"Western terminus of the Blue Line — Springfield area","The western end of the Blue Line, serving Springfield and the I-95/I-495 interchange in Fairfax County."],
  ["West Falls Church-VT/UVA",["Orange","Silver"],"Fairfax VA",2,1986,"Virginia Tech and UVA extension campuses nearby","Serves Virginia Tech and UVA's Northern Virginia graduate campuses."],
  ["Dunn Loring-Merrifield",["Orange","Silver"],"Fairfax VA",2,1986,"Merrifield — Mosaic District development area","Serves the Mosaic District — a major mixed-use development in Merrifield, Fairfax County."],
  ["Vienna/Fairfax-GMU",["Orange"],"Fairfax VA",3,1986,"Western terminus of the Orange Line","The western end of the Orange Line — one of Metro's most heavily used park-and-ride stations."],
  ["McLean",["Silver"],"Tysons/Dulles VA",2,2014,"McLean — Silver Line's first station in the Tysons area","McLean is the first Silver Line station in Tysons Corner — one of the DC area's largest commercial corridors."],
  ["Tysons Corner",["Silver"],"Tysons/Dulles VA",3,2014,"Tysons Corner Center — Virginia's largest shopping destination","Tysons Corner Center is the largest mall in the DC region — the Silver Line transformed access to this suburban hub."],
  ["Greensboro",["Silver"],"Tysons/Dulles VA",2,2014,"Greensboro area of Tysons — mixed development","Serves the Greensboro area of Tysons — part of Fairfax County's plan to transform the car-dependent suburb."],
  ["Spring Hill",["Silver"],"Tysons/Dulles VA",2,2014,"Spring Hill Road area of outer Tysons","Serves the outer Tysons Corner area."],
  ["Wiehle-Reston East",["Silver"],"Tysons/Dulles VA",3,2014,"Eastern Reston — Silver Line Phase 1 western terminus (2014-2022)","Wiehle-Reston was the end of the Silver Line for 8 years before Phase 2 extended service to Dulles in 2022."],
  ["Reston Town Center",["Silver"],"Tysons/Dulles VA",2,2022,"Reston Town Center — planned community's urban heart","Reston is one of America's great planned communities, founded in 1964 — the Silver Line finally connected it to DC in 2022."],
  ["Herndon",["Silver"],"Tysons/Dulles VA",2,2022,"Town of Herndon — Northern Virginia suburb","Serves the Town of Herndon — a historic Northern Virginia community now part of the tech corridor."],
  ["Innovation Center",["Silver"],"Tysons/Dulles VA",2,2022,"Innovation Center — near Dulles Technology Corridor","Serves the Dulles Technology Corridor — one of the most concentrated areas of aerospace and tech companies."],
  ["Dulles International Airport",["Silver"],"Tysons/Dulles VA",3,2022,"Washington Dulles International Airport","After decades of waiting, Dulles Airport finally got Metro service in 2022."],
  ["Ashburn",["Silver"],"Tysons/Dulles VA",2,2022,"Ashburn — western terminus of the Silver Line","The western terminus of the Silver Line, serving Ashburn in Loudoun County — the world's largest data center hub."],
];
const DC_IMG:Record<string,string>={
  "Metro Center":"WMATA_Metro_Center_station.jpg",
  "Gallery Place-Chinatown":"Gallery_Place-Chinatown_station.jpg",
  "Farragut North":"Farragut_North_station.jpg",
  "Farragut West":"Farragut_West_station.jpg",
  "McPherson Square":"McPherson_Square_station.jpg",
  "Federal Triangle":"Federal_Triangle_station.jpg",
  "Smithsonian":"Smithsonian_station_(WMATA).jpg",
  "L'Enfant Plaza":"L%27Enfant_Plaza_metro_station.jpg",
  "Archives-Navy Memorial":"Archives-Navy_Memorial_station.jpg",
  "Mt Vernon Sq/7th St-Convention Center":"Mt_Vernon_Sq_7th_St_station.jpg",
  "Judiciary Square":"Judiciary_Square_station.jpg",
  "Waterfront":"Waterfront_station_(WMATA).jpg",
  "Navy Yard-Ballpark":"Navy_Yard-Ballpark_station.jpg",
  "Capitol South":"Capitol_South_station.jpg",
  "Eastern Market":"Eastern_Market_station.jpg",
  "Union Station":"Union_Station_Washington_Metro.jpg",
  "Dupont Circle":"Dupont_Circle_station.jpg",
  "Woodley Park-Zoo/Adams Morgan":"Woodley_Park-Zoo-Adams_Morgan_station.jpg",
  "Cleveland Park":"Cleveland_Park_station.jpg",
  "Van Ness-UDC":"Van_Ness-UDC_station.jpg",
  "Tenleytown-AU":"Tenleytown-AU_station.jpg",
  "Friendship Heights":"Friendship_Heights_station.jpg",
  "Foggy Bottom-GWU":"Foggy_Bottom-GWU_station.jpg",
  "U Street/Afr-Amer Civil War Memorial":"U_Street-Cardozo_station.jpg",
  "Shaw-Howard University":"Shaw-Howard_University_station.jpg",
  "Columbia Heights":"Columbia_Heights_station.jpg",
  "Georgia Ave-Petworth":"Georgia_Ave-Petworth_station.jpg",
  "Fort Totten":"Fort_Totten_station.jpg",
  "Anacostia":"Anacostia_station.jpg",
  "Medical Center":"Medical_Center_station.jpg",
  "Bethesda":"Bethesda_station_(WMATA).jpg",
  "Grosvenor-Strathmore":"Grosvenor-Strathmore_station.jpg",
  "White Flint":"White_Flint_station.jpg",
  "Rockville":"Rockville_station.jpg",
  "Shady Grove":"Shady_Grove_station.jpg",
  "Silver Spring":"Silver_Spring_station.jpg",
  "Forest Glen":"Forest_Glen_station.jpg",
  "Wheaton":"Wheaton_station.jpg",
  "Glenmont":"Glenmont_station.jpg",
  "New Carrollton":"New_Carrollton_station.jpg",
  "Greenbelt":"Greenbelt_station.jpg",
  "College Park-U of MD":"College_Park-U_of_MD_station.jpg",
  "West Hyattsville":"West_Hyattsville_station.jpg",
  "Rosslyn":"Rosslyn_station.jpg",
  "Court House":"Court_House_station.jpg",
  "Clarendon":"Clarendon_station.jpg",
  "Virginia Square-GMU":"Virginia_Square-GMU_station.jpg",
  "Ballston-MU":"Ballston-MU_station.jpg",
  "East Falls Church":"East_Falls_Church_station.jpg",
  "Pentagon":"Pentagon_station.jpg",
  "Pentagon City":"Pentagon_City_station.jpg",
  "Crystal City":"Crystal_City_station.jpg",
  "Reagan National Airport":"Ronald_Reagan_Washington_National_Airport_station.jpg",
  "Arlington Cemetery":"Arlington_Cemetery_station.jpg",
  "King Street-Old Town":"King_Street-Old_Town_station.jpg",
  "Huntington":"Huntington_station_(WMATA).jpg",
  "Van Dorn Street":"Van_Dorn_Street_station.jpg",
  "Franconia-Springfield":"Franconia-Springfield_station.jpg",
  "Vienna/Fairfax-GMU":"Vienna_station.jpg",
  "West Falls Church-VT/UVA":"West_Falls_Church_station.jpg",
  "Tysons Corner":"Tysons_Corner_station.jpg",
  "Greensboro":"Greensboro_station_(WMATA).jpg",
  "Spring Hill":"Spring_Hill_station_(WMATA).jpg",
  "Wiehle-Reston East":"Wiehle-Reston_East_station.jpg",
  "Reston Town Center":"Reston_Town_Center_station.jpg",
  "Herndon":"Herndon_station_(WMATA).jpg",
  "Dulles International Airport":"Dulles_Airport_Metro_station.jpg",
  "Ashburn":"Ashburn_Metro_station.jpg",
};
const DC_STATIONS=DC_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:DC_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${DC_IMG[name]}`:""}));

// ── BALTIMORE MTA DATA ─────────────────────────────────────────────────────────
const BALT_DYK=["The Baltimore Metro SubwayLink opened November 21, 1983 — the first rapid transit system in Maryland.","The Baltimore Light Rail opened April 22, 1992, originally running only from Lexington Market to Linthicum.","Lexington Market, served by both the Metro and Light Rail, has operated since 1782 — one of the oldest public markets in America.","Camden Yards opened the same year as the Light Rail in 1992, and the station helped make it one of MLB's most transit-accessible ballparks.","M&T Bank Stadium, home of the Ravens, is directly on the Light Rail — making Baltimore one of the NFL's most transit-friendly cities.","The BWI Airport Light Rail extension opened in 1997, connecting downtown Baltimore to the airport in about 35 minutes.","Johns Hopkins Hospital, the Metro's eastern terminus, is consistently ranked the #1 hospital in the United States.","Mondawmin Mall station was the site of civil unrest in 2015, bringing national attention to transit access and public safety.","Penn Station in Baltimore connects Light Rail to Amtrak's Northeast Corridor — the gorgeous Beaux-Arts building opened in 1911.","The Maryland State Fairgrounds at Timonium sees some of the highest single-event ridership surges on the entire Light Rail system during the State Fair each August."];
const BALT_RAW:any[]=[
  ["Owings Mills",["Metro"],"Baltimore County N",3,1987,"Northwest terminus of Metro SubwayLink in Baltimore County","Owings Mills is a major commercial and residential hub in Baltimore County — one of the busier park-and-ride stations on the Metro."],
  ["Old Court",["Metro"],"Baltimore County N",2,1987,"Old Court Road area in northwest Baltimore County","Serves the Pikesville area in northwest Baltimore County — a mid-county stop along the Reisterstown Road corridor."],
  ["Milford Mill",["Metro"],"Baltimore County N",2,1987,"Milford Mill neighborhood inside the Baltimore Beltway","Serves the diverse Milford Mill community just inside the Baltimore Beltway in western Baltimore County."],
  ["Reisterstown Plaza",["Metro"],"Northwest Baltimore",3,1987,"Reisterstown Road Plaza — major northwest Baltimore commercial hub","Reisterstown Plaza is one of Baltimore's key suburban-urban commercial corridors, serving northwest Baltimore communities."],
  ["Rogers Avenue",["Metro"],"Northwest Baltimore",2,1987,"Rogers Avenue in the Forest Park neighborhood","Serves Forest Park — a classic Baltimore row house neighborhood along the historic Pennsylvania Avenue corridor."],
  ["West Cold Spring",["Metro"],"North Baltimore",2,1987,"Cold Spring Lane area in north Baltimore City","Near the Cold Spring Lane neighborhood, just one stop from the Light Rail at Cold Spring Lane station."],
  ["Mondawmin",["Metro"],"Northwest Baltimore",3,1987,"Mondawmin Mall — one of Baltimore's most important transit hubs","Mondawmin is a critical transfer point for dozens of bus routes and the Metro, serving northwest Baltimore and its large shopping mall."],
  ["Penn North",["Metro"],"North Baltimore",2,1987,"Pennsylvania Avenue corridor in north Baltimore","Serves the historic Pennsylvania Avenue — the heart of Baltimore's African American cultural and commercial heritage."],
  ["Upton",["Metro"],"North Baltimore",2,1987,"Upton neighborhood along the Pennsylvania Avenue corridor","Upton is a historic Baltimore neighborhood along Pennsylvania Avenue, adjacent to the Druid Hill Park community."],
  ["State Center",["Metro","Light Rail"],"Midtown",3,1987,"Maryland state government complex — Metro and Light Rail transfer","State Center serves Maryland's main government complex and is the transfer point between the Metro SubwayLink and Light Rail."],
  ["Lexington Market",["Metro","Light Rail"],"Downtown",4,1987,"Historic Lexington Market — one of America's oldest public markets","Lexington Market has operated since 1782 — one of the oldest continuously operating public markets in America, serving both rail lines."],
  ["Charles Center",["Metro"],"Downtown",4,1987,"Charles Center — heart of downtown Baltimore's business district","The core of downtown Baltimore's business district, steps from the Inner Harbor redevelopment that transformed the city in the 1980s."],
  ["Shot Tower/Market Place",["Metro"],"Downtown",3,1987,"Historic 1828 Phoenix Shot Tower near the Inner Harbor","The 1828 Phoenix Shot Tower was the tallest structure in the United States for decades — it stands just steps from this station."],
  ["Johns Hopkins Hospital",["Metro"],"East Baltimore",3,1983,"World-renowned Johns Hopkins Hospital — consistently the #1 hospital in the US","Johns Hopkins Hospital is one of the world's most celebrated medical institutions — the Metro's eastern terminus since 1983."],
  ["Hunt Valley",["Light Rail"],"Baltimore County N",2,1992,"Northern terminus of Light Rail in Baltimore County","Hunt Valley is a major employment center in Baltimore County — transit access helped develop this suburban business park corridor."],
  ["Pepper Road",["Light Rail"],"Baltimore County N",1,1992,"Quiet suburban Light Rail stop along York Road","A residential suburban stop in northern Baltimore County, serving neighborhoods along the historic York Road corridor."],
  ["Fairgrounds",["Light Rail"],"Baltimore County N",2,1992,"Home of the Maryland State Fair — massive seasonal ridership","The Maryland State Fair is held here each August — this station experiences some of the biggest ridership spikes on the entire system."],
  ["Timonium",["Light Rail"],"Baltimore County N",2,1992,"Timonium corporate park and suburban office corridor","Serves the Timonium business and light industrial corridor along York Road in suburban Baltimore County."],
  ["Lutherville",["Light Rail"],"Baltimore County N",2,1992,"Lutherville — junction where northern Light Rail branches converge","A quiet residential station in northern Baltimore County where the northern Light Rail segments converge toward downtown."],
  ["Falls Road",["Light Rail"],"North Baltimore",2,1992,"Falls Road corridor in the Jones Falls Valley","Falls Road station sits in the Jones Falls Valley between Lutherville and the Mount Washington neighborhood — one of Baltimore's scenic corridors."],
  ["Mt. Washington",["Light Rail"],"North Baltimore",2,1992,"Mount Washington neighborhood in north Baltimore","Mt. Washington is a leafy, historic community in north Baltimore that developed along the Jones Falls Valley in the 19th century."],
  ["Cold Spring Lane",["Light Rail"],"North Baltimore",2,1992,"Cold Spring Lane corridor connecting Roland Park and Hampden","Cold Spring Lane connects the upscale Roland Park neighborhood with the artsy Hampden community — a north Baltimore crossroads."],
  ["Woodberry",["Light Rail"],"North Baltimore",2,1992,"Woodberry neighborhood and the historic Clipper Mill arts district","Woodberry is one of Baltimore's most vibrant arts and residential communities, centered on a converted 19th-century mill complex."],
  ["North Ave",["Light Rail"],"North Baltimore",2,1992,"North Avenue — gateway to Baltimore's Station North arts district","North Avenue station serves Baltimore's Bolton Hill and Station North arts districts, steps from the Maryland Institute College of Art."],
  ["Penn Station",["Light Rail"],"Midtown",3,1992,"Baltimore Penn Station — Amtrak Northeast Corridor connection","Baltimore Penn Station connects Light Rail riders to Amtrak's Northeast Corridor — the stunning Beaux-Arts building opened in 1911."],
  ["Mt. Royal / MICA",["Light Rail"],"Midtown",3,1992,"University of Baltimore and the Maryland Institute College of Art","Mt. Royal / MICA serves the University of Baltimore and the historic Mount Royal corridor, home of the Maryland Institute College of Art."],
  ["Cultural Center",["Light Rail"],"Midtown",2,1992,"Meyerhoff Symphony Hall and Lyric Baltimore performing arts venues","The Cultural Center stop is the gateway to Baltimore's performing arts scene — Meyerhoff Symphony Hall and Lyric Baltimore are steps away."],
  ["Convention Center",["Light Rail"],"Downtown",3,1992,"Baltimore Convention Center — major events and conventions hub","The Baltimore Convention Center hosts major trade shows, conventions, and public events in the heart of the Inner Harbor district."],
  ["Camden Yards",["Light Rail"],"Downtown",4,1992,"Oriole Park at Camden Yards — the ballpark that changed baseball","Camden Yards opened in 1992 and is credited with sparking the retro ballpark design movement across Major League Baseball."],
  ["M&T Bank Stadium",["Light Rail"],"Downtown",4,1992,"Home of the Baltimore Ravens NFL franchise","M&T Bank Stadium opened in 1998 and is one of the NFL's most-praised venues — the Ravens have won two Super Bowls since opening day."],
  ["Hamburg Street",["Light Rail"],"Downtown",2,1992,"Hamburg Street in the south Baltimore stadium corridor","A quieter stop connecting the stadium district to the residential South Baltimore neighborhoods along the Light Rail's southern corridor."],
  ["Westport",["Light Rail"],"South Baltimore",2,1992,"Westport neighborhood on the Middle Branch of the Patapsco River","Westport is a historic waterfront community in southwest Baltimore, overlooking the Middle Branch of the Patapsco River."],
  ["Cherry Hill",["Light Rail"],"South Baltimore",2,1992,"Cherry Hill neighborhood — southern terminus of the Cherry Hill branch","Cherry Hill is a residential community in south Baltimore, representing the southernmost branch of the Light Rail system."],
  ["Halethorpe",["Light Rail"],"BWI Corridor",2,1997,"Halethorpe in Baltimore County — MARC commuter rail connection","Halethorpe serves the I-195 interchange area in Baltimore County and provides a connection to MARC Penn Line commuter rail service."],
  ["Nursery Road",["Light Rail"],"BWI Corridor",1,1997,"Nursery Road area in northern Anne Arundel County","A quiet suburban stop serving the light industrial and residential areas near the nursery farms of northern Anne Arundel County."],
  ["Linthicum",["Light Rail"],"BWI Corridor",2,1997,"Linthicum Heights — community near the BWI Airport corridor","Linthicum Heights developed rapidly after BWI Airport's expansion — this stop serves its suburban residential and commercial areas."],
  ["BWI Airport",["Light Rail"],"BWI Corridor",4,1997,"Baltimore/Washington International Thurgood Marshall Airport","BWI is one of the most transit-accessible US airports — the Light Rail connects it directly to downtown Baltimore in about 35 minutes."],
  ["Ferndale",["Light Rail"],"BWI Corridor",2,1997,"Ferndale in Anne Arundel County between BWI and Glen Burnie","A quiet suburban stop serving Ferndale — a community in Anne Arundel County between BWI Airport and Glen Burnie."],
  ["Glen Burnie",["Light Rail"],"BWI Corridor",3,1997,"Glen Burnie — one of Anne Arundel County's largest communities","Glen Burnie is a major unincorporated community and commercial hub in Anne Arundel County, anchoring the southern Light Rail corridor."],
  ["Cromwell/Glen Burnie",["Light Rail"],"BWI Corridor",2,1997,"Southern terminus of the Baltimore Light Rail","The southern end of the Light Rail system, serving the Cromwell area in Anne Arundel County south of Glen Burnie."],
];
const BALT_IMG:Record<string,string>={
  "Camden Yards":"Baltimore_Light_Rail_at_Camden_Yards.jpg",
  "Convention Center":"Baltimore_Convention_Center.jpg",
  "Pratt Street":"Baltimore_Inner_Harbor.jpg",
  "Baltimore Street":"Baltimore_Street_downtown.jpg",
  "Charles Center":"Baltimore_Charles_Center_station.jpg",
  "Lexington Market":"Lexington_Market_Baltimore.jpg",
  "State Center":"State_Center_Baltimore.jpg",
  "Cultural Center":"Lyric_Theatre_Baltimore.jpg",
  "Mt. Royal / MICA":"MICA_Baltimore.jpg",
  "North Ave":"North_Avenue_Baltimore_Metro.jpg",
  "Woodberry":"Woodberry_Baltimore_Metro.jpg",
  "Cold Spring Lane":"Cold_Spring_Lane_Baltimore_Metro.jpg",
  "Johns Hopkins Hospital":"Johns_Hopkins_Hospital.jpg",
  "Penn North":"Penn_North_Metro_station.jpg",
  "Mondawmin":"Mondawmin_Mall_Baltimore.jpg",
  "Rogers Avenue":"Rogers_Avenue_Baltimore_Metro.jpg",
  "West Cold Spring":"West_Cold_Spring_Metro.jpg",
  "Reisterstown Plaza":"Reisterstown_Plaza_Metro.jpg",
  "Milford Mill":"Milford_Mill_Metro_station.jpg",
  "Old Court":"Old_Court_Metro_station.jpg",
  "Owings Mills":"Owings_Mills_station.jpg",
  "Hunt Valley":"Hunt_Valley_Town_Centre.jpg",
  "Timonium":"Timonium_Maryland.jpg",
  "Lutherville":"Lutherville_Maryland.jpg",
  "Falls Road":"Falls_Road_Baltimore.jpg",
  "Mt. Washington":"Mount_Washington_Baltimore.jpg",
  "BWI Airport":"BWI_Airport_terminal.jpg",
  "Linthicum":"Linthicum_Maryland.jpg",
  "Cromwell/Glen Burnie":"Glen_Burnie_Maryland.jpg",
  "Patapsco":"Patapsco_River_Maryland.jpg",
  "Hamburg Street":"Baltimore_Inner_Harbor.jpg",
  "Westport":"Westport_Baltimore.jpg",
};
const BALT_STATIONS=BALT_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:BALT_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${BALT_IMG[name]}`:""}));

// ── LA METRO DATA ─────────────────────────────────────────────────────────────
const LA_DYK=["The LA Metro Rail system opened in 1990 with the Blue Line — the first new rail transit in Los Angeles since the Pacific Electric Red Cars were discontinued in 1961.","The 2022 Crenshaw/LAX Line (K Line) was partially funded by a 2008 LA County ballot measure — demonstrating the power of local initiatives in funding transit.","Union Station, opened in 1939, was the last great railroad station built in the United States — its Mission Revival and Art Deco blend is celebrated worldwide.","The LA Metro A Line (combining the former Blue and Gold Lines) is one of the longest light rail lines in the US, stretching over 50 miles from Pomona to Downtown Long Beach.","7th St/Metro Center is the busiest rail station in the system and is served by four lines — A, B, D, and E — making it the true hub of the LA Metro network.","Leimert Park Village, served by the K Line, is known as the cultural heart of Black Los Angeles — the Vision Theatre and weekly street performances draw artists from across the region.","The Expo Line (E Line) runs along a historic Pacific Electric right-of-way — the Red Cars that once served this corridor were discontinued in 1950, but the track path was preserved.","Downtown Inglewood, served by the K Line, hosts both SoFi Stadium and the Kia Forum — making it one of the most sports-dense transit corridors in America.","The Gold Line (now part of the A Line) extension to Azusa in 2016 was the first Metro Rail line to reach the San Gabriel Mountains' foothill communities in modern history.","Santa Monica's Downtown station opened in 2016 — completing a transit connection between the Pacific Ocean and Downtown Los Angeles that many Angelenos had dreamed of for decades."];

const LA_RAW:any[]=[
  // ── A+B+D+E shared (Downtown LA core) ────────────────────────────────────
  ["Union Station",["A","B","D"],"Downtown LA",5,1993,"LA's historic grand rail hub — Amtrak, Metrolink, Metro converge","Union Station opened in 1939, blending Mission Revival and Art Deco styles — one of the last great American railroad stations built in the US."],
  ["Civic Center/Grand Park",["A","B","D"],"Downtown LA",4,1993,"Government district and Grand Park gateway","Grand Park stretches 12 acres from City Hall to the Music Center — the civic heart of Downtown LA."],
  ["Pershing Square",["A","B","D"],"Downtown LA",4,1993,"Historic downtown plaza — one of LA's oldest public spaces","Pershing Square is one of LA's oldest public parks, dating to 1866 — it has been reimagined multiple times over 150 years of city history."],
  ["7th St/Metro Center",["A","B","D","E"],"Downtown LA",5,1990,"LA's busiest station — four lines converge here","Metro Center is the system's crown jewel hub — more lines connect here than at any other station in the LA Metro network."],
  ["Pico",["A","E"],"Downtown LA",3,1990,"Near Crypto.com Arena — event ridership powerhouse","Steps from Crypto.com Arena, home of the Lakers and Kings — one of LA's most event-driven stations on game and concert nights."],
  ["Grand/LATTC",["A","E"],"Downtown LA",3,2012,"LA Trade Tech College campus — A and E Lines meet","LA Trade Technical College is one of California's oldest community colleges — this station is shared by both the A and E Lines."],
  ["San Pedro St",["A","E"],"Downtown LA",3,2012,"South of Downtown — edge of the Historic Core","San Pedro Street connects Downtown LA to Historic South Central neighborhoods via the A and E Lines."],
  // ── A Line Downtown unique ─────────────────────────────────────────────────
  ["Chinatown",["A"],"Downtown LA",3,2003,"LA Chinatown — rebuilt 1938, cultural landmark since","LA's Chinatown was relocated and rebuilt in 1938 — the neighborhood's Central Plaza and Dragon Gate remain iconic landmarks."],
  ["Little Tokyo/Arts District",["A"],"Downtown LA",3,2003,"Nikkei hub and booming Arts District gateway","Little Tokyo is the cultural heart of Japanese American LA — the adjacent Arts District transformed from warehouses into a creative hotspot."],
  // ── A Line Northeast (Gold Line, Pasadena corridor) ───────────────────────
  ["Lincoln/Cypress",["A"],"East LA",2,2003,"Lincoln Heights and Cypress Park neighborhoods","Lincoln Heights is one of LA's oldest neighborhoods, founded in the 1870s — the Arroyo Seco parkway runs nearby."],
  ["Heritage Square/Arroyo",["A"],"East LA",2,2003,"Heritage Square Museum and the Arroyo Seco","Heritage Square Museum preserves 8 Victorian-era structures relocated from across LA — a living museum of 19th-century architecture."],
  ["Fillmore",["A"],"East LA",3,2003,"Highland Park — one of LA's fastest-evolving neighborhoods","Fillmore anchors Highland Park's transformation — York Boulevard has become one of LA's most celebrated restaurant streets."],
  ["Del Mar",["A"],"Pasadena/SGV",3,2003,"Old Pasadena — Rose Parade route, Colorado Blvd","Del Mar drops riders into Old Pasadena's Colorado Blvd — the Rose Parade route and one of SoCal's premier dining corridors."],
  ["Memorial Park",["A"],"Pasadena/SGV",3,2003,"Pasadena's civic green — near City Hall","Memorial Park honors Pasadena's veterans and provides green space in the heart of one of the region's most walkable cities."],
  ["Lake",["A"],"Pasadena/SGV",3,2003,"Lake Ave commercial corridor in east Pasadena","Lake Avenue is Pasadena's main north-south commercial spine — home to the city's largest concentration of retail and dining."],
  ["Allen",["A"],"Pasadena/SGV",2,2003,"East Pasadena — near Caltech and JPL","Allen serves East Pasadena's residential communities near the California Institute of Technology and Jet Propulsion Laboratory."],
  ["Sierra Madre Villa",["A"],"Pasadena/SGV",2,2003,"Far east Pasadena — gateway to San Gabriel foothills","Sierra Madre Villa marks the boundary between Pasadena and the San Gabriel Valley at the foot of the San Gabriel Mountains."],
  ["Arcadia",["A"],"Pasadena/SGV",2,2016,"Arcadia — Santa Anita Park opened 1934","Santa Anita Park hosted the 1984 Olympic equestrian events — the Gold Line Extension brought rail access to Arcadia in 2016."],
  ["Santa Anita",["A"],"Pasadena/SGV",2,2016,"Horse racing spur — major event ridership","On race days, Santa Anita station becomes one of the most crowded stops on the entire A Line extension corridor."],
  ["Monrovia",["A"],"Pasadena/SGV",2,2016,"Historic Monrovia downtown — Myrtle Ave dining","Monrovia's Myrtle Avenue restaurant row experienced a rail-driven renaissance since the Foothill Extension opened in 2016."],
  ["Duarte/City of Hope",["A"],"Pasadena/SGV",2,2016,"City of Hope — world-renowned cancer center","City of Hope is one of the world's top cancer treatment and research centers — the station name honors this landmark institution."],
  ["Irwindale",["A"],"Pasadena/SGV",2,2016,"Irwindale — industrial city near the San Gabriel River","Irwindale is home to one of the western United States' largest brewing facilities, anchoring its industrial economy."],
  ["Azusa Downtown",["A"],"Pomona/Azusa",2,2016,"Downtown Azusa — Citrus Ave commercial corridor","Azusa's historic downtown revitalized around the Gold Line Extension — Citrus Avenue has become a dining destination."],
  ["APU/Citrus College",["A"],"Pomona/Azusa",3,2016,"Azusa Pacific University and Citrus Community College","APU/Citrus College serves two major institutions of higher learning, generating consistent strong student ridership on the A Line."],
  ["Claremont",["A"],"Pomona/Azusa",3,2026,"Claremont Colleges — prestigious liberal arts consortium","The Claremont Colleges are a consortium of seven world-class institutions — among America's most celebrated small-college campuses."],
  ["Montclair",["A"],"Pomona/Azusa",2,2026,"Montclair — western San Bernardino County gateway","Montclair is a key Inland Empire gateway community connecting the San Bernardino Valley to the broader LA Metro network."],
  ["Pomona North",["A"],"Pomona/Azusa",2,2026,"Eastern terminus of the A Line — 2026 extension","Pomona North is the 2026 eastern terminus of the A Line, connecting LA Metro to the Pomona Valley and Inland Empire."],
  // ── A Line East Branch (Eastside Extension, toward East LA) ───────────────
  ["Soto",["A"],"East LA",2,2009,"Soto St corridor — Boyle Heights neighborhood","Boyle Heights is one of LA's most culturally significant communities — Soto Street anchors its commercial and civic life."],
  ["Indiana",["A"],"East LA",2,2009,"Indiana St in East LA — Cesar Chavez corridor","Indiana station serves the Cesar Chavez Avenue corridor, the main artery of East Los Angeles."],
  ["Maravilla",["A"],"East LA",2,2009,"Maravilla — historic unincorporated East LA","Maravilla has a rich Mexican American cultural heritage stretching back generations in unincorporated East Los Angeles."],
  ["Atlantic",["A"],"East LA",2,2009,"Atlantic Blvd — gateway to the San Gabriel Valley","Atlantic station marks the approximate boundary between East LA and the beginning of the San Gabriel Valley communities."],
  ["East LA Civic Center",["A"],"East LA",3,2009,"East LA County hub — eastern terminus of the branch","East LA Civic Center serves the governmental heart of unincorporated East LA — one of the largest unincorporated communities in the US."],
  // ── A Line South (Blue Line, Downtown to Long Beach) ──────────────────────
  ["Washington",["A"],"South LA",2,1990,"Washington Blvd — South Central LA corridor","Washington station serves one of South Central's busiest east-west corridors, with key bus connections to surrounding neighborhoods."],
  ["Slauson",["A"],"South LA",2,1990,"Slauson Ave — main South LA artery","Slauson Avenue is one of South LA's main east-west arteries, known for local businesses and neighborhood character."],
  ["Florence",["A"],"South LA",3,1990,"Florence-Firestone — unincorporated South LA County","Florence-Firestone is an unincorporated community that has seen significant transit-adjacent investment since rail arrived in 1990."],
  ["Firestone",["A"],"South LA",3,1990,"Firestone Blvd — South Central near Watts","Firestone station serves one of South LA's busiest corridors, providing critical transit access to car-free households."],
  ["103rd St/Watts Towers",["A"],"South LA",2,1990,"Watts Towers — National Historic Landmark","The Watts Towers, built by Sabato Rodia over 33 years with scrap metal and glass, are among America's most remarkable folk art structures."],
  ["Vermont/I-105",["A"],"South LA",3,1990,"Vermont Ave and the Glenn Anderson Freeway interchange","Vermont/I-105 connects the A Line to major bus routes serving communities on both sides of the 105 Freeway."],
  ["Harbor Freeway",["A","C"],"South LA",2,1990,"A and C Line transfer along the 110 corridor","Harbor Freeway is an important cross-platform transfer between the A Line (south to Long Beach) and C Line (east to Norwalk)."],
  ["Willowbrook/Rosa Parks",["A","C"],"South LA",4,1990,"Renamed for Rosa Parks in 2019 — A and C transfer hub","Willowbrook was renamed Rosa Parks Station in 2019 — this is the key transfer between the A Line to Long Beach and C Line to Norwalk/LAX."],
  ["Compton",["A"],"Long Beach",3,1990,"Downtown Compton — historic South LA city","Compton is one of LA County's most storied cities — its cultural influence on hip-hop music is unmatched worldwide."],
  ["Artesia",["A"],"Long Beach",2,1990,"Artesia — dense suburban city in southern LA County","Artesia is a small, densely populated city in South LA County served by the A Line since its original 1990 opening."],
  ["Del Amo",["A"],"Long Beach",2,1991,"Del Amo area — named for early California landowners","The Del Amo family were early California ranchers in this region — the station marks North Long Beach's suburban spread."],
  ["Wardlow",["A"],"Long Beach",2,1991,"Wardlow Rd — north Long Beach residential community","Wardlow serves North Long Beach's residential communities, with connections to key bus corridors across the city."],
  ["Willow Street",["A"],"Long Beach",2,1991,"Willow St — midway through Long Beach","Willow Street station provides access to North Long Beach's diverse communities and the Willow Springs commercial district."],
  ["Pacific Coast Highway",["A"],"Long Beach",3,1991,"PCH in Long Beach — near Cal State Long Beach","Pacific Coast Highway station is within walking distance of California State University Long Beach, generating strong student ridership."],
  ["Anaheim Street",["A"],"Long Beach",3,1991,"Anaheim St — central Long Beach east-west corridor","Anaheim Street is one of Long Beach's major east-west corridors connecting A Line communities across the city."],
  ["5th Street",["A"],"Long Beach",3,1991,"5th St — in Long Beach's urban core","5th Street station sits in Long Beach's dense urban core, connecting riders to downtown destinations and surrounding neighborhoods."],
  ["1st Street",["A"],"Long Beach",3,1991,"1st St — near Bluff Park and the Pacific","1st Street station is steps from Bluff Park and the Pacific Ocean — one of the closest A Line stops to the beach."],
  ["Downtown Long Beach",["A"],"Long Beach",5,1990,"Southern terminus — Pine Ave and the waterfront","Downtown Long Beach is the A Line's southern terminus — Pine Avenue's restaurant row and the Queen Mary are nearby."],
  // ── B LINE (Red Subway) ───────────────────────────────────────────────────
  ["North Hollywood",["B"],"North Hollywood",5,2000,"NoHo Arts District — northern terminus of B Line","North Hollywood's Arts District grew around the B Line terminus — NoHo has become one of the San Fernando Valley's top creative hubs."],
  ["Universal City/Studio City",["B"],"Hollywood",4,1999,"Universal Studios Hollywood — 9 million visitors annually","Universal Studios Hollywood draws 9 million visitors per year — this is one of the most tourist-heavy B Line stations."],
  ["Hollywood/Highland",["B"],"Hollywood",5,1999,"Walk of Fame — Dolby Theatre — Academy Awards","The Dolby Theatre hosts the Academy Awards — Hollywood/Highland is one of the most photographed Metro stations in the system."],
  ["Hollywood/Vine",["B"],"Hollywood",4,1999,"The most famous intersection in Hollywood","Hollywood and Vine has been the symbolic center of Hollywood since the 1920s — the station features a striking mosaic art installation."],
  ["Hollywood/Western",["B"],"Hollywood",3,1993,"Hollywood's eastern edge — major bus transfer point","Hollywood/Western serves a vital stretch of Hollywood — a key junction for multiple cross-town bus lines serving the area."],
  ["Vermont/Sunset",["B"],"Hollywood",3,1993,"Vermont and Sunset — gateway to Los Feliz","Vermont and Sunset marks the gateway to Los Feliz — one of LA's most walkable and culturally vibrant neighborhoods."],
  ["Vermont/Santa Monica",["B"],"Hollywood",3,1993,"Vermont and Santa Monica Blvd — East Hollywood","Vermont/Santa Monica serves East Hollywood's dense residential corridors — a heavily used commuter stop on the B Line."],
  ["Vermont/Beverly",["B"],"Mid-Wilshire",3,1993,"Vermont and Beverly — edge of Koreatown","Vermont/Beverly is the southernmost B-Line-only station, sitting at the northern edge of Koreatown."],
  // ── B+D SHARED ────────────────────────────────────────────────────────────
  ["Wilshire/Vermont",["B","D"],"Mid-Wilshire",4,1993,"Major Koreatown hub — B and D Lines diverge here","Wilshire/Vermont is where the B Line heads north and D Line diverges west — one of the system's busiest transfer stations."],
  ["Wilshire/Normandie",["B","D"],"Mid-Wilshire",3,1993,"Koreatown's commercial heart along Wilshire","Koreatown along Wilshire Blvd is one of the densest urban neighborhoods in the US, with thriving Korean cultural institutions."],
  ["Wilshire/Western",["B","D"],"Mid-Wilshire",3,1993,"Former western terminus of the original Purple Line","Wilshire/Western was the Purple Line's original western terminus for many years before the 2023 D Line extension opened."],
  ["Westlake/MacArthur Park",["B","D"],"Mid-Wilshire",4,1993,"MacArthur Park — vibrant multicultural neighborhood","MacArthur Park is one of LA's densest neighborhoods, home to a vibrant Central American immigrant community and Alvarado Street market."],
  // ── D LINE UNIQUE (Extension west) ────────────────────────────────────────
  ["Wilshire/La Brea",["D"],"Mid-Wilshire",3,2023,"Miracle Mile — LACMA and La Brea Tar Pits","Wilshire/La Brea anchors the Miracle Mile — LACMA, the La Brea Tar Pits, and Petersen Automotive Museum are all nearby."],
  ["Wilshire/Fairfax",["D"],"Mid-Wilshire",3,2023,"The Grove and Farmers Market — Fairfax Village","Wilshire/Fairfax is steps from The Grove and the historic 1934 Farmers Market — two of LA's most visited destinations."],
  ["Wilshire/La Cienega",["D"],"Mid-Wilshire",3,2023,"Beverly Hills gateway — 2023 extension station","Wilshire/La Cienega opened in 2023 as part of the D Line extension, marking the edge of Beverly Hills on the Westside."],
  ["Wilshire/Rodeo",["D"],"Mid-Wilshire",3,2025,"Rodeo Drive and Beverly Hills — Phase 2","Wilshire/Rodeo puts riders steps from world-famous Rodeo Drive — the heart of Beverly Hills luxury retail."],
  ["Westwood/UCLA",["D"],"West LA/Santa Monica",4,2026,"UCLA campus — 46,000 students served by rail","With 46,000 students, UCLA generates enormous demand — Westwood/UCLA is one of the most anticipated D Line Phase 2 stations."],
  ["Westwood/VA Hospital",["D"],"West LA/Santa Monica",2,2026,"VA West LA campus — western terminus of D Line","Westwood/VA Hospital serves the Veterans Affairs campus and marks the 2026 western terminus of the D Line Phase 2 extension."],
  // ── E LINE (Expo) ─────────────────────────────────────────────────────────
  ["LATTC/Ortho Institute",["E"],"Downtown LA",2,2012,"LA Trade Tech College — eastern E Line stop","LATTC/Ortho Institute marks the eastern gateway of the E Line — one of California's top trade colleges is served here."],
  ["Jefferson/USC",["E"],"South LA",4,2012,"University of Southern California — Coliseum adjacent","USC with 48,000 students drives massive ridership — the LA Memorial Coliseum next door makes this an event-night powerhouse stop."],
  ["Expo/Vermont",["E"],"South LA",3,2012,"Vermont Ave and Expo Blvd — near Exposition Park","Expo/Vermont serves South LA's Exposition Park area — home to the California Science Center, Natural History Museum, and the Coliseum."],
  ["Expo/Western",["E"],"South LA",2,2012,"Western Ave and Expo Blvd — South LA bus connector","Expo/Western serves South LA's Western Avenue corridor, one of the area's major north-south bus corridors."],
  ["Farmdale",["E"],"Inglewood/Crenshaw",2,2012,"Farmdale neighborhood — quiet E Line stop","Farmdale is a quieter E Line stop serving South LA's residential communities along the Exposition Boulevard corridor."],
  ["Expo/Crenshaw",["E","K"],"Inglewood/Crenshaw",3,2022,"Transfer: E and K Lines — gateway to Crenshaw","Expo/Crenshaw is the northern terminus of the K Line and an E Line transfer — key gateway to the Crenshaw and Inglewood corridors."],
  ["Expo/La Brea",["E"],"Mid-Wilshire",2,2012,"Expo Blvd at La Brea — West Adams corridor","A quieter E Line station between the La Brea corridor and the emerging West Adams neighborhood along Exposition Blvd."],
  ["La Cienega/Jefferson",["E"],"Mid-Wilshire",3,2012,"La Cienega and Jefferson — Mid-Cities connector","La Cienega/Jefferson sits between Culver City and the Crenshaw corridor, serving a dense residential and commercial area."],
  ["Culver City",["E"],"Mid-Wilshire",4,2012,"Sony Pictures, Apple, Amazon — Culver City tech hub","Culver City transformed into an LA tech and creative hub — Sony Pictures, Apple, and Amazon all have major offices nearby."],
  ["National/Palms",["E"],"West LA/Santa Monica",2,2016,"National Blvd — West LA residential corridor","National/Palms serves quiet West LA residential neighborhoods between Culver City and Palms along the Expo Line corridor."],
  ["Palms",["E"],"West LA/Santa Monica",3,2016,"Palms — one of West LA's most affordable neighborhoods","Palms is one of West LA's most affordable neighborhoods — the E Line dramatically improved transit access for this community."],
  ["Expo/Sepulveda",["E"],"West LA/Santa Monica",2,2016,"Sepulveda Blvd crossing — West LA connector","Expo/Sepulveda connects riders to the Sepulveda Blvd corridor with onward bus connections toward the South Bay."],
  ["Expo/Bundy",["E"],"West LA/Santa Monica",3,2016,"Bundy Ave — West LA residential area","Expo/Bundy serves dense West LA residential neighborhoods between Santa Monica and the Westside communities."],
  ["26th St/Bergamot",["E"],"West LA/Santa Monica",3,2016,"Bergamot Station — LA's largest gallery complex","Bergamot Station is a transformed historic train depot housing one of the largest art gallery complexes in Los Angeles."],
  ["17th St/SMC",["E"],"West LA/Santa Monica",3,2016,"Santa Monica College — top transfer rates in California","Santa Monica College is consistently among the top community colleges for UC and Cal State transfer rates in the state."],
  ["Downtown Santa Monica",["E"],"West LA/Santa Monica",5,2016,"Third St Promenade and Santa Monica Beach","Downtown Santa Monica is the E Line's western terminus — Third Street Promenade and the Pacific Ocean are steps from the platform."],
  // ── K LINE (Crenshaw/LAX) ─────────────────────────────────────────────────
  ["Leimert Park",["K"],"Inglewood/Crenshaw",3,2022,"Leimert Park Village — heart of Black LA culture","Leimert Park Village is the cultural and artistic heart of Black Los Angeles — home of the Vision Theatre and vibrant street art."],
  ["Hyde Park",["K"],"Inglewood/Crenshaw",2,2022,"Hyde Park — tight-knit South LA community","Hyde Park is a South LA community with a strong history of civic engagement and neighborhood pride along the Crenshaw corridor."],
  ["Fairview Heights",["K"],"Inglewood/Crenshaw",2,2022,"Fairview Heights — South LA near Inglewood","Fairview Heights station connects South LA residential communities to the growing Crenshaw/Inglewood transit corridor."],
  ["Downtown Inglewood",["K"],"Inglewood/Crenshaw",4,2022,"SoFi Stadium and Kia Forum — entertainment capital","Downtown Inglewood hosts SoFi Stadium (Rams, Chargers) and Kia Forum — the K Line made this district transit-accessible for all of LA."],
  ["Westchester/Veterans",["K"],"South Bay/LAX",3,2022,"Westchester — near the LAX Airport perimeter","Westchester/Veterans serves communities near LAX and connects K Line riders to airport shuttle access for the final approach."],
  ["Aviation/Century",["K"],"South Bay/LAX",3,2022,"Century Blvd and Aviation Blvd — LAX perimeter","Aviation/Century sits at the edge of the LAX campus, connecting K Line riders to the airport's automated people mover."],
  ["Crenshaw/I-105",["K"],"South Bay/LAX",2,2022,"Crenshaw and the Glenn Anderson Freeway (105)","Crenshaw/I-105 is a major South LA interchange station where bus routes and freeway connections serve the surrounding area."],
  ["Hawthorne/Lennox",["K","C"],"South Bay/LAX",3,1995,"K and C Line transfer — Hawthorne city center","Hawthorne is the hometown of the Beach Boys — this K/C transfer hub serves communities that shaped California rock and roll history."],
  ["Hawthorne/Artesia",["K"],"South Bay/LAX",2,2026,"Artesia Blvd — K Line extension toward South Bay","Hawthorne/Artesia is a 2026 K Line extension station connecting Hawthorne's communities toward the South Bay coastline."],
  ["Lawndale/Rosecrans",["K"],"South Bay/LAX",2,2026,"Lawndale — K Line extension through South Bay","Lawndale/Rosecrans is a 2026 K Line extension stop between Hawthorne and the Redondo Beach terminus."],
  ["Redondo Beach",["K"],"South Bay/LAX",3,2026,"Southern terminus of K Line — South Bay coast","Redondo Beach is the 2026 K Line extension terminus, connecting the Crenshaw corridor to one of LA County's most popular coastal cities."],
  // ── C LINE (Green) ────────────────────────────────────────────────────────
  ["LAX/Metro Transit Center",["C"],"South Bay/LAX",5,2023,"Consolidated LAX transit hub — opened 2023","The LAX/Metro Transit Center opened in 2023, replacing the old shuttle loop — passengers now walk directly between terminals and trains."],
  ["Aviation/LAX",["C"],"South Bay/LAX",4,1995,"Original LAX rail connection — Aviation Blvd perimeter","Aviation/LAX was the first rail connection to LAX's perimeter since the C Line opened in 1995 — still serves Aviation Blvd."],
  ["Mariposa",["C"],"South Bay/LAX",2,1995,"Mariposa Ave — El Segundo residential stop","Mariposa serves El Segundo's residential neighborhoods along Aviation Boulevard — a quieter C Line stop near the South Bay."],
  ["El Segundo",["C"],"South Bay/LAX",3,1995,"El Segundo — aerospace capital of the South Bay","El Segundo is home to SpaceX headquarters, Raytheon, Northrop Grumman, and numerous aerospace firms clustered near LAX."],
  ["Douglas",["C"],"South Bay/LAX",2,1995,"Named for the historic Douglas Aircraft Company","Douglas Aircraft was founded in this area in 1920 — the station name commemorates the aviation pioneer who built this community."],
  ["Aviation/I-405",["C"],"South Bay/LAX",2,1995,"Aviation Blvd at the San Diego Freeway (405)","Aviation/I-405 serves communities along the 405 corridor with connections to major South Bay bus lines heading inland."],
  ["Rosecrans",["C"],"South Bay/LAX",2,1995,"Rosecrans Ave — northern Hawthorne connector","Rosecrans serves the northern edge of Hawthorne, connecting C Line riders to key South Bay bus routes along the corridor."],
  ["Lennox",["C"],"South Bay/LAX",2,1995,"Lennox — unincorporated LA County near LAX","Lennox is an unincorporated community directly south of LAX — one of the South Bay's most densely populated neighborhoods."],
  ["Compton/Rosecrans",["C"],"South LA",2,1995,"Compton–Rosecrans corridor on the C Line","Compton/Rosecrans serves the southern edge of Compton along the C Line's east-west South LA corridor."],
  ["Crenshaw",["C"],"South LA",2,1995,"Crenshaw Blvd on the C Line — South LA","Crenshaw station on the C Line (Green) serves the eastern portion of the Crenshaw corridor in South Los Angeles."],
  ["Vermont/Athens",["C"],"South LA",2,1995,"Vermont Ave near the community of Athens","Vermont/Athens serves the unincorporated Athens community — one of LA County's historically underserved South LA neighborhoods."],
  ["Vermont/Harbor Freeway",["C"],"South LA",2,1995,"Vermont Ave at the Harbor Freeway (110)","Vermont/Harbor Freeway provides C Line connections to major bus routes serving South LA near the 110 corridor."],
  ["Long Beach Blvd",["C"],"Long Beach",2,1995,"Long Beach Blvd corridor — eastern reach of C Line","Long Beach Boulevard is a major South LA/Long Beach commercial street — the C Line connects communities along its length."],
  ["Lakewood Blvd",["C"],"Long Beach",2,1995,"Lakewood Blvd — Paramount and Bellflower border","Lakewood Boulevard station serves suburban communities of Paramount and Bellflower on the eastern edge of LA County."],
  ["Norwalk",["C"],"Long Beach",3,1995,"Eastern terminus of C Line — Norwalk Transit Center","Norwalk is the C Line's eastern terminus, connecting to a major bus transit center serving southeastern LA County communities."],
];
const LA_IMG:Record<string,string>={
  "Union Station":"Los_Angeles_Union_Station_train_hall.jpg",
  "Civic Center/Grand Park":"Los_Angeles_City_Hall.jpg",
  "Pershing Square":"Pershing_Square_station_(Los_Angeles_Metro).jpg",
  "7th St/Metro Center":"7th_Street-Metro_Center_station_Los_Angeles_Metro.jpg",
  "Pico":"Pico_station_(Los_Angeles_Metro).jpg",
  "Chinatown":"Chinatown_Los_Angeles.jpg",
  "Little Tokyo/Arts District":"Little_Tokyo_Los_Angeles.jpg",
  "Heritage Square/Arroyo":"Heritage_Square_Museum_Los_Angeles.jpg",
  "Fillmore":"Fillmore_station_Los_Angeles.jpg",
  "Del Mar":"Old_Pasadena_at_Del_Mar_station.jpg",
  "Memorial Park":"Memorial_Park_Pasadena.jpg",
  "Sierra Madre Villa":"Sierra_Madre_Villa_station.jpg",
  "Arcadia":"Arcadia_California.jpg",
  "Monrovia":"Monrovia_California_station.jpg",
  "Azusa Downtown":"Azusa_Downtown_station.jpg",
  "Pomona North":"Pomona_California.jpg",
  "North Hollywood":"North_Hollywood_station_(Los_Angeles_Metro).jpg",
  "Universal City/Studio City":"Universal_City_station_(Los_Angeles_Metro).jpg",
  "Hollywood/Highland":"Hollywood_Highland_station.jpg",
  "Hollywood/Vine":"Hollywood_Vine_station.jpg",
  "Hollywood/Western":"Hollywood_Western_station.jpg",
  "Vermont/Sunset":"Vermont_Sunset_station.jpg",
  "Vermont/Santa Monica":"Vermont_Santa_Monica_station.jpg",
  "Vermont/Beverly":"Vermont_Beverly_station.jpg",
  "Wilshire/Vermont":"Wilshire_Vermont_station.jpg",
  "Wilshire/Normandie":"Wilshire_Normandie_station.jpg",
  "Wilshire/Western":"Wilshire_Western_station.jpg",
  "Westlake/MacArthur Park":"MacArthur_Park_Los_Angeles.jpg",
  "Wilshire/La Brea":"Wilshire_La_Brea_station.jpg",
  "Wilshire/Fairfax":"Wilshire_Fairfax_station.jpg",
  "Wilshire/La Cienega":"Wilshire_La_Cienega_station.jpg",
  "Wilshire/Rodeo":"Beverly_Hills_Rodeo_Drive.jpg",
  "Westwood/UCLA":"UCLA_campus_aerial.jpg",
  "Downtown Santa Monica":"Santa_Monica_Third_Street_Promenade.jpg",
  "Jefferson/USC":"University_of_Southern_California.jpg",
  "Culver City":"Culver_City_California.jpg",
  "103rd St/Watts Towers":"Watts_Towers_Los_Angeles.jpg",
  "Willowbrook/Rosa Parks":"Rosa_Parks_station_LA_Metro.jpg",
  "Compton":"Compton_California.jpg",
  "Downtown Long Beach":"Downtown_Long_Beach_Metro_station.jpg",
  "LAX/Metro Transit Center":"Los_Angeles_International_Airport.jpg",
  "Aviation/Lax (C)":"Los_Angeles_International_Airport.jpg",
  "Redondo Beach":"Redondo_Beach_California.jpg",
  "Norwalk":"Norwalk_station_LA_Metro.jpg",
  "Harbor Freeway":"Harbor_Freeway_station_LA_Metro.jpg",
  "Washington":"Washington_station_(Los_Angeles_Metro).jpg",
  "Slauson":"Slauson_station_LA_Metro.jpg",
  "Florence":"Florence_station_LA_Metro.jpg",
  "Firestone":"Firestone_station_LA_Metro.jpg",
  "Leimert Park":"Leimert_Park_Los_Angeles.jpg",
  "Hyde Park":"Hyde_Park_Los_Angeles.jpg",
  "Downtown Inglewood":"Inglewood_California.jpg",
  "Crenshaw":"Crenshaw_station_LA_Metro.jpg",
  "Soto":"Soto_station_LA_Metro.jpg",
  "Indiana":"Indiana_station_LA_Metro.jpg",
  "Atlantic":"Atlantic_station_LA_Metro.jpg",
  "East LA Civic Center":"East_Los_Angeles_Civic_Center_station.jpg",
};
const LA_STATIONS=LA_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:LA_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${LA_IMG[name]}`:""}));

const LA_HINTS:{[k:string]:[string,string]}={
  "Union Station":["LA's major transportation landmark — opened 1939","Mission Revival and Art Deco architecture — Amtrak, Metrolink, and 3 Metro lines meet here"],
  "7th St/Metro Center":["The busiest rail junction in the entire LA Metro system","Four lines (A, B, D, E) converge here — the most connected transfer point in the network"],
  "North Hollywood":["Northern terminus of the B Line (Red Subway)","NoHo Arts District grew around this station — San Fernando Valley gateway since 2000"],
  "Hollywood/Highland":["On the B Line — near the most famous tourist strip in LA","The Dolby Theatre (Academy Awards) is steps away — Walk of Fame and Hollywood Blvd"],
  "Downtown Santa Monica":["Western terminus of the E Line (Expo Line)","Third Street Promenade and the Pacific Ocean are steps from the platform"],
  "Downtown Long Beach":["Southern terminus of the A Line (Blue Line)","Pine Avenue's restaurant row and the Queen Mary are nearby"],
  "Wilshire/Vermont":["A major Koreatown station where two lines diverge","The B Line (Red) goes north and D Line (Purple) heads west from this busy hub"],
  "APU/Citrus College":["A Line station in the Pomona/Azusa zone — Foothill Extension","Serves two higher education campuses — opened 2016 as part of the Foothill Gold Line Extension"],
  "Jefferson/USC":["E Line station in South LA — near a major university and historic stadium","Steps from the LA Memorial Coliseum — ridership surges on USC football game days"],
  "Downtown Inglewood":["K Line station — opened 2022 — entertainment district","SoFi Stadium (Rams, Chargers) and Kia Forum are nearby — Inglewood's major sports hub"],
  "LAX/Metro Transit Center":["A C Line station that replaced the old airport shuttle — opened 2023, connecting multiple transit modes","Passengers can walk directly between airport terminals and this consolidated transit hub — a long-awaited improvement"],
  "Expo/Crenshaw":["Transfer station between two Metro lines in the Inglewood zone — one line ends here, the other passes through","This is where the K Line begins its southern run toward Inglewood and the airport — the E Line crosses east-west here"],
  "Pomona North":["Eastern terminus of the A Line — the 2026 extension connecting LA Metro to the Inland Empire","The furthest east point of the A Line, serving the foothill communities at the edge of the Los Angeles basin"],
  "Willowbrook/Rosa Parks":["Renamed for Rosa Parks in 2019 — South LA zone","The key A Line + C Line transfer point — formerly called Willowbrook station"],
  "103rd St/Watts Towers":["A Line station in South LA — opened 1990","Steps from the Watts Towers — a National Historic Landmark built over 33 years"],
};

const LA_TRIVIA=[
  {q:"What year did the LA Metro Rail system first open?",opts:["1986","1988","1990","1992"],ans:2},
  {q:"Which color represents the LA Metro A Line?",opts:["Red","Blue","Green","Purple"],ans:1},
  {q:"The B Line (Red Subway) runs between which two endpoints?",opts:["Downtown to Long Beach","North Hollywood to Union Station","Santa Monica to 7th St","Union Station to Compton"],ans:1},
  {q:"Which station serves Universal Studios Hollywood on the B Line?",opts:["Hollywood/Highland","North Hollywood","Universal City/Studio City","Hollywood/Vine"],ans:2},
  {q:"What year did the Expo Line (E Line) reach Downtown Santa Monica?",opts:["2012","2014","2016","2018"],ans:2},
  {q:"The K Line (Crenshaw/LAX) opened in which year?",opts:["2018","2020","2022","2024"],ans:2},
  {q:"Which station is the transfer point between the E and K Lines?",opts:["Willowbrook/Rosa Parks","Hawthorne/Lennox","Expo/Crenshaw","Downtown Inglewood"],ans:2},
  {q:"The Gold Line (now A Line) reached Azusa Downtown in which year?",opts:["2012","2014","2016","2018"],ans:2},
  {q:"Which station was renamed to honor Rosa Parks in 2019?",opts:["Compton","Harbor Freeway","Willowbrook/Rosa Parks","Vermont/I-105"],ans:2},
  {q:"How many lines does the LA Metro Rail system have as of 2026?",opts:["4","5","6","7"],ans:2},
  {q:"The D Line (Purple) extended west to which station in 2023?",opts:["Westwood/UCLA","Wilshire/La Brea","Wilshire/La Cienega","Beverly Hills"],ans:2},
  {q:"Union Station's architecture blends which two styles?",opts:["Modernist and Brutalist","Mission Revival and Art Deco","Baroque and Gothic","Craftsman and Tudor"],ans:1},
  {q:"Which LA Metro line serves the USC campus and LA Memorial Coliseum?",opts:["A Line","B Line","D Line","E Line"],ans:3},
  {q:"The LAX/Metro Transit Center opened in which year?",opts:["2020","2021","2022","2023"],ans:3},
  {q:"Which K Line station is near SoFi Stadium?",opts:["Aviation/Century","Westchester/Veterans","Downtown Inglewood","Expo/Crenshaw"],ans:2},
  {q:"The A Line's northeastern terminus (as of 2026) is which station?",opts:["APU/Citrus College","Azusa Downtown","Claremont","Pomona North"],ans:3},
  {q:"Which LA Metro line serves the Leimert Park neighborhood?",opts:["A Line","C Line","E Line","K Line"],ans:3},
  {q:"Hawthorne, California — served by the K/C Line — is famously the hometown of which group?",opts:["The Eagles","Fleetwood Mac","The Beach Boys","The Doors"],ans:2},
  {q:"The C Line (Green) runs between which two endpoints?",opts:["LAX/Metro Transit Center and Norwalk","Expo/Crenshaw and Redondo Beach","Union Station and Long Beach","North Hollywood and Willowbrook"],ans:0},
  {q:"Which LA Metro station has the highest ridership?",opts:["Union Station","North Hollywood","Hollywood/Highland","7th St/Metro Center"],ans:3},
  {q:"The Bergamot Station arts complex is near which E Line stop?",opts:["Culver City","17th St/SMC","26th St/Bergamot","Expo/Bundy"],ans:2},
  {q:"What color is the K Line (Crenshaw/LAX Line)?",opts:["Purple","Pink","Silver","Teal"],ans:1},
  {q:"The E Line (Expo) was originally built along which historic right-of-way?",opts:["Pacific Electric Red Car route","Union Pacific freight line","Santa Fe Railway corridor","Southern Pacific mainline"],ans:0},
  {q:"Which D Line station is steps from LACMA and the La Brea Tar Pits?",opts:["Wilshire/La Cienega","Wilshire/Rodeo","Wilshire/Fairfax","Wilshire/La Brea"],ans:3},
  {q:"The Watts Towers are a National Historic Landmark near which A Line station?",opts:["Firestone","103rd St/Watts Towers","Vermont/I-105","Willowbrook/Rosa Parks"],ans:1},
  {q:"Claremont station (2026) is closest to which notable institution?",opts:["Cal Poly Pomona","UC Riverside","The Claremont Colleges","Azusa Pacific University"],ans:2},
];

// ── NYC SUBWAY ────────────────────────────────────────────────────────────────
const NYC_DYK=["The NYC Subway opened in 1904 and carries over 1.6 billion riders a year — one of the busiest systems on Earth.","Grand Central–42 St is one of the busiest transit hubs on Earth with over 44 million subway riders annually.","Times Square–42 St / Port Authority connects 11 subway lines — the most complex station in the world.","The NYC Subway never officially closes — it runs 24 hours a day, 7 days a week, 365 days a year.","The 7 train corridor between Times Square and Flushing is considered the most ethnically diverse in the United States.","The A train runs the longest continuous route — over 31 miles from Inwood to Far Rockaway.","The G train is the only line in the system that doesn't pass through Manhattan.","The Second Avenue Subway (Q extension) opened in 2017 after being planned since the 1920s.","Atlantic Av-Barclays Ctr connects 11 train lines — the most connected station outside of Manhattan.","Coney Island–Stillwell Av is the largest elevated terminal in the world, serving 4 lines under the open sky."];
const NYC_TRIVIA=[
  {q:"What year did the NYC Subway first open?",opts:["1900","1904","1910","1920"],ans:1},
  {q:"Which NYC Subway line runs the longest route at over 31 miles?",opts:["1 Train","7 Train","A Train","L Train"],ans:2},
  {q:"Times Square station connects how many subway lines?",opts:["7","9","11","13"],ans:2},
  {q:"Which borough does NOT have any NYC Subway service?",opts:["Staten Island","The Bronx","Queens","Brooklyn"],ans:0},
  {q:"Which color represents the A/C/E lines?",opts:["Red","Blue","Green","Orange"],ans:1},
  {q:"Which station is the southern terminus of the 1/2/3 lines?",opts:["Chambers St","Fulton St","South Ferry","Rector St"],ans:2},
  {q:"Atlantic Av-Barclays Ctr is located in which borough?",opts:["Manhattan","Queens","Brooklyn","The Bronx"],ans:2},
  {q:"The L train's western Manhattan terminus is at which station?",opts:["14 St-Union Sq","8 Av","6 Av","3 Av"],ans:1},
  {q:"The G train is unique because it does NOT pass through which borough?",opts:["Brooklyn","Queens","The Bronx","Manhattan"],ans:3},
  {q:"The Second Avenue Subway (Q line extension) opened in which year?",opts:["2014","2016","2017","2019"],ans:2},
  {q:"Which NYC Subway line serves JFK Airport via AirTrain connection?",opts:["A Train","E Train","Both A and E","7 Train"],ans:2},
  {q:"Which express line runs through Harlem on the west side?",opts:["2/3","4/5","A/C","B/D"],ans:0},
  {q:"What is the busiest single subway station in the NYC system?",opts:["Times Sq–42 St","Grand Central–42 St","Union Square","Fulton St"],ans:0},
  {q:"Coney Island–Stillwell Av is the terminal for which lines?",opts:["N/Q/R/W","B/D/F/M","N/Q/D/F","A/C/F/G"],ans:2},
  {q:"Which station houses MTA headquarters beneath it?",opts:["Grand Central–42 St","Jay St-MetroTech","Atlantic Av-Barclays Ctr","Fulton St"],ans:1},
];
const NYC_HINTS:{[k:string]:[string,string]}={
  "Times Sq-42 St / Port Auth Bus Terminal":["The crossroads of the world — one of the world's busiest transit complexes","11 subway lines, 3 bus terminals, and millions of tourists — this station never sleeps"],
  "Grand Central-42 St":["Beneath the famous terminal with the celestial ceiling and famous clock","44 million subway riders per year — the busiest single station in the system"],
  "Fulton St":["A major lower Manhattan hub rebuilt as part of WTC redevelopment — opened 2014","Downtown Financial District — connects 2/3/4/5/A/C/J/Z lines"],
  "14 St-Union Sq":["A massive transfer hub near a famous greenmarket and protest history","4/5/6/L/N/Q/R/W all meet here — one of the busiest complexes in the system"],
  "Jay St-MetroTech":["MTA headquarters are literally located in this Brooklyn station","A/C/F and R trains serve this administrative hub in Downtown Brooklyn"],
  "Atlantic Av-Barclays Ctr":["Beside a major Brooklyn arena — one of NYC's biggest multi-line hubs","LIRR, 2/3/4/5/B/D/N/Q/R — 11 trains converge in Downtown Brooklyn"],
  "Flushing-Main St":["Eastern terminus of the 7 — the heart of one of America's largest Chinatowns","Flushing, Queens is home to the second-largest Chinese population in the US"],
  "Canal St":["One of the most famous intersections in Manhattan — near Chinatown and Little Italy","A/C/E and J/N/Q/R/W/Z all stop here near the Manhattan Bridge"],
  "125 St":["The cultural center of Harlem — steps from the Apollo Theater","Served by A/B/C/D and 2/3 at different Harlem locations"],
  "Court Sq":["Major LIC hub — gateway to Long Island City's growing skyline","E/G/M/7 lines converge near corporate offices and creative studios"],
  "Jackson Hts-Roosevelt Av":["The most ethnically diverse zip code in the entire United States","E/F/M/R/7 — a neighborhood of incredible food from around the world"],
  "South Ferry":["Southern tip of Manhattan — gateway to the free Staten Island Ferry","Terminus of the 1 train — views of the Statue of Liberty and NY Harbor"],
  "Astoria-Ditmars Blvd":["Northern Queens terminus near LaGuardia Airport — the best Greek food outside of Greece is around the corner","N and W trains — the neighborhood here has had a strong Greek community since the 1960s"],
  "Pelham Bay Park":["Eastern Bronx terminus — adjacent to the largest park in NYC","At 2,772 acres, this station is 3× the size of Central Park"],
  "Coney Island-Stillwell Av":["The largest open-air subway terminal in the world — 4 lines end under the Brooklyn sky, steps from the Atlantic","Nathan's Famous hot dog stand opened here in 1916 — the boardwalk and Luna Park are steps from the platform"],
  "34 St-Penn Station":["Beneath Penn Station — one of the world's busiest rail hubs connecting subway, NJ Transit, LIRR, and Amtrak","The original Penn Station's 1963 demolition was so devastating it directly sparked the US historic preservation movement"],
  "59 St-Columbus Circle":["Gateway to Central Park — A/B/C/D and 1 trains converge at the park's southwest corner","Columbus Circle marks the official center point from which all New York City road distances are measured"],
  "Brooklyn Bridge-City Hall":["Historic IRT hub beneath one of the world's most famous bridges — opened with the original subway in 1904","The original City Hall loop station (1904) is preserved underground — a stunning Guastavino-tiled vault sealed since 1945"],
  "47-50 Sts-Rockefeller Ctr":["Beneath Rockefeller Center — B/D/F/M stop amid the most famous midtown complex","30 Rock, Radio City Music Hall, and the Christmas tree are all steps from this station"],
  "Wall St":["Beneath the financial capital of the world — the 2/3 and 4/5 both stop here","The New York Stock Exchange, steps away, has operated continuously since 1817"],
  "Astor Pl":["East Village stop named for the Astor family — terra cotta and iron beauty from 1904","The famous rotating iron cube on the street above has been an East Village landmark for decades"],
  "Bedford Av":["The quintessential L train Brooklyn stop — gateway to Williamsburg's arts and nightlife","Bedford Avenue is the spine of Williamsburg — the L train's influence on this neighborhood is a defining story of modern NYC"],
  "Smith-9 Sts":["The highest elevated subway station in NYC — 87.5 feet above street level","On a clear day, views from this platform stretch from the Statue of Liberty to the Manhattan skyline"],
  "Mets-Willets Point":["Home of the Mets — Citi Field sits steps from this 7 train platform","Shea Stadium, demolished in 2008, stood on this same site — generations of Mets fans have poured through Willets Point"],
  "125 St (A/B/C)":["The 125th Street A/B/C stop on 8th Avenue — a different complex from the 2/3 station a few blocks away","The A train runs express from this Harlem stop to Midtown in minutes — one of the fastest runs in the system"],
  "Hoyt-Schermerhorn Sts":["Wide-platform A/C/G station in Brooklyn Heights — famous as a movie set for decades","The extra-wide center platform was built for express tracks that were never added — it's since been rented out as a film and TV set countless times"],
  "Nassau Av":["G train stop in Greenpoint, Brooklyn — the bridge between Williamsburg and Long Island City","Greenpoint Avenue is one of Brooklyn's most walkable and beloved streets — Polish bakeries, coffee shops, and industrial lofts side by side"],
};
const NYC_RAW:any[]=[
  ["Times Sq-42 St / Port Auth Bus Terminal",["1","2","3","7","A","C","E","N","Q","R","W","S"],"Manhattan",5,1904,"The crossroads of the world — 11 subway lines converge here","Times Square sees over 400,000 people per day — the most visited tourist attraction on Earth."],
  ["Grand Central-42 St",["4","5","6","7","S"],"Manhattan",5,1904,"Beneath Grand Central Terminal — one of the world's most beautiful buildings","The celestial ceiling in Grand Central's main concourse was restored in 1998, revealing a mural of the night sky."],
  ["34 St-Herald Sq",["B","D","F","M","N","Q","R","W"],"Manhattan",5,1908,"Major midtown hub beneath Herald Square — near Macy's flagship store","Macy's Herald Square, steps from this station, is the largest department store in the world by floor area."],
  ["14 St-Union Sq",["4","5","6","L","N","Q","R","W"],"Manhattan",5,1904,"Vibrant downtown hub famous for its greenmarket and protest history","Union Square has been the site of political demonstrations since the 1880s — a true town square."],
  ["Fulton St",["2","3","4","5","A","C","J","Z"],"Manhattan",4,2014,"Rebuilt lower Manhattan hub — opened 2014 after WTC redevelopment","The Fulton Center features a stunning 'Sky Reflector-Net' oculus that bounces natural light into the station."],
  ["Jay St-MetroTech",["A","C","F","R"],"Brooklyn",4,1936,"MTA HQ is here — an administrative hub in Downtown Brooklyn","The station was named for Jay Street and MetroTech Center, a major tech and government office complex."],
  ["Atlantic Av-Barclays Ctr",["2","3","4","5","B","D","N","Q","R"],"Brooklyn",5,1878,"Mega-hub next to Barclays Center — LIRR also serves this complex","The LIRR concourse beneath Barclays Center is among the deepest below-grade construction in NYC history."],
  ["Flushing-Main St",["7"],"Queens",5,1928,"Eastern terminus of the 7 — heart of one of America's largest Chinatowns","Flushing has the second-largest Chinese population in the US after Manhattan's Chinatown."],
  ["Jackson Hts-Roosevelt Av",["E","F","M","R","7"],"Queens",4,1917,"Most ethnically diverse neighborhood in the world — over 160 languages spoken nearby","Jackson Heights has been recognized as the most linguistically diverse urban area on Earth."],
  ["Court Sq",["E","G","M","7"],"Queens",3,1917,"Major LIC hub — gateway to Long Island City's growing skyline","Long Island City went from industrial wasteland to one of NYC's most coveted addresses in under 20 years."],
  ["125 St (2/3)",["2","3"],"Manhattan",4,1904,"Harlem's heartbeat — the 2/3 stop at 125th Street & Broadway/7th Ave","The Apollo Theater, steps away, launched the careers of Ella Fitzgerald, James Brown, and Michael Jackson."],
  ["Canal St",["J","N","Q","R","W","Z","6"],"Manhattan",4,1904,"Gateway to Chinatown — one of NYC's most colorful intersections","Canal Street is the unofficial border between Chinatown, Little Italy, and Tribeca."],
  ["Chambers St",["2","3","A","C","J","Z"],"Manhattan",3,1904,"Downtown hub near City Hall — at the foot of the Brooklyn Bridge","Brooklyn Bridge–City Hall station has stunning Romanesque arches and tiled vaults from 1904."],
  ["South Ferry",["1"],"Manhattan",3,1905,"Southern tip of Manhattan — gateway to the free Staten Island Ferry","On a clear day from the ferry you can see the Statue of Liberty, Ellis Island, and New Jersey."],
  ["Astoria-Ditmars Blvd",["N","W"],"Queens",3,1917,"Northern terminus in Astoria — near LaGuardia Airport","Astoria has the best Greek food outside of Greece — the community has been here since the 1960s."],
  ["Pelham Bay Park",["6"],"Bronx",2,1920,"Eastern Bronx terminus — adjacent to the largest park in NYC","At 2,772 acres, Pelham Bay Park is three times the size of Central Park with a nature center and beach."],
  ["Woodlawn",["4"],"Bronx",2,1918,"Northern Bronx terminus near the historic cemetery","Woodlawn Cemetery is the final resting place of Miles Davis, Herman Melville, and Joseph Pulitzer."],
  ["Far Rockaway-Mott Av",["A"],"Queens",2,1872,"Far end of the A train — practically at the Atlantic Ocean","The Rockaways are a barrier peninsula — you can walk from this station to the beach in minutes."],
  ["Delancey St-Essex St",["F","J","M","Z"],"Manhattan",3,1908,"Lower East Side hub — center of immigrant New York","The Lower East Side Tenement Museum preserves the stories of immigrant families from the 1800s."],
  ["Fordham Rd",["4","D"],"Bronx",3,1933,"Major Bronx commercial corridor — near Fordham University","Fordham Road is one of the busiest retail strips in the US by foot traffic."],
  ["Jamaica-179 St",["F"],"Queens",2,1950,"Eastern Queens terminus of the F — near JFK Airport","AirTrain JFK departs from the Jamaica LIRR/AirTrain station, a short walk from here."],
  ["Howard Beach-JFK Airport",["A"],"Queens",2,1956,"Gateway to JFK Airport on the A line — AirTrain connection","The AirTrain JFK connects to all airport terminals from Howard Beach in under 5 minutes."],
  ["Court St",["R"],"Brooklyn",2,1936,"Brooklyn Heights — one of the most historic neighborhoods in NYC","The Brooklyn Heights Promenade offers unobstructed views of Lower Manhattan and the Brooklyn Bridge."],
  ["Myrtle-Wyckoff Avs",["L","M"],"Brooklyn",3,1928,"Bushwick/Ridgewood transfer — L and M connect Brooklyn and Queens here","Bushwick is one of NYC's most dynamic arts districts — murals cover nearly every building on Jefferson Street."],
  ["86 St",["4","5","6"],"Manhattan",3,1919,"Upper East Side station on the Lexington line","The 86th St corridor is one of the Upper East Side's main commercial strips near Central Park."],
  ["96 St",["1","2","3"],"Manhattan",3,1904,"Upper West Side stop — local 1 and express 2/3","Steps from Riverside Park and the iconic brownstones of the Upper West Side."],
  ["Borough Hall",["2","3","4","5","R"],"Brooklyn",4,1908,"Downtown Brooklyn civic hub — beneath the municipal center","Brooklyn Borough Hall, completed in 1848, is one of the oldest municipal buildings still in active use."],
  ["Church Av",["B","Q"],"Brooklyn",3,1920,"Flatbush hub — Caribbean and West African communities thrive here","Flatbush is one of Brooklyn's most culturally diverse areas — a mosaic of Caribbean, West African, and South Asian communities."],
  ["Sutphin Blvd-Archer Av-JFK Airport",["E","J","Z"],"Queens",3,2003,"Jamaica mega-hub — E/J/Z subway, LIRR, and AirTrain all converge","This station opened in 2003 as part of Jamaica's revitalization — one of the newest stations in the system."],
  ["72 St",["1","2","3"],"Manhattan",3,1904,"Upper West Side gateway — steps from Central Park West","The Dakota building, where John Lennon lived and was shot in 1980, overlooks Strawberry Fields across the street."],
  ["86 St-Riverside",["1"],"Manhattan",3,1932,"Upper West Side local stop near Riverside Drive and Riverside Park","Riverside Park, steps away, stretches four miles along the Hudson River — a beloved Manhattan escape."],
  ["116 St-Columbia University",["1"],"Manhattan",3,1904,"Columbia University's subway station — serving Morningside Heights","Columbia University was founded in 1754 as King's College — one of the oldest universities in the US."],
  ["168 St",["1","A","C"],"Manhattan",3,1906,"Washington Heights hub — Columbia Presbyterian Medical Center nearby","Washington Heights is home to one of the largest Dominican communities in the United States."],
  ["181 St",["A"],"Manhattan",3,1932,"Deep station in Washington Heights — among the deepest in the system","The 181 St A train station sits 180 feet underground — riders take elevators to reach the platform."],
  ["207 St",["A"],"Manhattan",2,1932,"Northern Manhattan terminus of the A — near Inwood Hill Park","Inwood Hill Park contains the last remaining old-growth forest in Manhattan — a hidden wilderness."],
  ["149 St-Grand Concourse",["2","3","4","5"],"Bronx",4,1918,"Major Bronx hub on the Grand Concourse — transfer between express and local lines","The Grand Concourse was modeled after the Champs-Élysées — it's lined with magnificent Art Deco buildings."],
  ["161 St-Yankee Stadium",["4","B","D"],"Bronx",4,1917,"Steps from Yankee Stadium — the most storied sports venue in America","The Yankees have won 27 World Series championships — more than any other team in baseball."],
  ["Tremont Av",["B","D"],"Bronx",2,1917,"Mid-Bronx stop on the B and D — Fordham Road corridor","The Bronx was the birthplace of hip-hop — DJ Kool Herc threw the first recognized hip-hop party in 1973."],
  ["Simpson St",["5"],"Bronx",2,1920,"South Bronx elevated station in Longwood","The South Bronx's muralism and street art scene is one of the most vibrant in the world."],
  ["Dekalb Av",["B","D","N","Q","R"],"Brooklyn",4,1916,"Major Downtown Brooklyn transfer — 5 lines cross here","DeKalb Avenue sits at the epicenter of Brooklyn's downtown revival, surrounded by hip restaurants and boutiques."],
  ["Hoyt-Schermerhorn Sts",["A","C","G"],"Brooklyn",3,1936,"Wide-platform Brooklyn station — A/C/G at the edge of Brooklyn Heights","The unusually wide center platform was built for an express track that was never installed — it has since been rented out as a subway film set for dozens of productions."],
  ["7 Av",["B","Q"],"Brooklyn",3,1920,"Park Slope's main subway stop — Brooklyn's most family-friendly neighborhood","Park Slope's brownstone-lined streets were rated among the best neighborhoods to live in by multiple publications."],
  ["Bay Ridge-95 St",["R"],"Brooklyn",2,1925,"Southern terminus of the R — at the foot of the Verrazzano-Narrows Bridge","The Verrazzano-Narrows Bridge, completed in 1964, was the world's longest suspension bridge for 17 years."],
  ["Coney Island-Stillwell Av",["D","F","N","Q"],"Brooklyn",4,1919,"Multi-line open-air terminal at Coney Island","Coney Island's Luna Park first opened in 1903 — the roller coasters and boardwalk are still thrilling visitors."],
  ["Brighton Beach",["B","Q"],"Brooklyn",3,1878,"Little Odessa — the heart of NYC's Russian-speaking community","Brighton Beach is home to one of the largest Russian-speaking communities in the Western Hemisphere."],
  ["Spring St",["6"],"Manhattan",3,1904,"SoHo and NoLIta stop — surrounded by cast-iron architecture and boutiques","SoHo's cast-iron architecture district is the largest such collection in the world."],
  ["Christopher St-Sheridan Sq",["1"],"Manhattan",3,1918,"The heartbeat of Greenwich Village and NYC's LGBTQ+ history","The Stonewall Inn, site of the 1969 uprising that launched the modern LGBTQ+ rights movement, is steps away."],
  ["West 4 St-Wash Sq",["A","B","C","D","E","F","M"],"Manhattan",4,1932,"Village mega-hub — 7 trains serve Washington Square Park area","Washington Square Park's famous arch was built to celebrate the 100th anniversary of George Washington's inauguration."],
  ["23 St",["1"],"Manhattan",3,1904,"Chelsea stop on the 1 — near the High Line and Chelsea Market","The High Line, an elevated park built on an old freight rail line, runs directly through Chelsea."],
  ["14 St",["A","C","E"],"Manhattan",4,1932,"Far West Side stop serving Chelsea and the Meatpacking District","The Meatpacking District transformed from an actual meatpacking hub into one of NYC's trendiest neighborhoods."],
  ["Lexington Av-63 St",["F","Q"],"Manhattan",3,1989,"One of the newer Upper East Side stations — a late addition to the system","The 63rd Street line was years in construction — the F train connection opened in 1989."],
  ["Roosevelt Island",["F"],"Manhattan",2,1989,"Aerial tramway alternative — one of NYC's most unusual transit options","The Roosevelt Island Tramway is one of the only commuter aerial tramways in the United States."],
  ["Queensboro Plaza",["N","W","7"],"Queens",3,1917,"Long Island City transfer hub — N/W to 7 train connection","Queensboro Plaza offers stunning views of the midtown Manhattan skyline just across the East River."],
  ["74 St-Broadway",["7","E","F","M","R"],"Queens",4,1917,"Jackson Heights transfer — one of the busiest Queens stations","This station is a focal point of Queens' extraordinary cultural diversity — over 130 languages spoken nearby."],
  ["Jamaica Center-Parsons/Archer",["J","Z"],"Queens",3,1918,"Eastern terminus of the J and Z — Jamaica civic center","Jamaica is one of Queens' largest commercial centers and a major transportation hub for eastern Queens."],
  ["Forest Hills-71 Av",["E","F","M","R"],"Queens",3,1936,"Forest Hills landmark — the famous West Side Tennis Club is nearby","Forest Hills Gardens was built in 1908 as a model residential community — its Tudor-style homes are preserved today."],
  ["Flatbush Av-Brooklyn College",["2","5"],"Brooklyn",3,1920,"Southern terminus of the 2 and 5 — gateway to Flatbush","Brooklyn College, steps from this terminal, was dubbed 'the poor man's Harvard' by the New York Times."],
  ["Eastern Pkwy-Brooklyn Museum",["2","3"],"Brooklyn",3,1920,"Crown Heights — home to the Brooklyn Museum and Botanic Garden","The Brooklyn Museum is the second largest art museum in the United States by building size."],
  ["Nostrand Av",["2","3"],"Brooklyn",3,1920,"Crown Heights and Bed-Stuy neighborhood hub","The annual West Indian American Day Carnival on Eastern Parkway is one of the largest parades in North America."],
  ["Canarsie-Rockaway Pkwy",["L"],"Brooklyn",2,1906,"Eastern terminus of the L train — Canarsie neighborhood","The L train runs 24/7 and has become a symbol of Brooklyn gentrification — and the debates it sparks."],
  ["Myrtle Av",["J","M","Z"],"Brooklyn",3,1888,"Bushwick border stop — J/M/Z above Myrtle Avenue","The Myrtle Avenue elevated tracks date to 1888 — among the oldest continuously operating elevated lines in the US."],
  // Major hubs missing from original data
  ["34 St-Penn Station",["1","2","3","A","C","E"],"Manhattan",5,1904,"Beneath Penn Station — one of the world's busiest rail and subway hubs","The original Penn Station's 1963 demolition was so devastating it directly sparked the US historic preservation movement."],
  ["59 St-Columbus Circle",["1","A","B","C","D"],"Manhattan",4,1904,"Gateway to Central Park — 5 subway lines converge at the park's southwest corner","Columbus Circle is the official center point from which all New York City road distances are measured."],
  ["Brooklyn Bridge-City Hall",["4","5","6"],"Manhattan",4,1904,"Historic Financial District hub beneath one of the world's most famous bridges","The original City Hall loop station (1904) is sealed underground — a stunning Guastavino-tiled vault that operated until 1945."],
  ["47-50 Sts-Rockefeller Ctr",["B","D","F","M"],"Manhattan",4,1933,"Beneath Rockefeller Center — one of midtown's most storied complexes","30 Rock, Radio City Music Hall, and the famous Christmas tree are all steps from the B/D/F/M platforms."],
  // Financial District
  ["Wall St",["2","3","4","5"],"Manhattan",3,1905,"Beneath the financial center of the world — two separate station complexes at the same intersection","The New York Stock Exchange, a block away, has operated continuously since 1817."],
  // East Village
  ["Astor Pl",["6"],"Manhattan",3,1904,"Classic East Village stop — terra cotta and cast iron from the original 1904 IRT","The rotating iron Alamo cube on the street above has been a neighborhood icon since 1967."],
  // Brooklyn L train
  ["Bedford Av",["L"],"Brooklyn",3,1924,"The quintessential L train Brooklyn stop — gateway to Williamsburg","Bedford Avenue is the cultural spine of Williamsburg — the L train's influence on this neighborhood is one of the defining stories of modern NYC."],
  // Unique stations
  ["Smith-9 Sts",["F","G"],"Brooklyn",2,1933,"The highest elevated subway station in New York City — 87.5 feet above street level","On a clear day, views from this platform stretch from the Statue of Liberty all the way to the Manhattan skyline."],
  ["Mets-Willets Point",["7"],"Queens",2,1964,"Steps from Citi Field — the 7 train delivers Mets fans directly to the ballpark","Shea Stadium, demolished in 2008, stood on this same site — generations of Mets fans have made the 7 train pilgrimage to Willets Point."],
  // Disambiguation: second 125 St complex
  ["125 St (A/B/C)",["A","B","C"],"Manhattan",4,1904,"The 125th Street A/B/C stop on 8th Avenue — a separate complex from the 2/3 station blocks away","The A train runs express from this Harlem stop — on a clear run it reaches Midtown in under 10 minutes."],
  // Greenpoint G train
  ["Nassau Av",["G"],"Brooklyn",2,1937,"G train stop in Greenpoint — the bridge between north Brooklyn's neighborhoods","Greenpoint is one of Brooklyn's best-preserved historic neighborhoods — a mix of Polish heritage, artists, and industry."],
  // ── BRONX ──────────────────────────────────────────────────────────────────
  ["Van Cortlandt Park-242 St",["1"],"Bronx",2,1918,"Northern terminus of the 1 train — edge of the Bronx's largest park","Van Cortlandt Park at 1,146 acres has a golf course, nature trails, and a museum — the Bronx's great green escape."],
  ["238 St",["1"],"Bronx",1,1908,"Quiet 1 train stop in Riverdale — one of the Bronx's most affluent neighborhoods","Riverdale retains a distinctly suburban character — many residents live in detached houses with yards despite being in NYC."],
  ["231 St",["1"],"Bronx",1,1908,"Marble Hill-adjacent stop on the 1 train near the Bronx-Manhattan border","This station is steps from Marble Hill, the only Manhattan neighborhood physically connected to the Bronx."],
  ["Norwood-205 St",["D"],"Bronx",2,1933,"Northern terminus of the D train in Norwood — edge of Woodlawn","Norwood borders Woodlawn, one of the Bronx's most cohesive Irish-American neighborhoods."],
  ["Mosholu Pkwy",["4","D"],"Bronx",2,1918,"Bronx stop near the parkway — gateway to the Bronx's greenway network","Mosholu Parkway connects Van Cortlandt Park to the Bronx Zoo — a continuous 8-mile green corridor."],
  ["Bedford Park Blvd-Lehman College",["4","D"],"Bronx",2,1918,"Serves Lehman College — the only CUNY senior college in the Bronx","Lehman College's hexagonal library, visible from the elevated tracks, is a 1960s architectural landmark."],
  ["Kingsbridge Rd",["4","D"],"Bronx",2,1918,"Kingsbridge neighborhood stop where 4 and D trains meet","Kingsbridge Road marks the approximate border between Norwood and Fordham — two of the Bronx's oldest neighborhoods."],
  ["Burnside Av",["4"],"Bronx",2,1933,"Mid-Bronx 4 train stop in the University Heights corridor","Burnside Avenue is one of the Bronx's busiest commercial strips — named for Civil War General Ambrose Burnside."],
  ["176 St",["4"],"Bronx",2,1933,"4 train stop in University Heights — near Bronx Community College","Bronx Community College occupies the former NYU Uptown campus, including landmark Gould Memorial Library."],
  ["Mt Eden Av",["4"],"Bronx",2,1933,"South Bronx elevated stop near the Cross Bronx Expressway corridor","The Cross Bronx Expressway, built by Robert Moses in the 1950s, displaced 60,000 Bronx residents and reshaped the borough."],
  ["170 St",["4"],"Bronx",2,1933,"South Bronx 4 train stop — elevated above Morris Avenue","From this elevated platform, the ongoing revival of the South Bronx is visible in real time."],
  ["167 St",["4","B","D"],"Bronx",2,1933,"Bronx elevated station on three lines — near the Grand Concourse","Just two stops north of Yankee Stadium — a useful alternative for fans wanting to skip the 161 St crush on game days."],
  ["138 St-Grand Concourse",["4","5","6"],"Bronx",3,1878,"South Bronx transfer hub — southern gateway of the Grand Concourse","The Grand Concourse, modeled on the Champs-Élysées, begins near here — its Art Deco buildings are on the National Register."],
  ["Wakefield-241 St",["2"],"Bronx",1,1920,"Northernmost Bronx stop on the 2 train — edge of Westchester County","Wakefield is one of the Bronx's quietest residential neighborhoods, developed in the early 20th century after the subway arrived."],
  ["Nereid Av",["2","5"],"Bronx",1,1920,"2 and 5 stop in the far north Bronx — Wakefield community","Nereid Avenue serves a quiet stretch of Wakefield — named for the Nereids of Greek mythology, the sea-nymph daughters of Nereus."],
  ["233 St",["2"],"Bronx",1,1920,"Woodlawn-adjacent 2 train stop in the north Bronx","This quiet residential stop is a short walk from Woodlawn Cemetery, where Miles Davis and Herman Melville are buried."],
  ["225 St",["2"],"Bronx",1,1920,"2 train stop in the Wakefield neighborhood — north Bronx residential","Wakefield was developed rapidly in the early 20th century as the IRT extended its reach into the northern Bronx."],
  ["Gun Hill Rd",["2","5"],"Bronx",2,1920,"Major north Bronx stop — 2 and 5 trains connect here","Gun Hill Road was named for a Revolutionary War cannon emplacement — the Bronx was the scene of significant fighting in 1776."],
  ["Burke Av",["2","5"],"Bronx",2,1920,"2 and 5 stop in Allerton — residential north Bronx neighborhood","Allerton is a predominantly Italian and Irish neighborhood known for its attached row houses and tree-lined streets."],
  ["Allerton Av",["2","5"],"Bronx",2,1920,"Allerton neighborhood hub — 2 and 5 trains serve this busy stop","Allerton Avenue is a commercial corridor in a neighborhood that has housed generations of Bronx families."],
  ["Pelham Pkwy",["2","5"],"Bronx",2,1920,"Three-line junction near Pelham Parkway — gateway to Pelham Bay","Pelham Parkway is a wide, tree-lined boulevard separating the Bronx Zoo from the Pelham Bay Park greenway."],
  ["Bronx Park East",["2","5"],"Bronx",2,1920,"Near the Bronx Zoo and NY Botanical Garden — two world-class institutions","The New York Botanical Garden, 250 acres of curated landscape, is the largest botanical garden in any US city."],
  ["E 180 St",["2","5"],"Bronx",2,1904,"Key 2/5 junction — trains separate here for different north Bronx routes","This station is an important operational hub — the 2 and 5 split here for their respective Bronx branches."],
  ["West Farms Sq-E Tremont Av",["2","5"],"Bronx",2,1904,"2 and 5 stop in Tremont — historic south Bronx neighborhood","West Farms was an independent village before it was absorbed into New York City in 1874."],
  ["174 St",["2","5"],"Bronx",2,1904,"South Bronx 2/5 stop — Crotona Park nearby","Crotona Park contains Indian Lake, a historic swimming hole used by generations of South Bronx families."],
  ["Freeman St",["2","5"],"Bronx",2,1904,"Quiet South Bronx elevated stop in Longwood","The Longwood neighborhood has emerged as a center of arts and community development in the reviving South Bronx."],
  ["Intervale Av",["2","5"],"Bronx",2,1920,"South Bronx stop near the Hub — one of the Bronx's oldest shopping districts","The Hub at 149th and 3rd is one of New York's busiest outdoor shopping areas, rivaling midtown in retail volume."],
  ["Prospect Av",["2","5"],"Bronx",2,1920,"South Bronx 2/5 station — elevated tracks above Prospect Avenue","Prospect Avenue in the South Bronx was once a major commercial corridor and is gradually being revitalized."],
  ["Jackson Av",["2","5"],"Bronx",2,1920,"South Bronx 2/5 stop — Long Island Sound visible on clear days from the el","Jackson Avenue borders the South Bronx waterfront, which has seen significant new parks investment."],
  ["3 Av-149 St",["2","5"],"Bronx",3,1878,"South Bronx hub — one of the original Third Avenue El stations","The Third Avenue elevated here dates to 1878 — one of the oldest continuously operating transit routes in the US."],
  ["Dyre Av",["5"],"Bronx",1,1941,"Northern terminus of the 5 on the Dyre Avenue line — quiet residential area","The Dyre Avenue line was originally the New York, Westchester and Boston Railway, bought by the city in 1941."],
  ["Eastchester-Dyre Av",["5"],"Bronx",1,1941,"5 train stop near the Westchester County border","Eastchester is one of the Bronx's quietest northeastern neighborhoods — entirely detached from the urban bustle."],
  ["Baychester Av",["5"],"Bronx",1,1941,"5 train stop serving Co-op City — the world's largest cooperative housing complex","Co-op City houses over 50,000 residents in 35 towers — it was built in the 1970s on a former amusement park site."],
  ["Buhre Av",["6"],"Bronx",1,1920,"6 train stop in Pelham Bay — residential northeast Bronx","This quiet stop serves Pelham Bay's residential streets near the city's eastern edge."],
  ["Middletown Rd",["6"],"Bronx",1,1920,"6 train elevated stop in Pelham Bay area","The 6 train's elevated structure in the northeast Bronx offers views toward Long Island Sound on clear days."],
  ["Westchester Sq-E Tremont Av",["6"],"Bronx",2,1920,"6 train stop in historic Westchester Square — an old village center","Westchester Square was the heart of the old Town of Westchester, annexed by New York City in 1895."],
  ["Zerega Av",["6"],"Bronx",1,1920,"6 train stop in the Castle Hill area — residential east Bronx","Zerega Avenue serves a quiet residential section with a growing Dominican and West African community."],
  ["Castle Hill Av",["6"],"Bronx",1,1920,"6 train stop in the Castle Hill neighborhood — east Bronx","Castle Hill developed rapidly after the Pelham Bay extension of the subway opened in 1920."],
  ["Parkchester",["6"],"Bronx",3,1920,"6 train hub serving Parkchester — one of America's great planned communities","Parkchester, built in 1942, was designed for 40,000 residents — one of the largest planned housing developments in US history."],
  ["St Lawrence Av",["6"],"Bronx",1,1920,"6 train stop in Soundview — South Bronx neighborhood","Soundview Park stretches along the Bronx River — the neighborhood has seen major environmental restoration."],
  ["Morrison Av-Soundview",["6"],"Bronx",1,1920,"6 train stop serving the Soundview neighborhood","Soundview is one of the South Bronx neighborhoods receiving the most community development investment."],
  ["Elder Av",["6"],"Bronx",1,1920,"6 train stop between Parkchester and the South Bronx hub","A quiet local stop serving the residential streets between the major Parkchester and Hunts Point stations."],
  ["Whitlock Av",["6"],"Bronx",1,1920,"6 train stop near Hunts Point — industrial and residential mix","Hunts Point Food Distribution Center, steps away, is the largest wholesale food market in the world."],
  ["Hunts Point Av",["6"],"Bronx",2,1920,"6 train stop in Hunts Point — industrial waterfront neighborhood","The Hunts Point Produce Market supplies billions of dollars worth of food to the New York metro area annually."],
  ["Longwood Av",["6"],"Bronx",2,1920,"6 train stop in Longwood — South Bronx creative corridor","Longwood Avenue has become a center of South Bronx arts — galleries, community spaces, and social enterprise."],
  ["E 149 St",["6"],"Bronx",2,1920,"6 train stop at 149th Street — near the Hub commercial district","The Hub at 149th and Third is one of NYC's busiest outdoor shopping districts, with over 200 retail businesses."],
  ["Brook Av",["6"],"Bronx",2,1878,"6 train stop in South Bronx — elevated above Brook Avenue","Brook Avenue is named for a stream that once ran through the South Bronx — the Bronx River watershed shaped this area."],
  ["Cypress Av",["6"],"Bronx",2,1878,"6 train stop in Mott Haven — South Bronx creative district","Mott Haven has transformed from an industrial zone to a thriving arts destination — galleries and studios fill the streets."],
  ["3 Av-138 St",["6"],"Bronx",2,1878,"6 train Bronx stop — near the original northern terminus of the Lexington line","This was once the northern end of the line — the IRT reached this point in 1878 before pushing further into the Bronx."],
  ["182-183 Sts",["D"],"Bronx",2,1933,"D train stop in the Fordham area — University Heights community","The nearby Hall of Fame for Great Americans on the Bronx Community College campus opened in 1901."],
  ["174-175 Sts",["B","D"],"Bronx",1,1918,"B and D train stop in the south Bronx elevated section","This elevated stop provides glimpses of Highbridge, one of the Bronx's oldest residential neighborhoods."],
  ["170 St (B/D)",["B","D"],"Bronx",2,1933,"B and D train stop in Mount Hope — dense South Bronx neighborhood","Mount Hope, named for a mansion that once stood here, is a densely populated neighborhood undergoing revival."],
  ["155 St",["B","D"],"Manhattan",2,1918,"Upper Manhattan B/D stop — gateway to Harlem's Sugar Hill neighborhood","Sugar Hill was named for the 'sweet life' of its Black middle-class residents — Duke Ellington lived here in the 1930s."],
  // ── MANHATTAN — IRT West Side (1/2/3) ─────────────────────────────────────
  ["Marble Hill-225 St",["1"],"Manhattan",1,1908,"Northernmost Manhattan 1 train stop — technically located on the mainland Bronx side","Marble Hill was an island after the 1895 Harlem Ship Canal cut was made — later filled in, now attached to the Bronx."],
  ["215 St",["1"],"Manhattan",1,1906,"1 train stop in Inwood — near Inwood Hill Park's last Manhattan forest","Inwood Hill Park contains the last remaining old-growth forest in Manhattan — ancient caves here sheltered Native Americans."],
  ["Dyckman St",["1"],"Manhattan",2,1906,"Main commercial stop in Inwood — the neighborhood's de facto downtown","Dyckman Street is Inwood's main strip — a vibrant Dominican commercial and nightlife corridor at Manhattan's tip."],
  ["191 St",["1"],"Manhattan",2,1911,"Deep underground 1 train stop — one of the system's deepest stations","A 600-foot pedestrian tunnel leads to the street — this station sits 175 feet below ground, accessible by elevator."],
  ["181 St (1)",["1"],"Manhattan",2,1906,"Washington Heights 1 train stop — elevated viaduct section at Broadway","The 1 train runs on a viaduct through Washington Heights, offering rooftop views over this Dominican neighborhood."],
  ["157 St",["1"],"Manhattan",2,1906,"1 train stop in Hamilton Heights — near Audubon Terrace cultural campus","Audubon Terrace nearby houses the Hispanic Society of America — a museum of Spanish art and culture since 1904."],
  ["145 St",["1","2","3"],"Manhattan",3,1904,"Upper Manhattan stop at the Harlem-Hamilton Heights border — 1/2/3 share this station","145th Street is one of upper Manhattan's key commercial thoroughfares, connecting three distinct neighborhoods."],
  ["137 St-City College",["1"],"Manhattan",2,1904,"1 train stop serving City College of New York on the Harlem-Hamilton Heights border","City College was known as 'the Harvard of the proletariat' — free tuition for generations made it a gateway for immigrants."],
  ["125 St (1)",["1"],"Manhattan",3,1904,"One of four separate 125 St stations — the 1 train's stop at Broadway","The 1 train's 125 St stop at Broadway serves Manhattanville and the expanding Columbia University campus."],
  ["116 St (1)",["1"],"Manhattan",3,1904,"1 train stop at 116th Street — Columbia University's Morningside Heights","Columbia's Low Memorial Library, modeled on Rome's Pantheon, sits just up the hill from this station."],
  ["110 St (1)",["1"],"Manhattan",2,1904,"1 train stop at Cathedral Pkwy — base of Morningside Heights","The Cathedral of St. John the Divine, a block away, is the world's largest Gothic cathedral by floor area."],
  ["103 St (1)",["1"],"Manhattan",2,1904,"1 train local stop in Manhattan Valley — between the UWS and Harlem","Manhattan Valley occupies a quiet pocket between 100th and 110th Streets, often overlooked by visitors."],
  ["79 St",["1"],"Manhattan",3,1904,"Upper West Side 1 train stop near Riverside Park and the Natural History Museum","The American Museum of Natural History houses one of the world's great dinosaur fossil collections — a Manhattan treasure."],
  ["66 St-Lincoln Center",["1"],"Manhattan",4,1904,"Gateway to Lincoln Center — home of the Met Opera, NY Philharmonic, and NY City Ballet","Lincoln Center was built in the 1960s, controversially displacing 18 city blocks of the San Juan Hill neighborhood."],
  ["50 St",["1","2","3"],"Manhattan",3,1904,"Midtown West stop on the 1/2/3 — near Hell's Kitchen and the theater district","Hell's Kitchen, once NYC's toughest neighborhood, has transformed into one of Manhattan's top dining destinations."],
  ["28 St",["1","2","3"],"Manhattan",2,1904,"Chelsea 1/2/3 stop near the Flower District and Flatiron Building","The Wholesale Flower Market on 28th Street has supplied NYC's florists and events industry since the 1870s."],
  ["18 St",["1"],"Manhattan",2,1904,"Chelsea 1 train local stop — gallery district and the High Line nearby","Chelsea has the world's highest concentration of art galleries — over 200 galleries operate within a few square blocks."],
  ["14 St (1/2/3)",["1","2","3","F","M"],"Manhattan",4,1904,"14th Street hub for west side lines — between Meatpacking and Chelsea","14th Street is one of Manhattan's great crosstown corridors — it connects the Meatpacking District to Union Square."],
  ["Houston St",["1"],"Manhattan",2,1918,"Greenwich Village/SoHo border stop on the 1","Houston Street (pronounced HOW-ston) is the traditional dividing line between Greenwich Village and SoHo."],
  ["Canal St (1)",["1"],"Manhattan",3,1918,"1 train Canal St stop at Varick — near the Holland Tunnel entrance","The Holland Tunnel, which opened in 1927, was the world's first mechanically ventilated underwater vehicular tunnel."],
  ["Franklin St",["1"],"Manhattan",2,1918,"TriBeCa stop on the 1 — a neighborhood that transformed from warehouses to elite addresses","TriBeCa (Triangle Below Canal) has one of the most expensive real estate markets in the world — and the best brunch."],
  ["Cortlandt St",["1","R","W"],"Manhattan",3,2018,"Rebuilt World Trade Center area station — reopened 2018 after 9/11 destruction","The original station was destroyed in the September 11, 2001 attacks — rebuilt and renamed after a 17-year closure."],
  ["Rector St",["1","R"],"Manhattan",2,1905,"Lower Manhattan stop near Wall Street's western edge","Rector Street is named for the rector of Trinity Church, one of Manhattan's oldest houses of worship, dating to 1698."],
  // ── MANHATTAN — IRT Lenox Avenue (2/3) ──────────────────────────────────
  ["148 St-Lenox Av",["3"],"Manhattan",2,1904,"Northern Manhattan 3 train terminal — at the edge of Harlem","This terminal marks the upper boundary of the 3 train's Manhattan run — a quiet stub end above the city's bustle."],
  ["145 St (2/3)",["2","3"],"Manhattan",3,1904,"Harlem 2/3 stop on Lenox Avenue — major upper Manhattan corridor","145th Street at Lenox Avenue is a key community anchor — shops, churches, and community organizations line the block."],
  ["135 St (2/3)",["2","3"],"Manhattan",2,1904,"Harlem 2/3 stop near the National Jazz Museum","The National Jazz Museum in Harlem documents this neighborhood's central role in jazz history."],
  ["116 St (2/3)",["2","3"],"Manhattan",3,1904,"Harlem 2/3 stop on Lenox Avenue — near Marcus Garvey Park","Marcus Garvey Park (formerly Mount Morris Park) was a center of African-American political life in the 20th century."],
  ["Central Park North-110 St",["2","3"],"Manhattan",2,1904,"Harlem's northwest gateway — 2/3 trains at the northern tip of Central Park","This station at the northern edge of Central Park is a transition point — south is the park, north is Harlem."],
  // ── MANHATTAN — IRT Lexington Avenue (4/5/6) ───────────────────────────
  ["125 St (4/5/6)",["4","5","6"],"Manhattan",4,1878,"Harlem's Lexington Avenue subway — serving East Harlem and Central Harlem","East Harlem, or El Barrio, is home to one of the largest Puerto Rican communities in the entire United States."],
  ["116 St (6)",["6"],"Manhattan",3,1878,"6 train stop in East Harlem near La Marqueta","La Marqueta on Park Avenue was for decades the heart of East Harlem's Puerto Rican commercial and cultural life."],
  ["110 St (6)",["6"],"Manhattan",2,1878,"6 train stop near the northeast corner of Central Park — East Harlem border","The northeastern corner of Central Park here features the Conservatory Garden — a formal Italian-style garden."],
  ["103 St (6)",["6"],"Manhattan",2,1878,"East Harlem 6 train stop near the Museum of the City of New York","The Museum of the City of New York on Fifth Avenue has chronicled the city's history since 1923."],
  ["96 St (6)",["6"],"Manhattan",3,1878,"Upper East Side 6 train stop — where luxury Manhattan meets East Harlem","96th Street on the Upper East Side is an informal dividing line between wealthy Carnegie Hill and East Harlem."],
  ["77 St",["6"],"Manhattan",3,1878,"Upper East Side 6 train stop near the Frick Collection","The Frick Collection, in a Gilded Age mansion, is one of NYC's most intimate and beloved museums."],
  ["68 St-Hunter College",["6"],"Manhattan",3,1878,"Upper East Side stop serving Hunter College — a leading public university","Hunter College has been educating New Yorkers since 1870 — it consistently ranks among the top public colleges in the US."],
  ["59 St",["4","5","6"],"Manhattan",4,1878,"Midtown East hub near Bloomingdale's and the luxury shopping corridor","Bloomingdale's on Lexington Avenue has been a New York institution since 1886 — the flagship covers an entire block."],
  ["51 St",["6"],"Manhattan",2,1878,"Midtown East 6 train local stop — between Grand Central and 59 St","51st Street is surrounded by corporate midtown towers — a quieter local stop amid the Lexington Avenue rush."],
  ["33 St",["6"],"Manhattan",3,1878,"Midtown East 6 train stop — near the Empire State Building and Korea Town","Korea Town on 32nd Street is one of Manhattan's most vibrant dining corridors — Korean BBQ restaurants stay open 24 hours."],
  ["28 St (6)",["6"],"Manhattan",2,1878,"Flatiron District 6 train stop near Madison Square Park","Madison Square Park hosted the original Madison Square Garden — the neighborhood gave its name to the arena."],
  ["23 St (6)",["6"],"Manhattan",2,1878,"6 train stop near the Flatiron Building — Gramercy/Flatiron border","The Flatiron Building at 23rd Street, built in 1902, is one of NYC's most photographed landmarks."],
  ["Bowling Green",["4","5"],"Manhattan",2,1905,"Lower Manhattan southern anchor — steps from the Staten Island Ferry terminal","Bowling Green is Manhattan's oldest public park — George Washington's inauguration parade ended here in 1789."],
  // ── MANHATTAN — BMT/IND Broadway (N/Q/R/W) ────────────────────────────
  ["5 Av-59 St",["N","Q","R","W"],"Manhattan",4,1918,"Gateway to Central Park South and the Plaza Hotel — one of Manhattan's grandest corners","The Plaza Hotel at 59th and 5th, opened 1907, is a symbol of Gilded Age New York — the setting for dozens of films."],
  ["57 St-7 Av",["N","Q","R","W"],"Manhattan",3,1918,"Midtown West stop near Carnegie Hall — one of the world's great concert venues","Carnegie Hall has hosted performances since 1891 — Tchaikovsky himself conducted the opening night concerts."],
  ["49 St",["N","Q","R","W"],"Manhattan",3,1918,"Theater District stop — one block from Times Square on the Broadway line","The Theater District has more shows per square mile than anywhere else on Earth — 41 Broadway theaters nearby."],
  ["28 St (N/R/W)",["N","R","W"],"Manhattan",2,1918,"Broadway 28 St stop near the Flower District and Chelsea border","The Wholesale Flower Market on 28th Street has been NYC's floral industry hub since the 1870s."],
  ["23 St (N/R/W)",["N","R","W"],"Manhattan",3,1918,"Broadway 23 St stop near the Flatiron Building — one of NYC's most iconic structures","The Flatiron Building's narrow prow faces a famous windswept intersection — the building inspired early skyscraper design."],
  ["Prince St",["N","R","W"],"Manhattan",3,1918,"SoHo stop — heart of cast-iron loft architecture and global fashion","SoHo's cast-iron architecture district is the largest collection of Victorian industrial buildings in the world."],
  ["8 St-NYU",["N","R","W"],"Manhattan",3,1918,"Greenwich Village stop at NYU — Washington Square Park steps away","Washington Square Park's iconic arch was built in 1895 to celebrate Washington's inauguration — modeled on Paris's Arc."],
  ["Whitehall St-South Ferry",["N","R","W"],"Manhattan",3,1918,"Lower Manhattan R/W terminus — gateway to the free Staten Island Ferry","The Staten Island Ferry, free since 1997, carries 21 million passengers annually past the Statue of Liberty."],
  // ── MANHATTAN — IND 6th Avenue (B/D/F/M) ─────────────────────────────
  ["42 St-Bryant Park",["B","D","F","M"],"Manhattan",4,1940,"Midtown library stop — beneath the New York Public Library's main branch","The NYPL main branch, opened 1911, contains over 55 million items — its Rose Main Reading Room is 297 feet long."],
  ["23 St (F/M)",["F","M"],"Manhattan",2,1936,"6th Avenue 23 St stop — Chelsea and Flatiron border","The original Madison Square Garden stood near here before the arena moved several times across the neighborhood."],
  ["2 Av",["F"],"Manhattan",2,1936,"Lower East Side F train stop — a neighborhood deeply shaped by immigration","The Lower East Side Tenement Museum preserves the stories of immigrant families from the 1800s and early 1900s."],
  // ── MANHATTAN — IND 8th Avenue (A/C/E) ───────────────────────────────
  ["50 St (C/E)",["C","E"],"Manhattan",3,1932,"Midtown West C/E stop — Hell's Kitchen and the theater district","Hell's Kitchen stretches west of the Theater District — it's where actors, crew, and writers go for late-night eats."],
  ["Spring St (C/E)",["C","E"],"Manhattan",3,1932,"SoHo/TriBeCa C/E stop — west of the 6 train's Spring St by several blocks","The C/E Spring St stop serves SoHo's western flank — Hudson Square and the Holland Tunnel approach."],
  ["23 St (C/E)",["C","E"],"Manhattan",2,1932,"8th Avenue 23 St stop — near the Chelsea Hotel and the city's gallery district","The Chelsea Hotel at 23rd and 8th hosted Janis Joplin, Bob Dylan, and Arthur C. Clarke — a legend of NYC bohemia."],
  ["Chambers St (A/C)",["A","C"],"Manhattan",2,1932,"Lower Manhattan A/C stop — World Trade Center area","The WTC Oculus transit hub, completed in 2016 at $3.9 billion, is steps from this station."],
  ["High St-Brooklyn Bridge",["A","C"],"Brooklyn",3,1936,"First Brooklyn stop on the A/C — in the heart of historic Brooklyn Heights","Brooklyn Heights is one of NYC's most exclusive neighborhoods — the Promenade overlooks the Manhattan skyline and harbor."],
  ["145 St (A/B/C/D)",["A","B","C","D"],"Manhattan",3,1904,"Upper Manhattan 8th Avenue hub — four lines converge at 145 St","This is one of the rare Manhattan stations where both the A and B/C/D stop — a major transfer point in upper Harlem."],
  ["135 St (B/C)",["B","C"],"Manhattan",2,1903,"Harlem B/C stop on 8th Avenue — near St. Nicholas Avenue","8th Avenue at 135th Street is a quiet residential strip in South Harlem — a mix of historic brownstones and newer buildings."],
  ["116 St (C)",["C"],"Manhattan",2,1903,"Harlem C train stop near Columbia University's Manhattanville campus","Columbia's Manhattanville expansion campus is directly above this stop — a $6.3 billion redevelopment."],
  ["110 St (C)",["C"],"Manhattan",2,1903,"Cathedral Pkwy C stop — Upper West Side border with Manhattan Valley","Cathedral Parkway is named for the nearby Cathedral of St. John the Divine — the world's largest Gothic cathedral."],
  ["103 St (B/C)",["B","C"],"Manhattan",2,1903,"Upper West Side B/C stop in Manhattan Valley — between the park and Harlem","Manhattan Valley between 100 St and 110 St is a diverse residential neighborhood often overlooked by visitors."],
  ["96 St (B/C)",["B","C"],"Manhattan",3,1903,"Upper West Side B/C stop — Central Park West boundary","Central Park West from 86th to 96th Street is lined with famous apartment buildings — the Beresford and the San Remo."],
  ["86 St (B/C)",["B","C"],"Manhattan",3,1932,"Upper West Side B/C stop — gateway to the natural history museum area","The American Museum of Natural History and Hayden Planetarium are two blocks east of this station."],
  ["81 St-Museum of Natural History",["B","C"],"Manhattan",3,1932,"Named for the museum it serves — B/C stop right at the AMNH entrance","The AMNH is one of the world's largest natural history museums — its collection includes over 33 million specimens."],
  ["72 St (B/C)",["B","C"],"Manhattan",3,1932,"Upper West Side B/C stop — near the Dakota building and Strawberry Fields","John Lennon lived in the Dakota, steps from this station — Strawberry Fields memorial is just across Central Park West."],
  // ── MANHATTAN — BMT Nassau Street / Second Ave ────────────────────────
  ["Broad St",["J","Z"],"Manhattan",2,1913,"Financial District J/Z stop near the New York Stock Exchange","The NYSE on Broad Street has operated continuously since 1817 — the bell-ringing ceremony here marks major events."],
  ["Fulton St (J/Z)",["J","Z"],"Manhattan",3,1888,"Lower Manhattan J/Z stop — part of the Fulton Center complex since 2014","The original elevated railway here opened in 1888 — the modern underground station is part of the 2014 Fulton Center hub."],
  ["Chambers St (J/Z)",["J","Z"],"Manhattan",2,1913,"Downtown J/Z stop near City Hall — different complex from the A/C/2/3 stations","The Municipal Building at Chambers St, completed in 1914, was the first skyscraper built by New York City."],
  // ── MANHATTAN — IND Second Avenue Subway ──────────────────────────────
  ["96 St (Q)",["Q"],"Manhattan",3,2017,"Second Ave Subway's newest Manhattan stop — opened December 2016","The Second Avenue Subway was first proposed in 1919 and took nearly 100 years to partially open — Phase 1 cost $4.5 billion."],
  ["86 St (Q)",["Q"],"Manhattan",3,2017,"Second Ave Subway stop in the heart of the Upper East Side","Phase 1 of the Second Ave Subway brought rapid transit to the Upper East Side for the first time — ending a century-long wait."],
  ["72 St (Q)",["Q"],"Manhattan",3,2017,"Southernmost Second Ave Subway stop — connects to the Q at 63 St","The 72nd Street station features mosaics by Vik Muniz — one of the most art-forward subway stations in the system."],
  // ── MANHATTAN — IND / BMT 14 St ───────────────────────────────────────
  ["34 St-Hudson Yards",["7"],"Manhattan",3,2015,"Western terminus of the 7 extension — opened 2015 as NYC's newest station","At $2.4 billion for a single station, Hudson Yards is one of the most expensive subway stops ever built."],
  ["8 Av",["L"],"Manhattan",3,1928,"Western Manhattan L train stop — gateway to Chelsea and the High Line","The L train's 8th Avenue stop was the terminus until the train's long tunnel under the Hudson was built."],
  ["1 Av",["L"],"Manhattan",3,1924,"L train stop in the East Village — gateway to Alphabet City","Tompkins Square Park, a block east, has been a site of political demonstrations since the 1870s."],
  ["3 Av",["L"],"Manhattan",2,1924,"L train stop on the border of the East Village and Stuyvesant Town","Stuyvesant Town, a massive postwar housing complex just east, houses 11,000 apartments for middle-class New Yorkers."],
  // ── BROOKLYN — IRT Eastern Pkwy (2/3/4/5) ────────────────────────────
  ["Nevins St",["2","3","4","5"],"Brooklyn",4,1878,"Downtown Brooklyn hub — 2/3/4/5 transfer point near Atlantic Terminal","Nevins Street connects to Atlantic Terminal, one of Brooklyn's main LIRR hubs — a critical commuter transfer."],
  ["Bergen St",["2","3"],"Brooklyn",2,1920,"Crown Heights/Boerum Hill stop on the 2/3 — diverse Brooklyn neighborhood","Boerum Hill is a Brooklyn neighborhood named after Dutch settler Simon Boerum — its brownstones are among the most sought-after."],
  ["New Lots Av",["3"],"Brooklyn",2,1922,"Eastern terminus of the 3 train — East New York neighborhood","East New York is one of Brooklyn's largest neighborhoods — it has undergone significant rezoning and investment."],
  ["Pennsylvania Av",["3"],"Brooklyn",2,1920,"3 train stop in East New York — near the LIRR's East New York station","Pennsylvania Avenue in Brooklyn is named after the state, not the Washington DC street — a common source of confusion."],
  ["Saratoga Av",["3"],"Brooklyn",2,1920,"3 train stop in Brownsville — historic Brooklyn neighborhood","Brownsville was the birthplace of the American birth control movement — Margaret Sanger opened a clinic here in 1916."],
  ["Rockaway Av",["3"],"Brooklyn",2,1920,"3 train stop in Brownsville — near the Betsy Head Park athletic complex","Betsy Head Park is one of Brooklyn's oldest recreational facilities — its swimming pool opened in 1915."],
  ["Junius St",["3"],"Brooklyn",2,1920,"3 train stop in East New York — Brownsville border","East New York is home to communities that have lived here for generations — a neighborhood in the midst of transition."],
  ["Livonia Av",["3"],"Brooklyn",2,1920,"3 train stop in Brownsville — near the historic Sutter Avenue Market","Brownsville was once one of Brooklyn's most densely populated neighborhoods — rebuilt in the postwar public housing era."],
  ["Sutter Av-Rutland Rd",["3"],"Brooklyn",2,1920,"3 train stop serving Sutter Avenue in East Flatbush","Sutter Avenue is one of East New York's main commercial corridors — a hub for the Haitian and Caribbean communities."],
  ["Sterling St",["2"],"Brooklyn",2,1920,"Flatbush 2 train stop — quiet residential stop in Prospect Lefferts Gardens","Prospect Lefferts Gardens (PLG) is a neighborhood of stunning Victorian homes and a vibrant Caribbean community."],
  ["Winthrop St",["2"],"Brooklyn",2,1920,"Flatbush 2 train stop near Winthrop Street's Victorian homes","This quiet stop serves a stretch of Flatbush lined with late-Victorian and Edwardian houses."],
  ["Beverly Rd",["Q"],"Brooklyn",2,1954,"Q train stop in Flatbush — Caton Avenue area","Beverly Road in Flatbush serves a mix of West Indian, Pakistani, and long-established Jewish communities."],
  ["Cortelyou Rd",["Q"],"Brooklyn",2,1954,"Q train stop in Ditmas Park — Victorian Flatlands neighborhood","Ditmas Park is one of Brooklyn's best-kept secrets — block after block of freestanding Victorian homes with porches."],
  ["Newkirk Avs",["B","Q"],"Brooklyn",2,1954,"B/Q stop in Flatbush — the heart of one of Brooklyn's diverse neighborhoods","Newkirk Avenue is a lively strip of restaurants representing Caribbean, South Asian, and Eastern European cultures."],
  ["Avenue J",["Q"],"Brooklyn",2,1954,"Q train stop in Midwood — one of Brooklyn's largest Jewish communities","Midwood has been home to Brooklyn's Orthodox Jewish community for generations — kosher restaurants line Avenue J."],
  ["Avenue M",["Q"],"Brooklyn",2,1954,"Q train stop in Midwood — residential Brooklyn neighborhood","Avenue M is a commercial street in Midwood, lined with Jewish delis and bakeries that have been there for decades."],
  ["Kings Hwy",["B","Q"],"Brooklyn",3,1920,"B/Q stop in Gravesend — major commercial corridor in South Brooklyn","Kings Highway was a colonial-era road connecting New York to Philadelphia — parts of it date to the 1600s."],
  ["Avenue U",["Q"],"Brooklyn",2,1954,"Q train stop in Gravesend — Italian-American stronghold in South Brooklyn","Gravesend was founded in 1645 by Lady Deborah Moody — the only woman to found an English colonial settlement in America."],
  ["Neck Rd",["Q"],"Brooklyn",2,1954,"Q train stop near Sheepshead Bay — quiet residential South Brooklyn","Sheepshead Bay is named for the sheepshead fish that once populated these waters — now a working fishing harbor."],
  ["Sheepshead Bay",["B","Q"],"Brooklyn",2,1920,"B/Q stop by the bay — Brooklyn's fishing harbor and boardwalk","Sheepshead Bay has a working fishing fleet — party boats take anglers out to sea from this historic waterfront."],
  ["Prospect Park",["B","Q","S"],"Brooklyn",3,1920,"Major B/Q stop — gateway to one of NYC's greatest parks","Prospect Park was designed by Frederick Law Olmsted and Calvert Vaux — the same team that created Central Park."],
  ["Parkside Av",["Q"],"Brooklyn",2,1920,"Q train stop at the southern edge of Prospect Park","The southern end of Prospect Park features the Parade Ground and the Lefferts Historic House, a colonial farmhouse."],
  ["Newkirk Av-Little Haiti",["B"],"Brooklyn",2,1954,"B train stop in Flatbush — center of NYC's Haitian community","Flatbush's Haitian community is one of the largest in the US — Little Haiti spans several blocks of Nostrand Avenue."],
  ["36 St",["D","N","R"],"Brooklyn",3,1916,"Sunset Park D/N/R stop — major South Brooklyn crossroads","Sunset Park's main street is a mix of Mexican and Chinese businesses — a classic New York ethnic neighborhood corridor."],
  ["45 St",["R"],"Brooklyn",2,1916,"R train stop in Sunset Park — overlooking the Upper New York Bay","Sunset Park offers some of the best views of the New York Harbor from any residential neighborhood in Brooklyn."],
  ["53 St",["R"],"Brooklyn",2,1916,"R train stop in Sunset Park — near Industry City creative campus","Industry City is a former industrial complex reinvented as a creative and manufacturing hub — 500 businesses operate there."],
  ["59 St (D/N/R)",["D","N","R"],"Brooklyn",2,1916,"Sunset Park D/N/R stop near the Brooklyn Army Terminal","The Brooklyn Army Terminal was the largest military supply base in the world — now a thriving commercial complex."],
  ["77 St (R)",["R"],"Brooklyn",2,1916,"Bay Ridge R train stop — residential South Brooklyn neighborhood","Bay Ridge is a Norwegian and Italian neighborhood — home to some of Brooklyn's best old-school Italian restaurants."],
  ["86 St (N/R)",["N","R"],"Brooklyn",2,1916,"Bay Ridge N/R train stop — near Owl's Head Park","Owl's Head Park has one of the best views of the Narrows and Verrazzano-Narrows Bridge in all of Brooklyn."],
  ["Bay Ridge Av",["R"],"Brooklyn",2,1916,"R train stop in Bay Ridge — near Shore Road Park","Shore Road Park runs along the waterfront in Bay Ridge — joggers and cyclists use it daily for harbor views."],
  ["4 Av-9 St",["F","G","R"],"Brooklyn",3,1933,"Park Slope transfer — F, G, and R trains connect in this underground hub","Park Slope is consistently ranked among NYC's best neighborhoods — its Brownstone-lined streets are iconic."],
  ["9 St (D/M/N/R)",["D","N","R"],"Brooklyn",3,1916,"Union St area D/N/R stop in Park Slope","Park Slope's main commercial strip on 5th Avenue is lined with restaurants, bars, and independent shops."],
  ["Union St",["R"],"Brooklyn",2,1916,"R train stop in Park Slope — Carroll Gardens border","Union Street connects Park Slope to the Gowanus Canal — a Brooklyn waterway undergoing Superfund cleanup and revival."],
  ["4 Av-9 St (F)",["F"],"Brooklyn",3,1933,"F train stop in Park Slope — underground connection to G and R","The F train's Park Slope stop connects the neighborhood to both Midtown Manhattan and the G train to Williamsburg."],
  // ── BROOKLYN — Fulton Street / Canarsie Lines ─────────────────────────
  ["Broadway Junction",["A","C","J","L","Z"],"Brooklyn",4,1888,"Major South Brooklyn transfer hub — five lines connect here","Broadway Junction is one of NYC's most complex stations — elevated tracks from multiple eras weave above East New York."],
  ["Liberty Av",["A","C"],"Brooklyn",2,1915,"A/C stop in East New York — working-class Brooklyn hub","Liberty Avenue is a major commercial strip in East New York — Caribbean restaurants and bodegas line the blocks."],
  ["Van Siclen Av",["A","C"],"Brooklyn",2,1915,"A/C stop in East New York — Cypress Hills area","Cypress Hills Cemetery, nearby, is one of Brooklyn's historic burying grounds — dating to 1848."],
  ["Shepherd Av",["C"],"Brooklyn",1,1915,"C train stop in East New York — residential southeast Brooklyn","Shepherd Avenue serves a quiet section of East New York — the C train here runs relatively infrequently."],
  ["Euclid Av",["A","C"],"Brooklyn",2,1915,"A/C stop in East New York near the Brooklyn-Queens border","Euclid Avenue marks the approximate western edge of Queens — a neighborhood crossroads between the two boroughs."],
  ["Grant Av",["A"],"Brooklyn",2,1956,"A train stop near the Brooklyn-Queens border in Ozone Park","Grant Avenue was named for President Ulysses S. Grant — this section of South Brooklyn has a strong Italian-American heritage."],
  ["80 St",["A"],"Queens",1,1956,"A train stop in Ozone Park — residential south Queens neighborhood","Ozone Park is a largely working-class neighborhood with Italian, Indian, and Caribbean communities."],
  ["88 St",["A"],"Queens",1,1956,"A train stop in Richmond Hill — South Queens residential neighborhood","Richmond Hill has been home to a large Sikh community since the 1980s — gurdwaras line Jamaica Avenue."],
  ["104 St",["A"],"Queens",1,1956,"A train stop in Ozone Park — near Aqueduct Racetrack","Aqueduct Racetrack (Resorts World NYC casino) is a short walk — the A train serves racing fans on big race days."],
  ["111 St",["A"],"Queens",1,1956,"A train stop in South Ozone Park near JFK Airport corridor","South Ozone Park is steps from JFK's northern border — a diverse neighborhood shaped by airport employment."],
  ["Lefferts Blvd",["A"],"Queens",2,1956,"Southern terminus of the A train's Lefferts branch — Ozone Park","The Lefferts branch of the A runs through South Brooklyn and Queens — its leafy neighborhoods feel miles from Manhattan."],
  ["Rockaway Blvd",["A"],"Queens",2,1956,"A train stop in South Ozone Park — far southeast Queens","Rockaway Boulevard is a major commercial corridor serving the southern Queens communities near JFK Airport."],
  ["Aqueduct-North Conduit Av",["A"],"Queens",1,1956,"A train stop near Aqueduct Racetrack in South Ozone Park","Aqueduct Racetrack, opened in 1894, now houses Resorts World NYC — the city's only legal casino."],
  ["Ozone Park-Lefferts Blvd",["A"],"Queens",2,1956,"A train Lefferts Branch stop — at the border of Ozone Park and South Ozone Park","This stretch of the A train opened in 1956 — one of the system's last major expansions before the modern era."],
  ["Nostrand Av (A/C)",["A","C"],"Brooklyn",3,1936,"A/C stop in Bed-Stuy/Crown Heights — different complex from the 2/3 stop","The A/C Nostrand stop sits on Fulton Street — Bed-Stuy's main commercial corridor, lined with Black-owned businesses."],
  ["Kingston-Throop Avs",["A","C"],"Brooklyn",2,1936,"A/C stop in Bedford-Stuyvesant — historic Brooklyn neighborhood","Bed-Stuy is one of Brooklyn's largest and most storied neighborhoods — a center of African-American culture for generations."],
  ["Utica Av",["A","C"],"Brooklyn",3,1936,"A/C stop in Crown Heights — major Brooklyn crossroads","Utica Avenue is one of Brooklyn's main north-south corridors — a hub for the West Indian community."],
  ["Ralph Av",["C"],"Brooklyn",2,1936,"C train stop in Brownsville — near the Pitkin Avenue commercial strip","Pitkin Avenue in Brownsville is a historic shopping corridor that once rivaled 5th Avenue for retail variety."],
  ["Rockaway Av (A/C)",["A","C"],"Brooklyn",2,1936,"A/C stop in Brownsville — serving one of Brooklyn's most resilient communities","Brownsville has one of the highest concentrations of public housing in the US — the community is known for its resilience."],
  ["Halsey St (L)",["L"],"Brooklyn",2,1928,"L train stop in Bushwick — Brooklyn's arts district","Halsey Street cuts through the heart of Bushwick — the neighborhood's warehouse murals are internationally known."],
  ["Wilson Av",["L"],"Brooklyn",2,1928,"L train stop in Bushwick — near the famous Bushwick Collective murals","The Bushwick Collective, started in 2011, has turned building walls into a 2-mile outdoor art gallery."],
  ["Bushwick Av-Aberdeen St",["L"],"Brooklyn",2,1928,"L train stop in Bushwick — where Brooklyn's industrial past meets its creative future","Bushwick's former factory buildings now house studios, galleries, and performance spaces."],
  ["Atlantic Av (L)",["L"],"Brooklyn",3,1922,"L train stop in East New York — not the Atlantic Ave-Barclays megahub","This Atlantic Av L stop is a separate, quieter station in East New York — far from the bustle of the Barclays hub."],
  ["Sutter Av (L)",["L"],"Brooklyn",2,1922,"L train stop in East New York — Sutter Avenue neighborhood","Sutter Avenue is a key East New York street — the elevated L track runs above a lively commercial strip."],
  ["Livonia Av (L)",["L"],"Brooklyn",2,1922,"L train stop in East New York — serving a large public housing area","Livonia Avenue in East New York runs past large NYCHA developments — communities here have been advocating for more transit."],
  ["New Lots Av (L)",["L"],"Brooklyn",2,1928,"Eastern terminus of the L train — Canarsie area","The L train's New Lots terminal is a short distance from Canarsie-Rockaway Pkwy — East New York at the edge of the city."],
  ["Lorimer St (L)",["L","J","M"],"Brooklyn",3,1924,"L and J/M connection in Williamsburg — a key transfer point","Lorimer Street in Williamsburg is steps from some of Brooklyn's best coffee shops and independent bookstores."],
  ["Graham Av",["L"],"Brooklyn",2,1924,"L train stop in Williamsburg — named for the historic Graham Avenue","Graham Avenue runs through the heart of Los Sures — a Puerto Rican community that has been in Williamsburg for generations."],
  ["Grand St (L)",["L"],"Brooklyn",2,1924,"L train stop in Williamsburg — among the system's newer rebuilt stations","Grand Street in Williamsburg is a busy crossroads serving Brooklyn's most rapidly changing neighborhood."],
  ["Montrose Av",["L"],"Brooklyn",2,1928,"L train stop in East Williamsburg — industrial neighborhood turned creative hub","Montrose Avenue is deep in East Williamsburg — a neighborhood of former factories now housing artists and designers."],
  ["Morgan Av",["L"],"Brooklyn",2,1928,"L train stop in East Williamsburg — near the Brooklyn Roberta's pizza landmark","Roberta's restaurant near this stop helped spark East Williamsburg's transformation into a culinary destination."],
  ["Jefferson St",["L"],"Brooklyn",2,1928,"L train stop in Bushwick — gateway to the neighborhood's cultural corridor","Jefferson Street in Bushwick connects to the neighborhood's thriving gallery and bar scene a few blocks south."],
  ["DeKalb Av (L)",["L"],"Brooklyn",2,1928,"L train stop in Bushwick — not the same as the B/D/N/Q/R DeKalb in downtown","This DeKalb Av L stop is several miles northeast of the other DeKalb station — a different neighborhood entirely."],
  // ── BROOKLYN — IND Culver / Smith-9 / G line ─────────────────────────
  ["Bergen St (F/G)",["F","G"],"Brooklyn",3,1936,"F/G stop in Boerum Hill — between Carroll Gardens and Downtown Brooklyn","Boerum Hill is a neighborhood of wide brownstone blocks — adjacent to the restaurant-filled Smith Street corridor."],
  ["Carroll St",["F","G"],"Brooklyn",3,1936,"Carroll Gardens F/G stop — one of Brooklyn's most beloved neighborhoods","Carroll Gardens is named for Charles Carroll, a signer of the Declaration of Independence — its gardens are legendary."],
  ["15 St-Prospect Park",["F","G"],"Brooklyn",2,1954,"F/G stop at the south end of Prospect Park","The Parade Ground at Prospect Park's southern edge has hosted sports since the Civil War era."],
  ["Fort Hamilton Pkwy (F)",["F"],"Brooklyn",2,1954,"F train stop in Kensington — near Green-Wood Cemetery","Green-Wood Cemetery, an 1838 National Historic Landmark, is the final resting place of Leonard Bernstein and Boss Tweed."],
  ["Church Av (F)",["F"],"Brooklyn",2,1954,"F train stop in Kensington — below the surface in South Brooklyn","Kensington borders Prospect Park and Windsor Terrace — a diverse neighborhood of Caribbean and South Asian families."],
  ["Ditmas Av",["F"],"Brooklyn",2,1954,"F train stop in Flatbush — near Ditmas Park's Victorian homes","Ditmas Park is Brooklyn's secret Victorian suburb — block after block of free-standing houses with front porches."],
  ["18 Av",["F"],"Brooklyn",2,1954,"F train stop in Bensonhurst — Italian-American Brooklyn","18th Avenue in Bensonhurst is still lined with Italian bakeries, delis, and specialty shops that have been there for decades."],
  ["Avenue I",["F"],"Brooklyn",2,1954,"F train stop in Midwood — residential South Brooklyn","Avenue I is a quiet residential street in Midwood — one of Brooklyn's most stable and family-oriented communities."],
  ["Bay Pkwy",["F"],"Brooklyn",2,1954,"F train stop in Bensonhurst — near Caesars Bay shopping area","Bensonhurst is one of Brooklyn's largest Italian-American communities — the location of a popular Netflix reality show."],
  ["Avenue N",["F"],"Brooklyn",2,1954,"F train stop in Flatlands — quiet residential South Brooklyn","Flatlands is one of Brooklyn's oldest communities — settled by the Dutch in the 1600s as a farming village."],
  ["Avenue P",["F"],"Brooklyn",2,1954,"F train stop in Gravesend — residential Southwest Brooklyn","Gravesend was founded in 1645 — today it's a largely Russian, Uzbek, and Chinese community."],
  ["Avenue X",["F"],"Brooklyn",1,1954,"F train stop in Gravesend — near the southern tip of Brooklyn","This quiet stop is one of the southernmost subway stations in Brooklyn, near the wide streets of Gravesend."],
  ["Neptune Av",["F"],"Brooklyn",1,1954,"F train stop at the edge of Coney Island — near the boardwalk","Neptune Avenue runs parallel to the Coney Island boardwalk — a gateway to the beach just blocks away."],
  ["W 8 St-NY Aquarium",["F","Q"],"Brooklyn",3,1919,"Coney Island stop serving the NY Aquarium and the beach","The New York Aquarium, open since 1902, is the oldest in the US — it features sharks, sea lions, and penguins."],
  // ── BROOKLYN — G train ─────────────────────────────────────────────────
  ["21 St-Queensbridge",["G"],"Queens",2,1937,"G train stop in Long Island City — gateway to the Queensbridge Houses","Queensbridge Houses is the largest public housing project in North America — home to hip-hop legends like Nas."],
  ["Greenpoint Av",["G"],"Brooklyn",2,1937,"G train stop in Greenpoint — the northernmost Brooklyn neighborhood","Greenpoint has one of the largest Polish communities in the US — Polish bakeries and churches still define the area."],
  ["Metropolitan Av",["G"],"Brooklyn",2,1937,"G train stop in Williamsburg/Greenpoint border","Metropolitan Avenue is a lively strip of bars, coffee shops, and boutiques on the Greenpoint-Williamsburg divide."],
  ["Broadway (G)",["G"],"Brooklyn",2,1937,"G train stop in Williamsburg — not the same Broadway as in Manhattan","Broadway in Williamsburg is a busy commercial street — this stop is well north of the L train's main Williamsburg hub."],
  ["Flushing Av (G)",["G"],"Brooklyn",2,1937,"G train stop in Williamsburg — near the Navy Yard","The Brooklyn Navy Yard, decommissioned in 1966, now houses over 400 businesses — a model of industrial redevelopment."],
  ["Myrtle-Willoughby Avs",["G"],"Brooklyn",2,1937,"G train stop in Bedford-Stuyvesant — Bed-Stuy's northwest corner","The northwest corner of Bed-Stuy borders Clinton Hill, one of Brooklyn's most architecturally preserved neighborhoods."],
  ["Bedford-Nostrand Avs",["G"],"Brooklyn",2,1937,"G train stop deep in Bed-Stuy — cross streets named for historical figures","Bedford Avenue and Nostrand Avenue are two of Bed-Stuy's main commercial corridors — both are undergoing transformation."],
  ["Classon Av",["G"],"Brooklyn",2,1937,"G train stop in Clinton Hill — near the Pratt Institute","Pratt Institute, steps away, is one of the top design and architecture schools in the US."],
  ["Clinton-Washington Avs",["G"],"Brooklyn",2,1937,"G train stop in Clinton Hill/Fort Greene border","Fort Greene is home to the Brooklyn Academy of Music and a thriving creative class — one of Brooklyn's most vibrant neighborhoods."],
  ["Fulton St (G)",["G"],"Brooklyn",2,1937,"G train stop in Clinton Hill — near the Brooklyn Navy Yard","Fulton Street in Clinton Hill is lined with brownstones and a growing number of restaurants and boutiques."],
  ["Church Av (G)",["G","F"],"Brooklyn",2,1954,"G train southern terminus — in Kensington at the edge of Flatbush","The G train terminates at Church Avenue, making this stop a key transfer point for south Brooklyn commuters."],
  // ── BROOKLYN — J/M/Z ────────────────────────────────────────────────────
  ["Marcy Av",["J","M","Z"],"Brooklyn",3,1888,"Williamsburg J/M/Z stop — the station that launched a thousand gentrification stories","Marcy Avenue is steps from the Williamsburg Bridge — Jay-Z grew up in the Marcy Houses public housing nearby."],
  ["Hewes St",["J","M","Z"],"Brooklyn",2,1888,"Williamsburg J/M/Z stop between Marcy Av and Lorimer St","Hewes Street in Williamsburg serves a mix of longtime Latino residents and newer transplants."],
  ["Lorimer St (J/M)",["J","M"],"Brooklyn",2,1888,"Williamsburg J/M stop — Bushwick border area","Lorimer Street in Williamsburg runs through what was once a manufacturing district — now packed with cafes and studios."],
  ["Flushing Av (J/M)",["J","M"],"Brooklyn",2,1888,"J/M stop in Bushwick — near the Brooklyn border with Queens","Flushing Avenue in Bushwick borders Ridgewood, Queens — a neighborhood whose character straddles both boroughs."],
  ["Kosciuszko St",["J","M"],"Brooklyn",2,1888,"J/M stop in Bushwick — named for the Polish-American Revolutionary War hero","Kosciuszko Street honors Tadeusz Kościuszko, the Polish military engineer who helped fortify West Point in 1778."],
  ["Gates Av",["J","Z"],"Brooklyn",2,1888,"J/Z stop in Bushwick — east of the main Bushwick arts corridor","Gates Avenue runs through a working-class section of Bushwick — a community of longtime Caribbean and Latinx residents."],
  ["Halsey St (J/Z)",["J","Z"],"Brooklyn",2,1888,"J/Z stop in Bushwick — elevated tracks above Halsey Street","Halsey Street cuts across Bushwick's northern section — this elevated stop serves longtime residents and new arrivals alike."],
  ["Van Siclen Av (J/Z)",["J","Z"],"Brooklyn",1,1888,"J/Z stop in East New York — residential South Brooklyn","Van Siclen Avenue in East New York is a quiet residential street — the J/Z trains thunder overhead on the el."],
  ["Alabama Av",["J"],"Brooklyn",1,1888,"J train stop in East New York — near Spring Creek Blueway","Spring Creek Park, nearby, is one of Brooklyn's largest natural areas — tidal wetlands home to migratory birds."],
  ["Crescent St",["J","Z"],"Queens",2,1918,"J/Z stop in Woodhaven — Queens residential neighborhood","Crescent Street in Woodhaven is a quiet residential block — an unassuming stop on a line that crosses from Brooklyn to Queens."],
  ["Norwood Av",["J"],"Queens",1,1918,"J train stop in Woodhaven — near Forest Park","Forest Park, nearby, is one of Queens' largest green spaces — 538 acres of forest, hiking trails, and ball fields."],
  ["Cleveland St",["J"],"Queens",1,1918,"J train stop in Richmond Hill — quiet southeast Queens","Cleveland Street in Richmond Hill serves a Sikh-majority community that has established roots here since the 1980s."],
  ["Cypress Hills",["J"],"Brooklyn",1,1888,"J train stop at the Brooklyn-Queens border","Cypress Hills Cemetery, adjacent to this stop, dates to 1848 — Civil War veterans, including generals, are buried here."],
  ["Liberty Av (J/Z)",["J","Z"],"Queens",2,1918,"J/Z stop in South Ozone Park — near the Aqueduct Racetrack","Liberty Avenue in Ozone Park is a commercial corridor with Caribbean, Indian, and Italian businesses."],
  ["75 St-Elderts Lane",["J"],"Queens",1,1918,"J train stop in Woodhaven — residential Queens neighborhood","Elderts Lane is a quiet residential street in Woodhaven — the elevated J train provides views of the neighborhood rooftops."],
  ["85 St-Forest Pkwy",["J"],"Queens",1,1918,"J train stop in Woodhaven — near Forest Park","Forest Park's western edge is steps from this stop — the park's carousel, dating to 1903, is a neighborhood treasure."],
  ["Woodhaven Blvd",["J","Z"],"Queens",2,1918,"J/Z stop in Richmond Hill — major Queens crossroads","Woodhaven Boulevard is one of Queens' main north-south arteries — running from the borough's north to its south."],
  ["104 St (J)",["J"],"Queens",1,1918,"J train stop in Ozone Park — near the Queens-Brooklyn border","Ozone Park was developed in the 1880s as a garden community — the name was chosen for the area's fresh air."],
  ["111 St (J)",["J"],"Queens",1,1918,"J train stop in South Jamaica — working-class Queens neighborhood","South Jamaica is a densely populated neighborhood with a long African-American heritage."],
  ["121 St",["J","Z"],"Queens",2,1918,"J/Z stop in South Jamaica — major Queens commercial area","121st Street is a commercial hub in Jamaica — one of Queens' most active commercial districts outside of downtown Flushing."],
  // ── QUEENS — N/Q/R/W (Astoria Line) ──────────────────────────────────
  ["Astoria Blvd",["N","W"],"Queens",2,1917,"N/W stop in Astoria — near LaGuardia Airport corridor","Astoria Boulevard leads toward LaGuardia Airport — it's one of Queens' main east-west streets."],
  ["30 Av",["N","W"],"Queens",3,1917,"Astoria N/W stop — one of the neighborhood's main commercial strips","30th Avenue in Astoria is one of NYC's most vibrant international dining streets — Greek, Middle Eastern, and South Asian."],
  ["Broadway (N/W)",["N","W"],"Queens",3,1917,"Astoria N/W stop near Steinway Street — one of NYC's great shopping streets","Steinway Street, steps away, is the second-busiest commercial strip in Queens — 180 years of pianos and now global commerce."],
  ["36 Av",["N","W"],"Queens",2,1917,"Astoria N/W stop — residential Queens neighborhood","36th Avenue in Astoria is a quieter commercial strip — serving the neighborhood's mix of Greek, Egyptian, and Bangladeshi residents."],
  ["39 Av-Dutch Kills",["N","W"],"Queens",2,1917,"N/W stop in Long Island City — the Dutch Kills neighborhood","Dutch Kills takes its name from the Dutch colonial-era waterway — it's now one of LIC's rapidly developing areas."],
  // ── QUEENS — 7 Train ──────────────────────────────────────────────────
  ["Vernon Blvd-Jackson Av",["7"],"Queens",3,1917,"7 train stop in Long Island City — first Queens stop on the Flushing Line","Vernon Boulevard is lined with waterfront restaurants and galleries overlooking the Manhattan skyline — one of NYC's most scenic streets."],
  ["46 St-Bliss St",["7"],"Queens",2,1917,"7 train stop in Sunnyside — suburban-feeling Queens neighborhood","Sunnyside Gardens, nearby, is a 1924 planned garden community — the houses and shared gardens are still well-preserved today."],
  ["52 St",["7"],"Queens",2,1917,"7 train stop in Woodside — Irish-American Queens neighborhood","Woodside has one of NYC's largest Irish-American communities — Irish pubs and Philippine restaurants share the blocks."],
  ["61 St-Woodside",["7"],"Queens",3,1917,"7 train stop in Woodside — LIRR connection for Long Island commuters","The LIRR station at Woodside provides a direct connection to Penn Station — a lifeline for Long Island commuters."],
  ["69 St",["7"],"Queens",2,1917,"7 train stop in Woodside — near the busy Roosevelt Avenue corridor","Roosevelt Avenue runs beneath the 7 train for miles — one of NYC's most commercially dense and ethnically diverse streets."],
  ["82 St-Jackson Hts",["7"],"Queens",3,1928,"7 train stop in Jackson Heights — one of the neighborhood's main stops","82nd Street in Jackson Heights is lined with Indian, Bangladeshi, and South Asian businesses — a neighborhood shopping hub."],
  ["90 St-Elmhurst Av",["7"],"Queens",2,1928,"7 train stop in Elmhurst — one of NYC's most diverse neighborhoods","Elmhurst has been called the most ethnically diverse urban area in the world — over 120 languages are spoken here."],
  ["103 St-Corona Plaza",["7"],"Queens",3,1928,"7 train stop in Corona — near the famous Lemon Ice King","The Lemon Ice King of Corona, open since 1944, is one of NYC's most beloved summer institutions — lines stretch around the block."],
  ["Junction Blvd",["7"],"Queens",3,1928,"7 train stop in Corona/Jackson Heights — busy Queens hub","Junction Boulevard is a meeting point of Corona and Jackson Heights — a Colombian and Ecuadorian community hub."],
  ["111 St (7)",["7"],"Queens",2,1928,"7 train stop in Corona — near Citi Field and Flushing Meadows","Flushing Meadows-Corona Park hosted two World's Fairs (1939 and 1964) — the Unisphere still stands as their monument."],
  // ── QUEENS — F/G/E/R ──────────────────────────────────────────────────
  ["Briarwood",["E","F"],"Queens",2,1988,"E/F stop in Briarwood — near the Van Wyck Expressway","Briarwood is a quiet, middle-class neighborhood in central Queens — home to many city workers and their families."],
  ["Kew Gardens",["E","F"],"Queens",2,1936,"E/F stop in Kew Gardens — one of Queens' most pleasant residential areas","Kew Gardens was developed in the 1910s as an English garden suburb — its quiet streets and Tudor homes still charm visitors."],
  ["Union Tpke-Kew Gardens",["E","F"],"Queens",2,1936,"E/F stop at the Union Turnpike junction in Kew Gardens","Union Turnpike is one of Queens' major east-west arteries — this stop serves southeastern Queens communities."],
  ["169 St",["F"],"Queens",1,1988,"F train stop in Jamaica Hills — southeastern Queens","Jamaica Hills is a quiet residential neighborhood — the F train's Jamaica branch provides a direct link to lower Manhattan."],
  ["Parsons Blvd",["F"],"Queens",2,1988,"F train stop in Jamaica — major Queens transportation hub","Parsons Boulevard runs through the heart of Jamaica — one of Queens' most historically significant neighborhoods."],
  ["Jamaica-Van Wyck",["E"],"Queens",2,2003,"E train stop in Jamaica — connects to the Van Wyck Expressway corridor","Jamaica is a major Queens transportation hub — the area surrounding this stop has seen major redevelopment."],
  ["75 Av",["F"],"Queens",2,1936,"F train stop in Forest Hills — between Forest Hills Gardens and the tennis club","Forest Hills Gardens is a 1908 planned community modeled on English villages — its cobblestone streets are preserved today."],
  ["67 Av",["F"],"Queens",2,1936,"F train stop in Forest Hills — residential mid-Queens neighborhood","67th Avenue in Forest Hills is a quiet residential street — steps from the borough's best movie theaters."],
  ["63 Dr-Rego Center",["M","R"],"Queens",2,1936,"M/R stop in Rego Park — named for the Real Good Construction Company","Rego Park is a dense, diverse Queens neighborhood — home to one of NYC's largest Bukharan Jewish communities."],
  ["Woodhaven Blvd (M/R)",["M","R"],"Queens",2,1936,"M/R stop in Rego Park — near a major Queens shopping center","The Woodhaven Boulevard corridor in Rego Park/Forest Hills is lined with major retail stores and restaurants."],
  ["Elmhurst Av",["M","R"],"Queens",2,1936,"M/R stop in Elmhurst — one of NYC's most diverse urban neighborhoods","Elmhurst's restaurants represent dozens of cuisines — Thais, Colombians, Chinese, Bangladeshis, and more all eat here."],
  ["Grand Av-Newtown",["M","R"],"Queens",2,1936,"M/R stop in Elmhurst — near the historic Newtown neighborhood","Newtown is one of Queens' oldest communities — originally settled by Dutch colonists in the 1640s."],
  ["Willets Point",["7"],"Queens",3,2023,"Newest 7 train station opened 2023 — serves the Willets Point redevelopment","The new Willets Point station opened in 2023 as part of a major redevelopment project — one of the newest stops in the system."],
  ["Steinway St",["M","R"],"Queens",2,1917,"M/R stop in Astoria — near the famous Steinway piano factory","The Steinway & Sons factory in Astoria has been making pianos since 1876 — it remains the last major US piano manufacturer."],
  ["46 St (N/W)",["N","Q","R","W"],"Queens",2,1917,"Woodside N/Q/R/W stop — primarily serves Sunnyside and Woodside residents","46th Street in Queens serves a neighborhood that has long been home to Irish, Latin American, and Asian communities."],
  ["36 St (N/Q/R)",["N","Q","R"],"Queens",2,1917,"Sunnyside N/Q/R stop — serves south Sunnyside","This stop is close to the borough's northwest edge — the trains quickly cross the Queensborough Bridge approaches."],
  // ── ADDITIONAL BROOKLYN N/Q/R/W ───────────────────────────────────────
  ["Prospect Av (R)",["R"],"Brooklyn",2,1916,"R train stop in Windsor Terrace — near Prospect Park","Windsor Terrace is one of Brooklyn's most family-friendly neighborhoods — a tight-knit community bordering Prospect Park."],
  ["25 St",["R"],"Brooklyn",2,1916,"R train stop in Greenwood Heights — near Green-Wood Cemetery","Green-Wood Cemetery's Gothic Revival entrance gates are a National Historic Landmark — the cemetery dates to 1838."],
  ["Pacific St",["R"],"Brooklyn",3,1916,"R train stop in Boerum Hill — near the Brooklyn Academy of Music","BAM, as it's known, is one of America's most prestigious performing arts venues — it has operated continuously since 1861."],
  // ── ROCKAWAY PENINSULA ─────────────────────────────────────────────────
  ["Rockaway Park-Beach 116 St",["A"],"Queens",1,1956,"Southern Rockaway A train terminus — steps from the Atlantic Ocean beaches","This stop is popular in summer — riders pour out to reach the Atlantic Ocean beaches of the Rockaway Peninsula."],
  ["Beach 105 St",["A"],"Queens",1,1956,"Rockaway A train stop — steps from the Atlantic Ocean","The Rockaways are a barrier peninsula — the beach here stretches for miles, a NYC gem hidden at the A train's far end."],
  ["Beach 98 St",["A"],"Queens",1,1956,"Rockaway A train stop — Rockaway Beach neighborhood","Beach 98th Street serves the Rockaway Beach neighborhood — a beach town with surf culture within the city limits."],
  ["Beach 90 St",["A"],"Queens",1,1956,"Rockaway A train stop — near the Belle Harbor neighborhood","Belle Harbor is one of the Rockaways' most affluent neighborhoods — a seaside enclave with single-family homes."],
  ["Beach 67 St",["A"],"Queens",1,1956,"Rockaway A train stop — near Jacob Riis Park","Jacob Riis Park, at the Rockaway Peninsula's western tip, is a public beach run by the National Park Service."],
  ["Beach 44 St",["A"],"Queens",1,1956,"Rockaway A train stop — Arverne neighborhood","Arverne is one of the Rockaways' neighborhoods most affected by Hurricane Sandy — undergoing long-term redevelopment."],
  ["Beach 36 St",["A"],"Queens",1,1956,"Rockaway A train stop — Far Rockaway area","The Far Rockaway peninsula has some of the longest beaches in NYC — often overlooked in favor of Coney Island."],
  ["Beach 25 St",["A"],"Queens",1,1956,"Rockaway A train stop near Far Rockaway's residential area","This stop serves the quieter Far Rockaway neighborhood — a long commute from Midtown but a world away in character."],
  ["Mott Av",["A"],"Queens",2,1956,"A train stop in Far Rockaway — near the main commercial center","Mott Avenue is Far Rockaway's main commercial street — a hub for the community that lives at the city's eastern edge."],
  ["Broad Channel",["A","S"],"Queens",1,1915,"A train and shuttle stop on the island between Jamaica Bay and the Rockaways","Broad Channel is the only inhabited island in Jamaica Bay — about 3,000 people live on this marshland community."],
  // ── COMPLETE TO 423 — BROOKLYN CROWN HEIGHTS (IRT Eastern Pkwy) ────────
  ["Grand Army Plaza",["2","3"],"Brooklyn",4,1920,"Major Brooklyn hub beneath the grand traffic circle — gateway to Prospect Park","Grand Army Plaza's triumphal arch, modeled on Paris's Arc de Triomphe, honors Union Army soldiers of the Civil War."],
  ["7 Av (2/3)",["2","3"],"Brooklyn",3,1920,"IRT stop beneath Park Slope's main street — Crown Heights gateway","Park Slope's 7th Avenue is one of Brooklyn's most beloved commercial strips — cafes, bakeries, and shops line every block."],
  ["President St-Medgar Evers College",["2","3"],"Brooklyn",2,1920,"Crown Heights 2/3 stop — serves a neighborhood with rich cultural history","Medgar Evers College nearby is a CUNY institution named for the Mississippi civil rights leader murdered in 1963."],
  ["Kingston Av",["3"],"Brooklyn",2,1920,"3 train stop in Crown Heights — near the Chabad-Lubavitch world headquarters","770 Eastern Parkway, the Chabad-Lubavitch world headquarters, is a few blocks from this stop."],
  ["Crown Hts-Utica Av",["2","3"],"Brooklyn",3,1920,"Crown Heights 2/3 stop on Utica Avenue — a major north-south Brooklyn corridor","Utica Avenue in Crown Heights is a vibrant West Indian commercial strip — West Indian Day Parade ends here."],
  // ── BROOKLYN — Clark St (2/3) deep station ────────────────────────────
  ["Clark St",["2","3"],"Brooklyn",2,1919,"2/3 stop in Brooklyn Heights — one of the deepest subway stations in the system","Clark Street station sits 100 feet below Brooklyn Heights — accessed by elevator through a narrow shaft."],
  // ── BROOKLYN — 4th Ave south (N/D trains) ─────────────────────────────
  ["Fort Hamilton Pkwy",["N","F"],"Brooklyn",2,1916,"N and F stop in Borough Park — near the Fort Hamilton military base","Fort Hamilton at the Narrows has been an active US Army installation since 1825 — it's the city's last active base."],
  ["New Utrecht Av",["N","D"],"Brooklyn",2,1916,"N/D stop in Borough Park — major hub serving South Brooklyn's Jewish community","Borough Park is home to the largest Orthodox Jewish community outside Israel — 80,000 residents within a few square miles."],
  ["20 Av",["N"],"Brooklyn",1,1916,"N train stop in Bensonhurst — quiet residential South Brooklyn","20th Avenue in Bensonhurst is a quiet residential street — the elevated N train rolls past attached brick row houses."],
  ["Bay Pkwy (D/N)",["D","N"],"Brooklyn",2,1916,"D/N stop in Bath Beach — southern Brooklyn neighborhood near the water","Bath Beach is one of Brooklyn's quietest southern neighborhoods — a mix of Italian, Russian, and Chinese residents."],
  ["79 St (D/N)",["D","N"],"Brooklyn",2,1916,"D/N train stop in Bensonhurst — residential South Brooklyn","Bensonhurst's 86th Street commercial strip, nearby, is still dotted with Italian bakeries and old-school pizzerias."],
  ["62 St",["D","N","R"],"Brooklyn",2,1916,"D/N/R stop in Sunset Park — Industry City campus nearby","Industry City in Sunset Park has reinvented itself as a 35-building creative and industrial campus with 500+ businesses."],
  // ── BROOKLYN — Brighton south (B/Q) ───────────────────────────────────
  ["Ocean Pkwy",["B","Q"],"Brooklyn",2,1920,"B/Q stop near Ocean Parkway — Brighton Beach area gateway","Ocean Parkway is one of NYC's grandest boulevards — Frederick Law Olmsted designed it as a scenic approach to Coney Island."],
  ["Clarendon Rd",["Q"],"Brooklyn",1,1954,"Q train stop in East Flatbush — residential South Brooklyn","Clarendon Road in East Flatbush serves a quiet residential stretch — a mix of Caribbean and South Asian communities."],
  ["Avenue H",["Q"],"Brooklyn",2,1954,"Q train stop in Flatbush — at the heart of residential South Brooklyn","Avenue H runs through stable Flatbush — shared by Orthodox Jewish and Caribbean communities for decades."],
  // ── MANHATTAN — additional stations ───────────────────────────────────
  ["5 Av",["7"],"Manhattan",4,1928,"7 train stop at 5th Avenue and 42nd Street — above Bryant Park","The 7 train's 5th Avenue stop puts riders directly above Bryant Park — NYC's beloved midtown public green space."],
  ["175 St",["A"],"Manhattan",2,1933,"A train stop in Washington Heights — one of the deepest stations in the system","The A train at 175 St runs in a deep-level cut — from here the train rises to cross the Hudson via the former NJ Transit tracks."],
  ["190 St",["A"],"Manhattan",2,1933,"A train stop near Fort Washington — one of Manhattan's most elevated neighborhoods","Fort Washington is one of Manhattan's highest natural points — the Bennett Park area reaches 265 feet above sea level."],
  ["Bleecker St",["6"],"Manhattan",3,1878,"6 train stop between Astor Place and Spring Street — NoHo/SoHo border","NoHo and SoHo meet at Bleecker Street — one of downtown Manhattan's most eclectic and historically rich corridors."],
  ["Broadway-Lafayette St",["B","D","F","M"],"Manhattan",4,1956,"Major Manhattan transfer — B, D, F, and M trains meet near NoHo","Broadway-Lafayette connects to the 6 train at Bleecker St via free transfer — a key downtown east-west link."],
  ["Grand St",["B","D"],"Manhattan",3,1936,"B/D stop in lower Manhattan — Chinatown and Little Italy gateway","Grand Street runs through the heart of Chinatown — NYC's largest Chinese-American enclave has been here since the 1880s."],
  ["East Broadway",["F"],"Manhattan",2,1936,"F train stop on the Lower East Side — heart of the old Jewish immigrant district","East Broadway was the main street of the Lower East Side's Jewish community — Yiddish theaters and tenements lined it for decades."],
  ["Park Pl",["2","3"],"Manhattan",3,1878,"2/3 stop in lower Manhattan — between Chambers St and Fulton St","Park Place is one block from City Hall — government buildings and courthouses surround this stop."],
  ["57 St",["F"],"Manhattan",3,1989,"F train stop on 57th Street — Midtown South gateway","57th Street is one of Midtown's premier corridors — Carnegie Hall is a few blocks east of this underground station."],
  ["World Trade Center",["E"],"Manhattan",4,1962,"Eastern terminus of the E train — beneath the rebuilt World Trade Center","The World Trade Center station connects to the Oculus transit hub — Santiago Calatrava's cathedral-like structure opened in 2016."],
  // ── BROOKLYN — additional stations ────────────────────────────────────
  ["Lafayette Av",["A","C"],"Brooklyn",3,1936,"A/C stop in Fort Greene — between Hoyt-Schermerhorn and Nostrand Ave on the Fulton St line","Fort Greene is one of Brooklyn's most desirable neighborhoods — brownstones, BAM, and the Navy Yard border this stop."],
  ["York St",["F"],"Brooklyn",2,1936,"F train stop in DUMBO — gateway to one of Brooklyn's most transformed neighborhoods","DUMBO (Down Under the Manhattan Bridge Overpass) went from a warehouse district to NYC's most expensive zip code."],
  // ── QUEENS — additional stations ──────────────────────────────────────
  ["Hunters Point Av",["7"],"Queens",3,1917,"7 train stop in Long Island City — gateway to one of NYC's fastest-growing neighborhoods","Long Island City transformed from an industrial zone to one of NYC's most desirable neighborhoods in a decade."],
  ["Queens Plaza",["E","M","R"],"Queens",3,1933,"Long Island City E/M/R hub — just over the Queens border from Manhattan","Queens Plaza sits at the foot of the Queensborough Bridge — the view of the 59th Street Bridge from here is iconic."],
  ["Middle Village-Metropolitan Av",["M"],"Queens",2,1906,"Western Queens terminus of the M train — quiet residential neighborhood terminal","Middle Village is one of Queens' most stable Italian-American neighborhoods — the M train ends here quietly."],
  ["Lexington Av-53 St",["E","M"],"Manhattan",4,1989,"Midtown East E/M stop — connects to the Lexington Ave 6 train via free corridor","The E/M at 53rd and Lexington connects via a concourse to the 6 train — a key midtown east-west transfer."],
  // ── FINAL UNIQUE STATIONS TO REACH 423 ────────────────────────────────
  // Manhattan
  ["Cathedral Pkwy-110 St",["B","C"],"Manhattan",2,1906,"B/C stop in Morningside Heights — gateway to Cathedral of St. John the Divine","The Cathedral of St. John the Divine is the world's largest Gothic cathedral — construction began in 1892 and continues today."],
  ["14 St-6 Av",["F","M","L"],"Manhattan",4,1940,"6th Avenue station at 14th Street — F, M, and L trains converge","This station on the 6th Avenue IND trunk line is one of Midtown South's busiest transfers — the L connection carries Brooklyn commuters."],
  ["City Hall",["N","R","W"],"Manhattan",3,1918,"N/R/W stop in lower Manhattan — the BMT Broadway line's City Hall station","This station stands at the foot of City Hall Park on Broadway — distinct from the IRT's Brooklyn Bridge-City Hall, it has served the BMT line since 1918."],
  ["Inwood-207 St",["A"],"Manhattan",2,1932,"A train northern terminus in Inwood — the top of the 8th Avenue line","Inwood-207 St is the A train's upper Manhattan terminus — a different physical station from the 1 train's 207 St stop nearby on Broadway."],
  ["Gravesend-79 St",["N"],"Brooklyn",2,1916,"N train Sea Beach stop in Gravesend — between Ocean Pkwy and Avenue U","Gravesend is one of Brooklyn's oldest settlements — founded in 1643, it was the only English colony in New Netherland."],
  ["Beach 60 St",["A"],"Queens",1,1956,"A train stop on the Far Rockaway branch — Rockaway Peninsula","Beach 60th Street sits on the narrow Rockaway Peninsula between Jamaica Bay and the Atlantic Ocean — one of New York's most unique geographic communities."],
  ["71 St",["D"],"Brooklyn",2,1916,"D train West End line stop in Bensonhurst — between Bay Pkwy and 62 St","71st Street in Bensonhurst is a local D train stop on the elevated West End line — a neighborhood of brick apartment buildings and small shops."],
  ["55 St",["D"],"Brooklyn",2,1916,"D train West End line stop in Sunset Park — between 62 St and 50 St","55th Street in Sunset Park is a local D train stop on the elevated West End line — a neighborhood with strong Scandinavian and Latino roots."],
  // Brooklyn
  ["Hoyt St",["2","3"],"Brooklyn",3,1920,"2/3 stop in Boerum Hill — the IRT's station near Atlantic Terminal","Hoyt Street in Boerum Hill is the 2/3 train's own stop near downtown Brooklyn — a separate station from the A/C/G's Hoyt-Schermerhorn Sts nearby."],
  ["Putnam Av",["J","M"],"Brooklyn",2,1906,"J/M stop in Bushwick — on the elevated Myrtle Ave J/M line","Putnam Avenue in Bushwick is one of the quieter elevated J/M stops — lined with brick townhouses and small storefronts below the tracks."],
  ["18 Av (F)",["F"],"Brooklyn",2,1954,"F train stop on the Culver line in Kensington — at McDonald Ave and 18th Ave","The F train's 18th Avenue stop is in Kensington on the Culver line — a different physical station from the D/N 4th Avenue line's 18 Av in Bensonhurst."],
  ["20 Av (F)",["F"],"Brooklyn",2,1954,"F train stop on the Culver line in Kensington — at McDonald Ave and 20th Ave","The F train's 20th Avenue Culver line stop threads through Kensington — a quiet residential neighborhood of brick row houses and small shops."],
  ["Kings Hwy (F)",["F"],"Brooklyn",3,1954,"F train stop on the Culver line in Gravesend — at McDonald Ave and Kings Highway","Kings Highway at McDonald Ave is the F train's Culver line stop — distinct from the B/Q Brighton line's Kings Hwy station on Flatbush Ave two miles east."],
  ["7 Av (F/G)",["F","G"],"Brooklyn",3,1933,"F/G stop in Park Slope at 7th Avenue and Sterling Street","The F/G trains' 7th Avenue stop is four blocks from the B/Q platform — both called 7 Av but separate stations in the MTA count."],
  ["Franklin Av",["C","S"],"Brooklyn",2,1878,"C/S stop in Crown Heights — interchange with the Franklin Ave shuttle","Franklin Avenue is Crown Heights' main artery — the shuttle here connects to the Brooklyn Botanic Garden and Prospect Park."],
  ["Chauncey St",["J","Z"],"Brooklyn",2,1888,"J/Z stop in Brownsville — on the Broadway-Brooklyn elevated","Chauncey Street in Brownsville is one of the older J/Z stops on the Broadway elevated — the neighborhood has a rich Jewish and African-American history."],
  ["Sheffield Av",["J","Z"],"Brooklyn",2,1888,"J/Z stop in East New York — on the elevated above Fulton Street","Sheffield Avenue in East New York was named for Sheffield Farms dairy — the J/Z elevated passes through one of Brooklyn's most storied communities."],
  ["DeKalb Av (J/M)",["J","M","Z"],"Brooklyn",3,1888,"J/M/Z stop in Bushwick — distinct from the 4th Ave DeKalb Av station","DeKalb Avenue in Bushwick connects multiple elevated J/M/Z stops — named for Baron de Kalb who served in the Revolutionary War."],
  ["25 Av",["F"],"Brooklyn",2,1954,"F train stop in Bensonhurst — between Bay Pkwy and Bay Ridge-95 St","25th Avenue is a residential stop on the F train's Bensonhurst stretch — one of Brooklyn's oldest Italian-American enclaves sits along this corridor."],
  ["Botanic Garden",["S"],"Brooklyn",1,1878,"Franklin Ave shuttle stop — adjacent to Brooklyn Botanic Garden","The Brooklyn Botanic Garden is home to over 14,000 plant species — its Japanese Hill-and-Pond Garden opened in 1915."],
  // Queens — M train through Ridgewood/Middle Village
  ["Seneca Av",["M"],"Queens",1,1906,"M train stop in Ridgewood — the border of Brooklyn and Queens","Ridgewood belongs entirely to Queens despite its Brooklyn border — its brick row houses date from the early 1900s."],
  ["Forest Av",["M"],"Queens",1,1906,"M train stop in Ridgewood — working-class Queens neighborhood","Ridgewood's Forest Avenue is a commercial strip that has served working-class families for over a century."],
  ["Fresh Pond Rd",["M"],"Queens",1,1906,"M train stop in Ridgewood — near Myrtle Avenue commercial corridor","Fresh Pond Road is Ridgewood's main commercial street — a mix of old German-American and new immigrant businesses."],
  ["Knickerbocker Av",["M"],"Queens",1,1906,"M train stop in Ridgewood — named for the old Dutch settlers of New York","Knickerbocker is a New York nickname dating to Washington Irving's satirical 1809 'History of New York' — it still means New Yorker."],
  ["Central Av",["M"],"Queens",1,1906,"M train stop in Ridgewood — residential neighborhood station","Central Avenue in Ridgewood runs through one of the borough's most architecturally uniform stretches of brick row houses."],
  ["Aqueduct Racetrack",["A"],"Queens",1,1956,"A train seasonal stop — serves Aqueduct Racetrack during racing season","Aqueduct Racetrack is NYC's only active thoroughbred track — the A train platform is only staffed on racing days."],
  ["33 St-Rawson St",["7"],"Queens",2,1917,"7 train stop in Sunnyside — on the elevated IRT Flushing line","33rd Street in Sunnyside is one of the local 7 train stops above Queens Boulevard — a neighborhood of row houses and long-established businesses."],
  ["40 St-Lowery St",["7"],"Queens",2,1917,"7 train stop in Sunnyside — elevated above Lowery Street","40th Street is a 7 train local stop in Sunnyside — a neighborhood long home to Irish-American and diverse immigrant communities."],
  ["21 St",["G"],"Queens",2,1933,"G train stop in Long Island City — in the shadow of the Queensboro Bridge","21st Street in Long Island City sits beneath the Queens-side approach to the Queensboro Bridge — a quiet industrial-turned-residential block."],
  // Bronx
  ["219 St",["2","5"],"Bronx",1,1917,"2/5 stop on the White Plains Rd line — northern Bronx residential neighborhood","219th Street in the Bronx is one of the quieter stops on the White Plains Road elevated line — surrounded by attached brick homes."],
  ["Prospect Av (Bronx)",["2","5"],"Bronx",2,1920,"2/5 stop in Longwood — South Bronx community anchor","Prospect Avenue in the Bronx runs through a neighborhood of bodegas, churches, and community organizations."],
  ["E 143 St-St Mary's St",["6"],"Bronx",2,1920,"6 train stop in Mott Haven — between Cypress Av and Longwood Av","St. Mary's Park is steps from this stop — one of the South Bronx's green spaces and a neighborhood anchor since the 1890s."],
  ["E 174 St",["2","5"],"Bronx",2,1918,"2/5 stop on the White Plains Rd line — Bronx residential neighborhood","East 174th Street in the Bronx is a working-class residential corridor — the elevated 2/5 runs above the rooftops here."],
  ["183 St (4 Tr)",["4"],"Bronx",1,1918,"4 train stop in Fordham — one block from the B/D 182-183 Sts station","Fordham Road is the Bronx's busiest commercial corridor — this stop serves shoppers, students, and Fordham University."],
  ["Morris Park",["5"],"Bronx",1,1941,"5 train stop on the Dyre Ave branch — serves the Morris Park neighborhood","Morris Park was a famous racetrack in the 1890s — now it is a quiet, working-class northeast Bronx neighborhood."],
];

const NYC_IMG:Record<string,string>={
  "Times Sq-42 St / Port Auth Bus Terminal":"Times_Square_station_42nd_Street.jpg",
  "Grand Central-42 St":"Grand_Central_station_subway_New_York.jpg",
  "34 St-Herald Sq":"34th_Street_Herald_Square_station.jpg",
  "14 St-Union Sq":"14th_Street_Union_Square_station.jpg",
  "Fulton St":"Fulton_Center_New_York_City.jpg",
  "Jay St-MetroTech":"Jay_Street-MetroTech_station.jpg",
  "Atlantic Av-Barclays Ctr":"Atlantic_Avenue-Barclays_Center_station.jpg",
  "Flushing-Main St":"Flushing_Main_Street_station.jpg",
  "Jackson Hts-Roosevelt Av":"Jackson_Heights_Queens_New_York.jpg",
  "Court Sq":"Court_Square_station_NYC.jpg",
  "125 St (2/3)":"125th_Street_station_New_York.jpg",
  "Canal St":"Canal_Street_Manhattan.jpg",
  "Chambers St":"Chambers_Street_station_NYC.jpg",
  "South Ferry":"South_Ferry_station_NYC.jpg",
  "Astoria-Ditmars Blvd":"Astoria_Queens_New_York.jpg",
  "Pelham Bay Park":"Pelham_Bay_Park_Bronx.jpg",
  "Woodlawn":"Woodlawn_Bronx_New_York.jpg",
  "Far Rockaway-Mott Av":"Far_Rockaway_New_York.jpg",
  "Delancey St-Essex St":"Delancey_Street_station_NYC.jpg",
  "Fordham Rd":"Fordham_Road_Bronx.jpg",
  "Jamaica-179 St":"Jamaica_Queens_New_York.jpg",
  "Howard Beach-JFK Airport":"Howard_Beach_station_NYC.jpg",
  "86 St":"86th_Street_station_NYC.jpg",
  "96 St":"96th_Street_station_NYC.jpg",
  "Borough Hall":"Borough_Hall_station_Brooklyn.jpg",
  "Church Av":"Church_Avenue_station_Brooklyn.jpg",
  "Sutphin Blvd-Archer Av-JFK Airport":"JFK_Airport_New_York.jpg",
  "72 St":"72nd_Street_station_NYC.jpg",
  "86 St-Riverside":"86th_Street_Riverside_station.jpg",
  "116 St-Columbia University":"Columbia_University_New_York.jpg",
  "168 St":"168th_Street_station_NYC.jpg",
  "181 St":"181st_Street_station_NYC.jpg",
  "207 St":"Inwood_Manhattan_New_York.jpg",
  "149 St-Grand Concourse":"Grand_Concourse_Bronx.jpg",
  "161 St-Yankee Stadium":"161st_Street-Yankee_Stadium_station.jpg",
  "Tremont Av":"Tremont_Avenue_Bronx.jpg",
  "Dekalb Av":"DeKalb_Avenue_station_Brooklyn.jpg",
  "Hoyt-Schermerhorn Sts":"Hoyt-Schermerhorn_Streets_station_NYC.jpg",
  "7 Av":"7th_Avenue_Brooklyn_station.jpg",
  "Bay Ridge-95 St":"Bay_Ridge_Brooklyn_New_York.jpg",
  "Coney Island-Stillwell Av":"Coney_Island-Stillwell_Avenue_station.jpg",
  "Brighton Beach":"Brighton_Beach_Brooklyn.jpg",
  "Spring St":"Spring_Street_station_NYC.jpg",
  "Christopher St-Sheridan Sq":"Greenwich_Village_New_York.jpg",
  "West 4 St-Wash Sq":"Washington_Square_Park_New_York.jpg",
  "23 St":"23rd_Street_station_NYC.jpg",
  "14 St":"14th_Street_station_NYC.jpg",
  "Queensboro Plaza":"Queensboro_Plaza_station.jpg",
  "74 St-Broadway":"Jackson_Heights_Queens_New_York.jpg",
  "Jamaica Center-Parsons/Archer":"Jamaica_Queens_New_York.jpg",
  "Forest Hills-71 Av":"Forest_Hills_Queens_New_York.jpg",
  "Flatbush Av-Brooklyn College":"Brooklyn_College.jpg",
  "Eastern Pkwy-Brooklyn Museum":"Brooklyn_Museum.jpg",
  "Nostrand Av":"Nostrand_Avenue_station_Brooklyn.jpg",
  "Canarsie-Rockaway Pkwy":"Canarsie_Brooklyn_New_York.jpg",
  "Myrtle Av":"Myrtle_Avenue_Brooklyn.jpg",
  "Myrtle-Wyckoff Avs":"Myrtle_Wyckoff_station_NYC.jpg",
  "34 St-Penn Station":"Penn_Station_New_York_City.jpg",
  "59 St-Columbus Circle":"Columbus_Circle_New_York_City.jpg",
  "Brooklyn Bridge-City Hall":"Brooklyn_Bridge_New_York.jpg",
  "47-50 Sts-Rockefeller Ctr":"Rockefeller_Center_New_York.jpg",
  "Wall St":"Wall_Street_New_York_City.jpg",
  "Astor Pl":"Astor_Place_station_NYC.jpg",
  "Bedford Av":"Bedford_Avenue_Williamsburg_Brooklyn.jpg",
  "Smith-9 Sts":"Smith-9_Streets_station_NYC.jpg",
  "Mets-Willets Point":"Citi_Field_New_York.jpg",
  "125 St (A/B/C)":"125th_Street_Harlem_New_York.jpg",
  "Nassau Av":"Greenpoint_Brooklyn_New_York.jpg",
};
const NYC_STATIONS=NYC_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:NYC_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${NYC_IMG[name]}`:""}));

// ── CHICAGO L ─────────────────────────────────────────────────────────────────
const CHI_DYK=["Chicago's 'L' (elevated) system opened in 1892 — the Loop elevated tracks have been in continuous use ever since.","The Loop elevated structure, completed in 1897, gave downtown its name — all lines circle 8 city blocks.","O'Hare is the Blue Line terminus — airport service from downtown runs 24/7, rain or shine.","The Red Line is the only CTA line that runs 24 hours a day — a lifeline for night workers and late-night commuters.","Howard station is the northern hub of the Red and Purple Lines — the Yellow Line (Skokie Swift) starts here.","The Green Line through Bronzeville passes sites of historic jazz clubs that shaped modern American music.","Merchandise Mart, served by the Brown/Purple Lines, was the largest building in the world when it opened in 1930.","The CTA L system has 145 stations and 224 miles of track — the second largest heavy rail system in the US.","Midway station serves Midway Airport, a major Southwest Airlines hub since 1993.","The Chicago L is unique for having entirely color-coded lines — Red, Blue, Brown, Green, Orange, Pink, Purple, and Yellow."];
const CHI_TRIVIA=[
  {q:"What year did Chicago's L elevated system first open?",opts:["1888","1892","1897","1902"],ans:1},
  {q:"The Loop elevated gives downtown its name — what shape does it form?",opts:["An oval","A circle around 8 blocks","A straight line","A figure-8"],ans:1},
  {q:"Which CTA line runs 24 hours a day?",opts:["Blue Line","Brown Line","Red Line","Green Line"],ans:2},
  {q:"O'Hare Airport is served by which CTA line?",opts:["Red","Blue","Orange","Purple"],ans:1},
  {q:"Midway Airport is served by which CTA line?",opts:["Red","Blue","Green","Orange"],ans:3},
  {q:"The Merchandise Mart station serves which two lines?",opts:["Red and Blue","Brown and Purple","Green and Orange","Pink and Brown"],ans:1},
  {q:"Which line runs through Bronzeville and the historic South Side jazz corridor?",opts:["Red","Green","Orange","Blue"],ans:1},
  {q:"Howard station is the northern transfer hub for which lines?",opts:["Red, Purple, and Yellow","Red, Brown, and Purple","Blue, Green, and Yellow","Red and Orange"],ans:0},
  {q:"The CTA L system has approximately how many stations?",opts:["95","120","145","170"],ans:2},
  {q:"Which line serves Evanston (Northwestern University) as an express?",opts:["Brown","Yellow","Purple","Red"],ans:2},
  {q:"The Yellow Line is nicknamed what?",opts:["Skokie Swift","Evanston Express","North Shore Liner","Lakefront Local"],ans:0},
  {q:"Which station is considered the most connected transfer in the Loop?",opts:["Washington/Wabash","State/Lake","Clark/Lake","Randolph/Wabash"],ans:2},
  {q:"The Pink Line (54th/Cermak) opened in which year?",opts:["1997","2003","2006","2010"],ans:2},
  {q:"Which L line serves Chicago's Pilsen/Little Village area?",opts:["Orange","Pink","Green","Red"],ans:1},
  {q:"Addison station on the Red Line is famous for being steps from which stadium?",opts:["Soldier Field","United Center","Wrigley Field","Guaranteed Rate Field"],ans:2},
];
const CHI_HINTS:{[k:string]:[string,string]}={
  "O'Hare":["Western terminus of the Blue Line — 24/7 service to one of the nation's busiest airports","Blue Line runs express at rush hours — this station is a major international hub in the Northwest zone"],
  "Midway":["Southern terminus of the Orange Line — serves Chicago's second major airport","Southwest Airlines' hub — the Orange Line opened in 1993 to connect here to the Loop"],
  "Howard":["The northern anchor of the system — Red, Purple, and Yellow Lines all connect here","This station is a true hub: Red Line local, Purple Line express to Evanston, Yellow (Skokie Swift)"],
  "Merchandise Mart":["Above the world's largest commercial building (when built in 1930) — Brown and Purple lines","The Mart spans two city blocks — it had its own ZIP code from 1930 to 2008"],
  "Clark/Lake":["The central transfer point in the Loop — 6 lines converge here above downtown streets","Brown, Green, Orange, Pink, and Purple all stop at this station — the busiest Loop transfer"],
  "Washington/Wabash":["An architecturally stunning Loop station — views of the Chicago skyline from the platform","The Wabash elevated tracks are one of Chicago's most iconic urban sights — rebuilt in 2017"],
  "95th/Dan Ryan":["Southern terminus of the Red Line in Roseland — south-side transit anchor","Chicago's south lakefront neighborhoods depend on the Red Line — this terminus connects to bus routes"],
  "54th/Cermak":["Western terminus of the Pink Line in the Little Village / Pilsen area","The Pink Line opened in 2006 as a reconfiguration of the Blue Line's Congress branch"],
  "Kimball":["Northern terminus of the Brown Line — in the Albany Park neighborhood","The Brown Line's curves through Ravenswood and Lincoln Square are among the system's most scenic"],
  "Linden":["Northern terminus of the Purple Line in Wilmette — at the edge of the North Shore","A 5-minute walk takes you to the stunning Baha'i House of Worship, open to all faiths"],
  "Addison":["Steps from Wrigley Field — the most iconic ballpark station in American sports","On Cubs game days, tens of thousands of fans pour through this station — Wrigley opened in 1914"],
  "Sox-35th":["The South Side's baseball cathedral — the stadium sits directly outside this Red Line station","The MLB team that calls the South Side home has played on this site since 1910. On game days this station is transformed."],
  "Harrison":["South Loop Red Line stop — one of Chicago's classic underground stations","Harrison Street marks the heart of Printer's Row, Chicago's historic publishing and bookstore district."],
  "Belmont (Blue Line)":["Blue Line Belmont in Logan Square — a completely different station from the Lakeview one","Deep in Logan Square's residential grid, this Belmont is surrounded by taquerias and two-flats, not sports bars."],
  "Chicago (Blue Line)":["A Blue Line station on Chicago Avenue — River West, near the Kennedy Expressway","Serves River West and the Ukrainian Village border — a completely separate station from the Near North Side stop on the Red Line."],
  "Addison (Blue Line)":["A Blue Line stop in Logan Square — no baseball stadium in sight, just residential grid and taquerias","This is a neighborhood stop, not a destination. The Cubs fans get off at the Red Line stop of the same name — two very different places."],
  "Western (Brown Line)":["A Brown Line stop in Lincoln Square — Chicago's German-American cultural heart","The Old Town School of Folk Music is steps away. This is one of the system's most charming neighborhood stations, far north on the Brown Line."],
  "Damen (Brown Line)":["A Brown Line stop in Lakeview — near the Southport dining corridor and an iconic independent cinema","Steps from the Music Box Theatre, one of Chicago's most beloved independent cinemas. Pure Lakeview — not to be confused with the Blue Line stop of the same name."],
  "Francisco":["A quiet Brown Line stop deep in Albany Park — one of Chicago's most linguistically diverse neighborhoods","This is a deep residential neighborhood stop on the northern stretch of the Brown Line, surrounded by bungalows and immigrant-owned shops."],
  "Kedzie (Brown Line)":["Brown Line's Kedzie Avenue stop — Albany Park's commercial heart between Kimball and Francisco","Brown Line — Northwest zone — Kedzie Avenue is lined with Korean restaurants, Mexican bakeries, and Middle Eastern grocers, reflecting Albany Park's extraordinary immigrant heritage"],
  "Harold Washington Library":["Loop station at State & Van Buren — named for Chicago's first Black mayor, who served 1983–1987","Originally called 'Library' — the Chicago Public Library's central branch sits directly below the elevated tracks here"],
  "LaSalle/Van Buren":["Southwest corner of the historic Union Loop — all four branch lines converge here","LaSalle Street is Chicago's financial spine — the Chicago Board of Trade's Art Deco tower anchors the end of the block"],
  "Quincy/Wells":["One of the original 1897 Loop stations — iron columns and brick station house virtually unchanged","The Quincy/Wells elevated appeared in 'The Dark Knight' chase sequence — one of the most-filmed spots in Chicago"],
  "Adams/Wabash":["Five lines converge on the Wabash elevated here — rebuilt as an open-air platform in 2017","The 'Wabash canyon' runs through the shadow of downtown towers — one of Chicago's most iconic urban views"],
  "Monroe":["Underground Blue Line stop in the heart of the Loop — part of the 1951 subway extension","The Blue Line subway section was built in 1951, replacing older surface routing — one of Chicago's postwar transit expansions"],
  "Davis":["The busiest station on the Purple Line — the heart of downtown Evanston","Davis Street is surrounded by Northwestern University hangouts, indie bookshops, and excellent restaurants"],
  "Morgan":["The newest full station on the Chicago L — opened in 2012","Morgan's opening triggered the West Loop's restaurant revolution — it's credited with transforming a warehouse district into a dining destination"],
  "Clinton":["Green and Pink lines share this Near West Side stop — close to Greek Town and the United Center","Greek Town on Halsted Street, steps east, has been a center of Chicago's Greek-American community since the 1960s"],
  "Thorndale":["Edgewater's Red Line stop — quiet but surrounded by the historic lakefront apartment architecture that defines this stretch of the North Side","Red Line — North Shore zone — between Bryn Mawr and Granville in Edgewater, one of Chicago's earliest lakefront resort neighborhoods"],
  "Argyle":["The 'Little Vietnam' of the North Side — Argyle Street is lined with Vietnamese, Chinese, and Southeast Asian restaurants","Red Line — North Shore zone — opened 1908 between Berwyn and Lawrence in the Rogers Park neighborhood"],
  "Sheridan":["Wrigleyville's quieter neighbor on the Red Line — steps from Boystown and the lakefront parks","Red Line — North zone — a century-old elevated stop above Sheridan Road near the Lakeview corridor"],
  "North/Clybourn":["Gateway to Lincoln Park's retail corridor — where Clybourn and North Avenue meet on the Red Line","Red Line — North zone — the elevated structure descends to grade here; major shopping anchors the Clybourn Corridor"],
  "Clark/Division":["Gold Coast underground — the subway threads beneath Division Street into the city's most exclusive neighborhood","Red Line subway — North zone — steps from the Gold Coast's elegant limestone buildings and Rush Street nightlife"],
  "Lake (Red Line)":["Directly below the elevated State/Lake stop — the Red Line's own Loop underground station at Lake Street","Red Line subway — Loop zone — built 1943 as part of the State Street subway, a separate structure from the elevated Loop"],
  "Monroe (Red Line)":["The Red Line's underground Monroe station on State Street — separate from the Blue Line's Monroe at Dearborn","Red Line subway — Loop zone — one of two Monroe stations in the CTA system, a block apart underground"],
  "47th":["Bronzeville's jazz-era gateway — 47th Street was once called the Stroll, Chicago's great African-American boulevard","Red Line Dan Ryan — South zone — the Dan Ryan branch elevated was built in 1969 through the highway median"],
  "Garfield (Red Line)":["Washington Park stop — Garfield Boulevard (55th Street) is an Olmsted-designed parkway south of the University of Chicago","Red Line Dan Ryan — South zone — not to be confused with the Green Line's Garfield stop to the east"],
  "63rd (Red Line)":["Englewood corridor on the Dan Ryan — a neighborhood working to rebuild through community organizing and investment","Red Line Dan Ryan — South zone — one of the more remote stops on the city's South Side elevated median"],
  "69th":["Auburn Gresham bungalow belt — a quiet Dan Ryan stop in Chicago's historic working-class residential South Side","Red Line Dan Ryan — South zone — the neighborhoods here are quintessential Chicago brick bungalow architecture"],
  "79th":["Auburn Gresham anchor — a major commercial and community hub on the Red Line's southern stretch","Red Line Dan Ryan — South zone — one of the busiest stops on the far South Side Red Line"],
  "87th":["Near the southern edge of the city — Gresham and Roseland begin near this quiet Dan Ryan stop","Red Line Dan Ryan — South zone — one of the last stops before the 95th/Dan Ryan terminus"],
  "Montrose (Blue Line)":["A quiet Northwest Side stop where Milwaukee Avenue narrows into the Irving Park residential neighborhood","Blue Line O'Hare branch — Northwest zone — between Jefferson Park and Irving Park on the Milwaukee elevated"],
  "Irving Park (Blue Line)":["Where Milwaukee Avenue threads through the heart of the Irving Park neighborhood","Blue Line O'Hare branch — Northwest zone — between Jefferson Park and Addison Blue in the residential Northwest"],
  "Division (Blue Line)":["Gateway to Wicker Park and Bucktown — Division Street's famous nightlife is steps from this Blue Line stop","Blue Line — Northwest zone — underground stop where Milwaukee meets Division in one of Chicago's liveliest corridors"],
  "Grand (Blue Line)":["River West and Fulton Market adjacent — the Blue Line's Grand stop at Milwaukee Avenue","Blue Line — North zone — underground stop connecting the emerging West Loop restaurant district to downtown"],
  "Washington (Blue Line)":["The Dearborn subway stop at Washington — beneath Chicago's civic heart and Daley Plaza","Blue Line — Loop zone — the Dearborn subway's Washington station, beneath the plaza with Picasso's famous untitled sculpture"],
  "LaSalle (Blue Line)":["Board of Trade territory — the Blue Line exits the Dearborn subway toward the Congress Expressway here","Blue Line — Loop zone — the Financial District portal, where the Dearborn subway feeds into the Forest Park branch"],
  "Western (Blue Line - Forest Park)":["The Forest Park branch's Western stop at Congress and Western — not the Milwaukee and Western stop","Blue Line Forest Park branch — West zone — a separate physical station from the O'Hare branch's Ukrainian Village Western"],
  "California (Blue Line - Forest Park)":["East Garfield Park on the Blue Line's Congress branch — California Avenue in a neighborhood rebuilding","Blue Line Forest Park branch — West zone — distinct from the O'Hare branch California stop in Humboldt Park"],
  "Kedzie-Homan":["North Lawndale's Blue Line stop — MLK Jr. organized in this neighborhood in 1966 to highlight housing conditions","Blue Line Forest Park branch — West zone — between Pulaski and the Illinois Medical District on the Congress branch"],
  "Pulaski (Blue Line)":["The Blue Line's Congress branch Pulaski stop — Pulaski Road runs through North Lawndale","Blue Line Forest Park branch — West zone — named for the Polish-American Revolutionary War hero Casimir Pulaski"],
  "Cicero (Blue Line)":["Austin neighborhood edge on the Blue Line — Cicero Avenue marks the city's approximate western limit here","Blue Line Forest Park branch — West zone — one stop from Oak Park Avenue on the Eisenhower Expressway branch"],
  "Austin (Blue Line)":["Chicago's largest neighborhood by area — Austin's Blue Line stop on the Congress branch","Blue Line Forest Park branch — West zone — historic boulevards and brick greystones surround this elevated stop"],
  "Oak Park (Blue Line)":["Nearly in Oak Park — the Blue Line's westernmost Chicago stop at Oak Park Avenue","Blue Line Forest Park branch — West zone — Frank Lloyd Wright's home and studio are steps into Oak Park from here"],
  "Rockwell":["Albany Park's Brown Line gem — Rockwell Street in one of Chicago's most linguistically diverse neighborhoods","Brown Line — Northwest zone — between Francisco and Western (Brown) on the northern Brown Line stretch"],
  "Montrose (Brown Line)":["North Center residential stop — Montrose Avenue in Chicago's most family-friendly north side neighborhood","Brown Line — North zone — between Addison and Irving Park (Brown) in the Ravenswood/North Center corridor"],
  "Irving Park (Brown Line)":["Ravenswood's middle stop — Irving Park Road on the Brown Line's scenic northern stretch","Brown Line — North zone — surrounded by brick bungalows and two-flats in the Ravenswood neighborhood"],
  "Addison (Brown Line)":["Ravenswood's Addison — no stadium here, just residential streets and local restaurants in Lakeview","Brown Line — North zone — this Addison is miles from Wrigley Field — the Red Line's Addison gets the Cubs fans"],
  "South Boulevard":["Evanston's southernmost L stop — South Boulevard marks the Purple Line's approach to the Chicago border","Purple Line — North Shore zone — the last Evanston station before Howard; just north of Chicago"],
  "California (Green Line)":["East Garfield Park on the Lake Street elevated — the Green Line's California stop was closed from 1994 to 1996","Green Line — West zone — reopened after a $150 million reconstruction of the historic Lake Street elevated structure"],
  "Kedzie (Green Line)":["Garfield Park at Kedzie — the Green Line runs above a neighborhood anchored by a world-class conservatory","Green Line — West zone — Jens Jensen's Garfield Park Conservatory is steps from this stop on the Lake Street elevated"],
  "Conservatory-Central Park Drive":["Named for the Garfield Park Conservatory — one of the largest botanical conservatories in the Western Hemisphere","Green Line — West zone — the conservatory spans two acres under glass; Jensen designed it in 1906"],
  "Pulaski (Green Line)":["Garfield Park on the Lake Street elevated — a stop central to Chicago's civil rights history","Green Line — West zone — different from the Orange, Pink, and Blue Pulaski stops — this is Lake Street"],
  "Cicero (Green Line)":["Austin neighborhood on the Green Line — Cicero Avenue at Lake Street, near the Oak Park border","Green Line — West zone — separate from the Blue and Pink line Cicero stops; this is the Lake Street elevated"],
  "Austin (Green Line)":["At the Chicago/Oak Park border — Austin Boulevard marks the city line on the Lake Street elevated","Green Line — West zone — distinct from the Blue Line's Austin stop on the Congress branch a few blocks away"],
  "Ridgeland":["A quiet Oak Park border stop on the Green Line's Lake Street elevated","Green Line — West zone — one stop east of the Oak Park terminal; Ridgeland Avenue divides Chicago and the village"],
  "Oak Park (Green Line)":["The Green Line's western terminus — in Oak Park, a suburb with more Frank Lloyd Wright buildings than anywhere on Earth","Green Line — West zone — distinct from the Blue Line's Oak Park stop on the Congress branch; same suburb, different structure"],
  "King Drive":["Bronzeville's great boulevard — Martin Luther King Jr. Drive runs through one of Chicago's richest cultural histories","Green Line — South zone — the elevated threads through historic Bronzeville; the boulevard was renamed in 1968"],
  "Garfield (Green Line)":["Washington Park on the elevated — the Green Line crosses Garfield Boulevard (55th Street) on the South Side","Green Line — South zone — a different physical station from the Red Line's Garfield on the Dan Ryan expressway"],
  "51st":["Woodlawn's northern anchor — the University of Chicago's neighborhood begins just east of this stop","Green Line — South zone — a quiet residential elevated stop between the Garfield and 47th stations"],
  "47th (Green Line)":["Bronzeville's cultural crossroads on the elevated — the Green Line's 47th stop is separate from the Red Line's 47th","Green Line — South zone — connects Kenwood, Hyde Park, and historical Bronzeville along the South Side elevated"],
  "East 63rd-Cottage Grove":["The eastern terminus of the Green Line's south branch — Woodlawn's quiet eastern anchor","Green Line — South zone — one of two Green Line south terminals; the neighborhood here was transformed by the 1893 World's Fair"],
  "Pulaski (Orange Line)":["Archer Heights on the Orange Line — a classic Southwest Side neighborhood with deep Polish and Mexican roots","Orange Line — Southwest zone — distinct from the Blue, Green, and Pink Pulaski stops — this is the Midway branch"],
  "Kedzie (Orange Line)":["Brighton Park on the Orange Line — a gateway neighborhood for successive waves of Chicago immigrants","Orange Line — Southwest zone — this Kedzie serves a different Southwest Side community than the Green or Pink line Kedzie"],
  "Western (Orange Line)":["Back of the Yards border on the Orange Line — Western Avenue through the working-class Southwest Side","Orange Line — Southwest zone — another Western stop, this one on the Midway branch near the old Union Stock Yards"],
  "Ashland (Orange Line)":["McKinley Park on the Orange Line — a tight-knit Southwest Side neighborhood with Polish and Mexican roots","Orange Line — Southwest zone — separate from the Green/Pink Ashland on the Lake Street elevated miles to the north"],
  "Halsted (Orange Line)":["Canaryville on the Orange Line — one of Chicago's smallest and most tightly-knit working-class communities","Orange Line — Southwest zone — distinct from the Green Line's Halsted stop on the South Side elevated"],
  "Cicero (Pink Line)":["Little Village's gateway on the Pink Line — where 26th Street commerce thrives in Chicago's largest Mexican-American neighborhood","Pink Line — West zone — the Pink Line was reconfigured from the old Blue Line Congress branch in 2006"],
  "Pulaski (Pink Line)":["Little Village on the Pink Line — a neighborhood where commercial energy rivals Michigan Avenue in retail sales","Pink Line — West zone — this Pulaski serves a different neighborhood than the Blue, Green, and Orange Pulaski stops"],
  "Kostner":["North/South Lawndale border on the Pink Line — resilient community organizations define this West Side neighborhood","Pink Line — West zone — one of several Pink Line stops through Chicago's historically significant West Side communities"],
  "Central Park (Pink Line)":["South Lawndale stop on the Pink Line — Central Park Avenue in the heart of Chicago's Mexican-American West Side","Pink Line — West zone — the Pink Line opened here in 2006; the old Blue Line Congress branch ran on these tracks"],
  "Kedzie (Pink Line)":["South Lawndale gateway on the Pink Line — Kedzie Avenue where the neighborhood transitions toward Pilsen","Pink Line — West zone — one of four Kedzie stops across the CTA — this is the Pink Line's West Side version"],
  "California (Pink Line)":["Pilsen's California stop — the Pink Line enters one of Chicago's most celebrated mural-covered neighborhoods","Pink Line — West zone — California Avenue in Pilsen is a gateway to the neighborhood's thriving gallery and arts scene"],
  "Western (Pink Line)":["Western Avenue in Pilsen — the Pink Line's Western stop in the vibrant Near West Side Mexican neighborhood","Pink Line — Near West zone — yet another Western stop, this time through Pilsen and the Near West Side corridor"],
  "Damen (Pink Line)":["Pilsen's Damen stop — a neighborhood known for massive outdoor murals and Mexican-American cultural identity","Pink Line — Near West zone — distinct from the Blue Line's Wicker Park Damen stop miles to the north"],
  "18th":["Pilsen's cultural heart — 18th Street is famous for taquerías, galleries, panaderías, and street art","Pink Line — Near West zone — 18th Street is the soul of Pilsen, one of Chicago's most celebrated neighborhoods"],
  "Polk":["Near West Side transition point — Polk Street on the Paulina connector links Pilsen to the UIC corridor","Pink Line — Near West zone — elevated stop between 18th and the shared Green/Pink Ashland station"],
  "35th-Bronzeville-IIT":["Illinois Institute of Technology's Mies van der Rohe campus is steps away — Crown Hall is one of the most influential buildings in American architecture","Green and Red lines — South zone — IIT's modernist campus was designed by Ludwig Mies van der Rohe in the 1940s and is a National Historic Landmark"],
  "35th/Archer":["Brighton Park gateway on the Orange Line — a Southwest Side neighborhood that has welcomed successive waves of Polish, Lithuanian, and Mexican immigrants","Orange Line — Southwest zone — the 35th/Archer intersection is a longtime commercial anchor for Chicago's Southwest Side working-class neighborhoods"],
  "43rd St":["Heart of Bronzeville's jazz and blues legacy — Indiana Avenue and 43rd were part of Chicago's great cultural corridor during the Great Migration","Green Line — South zone — the DuSable Museum of African American History, the oldest such institution in the US, is a short walk near Washington Park"],
  "Armitage":["Lincoln Park's boutique corridor on the Brown Line — one of Chicago's most elegant neighborhood retail streets with antiques, fashion, and brunch spots","Brown Line — North zone — opened 1907; Armitage Avenue runs through Lincoln Park between Halsted and Sheffield, steps from the zoo and the park"],
  "Ashland":["Green and Pink lines converge at this Near West Side stop — gateway to the Tri-Taylor neighborhood and one of the city's most intact historic bungalow blocks","Green and Pink lines — Near West zone — the Paulina Connector links the Green Line's west branch to the Pink Line here via this shared station"],
  "Belmont":["One of the L's busiest triple-transfer stops — Red, Brown, and Purple lines all meet in the heart of Lakeview, steps from the lakefront and Wrigleyville","Red, Brown, Purple lines — North zone — one of the top ten busiest stations on the CTA; bars, restaurants, and shops crowd every block around the platform"],
  "Berwyn":["Edgewater's southern Red Line stop — just south of Argyle's celebrated Little Saigon corridor with Vietnamese restaurants and bakeries","Red Line — North Shore zone — Berwyn serves the Edgewater neighborhood between the lakefront and the Clark Street commercial strip"],
  "Bryn Mawr":["The Bryn Mawr Historic District of Edgewater features some of the finest terra cotta commercial architecture from the early 1900s in all of Chicago","Red Line — North Shore zone — opened 1908; Bryn Mawr Avenue is Edgewater's main commercial artery, running from the lakefront to the elevated"],
  "California":["Humboldt Park and Ukrainian Village share this Blue Line stop — home to Chicago's Puerto Rican community and the iconic Paseo Boricua steel flags on Division Street","Blue Line — Northwest zone — the two massive steel Puerto Rican flags erected in 1995 are the symbolic gateway to Paseo Boricua, a half-mile-long cultural corridor"],
  "Central":["Purple Line residential stop in central Evanston — quiet tree-lined blocks near the Chicago border, a calmer world than the Davis Street bustle","Purple Line — North Shore zone — Central Street station serves a well-established Evanston neighborhood with cafes, community gardens, and bungalow blocks"],
  "Cermak-Chinatown":["Chicago's Chinatown gateway — one of the most vibrant Chinese-American communities in the Midwest, anchored by the Chinatown Gate and Wentworth Avenue restaurants","Red Line — South zone — the station opened 1969 and sits just north of the iconic Chinatown Gate; the neighborhood draws millions of visitors to its restaurants, shops, and cultural events"],
  "Cermak-McCormick Place":["The largest convention center in North America is right outside — McCormick Place spans 2.6 million square feet of exhibit halls and meeting rooms","Green Line — South zone — opened 2015 as one of the system's newest stations, built specifically to serve the massive McCormick Place complex on Lake Shore Drive"],
  "Chicago":["Near North Side hub where Brown, Purple, and Red all converge — the Chicago Avenue corridor links River North, Gold Coast, and Old Town in a single stride","Brown, Purple, Red lines — Near North zone — the underground Red Line station at State/Chicago and the elevated Brown/Purple station at Clark/Chicago are two separate buildings a block apart"],
  "Cottage Grove":["Woodlawn's Green Line stop on the south branch — the neighborhood borders the University of Chicago's east campus and Washington Park","Green Line — South zone — the south Green Line branch runs through Bronzeville and Woodlawn; Cottage Grove is one stop west of the East 63rd-Cottage Grove terminal"],
  "Cumberland":["Blue Line's last major park-and-ride before O'Hare — suburban commuters fill this lot daily, swapping cars for the express run downtown","Blue Line — Northwest zone — Cumberland sits just inside the city limit; the adjacent Rosemont entertainment district hosts concerts and sporting events year-round"],
  "Damen":["The Wicker Park epicenter on the Blue Line — the Damen/Milwaukee/North six-point intersection is Chicago's most energized nightlife and independent retail corridor","Blue Line — Northwest zone — the Wicker Park and Bucktown neighborhoods cluster around this intersection; the area's arts and music scene peaked in the 1990s and never really left"],
  "Dempster":["Evanston's arts corridor on the Purple Line — near the Evanston Art Center and the community gallery network that gives this suburb a small-arts-city feel","Purple Line — North Shore zone — Dempster is one of the calmer Evanston stops, serving a residential stretch between the Davis Street bustle and the northern neighborhoods"],
  "Diversey":["Lincoln Park's main east-west artery crosses the Brown Line here — Diversey Avenue leads east to the lakefront harbor, one of Chicago's most scenic marina spots","Brown Line — North zone — Diversey Harbor is a beautiful Lake Michigan marina steps from the stop; the Brown Line elevated has been a neighborhood fixture since 1900"],
  "Forest Park":["The western end of the Blue Line — in Forest Park, a western suburb where the Eisenhower Expressway ends and the L turns around","Blue Line terminus — West zone — Forest Park is the turnaround for Blue Line trains on the Congress branch; the suburb is known for its historic cemeteries including Forest Home/Waldheim"],
  "Foster":["Quiet Evanston residential stop on the Purple Line — between the Rogers Park border and the central Evanston neighborhood, serving well-kept bungalow blocks","Purple Line — North Shore zone — Foster station is a calm, local stop serving Evanston residents near the Chicago city line, with easy access to lakefront parks"],
  "Fullerton":["Lincoln Park's triple-transfer hub — Red, Brown, and Purple all stop here near DePaul University's main campus, the Lincoln Park Zoo, and the park conservatory","Red, Brown, Purple lines — North zone — DePaul's Lincoln Park campus is steps away; the Lincoln Park Zoo is the most-visited free zoo in the United States"],
  "Grand/State":["Beneath the Magnificent Mile on the Red Line subway — shoppers, hotel guests, and tourists pour through this stop year-round on Chicago's premier luxury corridor","Red Line subway — Near North zone — built 1943 as part of the State Street subway; the Mag Mile one block east runs from the Chicago River to Oak Street Beach"],
  "Granville":["Rogers Park's southern edge on the Red Line — where Loyola University students and neighborhood regulars share a busy elevated platform","Red Line — North Shore zone — Granville station is close to Loyola's academic buildings and stretches of Rogers Park's independent restaurants and coffee shops"],
  "Halsted":["Green Line south branch stop at Halsted Street — serving the Washington Park and Englewood neighborhoods on the historic South Side elevated","Green Line — South zone — Halsted Street runs 33 miles through Chicago; this stop anchors the Green Line's south branch through the Englewood corridor"],
  "Harlem":["Blue Line's last Chicago stop before the O'Hare highway run — at Harlem Avenue near the city's northwest edge in the Norwood Park bungalow belt","Blue Line — Northwest zone — Harlem station is one of the final stops before the Blue Line joins the Kennedy Expressway median for the express airport run"],
  "Harlem/Lake":["Western terminus of the Green Line — the end of the Lake Street elevated in Oak Park territory, where Harlem Avenue marks the city-suburb boundary","Green Line terminus — West zone — Harlem/Lake sits at Harlem Avenue and Lake Street, the transition point between Chicago's Austin neighborhood and the Oak Park suburb"],
  "Illinois Medical District":["The largest medical district in the United States by area — Rush, UIC, and Cook County hospitals all cluster in 560 acres of facilities around this Blue Line stop","Blue Line — Near West zone — the Illinois Medical District was established in 1941 and today employs over 40,000 people; it is among the busiest stations for healthcare workers in the CTA system"],
  "Indiana":["Bronzeville's Indiana Avenue stop on the south Green Line elevated — a neighborhood shaped by the Great Migration and Chicago's jazz and blues heritage","Green Line — South zone — Indiana Avenue runs through the heart of Bronzeville, one of Chicago's most historically significant African-American communities"],
  "Jackson":["Blue and Red Lines both have a Jackson station — two separate underground stops at the same intersection, one at Dearborn Street and one at State Street","Blue and Red lines — Loop zone — these are distinct subway stations built in different decades; Blue Line Jackson is on Dearborn, Red Line Jackson is on State Street"],
  "Jarvis":["Rogers Park near the Jarvis beach access — one of the city's quietest lakefront neighborhoods, just two stops south of the Howard terminal","Red Line — North Shore zone — Jarvis is the second-to-last Red Line stop heading north; Rogers Park is Chicago's most ethnically diverse neighborhood with over 80 languages spoken"],
  "Jefferson Park":["The Northwest Side's major transit hub — Blue Line, Metra Northwest Line, and dozens of bus routes converge here for the entire northwest quadrant of the city","Blue Line — Northwest zone — Jefferson Park is the de facto transit center for Chicago's northwest neighborhoods and nearby suburbs, serving both rapid transit and commuter rail"],
  "Lawrence":["Uptown's second Red Line stop — near the Aragon Ballroom and the legendary Green Mill jazz club, in continuous operation since 1907","Red Line — North Shore zone — the Green Mill at Lawrence and Broadway has been open since 1907; Al Capone reportedly kept a reserved booth and the club had a hidden underground escape tunnel"],
  "Logan Square":["The most Chicago-coded neighborhood on the Blue Line — landmark boulevards, vintage greystones, and a booming bar and restaurant scene define the Northwest Side","Blue Line — Northwest zone — the 1918 Illinois Centennial Monument anchors Logan Square at the intersection of Milwaukee, Kedzie, and Logan Blvd; a designated Chicago Landmark"],
  "Loyola":["Loyola University Chicago's lakefront campus is steps away — one of the largest Jesuit universities in the US, with buildings stretching to the lakeshore in Rogers Park","Red Line — North Shore zone — Loyola was founded in 1870; its Rogers Park campus stretches to Lake Michigan, anchoring the far north Red Line with a large daily student ridership"],
  "Main":["Purple Line stop at the heart of Evanston's Main Street corridor — a classic suburban downtown commercial strip just south of the university neighborhood","Purple Line — North Shore zone — Main station is one of the older Evanston elevated stops, serving a mixed residential and commercial block between Davis and Dempster"],
  "Morse":["Rogers Park's creative hub on the Red Line — Morse Avenue is home to theaters, galleries, music venues, and coffee shops in Chicago's most diverse neighborhood","Red Line — North Shore zone — Rogers Park's arts scene clusters around Morse; the Lifeline Theatre and other community venues have anchored this corridor for decades"],
  "Noyes":["Closest CTA L stop to Northwestern University's main Evanston campus — students use this more than any other Evanston station","Purple Line — North Shore zone — Northwestern was founded in 1851 and is one of the nation's top research universities; its lakefront Evanston campus sits steps from this platform"],
  "Paulina":["Brown Line's Wrigleyville stop — Paulina sits just blocks from Wrigley Field, one of baseball's most beloved and most-visited ballparks","Brown Line — North zone — Wrigley Field opened in 1914 and is the second-oldest ballpark in Major League Baseball; on game days the Paulina and Addison platforms fill to capacity"],
  "Roosevelt":["Red, Green, and Orange lines converge at Roosevelt — the south end of the Loop and the gateway to Museum Campus, Chinatown, and the lakefront parks","Red, Green, Orange lines — South Loop zone — the Field Museum, Shedd Aquarium, and Adler Planetarium are a short walk east along the lakefront from this major transfer hub"],
  "Rosemont":["Blue Line stop just before O'Hare — near Allstate Arena, where concerts and sporting events can send 18,000 fans flooding onto the platform","Blue Line — Northwest zone — the Rosemont entertainment district clusters hotels, convention space, and the arena near the airport corridor; a park-and-ride hub for Northwest suburban commuters"],
  "Sedgwick":["Old Town on the Brown Line — Sedgwick is the gateway to one of Chicago's most storied neighborhoods and its legendary comedy scene","Brown Line — North zone — Second City, the comedy club that launched Bill Murray, Tina Fey, Stephen Colbert, and dozens more, is steps from Sedgwick station on North Wells Street"],
  "Skokie":["The Yellow Line's destination — Skokie's downtown transit hub at the end of the Skokie Swift, one of the shortest and fastest runs in the CTA system","Yellow Line terminus — North Shore zone — the Skokie Swift runs direct from Howard to Skokie in under 10 minutes; Skokie is also home to the Illinois Holocaust Museum and Education Center"],
  "Southport":["Brown Line's Wrigleyville anchor — Southport Avenue between Belmont and Addison is one of Chicago's liveliest neighborhood dining and bar strips","Brown Line — North zone — the Southport corridor fills on Cubs game days; the Music Box Theatre, a 1929 movie palace, hosts independent films on Southport year-round"],
  "State/Lake":["Five elevated lines stop here in the heart of the Loop — one of the system's busiest platforms, directly above the State Street pedestrian shopping corridor","Brown, Green, Orange, Pink, Purple lines — Loop zone — the State and Lake elevated structure is one of the oldest sections of the elevated Loop, in continuous operation since 1897"],
  "UIC-Halsted":["Gateway to the University of Illinois at Chicago and the Halsted Street corridor — Greek Town is steps east on Adams Street","Blue Line — Near West zone — UIC is Illinois' largest university by enrollment with over 34,000 students; Greek Town on Halsted has been Chicago's Greek-American center since the 1960s"],
  "Wellington":["Brown Line through the heart of Lakeview — Wellington Avenue cuts through a neighborhood of vintage apartments, tree-lined blocks, and local restaurants","Brown Line — North zone — Wellington sits between Belmont and Diversey on one of the Brown Line's most lived-in stretches in Lakeview"],
  "Western":["Blue Line Western in Ukrainian Village — Western Avenue here is lined with century-old brick two-flats and the churches and cultural institutions of Chicago's Ukrainian community","Blue Line — Northwest zone — Ukrainian Village is one of Chicago's most intact ethnic enclaves; St. Volodymyr Ukrainian Orthodox Cathedral and the Ukrainian Institute of Modern Art are both nearby"],
  "Wilson":["Uptown's fully rebuilt gateway station — Wilson reopened in 2018 after a ground-up reconstruction, transforming one of the most deteriorated stations in the system","Red and Purple lines — North Shore zone — the Wilson reconstruction cost over $200 million and took nearly a decade; it is now one of the system's showcase stations and an anchor for the Uptown neighborhood"],
  "Laramie":["Green Line stop in Austin — between the Oak Park border and the Cicero Avenue corridor on the historic Lake Street elevated","Green Line — West zone — Laramie Avenue runs through Austin, Chicago's largest neighborhood by area; the surrounding community developed around the 1895 Lake Street elevated"],
  "Oakton-Skokie":["The Yellow Line's only intermediate stop — Oakton-Skokie serves the busy Oakton Street commercial corridor in central Skokie","Yellow Line — North Shore zone — Oakton-Skokie was added to give mid-line access between Howard and the Dempster-Skokie terminus on the short Skokie Swift run"],
};
const CHI_RAW:any[]=[
  ["O'Hare",["Blue"],"Northwest",4,1984,"Western terminus of the Blue Line — direct access to O'Hare International Airport","O'Hare handled over 50 million passengers in 2023 — one of the world's busiest airports since the 1960s."],
  ["Midway",["Orange"],"Southwest",4,1993,"Southern terminus of the Orange Line — gateway to Midway Airport","The Orange Line was purpose-built to serve Midway Airport when it opened in 1993."],
  ["Howard",["Red","Purple","Yellow"],"North Shore",4,1908,"The northern transit hub — Red, Purple, and Yellow Lines all connect here","Howard station's significance grew in 1908 when the North Side elevated line extended to this point."],
  ["95th/Dan Ryan",["Red"],"South",3,1969,"Southern terminus of the Red Line — serving Roseland and Rosemoor","The Dan Ryan branch opened in 1969, extending the Red Line deep into the South Side."],
  ["Clark/Lake",["Blue","Brown","Green","Orange","Pink","Purple"],"Loop",5,1895,"Most connected station in the Loop — 6 lines converge here","Clark/Lake sits at the corner of the original Union Loop elevated and the major trunk lines."],
  ["Washington/Wabash",["Brown","Green","Orange","Pink","Purple"],"Loop",5,1897,"Iconic Loop elevated station — views of the Chicago skyline from the platform","This station was rebuilt as a new consolidated Loop platform serving 5 lines — completed in 2017."],
  ["Merchandise Mart",["Brown","Purple"],"North",3,1900,"Above the legendary Merchandise Mart — once the world's largest building","The Mart was so large it had its own ZIP code from 1930 until 2008."],
  ["Belmont",["Red","Brown","Purple"],"North",4,1907,"Major Lakeview transfer hub — Red, Brown, and Purple lines stop here","Belmont is the gateway to Wrigleyville and Lincoln Park — among the system's busiest non-downtown stops."],
  ["Fullerton",["Red","Brown","Purple"],"North",4,1900,"DePaul University campus is steps from this Lincoln Park station","DePaul, the largest Catholic university in the US, essentially grew around the L stop at Fullerton."],
  ["Kimball",["Brown"],"Northwest",2,1907,"Northern terminus of the Brown Line in Albany Park","The Brown Line terminus gives access to Albany Park's incredible diversity of restaurants and neighborhoods."],
  ["Linden",["Purple"],"North Shore",2,1908,"Northern terminus of the Purple Line in Wilmette, IL","A 5-minute walk from Linden takes you to the stunning Baha'i House of Worship, open to all faiths."],
  ["54th/Cermak",["Pink"],"West",2,2006,"Western terminus of the Pink Line — gateway to Little Village and Pilsen","Little Village is known as Chicago's 'Mexico of the Midwest' — 26th Street rivals the Magnificent Mile in retail."],
  ["Addison",["Red"],"North",4,1900,"Steps from Wrigley Field — the most iconic ballpark station in American sports","On Cubs game days, Addison processes tens of thousands of fans — the original Wrigley Field opened in 1914."],
  ["Roosevelt",["Red","Orange","Green"],"South",3,1892,"South Loop hub with access to Museum Campus and the lakefront","The Field Museum, Shedd Aquarium, and Adler Planetarium are all steps from this station."],
  ["Cermak-Chinatown",["Red"],"South",3,1892,"Serving Chicago's Chinatown — one of the most vibrant in the Midwest","Chicago's Chinatown in Bridgeport has been a center of Chinese-American culture since the 1870s."],
  ["Forest Park",["Blue"],"West",2,1979,"Western terminus of the Blue Line — near historic Forest Park suburb","Forest Park is home to one of the largest cemetery complexes in the US — historic and peaceful."],
  ["Harlem/Lake",["Green"],"West",2,1895,"Western terminus of the Green Line — at Harlem Avenue","Oak Park (Frank Lloyd Wright's hometown) is just steps away from this terminus."],
  ["Cottage Grove",["Green"],"South",2,1892,"Eastern southern terminus of the Green Line — Woodlawn and South Shore","The Woodlawn neighborhood's revival along 63rd Street is one of Chicago's most discussed urban developments."],
  ["Skokie",["Yellow"],"North Shore",1,1925,"Terminus of the Yellow Line (Skokie Swift) — only 5 miles long","The Skokie Swift is one of the shortest L lines — but critically important for Skokie commuters."],
  ["Grand/State",["Red"],"North",3,1943,"Near the Magnificent Mile and Navy Pier — tourist and commuter hub","The stretch of Michigan Avenue near here is one of the most expensive retail corridors in the US."],
  ["Jackson",["Blue","Red"],"Loop",4,1897,"Loop hub beneath the Chicago Cultural Center and Grant Park","The underground Blue Line station at Jackson was built in 1951 — one of the first subway sections in Chicago."],
  ["Damen",["Blue"],"Northwest",3,1997,"Wicker Park / Ukrainian Village stop — the heart of Chicago's indie scene","Wicker Park's Six Corners has been Chicago's alternative culture capital since the 1990s."],
  ["35th-Bronzeville-IIT",["Green"],"South",2,1892,"South Side heritage — heart of the historic Bronzeville neighborhood","Bronzeville was the center of the Great Migration's cultural explosion — jazz and blues flourished here."],
  ["Loyola",["Red"],"North Shore",3,1908,"Serving Loyola University Chicago — North Shore academic hub","Loyola's lakefront campus is steps from the Red Line — students ride the L to class daily."],
  ["State/Lake",["Brown","Green","Orange","Pink","Purple"],"Loop",4,1897,"Another major Loop transfer — serves the State Street shopping corridor","The State/Lake station sits above Daley Plaza and the famous Picasso sculpture in the civic heart of Chicago."],
  ["Wilson",["Red","Purple"],"North Shore",3,1900,"Major Uptown transfer hub — Red and Purple share a rebuilt station","Wilson station reopened in 2018 after a full rebuild — a modern gateway to Uptown's music venues and cafes."],
  ["Lawrence",["Red"],"North Shore",3,1900,"Uptown's second anchor — near the Aragon and Green Mill","The Green Mill jazz club near Lawrence has been open since 1907 — Al Capone had a booth."],
  ["Berwyn",["Red"],"North Shore",2,1908,"Andersonville adjacent — Edgewater neighborhood stop","Andersonville is one of Chicago's most beloved dining neighborhoods — known for its Swedish heritage."],
  ["Bryn Mawr",["Red"],"North Shore",3,1908,"Edgewater stop — near Loyola University and the lakefront","The Bryn Mawr Historic District features some of Chicago's finest terra cotta commercial architecture."],
  ["Thorndale",["Red"],"North Shore",2,1908,"Edgewater neighborhood Red Line stop — between Bryn Mawr and Granville","Edgewater was a prestigious lakefront resort community in the early 1900s — its grandiose apartment buildings and terra cotta commercial storefronts reflect that era."],
  ["Granville",["Red"],"North Shore",2,1908,"Rogers Park border — Loyola University's southern edge","Rogers Park is one of Chicago's most diverse neighborhoods — over 80 languages spoken in the area."],
  ["Morse",["Red"],"North Shore",2,1908,"Rogers Park arts hub — live music venues and coffee shops","The Morse Avenue strip is a hub for Rogers Park's thriving arts and music scene."],
  ["Jarvis",["Red"],"North Shore",2,1908,"Northern Rogers Park — a quieter residential stop","Jarvis is steps from the lakefront parks that define Chicago's north side character."],
  ["Rosemont",["Blue"],"Northwest",3,1984,"Penultimate Blue Line stop before O'Hare — near Allstate Arena","Rosemont hosts major concerts and sporting events at the Allstate Arena."],
  ["Jefferson Park",["Blue"],"Northwest",3,1970,"Northwest Side hub — Blue Line and Metra connections","Jefferson Park is a major transit center for the Northwest Side — bus routes from the suburbs converge here."],
  ["Logan Square",["Blue"],"Northwest",3,1895,"One of Chicago's most vibrant neighborhoods — tree-lined boulevards and indie restaurants","Logan Square's boulevard system was designated a Chicago Landmark in 2005 — grand greenswards and historic mansions."],
  ["California",["Blue"],"Northwest",2,1895,"Humboldt Park / Ukrainian Village stop on the Blue Line","Humboldt Park is the center of Chicago's Puerto Rican community — the paseo has two iconic steel flags."],
  ["Western",["Blue"],"Northwest",3,1895,"Ukrainian Village and Wicker Park border — a classic Blue Line stop","The Ukrainian Village is one of Chicago's best-preserved historic districts — beautiful brick two-flats."],
  ["Illinois Medical District",["Blue"],"Near West",2,1958,"Serving the largest medical district in the US by area","The Illinois Medical District covers 560 acres — Rush, UIC, and Cook County hospitals all cluster here."],
  ["UIC-Halsted",["Blue"],"Near West",3,1958,"University of Illinois at Chicago campus station","UIC is one of the largest universities in the US by enrollment — over 34,000 students."],
  ["Paulina",["Brown"],"North",3,1907,"Southport Corridor stop — one of the Brown Line's liveliest areas","The Southport Corridor is packed with boutiques, restaurants, and the Music Box Theatre."],
  ["Southport",["Brown"],"North",3,1907,"Lakeview's most charming stop — Wrigleyville border","Southport Avenue is known for its neighborhood feel, indie shops, and proximity to Wrigley Field."],
  ["Wellington",["Brown","Purple"],"North",3,1907,"Lakeview residential stop — Lincoln Park border","Wellington is steps from Lincoln Park's restaurants and the DePaul University neighborhood."],
  ["Diversey",["Brown","Purple"],"North",3,1900,"Lincoln Park stop — near Diversey Harbor","Diversey Harbor is a beautiful marina on Lake Michigan — one of Chicago's hidden gems."],
  ["Armitage",["Brown","Purple"],"North",3,1900,"Lincoln Park's shopping strip — antiques, boutiques, and brunch","Armitage Avenue is one of Chicago's premier boutique shopping streets."],
  ["Sedgwick",["Brown","Purple"],"North",3,1900,"Old Town stop — near Second City comedy club","Second City, steps from Sedgwick, launched the careers of Bill Murray, Tina Fey, and countless others."],
  ["Chicago",["Brown","Purple","Red"],"Near North",4,1900,"Near North Side hub — Red, Brown, and Purple all stop near Division Street","The Chicago Avenue corridor connects River North, Gold Coast, and Old Town in one sweep."],
  ["Cermak-McCormick Place",["Green"],"South",2,2015,"One of the system's newest stations — opened in 2015 for McCormick Place","McCormick Place is the largest convention center in North America — 2.6 million square feet."],
  ["Indiana",["Green"],"South",2,1892,"Bronzeville stop on the Green Line — historic jazz corridor","Indiana Avenue was once lined with jazz and blues clubs during the Great Migration era."],
  ["43rd St",["Green"],"South",2,1892,"Washington Park / Bronzeville — near the DuSable Museum","The DuSable Museum of African American History, founded in 1961, is the oldest such institution in the US."],
  ["Halsted",["Green"],"South",2,1892,"Englewood border stop on the Green Line's south branch","Halsted Street is one of Chicago's longest streets, running 33 miles through the city."],
  ["Ashland",["Green","Pink"],"Near West",3,1895,"Shared Green/Pink stop near Tri-Taylor neighborhood","The Tri-Taylor neighborhood is one of Chicago's most historic — classic Chicago bungalows line the streets."],
  // Red Line stations missing from original data
  ["Sox-35th",["Red"],"South",3,1969,"Red Line stop for Guaranteed Rate Field — home of the Chicago White Sox","The station was renamed from '35th Street' to 'Sox-35th' when the White Sox moved to the new Comiskey Park in 1991."],
  ["Harrison",["Red"],"South Loop",3,1943,"South Loop Red Line stop — gateway to Printer's Row and the University Center","Harrison Street marks a key boundary in Chicago's South Loop — named after President William Henry Harrison."],
  // Blue Line stations with names duplicated on other lines
  ["Belmont (Blue Line)",["Blue"],"Northwest",3,1895,"Blue Line Belmont in Logan Square — a different station from the Lakeview Belmont","The Blue Line Belmont is deep in Logan Square, serving the Avondale border — not to be confused with the Red/Brown/Purple Belmont by Wrigleyville."],
  ["Chicago (Blue Line)",["Blue"],"Near West",2,1958,"Blue Line stop at Chicago Avenue — River West and Ukrainian Village","This Chicago Ave station on the Blue Line sits in River West — a completely separate building from the Red/Brown/Purple Chicago stop in Old Town."],
  ["Addison (Blue Line)",["Blue"],"Northwest",3,1895,"Blue Line Addison in Logan Square — not the Wrigley Field stop","The Blue Line Addison is surrounded by Logan Square's bungalows and apartment buildings — no baseball stadium in sight."],
  // Brown Line stations with names duplicated on other lines
  ["Western (Brown Line)",["Brown"],"North",3,1907,"Brown Line Western — Lincoln Square stop, the heart of Chicago's German-American neighborhood","Lincoln Square's Western station is steps from the Old Town School of Folk Music and a thriving German-heritage dining strip."],
  ["Damen (Brown Line)",["Brown"],"North",3,1907,"Brown Line Damen — Lakeview stop, near Southport Corridor","The Brown Line Damen serves a lively stretch of Lakeview, just south of Wrigleyville and steps from the Southport dining corridor."],
  // Brown Line station missing entirely
  ["Francisco",["Brown"],"Northwest",2,1907,"Brown Line Francisco — Albany Park neighborhood","Francisco is a quiet residential stop deep in Albany Park, one of Chicago's most diverse immigrant communities."],
  ["Kedzie (Brown Line)",["Brown"],"Northwest",2,1907,"Brown Line stop at Kedzie Avenue — Albany Park neighborhood","Kedzie Avenue is one of Albany Park's main commercial corridors — a dense mix of Korean, Mexican, and Middle Eastern businesses reflecting the neighborhood's remarkable diversity."],
  // Loop stations missing
  ["Harold Washington Library",["Brown","Orange","Pink"],"Loop",4,1897,"Loop station at State & Van Buren — Brown, Orange, and Pink lines stop here","Named in 1994 for Harold Washington, Chicago's first Black mayor, who served from 1983 until his sudden death in office in 1987."],
  ["LaSalle/Van Buren",["Brown","Orange","Pink","Purple"],"Loop",4,1897,"Southwest Loop elevated station — all four branch lines converge here","LaSalle Street has been Chicago's financial spine since the 19th century — the Chicago Board of Trade's Art Deco tower stands at the end of the block."],
  ["Quincy/Wells",["Brown","Orange","Pink","Purple"],"Loop",3,1897,"Historic 1897 Loop station — iron columns and brick station house virtually unchanged","The Quincy/Wells elevated structure appeared in 'The Dark Knight' — one of the most-filmed spots on the Chicago L."],
  ["Adams/Wabash",["Brown","Green","Orange","Pink","Purple"],"Loop",4,1897,"Five lines meet on the Wabash elevated — a fully rebuilt open-air platform since 2017","The Wabash Avenue 'canyon' runs through the shadows of downtown towers — one of Chicago's most iconic and most-photographed urban views."],
  // Blue Line Loop missing
  ["Monroe",["Blue"],"Loop",3,1951,"Underground Blue Line stop in the heart of the Loop — between Jackson and Washington","The Blue Line subway section through the Loop was built in 1951, replacing older surface routing as part of Chicago's postwar transit expansion."],
  // Blue Line Northwest missing
  ["Cumberland",["Blue"],"Northwest",2,1984,"Blue Line stop near the O'Hare corridor — Rosemont border","Cumberland is steps from Rosemont's entertainment district — concerts, sporting events, and convention facilities cluster here."],
  ["Harlem",["Blue"],"Northwest",2,1984,"Blue Line Norwood Park stop at Harlem Avenue — near the city's northwest edge","Norwood Park is one of Chicago's most cohesive bungalow belts — the neighborhood retains a distinctly suburban character despite being in city limits."],
  // Purple Line Evanston completions
  ["Davis",["Purple"],"North Shore",3,1908,"The beating heart of downtown Evanston — busiest Purple Line station","Davis Street is a vibrant transit-oriented downtown surrounded by Northwestern University hangouts, indie bookstores, and celebrated restaurants."],
  ["Main",["Purple"],"North Shore",2,1908,"Purple Line stop at Main Street in Evanston — between the university and the quiet north","Main Street station serves a mixed residential-commercial Evanston neighborhood near the city's southern edge."],
  ["Dempster",["Purple"],"North Shore",2,1908,"Evanston's arts corridor Purple Line stop — near the Evanston Art Center","Dempster is one of several Evanston stations that gives the Purple Line its neighborhood feel — walkable, tree-lined, and far from the city's rush."],
  ["Foster",["Purple"],"North Shore",2,1908,"Quiet Evanston residential stop on the Purple Line","Foster serves a well-kept Evanston neighborhood bordering Rogers Park — short walks to lakefront parks and the Chicago border."],
  ["Noyes",["Purple"],"North Shore",2,1908,"Steps from Northwestern University's main Evanston campus","Noyes is the closest L stop to Northwestern's lakefront campus — one of the most respected research universities in the country."],
  ["Central",["Purple"],"North Shore",2,1908,"Purple Line stop in central Evanston — residential neighborhood bordering Rogers Park","Central Street connects Evanston's quiet bungalow neighborhoods to the city — a corridor of cafes, hardware stores, and community gardens."],
  // Green/Pink Near West completions
  ["Clinton",["Green","Pink"],"Near West",3,1895,"Green and Pink lines share this Near West Side stop — gateway to Greek Town","Greek Town on Halsted Street, a few blocks east, has been a center of Chicago's Greek-American community since the 1960s."],
  ["Morgan",["Green","Pink"],"Near West",3,2012,"The newest full L station — opened in 2012, the first new stop since 1993","Morgan's opening directly triggered the West Loop restaurant boom — it is widely credited with turning the neighborhood into Chicago's premier dining destination."],
  // Orange Line Southwest missing
  ["35th/Archer",["Orange"],"Southwest",2,1993,"Orange Line stop in the Brighton Park / Archer Heights corridor","Brighton Park and Archer Heights are working-class Southwest Side neighborhoods with deep Polish and Mexican-American roots."],
  // ── RED LINE NORTH SIDE GAPS ──────────────────────────────────────────────
  ["Argyle",["Red"],"North Shore",2,1908,"Red Line stop in Rogers Park — between Berwyn and Lawrence on the North Side","Argyle Street is nicknamed 'Little Vietnam' — Vietnamese, Chinese, and Southeast Asian restaurants line this stretch of the North Side."],
  ["Sheridan",["Red"],"North",2,1900,"Red Line elevated stop in Wrigleyville and Lakeview — near Boystown and the lakefront","Sheridan Road runs along the Chicago lakefront, passing through some of the city's most elegant historic neighborhoods."],
  ["North/Clybourn",["Red"],"North",3,1900,"Red Line stop at the gateway to Lincoln Park's retail corridor — Clybourn and North Avenue","The Clybourn Corridor is one of Chicago's most active retail strips — it helped anchor the redevelopment of the Near North Side."],
  ["Clark/Division",["Red"],"North",3,1943,"Underground Red Line stop in the Gold Coast — serves Division Street and Rush Street nightlife","The Gold Coast is one of Chicago's wealthiest neighborhoods — its landmark limestone buildings and lakefront mansions date to the Gilded Age."],
  // ── RED LINE LOOP (STATE STREET SUBWAY) ──────────────────────────────────
  ["Lake (Red Line)",["Red"],"Loop",4,1943,"Red Line underground station at State and Lake — separate structure from the elevated State/Lake stop","The State Street subway was a wartime infrastructure achievement completed in 1943 — the underground Red Line parallels the elevated Loop structure above."],
  ["Monroe (Red Line)",["Red"],"Loop",3,1943,"Red Line underground station at State and Monroe — separate from the Blue Line's Monroe at Dearborn","The CTA has two distinct Monroe stations: this one on State Street for the Red Line, and another at Dearborn Street for the Blue Line's Dearborn subway."],
  // ── RED LINE SOUTH SIDE (DAN RYAN BRANCH) ────────────────────────────────
  ["47th",["Red"],"South",2,1969,"Red Line Dan Ryan stop at 47th Street in Bronzeville","47th Street was once known as 'the Stroll' — Chicago's great African-American entertainment boulevard during the Jazz Age and Great Migration era."],
  ["Garfield (Red Line)",["Red"],"South",2,1969,"Red Line Dan Ryan stop at Garfield Boulevard (55th–58th Street) — Washington Park area","Washington Park was designed by Frederick Law Olmsted — its lagoons and meadows form a cultural hub near the University of Chicago."],
  ["63rd (Red Line)",["Red"],"South",1,1969,"Red Line Dan Ryan stop at 63rd Street in Englewood","Englewood's 63rd Street was once one of Chicago's busiest commercial corridors — the community is leading a sustained effort to revitalize the area."],
  ["69th",["Red"],"South",1,1969,"Red Line Dan Ryan stop at 69th Street — Auburn Gresham residential neighborhood","The Auburn Gresham neighborhood around 69th Street is part of Chicago's classic South Side bungalow belt — solid brick homes built for industrial workers."],
  ["79th",["Red"],"South",1,1969,"Red Line Dan Ryan stop at 79th Street — a commercial hub in Auburn Gresham","79th Street is one of the South Side's busiest commercial strips — anchoring a neighborhood with deep community organizations and local retail."],
  ["87th",["Red"],"South",1,1969,"Red Line Dan Ryan stop near Gresham and Roseland — near Marquette Park","Marquette Park is named for the French Jesuit missionary Jacques Marquette, who explored the Chicago region in 1673 — one of the city's larger South Side parks."],
  // ── BLUE LINE O'HARE BRANCH GAPS ────────────────────────────────────────
  ["Montrose (Blue Line)",["Blue"],"Northwest",2,1895,"Blue Line O'Hare branch stop at Montrose and Milwaukee — Irving Park neighborhood","Montrose Avenue crosses much of Chicago's Northwest Side — this Blue Line stop serves quiet residential streets west of the river."],
  ["Irving Park (Blue Line)",["Blue"],"Northwest",2,1895,"Blue Line O'Hare branch stop at Irving Park Road — between Jefferson Park and Addison Blue","Irving Park Road is one of Chicago's main Northwest Side arteries — this corridor mixes brick two-flats, bungalows, and local businesses."],
  ["Division (Blue Line)",["Blue"],"Northwest",3,1895,"Blue Line stop at Division and Milwaukee — gateway to Wicker Park and Bucktown nightlife","Division Street through Wicker Park and Bucktown is one of Chicago's liveliest corridors — bars, restaurants, and boutiques line the avenue."],
  ["Grand (Blue Line)",["Blue"],"North",3,1951,"Blue Line underground stop at Grand Avenue — River West neighborhood near the Fulton Market District","Grand Avenue in River West connects to the booming Fulton Market restaurant district — one of Chicago's most transformed neighborhoods."],
  // ── BLUE LINE DEARBORN SUBWAY ────────────────────────────────────────────
  ["Washington (Blue Line)",["Blue"],"Loop",4,1951,"Blue Line underground stop at Washington and Dearborn — beneath the Richard J. Daley Center and Picasso sculpture","The Dearborn subway carries Blue Line trains beneath the Loop's Financial District — the Picasso sculpture stands in Daley Plaza directly above."],
  ["LaSalle (Blue Line)",["Blue"],"Loop",3,1951,"Blue Line stop at LaSalle and Congress — exits toward the Forest Park branch","LaSalle Street is Chicago's financial corridor — the Chicago Board of Trade's Art Deco tower has stood at the south end since 1930."],
  // ── BLUE LINE FOREST PARK (CONGRESS) BRANCH ─────────────────────────────
  ["Western (Blue Line - Forest Park)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at Western and Congress — East Garfield Park","This Western station is on the Congress/Eisenhower branch, not to be confused with the O'Hare branch's Western stop in Ukrainian Village miles to the north."],
  ["California (Blue Line - Forest Park)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at California and Congress — East Garfield Park","East Garfield Park's Congress branch stop is a distinct physical station from the O'Hare branch's California stop near Humboldt Park on Milwaukee Ave."],
  ["Kedzie-Homan",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at Kedzie and Homan — North Lawndale neighborhood","Martin Luther King Jr. lived in a North Lawndale apartment in 1966 to draw national attention to the city's housing conditions — this stop is near that site."],
  ["Pulaski (Blue Line)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at Pulaski Road — North Lawndale","Pulaski Road was originally called Crawford Avenue — it was renamed in 1933 to honor Casimir Pulaski, the Polish-American general who served in the American Revolution."],
  ["Cicero (Blue Line)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at Cicero Avenue — Austin neighborhood near the suburb line","Cicero Avenue roughly marks the western edge of Chicago's Austin neighborhood — the Congress branch approaches the suburb of Oak Park here."],
  ["Austin (Blue Line)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop in Austin — Chicago's largest neighborhood by area","Austin is Chicago's largest neighborhood — its elegant boulevard system, greystone buildings, and parks date to the 1890s development boom."],
  ["Oak Park (Blue Line)",["Blue"],"West",2,1958,"Blue Line Forest Park branch stop at Oak Park Avenue — near the suburb of Oak Park","Frank Lloyd Wright's home and studio in Oak Park is steps from this stop — the suburb is a National Historic District for Prairie Style architecture."],
  // ── BROWN LINE GAPS ──────────────────────────────────────────────────────
  ["Rockwell",["Brown"],"Northwest",2,1907,"Brown Line stop at Rockwell Street — Albany Park neighborhood","Albany Park is one of Chicago's most linguistically diverse neighborhoods — the community has been reshaped by waves of immigration since the 1970s."],
  ["Montrose (Brown Line)",["Brown"],"North",2,1907,"Brown Line stop at Montrose Avenue — North Center neighborhood","North Center is a quiet residential neighborhood of single-family homes, vintage bungalows, and local restaurants — Chicago's most family-friendly community."],
  ["Irving Park (Brown Line)",["Brown"],"North",2,1907,"Brown Line stop at Irving Park Road — Ravenswood neighborhood","The Ravenswood neighborhood along the Brown Line is known for its arts district, studios, and proximity to Lincoln Square's German-American dining scene."],
  ["Addison (Brown Line)",["Brown"],"North",2,1907,"Brown Line stop at Addison Street — Ravenswood, well north of Wrigley Field","This Addison stop serves quiet residential Ravenswood — no stadium in sight, just two-flats, local bars, and the elevated track's familiar rumble."],
  // ── PURPLE LINE ──────────────────────────────────────────────────────────
  ["South Boulevard",["Purple"],"North Shore",2,1908,"Southernmost Evanston stop on the Purple Line — just north of the Chicago city boundary","South Boulevard marks the official boundary between Evanston and Chicago — the Purple Line transitions from suburban Evanston to the urban North Side here."],
  // ── GREEN LINE WEST (LAKE STREET ELEVATED) ───────────────────────────────
  ["California (Green Line)",["Green"],"West",2,1895,"Green Line stop at California Avenue and Lake Street — East Garfield Park","The Green Line west branch closed from 1994 to 1996 for a complete rebuild — the California stop was among those that reopened after the $150 million renovation."],
  ["Kedzie (Green Line)",["Green"],"West",2,1895,"Green Line stop at Kedzie Avenue and Lake Street — Garfield Park neighborhood","Garfield Park features a stunning Jens Jensen-designed conservatory completed in 1906 — the neighborhood's baroque fieldhouses are Chicago Park District landmarks."],
  ["Conservatory-Central Park Drive",["Green"],"West",1,1895,"Green Line stop at the Garfield Park Conservatory — one of the world's largest botanical conservatories","The Garfield Park Conservatory spans two acres under glass — Jens Jensen's 1906 design made it one of the largest botanical conservatories in the Western Hemisphere."],
  ["Pulaski (Green Line)",["Green"],"West",2,1895,"Green Line stop at Pulaski Road and Lake Street — Garfield Park","This stretch of Lake Street runs through Garfield Park and North Lawndale — neighborhoods central to Chicago's civil rights organizing in the 1960s."],
  ["Cicero (Green Line)",["Green"],"West",2,1895,"Green Line stop at Cicero Avenue and Lake Street — Austin neighborhood","The Austin neighborhood stretches north and south from this Lake Street stop — one of Chicago's largest West Side communities with significant architectural heritage."],
  ["Austin (Green Line)",["Green"],"West",2,1895,"Green Line stop at Austin Boulevard and Lake Street — on the Chicago/Oak Park border","Austin Boulevard is the exact city limit between Chicago and Oak Park — one of the sharpest urban/suburban contrasts visible anywhere on the L."],
  ["Ridgeland",["Green"],"West",1,1895,"Green Line stop at Ridgeland Avenue on the Lake Street elevated — near the Oak Park border","Ridgeland Avenue marks the transition zone between Chicago's Austin neighborhood and the village of Oak Park — a quiet residential stretch of the Lake Street line."],
  ["Oak Park (Green Line)",["Green"],"West",1,1895,"Green Line western terminus in Oak Park — near the Hemingway Birthplace and Frank Lloyd Wright architecture","Oak Park has more Frank Lloyd Wright-designed structures than any other place in the world — a National Historic District steps from this Green Line terminus."],
  // ── GREEN LINE SOUTH BRANCH ──────────────────────────────────────────────
  ["King Drive",["Green"],"South",2,1892,"Green Line stop at Martin Luther King Jr. Drive — heart of historic Bronzeville","King Drive (formerly South Parkway) was renamed in 1968 — it runs through the heart of Bronzeville, Chicago's historic African-American cultural and commercial district."],
  ["Garfield (Green Line)",["Green"],"South",2,1892,"Green Line stop at Garfield Boulevard (55th Street) — Washington Park area on the South Side elevated","This Garfield is on the historic South Side elevated, a different physical structure from the Red Line's Garfield stop on the Dan Ryan expressway to the west."],
  ["51st",["Green"],"South",1,1892,"Green Line stop at 51st Street — Woodlawn neighborhood near the University of Chicago border","Woodlawn's 51st Street has been at the center of the neighborhood's revitalization — the University of Chicago's campus begins just east of here."],
  ["47th (Green Line)",["Green"],"South",2,1892,"Green Line stop at 47th Street — Bronzeville and Kenwood corridor on the South Side elevated","The 47th and Cottage Grove intersection was a great Bronzeville crossroads — a neighborhood that produced blues legends, writers, and civil rights leaders."],
  ["East 63rd-Cottage Grove",["Green"],"South",1,1892,"Eastern terminus of the Green Line's south branch — 63rd and Cottage Grove in Woodlawn","This terminal was once the center of a vast streetcar network extending through Woodlawn and South Shore — today it is the quiet eastern end of the south Green Line branch."],
  // ── ORANGE LINE ──────────────────────────────────────────────────────────
  ["Pulaski (Orange Line)",["Orange"],"Southwest",2,1993,"Orange Line stop at Pulaski Road — Archer Heights neighborhood on the Southwest Side","Archer Heights is a classic Chicago working-class neighborhood of bungalows and brick two-flats lining streets named after Civil War generals."],
  ["Kedzie (Orange Line)",["Orange"],"Southwest",2,1993,"Orange Line stop at Kedzie Avenue — Brighton Park neighborhood","Brighton Park has been a gateway neighborhood for successive immigrant groups — its bungalows and churches reflect Polish, Lithuanian, and Mexican-American generations."],
  ["Western (Orange Line)",["Orange"],"Southwest",2,1993,"Orange Line stop at Western Avenue — near Back of the Yards and Bridgeport","Western Avenue is one of Chicago's longest streets — the Orange Line here runs through working-class Southwest Side neighborhoods near the historic Union Stock Yards."],
  ["Ashland (Orange Line)",["Orange"],"Southwest",2,1993,"Orange Line stop at Ashland Avenue — McKinley Park neighborhood","McKinley Park is a small, close-knit Southwest Side neighborhood — the community has strong Polish and Mexican-American roots and a beautiful namesake park."],
  ["Halsted (Orange Line)",["Orange"],"Southwest",2,1993,"Orange Line stop at Halsted Street — Canaryville neighborhood","Canaryville is one of Chicago's smallest and most tightly-knit neighborhoods — it grew up around the Union Stock Yards and retains a fierce community identity."],
  // ── PINK LINE ────────────────────────────────────────────────────────────
  ["Cicero (Pink Line)",["Pink"],"West",2,2006,"Pink Line stop at Cicero Avenue — near the Little Village/Cicero border","Little Village (La Villita) is Chicago's largest Mexican-American neighborhood — 26th Street rivals the Magnificent Mile in annual retail sales."],
  ["Pulaski (Pink Line)",["Pink"],"West",2,2006,"Pink Line stop at Pulaski Road — Little Village neighborhood","Little Village's Pulaski corridor connects the neighborhood's residential blocks to the commercial energy of 26th Street — one of Chicago's most vibrant business strips."],
  ["Kostner",["Pink"],"West",2,2006,"Pink Line stop at Kostner Avenue — North/South Lawndale border","The Kostner Avenue corridor straddles the border of North and South Lawndale — two neighborhoods shaped by deindustrialization and remarkable community resilience."],
  ["Central Park (Pink Line)",["Pink"],"West",2,2006,"Pink Line stop at Central Park Avenue — South Lawndale","Central Park Avenue runs through South Lawndale, a neighborhood that has transformed into one of Chicago's most vital Mexican-American communities."],
  ["Kedzie (Pink Line)",["Pink"],"West",2,2006,"Pink Line stop at Kedzie Avenue — South Lawndale near Pilsen","The Pink Line was reconfigured from the old Blue Line Congress branch in 2006 — the Kedzie stop serves the heart of the South Lawndale community."],
  ["California (Pink Line)",["Pink"],"West",3,2006,"Pink Line stop at California Avenue — Pilsen neighborhood on the Near West Side","Pilsen is one of Chicago's most celebrated neighborhoods — its outdoor murals, galleries, and Mexican cuisine make California Avenue a cultural destination."],
  ["Western (Pink Line)",["Pink"],"Near West",3,2006,"Pink Line stop at Western Avenue — Pilsen neighborhood","Western Avenue in Pilsen is lined with taquerías, panaderías, and murals — a gateway into the Near West Side's largest Latino neighborhood."],
  ["Damen (Pink Line)",["Pink"],"Near West",3,2006,"Pink Line stop at Damen Avenue — heart of Pilsen","The Damen corridor in Pilsen is famous for its massive outdoor murals and galleries — one of the most photographed streets in Chicago's Near West Side."],
  ["18th",["Pink"],"Near West",3,2006,"Pink Line stop at 18th Street — the commercial and cultural heart of Pilsen","18th Street is the soul of Pilsen — Mexican restaurants, art galleries, panaderías, and street murals make it one of Chicago's most vibrant neighborhood corridors."],
  ["Polk",["Pink"],"Near West",2,2006,"Pink Line stop at Polk Street on the Paulina connector — between Pilsen and the UIC corridor","Polk Street on the Paulina connector links Pilsen to the University of Illinois at Chicago area — a transitional zone between two of the city's most active neighborhoods."],
  ["Laramie",["Green"],"West",1,1895,"Green Line west branch stop at Laramie Avenue — Austin neighborhood on the historic Lake Street elevated","Laramie Avenue cuts through Austin, Chicago's largest neighborhood by area; the Lake Street elevated here has operated continuously since the 1890s."],
  ["Oakton-Skokie",["Yellow"],"North Shore",1,2012,"Yellow Line intermediate stop at Oakton Street — mid-line access in central Skokie","Oakton-Skokie was added to give riders mid-line access between Howard and the Dempster-Skokie terminus; the Oakton Street corridor is one of Skokie's main commercial strips."],
];
const CHI_IMG:Record<string,string>={
  "O'Hare":"O%27Hare_International_Airport_Chicago.jpg",
  "Midway":"Midway_International_Airport_Chicago.jpg",
  "Howard":"Howard_station_CTA.jpg",
  "95th/Dan Ryan":"95th_Dan_Ryan_station_CTA.jpg",
  "Clark/Lake":"Clark-Lake_station_Chicago_L.jpg",
  "Washington/Wabash":"Washington-Wabash_station_Chicago.jpg",
  "Merchandise Mart":"Merchandise_Mart_Chicago.jpg",
  "Belmont":"Belmont_station_Chicago_L.jpg",
  "Fullerton":"Fullerton_station_Chicago_L.jpg",
  "Kimball":"Kimball_station_Chicago_L.jpg",
  "Linden":"Linden_station_Evanston.jpg",
  "54th/Cermak":"54th_Cermak_station_CTA.jpg",
  "Addison":"Addison_station_Chicago_Wrigley.jpg",
  "Roosevelt":"Roosevelt_station_Chicago.jpg",
  "Cermak-Chinatown":"Chinatown_Chicago.jpg",
  "Forest Park":"Forest_Park_CTA_station.jpg",
  "Harlem/Lake":"Harlem_Lake_station_CTA.jpg",
  "Cottage Grove":"Cottage_Grove_station_CTA.jpg",
  "Skokie":"Skokie_Illinois.jpg",
  "Grand/State":"Grand_State_station_Chicago_Red.jpg",
  "Jackson":"Jackson_station_Chicago_L.jpg",
  "Damen":"Wicker_Park_Chicago.jpg",
  "35th-Bronzeville-IIT":"Bronzeville_Chicago.jpg",
  "Loyola":"Loyola_University_Chicago.jpg",
  "State/Lake":"State_Lake_station_Chicago.jpg",
  "Wilson":"Wilson_station_CTA_Chicago.jpg",
  "Davis":"Davis_Street_station_Evanston.jpg",
  "Main":"Main_Street_station_CTA.jpg",
  "Dempster":"Dempster_station_CTA.jpg",
  "Chicago":"Chicago_station_CTA.jpg",
  "Quincy/Wells":"Quincy_station_Chicago_L.jpg",
  "Jefferson Park":"Jefferson_Park_Chicago.jpg",
  "Cumberland":"Cumberland_station_CTA.jpg",
  "Rosemont":"Rosemont_Illinois.jpg",
  "Harlem":"Harlem_station_CTA_Blue.jpg",
  "Logan Square":"Logan_Square_Chicago.jpg",
  "Western":"Western_station_CTA.jpg",
  "Ashland":"Ashland_station_CTA.jpg",
  "Clinton":"Clinton_station_CTA.jpg",
  "Morgan":"Morgan_station_CTA.jpg",
  "Illinois Medical District":"Illinois_Medical_District_Chicago.jpg",
  "UIC-Halsted":"University_Illinois_Chicago.jpg",
  "LaSalle (Blue Line)":"LaSalle_Street_Chicago.jpg",
  "Harrison":"Harrison_Street_Chicago.jpg",
  "Harold Washington Library":"Harold_Washington_Library_Chicago.jpg",
  "LaSalle/Van Buren":"LaSalle_Van_Buren_station_Chicago.jpg",
  "Quincy/Wells":"Quincy_Wells_station_Chicago.jpg",
  "Adams/Wabash":"Wabash_Avenue_Chicago_elevated.jpg",
  "Monroe":"Monroe_station_Chicago_Blue_Line.jpg",
  "Foster":"Foster_station_Evanston_CTA.jpg",
  "Noyes":"Noyes_station_Evanston_CTA.jpg",
  "Central":"Central_Street_Evanston.jpg",
  "35th/Archer":"35th_Archer_station_CTA.jpg",
  "Argyle":"Argyle_Chicago_L_station.jpg",
  "Sheridan":"Sheridan_station_Chicago_L.jpg",
  "North/Clybourn":"North_Clybourn_station_CTA.jpg",
  "Clark/Division":"Clark_Division_station_Chicago_L.jpg",
  "Lake (Red Line)":"State_Street_subway_Chicago.jpg",
  "47th":"47th_Street_Chicago_Bronzeville.jpg",
  "Garfield (Red Line)":"Washington_Park_Chicago.jpg",
  "63rd (Red Line)":"Englewood_Chicago_neighborhood.jpg",
  "Montrose (Blue Line)":"Milwaukee_Avenue_Chicago.jpg",
  "Irving Park (Blue Line)":"Irving_Park_Chicago.jpg",
  "Division (Blue Line)":"Wicker_Park_Chicago.jpg",
  "Grand (Blue Line)":"Grand_Avenue_Chicago.jpg",
  "Washington (Blue Line)":"Daley_Plaza_Chicago.jpg",
  "Kedzie-Homan":"North_Lawndale_Chicago.jpg",
  "South Boulevard":"South_Boulevard_Evanston_station.jpg",
  "Conservatory-Central Park Drive":"Garfield_Park_Conservatory_Chicago.jpg",
  "King Drive":"Martin_Luther_King_Drive_Chicago.jpg",
  "East 63rd-Cottage Grove":"Woodlawn_Chicago_neighborhood.jpg",
  "Pulaski (Orange Line)":"Archer_Heights_Chicago.jpg",
  "Ashland (Orange Line)":"McKinley_Park_Chicago.jpg",
  "Halsted (Orange Line)":"Canaryville_Chicago.jpg",
  "18th":"18th_Street_Pilsen_Chicago.jpg",
  "Oak Park (Green Line)":"Oak_Park_Illinois_Frank_Lloyd_Wright.jpg",
  "Oak Park (Blue Line)":"Oak_Park_Illinois.jpg",
  "Rockwell":"Albany_Park_Chicago.jpg",
  "Kedzie (Brown Line)":"Albany_Park_Chicago.jpg",
};
const CHI_STATIONS=CHI_RAW.map(([name,lines,zone,traffic,year,desc,fact]:any[])=>({name,lines,zone,traffic,year,desc,fact,img:CHI_IMG[name]?`https://en.wikipedia.org/wiki/Special:FilePath/${CHI_IMG[name]}`:""}));

const STATES_RAW:any[]=[
  ["Maine","Northeast","Atlantic",2,1820,3,"Augusta","New England's largest state by area","Maine produces 90% of the nation's lobster supply.","ME"],
  ["New Hampshire","Northeast","Atlantic",2,1788,2,"Concord","The Granite State — Live Free or Die","New Hampshire was the first colony to declare independence from Britain, in January 1776.","NH"],
  ["Vermont","Northeast","Landlocked",1,1791,2,"Montpelier","Smallest state by population in the continental US","Vermont is the largest producer of maple syrup in the United States.","VT"],
  ["Massachusetts","Northeast","Atlantic",4,1788,2,"Boston","Home of Harvard, MIT, and the American Revolution","The Boston Tea Party of 1773 helped spark the American Revolution.","MA"],
  ["Rhode Island","Northeast","Atlantic",3,1790,1,"Providence","Smallest state by area in the entire US","Despite being the smallest state, Rhode Island has 400+ miles of coastline.","RI"],
  ["Connecticut","Northeast","Atlantic",3,1788,1,"Hartford","Constitution State — insurance capital of the world","Connecticut is home to Yale University, founded in 1701.","CT"],
  ["New York","Northeast","Atlantic",5,1788,3,"Albany","Empire State — home of New York City","New York City served as the first capital of the United States under the Constitution.","NY"],
  ["New Jersey","Northeast","Atlantic",4,1787,1,"Trenton","Most densely populated state in the US","New Jersey is the most densely populated state at 1,200 people per square mile.","NJ"],
  ["Pennsylvania","Northeast","Atlantic",5,1787,3,"Harrisburg","Keystone State — birthplace of American democracy","Philadelphia was the capital of the United States from 1790 to 1800.","PA"],
  ["Delaware","Mid-Atlantic","Atlantic",1,1787,1,"Dover","First State — first to ratify the US Constitution","Delaware was the first state to ratify the Constitution on December 7, 1787.","DE"],
  ["Maryland","Mid-Atlantic","Atlantic",4,1788,2,"Annapolis","Old Line State — home of the US Naval Academy","The Star-Spangled Banner was written during the Battle of Baltimore in 1814.","MD"],
  ["Virginia","Mid-Atlantic","Atlantic",4,1788,3,"Richmond","Mother of Presidents — birthplace of 8 US presidents","More US presidents were born in Virginia than any other state.","VA"],
  ["West Virginia","Mid-Atlantic","Landlocked",2,1863,2,"Charleston","Mountain State — broke from Virginia during the Civil War","West Virginia is the only state formed by separating from another state during the Civil War.","WV"],
  ["North Carolina","Southeast","Atlantic",4,1789,3,"Raleigh","First in Flight — Wright Brothers flew here in 1903","The Wright Brothers made the first powered airplane flight at Kitty Hawk in 1903.","NC"],
  ["South Carolina","Southeast","Atlantic",3,1788,2,"Columbia","Palmetto State — first state to secede before Civil War","South Carolina was the first state to secede from the Union in December 1860.","SC"],
  ["Georgia","Southeast","Atlantic",4,1788,3,"Atlanta","Peach State — home of Coca-Cola and the world's busiest airport","Hartsfield-Jackson Atlanta International is the busiest passenger airport in the world.","GA"],
  ["Florida","Southeast","Gulf",5,1845,3,"Tallahassee","Sunshine State — theme parks and space launches","Florida has the longest coastline of any contiguous US state at 1,350 miles.","FL"],
  ["Alabama","Southeast","Gulf",3,1819,3,"Montgomery","Heart of Dixie — civil rights movement birthplace","Rosa Parks refused to give up her bus seat in Montgomery in 1955, igniting the civil rights movement.","AL"],
  ["Mississippi","Southeast","Gulf",2,1817,3,"Jackson","Magnolia State — birthplace of the blues","Mississippi is the birthplace of the blues — the musical tradition that shaped rock, jazz, and soul.","MS"],
  ["Tennessee","Southeast","Landlocked",3,1796,3,"Nashville","Volunteer State — home of country music and Memphis soul","Nashville and Memphis together have shaped more American music than any other state.","TN"],
  ["Kentucky","Southeast","Landlocked",3,1792,3,"Frankfort","Bluegrass State — 95% of the world's bourbon comes from here","Kentucky produces 95% of the world's bourbon whiskey.","KY"],
  ["Arkansas","Southeast","Landlocked",2,1836,3,"Little Rock","Natural State — only US state with commercial diamond mining","At Crater of Diamonds State Park in Arkansas, visitors can dig for and keep real diamonds.","AR"],
  ["Louisiana","Southeast","Gulf",3,1812,3,"Baton Rouge","Pelican State — Mardi Gras and Louisiana Creole culture","Louisiana is the only US state with parishes instead of counties, a legacy of French colonial law.","LA"],
  ["Ohio","Midwest","Great Lakes",5,1803,3,"Columbus","Buckeye State — seven presidents were born here","Ohio produced 7 US presidents: Grant, Hayes, Garfield, Harrison, McKinley, Taft, and Harding.","OH"],
  ["Michigan","Midwest","Great Lakes",4,1837,3,"Lansing","Great Lakes State — auto capital of the world","Michigan is the only state with two separate peninsulas — the Upper and Lower Peninsula.","MI"],
  ["Indiana","Midwest","Landlocked",3,1816,2,"Indianapolis","Hoosier State — Indianapolis 500 and Indy car racing","Indiana has more miles of interstate highway per square mile than any other state.","IN"],
  ["Illinois","Midwest","Great Lakes",5,1818,3,"Springfield","Land of Lincoln — Chicago and deep dish pizza","Illinois is home to Chicago, which has more drawbridges than any other city in the world.","IL"],
  ["Wisconsin","Midwest","Great Lakes",3,1848,3,"Madison","America's Dairyland — produces 26% of all US cheese","Wisconsin produces more cheese than any other state — about 26% of all US cheese.","WI"],
  ["Minnesota","Midwest","Great Lakes",3,1858,4,"Saint Paul","Land of 10,000 Lakes — actually has 11,842 lakes","Minnesota has more shoreline than California, Florida, and Hawaii combined.","MN"],
  ["Iowa","Midwest","Landlocked",3,1846,3,"Des Moines","Hawkeye State — produces 10% of the nation's food supply","Iowa produces more corn than any other state and feeds a significant portion of the world.","IA"],
  ["Missouri","Midwest","Landlocked",3,1821,3,"Jefferson City","Gateway to the West — the St. Louis Arch and Route 66","The Gateway Arch in St. Louis is the tallest man-made monument in the Western Hemisphere.","MO"],
  ["North Dakota","Midwest","Landlocked",1,1889,4,"Bismarck","Peace Garden State — largest oil producer per capita","North Dakota is the least visited US state but produces the most oil per capita.","ND"],
  ["South Dakota","Midwest","Landlocked",1,1889,4,"Pierre","Mount Rushmore State — Badlands and Black Hills","Mount Rushmore took 14 years to carve and was completed in 1941.","SD"],
  ["Nebraska","Midwest","Landlocked",2,1867,4,"Lincoln","Cornhusker State — more miles of river than any other state","Nebraska has over 10,000 miles of rivers — more than any other state.","NE"],
  ["Kansas","Midwest","Landlocked",2,1861,4,"Topeka","Sunflower State — geographic center of the continental US","The geographic center of the contiguous 48 states is located in Lebanon, Kansas.","KS"],
  ["Texas","Southwest","Gulf",5,1845,5,"Austin","Lone Star State — second largest by area and population","Texas was an independent republic for 10 years before joining the US in 1845.","TX"],
  ["Oklahoma","Southwest","Landlocked",3,1907,4,"Oklahoma City","Sooner State — more tornadoes per square mile than anywhere","Oklahoma has more tornadoes per square mile than any other state.","OK"],
  ["New Mexico","Southwest","Landlocked",2,1912,4,"Santa Fe","Land of Enchantment — oldest US capital city","Santa Fe, founded in 1610, is the oldest capital city in the United States.","NM"],
  ["Arizona","Southwest","Landlocked",4,1912,4,"Phoenix","Grand Canyon State — 300 days of sunshine per year","Arizona is home to the Grand Canyon — one of the Seven Natural Wonders of the World.","AZ"],
  ["Montana","Mountain West","Landlocked",2,1889,5,"Helena","Big Sky Country — three times more cattle than people","Montana has 3 times more cattle than people and the largest grizzly bear population in the lower 48.","MT"],
  ["Idaho","Mountain West","Landlocked",2,1890,4,"Boise","Gem State — produces one-third of all US potatoes","Idaho produces one-third of all potatoes grown in the United States.","ID"],
  ["Wyoming","Mountain West","Landlocked",1,1890,4,"Cheyenne","Equality State — first to grant women the right to vote","Wyoming was the first state to grant women the right to vote, in 1869.","WY"],
  ["Colorado","Mountain West","Landlocked",3,1876,4,"Denver","Centennial State — 58 peaks over 14,000 feet","Colorado has more 14,000-foot peaks than any other state — 58 of them.","CO"],
  ["Utah","Mountain West","Landlocked",3,1896,4,"Salt Lake City","Beehive State — five national parks and the Great Salt Lake","The Great Salt Lake is up to 8 times saltier than the ocean.","UT"],
  ["Nevada","Mountain West","Landlocked",3,1864,4,"Carson City","Silver State — driest state in the US","Nevada averages only 7 inches of rain per year — the driest state in the nation.","NV"],
  ["Washington","Pacific","Pacific",4,1889,3,"Olympia","Evergreen State — produces 70% of all US apples","Washington state produces 70% of all the apples grown in the United States.","WA"],
  ["Oregon","Pacific","Pacific",3,1859,3,"Salem","Beaver State — only state flag with two different sides","Oregon has the only state flag with a different design on each side.","OR"],
  ["California","Pacific","Pacific",5,1850,5,"Sacramento","Golden State — 5th largest economy in the world","If California were a country, it would have the 5th largest economy in the world.","CA"],
  ["Alaska","Pacific","Pacific",1,1959,5,"Juneau","Last Frontier — more coastline than all other states combined","Alaska has more coastline than all other US states combined.","AK"],
  ["Hawaii","Pacific","Pacific",2,1959,1,"Honolulu","Aloha State — only island state, only state to grow coffee","Hawaii is the only US state that grows coffee commercially.","HI"],
];
const STATES_IMG:Record<string,string>={
  "Maine":"https://en.wikipedia.org/wiki/Special:FilePath/Bass_Harbor_Head_Light_Station_2016.jpg",
  "New Hampshire":"https://en.wikipedia.org/wiki/Special:FilePath/Franconia_Notch_State_Park_NH.jpg",
  "Vermont":"https://en.wikipedia.org/wiki/Special:FilePath/Vermont_fall_foliage_2006.jpg",
  "Massachusetts":"https://en.wikipedia.org/wiki/Special:FilePath/Boston_skyline_from_uss_constitution.jpg",
  "Rhode Island":"https://en.wikipedia.org/wiki/Special:FilePath/Newport_Cliff_Walk_Rhode_Island.jpg",
  "Connecticut":"https://en.wikipedia.org/wiki/Special:FilePath/Yale_University_Phelps_Gate.jpg",
  "New York":"https://en.wikipedia.org/wiki/Special:FilePath/New_york_times_square-terabass.jpg",
  "New Jersey":"https://en.wikipedia.org/wiki/Special:FilePath/Atlantic_City_Boardwalk_2009.jpg",
  "Pennsylvania":"https://en.wikipedia.org/wiki/Special:FilePath/Independence_Hall_(Philadelphia,_Pennsylvania)_-_DPLA.jpg",
  "Delaware":"https://en.wikipedia.org/wiki/Special:FilePath/Delaware_Memorial_Bridge_2012.jpg",
  "Maryland":"https://en.wikipedia.org/wiki/Special:FilePath/Chesapeake_Bay_Bridge_(aerial_view).jpg",
  "Virginia":"https://en.wikipedia.org/wiki/Special:FilePath/Shenandoah_Valley_from_Skyline_Drive.jpg",
  "West Virginia":"https://en.wikipedia.org/wiki/Special:FilePath/New_River_Gorge_Bridge.jpg",
  "North Carolina":"https://en.wikipedia.org/wiki/Special:FilePath/Cape_Hatteras_Lighthouse_08-2009.jpg",
  "South Carolina":"https://en.wikipedia.org/wiki/Special:FilePath/Charleston_SC_rainbow_row.jpg",
  "Georgia":"https://en.wikipedia.org/wiki/Special:FilePath/Atlanta_from_Buckhead.jpg",
  "Florida":"https://en.wikipedia.org/wiki/Special:FilePath/Miami_Beach_FL_USA.jpg",
  "Alabama":"https://en.wikipedia.org/wiki/Special:FilePath/Alabama_State_Capitol.jpg",
  "Mississippi":"https://en.wikipedia.org/wiki/Special:FilePath/Mississippi_River_New_Orleans.jpg",
  "Tennessee":"https://en.wikipedia.org/wiki/Special:FilePath/Nashville_Skyline_from_Bicentennial_Mall.jpg",
  "Kentucky":"https://en.wikipedia.org/wiki/Special:FilePath/Churchill_Downs_aerial.jpg",
  "Arkansas":"https://en.wikipedia.org/wiki/Special:FilePath/Ozark_Mountains_Arkansas.jpg",
  "Louisiana":"https://en.wikipedia.org/wiki/Special:FilePath/French_Quarter_New_Orleans.jpg",
  "Ohio":"https://en.wikipedia.org/wiki/Special:FilePath/Cincinnati_Ohio_aerial.jpg",
  "Michigan":"https://en.wikipedia.org/wiki/Special:FilePath/Mackinac_Bridge_2009.jpg",
  "Indiana":"https://en.wikipedia.org/wiki/Special:FilePath/Indianapolis_Motor_Speedway_from_air.jpg",
  "Illinois":"https://en.wikipedia.org/wiki/Special:FilePath/Chicago_from_North_Avenue_Beach_June_2015_panorama.jpg",
  "Wisconsin":"https://en.wikipedia.org/wiki/Special:FilePath/Lambeau_Field_2012.jpg",
  "Minnesota":"https://en.wikipedia.org/wiki/Special:FilePath/Boundary_Waters_Canoe_Area_Wilderness.jpg",
  "Iowa":"https://en.wikipedia.org/wiki/Special:FilePath/Iowa_prairie.jpg",
  "Missouri":"https://en.wikipedia.org/wiki/Special:FilePath/St_Louis_night_expblend.jpg",
  "North Dakota":"https://en.wikipedia.org/wiki/Special:FilePath/North_Dakota_Badlands.jpg",
  "South Dakota":"https://en.wikipedia.org/wiki/Special:FilePath/Mount_Rushmore_National_Memorial.jpg",
  "Nebraska":"https://en.wikipedia.org/wiki/Special:FilePath/Chimney_Rock_Nebraska.jpg",
  "Kansas":"https://en.wikipedia.org/wiki/Special:FilePath/Wichita_Kansas_sunset.jpg",
  "Texas":"https://en.wikipedia.org/wiki/Special:FilePath/Texas_state_capitol.jpg",
  "Oklahoma":"https://en.wikipedia.org/wiki/Special:FilePath/Oklahoma_City_skyline.jpg",
  "New Mexico":"https://en.wikipedia.org/wiki/Special:FilePath/Taos_pueblo.jpg",
  "Arizona":"https://en.wikipedia.org/wiki/Special:FilePath/Grand_Canyon_National_Park_view.jpg",
  "Montana":"https://en.wikipedia.org/wiki/Special:FilePath/Glacier_National_Park_mountain_lake.jpg",
  "Idaho":"https://en.wikipedia.org/wiki/Special:FilePath/Sawtooth_Mountains_Idaho.jpg",
  "Wyoming":"https://en.wikipedia.org/wiki/Special:FilePath/Grand_Prismatic_Spring_2013.jpg",
  "Colorado":"https://en.wikipedia.org/wiki/Special:FilePath/Rocky_Mountain_National_Park_in_September_2011_-_Glacier_Gorge.jpg",
  "Utah":"https://en.wikipedia.org/wiki/Special:FilePath/Angels_Landing,_Zion_National_Park.jpg",
  "Nevada":"https://en.wikipedia.org/wiki/Special:FilePath/Las_Vegas_Strip_at_night.jpg",
  "Washington":"https://en.wikipedia.org/wiki/Special:FilePath/Mount_Rainier_reflected_in_Reflection_Lake.jpg",
  "Oregon":"https://en.wikipedia.org/wiki/Special:FilePath/Crater_Lake_7507.jpg",
  "California":"https://en.wikipedia.org/wiki/Special:FilePath/Golden_Gate_Bridge_as_seen_from_Battery_Spencer.jpg",
  "Alaska":"https://en.wikipedia.org/wiki/Special:FilePath/Denali_Mt_McKinley.jpg",
  "Hawaii":"https://en.wikipedia.org/wiki/Special:FilePath/Waikiki_Beach,_Honolulu.jpg",
};
const STATES=STATES_RAW.map(([name,region,coast,pop,year,size,capital,desc,fact,abbr]:any[])=>({name,region,coast,pop,year,size,capital,desc,fact,abbr,img:STATES_IMG[name]||""}));

// ── NFL TEAMS DATA ─────────────────────────────────────────────────────────────
// [name, conf, div, region, sb, year, city, desc, fact]
const NFL_RAW:any[]=[
  ["Buffalo Bills","AFC","East","Northeast",0,1960,"Buffalo, NY","AFC East · Four consecutive Super Bowl appearances — the most painful run in NFL history","The Buffalo Bills appeared in four consecutive Super Bowls (1991–1994) — and lost all four. No team has ever won more AFC Championships in a row."],
  ["Miami Dolphins","AFC","East","Southeast",2,1966,"Miami, FL","AFC East · The only franchise to complete a perfect undefeated season in NFL history","The 1972 Miami Dolphins went 17–0 under Don Shula — the only perfect season ever. Their champagne pops every year when the last undefeated team loses."],
  ["New England Patriots","AFC","East","Northeast",6,1960,"Foxborough, MA","AFC East · The most dominant dynasty in modern NFL history — 6 Super Bowls with Belichick and Brady","Tom Brady and Bill Belichick won a record 6 Super Bowls together. The Pats won 3 in 4 years twice — a feat no other franchise has matched."],
  ["New York Jets","AFC","East","Northeast",1,1960,"East Rutherford, NJ","AFC East · Joe Namath guaranteed a Super Bowl III victory — and delivered the biggest upset in the game's early history","Broadway Joe Namath guaranteed victory over the heavily favored Baltimore Colts in Super Bowl III (1969) — and won. It's still the Jets' only championship."],
  ["Baltimore Ravens","AFC","North","Mid-Atlantic",2,1996,"Baltimore, MD","AFC North · Born from the Cleveland Browns relocation — one of the most physically dominant defenses ever assembled","The 2000 Ravens defense allowed only 165 points all season. Ray Lewis, Ed Reed, and Haloti Ngata made Baltimore one of football's most feared defenses."],
  ["Cincinnati Bengals","AFC","North","Midwest",0,1968,"Cincinnati, OH","AFC North · 'Who Dey' — a blue-collar franchise that's been close but hasn't broken through for a title","The Bengals reached Super Bowl LVI in February 2022 but lost to the Rams. They've appeared in 3 Super Bowls — and lost them all."],
  ["Cleveland Browns","AFC","North","Midwest",0,1946,"Cleveland, OH","AFC North · The most loyal fanbase in football — still waiting for that first Super Bowl","The Dawg Pound has endured decades of heartbreak. Cleveland's last championship was in 1964 (pre-Super Bowl era). Jim Brown is still the greatest running back they ever had."],
  ["Pittsburgh Steelers","AFC","North","Midwest",6,1933,"Pittsburgh, PA","AFC North · Tied for most Super Bowl wins ever — the Terrible Towel is one of sport's most iconic traditions","The Steelers are tied with the Patriots at 6 Super Bowl wins. Their Terrible Towel, introduced by Myron Cope in 1975, has become one of the most recognized symbols in sports."],
  ["Houston Texans","AFC","South","South",0,2002,"Houston, TX","AFC South · One of the NFL's newest teams — J.J. Watt's 2014 season was arguably the best defensive performance in history","The Texans joined the NFL in 2002. J.J. Watt recorded 20.5 sacks in 2014 — widely considered the most dominant single season by a defensive player in NFL history."],
  ["Indianapolis Colts","AFC","South","Midwest",2,1953,"Indianapolis, IN","AFC South · Peyton Manning's franchise — the Horseshoe and the greatest regular season quarterback run ever","Peyton Manning won 4 regular season MVP awards as a Colt and threw 49 touchdown passes in 2004, breaking the NFL record. They won Super Bowl XLI in 2007."],
  ["Jacksonville Jaguars","AFC","South","Southeast",0,1995,"Jacksonville, FL","AFC South · 1995 expansion team that nearly reached the Super Bowl in just their second NFL season","The Jaguars were founded in 1995 and reached the AFC Championship game in 1996 — their second season. Mark Brunell, Fred Taylor, and Tony Boselli built a contender almost overnight."],
  ["Tennessee Titans","AFC","South","Southeast",0,1960,"Nashville, TN","AFC South · Originally the Houston Oilers — and Kevin Dyson was one yard short of tying Super Bowl XXXIV","The Titans came within a yard of tying Super Bowl XXXIV on the final play (the Music City Miracle helped get them there). They were the Houston Oilers for their first 36 years."],
  ["Denver Broncos","AFC","West","Mountain/SW",3,1960,"Denver, CO","AFC West · Mile High altitude home-field advantage — and 3 Super Bowls including Peyton Manning's final game","The Broncos won with John Elway (twice) and Peyton Manning. Their home at 5,280 feet above sea level is a genuine physical disadvantage for visiting teams."],
  ["Kansas City Chiefs","AFC","West","Midwest",4,1960,"Kansas City, MO","AFC West · Patrick Mahomes era dynasty — 4 Super Bowls and Arrowhead Stadium's world-record crowd noise","Patrick Mahomes won 4 Super Bowls in his first 7 seasons. Arrowhead Stadium set a Guinness World Record for crowd noise at 142.2 decibels in 2014."],
  ["Las Vegas Raiders","AFC","West","Mountain/SW",3,1960,"Las Vegas, NV","AFC West · Iconic silver and black — Al Davis's 'Just Win Baby' philosophy and 3 championships","The Raiders won 3 Super Bowls and moved from Oakland to Las Vegas's Allegiant Stadium in 2020. Al Davis's commitment to the outlaw brand made them globally recognized."],
  ["Los Angeles Chargers","AFC","West","Pacific",0,1960,"Los Angeles, CA","AFC West · AFL originals — the lightning bolt is one of sport's most iconic logos, but the Lombardi has eluded them","The Chargers were AFL charter members in 1960. Despite legends like LaDainian Tomlinson, Dan Fouts, and Philip Rivers, they have never won a Super Bowl."],
  ["Dallas Cowboys","NFC","East","South",5,1960,"Arlington, TX","NFC East · 'America's Team' with 5 Super Bowl wins and the highest franchise value in professional sports","The Cowboys are valued at over $9 billion — the most valuable sports franchise in the world. Troy Aikman, Michael Irvin, and Emmitt Smith won three titles in four years in the '90s."],
  ["New York Giants","NFC","East","Northeast",4,1925,"East Rutherford, NJ","NFC East · Two Super Bowl wins that came by upsetting the previously undefeated New England Patriots","The Giants beat the undefeated Patriots in Super Bowl XLII (17–14) and again in XLVI. Eli Manning's escaping tackle for the 'Helmet Catch' play is one of the most iconic moments in Super Bowl history."],
  ["Philadelphia Eagles","NFC","East","Mid-Atlantic",2,1933,"Philadelphia, PA","NFC East · The Philly Special, then a second title in 2025 — Philadelphia has won two Super Bowls in the modern era","The Eagles won Super Bowl LII in 2018 on Nick Foles's famous trick-play TD catch, then won Super Bowl LIX in 2025 to capture their second Lombardi Trophy."],
  ["Washington Commanders","NFC","East","Mid-Atlantic",3,1932,"Landover, MD","NFC East · Three Super Bowls under Joe Gibbs — rebranded from Redskins to Commanders in 2022","The Commanders (formerly Redskins) won 3 Super Bowls in the 1980s and 1990s under Hall of Fame coach Joe Gibbs. They are one of the NFL's original founding franchises."],
  ["Chicago Bears","NFC","North","Midwest",1,1920,"Chicago, IL","NFC North · The most wins in NFL history — and the 1985 defense may be the greatest team ever assembled","The Bears are an NFL founding member with the most all-time wins. The 1985 team went 15–1, recorded 'The Super Bowl Shuffle,' and allowed only 198 points."],
  ["Detroit Lions","NFC","North","Midwest",0,1930,"Detroit, MI","NFC North · One of only four original franchises never to reach a Super Bowl — and the only team to go 0–16","The Lions went 0–16 in 2008 — the only NFL team in history to do so. Calvin Johnson ('Megatron') set the single-season receiving record in 2012 with 1,964 yards."],
  ["Green Bay Packers","NFC","North","Midwest",4,1919,"Green Bay, WI","NFC North · The only community-owned franchise in major professional US sports — and 13 championships total","The Packers are owned by over 360,000 shareholders — nonprofit, publicly held, and impossible to relocate. 4 Super Bowl titles, 13 championships overall, and Lambeau Field is the sport's cathedral."],
  ["Minnesota Vikings","NFC","North","Midwest",0,1961,"Minneapolis, MN","NFC North · 4 Super Bowl appearances — all losses — making them the most heartbroken franchise in NFL history","The Vikings have appeared in 4 Super Bowls (1970, 1974, 1975, 1977) — and lost them all. Adrian Peterson's 2012 rushing season (2,097 yards) is the second-most in NFL history."],
  ["Atlanta Falcons","NFC","South","Southeast",0,1966,"Atlanta, GA","NFC South · Led 28–3 in the Super Bowl — then lost in overtime in the greatest collapse in championship history","The Falcons led New England 28–3 in Super Bowl LI's third quarter and still lost in overtime. It remains the largest blown lead in Super Bowl history."],
  ["Carolina Panthers","NFC","South","Southeast",0,1995,"Charlotte, NC","NFC South · 1995 expansion team that reached the Super Bowl in year 9 — and Cam Newton's MVP season was a force of nature","Cam Newton won the 2015 NFL MVP unanimously and the Panthers went 15–1. Newton's combination of passing and rushing ability redefined the quarterback position."],
  ["New Orleans Saints","NFC","South","South",1,1967,"New Orleans, LA","NFC South · Super Bowl XLIV (2010) meant everything to a city still healing from Hurricane Katrina","Drew Brees held the NFL career passing yards record for years. The Saints' Super Bowl win in 2010 was one of sport's most emotional moments — a city celebrating its recovery."],
  ["Tampa Bay Buccaneers","NFC","South","Southeast",2,1976,"Tampa, FL","NFC South · Tom Brady left the Patriots for Tampa Bay and immediately won his 7th Super Bowl","Tom Brady signed with the Buccaneers in 2020 and won Super Bowl LV that season — his 7th ring. The Bucs also won Super Bowl XXXVII with Brad Johnson in 2003."],
  ["Arizona Cardinals","NFC","West","Mountain/SW",0,1920,"Glendale, AZ","NFC West · The oldest franchise in the NFL — founded in 1920 in Chicago and still searching for their first title","The Cardinals are the NFL's oldest franchise, founded in 1920 in Chicago. They moved to Arizona in 1988. Larry Fitzgerald is one of the greatest receivers ever to play without a title."],
  ["Los Angeles Rams","NFC","West","Pacific",2,1936,"Inglewood, CA","NFC West · The Greatest Show on Turf and then Matthew Stafford's Super Bowl win — two eras, both electric","The Rams won Super Bowl XXXIV with Kurt Warner's Greatest Show on Turf (2000), and Super Bowl LVI with Matthew Stafford (2022). Cooper Kupp won the Triple Crown that season."],
  ["San Francisco 49ers","NFC","West","Pacific",5,1946,"Santa Clara, CA","NFC West · The most decorated West Coast dynasty — 5 Super Bowls and the greatest quarterback tandem in history","The 49ers won 5 Super Bowls from 1982–1995 with Joe Montana and Steve Young. Jerry Rice, widely considered the greatest receiver ever, played his entire prime in San Francisco."],
  ["Seattle Seahawks","NFC","West","Pacific",1,1976,"Seattle, WA","NFC West · The 12th Man and the Legion of Boom — so loud the fans once registered as a seismic event","The Seahawks' Legion of Boom defense (2012–2015) was one of the most dominant in history. Their fan base is so loud it has literally registered on earthquake seismographs."],
];
const NFL_IMG:Record<string,string>={
  "Buffalo Bills":"https://en.wikipedia.org/wiki/Special:FilePath/Highmark_Stadium_aerial_view.jpg",
  "Miami Dolphins":"https://en.wikipedia.org/wiki/Special:FilePath/Hard_Rock_Stadium_2016.jpg",
  "New England Patriots":"https://en.wikipedia.org/wiki/Special:FilePath/Gillette_Stadium_aerial.jpg",
  "New York Jets":"https://en.wikipedia.org/wiki/Special:FilePath/MetLife_Stadium.jpg",
  "Baltimore Ravens":"https://en.wikipedia.org/wiki/Special:FilePath/M%26T_Bank_Stadium_aerial.jpg",
  "Cincinnati Bengals":"https://en.wikipedia.org/wiki/Special:FilePath/Paycor_Stadium_aerial.jpg",
  "Cleveland Browns":"https://en.wikipedia.org/wiki/Special:FilePath/FirstEnergy_Stadium_2019.jpg",
  "Pittsburgh Steelers":"https://en.wikipedia.org/wiki/Special:FilePath/Heinz_Field_Pittsburgh.jpg",
  "Houston Texans":"https://en.wikipedia.org/wiki/Special:FilePath/NRG_Stadium_Houston.jpg",
  "Indianapolis Colts":"https://en.wikipedia.org/wiki/Special:FilePath/Lucas_Oil_Stadium_aerial.jpg",
  "Jacksonville Jaguars":"https://en.wikipedia.org/wiki/Special:FilePath/EverBank_Stadium_aerial.jpg",
  "Tennessee Titans":"https://en.wikipedia.org/wiki/Special:FilePath/Nissan_Stadium_aerial.jpg",
  "Denver Broncos":"https://en.wikipedia.org/wiki/Special:FilePath/Empower_Field_at_Mile_High_2021.jpg",
  "Kansas City Chiefs":"https://en.wikipedia.org/wiki/Special:FilePath/Arrowhead_Stadium_aerial.jpg",
  "Las Vegas Raiders":"https://en.wikipedia.org/wiki/Special:FilePath/Allegiant_Stadium.jpg",
  "Los Angeles Chargers":"https://en.wikipedia.org/wiki/Special:FilePath/SoFi_Stadium.jpg",
  "Dallas Cowboys":"https://en.wikipedia.org/wiki/Special:FilePath/AT%26T_Stadium_Cowboys_vs_Giants.jpg",
  "New York Giants":"https://en.wikipedia.org/wiki/Special:FilePath/MetLife_Stadium.jpg",
  "Philadelphia Eagles":"https://en.wikipedia.org/wiki/Special:FilePath/Lincoln_Financial_Field.jpg",
  "Washington Commanders":"https://en.wikipedia.org/wiki/Special:FilePath/FedExField_aerial.jpg",
  "Chicago Bears":"https://en.wikipedia.org/wiki/Special:FilePath/Soldier_Field_-_June_2010.jpg",
  "Detroit Lions":"https://en.wikipedia.org/wiki/Special:FilePath/Ford_Field.jpg",
  "Green Bay Packers":"https://en.wikipedia.org/wiki/Special:FilePath/Lambeau_Field_aerial_view.jpg",
  "Minnesota Vikings":"https://en.wikipedia.org/wiki/Special:FilePath/US_Bank_Stadium_August_2016.jpg",
  "Atlanta Falcons":"https://en.wikipedia.org/wiki/Special:FilePath/Mercedes-Benz_Stadium.jpg",
  "Carolina Panthers":"https://en.wikipedia.org/wiki/Special:FilePath/Bank_of_America_Stadium.jpg",
  "New Orleans Saints":"https://en.wikipedia.org/wiki/Special:FilePath/Caesars_Superdome_aerial_view.jpg",
  "Tampa Bay Buccaneers":"https://en.wikipedia.org/wiki/Special:FilePath/Raymond_James_Stadium.jpg",
  "Arizona Cardinals":"https://en.wikipedia.org/wiki/Special:FilePath/State_Farm_Stadium.jpg",
  "Los Angeles Rams":"https://en.wikipedia.org/wiki/Special:FilePath/SoFi_Stadium.jpg",
  "San Francisco 49ers":"https://en.wikipedia.org/wiki/Special:FilePath/Levi%27s_Stadium_aerial_view.jpg",
  "Seattle Seahawks":"https://en.wikipedia.org/wiki/Special:FilePath/Lumen_Field.jpg",
};
const NFL_TEAMS=NFL_RAW.map(([name,conf,div,region,sb,year,city,desc,fact]:any[])=>({name,conf,div,region,sb,year,city,desc,fact,img:NFL_IMG[name]||""}));

const NFL_HINTS:Record<string,[string,string]>={
  "Buffalo Bills":["This team has appeared in more consecutive Super Bowls than any franchise in history — and lost every one","AFC East · Buffalo, NY · Founded 1960 · Never won a Super Bowl"],
  "Miami Dolphins":["The only team in NFL history to finish a season without a loss — and they did it decades ago","AFC East · Miami, FL · Founded 1966 · 2 Super Bowl wins (1973, 1974)"],
  "New England Patriots":["This franchise won 6 Super Bowls with the same head coach and quarterback — the greatest dynasty of the modern era","AFC East · Foxborough, MA · Founded 1960 · 6 Super Bowl wins"],
  "New York Jets":["Their quarterback guaranteed victory in the Super Bowl before the game was played — and actually delivered","AFC East · East Rutherford, NJ · Founded 1960 · 1 Super Bowl win (1969)"],
  "Baltimore Ravens":["This team was controversially relocated from another city in 1996 — and their inaugural Super Bowl-winning defense may be the greatest ever","AFC North · Baltimore, MD · Founded 1996 · 2 Super Bowl wins"],
  "Cincinnati Bengals":["Who Dey — this Ohio franchise has reached three Super Bowls and lost them all","AFC North · Cincinnati, OH · Founded 1968 · 0 Super Bowl wins"],
  "Cleveland Browns":["This franchise hasn't won a championship since 1964 — their fanbase's section of the stadium is called the Dawg Pound","AFC North · Cleveland, OH · Founded 1946 · 0 Super Bowl wins"],
  "Pittsburgh Steelers":["The Terrible Towel and six championship rings — tied for most Super Bowl wins in NFL history","AFC North · Pittsburgh, PA · Founded 1933 · 6 Super Bowl wins"],
  "Houston Texans":["One of the newest NFL franchises, joining in 2002 — their pass rusher set a record with 20.5 sacks in a single season","AFC South · Houston, TX · Founded 2002 · 0 Super Bowl wins"],
  "Indianapolis Colts":["Their quarterback won four MVP awards and threw 49 touchdown passes in a single season, breaking a record","AFC South · Indianapolis, IN · Founded 1953 · 2 Super Bowl wins"],
  "Jacksonville Jaguars":["This 1995 expansion team almost reached the Super Bowl in just their second year of existence","AFC South · Jacksonville, FL · Founded 1995 · 0 Super Bowl wins"],
  "Tennessee Titans":["This franchise was known as the Houston Oilers for decades before relocating — Kevin Dyson was one yard short of tying a Super Bowl","AFC South · Nashville, TN · Founded 1960 · 0 Super Bowl wins"],
  "Denver Broncos":["Playing a mile above sea level gives this team a real home-field advantage — they've won 3 Super Bowls","AFC West · Denver, CO · Founded 1960 · 3 Super Bowl wins"],
  "Kansas City Chiefs":["This franchise's young quarterback has already won four Super Bowls — their stadium once set a world record for crowd noise","AFC West · Kansas City, MO · Founded 1960 · 4 Super Bowl wins"],
  "Las Vegas Raiders":["'Just Win Baby' — this silver-and-black franchise moved to the Nevada desert in 2020 after decades in Oakland","AFC West · Las Vegas, NV · Founded 1960 · 3 Super Bowl wins"],
  "Los Angeles Chargers":["AFL originals with one of the most recognizable logos in sports — still searching for their first championship","AFC West · Los Angeles, CA · Founded 1960 · 0 Super Bowl wins"],
  "Dallas Cowboys":["'America's Team' — the most valuable sports franchise in the world, with 5 Super Bowl rings","NFC East · Dallas/Arlington, TX · Founded 1960 · 5 Super Bowl wins"],
  "New York Giants":["This team pulled off two of the most stunning Super Bowl upsets — both times beating a previously undefeated opponent","NFC East · East Rutherford, NJ · Founded 1925 · 4 Super Bowl wins"],
  "Philadelphia Eagles":["This franchise won two Super Bowls in the modern era — one on a famous trick play, and another in 2025","NFC East · Philadelphia, PA · Founded 1933 · 2 Super Bowl wins (2018, 2025)"],
  "Washington Commanders":["Three Super Bowls under one coach in the 1980s and 90s — rebranded with a new name in 2022","NFC East · Washington D.C. area · Founded 1932 · 3 Super Bowl wins"],
  "Chicago Bears":["One of the NFL's founding members — their 1985 team recorded a rap song before winning the Super Bowl","NFC North · Chicago, IL · Founded 1920 · 1 Super Bowl win"],
  "Detroit Lions":["The only NFL team to go 0–16 in a season — and one of four original franchises never to reach a Super Bowl","NFC North · Detroit, MI · Founded 1930 · 0 Super Bowl wins"],
  "Green Bay Packers":["This team is publicly owned by its fans — the only nonprofit franchise in major American professional sports","NFC North · Green Bay, WI · Founded 1919 · 4 Super Bowl wins"],
  "Minnesota Vikings":["Four Super Bowl appearances — all losses — making this Minnesota franchise one of football's most heartbroken","NFC North · Minneapolis, MN · Founded 1961 · 0 Super Bowl wins"],
  "Atlanta Falcons":["This team blew a 28–3 lead in the Super Bowl — the biggest blown lead in championship game history","NFC South · Atlanta, GA · Founded 1966 · 0 Super Bowl wins"],
  "Carolina Panthers":["Their 2015 quarterback won the MVP award unanimously after leading them to a 15–1 regular season record","NFC South · Charlotte, NC · Founded 1995 · 0 Super Bowl wins"],
  "New Orleans Saints":["Their 2010 Super Bowl win was one of sport's most emotional moments — a city still healing from a major hurricane","NFC South · New Orleans, LA · Founded 1967 · 1 Super Bowl win (2010)"],
  "Tampa Bay Buccaneers":["The greatest quarterback of all time left his dynasty team to join this Florida franchise — and immediately won a Super Bowl","NFC South · Tampa, FL · Founded 1976 · 2 Super Bowl wins"],
  "Arizona Cardinals":["The NFL's oldest franchise — born in Chicago in 1920 and still searching for their first championship","NFC West · Glendale, AZ · Founded 1920 · 0 Super Bowl wins"],
  "Los Angeles Rams":["This franchise won Super Bowls in two different eras — once with 'The Greatest Show on Turf' and once with a first-year starter","NFC West · Inglewood, CA · Founded 1936 · 2 Super Bowl wins"],
  "San Francisco 49ers":["Five Super Bowls — Joe Montana, Jerry Rice, and Steve Young built the most successful dynasty on the West Coast","NFC West · Santa Clara, CA · Founded 1946 · 5 Super Bowl wins"],
  "Seattle Seahawks":["Their Legion of Boom defense was so dominant that their fans once registered as a literal seismic event","NFC West · Seattle, WA · Founded 1976 · 1 Super Bowl win (2014)"],
};

const NFL_DYK:string[]=[
  "The NFL has 32 teams split into two conferences (AFC and NFC) with 4 divisions of 4 teams each.",
  "The Green Bay Packers are the only publicly owned, nonprofit franchise in major professional US sports — fan-owned since 1923.",
  "The Pittsburgh Steelers and New England Patriots are tied for most Super Bowl wins with 6 championships each.",
  "The 1972 Miami Dolphins went 17–0 — the only perfect season in NFL history. They famously toast each year when the last undefeated team loses.",
  "Arrowhead Stadium (Kansas City) set a Guinness World Record for crowd noise at 142.2 decibels in 2014.",
  "The Arizona Cardinals are the oldest franchise in NFL history, founded in 1920 in Chicago as the Racine Cardinals.",
  "Washington Park station has the deepest MAX platform in the system — but the DC Metro's Wheaton station has the longest escalator in the Western Hemisphere.",
  "Tom Brady won 7 Super Bowls — 6 with the Patriots and 1 with the Buccaneers — more than any player in history.",
  "The Dallas Cowboys have the highest franchise value in professional sports — over $9 billion as of 2024.",
  "Super Bowl XLII (2008): The undefeated Patriots (18–0) lost to the Giants 17–14. David Tyree's 'Helmet Catch' is one of sport's most iconic plays.",
  "The NFL Draft is held every April — all 32 teams select college players in inverse order of the previous season's record.",
  "A regulation NFL field is 100 yards long with 10-yard end zones at each end — total of 120 yards including end zones.",
  "The Super Bowl is consistently the most-watched TV broadcast in American history, drawing 100+ million viewers annually.",
  "The Cleveland Browns are named after Paul Brown, their legendary first coach — not their team color.",
  "Lambeau Field in Green Bay has been sold out for every single game since 1960 — a 60+ year sellout streak.",
  "The Buffalo Bills are the only team to appear in four consecutive Super Bowls (1991–1994) — and the only team to lose four straight.",
];

const NFL_TRIVIA=[
  {q:"How many teams are in the NFL?",opts:["28","30","32","34"],ans:2},
  {q:"How many Super Bowls have the New England Patriots won?",opts:["4","5","6","7"],ans:2},
  {q:"Which team has the most all-time wins in NFL history?",opts:["Green Bay Packers","Chicago Bears","New England Patriots","Pittsburgh Steelers"],ans:1},
  {q:"What year did the first Super Bowl take place?",opts:["1965","1967","1969","1971"],ans:1},
  {q:"Which team completed the NFL's only perfect undefeated season?",opts:["New England Patriots","Pittsburgh Steelers","Miami Dolphins","San Francisco 49ers"],ans:2},
  {q:"What is the name of the trophy awarded to the Super Bowl champion?",opts:["The Vince Lombardi Trophy","The Pete Rozelle Cup","The George Halas Award","The Commissioner's Cup"],ans:0},
  {q:"The Green Bay Packers are unique because they are owned by whom?",opts:["The city of Green Bay","The State of Wisconsin","Their fans (publicly owned)","The NFL itself"],ans:2},
  {q:"Which QB has won the most Super Bowls?",opts:["Joe Montana","Peyton Manning","Tom Brady","Terry Bradshaw"],ans:2},
  {q:"How many points is a touchdown worth?",opts:["5","6","7","8"],ans:1},
  {q:"What does NFL stand for?",opts:["National Football League","National Football Legacy","Northwestern Football League","National Federation of Leagues"],ans:0},
  {q:"Which city hosts the most Super Bowls due to its warm weather?",opts:["Los Angeles","Miami","Las Vegas","New Orleans"],ans:1},
  {q:"The Arizona Cardinals originally played in which city?",opts:["Phoenix","St. Louis","Baltimore","Chicago"],ans:3},
  {q:"In what year did the AFC and NFC merge to form the modern NFL structure?",opts:["1966","1970","1974","1978"],ans:1},
  {q:"What was the largest comeback in Super Bowl history (overcome by New England)?",opts:["21 points","25 points","28 points","31 points"],ans:2},
  {q:"Which team is known as 'America's Team'?",opts:["New York Giants","Chicago Bears","Dallas Cowboys","Green Bay Packers"],ans:2},
  {q:"How many points is a field goal worth?",opts:["1","2","3","6"],ans:2},
  {q:"How many players does each team have on the field at one time?",opts:["9","10","11","12"],ans:2},
  {q:"Which NFL team plays home games at Lambeau Field?",opts:["Chicago Bears","Green Bay Packers","Minnesota Vikings","Detroit Lions"],ans:1},
  {q:"What happens on a 'sack' play?",opts:["The QB scores a touchdown","The QB is tackled behind the line of scrimmage","The kicker misses a field goal","The offense fumbles"],ans:1},
  {q:"Who holds the NFL record for most career passing touchdowns?",opts:["Peyton Manning","Brett Favre","Drew Brees","Tom Brady"],ans:3},
  {q:"Which team plays home games at Arrowhead Stadium?",opts:["Denver Broncos","Las Vegas Raiders","Kansas City Chiefs","Los Angeles Chargers"],ans:2},
  {q:"What year was the NFL founded?",opts:["1910","1915","1920","1925"],ans:2},
  {q:"Which running back set the single-season rushing record with 2,105 yards in 1984?",opts:["Walter Payton","Eric Dickerson","Barry Sanders","Jim Brown"],ans:1},
  {q:"What is it called when a receiver catches the ball in the end zone for a score?",opts:["Field Goal","Safety","Touchdown","Extra Point"],ans:2},
  {q:"Which conference do the Dallas Cowboys play in?",opts:["AFC East","NFC East","AFC South","NFC South"],ans:1},
  {q:"How many downs does an offense have to gain 10 yards for a first down?",opts:["3","4","5","6"],ans:1},
  {q:"The Pittsburgh Steelers have won how many Super Bowls?",opts:["4","5","6","7"],ans:2},
];

// ── TRIVIA DATA ───────────────────────────────────────────────────────────────
const PDX_TRIVIA=[
  {q:"What year did Portland MAX first open?",opts:["1982","1984","1986","1990"],ans:2},
  {q:"Which MAX line serves PDX Airport?",opts:["Blue","Green","Orange","Red"],ans:3},
  {q:"How deep underground is Washington Park station?",opts:["100 feet","180 feet","260 feet","320 feet"],ans:2},
  {q:"Which MAX line opened most recently?",opts:["Red","Yellow","Green","Orange"],ans:3},
  {q:"What year did the Yellow Line open?",opts:["1998","2001","2004","2008"],ans:2},
  {q:"What is TriMet's main MAX maintenance facility called?",opts:["Gateway Yard","Ruby Junction","Beaverton Depot","Gresham Hub"],ans:1},
  {q:"Which bridge does the Orange Line cross exclusively?",opts:["Hawthorne Bridge","Steel Bridge","Burnside Bridge","Tilikum Crossing"],ans:3},
  {q:"The Rosa Parks station is on which MAX line?",opts:["Blue","Green","Orange","Yellow"],ans:3},
  {q:"Which station serves the Portland Trail Blazers arena?",opts:["Convention Center","Lloyd Center","Rose Quarter TC","NE 7th Avenue"],ans:2},
  {q:"What is the western terminus of the Blue Line?",opts:["Hillsboro Central","Orenco","Quatama","Hatfield Government Center"],ans:3},
  {q:"The Expo Center station is the northern terminus of which line?",opts:["Green","Blue","Yellow","Red"],ans:2},
  {q:"What year did the Red Line to Portland Airport open?",opts:["1998","2001","2003","2007"],ans:1},
  {q:"How many lines does Portland MAX have?",opts:["4","5","6","7"],ans:1},
  {q:"Orenco Station is celebrated as an example of what?",opts:["Historic preservation","Transit-oriented development","Brutalist architecture","Green infrastructure"],ans:1},
  {q:"Which MAX line crosses Tilikum Crossing — America's first car-free bridge?",opts:["Blue","Red","Green","Orange"],ans:3},
  {q:"The MAX Blue Line runs between which two cities?",opts:["Portland and Salem","Gresham and Hillsboro","Portland and Beaverton","Portland and Troutdale"],ans:1},
  {q:"Which MAX line serves Clackamas Town Center?",opts:["Blue","Orange","Green","Red"],ans:2},
  {q:"What year did the MAX Green Line open?",opts:["2006","2007","2009","2011"],ans:2},
  {q:"Which Portland attraction sits directly above Washington Park station?",opts:["Crystal Springs Garden","Oregon Zoo","OMSI","Hoyt Arboretum"],ans:1},
  {q:"What is the name of the transit agency that operates Portland MAX?",opts:["TriMet","SMART","C-TRAN","Portland Transit"],ans:0},
  {q:"Tilikum Crossing is notable because it prohibits what?",opts:["Cyclists","Pedestrians","Private cars","Transit buses"],ans:2},
  {q:"Which MAX station is located directly at Portland International Airport?",opts:["Gateway TC","PDX Airport","Cascades","Parkrose/Sumner TC"],ans:1},
  {q:"Portland MAX trains are powered by which system?",opts:["Diesel","Natural Gas","Electric overhead wire","Hydrogen"],ans:2},
  {q:"Which MAX line runs along Interstate Avenue in North Portland?",opts:["Blue","Green","Yellow","Orange"],ans:2},
  {q:"Gateway Transit Center is a hub for which combination of MAX lines?",opts:["Blue and Green","Blue, Green and Red","Red and Orange","Green and Yellow"],ans:1},
  {q:"What is the eastern terminus of the MAX Blue Line?",opts:["Clackamas Town Center","Gresham Central TC","Cleveland Ave","Gateway TC"],ans:2},
];
const DC_TRIVIA=[
  {q:"What year did the DC Metro first open?",opts:["1972","1974","1976","1980"],ans:2},
  {q:"Which station has the longest escalator in the Western Hemisphere?",opts:["Forest Glen","Medical Center","Bethesda","Wheaton"],ans:3},
  {q:"What is the deepest DC Metro station?",opts:["Wheaton","Forest Glen","Bethesda","Medical Center"],ans:1},
  {q:"How many lines does the Washington DC Metro have?",opts:["4","5","6","7"],ans:2},
  {q:"Which station serves the US Capitol building?",opts:["Union Station","Judiciary Square","Federal Triangle","Capitol South"],ans:3},
  {q:"What year did the Silver Line reach Dulles Airport?",opts:["2019","2020","2021","2022"],ans:3},
  {q:"Which architect designed the Metro's iconic coffered vault ceilings?",opts:["I.M. Pei","Eero Saarinen","Harry Weese","Ludwig Mies van der Rohe"],ans:2},
  {q:"Which station is the busiest in the WMATA system?",opts:["Farragut North","Union Station","Gallery Place","Metro Center"],ans:3},
  {q:"What does WMATA stand for?",opts:["Washington Metro Area Transit Agency","Washington Metropolitan Area Transit Authority","Washington Municipal Area Transportation Authority","Washington Metro Area Transportation Alliance"],ans:1},
  {q:"Which Metro station serves the National Archives?",opts:["Judiciary Square","Federal Triangle","Smithsonian","Archives-Navy Memorial"],ans:3},
  {q:"The Silver Line Phase 1 originally terminated at which station?",opts:["McLean","Tysons Corner","Spring Hill","Wiehle-Reston East"],ans:3},
  {q:"Fort Totten is a transfer point between which lines?",opts:["Red and Blue","Red and Orange","Red, Yellow and Green","Orange, Silver and Blue"],ans:2},
  {q:"Which DC Metro station is nearest to the White House?",opts:["Farragut North","McPherson Square","Federal Triangle","Farragut West"],ans:1},
  {q:"How long does it take to ride Wheaton's famous escalator?",opts:["45 seconds","1.5 minutes","2.5 minutes","4 minutes"],ans:2},
  {q:"Which DC Metro line serves Huntington and Eisenhower Avenue?",opts:["Blue","Orange","Green","Yellow"],ans:3},
  {q:"Which DC Metro line serves Ronald Reagan Washington National Airport?",opts:["Blue","Yellow","Green","Orange"],ans:1},
  {q:"Which architect designed the DC Metro's iconic coffered barrel-vault ceilings?",opts:["I.M. Pei","Frank Lloyd Wright","Harry Weese","Eero Saarinen"],ans:2},
  {q:"Which station connects the most DC Metro lines (5 lines)?",opts:["Gallery Place","Metro Center","Farragut North","L'Enfant Plaza"],ans:3},
  {q:"DC Metro trains receive power from which source?",opts:["Overhead wire","Third rail","Diesel","Battery"],ans:1},
  {q:"Pentagon station is served by which two lines?",opts:["Red and Orange","Blue and Yellow","Green and Silver","Orange and Silver"],ans:1},
  {q:"What year did the Silver Line Phase 1 first open?",opts:["2010","2012","2014","2016"],ans:2},
  {q:"Union Station is served by which Metro line?",opts:["Red only","Red and Blue","Red, Orange and Silver","Blue and Orange"],ans:0},
  {q:"Which DC Metro station is closest to the Lincoln Memorial?",opts:["Smithsonian","Foggy Bottom","Federal Triangle","L'Enfant Plaza"],ans:1},
  {q:"Anacostia station is on which Metro line?",opts:["Green","Yellow","Blue","Orange"],ans:0},
  {q:"Which station serves the Smithsonian Institution museums on the National Mall?",opts:["Federal Triangle","Archives","Smithsonian","L'Enfant Plaza"],ans:2},
  {q:"How many total stations does the DC Metro system have?",opts:["82","91","98","106"],ans:2},
];
const STATES_TRIVIA=[
  {q:"Which state is the largest by area?",opts:["Texas","California","Alaska","Montana"],ans:2},
  {q:"Which state was the first to ratify the US Constitution?",opts:["Virginia","Pennsylvania","Delaware","Massachusetts"],ans:2},
  {q:"What year did both Alaska and Hawaii become states?",opts:["1955","1957","1959","1961"],ans:2},
  {q:"Which state produces 95% of the world's bourbon whiskey?",opts:["Tennessee","Kentucky","Indiana","Virginia"],ans:1},
  {q:"Which is the most densely populated US state?",opts:["Rhode Island","New Jersey","Connecticut","Massachusetts"],ans:1},
  {q:"The Gateway Arch is located in which city?",opts:["Kansas City","Memphis","St. Louis","Chicago"],ans:2},
  {q:"Which state has the longest coastline of the contiguous 48?",opts:["California","Texas","Florida","Georgia"],ans:2},
  {q:"Which state was the first to grant women the right to vote?",opts:["Colorado","Utah","Wyoming","Kansas"],ans:2},
  {q:"What is the smallest US state by area?",opts:["Delaware","Connecticut","Rhode Island","New Hampshire"],ans:2},
  {q:"Which state produces the most apples?",opts:["New York","Michigan","Oregon","Washington"],ans:3},
  {q:"Which US state has the most 14,000-foot peaks?",opts:["Wyoming","Utah","Colorado","Montana"],ans:2},
  {q:"The Wright Brothers made their first flight in which state?",opts:["Virginia","North Carolina","Ohio","Georgia"],ans:1},
  {q:"Which state has more rivers than any other?",opts:["Minnesota","Alaska","Missouri","Nebraska"],ans:3},
  {q:"Which state has the highest capital city in the US?",opts:["Colorado","Utah","New Mexico","Nevada"],ans:2},
  {q:"Which state was an independent republic for 10 years?",opts:["California","Hawaii","Florida","Texas"],ans:3},
  {q:"Which state is home to Mount Rushmore?",opts:["Wyoming","Montana","North Dakota","South Dakota"],ans:3},
  {q:"Which state is nicknamed the 'Land of 10,000 Lakes'?",opts:["Wisconsin","Minnesota","Michigan","Iowa"],ans:1},
  {q:"What is the capital of California?",opts:["Los Angeles","San Francisco","Sacramento","San Diego"],ans:2},
  {q:"Which state produces the most oil in the United States?",opts:["Alaska","California","North Dakota","Texas"],ans:3},
  {q:"Which US state is nicknamed the 'Sunshine State'?",opts:["California","Arizona","Florida","Hawaii"],ans:2},
  {q:"Which state has the longest total coastline in the entire US?",opts:["Florida","California","Alaska","Hawaii"],ans:2},
  {q:"Which state is home to the Grand Canyon?",opts:["Utah","Nevada","New Mexico","Arizona"],ans:3},
  {q:"What is the capital of Texas?",opts:["Houston","Dallas","San Antonio","Austin"],ans:3},
  {q:"Yellowstone National Park is primarily located in which state?",opts:["Montana","Idaho","Colorado","Wyoming"],ans:3},
  {q:"Which state is home to the most US national parks?",opts:["Wyoming","Colorado","Alaska","California"],ans:3},
  {q:"Which state became the 49th state admitted to the Union?",opts:["Hawaii","New Mexico","Arizona","Alaska"],ans:3},
];

// ── ANIMATED CITY BACKGROUND ──────────────────────────────────────────────────
function CityBackground(){
  return(
    <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      <style>{`
        @keyframes cityTrain1{0%{transform:translateX(110vw)}100%{transform:translateX(-120vw)}}
        @keyframes cityTrain2{0%{transform:translateX(110vw)}100%{transform:translateX(-120vw)}}
        @keyframes cityTrain3{0%{transform:translateX(110vw)}100%{transform:translateX(-120vw)}}
        @keyframes cityBldgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes cityGlow{0%,100%{opacity:0.06}50%{opacity:0.12}}
        @keyframes cityTrack{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* Background layer: slow-moving buildings (20s cycle) */}
      <svg style={{position:"absolute",bottom:0,left:0,width:"200%",height:"45%",opacity:0.07,animation:"cityTrack 20s linear infinite"}} viewBox="0 0 2400 300" preserveAspectRatio="none">
        {/* Building silhouettes — repeated for seamless loop */}
        {[0,1200].map(ox=>(
          <g key={ox} transform={`translate(${ox},0)`}>
            <rect x="20" y="80" width="60" height="220" fill="#4a6fff"/>
            <rect x="30" y="60" width="40" height="30" fill="#4a6fff"/>
            <rect x="100" y="40" width="80" height="260" fill="#028A48"/>
            <rect x="110" y="20" width="60" height="30" fill="#028A48"/>
            <rect x="200" y="100" width="50" height="200" fill="#BF0000"/>
            <rect x="270" y="60" width="90" height="240" fill="#1a3a8f"/>
            <rect x="280" y="30" width="70" height="40" fill="#1a3a8f"/>
            <rect x="380" y="120" width="40" height="180" fill="#4a6fff"/>
            <rect x="440" y="50" width="70" height="250" fill="#028A48"/>
            <rect x="450" y="20" width="50" height="40" fill="#028A48"/>
            <rect x="530" y="90" width="55" height="210" fill="#BF0000"/>
            <rect x="600" y="70" width="80" height="230" fill="#1a3a8f"/>
            <rect x="610" y="40" width="60" height="40" fill="#1a3a8f"/>
            <rect x="700" y="110" width="45" height="190" fill="#4a6fff"/>
            <rect x="760" y="55" width="65" height="245" fill="#028A48"/>
            <rect x="840" y="85" width="75" height="215" fill="#BF0000"/>
            <rect x="850" y="55" width="55" height="40" fill="#BF0000"/>
            <rect x="930" y="45" width="85" height="255" fill="#1a3a8f"/>
            <rect x="940" y="15" width="65" height="40" fill="#1a3a8f"/>
            <rect x="1030" y="100" width="50" height="200" fill="#4a6fff"/>
            <rect x="1100" y="65" width="70" height="235" fill="#028A48"/>
            <rect x="1110" y="35" width="50" height="40" fill="#028A48"/>
            {/* Windows */}
            {[20,40,60,80,100,120,140,160,180,200].map(wy=>(
              <g key={wy}>
                <rect x="30" y={wy+80} width="8" height="6" fill="rgba(255,255,255,0.4)" rx="1"/>
                <rect x="50" y={wy+80} width="8" height="6" fill="rgba(255,255,255,0.3)" rx="1"/>
                <rect x="110" y={wy+40} width="10" height="7" fill="rgba(255,255,255,0.35)" rx="1"/>
                <rect x="130" y={wy+40} width="10" height="7" fill="rgba(255,255,255,0.25)" rx="1"/>
                <rect x="280" y={wy+60} width="12" height="8" fill="rgba(255,255,255,0.3)" rx="1"/>
                <rect x="305" y={wy+60} width="12" height="8" fill="rgba(255,255,255,0.2)" rx="1"/>
              </g>
            ))}
          </g>
        ))}
      </svg>

      {/* Mid layer: faster trains (15s cycle) */}
      <div style={{position:"absolute",bottom:"18%",left:0,right:0,height:28,animation:"cityTrain1 15s linear infinite",animationDelay:"0s"}}>
        <svg viewBox="0 0 520 28" style={{height:"100%",width:520,opacity:0.13}}>
          {/* Train car 1 */}
          <rect x="0" y="4" width="120" height="20" rx="4" fill="#028A48"/>
          <rect x="4" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="26" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="48" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="70" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
          <rect x="92" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.4)"/>
          <circle cx="20" cy="25" r="4" fill="#1a1a1a"/>
          <circle cx="100" cy="25" r="4" fill="#1a1a1a"/>
          {/* Connector */}
          <rect x="120" y="12" width="8" height="4" fill="#555"/>
          {/* Train car 2 */}
          <rect x="128" y="4" width="120" height="20" rx="4" fill="#028A48"/>
          <rect x="132" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="154" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="176" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
          <rect x="198" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="220" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <circle cx="148" cy="25" r="4" fill="#1a1a1a"/>
          <circle cx="228" cy="25" r="4" fill="#1a1a1a"/>
          {/* Connector */}
          <rect x="248" y="12" width="8" height="4" fill="#555"/>
          {/* Train car 3 */}
          <rect x="256" y="4" width="120" height="20" rx="4" fill="#028A48"/>
          <rect x="260" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="282" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
          <rect x="304" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="326" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="348" y="8" width="18" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
          <circle cx="276" cy="25" r="4" fill="#1a1a1a"/>
          <circle cx="356" cy="25" r="4" fill="#1a1a1a"/>
          {/* Track line */}
          <line x1="0" y1="27" x2="520" y2="27" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Second train — different color, offset timing */}
      <div style={{position:"absolute",bottom:"32%",left:0,right:0,height:22,animation:"cityTrain2 22s linear infinite",animationDelay:"-8s"}}>
        <svg viewBox="0 0 380 22" style={{height:"100%",width:380,opacity:0.09}}>
          <rect x="0" y="3" width="90" height="16" rx="3" fill="#BF0000"/>
          <rect x="3" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.45)"/>
          <rect x="21" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.35)"/>
          <rect x="39" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.45)"/>
          <rect x="57" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="75" y="6" width="8" height="8" rx="1" fill="rgba(255,255,255,0.4)"/>
          <circle cx="15" cy="20" r="3" fill="#1a1a1a"/>
          <circle cx="75" cy="20" r="3" fill="#1a1a1a"/>
          <rect x="90" y="9" width="6" height="3" fill="#555"/>
          <rect x="96" y="3" width="90" height="16" rx="3" fill="#BF0000"/>
          <rect x="99" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="117" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="135" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="153" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.45)"/>
          <rect x="171" y="6" width="8" height="8" rx="1" fill="rgba(255,255,255,0.35)"/>
          <circle cx="111" cy="20" r="3" fill="#1a1a1a"/>
          <circle cx="171" cy="20" r="3" fill="#1a1a1a"/>
          <rect x="186" y="9" width="6" height="3" fill="#555"/>
          <rect x="192" y="3" width="90" height="16" rx="3" fill="#BF0000"/>
          <rect x="195" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.45)"/>
          <rect x="213" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="231" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="249" y="6" width="14" height="8" rx="1" fill="rgba(255,255,255,0.35)"/>
          <rect x="267" y="6" width="8" height="8" rx="1" fill="rgba(255,255,255,0.4)"/>
          <circle cx="207" cy="20" r="3" fill="#1a1a1a"/>
          <circle cx="267" cy="20" r="3" fill="#1a1a1a"/>
          <line x1="0" y1="21" x2="380" y2="21" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        </svg>
      </div>

      {/* Foreground accent: fast small train (10s cycle) */}
      <div style={{position:"absolute",bottom:"8%",left:0,right:0,height:16,animation:"cityTrain3 10s linear infinite",animationDelay:"-3s"}}>
        <svg viewBox="0 0 260 16" style={{height:"100%",width:260,opacity:0.08}}>
          <rect x="0" y="2" width="60" height="12" rx="2" fill="#1a3a8f"/>
          <rect x="2" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="15" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="28" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="41" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
          <circle cx="10" cy="15" r="2.5" fill="#1a1a1a"/>
          <circle cx="50" cy="15" r="2.5" fill="#1a1a1a"/>
          <rect x="60" y="6" width="5" height="2" fill="#555"/>
          <rect x="65" y="2" width="60" height="12" rx="2" fill="#1a3a8f"/>
          <rect x="67" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="80" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="93" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="106" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.45)"/>
          <circle cx="75" cy="15" r="2.5" fill="#1a1a1a"/>
          <circle cx="115" cy="15" r="2.5" fill="#1a1a1a"/>
          <rect x="125" y="6" width="5" height="2" fill="#555"/>
          <rect x="130" y="2" width="60" height="12" rx="2" fill="#1a3a8f"/>
          <rect x="132" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.5)"/>
          <rect x="145" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.35)"/>
          <rect x="158" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.45)"/>
          <rect x="171" y="4" width="10" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
          <circle cx="140" cy="15" r="2.5" fill="#1a1a1a"/>
          <circle cx="180" cy="15" r="2.5" fill="#1a1a1a"/>
          <line x1="0" y1="15.5" x2="260" y2="15.5" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        </svg>
      </div>

      {/* Subtle grid overlay */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",backgroundSize:"80px 80px",opacity:0.5}}/>
    </div>
  );
}

// ── CONFETTI / PARTICLES ──────────────────────────────────────────────────────
function Confetti(){
  const colors=["#028A48","#D02B27","#FFC72C","#BF0000","#1a3a8f","#fff","#2ecc71","#f39c12","#e74c3c","#3498db"];
  const icons=["🚊","🚇","🚉","🌹","🌸","🦀","🏈","⭐","🦅"];
  const[p]=useState(()=>{
    const pieces=Array.from({length:90},(_,i)=>({id:i,x:Math.random()*100,color:colors[i%colors.length],size:5+Math.random()*8,delay:Math.random()*0.6,dur:1.6+Math.random()*2,rot:Math.random()*360,type:"square" as const}));
    const emojis=Array.from({length:18},(_,i)=>({id:90+i,x:Math.random()*100,icon:icons[i%icons.length],size:14+Math.random()*10,delay:Math.random()*0.4,dur:2+Math.random()*2.2,rot:Math.random()*360,type:"emoji" as const}));
    return[...pieces,...emojis];
  });
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {p.map((pc:any)=>pc.type==="emoji"?(
        <div key={pc.id} style={{position:"absolute",left:`${pc.x}%`,top:-30,fontSize:pc.size,animation:`tpConf ${pc.dur}s ${pc.delay}s ease-in forwards`,transform:`rotate(${pc.rot}deg)`,lineHeight:1}}>{pc.icon}</div>
      ):(
        <div key={pc.id} style={{position:"absolute",left:`${pc.x}%`,top:-20,width:pc.size,height:pc.size,background:pc.color,borderRadius:pc.size>10?"50%":2,animation:`tpConf ${pc.dur}s ${pc.delay}s ease-in forwards`,transform:`rotate(${pc.rot}deg)`}}/>
      ))}
    </div>
  );
}
function Particles({gameKey}:{gameKey:string}){
  const[pts]=useState(()=>Array.from({length:22},(_,i)=>({id:i,x:Math.random()*110-5,delay:Math.random()*8,dur:5+Math.random()*5,size:5+Math.random()*8,drift:Math.random()*70-35,op:0.08+Math.random()*0.18})));
  const shapes:{[k:string]:string}={pdx:"🌹",dc:"🌸",states:"⭐",nfl:"🏈",balt:"🦀",la:"🌴",nyc:"🗽",chi:"💨"};
  const shape=shapes[gameKey]||"✨";
  return(<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>{pts.map(p=>(<div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:0,fontSize:`${p.size}px`,animation:`tpPetal ${p.dur}s ${p.delay}s ease-in infinite`,"--drift":`${p.drift}px`,"--op":p.op,opacity:0} as any}>{shape}</div>))}</div>);
}

// ── PWA INSTALL HOOK ─────────────────────────────────────────────────────────
function usePWAInstall(){
  const[prompt,setPrompt]=useState<any>(null);
  const[installed,setInstalled]=useState(false);
  const isIOS=useMemo(()=>/iphone|ipad|ipod/i.test(navigator.userAgent),[]);
  const isStandalone=useMemo(()=>window.matchMedia("(display-mode: standalone)").matches||(navigator as any).standalone===true,[]);
  useEffect(()=>{
    if(isStandalone){setInstalled(true);return;}
    const handler=(e:any)=>{e.preventDefault();setPrompt(e);};
    const onInstalled=()=>{setInstalled(true);setPrompt(null);};
    window.addEventListener("beforeinstallprompt",handler);
    window.addEventListener("appinstalled",onInstalled);
    return()=>{window.removeEventListener("beforeinstallprompt",handler);window.removeEventListener("appinstalled",onInstalled);};
  },[]);
  const install=async()=>{if(!prompt)return;prompt.prompt();const r=await prompt.userChoice;if(r.outcome==="accepted"){setInstalled(true);setPrompt(null);}};
  return{canNativeInstall:!!prompt&&!installed,install,isIOS,installed:isStandalone||installed};
}

// ── PWA INSTALL MODAL ─────────────────────────────────────────────────────────
function InstallModal({isIOS,hasNativePrompt,onInstall,onClose}:{isIOS:boolean,hasNativePrompt:boolean,onInstall:()=>void,onClose:()=>void}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(17,17,17,0.92)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"32px 28px",maxWidth:380,width:"100%",textAlign:"center",fontFamily:"'JetBrains Mono','Courier New',monospace",boxShadow:"0 24px 80px rgba(0,0,0,.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{fontSize:"36px",marginBottom:10}}>📲</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"16px",fontWeight:900,color:"#e8e8e8",letterSpacing:2,marginBottom:6}}>ADD TO HOME SCREEN</div>
        <div style={{fontSize:"11px",color:"#555",letterSpacing:2,marginBottom:24}}>Play like a native app — no browser bar</div>
        {hasNativePrompt?(
          <>
            <button onClick={()=>{onInstall();onClose();}} style={{width:"100%",background:"linear-gradient(135deg,#028A48,#1a6a38)",color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:"14px",fontWeight:700,letterSpacing:2,padding:"14px",borderRadius:12,cursor:"pointer",marginBottom:12,boxShadow:"0 4px 20px rgba(2,138,72,.3)"}}>INSTALL APP →</button>
            <div style={{fontSize:"10px",color:"#444",letterSpacing:1}}>Your browser supports one-tap install</div>
          </>
        ):isIOS?(
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:"12px",color:"#aaa",lineHeight:2,marginBottom:16}}>
              {[["1.","Open this page in","Safari"],["2.","Tap the","Share icon  ⎙"],["3.","Scroll down and tap","'Add to Home Screen'"],["4.","Tap","'Add' to confirm"]].map(([num,pre,bold],i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                  <span style={{color:"#028A48",fontWeight:700,minWidth:20}}>{num}</span>
                  <span>{pre} <span style={{color:"#e8e8e8",fontWeight:700}}>{bold}</span></span>
                </div>
              ))}
            </div>
            <div style={{background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:10,padding:"10px 14px",fontSize:"10px",color:"#555",letterSpacing:1}}>
              💡 Must be using Safari — Chrome/Firefox on iOS do not support Add to Home Screen
            </div>
          </div>
        ):(
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:"12px",color:"#aaa",lineHeight:2,marginBottom:16}}>
              {[["Chrome/Edge:","Open menu (⋮) → 'Add to Home Screen' or 'Install App'"],["Firefox:","Open menu → 'Install'"],["Samsung:","Open menu → 'Add page to' → 'Home screen'"]].map(([browser,step],i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <span style={{color:"#028A48",fontWeight:700}}>{browser}</span><br/>
                  <span style={{color:"#888"}}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#444",fontSize:"11px",letterSpacing:2,cursor:"pointer",fontFamily:"inherit",padding:"10px 8px 0",display:"block",width:"100%",marginTop:8}}>CLOSE</button>
      </div>
    </div>
  );
}

// ── STREAK CALENDAR ───────────────────────────────────────────────────────────
function StreakCalendar({dark}:{dark:boolean}){
  const dayNum=useMemo(getDayNum,[]);
  const[activity,setActivity]=useState<Record<number,number>>({});
  useEffect(()=>{getActivityLog().then(setActivity);},[]);
  const days=Array.from({length:14},(_,i)=>dayNum-13+i);
  const emptyCol=dark?"#222":"#e8e8e8";
  const labelCol=dark?"#444":"#bbb";
  const borderToday=dark?"#028A48":"#028A48";
  return(
    <div style={{padding:"10px 16px 0",maxWidth:520,margin:"0 auto",width:"100%"}}>
      <div style={{fontSize:"9px",letterSpacing:2,color:labelCol,marginBottom:7,textAlign:"center"}}>ACTIVITY — LAST 14 DAYS</div>
      <div style={{display:"flex",gap:5,justifyContent:"center"}}>
        {days.map(d=>{
          const played=!!activity[d];
          const isToday=d===dayNum;
          return(
            <div key={d} title={`Day #${d}${played?" — played":""}`}
              style={{width:17,height:17,borderRadius:4,background:played?"#028A48":emptyCol,border:isToday?`2px solid ${borderToday}`:"2px solid transparent",boxSizing:"border-box",transition:"background .2s",flexShrink:0}}/>
          );
        })}
      </div>
    </div>
  );
}

// ── START PAGE ────────────────────────────────────────────────────────────────
function getBetaCode():string{
  const key="tgg:betacode";
  const existing=localStorage.getItem(key);
  if(existing)return existing;
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand="";
  for(let i=0;i<6;i++)rand+=chars[Math.floor(Math.random()*chars.length)];
  const code=`TGG-${getDayNum()}-${rand}`;
  localStorage.setItem(key,code);
  return code;
}

function PeekModal({T,fs,gameKey,target,DIFF,rd,cost,onConfirm,onClose}:{T:any,fs:any,gameKey:string,target:any,DIFF:any,rd:any,cost:number,onConfirm:()=>void,onClose:()=>void}){
  const[confirmed,setConfirmed]=useState(false);
  if(!confirmed){
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()} style={{background:`${T.bg}ee`,border:`1.5px solid rgba(255,90,40,.5)`,borderRadius:14,padding:"24px 20px 20px",maxWidth:380,width:"100%",fontFamily:"'JetBrains Mono',monospace",boxShadow:"0 8px 40px rgba(0,0,0,.7)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:"40px",marginBottom:6}}>🗺️</div>
            <div style={{fontSize:fs(16),fontWeight:900,color:"#6496e0",letterSpacing:2,marginBottom:4}}>MAP PEEK</div>
            <div style={{fontSize:fs(8),color:T.textMuted,letterSpacing:1}}>Show a transit line schematic with the station marked</div>
          </div>
          {cost>0&&(
            <div style={{background:"rgba(255,90,40,.1)",border:"1.5px solid rgba(255,90,40,.4)",borderRadius:10,padding:"12px 14px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:fs(13),fontWeight:800,color:"#e07050",marginBottom:3}}>⚠️ Costs {cost} guess{cost!==1?"es":""}</div>
              <div style={{fontSize:fs(9),color:"#c06040"}}>{(()=>{const remaining=(DIFF.maxGuesses-rd.guesses.length-(rd.peekPenalty||0))-cost;return`You will have ${remaining} guess${remaining!==1?"es":""} remaining after peeking.`;})()}</div>
            </div>
          )}
          {cost<=0&&(
            <div style={{background:"rgba(40,180,80,.08)",border:"1px solid rgba(40,180,80,.3)",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"center",fontSize:fs(9),color:"#40b060"}}>
              ✓ Free peek — you already used most guesses.
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{onConfirm();setConfirmed(true);}} style={{flex:1,background:T.accent,color:"#fff",border:"none",borderRadius:8,padding:"12px 0",fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:fs(11),letterSpacing:2,cursor:"pointer"}}>
              {cost>0?`USE PEEK (−${cost})`:"USE PEEK"}
            </button>
            <button onClick={onClose} style={{flex:1,background:T.surface,color:T.text,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 0",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:fs(11),letterSpacing:1,cursor:"pointer"}}>CANCEL</button>
          </div>
        </div>
      </div>
    );
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:`${T.bg}ee`,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"22px 18px 18px",maxWidth:400,width:"100%",fontFamily:"'JetBrains Mono',monospace",boxShadow:"0 8px 40px rgba(0,0,0,.6)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
        <div style={{textAlign:"center",marginBottom:2}}>
          <span style={{fontSize:fs(20),fontWeight:900,color:"#6496e0",letterSpacing:2}}>🗺️ SYSTEM PEEK</span>
        </div>
        <div style={{fontSize:fs(8),color:T.textMuted,textAlign:"center",letterSpacing:1,marginBottom:16}}>transit line schematic · station shown as pulse marker</div>
        <div style={{marginBottom:14}}>
          {(PEEK_LINES[gameKey]||[]).map((line:any)=>{
            const active=(target.lines||[]).includes(line.name);
            const pos=active?getPeekPos(target.zone,line.name,gameKey):0.5;
            return(
              <div key={line.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9,opacity:active?1:0.18}}>
                <div style={{width:54,fontSize:fs(7),fontWeight:800,color:active?line.color:"#555",letterSpacing:1.5,textAlign:"right",flexShrink:0,textShadow:active?`0 0 8px ${line.color}66`:"none"}}>{line.name.toUpperCase()}</div>
                <div style={{flex:1,position:"relative",height:16}}>
                  <div style={{position:"absolute",left:6,right:6,height:4,background:active?line.color:"#2a2a2a",borderRadius:3,top:"50%",transform:"translateY(-50%)",boxShadow:active?`0 0 6px ${line.color}55`:"none"}}/>
                  <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:12,height:12,borderRadius:"50%",background:active?line.color:"#2a2a2a",boxShadow:active?`0 0 5px ${line.color}88`:"none"}}/>
                  <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",width:12,height:12,borderRadius:"50%",background:active?line.color:"#2a2a2a",boxShadow:active?`0 0 5px ${line.color}88`:"none"}}/>
                  {active&&(<div style={{position:"absolute",left:`calc(${pos*100}% - 9px)`,top:"50%",transform:"translateY(-50%)",width:18,height:18,borderRadius:"50%",background:T.bg,border:`3px solid ${line.color}`,zIndex:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:900,color:line.color,animation:"peekPulse 1.3s ease-in-out infinite",boxShadow:`0 0 10px ${line.color}99`}}>?</div>)}
                </div>
                <div style={{width:60,fontSize:fs(7),color:active?T.textMuted:"#333",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"left"}}>{active?line.end:""}</div>
              </div>
            );
          })}
        </div>
        <div style={{background:T.surface,borderRadius:7,padding:"7px 12px",marginBottom:12,fontSize:fs(10),color:T.textSub,textAlign:"center",border:`1px solid ${T.border}`}}>
          📍 Zone: <strong style={{color:T.text}}>{target.zone}</strong>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,background:T.accent,color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:fs(11),letterSpacing:2,cursor:"pointer"}}>CLOSE MAP</button>
        </div>
      </div>
    </div>
  );
}

function BetaModal({code,onClose}:{code:string,onClose:()=>void}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const formUrl="https://forms.gle/MCqtdQJbYcPRb4yz7";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"20px",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(17,17,17,0.92)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:24,padding:"36px 32px",maxWidth:420,width:"100%",textAlign:"center",fontFamily:"'JetBrains Mono','Courier New',monospace",boxShadow:"0 24px 80px rgba(0,0,0,.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{fontSize:"32px",marginBottom:12}}>🎖️</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"18px",fontWeight:900,color:"#e8e8e8",letterSpacing:2,marginBottom:8}}>BETA TESTER REWARD</div>
        <div style={{fontSize:"11px",color:"#555",letterSpacing:2,marginBottom:24}}>Thank you for testing UrbanIQ!</div>
        <div style={{fontSize:"11px",color:"#666",letterSpacing:1,marginBottom:10}}>YOUR VALIDATION CODE</div>
        <div style={{background:"#0a0a0a",border:"1px solid #333",borderRadius:12,padding:"18px 24px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"20px",fontWeight:700,letterSpacing:4,color:"#028A48"}}>{code}</span>
          <button onClick={copy} style={{background:copied?"#028A48":"#1a1a1a",border:`1px solid ${copied?"#028A48":"#333"}`,color:copied?"#fff":"#888",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:"11px",letterSpacing:1,fontFamily:"inherit",transition:"all .2s",whiteSpace:"nowrap"}}>
            {copied?"COPIED ✓":"COPY"}
          </button>
        </div>
        <div style={{fontSize:"10px",color:"#444",letterSpacing:1,marginBottom:28}}>This code is unique to your device. Keep it safe.</div>
        <div style={{fontSize:"11px",color:"#666",lineHeight:1.7,marginBottom:24}}>
          Copy your code above, then open the feedback form.<br/>
          Paste it into the <span style={{color:"#c8c8c8"}}>"Validation Code"</span> field to claim your reward.
        </div>
        <a href={formUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"block",background:"linear-gradient(135deg,#1a3a8f,#0d2260)",color:"#fff",textDecoration:"none",fontFamily:"'Cinzel',serif",fontSize:"13px",fontWeight:700,letterSpacing:2,padding:"14px 24px",borderRadius:12,marginBottom:12,boxShadow:"0 4px 20px rgba(26,58,143,.3)",transition:"opacity .15s"}}
          onMouseEnter={e=>(e.currentTarget as HTMLAnchorElement).style.opacity=".85"}
          onMouseLeave={e=>(e.currentTarget as HTMLAnchorElement).style.opacity="1"}>
          OPEN FEEDBACK FORM →
        </a>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#444",fontSize:"11px",letterSpacing:2,cursor:"pointer",fontFamily:"inherit",padding:"8px"}}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ── GAME HINT ANIMATION ───────────────────────────────────────────────────────
function GameHintAnimation(){
  const hints=[
    {word:"BEAVERTON TC",    label:"Portland MAX",    emoji:"🚊", color:"#028A48"},
    {word:"DUPONT CIRCLE",   label:"DC Metro",        emoji:"🚇", color:"#BF0000"},
    {word:"MONTANA",         label:"US States",       emoji:"🗺️", color:"#1a3a8f"},
    {word:"CHIEFS",          label:"NFL Teams",       emoji:"🏈", color:"#E31837"},
    {word:"CAMDEN YARDS",    label:"Baltimore MTA",   emoji:"🚉", color:"#003087"},
    {word:"UNION STATION",   label:"Portland MAX",    emoji:"🚊", color:"#028A48"},
    {word:"FOGGY BOTTOM",    label:"DC Metro",        emoji:"🚇", color:"#BF0000"},
    {word:"KENTUCKY",        label:"US States",       emoji:"🗺️", color:"#1a3a8f"},
    {word:"GREEN BAY",       label:"NFL Teams",       emoji:"🏈", color:"#203731"},
    {word:"OWINGS MILLS",    label:"Baltimore MTA",   emoji:"🚉", color:"#003087"},
    {word:"PIONEER SQUARE",  label:"Portland MAX",    emoji:"🚊", color:"#028A48"},
    {word:"ROSSLYN",         label:"DC Metro",        emoji:"🚇", color:"#BF0000"},
    {word:"WYOMING",         label:"US States",       emoji:"🗺️", color:"#1a3a8f"},
    {word:"RAVENS",          label:"NFL Teams",       emoji:"🏈", color:"#241773"},
    {word:"BWI AIRPORT",     label:"Baltimore MTA",   emoji:"🚉", color:"#003087"},
  ];
  const[idx,setIdx]=useState(0);
  const[revealed,setRevealed]=useState(0);
  const[fade,setFade]=useState(true);
  const cur=hints[idx];
  useEffect(()=>{
    if(!fade)return;
    if(revealed<cur.word.length){
      const t=setTimeout(()=>setRevealed(r=>r+1),75);
      return()=>clearTimeout(t);
    }
    const t=setTimeout(()=>{
      setFade(false);
      setTimeout(()=>{setIdx(i=>(i+1)%hints.length);setRevealed(0);setFade(true);},350);
    },1800);
    return()=>clearTimeout(t);
  },[revealed,idx,fade]);
  return(
    <div style={{marginBottom:36,textAlign:"center",animation:"spFadeIn .2s ease both",opacity:fade?1:0,transition:"opacity .2s ease"}}>
      <div style={{display:"inline-flex",alignItems:"flex-end",gap:3,justifyContent:"center",flexWrap:"wrap",maxWidth:320,margin:"0 auto 10px"}}>
        {cur.word.split("").map((ch,i)=>(
          ch===" "
            ?<span key={i} style={{width:6,display:"inline-block"}}/>
            :<span key={i} style={{
                display:"inline-flex",alignItems:"center",justifyContent:"center",
                width:13,height:20,
                borderBottom:`2px solid ${i<revealed?cur.color:"rgba(0,0,0,0.13)"}`,
                color:i<revealed?"#0a0a0a":"transparent",
                fontSize:"11px",fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                letterSpacing:0,lineHeight:1,
                transition:"color .08s,border-color .15s",
              }}>{ch}</span>
        ))}
        {revealed<cur.word.length&&(
          <span style={{width:2,height:14,background:cur.color,display:"inline-block",marginBottom:2,animation:"spPulse .9s infinite"}}/>
        )}
      </div>
      <div style={{fontSize:"9px",letterSpacing:2.5,color:cur.color,fontFamily:"'Inter',sans-serif",fontWeight:600,opacity:.75}}>
        {cur.emoji} {cur.label.toUpperCase()}
      </div>
    </div>
  );
}

// ── SUPPORTER MODAL ──────────────────────────────────────────────────────────
function SupporterModal({onClose,isSupporter,supporterEmail}:{onClose:()=>void,isSupporter:boolean,supporterEmail?:string}){
  const[email,setEmail]=useState(supporterEmail||"");
  const[loading,setLoading]=useState(false);
  const[products,setProducts]=useState<any[]>([]);
  const[err,setErr]=useState<string|null>(null);
  useEffect(()=>{
    fetch("/api/stripe/products").then(r=>r.json()).then(d=>{if(d.data)setProducts(d.data);}).catch(()=>{});
  },[]);
  const supporterProduct=products.find(p=>p.name?.includes("Supporter"));
  const monthlyPrice=supporterProduct?.prices?.find((p:any)=>p.recurring?.interval==="month");
  const yearlyPrice=supporterProduct?.prices?.find((p:any)=>p.recurring?.interval==="year");
  async function checkout(priceId:string){
    if(!email.includes("@")){setErr("Enter a valid email address");return;}
    setLoading(true);setErr(null);
    try{
      const res=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,priceId,origin:window.location.origin})});
      const data=await res.json();
      if(data.url)window.location.href=data.url;
      else{setErr(data.error||"Something went wrong");setLoading(false);}
    }catch{setErr("Network error — try again");setLoading(false);}
  }
  async function portal(){
    if(!email.includes("@")){setErr("Enter your supporter email");return;}
    setLoading(true);setErr(null);
    try{
      const res=await fetch("/api/stripe/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,origin:window.location.origin})});
      const data=await res.json();
      if(data.url)window.location.href=data.url;
      else{setErr(data.error||"Subscription not found");setLoading(false);}
    }catch{setErr("Network error");setLoading(false);}
  }
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"spFadeIn .2s ease both"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(255,255,255,0.94)",borderRadius:8,padding:"36px 32px",maxWidth:440,width:"100%",fontFamily:"'Inter','Helvetica Neue',sans-serif",boxShadow:"0 32px 80px rgba(0,0,0,0.2)",position:"relative",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:"18px",cursor:"pointer",color:"rgba(0,0,0,0.35)",lineHeight:1}}>✕</button>
        <div style={{fontSize:"11px",letterSpacing:3,color:"rgba(0,0,0,0.35)",marginBottom:8,fontWeight:700}}>SUPPORT THE GAME</div>
        <h2 style={{margin:"0 0 6px",fontSize:24,fontWeight:700,letterSpacing:-0.5}}>Become a Supporter</h2>
        <p style={{margin:"0 0 24px",fontSize:13,color:"rgba(0,0,0,0.5)",lineHeight:1.7}}>Keep UrbanIQ free &amp; ad-free forever. Supporters get exclusive perks.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
          {[["🛡️","Streak Shields","1 skip/month"],["🏆","Leaderboard Badge","Stand out on board"],["🎨","Exclusive Themes","Dark &amp; high-contrast"]].map(([icon,title,sub])=>(
            <div key={title} style={{background:"#f8f8f8",borderRadius:6,padding:"12px 8px",textAlign:"center",border:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:.5,lineHeight:1.3}}>{title}</div>
              <div style={{fontSize:9,color:"rgba(0,0,0,0.4)",marginTop:3,letterSpacing:.3}} dangerouslySetInnerHTML={{__html:sub}}/>
            </div>
          ))}
        </div>
        <input
          type="email" placeholder="your@email.com"
          value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",padding:"11px 14px",border:"1px solid rgba(0,0,0,0.18)",borderRadius:5,fontSize:13,fontFamily:"'Inter',sans-serif",marginBottom:12,boxSizing:"border-box",outline:"none"}}
        />
        {err&&<div style={{fontSize:12,color:"#c0392b",marginBottom:10,fontWeight:500}}>{err}</div>}
        {!isSupporter?(
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            {monthlyPrice?(
              <button onClick={()=>checkout(monthlyPrice.id)} disabled={loading} style={{flex:1,padding:"13px 8px",background:"#0a0a0a",color:"#fff",border:"none",borderRadius:5,cursor:loading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.5,opacity:loading?.6:1}}>
                <div>${((monthlyPrice.unit_amount||300)/100).toFixed(0)}<span style={{fontWeight:400}}>/mo</span></div>
                <div style={{fontSize:9,fontWeight:400,opacity:.7,marginTop:2}}>MONTHLY</div>
              </button>
            ):(
              <button onClick={()=>checkout("monthly-placeholder")} disabled={loading} style={{flex:1,padding:"13px 8px",background:"#0a0a0a",color:"#fff",border:"none",borderRadius:5,cursor:loading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.5,opacity:loading?.6:1}}>
                <div>$3<span style={{fontWeight:400}}>/mo</span></div>
                <div style={{fontSize:9,fontWeight:400,opacity:.7,marginTop:2}}>MONTHLY</div>
              </button>
            )}
            {yearlyPrice?(
              <button onClick={()=>checkout(yearlyPrice.id)} disabled={loading} style={{flex:1,padding:"13px 8px",background:"linear-gradient(135deg,#028A48,#1a3a8f)",color:"#fff",border:"none",borderRadius:5,cursor:loading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.5,opacity:loading?.6:1,position:"relative"}}>
                <div style={{position:"absolute",top:-8,right:8,background:"#f59e0b",color:"#000",fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:10,letterSpacing:.5}}>SAVE 31%</div>
                <div>${((yearlyPrice.unit_amount||2500)/100).toFixed(0)}<span style={{fontWeight:400}}>/yr</span></div>
                <div style={{fontSize:9,fontWeight:400,opacity:.7,marginTop:2}}>YEARLY</div>
              </button>
            ):(
              <button onClick={()=>checkout("yearly-placeholder")} disabled={loading} style={{flex:1,padding:"13px 8px",background:"linear-gradient(135deg,#028A48,#1a3a8f)",color:"#fff",border:"none",borderRadius:5,cursor:loading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:12,letterSpacing:.5,opacity:loading?.6:1,position:"relative"}}>
                <div style={{position:"absolute",top:-8,right:8,background:"#f59e0b",color:"#000",fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:10,letterSpacing:.5}}>SAVE 31%</div>
                <div>$25<span style={{fontWeight:400}}>/yr</span></div>
                <div style={{fontSize:9,fontWeight:400,opacity:.7,marginTop:2}}>YEARLY</div>
              </button>
            )}
          </div>
        ):(
          <div style={{marginBottom:16}}>
            <div style={{background:"linear-gradient(135deg,#028A48,#1a3a8f)",borderRadius:6,padding:"12px 16px",color:"#fff",textAlign:"center",marginBottom:10}}>
              <div style={{fontSize:18,marginBottom:2}}>❤️</div>
              <div style={{fontWeight:700,fontSize:13,letterSpacing:.5}}>You're a Supporter!</div>
              <div style={{fontSize:11,opacity:.8,marginTop:2}}>Thank you for keeping this game free &amp; ad-free.</div>
            </div>
            <button onClick={portal} disabled={loading} style={{width:"100%",padding:"11px",background:"none",border:"1px solid rgba(0,0,0,0.15)",borderRadius:5,cursor:loading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,letterSpacing:.5,color:"rgba(0,0,0,0.6)"}}>
              {loading?"Loading...":"Manage Subscription →"}
            </button>
          </div>
        )}
        <div style={{fontSize:10,color:"rgba(0,0,0,0.3)",textAlign:"center",letterSpacing:.3}}>
          Secure payments via Stripe · Cancel anytime · No hidden fees
        </div>
      </div>
    </div>
  );
}

// ── CARD PROGRESS WIDGET ──────────────────────────────────────────────────────
function CardProgressWidget({dark,onOpenCards}:{dark:boolean,onOpenCards?:()=>void}){
  const GAMES_KEYS=["pdx","dc","states","nfl","balt","la","nyc","chi"];
  const today=new Date().toISOString().slice(0,10);
  // Count today's wins across all games (max 15 total: 5 games × 3 rounds each)
  const [todayWins,setTodayWins]=useState(0);
  const [cardCount,setCardCount]=useState(0);
  const [nextMilestone,setNextMilestone]=useState(3);
  useEffect(()=>{
    const run=async()=>{
      let wins=0;
      for(const gameKey of GAMES_KEYS){
        for(let r=0;r<3;r++){
          try{const d=await getFromStorage(`${gameKey}:today:${today}r${r}`,null);if(d?.won)wins++;}catch{}
        }
      }
      const cc=JSON.parse(localStorage.getItem("tgg-card-col")||"[]").length;
      setTodayWins(wins);
      setCardCount(cc);
      const prog=wins%3;
      setNextMilestone(prog===0&&wins>0?3:3-prog);
    };
    run();
    window.addEventListener('tgg-win',run as EventListener);
    return()=>window.removeEventListener('tgg-win',run as EventListener);
  },[]);
  const prog=todayWins%3;
  const pct=prog===0&&todayWins>0?100:(prog/3)*100;
  const bg=dark?"rgba(255,255,255,0.04)":"#fff";
  const border=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)";
  const txt=dark?"#fff":"#0a0a0a";
  const txt2=dark?"rgba(255,255,255,.45)":"rgba(0,0,0,.45)";
  const txt3=dark?"rgba(255,255,255,.25)":"rgba(0,0,0,.25)";
  const milestoneReached=prog===0&&todayWins>0;
  return(
    <div onClick={onOpenCards} style={{maxWidth:600,margin:"0 auto",width:"100%",padding:"0 24px 16px",boxSizing:"border-box",position:"relative",zIndex:10,cursor:onOpenCards?"pointer":"default"}}>
      <style>{`@keyframes cpPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes cpShine{0%{left:-60%}100%{left:120%}}`}</style>
      <div style={{background:bg,border:`1px solid ${border}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
        {/* Card icon with pulse on milestone */}
        <div style={{width:44,height:44,borderRadius:10,background:milestoneReached?"linear-gradient(135deg,#c8a800,#ffe566)":"linear-gradient(135deg,#1a1a2e,#16213e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:milestoneReached?"0 0 18px #c8a80080":"none",animation:milestoneReached?"cpPulse 1.5s ease-in-out infinite":"none",position:"relative",overflow:"hidden"}}>
          🃏
          {milestoneReached&&<div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)",width:"60%",animation:"cpShine 1.5s ease-in-out infinite"}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{fontSize:11,fontWeight:700,color:milestoneReached?"#c8a800":txt,letterSpacing:.3}}>
              {milestoneReached?"🎉 Card Earned! Go collect it →":"Card Progress"}
            </div>
            <div style={{fontSize:9,color:txt3,letterSpacing:1}}>{cardCount} COLLECTED</div>
          </div>
          {/* Progress bar */}
          <div style={{height:6,background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:3,overflow:"hidden",marginBottom:5,position:"relative"}}>
            <div style={{height:"100%",width:`${pct}%`,background:milestoneReached?"linear-gradient(90deg,#c8a800,#ffe566)":"linear-gradient(90deg,#7c3aed,#028A48)",borderRadius:3,transition:"width .6s cubic-bezier(.4,0,.2,1)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:9,color:txt2}}>
              {milestoneReached?`${todayWins} wins today — open the Cards tab`:`${prog}/3 wins toward next card · ${todayWins} total today`}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<prog||milestoneReached?(i===2&&milestoneReached?"#c8a800":"#028A48"):(dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"),transition:"background .3s"}}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAPS & GUIDES MODAL ───────────────────────────────────────────────────────
function MapsGuideModal({onClose,onSelectGame}:{onClose:()=>void,onSelectGame:(gk:string)=>void}){
  const[tab,setTab]=useState("transit");
  const TRANSIT_SYSTEMS=[
    {key:"pdx",name:"Portland MAX",emoji:"🚊",accent:"#028A48",sub:"TriMet Light Rail · Pacific Northwest",lines:[
      {name:"Blue",color:"#0066CC",start:"Hillsboro",end:"Gresham",stations:["Hillsboro","Beaverton TC","Sunset TC","Goose Hollow","Pioneer Sq","Lloyd District","Gateway","Gresham"]},
      {name:"Red",color:"#CC0000",start:"Beaverton TC",end:"PDX Airport",stations:["Beaverton TC","Sunset TC","Gateway","PDX Airport"]},
      {name:"Green",color:"#009933",start:"PSU",end:"Clackamas TC",stations:["PSU","Lloyd District","Gateway","Clackamas TC"]},
      {name:"Orange",color:"#FF6600",start:"SW Waterfront",end:"Milwaukie",stations:["SW Waterfront","OMSI","SE Main","Park Ave","Milwaukie"]},
      {name:"Yellow",color:"#CCAA00",start:"Expo Center",end:"Rose Quarter",stations:["Expo Center","Lombard","Delta Park","Rose Quarter"]},
    ],stats:"97 stations · 5 lines · 60 miles of track"},
    {key:"dc",name:"DC Metro",emoji:"🚇",accent:"#BF0000",sub:"WMATA · Nation's Capital",lines:[
      {name:"Red",color:"#BF0000",start:"Shady Grove",end:"Glenmont",stations:["Shady Grove","Rockville","Bethesda","Friendship Hts","Tenleytown","Woodley Park","Dupont Cir","Farragut N","Metro Center","Union Station","Glenmont"]},
      {name:"Blue",color:"#0066CC",start:"Franconia-Spfld",end:"Largo TC",stations:["Franconia-Spfld","Van Dorn","King St","Pentagon","Rosslyn","Foggy Bottom","McPherson Sq","Metro Center","Capitol South","Largo TC"]},
      {name:"Orange",color:"#FF8000",start:"Vienna",end:"New Carrollton",stations:["Vienna","Dunn Loring","West Falls Ch","Ballston","Rosslyn","Foggy Bottom","McPherson Sq","Metro Center","New Carrollton"]},
      {name:"Silver",color:"#A0A8B0",start:"Ashburn",end:"Largo TC",stations:["Ashburn","Dulles","Wiehle-Reston","McLean","Rosslyn","Foggy Bottom","McPherson Sq","L'Enfant","Largo TC"]},
      {name:"Green",color:"#009933",start:"Branch Ave",end:"Greenbelt",stations:["Branch Ave","Southern Ave","Congress Hts","L'Enfant","Gallery Pl","U St","Columbia Hts","Fort Totten","Greenbelt"]},
      {name:"Yellow",color:"#CCAA00",start:"Huntington",end:"Greenbelt",stations:["Huntington","Eisenhower","King St","Pentagon","L'Enfant","Gallery Pl","Fort Totten","Greenbelt"]},
    ],stats:"98 stations · 6 lines · 129 miles of track"},
    {key:"balt",name:"Baltimore MTA",emoji:"🚉",accent:"#003087",sub:"Maryland Transit · Charm City",lines:[
      {name:"Metro",color:"#003087",start:"Owings Mills",end:"Johns Hopkins",stations:["Owings Mills","Old Court","Milford Mill","Reisterstown","Rogers Ave","West Cold Spring","Mondawmin","Penn North","Upton","State Center","Lexington Mkt","Charles Center","Shot Tower","Johns Hopkins Hosp"]},
      {name:"Light Rail",color:"#F0A500",start:"Hunt Valley",end:"Cromwell",stations:["Hunt Valley","Timonium","Lutherville","Penn Station","North Ave","Lexington Mkt","Camden Yards","Stadiums","Cherry Hill","Cromwell"]},
    ],stats:"14 metro + 33 light rail stations"},
    {key:"la",name:"LA Metro",emoji:"🌴",accent:"#E3051B",sub:"Los Angeles County · SoCal",lines:[
      {name:"A (Blue)",color:"#0072BC",start:"Santa Monica",end:"Long Beach",stations:["Santa Monica","Culver City","Expo/Western","Expo Pk/USC","7th/Metro","Pershing Sq","Pico","Long Beach TC"]},
      {name:"B (Red)",color:"#E3051B",start:"Wilshire/Western",end:"North Hollywood",stations:["Wilshire/Western","Wilshire/Vermont","Koreatown","7th/Metro","Pershing Sq","Civic Center","Union Station","Hollywood/Vine","North Hollywood"]},
      {name:"C (Green)",color:"#5B8731",start:"Redondo Beach",end:"Norwalk",stations:["Redondo Beach","Aviation/LAX","Hawthorne","Vermont","Harbor Fwy","Norwalk"]},
      {name:"D (Purple)",color:"#8D1F8C",start:"Wilshire/Western",end:"Little Tokyo",stations:["Wilshire/Western","Wilshire/Vermont","7th/Metro","Pershing Sq","Little Tokyo"]},
      {name:"E (Expo)",color:"#FDB913",start:"Downtown Santa Monica",end:"7th/Metro",stations:["Downtown Santa Monica","17th/SMC","Bergamot","Expo/Bundy","Palms","Expo/Crenshaw","Vermont/Expo","7th/Metro"]},
    ],stats:"109 stations · 6 rail lines · 105 miles"},
    {key:"nyc",name:"NYC Subway",emoji:"🗽",accent:"#0039A6",sub:"New York City Transit · MTA",lines:[
      {name:"1/2/3",color:"#EE352E",start:"South Ferry",end:"Wakefield",stations:["South Ferry","Chambers St","Fulton St","14 St-Union Sq","Times Sq","72 St","96 St","116 St","145 St","168 St","Van Cortlandt"]},
      {name:"4/5/6",color:"#00933C",start:"Bowling Green",end:"Woodlawn",stations:["Bowling Green","Fulton St","Grand Central","86 St","96 St","125 St","149 St-Grand Concourse","161 St-Yankee Stadium","Pelham Bay Pk","Woodlawn"]},
      {name:"A/C/E",color:"#0039A6",start:"Far Rockaway",end:"207 St",stations:["Far Rockaway","Howard Beach","JFK AirTrain","Jay St","Fulton St","14 St","34 St-Penn Station","Times Sq","59 St-Columbus Circle","125 St (A/B/C)","207 St"]},
      {name:"N/Q/R/W",color:"#FCCC0A",start:"Bay Ridge-95 St",end:"Astoria-Ditmars",stations:["Bay Ridge-95 St","Borough Hall","DeKalb Av","Atlantic Av","14 St-Union Sq","Times Sq","57 St-7 Av","Astoria-Ditmars"]},
      {name:"L",color:"#A7A9AC",start:"8 Av",end:"Canarsie",stations:["8 Av","6 Av","14 St-Union Sq","1 Av","Graham Av","Myrtle-Wyckoff Avs","Canarsie"]},
      {name:"7",color:"#B933AD",start:"34 St-Hudson Yards",end:"Flushing-Main St",stations:["34 St-Hudson Yards","Times Sq","5 Av","74 St-Roosevelt Av","Jackson Hts","Flushing-Main St"]},
    ],stats:"472 stations · 36 lines · 245 miles of track"},
    {key:"chi",name:"Chicago L",emoji:"🌬️",accent:"#C60C30",sub:"Chicago Transit Authority · The Loop",lines:[
      {name:"Red",color:"#C60C30",start:"95th/Dan Ryan",end:"Howard",stations:["95th/Dan Ryan","Sox-35th","Roosevelt","Harrison","Jackson","Grand/State","Chicago","Belmont","Addison","Lawrence","Loyola","Howard"]},
      {name:"Blue",color:"#00A1DE",start:"Forest Park",end:"O'Hare",stations:["Forest Park","UIC-Halsted","Monroe","Jackson","Clark/Lake","Chicago","Logan Square","Jefferson Park","Rosemont","O'Hare"]},
      {name:"Brown",color:"#62361B",start:"Kimball",end:"Loop",stations:["Kimball","Francisco","Western","Damen","Diversey","Fullerton","Belmont","Wellington","Southport","Paulina","Armitage","Sedgwick","Chicago","Merchandise Mart","Clark/Lake"]},
      {name:"Green",color:"#009B3A",start:"Harlem/Lake",end:"Cottage Grove",stations:["Harlem/Lake","Oak Park","Laramie","Pulaski","Ashland","Clinton","Clark/Lake","State/Lake","Roosevelt","35th-Bronzeville","43rd St","Cottage Grove"]},
      {name:"Orange",color:"#F9461C",start:"Midway",end:"Loop",stations:["Midway","Kedzie","Western","35th/Archer","Ashland","Halsted","Roosevelt","Harold Washington Library","Clark/Lake"]},
      {name:"Purple",color:"#522398",start:"Linden",end:"Howard",stations:["Linden","Central","Noyes","Davis","Main","Dempster","Foster","Howard"]},
    ],stats:"145 stations · 8 lines · 224 miles of track"},
  ];
  const NON_TRANSIT=[
    {key:"states",name:"US States",emoji:"🗺️",accent:"#1a3a8f",sub:"All 50 states · Geography & Capitals",desc:"Guess each US state based on region, size, coast, capital city, and year of admission. Seven geographic regions from New England to the Pacific Coast."},
    {key:"nfl",name:"NFL Teams",emoji:"🏈",accent:"#013369",sub:"32 franchises · AFC & NFC",desc:"Identify NFL teams by conference, division, city, Super Bowl wins, and founding year. All 32 active franchises across 8 divisions."},
  ];
  const[selSys,setSelSys]=useState(TRANSIT_SYSTEMS[0].key);
  const sys=TRANSIT_SYSTEMS.find(s=>s.key===selSys)||TRANSIT_SYSTEMS[0];
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"12px",backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(250,250,250,0.95)",borderRadius:20,width:"100%",maxWidth:680,maxHeight:"88vh",overflowY:"auto",fontFamily:"'Inter','Helvetica Neue',sans-serif",boxShadow:"0 32px 100px rgba(0,0,0,0.5)",animation:"obIn .18s ease both",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <style>{`@keyframes obIn{from{opacity:0;transform:scale(.96) translateY(16px)}to{opacity:1;transform:none}}.mg-sys-btn{transition:all .15s;}.mg-sys-btn:hover{opacity:.85;}.mg-line-station{font-size:10px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:6px;padding:4px 8px;color:#333;white-space:nowrap;}`}</style>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid rgba(0,0,0,.08)"}}>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"18px",fontWeight:700,color:"#0a0a0a",letterSpacing:1}}>Maps &amp; Guides</div>
            <div style={{fontSize:"10px",color:"rgba(0,0,0,.35)",letterSpacing:2,marginTop:2}}>ALL GAMES · STATION MAPS · SYSTEM INFO</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid rgba(0,0,0,.12)",borderRadius:20,padding:"6px 16px",fontSize:"11px",color:"rgba(0,0,0,.38)",cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:1,fontWeight:600}}>✕ CLOSE</button>
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(0,0,0,.08)",background:"#fff"}}>
          {[["transit","🚊 Transit Systems"],["other","🗺️ Other Games"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id as string)}
              style={{flex:1,background:"transparent",border:"none",borderBottom:`2.5px solid ${tab===id?"#0a0a0a":"transparent"}`,padding:"12px 0",fontSize:"11px",fontWeight:tab===id?700:500,color:tab===id?"#0a0a0a":"rgba(0,0,0,.38)",cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:1,transition:"all .15s"}}>
              {label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{padding:"20px 24px 28px"}}>
          {tab==="transit"&&(
            <>
              {/* System selector */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                {TRANSIT_SYSTEMS.map(s=>(
                  <button key={s.key} className="mg-sys-btn" onClick={()=>setSelSys(s.key)}
                    style={{background:selSys===s.key?s.accent:"#fff",color:selSys===s.key?"#fff":"rgba(0,0,0,.55)",border:`1.5px solid ${selSys===s.key?s.accent:"rgba(0,0,0,.1)"}`,borderRadius:20,padding:"7px 16px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:.5,display:"flex",alignItems:"center",gap:6}}>
                    <span>{s.emoji}</span>{s.name}
                  </button>
                ))}
              </div>
              {/* System card */}
              <div style={{background:"#fff",border:"1px solid rgba(0,0,0,.08)",borderRadius:14,overflow:"hidden",marginBottom:16}}>
                <div style={{background:`linear-gradient(135deg,${sys.accent},${sys.accent}cc)`,padding:"16px 20px",color:"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:"28px"}}>{sys.emoji}</span>
                    <div>
                      <div style={{fontSize:"16px",fontWeight:700,letterSpacing:.3}}>{sys.name}</div>
                      <div style={{fontSize:"10px",opacity:.75,marginTop:2,letterSpacing:1}}>{sys.sub}</div>
                    </div>
                    <button onClick={()=>onSelectGame(sys.key)} style={{marginLeft:"auto",background:"rgba(255,255,255,.2)",border:"1.5px solid rgba(255,255,255,.5)",color:"#fff",borderRadius:20,padding:"8px 18px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:1,backdropFilter:"blur(4px)"}}>PLAY →</button>
                  </div>
                  <div style={{fontSize:"10px",opacity:.65,marginTop:10,letterSpacing:.5}}>{sys.stats}</div>
                </div>
                <div style={{padding:"16px 20px"}}>
                  {sys.lines.map((ln:any)=>(
                    <div key={ln.name} style={{marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{background:ln.color,color:"#fff",fontSize:"9px",fontWeight:700,padding:"2px 8px",borderRadius:3,letterSpacing:.5,flexShrink:0}}>{ln.name}</div>
                        <div style={{fontSize:"10px",color:"rgba(0,0,0,.35)",letterSpacing:.5}}>{ln.start} → {ln.end}</div>
                      </div>
                      <div style={{position:"relative",height:28,display:"flex",alignItems:"center"}}>
                        <div style={{position:"absolute",left:0,right:0,height:3,background:ln.color,borderRadius:2,opacity:.25}}/>
                        <div style={{display:"flex",gap:0,width:"100%",justifyContent:"space-between",position:"relative",zIndex:1,overflowX:"auto",paddingBottom:2}}>
                          {ln.stations.map((st:string,i:number)=>(
                            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ln.color,border:"2px solid #fff",boxShadow:`0 0 0 1px ${ln.color}`,flexShrink:0}}/>
                              <div style={{fontSize:"7px",color:"rgba(0,0,0,.5)",whiteSpace:"nowrap",maxWidth:52,textOverflow:"ellipsis",overflow:"hidden",textAlign:"center",lineHeight:1.2}}>{st}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{fontSize:"10px",color:"rgba(0,0,0,.3)",textAlign:"center",letterSpacing:1}}>Station maps are simplified. Each game includes all major stations.</div>
            </>
          )}
          {tab==="other"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {NON_TRANSIT.map(g=>(
                <div key={g.key} style={{background:"#fff",border:"1px solid rgba(0,0,0,.08)",borderRadius:14,overflow:"hidden"}}>
                  <div style={{background:`linear-gradient(135deg,${g.accent},${g.accent}cc)`,padding:"14px 20px",color:"#fff",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:"26px"}}>{g.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"15px",fontWeight:700}}>{g.name}</div>
                      <div style={{fontSize:"10px",opacity:.7,marginTop:2,letterSpacing:.5}}>{g.sub}</div>
                    </div>
                    <button onClick={()=>onSelectGame(g.key)} style={{background:"rgba(255,255,255,.2)",border:"1.5px solid rgba(255,255,255,.5)",color:"#fff",borderRadius:20,padding:"7px 16px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",letterSpacing:1}}>PLAY →</button>
                  </div>
                  <div style={{padding:"14px 20px",fontSize:"13px",color:"rgba(0,0,0,.55)",lineHeight:1.7}}>{g.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DkCard({g,featured,delay,darkHov,setDarkHov,onSelectGame}:{g:any,featured?:boolean,delay?:number,darkHov:string|null,setDarkHov:(k:string|null)=>void,onSelectGame:(k:string)=>void}){
  const hov=darkHov===g.key;
  if(featured){return(
    <div onClick={()=>{SoundEngine.play("select");onSelectGame(g.key);}}
      onMouseEnter={()=>setDarkHov(g.key)} onMouseLeave={()=>setDarkHov(null)}
      style={{border:`1px solid ${hov?g.color:"rgba(255,255,255,0.1)"}`,borderRadius:3,padding:"28px 32px",cursor:"pointer",
        background:hov?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",
        position:"relative",overflow:"hidden",transition:"border-color .2s,background .2s",marginBottom:12,
        animation:"spFadeIn .2s ease both",boxShadow:hov?`0 0 40px ${g.color}22`:"none"}}>
      {g.photo&&<img src={g.photo} alt="" onError={(e)=>{(e.target as HTMLElement).style.display="none";}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:hov?0.48:0.32,transition:"opacity .3s",filter:"brightness(0.65) saturate(1.3)"}}/>}
      <div style={{position:"absolute",inset:0,background:`linear-gradient(120deg,rgba(0,0,0,0.75) 40%,${g.color}18 100%)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:20,position:"relative",zIndex:1}}>
        <div style={{width:64,height:64,borderRadius:4,background:g.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",flexShrink:0,boxShadow:`0 4px 24px ${g.color}50`}}>{g.emoji}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:"9px",letterSpacing:3,color:g.color,fontWeight:700}}>{g.tag}</span>
            <span style={{fontSize:"9px",letterSpacing:2,background:g.color,color:"#fff",padding:"2px 8px",borderRadius:2,fontWeight:700}}>🔥 HOT TODAY</span>
          </div>
          <div style={{fontSize:"24px",fontWeight:700,letterSpacing:-0.5,color:"#fff",marginBottom:4}}>{g.name}</div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",letterSpacing:1}}>{g.sub}</div>
        </div>
        <div style={{fontSize:"28px",color:hov?g.color:"rgba(255,255,255,0.15)",transition:"color .2s,transform .2s",transform:hov?"translateX(6px)":"none"}}>→</div>
      </div>
      <div style={{marginTop:20,position:"relative",zIndex:1}}>
        <button style={{background:g.color,color:"#fff",border:"none",padding:"14px 36px",fontFamily:"'Inter',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"3px",cursor:"pointer",borderRadius:2,opacity:hov?1:.88,transition:"opacity .15s"}}>PLAY NOW →</button>
      </div>
    </div>
  );}
  return(
    <div onClick={()=>{SoundEngine.play("select");onSelectGame(g.key);}}
      onMouseEnter={()=>setDarkHov(g.key)} onMouseLeave={()=>setDarkHov(null)}
      style={{border:`1px solid ${hov?g.color:"rgba(255,255,255,0.06)"}`,borderRadius:3,cursor:"pointer",
        background:"rgba(255,255,255,0.015)",
        position:"relative",overflow:"hidden",transition:"border-color .2s,background .2s",
        animation:"spFadeIn .2s ease both",boxShadow:hov?`0 0 20px ${g.color}1a`:"none"}}>
      {g.photo&&<div style={{height:90,overflow:"hidden",position:"relative"}}>
        <img src={g.photo} alt="" onError={(e)=>{(e.target as HTMLElement).style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",opacity:hov?0.7:0.5,transition:"opacity .3s,transform .3s",transform:hov?"scale(1.04)":"scale(1)",filter:"brightness(0.75) saturate(1.2)"}}/>
        <div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.85) 100%)`}}/>
        <div style={{position:"absolute",bottom:6,left:10,fontSize:"8px",letterSpacing:2,color:"rgba(255,255,255,0.5)",fontWeight:700}}>{g.tag}</div>
      </div>}
      <div style={{padding:"12px 14px",position:"relative",zIndex:1}}>
        {!g.photo&&<div style={{display:"flex",alignItems:"center",gap:3,marginBottom:8}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:g.color,animation:"spHotPulse 2s ease infinite"}}/>
          <span style={{fontSize:"9px",letterSpacing:2,color:"rgba(255,255,255,0.3)",marginLeft:4}}>{g.tag}</span>
        </div>}
        <div style={{fontSize:"20px",marginBottom:6}}>{g.emoji}</div>
        <div style={{fontSize:"13px",fontWeight:600,color:"#fff",letterSpacing:.3,marginBottom:3}}>{g.name}</div>
        <div style={{fontSize:"10px",letterSpacing:1,color:"rgba(255,255,255,0.28)"}}>{g.sub.toUpperCase()}</div>
      </div>
    </div>
  );
}
function StartPage({onBegin,onSelectGame,initialShowSupport,settings}:{onBegin:()=>void,onSelectGame:(gk:string)=>void,initialShowSupport?:boolean,settings?:any}){
  const dayNum=useMemo(getDayNum,[]);
  const hotGameKey=useMemo(()=>{const d=new Date().getDay();return d===0?"nyc":d===1?"pdx":d===2?"dc":d===3?"states":d===4?"nfl":d===5?"la":d===6?"chi":"balt";},[]);
  const [showBeta,setShowBeta]=useState(false);
  const [showInstall,setShowInstall]=useState(false);
  const [showSupport,setShowSupport]=useState(!!initialShowSupport);
  const [showMaps,setShowMaps]=useState(false);
  const [betaCode]=useState(()=>getBetaCode());
  const {canNativeInstall,install,isIOS,installed}=usePWAInstall();
  const [hoveredGame,setHoveredGame]=useState<string|null>(null);
  const [isSupporter]=useState(()=>!!localStorage.getItem("supporter_email"));
  const [supporterEmail]=useState(()=>localStorage.getItem("supporter_email")||"");
  const [topStreak,setTopStreak]=useState(0);
  useEffect(()=>{(async()=>{const keys=["pdx","dc","states","nfl","balt","la","nyc","chi"];const streaks=await Promise.all(keys.map(k=>getFromStorage(`${k}:stats`,{streak:0}).then((s:any)=>s?.streak||0)));setTopStreak(Math.max(...streaks));})();},[]);
  const [notifEnabled,setNotifEnabled]=useState(()=>localStorage.getItem("tgg:notif:sub")==="1");
  const [notifLoading,setNotifLoading]=useState(false);
  const [notifMsg,setNotifMsg]=useState<string|null>(null);
  const notifMsgTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [heroImgUrl,setHeroImgUrl]=useState<string|null>(null);
  const [heroImgFailed,setHeroImgFailed]=useState(false);
  useEffect(()=>{
    setHeroImgUrl(null);setHeroImgFailed(false);
    const wikiTerms:{[k:string]:string}={pdx:"Portland, Oregon",dc:"Washington Metro",balt:"Baltimore",la:"Los Angeles",nyc:"New York City Subway",chi:"Chicago L",states:"United States Capitol",nfl:"National Football League",minigames:"Arcade game"};
    const term=wikiTerms[hotGameKey]||hotCard.name;
    getWikiImage(term).then(url=>{if(url)setHeroImgUrl(url);else setHeroImgFailed(true);});
  },[hotGameKey]);

  function showNotifMsg(msg:string){
    if(notifMsgTimer.current)clearTimeout(notifMsgTimer.current);
    setNotifMsg(msg);
    notifMsgTimer.current=setTimeout(()=>setNotifMsg(null),4000);
  }

  const pushSupported=typeof window!=="undefined"&&"serviceWorker" in navigator&&"PushManager" in window;

  async function urlBase64ToUint8Array(base64String:string){
    const padding="=".repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
    const rawData=atob(base64);
    return Uint8Array.from([...rawData].map(c=>c.charCodeAt(0)));
  }

  async function toggleNotif(){
    if(notifLoading||!pushSupported)return;
    setNotifLoading(true);
    try{
      if(notifEnabled){
        const reg=await navigator.serviceWorker.ready;
        const sub=await reg.pushManager.getSubscription();
        if(sub){
          await sub.unsubscribe();
          await fetch("/api/notifications/unsubscribe",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:sub.endpoint})}).catch(()=>{});
        }
        localStorage.removeItem("tgg:notif:sub");
        setNotifEnabled(false);
        showNotifMsg("Reminders turned off.");
      }else{
        const perm=await Notification.requestPermission();
        if(perm!=="granted"){
          showNotifMsg("Enable notifications in your browser settings first.");
          setNotifLoading(false);
          return;
        }
        const keyRes=await fetch("/api/notifications/vapid-public-key");
        if(!keyRes.ok){showNotifMsg("Could not enable notifications right now.");setNotifLoading(false);return;}
        const{key}=await keyRes.json();
        const reg=await navigator.serviceWorker.ready;
        const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:await urlBase64ToUint8Array(key)});
        const subJson=sub.toJSON() as{endpoint:string;keys:{p256dh:string;auth:string}};
        const saveRes=await fetch("/api/notifications/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:subJson.endpoint,keys:subJson.keys})});
        if(!saveRes.ok){showNotifMsg("Could not save subscription. Try again.");setNotifLoading(false);return;}
        localStorage.setItem("tgg:notif:sub","1");
        setNotifEnabled(true);
        showNotifMsg("🔔 Daily reminders on! We'll nudge you at 8 AM Pacific.");
      }
    }catch(err:any){
      showNotifMsg(err?.message||"Could not update notification settings.");
    }finally{
      setNotifLoading(false);
    }
  }
  const gameCards=[
    {key:"pdx",  emoji:"🚊",name:"Portland MAX",   tag:"TRANSIT",    sub:"Light rail · Pacific NW",   color:"#028A48",grad:"linear-gradient(135deg,#028A48,#016a36)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/TriMet_MAX_Blue_Line_at_Library_%26_SW_9th_Ave_station.jpg/800px-TriMet_MAX_Blue_Line_at_Library_%26_SW_9th_Ave_station.jpg"},
    {key:"dc",   emoji:"🚇",name:"DC Metro",       tag:"TRANSIT",    sub:"Subway · Nation's capital",  color:"#BF0000",grad:"linear-gradient(135deg,#BF0000,#8a0000)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Washington_Metro_Center_station.jpg/800px-Washington_Metro_Center_station.jpg"},
    {key:"balt", emoji:"🚉",name:"Baltimore MTA",  tag:"TRANSIT",    sub:"Light Rail & Metro · MD",    color:"#003087",grad:"linear-gradient(135deg,#003087,#F0A500)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Baltimore_Metro_SubwayLink.jpg/800px-Baltimore_Metro_SubwayLink.jpg"},
    {key:"la",   emoji:"🌴",name:"LA Metro",       tag:"TRANSIT",    sub:"Metro Rail · Los Angeles, CA",color:"#0072bc",grad:"linear-gradient(135deg,#0072bc,#005a96)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Los_Angeles_Union_Station_train_hall.jpg/800px-Los_Angeles_Union_Station_train_hall.jpg"},
    {key:"nyc",  emoji:"🗽",name:"NYC Subway",     tag:"TRANSIT",    sub:"MTA · New York City, NY",    color:"#EE352E",grad:"linear-gradient(135deg,#EE352E,#a01010)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Times_Square_station_42nd_Street.jpg/800px-Times_Square_station_42nd_Street.jpg"},
    {key:"chi",  emoji:"🌬️",name:"Chicago L",    tag:"TRANSIT",    sub:"CTA · Chicago, IL",           color:"#C60C30",grad:"linear-gradient(135deg,#C60C30,#850920)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Clark-Lake_station_Chicago_L.jpg/800px-Clark-Lake_station_Chicago_L.jpg"},
    {key:"states",emoji:"🗺️",name:"US States",   tag:"GEOGRAPHY",  sub:"50 states · Regions",        color:"#1a3a8f",grad:"linear-gradient(135deg,#1a3a8f,#B22234)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/United_States_Capitol_west_front_edit2.jpg/800px-United_States_Capitol_west_front_edit2.jpg"},
    {key:"nfl",  emoji:"🏈",name:"NFL Teams",      tag:"SPORTS",     sub:"32 franchises · History",    color:"#013369",grad:"linear-gradient(135deg,#013369,#d4af37)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Lambeau_Field_aerial_view.jpg/800px-Lambeau_Field_aerial_view.jpg"},
    {key:"minigames",emoji:"🎮",name:"Mini Games", tag:"ARCADE",     sub:"Blitz · Trivia · Challenges",color:"#7c3aed",grad:"linear-gradient(135deg,#7c3aed,#db2777)",photo:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Pac-man_arcade_game.jpg/800px-Pac-man_arcade_game.jpg"},
  ];
  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  const dark=settings?.dark===true;
  const hotCard=gameCards.find(g=>g.key===hotGameKey)||gameCards[0];
  const nonHotCards=gameCards.filter(g=>g.key!==hotGameKey);
  const transitCards=nonHotCards.filter(g=>g.tag==="TRANSIT");
  const geoSportsCards=nonHotCards.filter(g=>g.tag==="GEOGRAPHY"||g.tag==="SPORTS");
  const arcadeCards=nonHotCards.filter(g=>g.tag==="ARCADE");
  // Scan-line tick for dark mode (always runs, no hook-in-conditional)
  const[scanTick,setScanTick]=useState(0);
  useEffect(()=>{if(!dark)return;const id=setInterval(()=>setScanTick(t=>t+1),300);return()=>clearInterval(id);},[dark]);
  const scanY=(scanTick*1.8)%900;
  // Hover tracking for featured light-mode card & dark arcade cards
  const[featHov,setFeatHov]=useState(false);
  const[darkHov,setDarkHov]=useState<string|null>(null);
  const[hotIdx,setHotIdx]=useState(0);
  const hotDragStart=useRef<number|null>(null);
  const[activeTab,setActiveTab]=useState<string>("all");
  const[collapsedSections,setCollapsedSections]=useState<Set<string>>(new Set(["TRANSIT","GEOGRAPHY","SPORTS","ARCADE"]));
  const toggleSection=(tag:string)=>setCollapsedSections(prev=>{const n=new Set(prev);n.has(tag)?n.delete(tag):n.add(tag);return n;});

  const modals=(
    <>
      {showBeta&&<BetaModal code={betaCode} onClose={()=>setShowBeta(false)}/>}
      {showInstall&&<InstallModal isIOS={isIOS} hasNativePrompt={canNativeInstall} onInstall={install} onClose={()=>setShowInstall(false)}/>}
      {showSupport&&<SupporterModal isSupporter={isSupporter} supporterEmail={supporterEmail} onClose={()=>setShowSupport(false)}/>}
      {showMaps&&<MapsGuideModal onClose={()=>setShowMaps(false)} onSelectGame={onSelectGame}/>}
    </>
  );

  /* ── DARK MODE — Futuristic Tesla-inspired hub ──────────────────────────── */
  if(dark){
    const dNavBtn:any={fontSize:"11px",letterSpacing:"2px",color:"rgba(255,255,255,0.35)",cursor:"pointer",transition:"color .2s",background:"none",border:"none",fontFamily:"'Inter',sans-serif",padding:0,whiteSpace:"nowrap"};
    return(
      <div style={{minHeight:"100dvh",background:"#000",color:"#fff",fontFamily:"'Inter','Helvetica Neue',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;700&display=swap" rel="stylesheet"/>
        <style>{`
          @keyframes spFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
          @keyframes spLineGrow{from{width:0}to{width:100%}}
          @keyframes spShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
          @keyframes spHotPulse{0%,100%{opacity:.5}50%{opacity:1}}
          @keyframes spFlame{0%,100%{transform:scaleY(1) rotate(-2deg)}33%{transform:scaleY(1.15) rotate(2deg)}66%{transform:scaleY(0.9) rotate(-1deg)}}
          @keyframes spScan{0%{top:-1px}100%{top:100%}}
          @keyframes dkBlob1{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(70px,-50px) scale(1.15)}50%{transform:translate(-30px,70px) scale(0.9)}75%{transform:translate(40px,30px) scale(1.08)}}
          @keyframes dkBlob2{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-60px,50px) scale(0.88)}50%{transform:translate(55px,-60px) scale(1.12)}75%{transform:translate(-20px,-35px) scale(0.95)}}
          @keyframes dkBlob3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(35px,55px) scale(1.1)}50%{transform:translate(-45px,-40px) scale(0.92)}75%{transform:translate(65px,-20px) scale(1.06)}}
          .dk-tab-btn{font-size:10px;letter-spacing:2px;font-weight:700;padding:7px 14px;border-radius:20px;border:1px solid transparent;cursor:pointer;transition:all .18s,transform 200ms ease;font-family:'Inter',sans-serif;white-space:nowrap;background:none;color:rgba(255,255,255,0.3);}
          .dk-tab-btn.active{color:#fff;border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);}
          .dk-tab-btn:hover{color:rgba(255,255,255,0.7);transform:translateY(-1px);}
          .dk-tab-btn:active{transform:scale(0.96);}
          .uiq-btn{transition:transform 200ms ease,box-shadow 200ms ease !important;}
          .uiq-btn:hover{transform:translateY(-2px) !important;box-shadow:0 4px 16px rgba(0,0,0,0.3) !important;}
          .uiq-btn:active{transform:scale(0.96) !important;box-shadow:none !important;}
          @media(max-width:600px){
            .sp-dark-nav{padding:20px 20px !important;}
            .sp-dark-nav-right{gap:14px !important;}
            .sp-dark-hero{padding:28px 16px 16px !important;}
            .sp-dark-grid{padding:0 14px 28px !important;}
          }
        `}</style>

        {/* Animated blob background */}
        <div aria-hidden="true" style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
          <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(2,138,72,0.15) 0%,transparent 70%)",top:"-20%",left:"-15%",animation:"dkBlob1 24s ease-in-out infinite",filter:"blur(60px)"}}/>
          <div style={{position:"absolute",width:550,height:550,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,58,143,0.18) 0%,transparent 70%)",top:"25%",right:"-15%",animation:"dkBlob2 30s ease-in-out infinite",filter:"blur(65px)"}}/>
          <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(191,0,0,0.12) 0%,transparent 70%)",bottom:"-15%",left:"20%",animation:"dkBlob3 36s ease-in-out infinite",filter:"blur(70px)"}}/>
          <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(191,0,0,0.1) 0%,transparent 70%)",top:"60%",right:"15%",animation:"dkBlob3 20s ease-in-out infinite reverse",filter:"blur(55px)"}}/>
          <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"80px 80px"}}/>
        </div>
        {/* Scan line */}
        <div style={{position:"absolute",left:0,right:0,top:scanY,height:1,background:"linear-gradient(90deg,transparent,rgba(2,138,72,0.2),rgba(26,58,143,0.2),transparent)",pointerEvents:"none",zIndex:1}}/>

        {notifMsg&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,0.95)",color:"#000",fontSize:"12px",letterSpacing:1,padding:"12px 22px",borderRadius:4,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.5)",pointerEvents:"none",whiteSpace:"nowrap"}}>{notifMsg}</div>}

        {/* Nav */}
        <nav className="sp-dark-nav" style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"28px 48px",borderBottom:"1px solid rgba(255,255,255,0.06)",animation:"spFadeIn .4s ease both",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",background:"rgba(0,0,0,0.2)"}}>
          <div style={{fontSize:"13px",fontWeight:700,letterSpacing:3,color:"rgba(255,255,255,0.9)"}}>UrbanIQ</div>
          <div className="sp-dark-nav-right" style={{display:"flex",gap:28,alignItems:"center"}}>
            <span style={{...dNavBtn,color:"rgba(255,255,255,0.2)"}}>DAY #{dayNum}</span>
            <button style={dNavBtn} onClick={()=>setShowMaps(true)}>🗺️ MAPS</button>
            <button style={dNavBtn} onClick={()=>setShowBeta(true)}>💬 FEEDBACK</button>
            {!installed&&<button style={dNavBtn} onClick={()=>setShowInstall(true)}>📲 INSTALL</button>}
            {pushSupported&&<button style={{...dNavBtn,color:notifEnabled?"#028A48":"rgba(255,255,255,0.35)"}} onClick={toggleNotif} disabled={notifLoading}>{notifEnabled?"🔔 REMINDERS":"🔕 REMINDERS"}</button>}
            {isSupporter
              ?<button style={{...dNavBtn,color:"#2ecc71"}} onClick={()=>setShowSupport(true)}>❤️ SUPPORTER</button>
              :<button style={dNavBtn} onClick={()=>setShowSupport(true)}>❤️ SUPPORT</button>
            }
          </div>
        </nav>

        {/* Hero */}
        <div className="sp-dark-hero" style={{position:"relative",zIndex:10,textAlign:"center",padding:"48px 48px 0px"}}>
          <div style={{fontSize:"11px",letterSpacing:4,color:"rgba(255,255,255,0.25)",marginBottom:28,animation:"spFadeIn .2s ease both"}}>{dateStr} · DAY #{dayNum}</div>
          <h1 style={{fontWeight:700,fontSize:"clamp(44px,7vw,88px)",letterSpacing:-2,lineHeight:1,margin:"0 0 6px",animation:"spFadeIn .25s ease both"}}>
            <span style={{backgroundImage:"linear-gradient(90deg,#028A48,#4a6fff,#BF0000,#028A48)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"spShimmer 5s linear infinite"}}>UrbanIQ</span>
          </h1>
          <div style={{fontWeight:300,fontSize:"clamp(13px,2.5vw,18px)",color:"rgba(255,255,255,0.38)",letterSpacing:5,marginBottom:28,animation:"spFadeIn .25s ease both"}}>A Guessing Game</div>
          {/* City photo hero banner — dark mode */}
          {!heroImgFailed&&heroImgUrl&&<div style={{position:"relative",height:"clamp(160px,28vw,280px)",overflow:"hidden",marginBottom:0,animation:"spFadeIn .5s ease both"}}>
            <img src={heroImgUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.65,filter:"brightness(0.65) saturate(1.3)"}} onError={()=>setHeroImgFailed(true)}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,transparent 40%,transparent 55%,rgba(0,0,0,0.85) 100%)"}}/>
            <div style={{position:"absolute",bottom:16,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:"9px",letterSpacing:3,color:hotCard.color,fontWeight:700,background:"rgba(0,0,0,0.5)",padding:"3px 10px",borderRadius:2}}>🔥 HOT TODAY</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.8)",fontWeight:600,letterSpacing:1}}>{hotCard.emoji} {hotCard.name}</span>
            </div>
          </div>}
          <div style={{width:48,height:1,background:"rgba(255,255,255,0.15)",margin:"24px auto 20px",animation:"spLineGrow .25s ease both"}}/>
          <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.38)",letterSpacing:1.5,lineHeight:1.9,maxWidth:360,margin:"0 auto 8px",animation:"spFadeIn .2s ease both"}}>
            Five daily puzzles. Three rounds each.<br/>One new challenge every day.
          </p>
          {topStreak>0&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,120,0,0.1)",border:"1px solid rgba(255,120,0,0.25)",borderRadius:2,padding:"6px 16px",marginTop:12,animation:"spFadeIn .2s ease both"}}>
              <span style={{fontSize:"15px",display:"inline-block",animation:"spFlame 1.2s ease infinite",transformOrigin:"bottom center"}}>🔥</span>
              <span style={{fontSize:"12px",fontWeight:700,color:topStreak>=14?"#ff6020":topStreak>=7?"#e07030":"#c09040",letterSpacing:2}}>{topStreak} DAY STREAK</span>
            </div>
          )}
        </div>


        {/* Cards */}
        <div className="sp-dark-grid" style={{position:"relative",zIndex:10,padding:"0 48px 40px",maxWidth:680,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
          {/* Swipeable hot today carousel */}
          {(()=>{const swipeGames=gameCards.filter(gc=>gc.key!=="minigames");const si=hotIdx%swipeGames.length;const g=swipeGames[si];return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:"9px",letterSpacing:3,color:g.color,fontWeight:700}}>🔥 HOT TODAY</span>
                <div style={{display:"flex",gap:3}}>
                  {swipeGames.map((_,i)=>(
                    <div key={i} onClick={e=>{e.stopPropagation();setHotIdx(i);}} style={{width:i===si?12:4,height:4,borderRadius:2,background:i===si?g.color:"rgba(255,255,255,0.15)",transition:"all .2s",cursor:"pointer"}}/>
                  ))}
                </div>
              </div>
              <div
                onPointerDown={e=>{hotDragStart.current=e.clientX;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);}}
                onPointerUp={e=>{if(hotDragStart.current===null)return;const dx=e.clientX-hotDragStart.current;hotDragStart.current=null;if(Math.abs(dx)<10){SoundEngine.play("select");onSelectGame(g.key);}else if(dx<-40)setHotIdx(i=>(i+1)%swipeGames.length);else if(dx>40)setHotIdx(i=>(i-1+swipeGames.length)%swipeGames.length);}}
                style={{userSelect:"none",touchAction:"pan-y",cursor:"pointer"}}>
                <DkCard g={g} featured delay={0} darkHov={darkHov} setDarkHov={setDarkHov} onSelectGame={onSelectGame}/>
              </div>
            </div>
          );})()}

          {/* Category accordion sections — dark mode */}
          {(()=>{
            const dkTagMeta:{tag:string,label:string,cols:number,color:string}[]=[
              {tag:"TRANSIT",   label:"🚊 TRANSIT",   cols:3,color:"#028A48"},
              {tag:"GEOGRAPHY", label:"🗺️ GEOGRAPHY", cols:2,color:"#1a3a8f"},
              {tag:"SPORTS",    label:"🏈 SPORTS",    cols:2,color:"#013369"},
              {tag:"ARCADE",    label:"🎮 ARCADE",    cols:1,color:"#7c3aed"},
            ];
            const allNonHot=gameCards;
            return dkTagMeta.map(({tag,label,cols,color})=>{
              const cards=tag==="ARCADE"
                ?allNonHot.filter(g=>g.key==="minigames")
                :allNonHot.filter(g=>g.tag===tag&&g.key!=="minigames");
              if(cards.length===0)return null;
              const collapsed=collapsedSections.has(tag);
              return(
                <div key={tag} style={{marginBottom:10,animation:"spFadeIn .4s ease both"}}>
                  <button onClick={()=>toggleSection(tag)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${collapsed?"rgba(255,255,255,0.06)":color+"40"}`,borderRadius:3,padding:"10px 16px",cursor:"pointer",transition:"all .2s",fontFamily:"'Inter',sans-serif"}}>
                    <span style={{fontSize:"10px",letterSpacing:3,color:collapsed?"rgba(255,255,255,0.28)":color,fontWeight:700}}>{label}</span>
                    <span style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",transition:"transform .25s",display:"inline-block",transform:collapsed?"rotate(0deg)":"rotate(180deg)"}}>▼</span>
                  </button>
                  {!collapsed&&(
                    <div style={{marginTop:6,display:"grid",gridTemplateColumns:`repeat(${Math.min(cols,cards.length)},1fr)`,gap:8,animation:"spFadeIn .25s ease both"}}>
                      {cards.map((g,i)=><DkCard key={g.key} g={g} delay={i*.06} darkHov={darkHov} setDarkHov={setDarkHov} onSelectGame={onSelectGame}/>)}
                    </div>
                  )}
                </div>
              );
            });
          })()}


          <div style={{textAlign:"center",marginTop:16,fontSize:"10px",letterSpacing:3,color:"rgba(255,255,255,0.12)",animation:"spFadeIn .2s ease both"}}>
            NO ADS · NO TRACKING · ALWAYS FREE
          </div>
        </div>

        {/* Card progress widget — dark mode (below mini games) */}
        <CardProgressWidget dark={true} onOpenCards={()=>onSelectGame("cards")}/>

        {/* Yesterday's Answer Teaser — dark mode */}
        {(()=>{const yItems=hotGameKey==="pdx"?PDX_STATIONS:hotGameKey==="dc"?DC_STATIONS:hotGameKey==="balt"?BALT_STATIONS:hotGameKey==="nfl"?NFL_TEAMS:hotGameKey==="la"?LA_STATIONS:hotGameKey==="nyc"?NYC_STATIONS:hotGameKey==="chi"?CHI_STATIONS:STATES;const yest=getYesterday(yItems,hotGameKey);const G2=GAMES[hotGameKey];if(!yest)return null;return(
          <div style={{maxWidth:680,margin:"0 auto",padding:"0 48px 8px",boxSizing:"border-box",animation:"spFadeIn .2s ease both"}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,borderRadius:8,background:G2.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{G2.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"8px",letterSpacing:2.5,color:"rgba(255,255,255,0.28)",fontWeight:700,marginBottom:2}}>YESTERDAY'S ANSWER</div>
                <div style={{fontSize:"13px",fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{yest.name}</div>
                <div style={{fontSize:"9px",color:"rgba(255,255,255,0.35)",marginTop:1}}>{G2.name}{yest.zone?` · ${yest.zone}`:yest.region?` · ${yest.region}`:""}</div>
              </div>
              <div onClick={()=>{SoundEngine.play("select");onSelectGame(hotGameKey);}} style={{flexShrink:0,background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",fontSize:"9px",fontWeight:700,letterSpacing:1.5,padding:"7px 12px",borderRadius:6,cursor:"pointer",whiteSpace:"nowrap",border:"1px solid rgba(255,255,255,0.12)"}}>PLAY TODAY</div>
            </div>
          </div>
        );})()}

        {/* Footer */}
        <div style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 48px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{fontSize:"10px",letterSpacing:2,color:"rgba(255,255,255,0.15)"}}>BY NIXALERLLC</div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {["#028A48","#BF0000","#1a3a8f"].map((c,i)=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:c,opacity:.5}}/>))}
          </div>
        </div>
        {modals}
      </div>
    );
  }

  /* ── LIGHT MODE — Clean white hub ─────────────────────────────────────── */
  return(
    <div style={{minHeight:"100dvh",background:"var(--bg-primary,#fafafa)",color:"var(--text-main,#0a0a0a)",fontFamily:"'Inter','Helvetica Neue',sans-serif",display:"flex",flexDirection:"column",position:"relative"}}>
      <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes spFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes spLineGrow{from{width:0}to{width:48px}}
        @keyframes spShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes spCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes spHotPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,120,0,0)}50%{box-shadow:0 0 0 6px rgba(255,120,0,0.18)}}
        @keyframes spFlame{0%,100%{transform:scaleY(1) rotate(-2deg)}33%{transform:scaleY(1.15) rotate(2deg)}66%{transform:scaleY(0.9) rotate(-1deg)}}
        @keyframes blob1{0%,100%{transform:translate(0px,0px) scale(1)}25%{transform:translate(80px,-60px) scale(1.12)}50%{transform:translate(-40px,80px) scale(0.92)}75%{transform:translate(50px,40px) scale(1.06)}}
        @keyframes blob2{0%,100%{transform:translate(0px,0px) scale(1)}25%{transform:translate(-70px,50px) scale(0.9)}50%{transform:translate(60px,-70px) scale(1.1)}75%{transform:translate(-30px,-40px) scale(0.95)}}
        @keyframes blob3{0%,100%{transform:translate(0px,0px) scale(1)}25%{transform:translate(40px,60px) scale(1.08)}50%{transform:translate(-50px,-50px) scale(0.94)}75%{transform:translate(70px,-30px) scale(1.04)}}
        @keyframes tabSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .sp-nav-btn{font-size:11px;letter-spacing:2px;color:rgba(0,0,0,0.3);cursor:pointer;transition:color .2s;background:none;border:none;font-family:'Inter',sans-serif;padding:0;white-space:nowrap;}
        .sp-nav-btn:hover{color:rgba(0,0,0,0.7);}
        .sp-game-card{cursor:pointer;border-radius:10px;padding:0;position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s;border:2px solid rgba(0,0,0,0.10);background:#fff;}
        .sp-game-card:hover{transform:translateY(-3px) scale(1.01);box-shadow:0 10px 32px rgba(0,0,0,0.15);}
        .sp-game-card:active{transform:scale(.97);}
        .sp-game-card.hot{animation:spHotPulse 2.4s ease infinite;}
        .sp-feat-card{cursor:pointer;border-radius:16px;position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s;border:2px solid transparent;}
        .sp-feat-card:hover{transform:translateY(-3px) scale(1.01);}
        .sp-feat-card:active{transform:scale(.98);}
        .sp-tab-btn{font-size:11px;letter-spacing:1.5px;font-weight:700;padding:8px 16px;border-radius:20px;border:1.5px solid transparent;cursor:pointer;transition:all .18s;font-family:'Inter',sans-serif;white-space:nowrap;}
        .sp-tab-btn:hover{transform:translateY(-1px);}
        @media(max-width:600px){
          .sp-nav{padding:14px 16px !important;}
          .sp-nav-right{gap:10px !important;}
          .sp-nav-logo{font-size:10px !important;letter-spacing:2px !important;}
          .sp-nav-day{display:none !important;}
          .sp-hero-pad{padding:24px 16px 12px !important;}
          .sp-grid-wrap{padding:0 12px 28px !important;}
          .sp-tab-btn{padding:6px 12px !important;font-size:10px !important;}
        }
        :root{--bg-primary:#f5f6fa;--text-main:#0a0a0a;--border-color:rgba(0,0,0,0.08);}
        .gs-card{border-radius:12px !important;}
      `}</style>

      {/* Ambient animated blob background — Roku TV style */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(2,138,72,0.18) 0%,transparent 70%)",top:"-15%",left:"-10%",animation:"blob1 22s ease-in-out infinite",filter:"blur(48px)"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,58,143,0.15) 0%,transparent 70%)",top:"20%",right:"-12%",animation:"blob2 28s ease-in-out infinite",filter:"blur(52px)"}}/>
        <div style={{position:"absolute",width:450,height:450,borderRadius:"50%",background:"radial-gradient(circle,rgba(191,0,0,0.1) 0%,transparent 70%)",bottom:"-10%",left:"25%",animation:"blob3 34s ease-in-out infinite",filter:"blur(56px)"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(191,0,0,0.08) 0%,transparent 70%)",top:"55%",right:"10%",animation:"blob3 19s ease-in-out infinite reverse",filter:"blur(44px)"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",backgroundSize:"80px 80px",opacity:.6}}/>
      </div>

      {notifMsg&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#0a0a0a",color:"#fff",fontSize:"12px",letterSpacing:1,padding:"12px 22px",borderRadius:8,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.18)",pointerEvents:"none",whiteSpace:"nowrap"}}>{notifMsg}</div>}
      <nav className="sp-nav" style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 40px",borderBottom:"1px solid rgba(0,0,0,0.06)",animation:"spFadeIn .4s ease both",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",background:"rgba(250,250,250,0.85)"}}>
        <div className="sp-nav-logo" style={{fontSize:"13px",fontWeight:700,letterSpacing:3,color:"#0a0a0a"}}>UrbanIQ</div>
        <div className="sp-nav-right" style={{display:"flex",gap:28,alignItems:"center"}}>
          <span className="sp-nav-day" style={{fontSize:"10px",letterSpacing:2,color:"rgba(0,0,0,0.3)"}}>DAY #{dayNum}</span>
          <button className="sp-nav-btn" onClick={()=>setShowMaps(true)}>🗺️ MAPS</button>
          <button className="sp-nav-btn" onClick={()=>setShowBeta(true)}>💬 FEEDBACK</button>
          {!installed&&<button className="sp-nav-btn" onClick={()=>setShowInstall(true)}>📲 INSTALL</button>}
          {pushSupported&&<button className="sp-nav-btn" onClick={toggleNotif} disabled={notifLoading} title={notifEnabled?"Turn off daily reminders":"Turn on daily reminders"} style={{opacity:notifLoading?0.5:1,color:notifEnabled?"#028A48":"rgba(0,0,0,0.3)"}}>{notifEnabled?"🔔 REMINDERS":"🔕 REMINDERS"}</button>}
          {isSupporter
            ?<span className="sp-nav-btn" onClick={()=>setShowSupport(true)} style={{color:"#028A48",cursor:"pointer"}}>❤️ SUPPORTER</span>
            :<button className="sp-nav-btn" onClick={()=>setShowSupport(true)} style={{color:"rgba(0,0,0,0.5)"}}>❤️ SUPPORT</button>
          }
        </div>
      </nav>

      {/* Hero */}
      <div className="sp-hero-pad" style={{position:"relative",zIndex:10,textAlign:"center",padding:"32px 40px 0px"}}>
        <div style={{fontSize:"10px",letterSpacing:4,color:"rgba(0,0,0,0.28)",marginBottom:20,animation:"spFadeIn .2s ease both"}}>{dateStr} · DAY #{dayNum}</div>
        <h1 style={{fontWeight:700,fontSize:"clamp(36px,6vw,72px)",letterSpacing:-1,lineHeight:1.05,margin:"0 0 6px",animation:"spFadeIn .2s ease both"}}>
          <span style={{backgroundImage:"linear-gradient(90deg,#028A48,#1a3a8f,#BF0000,#028A48)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"spShimmer 4s linear infinite"}}>UrbanIQ</span>
        </h1>
        <div style={{fontWeight:300,fontSize:"clamp(11px,2vw,15px)",color:"rgba(0,0,0,0.35)",letterSpacing:5,marginBottom:20,animation:"spFadeIn .2s ease both"}}>A Guessing Game</div>
        {/* City photo hero banner — light mode */}
        {!heroImgFailed&&heroImgUrl&&<div style={{position:"relative",height:"clamp(150px,26vw,260px)",overflow:"hidden",borderRadius:14,animation:"spFadeIn .5s ease both"}}>
          <img src={heroImgUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.88,filter:"brightness(0.78) saturate(1.2)"}} onError={()=>setHeroImgFailed(true)}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(255,255,255,0.1) 0%,transparent 30%,transparent 50%,rgba(255,255,255,0.9) 100%)"}}/>
          <div style={{position:"absolute",bottom:14,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:"9px",letterSpacing:3,color:hotCard.color,fontWeight:700,background:"rgba(255,255,255,0.9)",padding:"3px 10px",borderRadius:12,boxShadow:"0 1px 6px rgba(0,0,0,0.12)"}}>🔥 HOT TODAY</span>
            <span style={{fontSize:"10px",color:"#0a0a0a",fontWeight:700,letterSpacing:.5,background:"rgba(255,255,255,0.9)",padding:"3px 10px",borderRadius:12,boxShadow:"0 1px 6px rgba(0,0,0,0.12)"}}>{hotCard.emoji} {hotCard.name}</span>
          </div>
        </div>}
        <div style={{width:40,height:1,background:"rgba(0,0,0,0.12)",margin:"18px auto 14px",animation:"spLineGrow .25s ease both"}}/>
        <p style={{fontSize:"12px",fontWeight:300,color:"rgba(0,0,0,0.42)",letterSpacing:.3,lineHeight:1.8,maxWidth:300,margin:"0 auto 6px",animation:"spFadeIn .2s ease both"}}>
          Five daily puzzles. Three rounds each.<br/>One new challenge every day.
        </p>
        {topStreak>0&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,120,0,0.07)",border:"1px solid rgba(255,120,0,0.18)",borderRadius:20,padding:"5px 14px",marginTop:10,animation:"spFadeIn .2s ease both"}}>
            <span style={{fontSize:"16px",display:"inline-block",animation:"spFlame 1.2s ease infinite",transformOrigin:"bottom center"}}>🔥</span>
            <span style={{fontSize:"12px",fontWeight:700,color:topStreak>=14?"#e05000":topStreak>=7?"#c06000":"#a07020",letterSpacing:1}}>{topStreak} DAY STREAK</span>
          </div>
        )}
      </div>

      {/* Accordion game selector */}
      <div className="sp-grid-wrap" style={{position:"relative",zIndex:10,padding:"0 20px 32px",maxWidth:640,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

        {/* Featured HOT TODAY card */}
        {(()=>{const swipeGames=gameCards.filter(gc=>gc.key!=="minigames");const si=hotIdx%swipeGames.length;const g=swipeGames[si];return(
          <div style={{marginBottom:18,animation:"spCardIn .2s ease both"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:"9px",letterSpacing:3,color:"rgba(0,0,0,0.28)",fontWeight:700}}>🔥 HOT TODAY</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {swipeGames.map((_,i)=>(
                  <div key={i} onClick={()=>setHotIdx(i)} style={{width:i===si?14:5,height:5,borderRadius:3,background:i===si?g.color:"rgba(0,0,0,0.12)",transition:"all .2s",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div className="sp-feat-card"
              onPointerDown={e=>{hotDragStart.current=e.clientX;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);}}
              onPointerUp={e=>{if(hotDragStart.current===null)return;const dx=e.clientX-hotDragStart.current;hotDragStart.current=null;if(Math.abs(dx)<10){SoundEngine.play("select");onSelectGame(g.key);}else if(dx<-40)setHotIdx(i=>(i+1)%swipeGames.length);else if(dx>40)setHotIdx(i=>(i-1+swipeGames.length)%swipeGames.length);}}
              onMouseEnter={()=>setFeatHov(true)} onMouseLeave={()=>setFeatHov(false)}
              style={{background:g.grad,boxShadow:featHov?`0 16px 48px ${g.color}44`:`0 8px 28px ${g.color}28`,userSelect:"none",touchAction:"pan-y",cursor:"pointer",overflow:"hidden",position:"relative"}}>
              {g.photo&&<img src={g.photo} alt="" onError={(e)=>{(e.target as HTMLElement).style.display="none";}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:featHov?0.55:0.42,transition:"opacity .3s",filter:"brightness(0.7) saturate(1.3)"}}/>}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(0,0,0,0.3) 0%,transparent 100%)"}}/>
              <div style={{padding:"24px 20px 22px",display:"flex",alignItems:"center",gap:16,position:"relative",zIndex:1}}>
                <div style={{width:62,height:62,borderRadius:14,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.2)"}}>{g.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"10px",letterSpacing:3,color:"rgba(255,255,255,0.65)",fontWeight:700,marginBottom:4}}>{g.tag}</div>
                  <div style={{fontSize:"22px",fontWeight:800,color:"#fff",letterSpacing:-0.5,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)"}}>{g.sub}</div>
                </div>
                <div style={{flexShrink:0,background:"rgba(255,255,255,0.95)",color:g.color,fontFamily:"'Inter',sans-serif",fontSize:"11px",fontWeight:800,letterSpacing:2,padding:"11px 18px",borderRadius:9,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",transition:"transform .15s",transform:featHov?"scale(1.04)":"none"}}>PLAY →</div>
              </div>
            </div>
          </div>
        );})()}

        {/* Category accordion sections — light mode */}
        {(()=>{
          const spTagMeta:{tag:string,label:string,cols:number,color:string}[]=[
            {tag:"TRANSIT",   label:"🚊 TRANSIT",   cols:3,color:"#028A48"},
            {tag:"GEOGRAPHY", label:"🗺️ GEOGRAPHY", cols:2,color:"#1a3a8f"},
            {tag:"SPORTS",    label:"🏈 SPORTS",    cols:2,color:"#013369"},
            {tag:"ARCADE",    label:"🎮 ARCADE",    cols:1,color:"#7c3aed"},
          ];
          const allNonHot=gameCards;
          return spTagMeta.map(({tag,label,cols,color})=>{
            const cards=tag==="ARCADE"
              ?allNonHot.filter(g=>g.key==="minigames")
              :allNonHot.filter(g=>g.tag===tag&&g.key!=="minigames");
            if(cards.length===0)return null;
            const collapsed=collapsedSections.has(tag);
            return(
              <div key={tag} style={{marginBottom:12,animation:"spCardIn .2s ease both"}}>
                <button onClick={()=>toggleSection(tag)}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:collapsed?"rgba(0,0,0,0.03)":"rgba(255,255,255,0.92)",border:`2px solid ${collapsed?"rgba(0,0,0,0.08)":color+"35"}`,borderRadius:10,padding:"13px 16px",cursor:"pointer",transition:"all .2s",fontFamily:"'Inter',sans-serif",backdropFilter:"blur(6px)",boxShadow:collapsed?"none":`0 2px 14px ${color}12`}}>
                  <span style={{fontSize:"11px",letterSpacing:3,color:collapsed?"rgba(0,0,0,0.32)":color,fontWeight:800}}>{label}</span>
                  <span style={{fontSize:"11px",color:"rgba(0,0,0,0.2)",transition:"transform .25s",display:"inline-block",transform:collapsed?"rotate(0deg)":"rotate(180deg)"}}>▼</span>
                </button>
                {!collapsed&&(
                  <div style={{marginTop:8,display:"grid",gridTemplateColumns:`repeat(${Math.min(cols,cards.length)},1fr)`,gap:10,animation:"spCardIn .25s ease both"}}>
                    {cards.map((g,i)=>(
                      <div key={g.key} className="sp-game-card"
                        onClick={()=>{SoundEngine.play("select");onSelectGame(g.key);}}
                        onMouseEnter={()=>setHoveredGame(g.key)} onMouseLeave={()=>setHoveredGame(null)}
                        style={{animation:"spCardIn .2s ease both",borderColor:hoveredGame===g.key?g.color:"rgba(0,0,0,0.07)",boxShadow:hoveredGame===g.key?`0 8px 28px ${g.color}22`:"none",padding:0,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                        {g.photo?<div style={{height:130,overflow:"hidden",position:"relative",flexShrink:0}}>
                          <img src={g.photo} alt={g.name} onError={(e)=>{(e.target as HTMLElement).parentElement!.style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .35s",transform:hoveredGame===g.key?"scale(1.07)":"scale(1)"}}/>
                          <div style={{position:"absolute",inset:0,background:`linear-gradient(to bottom,transparent 25%,rgba(0,0,0,0.52) 100%)`}}/>
                          <div style={{position:"absolute",bottom:9,left:12,fontSize:"12px",fontWeight:800,color:"rgba(255,255,255,0.95)",textShadow:"0 1px 6px rgba(0,0,0,0.7)",letterSpacing:.3}}>{g.emoji} {g.name}</div>
                          <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.45)",color:"rgba(255,255,255,0.7)",fontSize:"8px",fontWeight:700,letterSpacing:1.5,padding:"3px 7px",borderRadius:4}}>{g.tag}</div>
                        </div>:<div style={{height:130,background:g.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",flexShrink:0,position:"relative"}}>
                          <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.3)",color:"rgba(255,255,255,0.65)",fontSize:"8px",fontWeight:700,letterSpacing:1.5,padding:"3px 7px",borderRadius:4}}>{g.tag}</div>
                          {g.emoji}
                        </div>}
                        <div style={{padding:"12px 14px 14px",flex:1,display:"flex",flexDirection:"column",gap:5}}>
                          <div style={{fontSize:"13px",fontWeight:800,color:"#0a0a0a",lineHeight:1.3}}>{g.name}</div>
                          <div style={{fontSize:"10px",color:"rgba(0,0,0,0.42)",lineHeight:1.4}}>{g.sub}</div>
                          <div style={{marginTop:"auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div style={{fontSize:"10px",fontWeight:800,letterSpacing:1,color:g.color}}>PLAY →</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}

        <div style={{textAlign:"center",marginTop:24,fontSize:"9px",letterSpacing:3,color:"rgba(0,0,0,0.18)",animation:"spFadeIn .2s ease both"}}>
          NO ADS · NO TRACKING · ALWAYS FREE
        </div>
      </div>

      {/* Card progress widget — light mode (below mini games) */}
      <CardProgressWidget dark={false} onOpenCards={()=>onSelectGame("cards")}/>

      {/* Yesterday's Answer Teaser — light mode */}
      {(()=>{const yItems=hotGameKey==="pdx"?PDX_STATIONS:hotGameKey==="dc"?DC_STATIONS:hotGameKey==="balt"?BALT_STATIONS:hotGameKey==="nfl"?NFL_TEAMS:hotGameKey==="la"?LA_STATIONS:hotGameKey==="nyc"?NYC_STATIONS:hotGameKey==="chi"?CHI_STATIONS:STATES;const yest=getYesterday(yItems,hotGameKey);const G2=GAMES[hotGameKey];if(!yest)return null;return(
        <div style={{maxWidth:600,margin:"0 auto",padding:"0 24px 8px",boxSizing:"border-box",animation:"spFadeIn .2s ease both"}}>
          <div style={{background:"rgba(0,0,0,0.025)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:9,background:G2.accentDark||G2.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0,opacity:.9}}>{G2.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"8px",letterSpacing:2.5,color:"rgba(0,0,0,0.35)",fontWeight:700,marginBottom:3}}>YESTERDAY'S ANSWER</div>
              <div style={{fontSize:"13px",fontWeight:700,color:"#0a0a0a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{yest.name}</div>
              <div style={{fontSize:"9px",color:"rgba(0,0,0,0.38)",marginTop:2}}>{G2.name}{yest.zone?` · ${yest.zone}`:yest.region?` · ${yest.region}`:""}</div>
            </div>
            <div onClick={()=>{SoundEngine.play("select");onSelectGame(hotGameKey);}} style={{flexShrink:0,background:"#0a0a0a",color:"#fff",fontSize:"9px",fontWeight:700,letterSpacing:1.5,padding:"7px 13px",borderRadius:7,cursor:"pointer",whiteSpace:"nowrap"}}>PLAY TODAY</div>
          </div>
        </div>
      );})()}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 28px",borderTop:"1px solid rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:"9px",letterSpacing:2,color:"rgba(0,0,0,0.18)"}}>BY NIXALERLLC</div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {["#028A48","#BF0000","#1a3a8f"].map((c,i)=>(<div key={i} style={{width:5,height:5,borderRadius:"50%",background:c,opacity:.5}}/>))}
        </div>
      </div>
      {modals}
    </div>
  );
}

// ── GAME SELECTOR ─────────────────────────────────────────────────────────────
function GameSelector({allStats,roundData,blitzBests,onSelect,onBack,settings}:{allStats:any,roundData:any,blitzBests:any,onSelect:(gk:string)=>void,onBack:()=>void,settings:any}){
  const dayNum=useMemo(getDayNum,[]);
  const dark=settings.dark;
  const bg=dark?"#111":"#fafafa";
  const text=dark?"#f0f0f0":"#0a0a0a";
  const border=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)";
  const surface=dark?"#1c1c1c":"#fff";
  const textMuted=dark?"rgba(255,255,255,0.35)":"rgba(0,0,0,0.38)";
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,display:"flex",flexDirection:"column"}}>
      <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes gsBackdrop{from{opacity:0}to{opacity:1}}
        @keyframes gsSlideDown{from{transform:translateY(-100%);opacity:.6}to{transform:translateY(0);opacity:1}}
        @keyframes gsCardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .gs-card{transition:border-color .2s,box-shadow .2s,transform .15s;}
        .gs-card:hover{transform:translateY(-2px);}
      `}</style>

      <div onClick={onBack} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.22)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"gsBackdrop .3s ease both"}}/>

      <div style={{position:"relative",zIndex:1,background:dark?"rgba(17,17,17,0.94)":"rgba(250,250,250,0.95)",borderRadius:"0 0 24px 24px",boxShadow:"0 32px 80px rgba(0,0,0,0.22)",maxHeight:"88vh",overflowY:"auto",animation:"gsSlideDown .2s cubic-bezier(.4,0,.2,1) both",fontFamily:"'Inter','Helvetica Neue',sans-serif",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 28px",borderBottom:`1px solid ${border}`}}>
          <div style={{fontSize:"11px",letterSpacing:3,fontWeight:700,color:textMuted}}>SELECT A GAME</div>
          <div style={{fontSize:"10px",letterSpacing:2,color:textMuted}}>DAY #{dayNum}</div>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${border}`,borderRadius:20,cursor:"pointer",fontSize:"12px",color:textMuted,padding:"5px 14px",fontFamily:"'Inter',sans-serif",letterSpacing:1,fontWeight:600,transition:"color .15s,border-color .15s"}} onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=text;(e.currentTarget as HTMLButtonElement).style.borderColor=text;}} onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=textMuted;(e.currentTarget as HTMLButtonElement).style.borderColor=border;}}>✕ CLOSE</button>
        </div>

        <StreakCalendar dark={dark}/>

        <div style={{padding:"16px 24px 28px",display:"flex",flexDirection:"column",gap:10,maxWidth:600,margin:"0 auto",width:"100%"}}>
          {Object.values(GAMES).map((g:any,idx)=>{
            const gs=allStats[g.key];
            const rounds=roundData[g.key]||[{won:false,alreadyPlayed:false},{won:false,alreadyPlayed:false},{won:false,alreadyPlayed:false}];
            const pts=rounds.filter((r:any)=>r.won).length;
            const played=rounds.filter((r:any)=>r.alreadyPlayed).length;
            return(
              <div key={g.key} className="gs-card" onClick={()=>onSelect(g.key)}
                style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"16px 18px",cursor:"pointer",animation:"gsCardIn .2s ease both"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=g.accent;(e.currentTarget as HTMLDivElement).style.boxShadow=`0 8px 32px ${g.accent}1a`;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=border;(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:g.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0,boxShadow:`0 4px 12px ${g.accent}40`}}>
                    {g.emoji||"🗺️"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"14px",fontWeight:700,color:text,letterSpacing:.2}}>{g.name}</div>
                    <div style={{fontSize:"10px",letterSpacing:2,color:textMuted,marginTop:2}}>{g.sub.toUpperCase()}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:"22px",fontWeight:800,color:g.accent,lineHeight:1}}>{pts}/3</div>
                    <div style={{fontSize:"8px",letterSpacing:2,color:textMuted,marginTop:2}}>TODAY</div>
                  </div>
                </div>

                {g.lineColors&&(
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
                    {Object.entries(g.lineColors as any).map(([n,c]:any)=>(<div key={n} style={{background:c.bg,color:c.text,fontSize:"9px",padding:"2px 7px",borderRadius:4,fontWeight:700,letterSpacing:.5}}>{n}</div>))}
                  </div>
                )}
                {g.key==="states"&&(
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
                    {["Northeast","Mid-Atl","Southeast","Midwest","Southwest","Mtn West","Pacific"].map((r,i)=>{const cols=["#1a3a8f","#2a5ab0","#B22234","#2a7a2a","#c86010","#8a4a8a","#1a8a8a"];return(<div key={r} style={{background:cols[i],color:"#fff",fontSize:"9px",padding:"2px 6px",borderRadius:4,fontWeight:700}}>{r}</div>);})}
                  </div>
                )}

                <div style={{display:"flex",gap:5,marginBottom:12}}>
                  {[{l:"STREAK",v:`${gs.streak}${gs.streak>2?"🔥":""}`},{l:"WINS",v:gs.wins},{l:"WIN %",v:`${gs.played>0?Math.round(gs.wins/gs.played*100):0}%`},{l:"BLITZ",v:blitzBests[g.key]||0}].map(s=>(
                    <div key={s.l} style={{flex:1,background:`${g.accent}0f`,borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                      <div style={{fontSize:"13px",fontWeight:800,color:g.accent}}>{s.v}</div>
                      <div style={{fontSize:"8px",letterSpacing:1.5,color:textMuted,marginTop:1}}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    {rounds.map((r:any,i:number)=>(
                      <div key={i} style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${r.alreadyPlayed?(r.won?"#28b050":"#c43030"):border}`,background:r.alreadyPlayed?(r.won?"#d4f5e0":"#fdd0d0"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:r.won?"#005020":r.lost?"#5a0000":textMuted,fontWeight:700}}>
                        {r.won?"✓":r.lost?"✗":`${i+1}`}
                      </div>
                    ))}
                    <span style={{fontSize:"10px",color:textMuted,marginLeft:3}}>{played===3?"Done!":`${3-played} left`}</span>
                  </div>
                  <div style={{background:g.accent,color:"#fff",fontSize:"10px",fontWeight:700,padding:"6px 14px",borderRadius:20,letterSpacing:1}}>
                    {played===0?"PLAY →":played===3?"REVIEW":"CONTINUE →"}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{textAlign:"center",fontSize:"9px",letterSpacing:2.5,color:textMuted,paddingTop:4}}>NO ADS · NO TRACKING · ALWAYS FREE</div>
        </div>
      </div>
    </div>
  );
}

// ── DIFFICULTY PICKER MODAL ────────────────────────────────────────────────────
function DiffPickerModal({gameKey,settings,onSelect,onClose}:{gameKey:string,settings:any,onSelect:(d:string)=>void,onClose:()=>void}){
  const G=GAMES[gameKey];
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px"}}>
      <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes dpBack{from{opacity:0}to{opacity:1}}@keyframes dpIn{from{opacity:0;transform:scale(.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}.dp-row{transition:border-color .18s,box-shadow .15s;}.dp-row:hover{border-color:${G.accent}!important;box-shadow:0 4px 18px ${G.accent}20!important;}`}</style>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"dpBack .28s ease both"}}/>
      <div style={{position:"relative",zIndex:1,background:"rgba(250,250,250,0.92)",borderRadius:22,padding:"24px 22px 28px",boxShadow:"0 24px 80px rgba(0,0,0,0.28)",animation:"dpIn .18s cubic-bezier(.4,0,.2,1) both",fontFamily:"'Inter','Helvetica Neue',sans-serif",width:"100%",maxWidth:420,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:"24px",marginBottom:4}}>{G.emoji||"🗺️"}</div>
            <div style={{fontSize:"17px",fontWeight:700,color:"#0a0a0a",letterSpacing:.2}}>{G.name}</div>
            <div style={{fontSize:"10px",letterSpacing:3,color:"rgba(0,0,0,0.36)",marginTop:3,fontWeight:600}}>SELECT DIFFICULTY</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"1px solid rgba(0,0,0,0.1)",borderRadius:20,padding:"6px 16px",fontSize:"11px",fontWeight:700,letterSpacing:1,color:"rgba(0,0,0,0.38)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>✕ CANCEL</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {Object.entries(G.diffConfig as any).map(([k,d]:any)=>(
            <div key={k} className="dp-row" onClick={()=>onSelect(k)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"#fff",border:"1px solid rgba(0,0,0,0.08)",borderRadius:14,cursor:"pointer"}}>
              <span style={{fontSize:"22px"}}>{d.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:"15px",fontWeight:700,color:"#0a0a0a"}}>{d.label}</div>
                <div style={{fontSize:"11px",color:"rgba(0,0,0,0.42)",marginTop:2,lineHeight:1.5}}>{d.desc}</div>
              </div>
              <span style={{fontSize:"20px",color:G.accent,fontWeight:300}}>›</span>
            </div>
          ))}
          <div className="dp-row" onClick={()=>{const keys=Object.keys(G.diffConfig as any);onSelect(keys[Math.floor(Math.random()*keys.length)]);}}
            style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"#fff",border:"1px solid rgba(0,0,0,0.08)",borderRadius:14,cursor:"pointer"}}>
            <span style={{fontSize:"22px"}}>🎲</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"15px",fontWeight:700,color:"#0a0a0a"}}>Random</div>
              <div style={{fontSize:"11px",color:"rgba(0,0,0,0.42)",marginTop:2}}>Surprise difficulty</div>
            </div>
            <span style={{fontSize:"20px",color:G.accent,fontWeight:300}}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DIFFICULTY SELECTOR ───────────────────────────────────────────────────────
function DifficultySelector({gameKey,onSelect,onBack,settings}:{gameKey:string,onSelect:(d:string)=>void,onBack:()=>void,settings:any}){
  const G=GAMES[gameKey];
  const T=getTheme(gameKey,settings);
  const fs=T.fs;
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'JetBrains Mono','Courier New',monospace",color:T.text,display:"flex",flexDirection:"column"}}>
      <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:`1px solid ${T.border}`}}>
        <button onClick={onBack} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.textSub,cursor:"pointer"}}>← Back</button>
        <div style={{flex:1,textAlign:"center"}}>
          <span style={{fontSize:"20px"}}>{G.key==="pdx"?"🚊":G.key==="dc"?"🚇":G.key==="nfl"?"🏈":G.key==="balt"?"🚉":"🗺️"}</span>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:fs(14),fontWeight:700,color:T.text,marginLeft:8}}>{G.name}</span>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"24px 20px",maxWidth:460,margin:"0 auto",width:"100%"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(22),color:T.text,textAlign:"center",marginBottom:6}}>Select Difficulty</div>
        <div style={{fontSize:fs(9),color:T.textMuted,textAlign:"center",marginBottom:28,letterSpacing:2}}>Choose before the tutorial begins</div>
        {Object.entries(G.diffConfig as any).map(([k,d]:any,idx)=>(
          <div key={k} onClick={()=>onSelect(k)}
            style={{background:T.surface,border:`2px solid ${T.border}`,borderRadius:14,padding:"16px 18px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .15s,transform .15s,box-shadow .15s",animation:"slideUp .2s ease both"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=G.accent;(e.currentTarget as HTMLDivElement).style.transform="translateX(4px)";(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 20px ${G.accent}20`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border;(e.currentTarget as HTMLDivElement).style.transform="translateX(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
            <span style={{fontSize:"24px"}}>{d.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:fs(14),fontWeight:700,color:T.text,marginBottom:3}}>{d.label}</div>
              <div style={{fontSize:fs(9),color:T.textMuted,lineHeight:1.6}}>{d.desc}</div>
            </div>
            <span style={{fontSize:fs(16),color:T.accent}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HELP TAB (interactive multi-section) ──────────────────────────────────────
function HelpTab({T,fs,G,DIFF,gameKey,onPlay}:{T:any,fs:any,G:any,DIFF:any,gameKey:string,onPlay:()=>void}){
  const[helpStep,setHelpStep]=useState(0);
  const[demoLit,setDemoLit]=useState(-1);
  const cols=DIFF.cols;
  const isTransit=gameKey!=="states"&&gameKey!=="nfl";
  const HELP_SECTIONS=[
    {id:"goal",icon:"🎯",title:"The Goal"},
    {id:"clues",icon:"🔍",title:"Clues"},
    {id:"columns",icon:"📊",title:"Columns"},
    {id:"rounds",icon:"🔄",title:"Rounds"},
    {id:"cards",icon:"🃏",title:"Cards"},
    {id:"tips",icon:"💡",title:"Tips"},
  ];
  const colInfo:any={
    lines:{label:"LINES",desc:"Transit line(s) the station is on. Green = exact.",ex:"🔵🔴"},
    zone:{label:"ZONE",desc:"Area of the city (Downtown, Midtown…). Green = same zone.",ex:"DWNTN"},
    busy:{label:"BUSY",desc:"How crowded the station is. Must match exactly.",ex:"🌕 Packed"},
    direction:{label:"DIR",desc:"Direction from downtown. Arrow shows N/S/E/W.",ex:"→ East"},
    year:{label:"YEAR",desc:"Year opened/established. ▲▼ arrows show direction.",ex:"1986"},
    region:{label:"REGION",desc:"Geographic region. Must match exactly.",ex:"Pacific"},
    coast:{label:"COAST",desc:"East/West/Interior coast. Green = exact.",ex:"Pacific"},
    pop:{label:"POP",desc:"State population size. ▲▼ arrows show direction.",ex:"🌕 Massive"},
    size:{label:"SIZE",desc:"Geographic size of state. ▲▼ arrows show direction.",ex:"💠 Huge"},
    conf:{label:"CONF",desc:"NFL conference (AFC/NFC). Green = exact.",ex:"AFC"},
    div:{label:"DIV",desc:"Division within conference. Green = exact.",ex:"West"},
    sb:{label:"SB",desc:"Super Bowl wins. ▲▼ arrows show direction.",ex:"4🏆"},
  };
  const demoColors=["green","yellow","red","yellow","green","red"];
  const demoVals:any=isTransit?{lines:"🔵🔴",zone:"DWNTN",busy:"🌕 Packed",direction:"→ City",year:"1986"}:gameKey==="nfl"?{conf:"AFC",div:"West",region:"Midwest",sb:"4🏆",year:"1960"}:{region:"Pacific",coast:"Pacific",pop:"🌕 Massive",direction:"→ East",year:"1850",size:"💠 Massive"};
  useEffect(()=>{
    if(helpStep!==1)return;
    setDemoLit(-1);
    const t=setTimeout(()=>{
      let i=-1;
      const iv=setInterval(()=>{i++;setDemoLit(i);if(i>=cols.length)clearInterval(iv);},320);
      return()=>clearInterval(iv);
    },400);
    return()=>clearTimeout(t);
  },[helpStep]);
  return(
    <div style={{maxWidth:600,margin:"0 auto",padding:"16px 14px 60px",position:"relative",zIndex:2}}>
      <style>{`@keyframes helpSlide{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}`}</style>
      {/* Section tabs */}
      <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:18,paddingBottom:2}}>
        {HELP_SECTIONS.map((s,i)=>(
          <button key={s.id} onClick={()=>setHelpStep(i)}
            style={{flexShrink:0,background:helpStep===i?T.accent:"transparent",color:helpStep===i?"#fff":T.textMuted,border:`1px solid ${helpStep===i?T.accent:T.border}`,borderRadius:20,padding:"6px 12px",fontSize:fs(9),fontWeight:700,letterSpacing:.5,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all .15s",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Step 0: Goal */}
      {helpStep===0&&<div style={{animation:"helpSlide .18s ease both"}}>
        <div style={{background:T.surface,border:`2px solid ${T.accent}22`,borderRadius:14,padding:"22px",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:fs(36),marginBottom:10}}>🎯</div>
          <div style={{fontSize:fs(16),fontWeight:700,color:T.text,marginBottom:8}}>{G.name}</div>
          <div style={{fontSize:fs(11),color:T.textSub,lineHeight:1.9}}>A secret <strong style={{color:T.accentB}}>{G.itemLabel}</strong> is chosen every day. You have <strong style={{color:T.accentB}}>{DIFF.maxGuesses} guesses</strong> to find it using color clues.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[{e:"📅",t:"Daily Reset",d:"New puzzle every midnight"},{e:"3️⃣",t:"3 Rounds",d:`${DIFF.maxGuesses} guesses per round`},{e:"🃏",t:"Earn Cards",d:"Win rounds to get cards"}].map(x=>(
            <div key={x.t} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:fs(22),marginBottom:5}}>{x.e}</div>
              <div style={{fontSize:fs(10),fontWeight:700,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:fs(9),color:T.textMuted,lineHeight:1.5}}>{x.d}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:fs(28)}}>{DIFF.emoji}</span>
          <div>
            <div style={{fontSize:fs(13),fontWeight:700,color:T.accentB}}>{DIFF.label} Difficulty</div>
            <div style={{fontSize:fs(10),color:T.textSub}}>{DIFF.maxGuesses} guesses · {cols.length} clue columns{DIFF.hardLocks?" · Smart filter":""}</div>
          </div>
        </div>
        <button onClick={()=>setHelpStep(1)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,cursor:"pointer"}}>SEE HOW CLUES WORK →</button>
      </div>}

      {/* Step 1: Clue demo */}
      {helpStep===1&&<div style={{animation:"helpSlide .18s ease both"}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted,marginBottom:10,textAlign:"center"}}>LIVE DEMO — WATCH CELLS LIGHT UP</div>
          <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",marginBottom:10,fontSize:fs(12),fontWeight:700,color:T.text,textAlign:"center"}}>
            {gameKey==="pdx"?"Pioneer Courthouse/SW 6th":gameKey==="dc"?"Metro Center":gameKey==="nfl"?"Kansas City Chiefs":gameKey==="balt"?"Lexington Market":"California"}
          </div>
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {cols.map((col:string,idx:number)=>{
              const on=demoLit>=idx;const c=demoColors[idx%demoColors.length];
              const bg:any={green:T.cellBg.green,yellow:T.cellBg.yellow,red:T.cellBg.red};
              const bc:any={green:T.cellBorder.green,yellow:T.cellBorder.yellow,red:T.cellBorder.red};
              const tc:any={green:T.cellText.green,yellow:T.cellText.yellow,red:T.cellText.red};
              return(<div key={col} style={{flex:1,background:on?bg[c]:T.surface,border:`1.5px solid ${on?bc[c]:T.border}`,borderRadius:6,padding:"6px 3px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:44,transition:"background .3s,border-color .3s"}}>
                {on?<div style={{fontSize:fs(8),fontWeight:700,color:tc[c],textAlign:"center",lineHeight:1.2}}>{demoVals[col]||"—"}</div>:<div style={{height:8,width:"70%",background:T.border,borderRadius:3}}/>}
                {on&&<div style={{fontSize:fs(7),color:tc[c],opacity:.65,marginTop:2}}>{colInfo[col]?.label||col}</div>}
              </div>);
            })}
            <div style={{background:demoLit>=cols.length?T.cellBg.green:T.surface,border:`1.5px solid ${demoLit>=cols.length?T.cellBorder.green:T.border}`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",minWidth:28,transition:"all .3s"}}>
              {demoLit>=cols.length?<span style={{color:T.cellText.green,fontWeight:700,fontSize:fs(14)}}>✓</span>:<div style={{width:8,height:10}}/>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
            {[{bg:T.cellBg.green,bc:T.cellBorder.green,tc:T.cellText.green,l:"🟩 Exact"},{bg:T.cellBg.yellow,bc:T.cellBorder.yellow,tc:T.cellText.yellow,l:"🟨 Close"},{bg:T.cellBg.red,bc:T.cellBorder.red,tc:T.cellText.red,l:"🟥 Off"}].map(x=>(
              <div key={x.l} style={{background:x.bg,border:`1px solid ${x.bc}`,borderRadius:6,padding:"4px 10px",fontSize:fs(10),color:x.tc,fontWeight:600}}>{x.l}</div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[{color:"green",emoji:"🟩",title:"EXACT",body:"Perfect match on this clue."},{color:"yellow",emoji:"🟨",title:"CLOSE",body:"One step off. ▲▼ shows direction."},{color:"red",emoji:"🟥",title:"OFF",body:"No match. Adjust your guess."}].map(item=>(
            <div key={item.color} style={{background:T.cellBg[item.color],border:`2px solid ${T.cellBorder[item.color]}`,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:fs(20),marginBottom:4}}>{item.emoji}</div>
              <div style={{fontSize:fs(10),fontWeight:700,color:T.cellText[item.color],marginBottom:3}}>{item.title}</div>
              <div style={{fontSize:fs(9),color:T.cellText[item.color],opacity:.85,lineHeight:1.5}}>{item.body}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>setHelpStep(2)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,cursor:"pointer"}}>COLUMN GUIDE →</button>
      </div>}

      {/* Step 2: Columns */}
      {helpStep===2&&<div style={{animation:"helpSlide .18s ease both"}}>
        <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted,marginBottom:10,textAlign:"center"}}>WHAT EACH COLUMN MEANS</div>
        {cols.map((col:string)=>{const info=colInfo[col];if(!info)return null;return(
          <div key={col} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{background:T.accent,color:"#fff",borderRadius:6,padding:"5px 8px",fontSize:fs(8),fontWeight:700,flexShrink:0,fontFamily:"'JetBrains Mono',monospace"}}>{info.label}</div>
            <div>
              <div style={{fontSize:fs(11),fontWeight:700,color:T.text,marginBottom:3}}>{info.desc}</div>
              <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:5,padding:"3px 8px",display:"inline-block",fontSize:fs(10),color:T.textSub,fontFamily:"'JetBrains Mono',monospace"}}>e.g. {info.ex}</div>
            </div>
          </div>
        );})}
        <button onClick={()=>setHelpStep(3)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,cursor:"pointer",marginTop:4}}>ROUNDS & SCORING →</button>
      </div>}

      {/* Step 3: Rounds */}
      {helpStep===3&&<div style={{animation:"helpSlide .18s ease both"}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px",marginBottom:12}}>
          <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted,marginBottom:12}}>3 ROUNDS PER DAY, PER GAME</div>
          {[{n:1,col:"#028A48",txt:"Win Round 1 → 1 point + card drop"},{n:2,col:"#e8a000",txt:"Win Round 2 → another point + card"},{n:3,col:"#BF0000",txt:"Win Round 3 → 3-point day + rare card chance"}].map(r=>(
            <div key={r.n} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:r.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:fs(16),flexShrink:0}}>{r.n}</div>
              <div style={{fontSize:fs(11),color:T.textSub,lineHeight:1.5}}>{r.txt}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[{e:"🔥",t:"Streaks",d:"Win daily to grow streak. Missing resets it."},{e:"🛡️",t:"Shield",d:"Supporters get one streak shield per month."},{e:"🏆",t:"Points",d:"Up to 15 daily points across all 5 games."},{e:"📊",t:"Win Rate",d:"Track your percentage in the stats tab."}].map(x=>(
            <div key={x.t} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 10px"}}>
              <div style={{fontSize:fs(22),marginBottom:5}}>{x.e}</div>
              <div style={{fontSize:fs(11),fontWeight:700,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:fs(9),color:T.textMuted,lineHeight:1.5}}>{x.d}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>setHelpStep(4)} style={{width:"100%",background:"#c8a800",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,cursor:"pointer"}}>🃏 CARD SYSTEM →</button>
      </div>}

      {/* Step 4: Cards */}
      {helpStep===4&&<div style={{animation:"helpSlide .18s ease both"}}>
        <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",border:"1px solid #c8a80040",borderRadius:14,padding:"18px",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:fs(40),marginBottom:8}}>🃏</div>
          <div style={{fontSize:fs(14),fontWeight:700,color:"#c8a800",marginBottom:6}}>CARD COLLECTION</div>
          <div style={{fontSize:fs(10),color:"rgba(255,255,255,.55)",lineHeight:1.8}}>Win puzzle rounds to earn collectible cards. Each has a unique power-up and battle ability.</div>
        </div>
        {[{e:"🎁",t:"Earning Cards",d:"Win any daily round to earn a card. Harder difficulty = better rarity. Every win earns one — play all 3 rounds!"},{e:"⭐",t:"Rarity Tiers",d:"Common → Uncommon → Rare → Legendary. Rare drops on Pro difficulty. Legendary cards are very rare."},{e:"⚔️",t:"Card Battle",d:"Build a 5-card deck and battle other cards in your collection. Win best-of-5 rounds."},{e:"⚡",t:"Power-ups",d:"Each card has an ability with a cooldown — boost battle power, reveal clues, and more."},{e:"🏟️",t:"Type Advantage",d:"Transit beats Geography · Geography beats Sports · Sports beats Transit. Strategy matters!"}].map(x=>(
          <div key={x.t} style={{background:T.surface,border:"1px solid rgba(200,168,0,.2)",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:12}}>
            <span style={{fontSize:fs(22),flexShrink:0}}>{x.e}</span>
            <div>
              <div style={{fontSize:fs(11),fontWeight:700,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:fs(9),color:T.textMuted,lineHeight:1.6}}>{x.d}</div>
            </div>
          </div>
        ))}
        <button onClick={()=>setHelpStep(5)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,cursor:"pointer",marginTop:4}}>💡 PRO TIPS →</button>
      </div>}

      {/* Step 5: Tips */}
      {helpStep===5&&<div style={{animation:"helpSlide .18s ease both"}}>
        {[{e:"🎯",t:"Start with the year",d:"Year gives a numeric direction (▲▼) right away. Use it first to narrow your search."},{e:"🔒",t:"Pro mode filter",d:"Confirmed clues lock your search — only valid guesses remain. Use this to your advantage."},{e:"🗺️",t:"System Peek",d:"Spend guesses to see a transit map with your zone marked. Great when stuck on lines."},{e:"💡",t:"Save hints for later",d:"In Blitz mode, hints reveal letters. Use them near the end when the clock gets tight."},{e:"🃏",t:"Play all 3 rounds",d:"Each round earns a card and a point. Don't stop at one win — go for the full 3."},{e:"🔥",t:"Protect your streak",d:"Play at least once each day. Even a loss keeps your streak — it only needs a completed round."}].map((x,i)=>(
          <div key={x.t} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:12,animation:`helpSlide .2s ${i*.05}s ease both`}}>
            <span style={{fontSize:fs(22),flexShrink:0}}>{x.e}</span>
            <div>
              <div style={{fontSize:fs(11),fontWeight:700,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:fs(9),color:T.textMuted,lineHeight:1.6}}>{x.d}</div>
            </div>
          </div>
        ))}
        <button onClick={onPlay} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"14px",fontFamily:"'Cinzel',serif",fontSize:fs(14),fontWeight:700,letterSpacing:2,cursor:"pointer",marginTop:8}}>{G.itemEmoji} I'M READY — PLAY NOW</button>
      </div>}
    </div>
  );
}

// ── INTERACTIVE TUTORIAL ──────────────────────────────────────────────────────
function DemoCell({idx,color,label,value,cellsLit}:{idx:number,color:string,label:string,value:string,cellsLit:number}){
  const on=cellsLit>=idx;
  const bg:any={green:"#d4edda",yellow:"#fff3cd",red:"#fde8e8"};
  const bc:any={green:"#2ecc71",yellow:"#e8b800",red:"#e74c3c"};
  const tc:any={green:"#155724",yellow:"#7a5800",red:"#7f1d1d"};
  return(<div style={{background:on?bg[color]:"#f5f5f5",border:`1.5px solid ${on?bc[color]:"#e0e0e0"}`,borderRadius:6,padding:"6px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:40,transition:"background .35s,border-color .35s",flex:1}}>
    {on?<div style={{fontSize:"9px",fontWeight:700,color:tc[color],textAlign:"center",lineHeight:1.2}}>{value}</div>:<div style={{height:10,width:"60%",background:"#e0e0e0",borderRadius:3}}/>}
    {on&&<div style={{fontSize:"7px",color:tc[color],opacity:.7,marginTop:2,letterSpacing:.5}}>{label}</div>}
  </div>);
}
function InteractiveTutorial({T,fs,gameKey,DIFF,lineColors,onDone}:{T:any,fs:any,gameKey:string,DIFF:any,lineColors:any,onDone:()=>void}){
  const[step,setStep]=useState(0);
  const[cellsLit,setCellsLit]=useState(-1);
  const G=GAMES[gameKey];
  const isTransit=gameKey!=="states"&&gameKey!=="nfl";
  const demoItem=gameKey==="pdx"
    ?{name:"Pioneer Courthouse/SW 6th"}
    :gameKey==="dc"?{name:"Metro Center"}
    :gameKey==="nfl"?{name:"Kansas City Chiefs"}
    :gameKey==="balt"?{name:"Lexington Market"}
    :{name:"California"};
  const STEPS=[
    {title:`Welcome to ${G.name}`,body:`Every day a secret ${G.itemLabel} is chosen. You have ${DIFF.maxGuesses} guesses to find it — each guess reveals colored clues to guide you closer.`,icon:G.emoji,cta:"Show me how it works →"},
    {title:"Make a guess, get clues",body:`Type any ${G.itemLabel} and tap it. Each column lights up — green is exact, yellow is close, red is off.`,icon:null,cta:"Got it →",demo:true},
    {title:"Build your streak",body:null,icon:"🔥",cta:"Got it, let's play",streak:true},
  ];
  function dismiss(){localStorage.setItem("onboarding_complete","1");onDone();}
  useEffect(()=>{
    if(step!==1)return;
    setCellsLit(-1);
    const t=setTimeout(()=>{let i=-1;const iv=setInterval(()=>{i++;setCellsLit(i);if(i>=DIFF.cols.length)clearInterval(iv);},350);},600);
    return()=>clearTimeout(t);
  },[step]);
  const cols=DIFF.cols;
  const colLabels:any=gameKey==="nfl"?{conf:"CONF",div:"DIV",region:"REGION",sb:"SB",year:"YEAR"}:isTransit?{lines:"LINES",zone:"ZONE",busy:"BUSY",direction:"DIR",year:"YEAR"}:{region:"REGION",coast:"COAST",pop:"POP",direction:"DIR",year:"YEAR",size:"SIZE"};
  const s=STEPS[step];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto",fontFamily:"'Inter','Helvetica Neue',sans-serif",animation:"obFadeIn .25s ease both"}}>
      <style>{`@keyframes obFadeIn{from{opacity:0}to{opacity:1}}@keyframes obCardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{background:"#fff",borderRadius:16,padding:"32px 24px",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.18)",animation:"obCardIn .32s .05s ease both"}}>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:28}}>
          {STEPS.map((_,i)=>(<div key={i} style={{width:i===step?24:7,height:7,borderRadius:4,background:i<=step?"#0a0a0a":"#e5e5e5",transition:"all .3s"}}/>))}
        </div>
        {s.icon&&<div style={{textAlign:"center",fontSize:"48px",marginBottom:16}}>{s.icon}</div>}
        <div style={{fontSize:"20px",fontWeight:700,color:"#0a0a0a",textAlign:"center",marginBottom:10,lineHeight:1.25,letterSpacing:"-.3px"}}>{s.title}</div>
        {s.body&&<div style={{fontSize:"14px",fontWeight:300,color:"rgba(0,0,0,.5)",textAlign:"center",lineHeight:1.85,marginBottom:24}}>{s.body}</div>}
        {(s as any).demo&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:"10px",letterSpacing:2,color:"rgba(0,0,0,.3)",textAlign:"center",marginBottom:10,fontWeight:600}}>SAMPLE GUESS — WATCH THE CELLS LIGHT UP</div>
            <div style={{background:"#f9f9f9",border:"1px solid rgba(0,0,0,.08)",borderRadius:8,padding:"10px",marginBottom:8,fontSize:"13px",fontWeight:700,color:"#0a0a0a",textAlign:"center"}}>{demoItem.name}</div>
            <div style={{display:"flex",gap:4}}>
              {cols.map((col:string,idx:number)=>{
                const colors=["green","yellow","red","yellow","green","red"];
                const vals:any=gameKey==="nfl"?{conf:"AFC",div:"West",region:"Midwest",sb:"4🏆",year:"1960"}:isTransit?{lines:"🔵🔴",zone:"DWNTN",busy:"🌕 Packed",direction:"→ City",year:"1986"}:{region:"Pacific",coast:"Pacific",pop:"🌕 Massive",direction:"→ East",year:"1850",size:"💠 Massive"};
                return(<DemoCell key={col} idx={idx} color={colors[idx%colors.length]} label={colLabels[col]||col} value={vals[col]||"—"} cellsLit={cellsLit}/>);
              })}
              <div style={{background:cellsLit>=cols.length?"#d4edda":"#f5f5f5",border:`1.5px solid ${cellsLit>=cols.length?"#2ecc71":"#e0e0e0"}`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",minWidth:28,transition:"all .35s"}}>
                {cellsLit>=cols.length?<span style={{color:"#155724",fontWeight:700,fontSize:"14px"}}>✓</span>:<div style={{width:10,height:12}}/>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
              {[{bg:"#d4edda",bc:"#2ecc71",tc:"#155724",l:"🟩 Exact"},{bg:"#fff3cd",bc:"#e8b800",tc:"#7a5800",l:"🟨 Close"},{bg:"#fde8e8",bc:"#e74c3c",tc:"#7f1d1d",l:"🟥 Off"}].map(x=>(
                <div key={x.l} style={{background:x.bg,border:`1px solid ${x.bc}`,borderRadius:6,padding:"4px 9px",fontSize:"10px",color:x.tc,fontWeight:600}}>{x.l}</div>
              ))}
            </div>
          </div>
        )}
        {(s as any).streak&&(
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {[
              {icon:"🎯",title:"3 rounds per day",body:`Each day has 3 different ${G.itemLabel}s to find. A fresh set every 24 hours.`},
              {icon:"🔥",title:"Build your streak",body:"Play every day to grow your streak. Miss a day and it resets — don't break the chain!"},
              {icon:"🏆",title:"Post your score",body:"Post your results to the leaderboard after each round and see how you stack up."},
            ].map(item=>(
              <div key={item.icon} style={{background:"#f9f9f9",border:"1px solid rgba(0,0,0,.07)",borderRadius:10,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:"20px",flexShrink:0,marginTop:1}}>{item.icon}</div>
                <div><div style={{fontSize:"13px",fontWeight:700,color:"#0a0a0a",marginBottom:2}}>{item.title}</div><div style={{fontSize:"12px",color:"rgba(0,0,0,.45)",lineHeight:1.65}}>{item.body}</div></div>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>{if(step===STEPS.length-1)dismiss();else setStep(step+1);}}
            style={{width:"100%",background:"#0a0a0a",color:"#fff",border:"none",borderRadius:3,padding:"15px",fontFamily:"'Inter',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:3,cursor:"pointer",transition:"background .2s"}}>
            {s.cta.toUpperCase()}
          </button>
          <button onClick={dismiss} style={{background:"transparent",color:"rgba(0,0,0,.35)",border:"none",fontFamily:"'Inter',sans-serif",fontSize:"11px",letterSpacing:.5,cursor:"pointer",padding:"6px",textDecoration:"underline"}}>Skip</button>
          {step>0&&<button onClick={()=>setStep(step-1)} style={{background:"transparent",color:"rgba(0,0,0,.35)",border:"none",fontFamily:"'Inter',sans-serif",fontSize:"11px",cursor:"pointer",padding:"6px"}}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ── LEADERBOARD TAB ───────────────────────────────────────────────────────────
function LeaderboardTab({T,fs,gameKey,diff,dayNum,roundData,profile}){
  const[lbGameKey,setLbGameKey]=useState(gameKey);
  const[submitName,setSubmitName]=useState(profile?.name||"");
  const[submitRound,setSubmitRound]=useState<number|null>(null);
  const[justSubmitted,setJustSubmitted]=useState<Record<string,boolean>>({});
  const[myRank,setMyRank]=useState<Record<string,number>>({});
  const[liveEntries,setLiveEntries]=useState<any[]>([]);
  const[liveTotal,setLiveTotal]=useState(0);
  const[liveLoading,setLiveLoading]=useState(false);
  const[liveError,setLiveError]=useState(false);
  const[submitting,setSubmitting]=useState(false);

  useEffect(()=>{
    setLiveLoading(true);setLiveError(false);
    fetch(`/api/scores/leaderboard/${lbGameKey}/${dayNum}`)
      .then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{setLiveEntries(d.entries||[]);setLiveTotal(d.total||0);setLiveLoading(false);})
      .catch(()=>{setLiveEntries([]);setLiveLoading(false);setLiveError(true);});
  },[lbGameKey,dayNum]);

  const G=GAMES[gameKey];
  const completedRounds=(roundData[gameKey]||[]).map((r:any,i:number)=>({...r,idx:i})).filter((r:any)=>(r.won||r.lost)&&!justSubmitted[`${gameKey}:${dayNum}:${r.idx}`]);

  async function handleSubmit(roundIdx:number){
    const name=submitName.trim();if(!name||submitting)return;
    const rd=(roundData[gameKey]||[])[roundIdx];if(!rd)return;
    setSubmitting(true);
    const payload={playerName:name,gameKey,dayNum,roundIdx,difficulty:diff,guessCount:rd.guesses.length,won:!!rd.won};
    try{
      const res=await fetch("/api/scores/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(res.ok){
        const data=await res.json();
        setMyRank(p=>({...p,[`${gameKey}:${dayNum}:${roundIdx}`]:data.rank}));
        const lb2=await fetch(`/api/scores/leaderboard/${gameKey}/${dayNum}`);
        if(lb2.ok){const d=await lb2.json();if(gameKey===lbGameKey){setLiveEntries(d.entries||[]);setLiveTotal(d.total||0);}}
      }
    }catch{}
    const lsEntry={id:Date.now(),playerName:name,...payload,ts:new Date().toISOString()};
    try{const prev=JSON.parse(localStorage.getItem('tgg:lb')||'[]');localStorage.setItem('tgg:lb',JSON.stringify([lsEntry,...prev].slice(0,100)));}catch{}
    setJustSubmitted(p=>({...p,[`${gameKey}:${dayNum}:${roundIdx}`]:true}));
    setSubmitRound(null);
    setSubmitting(false);
  }

  const lbG=GAMES[lbGameKey]||GAMES.pdx;
  const totalWins=liveEntries.filter(e=>e.won).length;
  const avgG=totalWins>0?(liveEntries.filter(e=>e.won).reduce((s:number,e:any)=>s+e.guessCount,0)/totalWins).toFixed(1):"—";
  const topPlayer=liveEntries.length?liveEntries[0].playerName:"—";

  return(
    <div style={{maxWidth:600,margin:"0 auto",padding:"16px 12px 60px",position:"relative",zIndex:2}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:fs(7),letterSpacing:3,color:T.textMuted}}>TODAY · DAY #{dayNum}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {liveLoading&&<div style={{fontSize:fs(7),color:T.textMuted}}>Loading…</div>}
          {!liveLoading&&!liveError&&<div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(40,200,80,.12)",border:"1px solid rgba(40,200,80,.3)",borderRadius:20,padding:"3px 10px"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#40c060",animation:"pulse 1.8s ease-in-out infinite"}}/>
            <span style={{fontSize:fs(7),color:"#40c060",fontWeight:700,letterSpacing:1}}>LIVE</span>
          </div>}
          {liveError&&<div style={{fontSize:fs(7),color:T.textMuted,letterSpacing:1}}>OFFLINE</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
        {[{l:"TODAY",v:liveTotal},{l:"WINS",v:totalWins},{l:"AVG GUESS",v:avgG},{l:"TOP PLAYER",v:topPlayer}].map(s=>(
          <div key={s.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
            <div style={{fontSize:fs(12),fontWeight:800,color:T.accentB,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px"}}>{String(s.v)}</div>
            <div style={{fontSize:fs(6),color:T.textMuted,letterSpacing:1,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      {completedRounds.length>0&&(
        <div style={{background:T.card,border:`1.5px solid ${T.accent}`,borderRadius:12,padding:"16px",marginBottom:14}}>
          <div style={{fontSize:fs(9),letterSpacing:2,color:T.accent,marginBottom:8}}>🏆 POST YOUR SCORE</div>
          <div style={{marginBottom:10,display:"flex",gap:6}}>
            <input value={submitName} onChange={e=>setSubmitName(e.target.value)} placeholder="Your name (max 30 chars)" maxLength={30}
              style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 10px",color:T.text,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),outline:"none"}}/>
          </div>
          {completedRounds.map((r:any)=>{
            const rankKey=`${gameKey}:${dayNum}:${r.idx}`;
            const rank=myRank[rankKey];
            return(
              <div key={r.idx} style={{marginBottom:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,background:r.won?T.cellBg.green:T.cellBg.red,border:`1px solid ${r.won?T.cellBorder.green:T.cellBorder.red}`,borderRadius:6,padding:"6px 10px",fontSize:fs(10),color:r.won?T.cellText.green:T.cellText.red,fontWeight:700}}>
                    Round {r.idx+1}: {r.won?`✓ Won in ${r.guesses.length} guess${r.guesses.length!==1?"es":""}`:"✗ Did not finish"}
                  </div>
                  {rank&&<div style={{fontSize:fs(9),color:T.accentB,fontWeight:700}}>#{rank}</div>}
                  <button onClick={()=>submitRound===r.idx?setSubmitRound(null):setSubmitRound(r.idx)}
                    style={{background:T.accent,color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),fontWeight:700,cursor:"pointer",letterSpacing:1}}>
                    {submitRound===r.idx?"CANCEL":"POST →"}
                  </button>
                </div>
                {submitRound===r.idx&&(
                  <div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}>
                    <button onClick={()=>handleSubmit(r.idx)} disabled={!submitName.trim()||submitting}
                      style={{background:T.accent,color:"#fff",border:"none",borderRadius:6,padding:"8px 20px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),fontWeight:700,cursor:"pointer",opacity:(!submitName.trim()||submitting)?0.6:1,letterSpacing:1}}>
                      {submitting?"POSTING…":"POST SCORE →"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {Object.values(GAMES).map((g:any)=>(
          <button key={g.key} onClick={()=>setLbGameKey(g.key)}
            style={{flex:1,minWidth:60,background:lbGameKey===g.key?g.accent:T.surface,color:lbGameKey===g.key?"#fff":T.textMuted,border:`1px solid ${lbGameKey===g.key?g.accent:T.border}`,borderRadius:8,padding:"7px 4px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(8),fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
            {g.emoji} {g.short}
          </button>
        ))}
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"32px 1fr 60px 50px",gap:4,padding:"8px 12px",borderBottom:`1px solid ${T.border}`,fontSize:fs(7),color:T.textMuted,letterSpacing:2}}>
          <div>#</div><div>PLAYER</div><div>DIFF</div><div>GUESSES</div>
        </div>
        {liveLoading&&(
          <div style={{padding:"24px",textAlign:"center",color:T.textMuted,fontSize:fs(10)}}>
            <div style={{fontSize:"24px",marginBottom:8}}>⏳</div>
            <div>Loading live scores…</div>
          </div>
        )}
        {!liveLoading&&liveEntries.length===0&&(
          <div style={{padding:"24px",textAlign:"center",color:T.textMuted,fontSize:fs(10)}}>
            <div style={{fontSize:"32px",marginBottom:8}}>🏆</div>
            <div>{liveError?"Could not load scores. Check your connection.":"No scores yet for today. Be the first!"}</div>
          </div>
        )}
        {!liveLoading&&liveEntries.map((entry:any,i:number)=>{
          const diffConf=(lbG.diffConfig||{})[entry.difficulty];
          return(
            <div key={entry.id} style={{display:"grid",gridTemplateColumns:"32px 1fr 60px 50px",gap:4,padding:"9px 12px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:i===0?`${lbG.accent}08`:"transparent"}}>
              <div style={{fontSize:fs(10),fontWeight:700,color:i<3?T.accentB:T.textMuted}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
              <div style={{fontSize:fs(11),fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.playerName}</div>
              <div style={{fontSize:fs(8),color:T.textMuted}}>{diffConf?.emoji||""} {entry.difficulty||""}</div>
              <div style={{textAlign:"center"}}>
                <span style={{background:entry.won?T.cellBg.green:T.cellBg.red,color:entry.won?T.cellText.green:T.cellText.red,border:`1px solid ${entry.won?T.cellBorder.green:T.cellBorder.red}`,borderRadius:4,padding:"2px 6px",fontSize:fs(9),fontWeight:700}}>
                  {entry.won?entry.guessCount:"✗"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

function BlitzMode({T,fs,items,lineColors,gameKey,blitzBest,onNewBest,onClose}:{T:any,fs:any,items:any[],lineColors:any,gameKey:string,blitzBest:number,onNewBest:(n:number)=>void,onClose:()=>void}){
  const[phase,setPhase]=useState("intro");
  const[timeLeft,setTimeLeft]=useState(90);
  const[score,setScore]=useState(0);
  const[input,setInput]=useState("");
  const[guessed,setGuessed]=useState(new Set<string>());
  const[flash,setFlash]=useState<string|null>(null);
  const[lastMsg,setLastMsg]=useState("");
  const[category,setCategory]=useState<any>(null);
  const[hintsLeft,setHintsLeft]=useState(2);
  const[shownHint,setShownHint]=useState<string|null>(null);
  const[quitEarly,setQuitEarly]=useState(false);
  const[listening,setListening]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const bg="#fff";const surface="#f5f5f5";const bdr="#e0e0e0";const txt="#0a0a0a";const txtSub="#444";const txtMuted="#888";
  function pickCategory(){
    const types=["letter","group1"];
    const type=types[Math.floor(Math.random()*types.length)];
    if(type==="letter"){
      const letters=[...new Set(items.map(s=>s.name[0]))].filter(l=>items.filter(s=>s.name.startsWith(l)).length>=3);
      const letter=letters[Math.floor(Math.random()*letters.length)];
      const targets=items.filter(s=>s.name.startsWith(letter));
      const itemWord=gameKey==="states"?"state":gameKey==="nfl"?"team":"station";
      return{label:`Name every ${itemWord} starting with "${letter}"`,targets,hint:`${targets.length} total`};
    }
    if(gameKey==="nfl"){
      const groups=["conf","div","region"];
      const g=groups[Math.floor(Math.random()*groups.length)];
      const vals=[...new Set(items.map(s=>s[g]))];
      const val=vals[Math.floor(Math.random()*vals.length)];
      const targets=items.filter(s=>s[g]===val);
      const label=g==="conf"?`Name all ${val} teams`:g==="div"?`Name all ${val} Division teams`:`Name every ${val} region team`;
      return{label,targets,hint:`${targets.length} teams`};
    }
    if(gameKey==="states"){
      const groups=["region","coast"];
      const g=groups[Math.floor(Math.random()*groups.length)];
      const vals=[...new Set(items.map(s=>s[g]))];
      const val=vals[Math.floor(Math.random()*vals.length)];
      const targets=items.filter(s=>s[g]===val);
      return{label:`Name every ${val} state`,targets,hint:`${targets.length} states`};
    }
    const G=gameKey==="pdx"?PDX_LINES:gameKey==="balt"?BALT_LINES:DC_LINES;
    const lines=Object.keys(G);
    const line=lines[Math.floor(Math.random()*lines.length)];
    const targets=items.filter(s=>s.lines?.includes(line));
    return{label:`Name every ${line} Line station`,targets,hint:`${targets.length} stations`};
  }
  useEffect(()=>{setCategory(pickCategory());},[]);
  useEffect(()=>{if(phase!=="playing")return;if(timeLeft<=0){setPhase("done");return;}const t=setTimeout(()=>setTimeLeft(t=>t-1),1000);return()=>clearTimeout(t);},[phase,timeLeft]);
  useEffect(()=>{if(phase==="playing"&&category&&category.targets.length>0&&guessed.size>=category.targets.length)setPhase("done");},[guessed,phase,category]);
  function normalize(s:string){
    const abbr:Record<string,string>={
      'ave':'avenue','blvd':'boulevard','rd':'road','st':'street','dr':'drive',
      'pkwy':'parkway','hwy':'highway','tc':'transit center','ctr':'center',
      'sq':'square','mt':'mount','intl':'international','natl':'national',
    };
    // Convert slashes and hyphens to spaces so "Gateway/NE" → "gateway ne" not "gatewayne"
    const raw=s.toLowerCase().replace(/[\/\-]/g," ").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
    // Expand whole-word abbreviations so "Branch Ave" and "Branch Avenue" both → "branch avenue"
    return raw.split(" ").map(w=>abbr[w]??w).join(" ");
  }
  function handleSubmit(val?:string){
    const trimmed=(val??input).trim();if(!trimmed)return;
    const ni=normalize(trimmed);
    const match=items.find(s=>{
      if(normalize(s.name)===ni)return true;
      if(s.abbr&&normalize(s.abbr)===ni.toUpperCase())return true;
      if(ni.length>=4&&normalize(s.name).startsWith(ni)){const hasExact=items.some(x=>normalize(x.name)===ni);return!hasExact;}
      return false;
    });
    setInput("");
    if(!match){SoundEngine.play("blitzWrong");setFlash("wrong");setLastMsg("Not a valid name");setTimeout(()=>setFlash(null),800);return;}
    if(guessed.has(match.name)){SoundEngine.play("blitzWrong");setFlash("dupe");setLastMsg(`${match.name} — already got it!`);setTimeout(()=>setFlash(null),800);return;}
    if(!category?.targets.some((t:any)=>t.name===match.name)){SoundEngine.play("blitzWrong");setFlash("wrong");setLastMsg(`${match.name} — not in this category`);setTimeout(()=>setFlash(null),800);return;}
    SoundEngine.play("blitzCorrect");setGuessed(g=>new Set([...g,match.name]));setScore(s=>s+1);setFlash("correct");setLastMsg(match.name);setTimeout(()=>setFlash(null),700);
    inputRef.current?.focus();
  }
  function handleBlitzChange(v:string){
    setInput(v);
    const ni=normalize(v.trim());
    if(!ni)return;
    const exact=items.find(s=>normalize(s.name)===ni||(s.abbr&&normalize(s.abbr)===ni.toUpperCase()));
    if(exact&&!guessed.has(exact.name)&&category?.targets.some((t:any)=>t.name===exact.name)){
      handleSubmit(v);
    }
  }
  function useHint(){
    if(hintsLeft<=0||!category)return;
    const missing=category.targets.filter((t:any)=>!guessed.has(t.name));
    if(missing.length===0)return;
    const pick=missing[Math.floor(Math.random()*missing.length)];
    const hintText=generateHints(pick,gameKey)[0];
    setShownHint(hintText);setTimeLeft(t=>Math.max(0,t-10));setHintsLeft(h=>h-1);
    SoundEngine.play("hint");
  }
  function startListening(){
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR||listening)return;
    try{
      const sr=new SR();sr.continuous=false;sr.interimResults=false;sr.lang="en-US";
      setListening(true);
      const safetyTimer=setTimeout(()=>setListening(false),9000);
      sr.onresult=(e:any)=>{clearTimeout(safetyTimer);const t=e.results[0][0].transcript;setListening(false);handleSubmit(t);};
      sr.onerror=()=>{clearTimeout(safetyTimer);setListening(false);};
      sr.onend=()=>{clearTimeout(safetyTimer);setListening(false);};
      sr.start();
    }catch(err){setListening(false);}
  }
  useEffect(()=>{if(phase==="done"&&score>blitzBest)onNewBest(score);},[phase]);
  const tc=timeLeft>20?"green":timeLeft>10?"yellow":"red";
  const missed=category?.targets.filter((t:any)=>!guessed.has(t.name))||[];
  const hasSpeech=!!(((window as any).SpeechRecognition)||(window as any).webkitSpeechRecognition);
  return(
    <div style={{position:"fixed",inset:0,background:bg,zIndex:400,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px",fontFamily:"'JetBrains Mono',monospace"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(20),color:txt}}>⚡ Blitz Mode</div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${bdr}`,borderRadius:6,padding:"5px 12px",color:txtMuted,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),cursor:"pointer"}}>✕ EXIT</button>
        </div>
        {phase==="intro"&&category&&(<div style={{textAlign:"center"}}>
          <div style={{fontSize:"52px",marginBottom:14}}>⚡</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(18),color:txt,marginBottom:10,lineHeight:1.4}}>{category.label}</div>
          <div style={{background:surface,border:`1px solid ${bdr}`,borderRadius:10,padding:"12px 16px",marginBottom:8,fontSize:fs(11),color:txtSub,lineHeight:1.7}}>Type from memory — no dropdown. Press Enter to submit.<br/><span style={{color:txtMuted,fontSize:fs(10)}}>{category.hint} · 90 seconds · 2 hints available (−10s each)</span></div>
          <div style={{fontSize:fs(11),color:txtSub,marginBottom:20}}>Best: <strong style={{color:T.accentB}}>{blitzBest}</strong></div>
          <button onClick={()=>{SoundEngine.play("blitzStart");setPhase("playing");setTimeout(()=>inputRef.current?.focus(),100);}} style={{background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(16),fontWeight:700,letterSpacing:3,padding:"16px 32px",borderRadius:10,cursor:"pointer"}}>START ⚡</button>
          <button onClick={()=>setCategory(pickCategory())} style={{display:"block",margin:"12px auto 0",background:"transparent",color:txtMuted,border:`1px solid ${bdr}`,borderRadius:6,padding:"7px 16px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),cursor:"pointer"}}>↺ DIFFERENT CHALLENGE</button>
        </div>)}
        {phase==="playing"&&category&&(<div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,background:T.cellBg[tc],border:`2px solid ${T.cellBorder[tc]}`,borderRadius:10,padding:"10px",textAlign:"center",transition:"all .3s"}}>
              <div style={{fontSize:fs(32),fontWeight:800,color:T.cellText[tc]}}>{String(timeLeft).padStart(2,"0")}s</div>
            </div>
            <div style={{flex:1,background:T.cellBg.green,border:`2px solid ${T.cellBorder.green}`,borderRadius:10,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:fs(28),fontWeight:800,color:T.cellText.green}}>{score}</div>
              <div style={{fontSize:fs(8),color:T.cellText.green,opacity:.8}}>/ {category.targets.length}</div>
            </div>
            <button onClick={()=>useHint()} disabled={hintsLeft<=0} style={{background:hintsLeft>0?"#fffbe6":surface,border:`1.5px solid ${hintsLeft>0?"#e6b800":bdr}`,borderRadius:10,padding:"8px 10px",cursor:hintsLeft>0?"pointer":"not-allowed",color:hintsLeft>0?"#8a6800":txtMuted,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(8),fontWeight:700,flexShrink:0,textAlign:"center",lineHeight:1.3}}>💡<br/>HINT<br/><span style={{fontSize:fs(7)}}>{hintsLeft} left</span></button>
            <button onClick={()=>{setQuitEarly(true);setPhase("done");}} style={{background:surface,border:"1.5px solid #e05050",borderRadius:10,padding:"8px 10px",cursor:"pointer",color:"#c03030",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(8),fontWeight:700,flexShrink:0}}>✕<br/>QUIT</button>
          </div>
          {shownHint&&<div style={{background:"#fffbe6",border:"1.5px solid #e6b800",borderRadius:8,padding:"7px 14px",marginBottom:8,fontSize:fs(11),color:"#6a4a00",fontWeight:600}}>💡 Hint: <strong>{shownHint}</strong> <span style={{fontWeight:400,opacity:.6}}>(−10s)</span></div>}
          <div style={{background:surface,border:`1px solid ${bdr}`,borderRadius:8,padding:"8px 14px",marginBottom:8,fontSize:fs(11),color:txt,textAlign:"center"}}>{category.label}</div>
          <div style={{background:"#fff",border:`2px solid ${flash==="correct"?T.cellBorder.green:flash?"#e05050":bdr}`,borderRadius:8,display:"flex",alignItems:"center",gap:8,padding:"0 14px",marginBottom:6,transition:"border-color .2s",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <span style={{fontSize:fs(15),opacity:.3}}>⚡</span>
            <input ref={inputRef} value={input} onChange={e=>handleBlitzChange(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}} placeholder="Type a name to auto-submit..." autoComplete="off"
              style={{flex:1,background:"transparent",border:"none",outline:"none",color:txt,fontSize:fs(13),padding:"14px 0",fontFamily:"'JetBrains Mono',monospace"}}/>
            {hasSpeech&&<button onClick={startListening} title="Speak to input" style={{background:listening?"#e8f5e9":"transparent",border:`1px solid ${listening?T.cellBorder.green:bdr}`,borderRadius:6,padding:"5px 7px",cursor:"pointer",color:listening?T.cellText.green:txtMuted,fontSize:fs(14),lineHeight:1,transition:"all .2s",flexShrink:0}}>{listening?"🔴":"🎤"}</button>}
            <button onClick={()=>handleSubmit()} style={{background:T.accent,color:"#fff",border:"none",borderRadius:5,padding:"6px 10px",cursor:"pointer",fontSize:fs(9),fontWeight:700,flexShrink:0}}>GO</button>
          </div>
          {flash==="correct"&&<div style={{background:T.cellBg.green,border:`1px solid ${T.cellBorder.green}`,borderRadius:8,padding:"7px 14px",marginBottom:6,fontSize:fs(12),color:T.cellText.green,fontWeight:700}}>✓ {lastMsg}</div>}
          {(flash==="wrong"||flash==="dupe")&&<div style={{background:T.cellBg.red,border:`1px solid ${T.cellBorder.red}`,borderRadius:8,padding:"7px 14px",marginBottom:6,fontSize:fs(11),color:T.cellText.red}}>✗ {lastMsg}</div>}
          {guessed.size>0&&(<div style={{background:surface,border:`1px solid ${bdr}`,borderRadius:8,padding:"10px 12px",maxHeight:160,overflowY:"auto",marginTop:4}}>
            <div style={{fontSize:fs(8),color:txtMuted,letterSpacing:2,marginBottom:6}}>GUESSED ({guessed.size}/{category.targets.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{[...guessed].map(n=>(<div key={n} style={{background:T.cellBg.green,border:`1px solid ${T.cellBorder.green}`,borderRadius:4,padding:"3px 8px",fontSize:fs(8),color:T.cellText.green}}>✓ {n}</div>))}</div>
          </div>)}
        </div>)}
        {phase==="done"&&category&&(<div>
          <div style={{textAlign:"center",marginBottom:16}}>
            {missed.length===0?(
              <>
                <div style={{fontSize:"56px",marginBottom:8}}>🎉</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(24),color:T.accent,marginBottom:6,letterSpacing:2}}>PERFECT!</div>
                <div style={{fontSize:fs(12),color:txtSub,marginBottom:4}}>You named all {category.targets.length} — with time to spare!</div>
              </>
            ):(
              <>
                <div style={{fontSize:"48px",marginBottom:8}}>{quitEarly?"🛑":"⚡"}</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(24),color:txt,marginBottom:4}}>{quitEarly?"Quit Early":"Time's Up!"}</div>
                <div style={{fontSize:fs(13),color:txtSub,marginBottom:4}}>{score} / {category.targets.length}</div>
              </>
            )}
            {score>blitzBest&&score>0&&<div style={{background:T.cellBg.green,border:`1px solid ${T.cellBorder.green}`,borderRadius:8,padding:"7px 14px",marginBottom:8,fontSize:fs(11),color:T.cellText.green,display:"inline-block"}}>🏆 New best!</div>}
          </div>
          {missed.length>0&&(<div style={{background:surface,border:`1px solid ${bdr}`,borderRadius:10,padding:"12px",marginBottom:14}}>
            <div style={{fontSize:fs(10),color:txtMuted,letterSpacing:2,marginBottom:8}}>YOU MISSED ({missed.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{missed.map((s:any)=>(<div key={s.name} style={{background:T.cellBg.red,border:`1px solid ${T.cellBorder.red}`,borderRadius:5,padding:"4px 8px",fontSize:fs(9),color:T.cellText.red}}>{s.name}{s.abbr?` (${s.abbr})`:""}</div>))}</div>
          </div>)}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setPhase("intro");setScore(0);setTimeLeft(90);setGuessed(new Set());setInput("");setFlash(null);setHintsLeft(2);setShownHint(null);setQuitEarly(false);setCategory(pickCategory());}} style={{flex:1,background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(12),fontWeight:700,letterSpacing:2,padding:"12px",borderRadius:8,cursor:"pointer"}}>PLAY AGAIN</button>
            <button onClick={onClose} style={{flex:1,background:"transparent",color:txtMuted,border:`1px solid ${bdr}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(11),padding:"12px",borderRadius:8,cursor:"pointer"}}>DONE</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}

// ── ITEM OF WEEK ──────────────────────────────────────────────────────────────
function ItemOfWeek({T,fs,items,lineColors,gameKey,onClose}:{T:any,fs:any,items:any[],lineColors:any,gameKey:string,onClose:()=>void}){
  const item=useMemo(()=>{const week=Math.floor(getDayNum()/7);const x=Math.abs(week*1103515245+12345)&0x7fffffff;return items[x%items.length];},[gameKey]);
  const[answered,setAnswered]=useState<(string|null)[]>([null,null,null]);
  const[score,setScore]=useState<number|null>(null);
  const qs=useMemo(()=>{
    function makeQ(q:string,correct:string,wrongs:string[]){const opts=[correct,...wrongs.slice(0,3)].sort(()=>Math.random()-.5);return{q,opts,correct};}
    if(gameKey==="nfl"){
      const allConf=["AFC","NFC"].filter(c=>c!==item.conf);
      const allDiv=["East","West","North","South"].filter(d=>d!==item.div).sort(()=>Math.random()-.5).slice(0,3) as string[];
      const sbWrong=[item.sb+1,item.sb+3,Math.max(0,item.sb-2)].filter(v=>v!==item.sb).slice(0,3).map(String);
      return[makeQ(`What conference is the ${item.name} in?`,item.conf,allConf),makeQ(`What division are the ${item.name} in?`,item.div,allDiv),makeQ(`How many Super Bowls have the ${item.name} won?`,String(item.sb),sbWrong)];
    }
    if(gameKey==="states"){
      const allR=[...new Set(items.map(s=>s.region))].filter(r=>r!==item.region).sort(()=>Math.random()-.5).slice(0,3) as string[];
      const allC=[...new Set(items.map(s=>s.coast))].filter(c=>c!==item.coast).sort(()=>Math.random()-.5).slice(0,3) as string[];
      const yrs=[item.year-20,item.year+18,item.year+35].filter((y:number)=>y>1780&&y<=1960&&y!==item.year).map(String).sort(()=>Math.random()-.5).slice(0,3);
      return[makeQ(`Which region is ${item.name} in?`,item.region,allR),makeQ(`${item.name} has which type of coast?`,item.coast,allC),makeQ(`What year was ${item.name} admitted?`,String(item.year),yrs)];
    }
    const allZ=[...new Set(items.map(s=>s.zone))].filter(z=>z!==item.zone).sort(()=>Math.random()-.5).slice(0,3) as string[];
    const allL=[...new Set(items.flatMap(s=>s.lines||[]))].filter(l=>!item.lines?.includes(l)) as string[];
    const yrs=[item.year-10,item.year+8,item.year+20].filter((y:number)=>y!==item.year).map(String).slice(0,3);
    return[makeQ(`Which zone is ${item.name} in?`,item.zone,allZ),makeQ(`${item.name} serves which line?`,item.lines?.join(" & ")||"—",allL.sort(()=>Math.random()-.5).slice(0,3).map(l=>l+" only")),makeQ(`What year did ${item.name} open?`,String(item.year),yrs)];
  },[item]);
  function handleAnswer(qi:number,opt:string){if(answered[qi]!==null)return;const newA=[...answered];newA[qi]=opt;setAnswered(newA);if(newA.every(a=>a!==null))setScore(newA.filter((a,i)=>a===qs[i].correct).length);}
  const G=GAMES[gameKey];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:400,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 50px"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(18),color:T.text}}>{G.emoji} {G.itemLabel==="station"?"Station":G.itemLabel==="team"?"Team":"State"} of the Week</div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 12px",color:T.textMuted,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:T.card,border:`2px solid ${T.accent}`,borderRadius:14,padding:"20px",marginBottom:16}}>
          <div style={{fontSize:fs(9),letterSpacing:3,color:T.accent,marginBottom:6}}>THIS WEEK'S {G.itemLabel.toUpperCase()}</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(20),color:T.text,marginBottom:8,lineHeight:1.3}}>{item.name}{item.abbr?` (${item.abbr})`:""}</div>
          {item.lines&&<div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>{item.lines.map((l:string)=>(<div key={l} style={{background:lineColors[l]?.bg||"#555",color:lineColors[l]?.text||"#fff",fontSize:fs(9),padding:"3px 10px",borderRadius:4,fontWeight:700}}>{l}</div>))}</div>}
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {item.zone&&<div style={{background:T.surface,borderRadius:6,padding:"5px 10px",fontSize:fs(9),color:T.textSub}}>📍 {item.zone}</div>}
            {item.region&&<div style={{background:T.surface,borderRadius:6,padding:"5px 10px",fontSize:fs(9),color:T.textSub}}>🗺️ {item.region}</div>}
            {item.coast&&<div style={{background:T.surface,borderRadius:6,padding:"5px 10px",fontSize:fs(9),color:T.textSub}}>🌊 {item.coast}</div>}
            <div style={{background:T.surface,borderRadius:6,padding:"5px 10px",fontSize:fs(9),color:T.textSub}}>📅 {item.year}</div>
            {item.capital&&<div style={{background:T.surface,borderRadius:6,padding:"5px 10px",fontSize:fs(9),color:T.textSub}}>🏛️ {item.capital}</div>}
          </div>
          {item.fact&&<div style={{fontSize:fs(11),color:T.textSub,lineHeight:1.8,fontStyle:"italic",borderTop:`1px solid ${T.border}`,paddingTop:10}}>📖 {item.fact}</div>}
        </div>
        <div style={{fontSize:fs(13),fontWeight:700,color:T.textSub,marginBottom:10}}>Test Your Knowledge</div>
        {qs.map((q:any,qi:number)=>(
          <div key={qi} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",marginBottom:10}}>
            <div style={{fontSize:fs(12),color:T.text,marginBottom:10,lineHeight:1.5,fontWeight:600}}>{qi+1}. {q.q}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {q.opts.map((opt:string,oi:number)=>{
                const isSelected=answered[qi]===opt,isCorrect=opt===q.correct,showResult=answered[qi]!==null;
                let bg=T.surface,border=`1px solid ${T.border}`,color=T.textSub,fw:any=400;
                if(showResult&&isCorrect){bg=T.cellBg.green;border=`2px solid ${T.cellBorder.green}`;color=T.cellText.green;fw=700;}
                else if(showResult&&isSelected&&!isCorrect){bg=T.cellBg.red;border=`2px solid ${T.cellBorder.red}`;color=T.cellText.red;fw=600;}
                return(<div key={oi} onClick={()=>handleAnswer(qi,opt)} style={{background:bg,border,borderRadius:8,padding:"10px 14px",cursor:answered[qi]===null?"pointer":"default",fontSize:fs(12),color,fontWeight:fw,transition:"all .2s",display:"flex",gap:8}}><span>{showResult&&isCorrect?"✓":showResult&&isSelected?"✗":"·"}</span>{opt}</div>);
              })}
            </div>
          </div>
        ))}
        {score!==null&&(<div style={{background:score===3?T.cellBg.green:score>=2?T.cellBg.yellow:T.cellBg.red,border:`2px solid ${score===3?T.cellBorder.green:score>=2?T.cellBorder.yellow:T.cellBorder.red}`,borderRadius:10,padding:"16px",textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:fs(28),fontWeight:800,color:score===3?T.cellText.green:score>=2?T.cellText.yellow:T.cellText.red,marginBottom:4}}>{score}/3</div>
          <div style={{fontSize:fs(12),color:score===3?T.cellText.green:score>=2?T.cellText.yellow:T.cellText.red}}>{score===3?"Expert knowledge confirmed 🏆":score>=2?"Solid!":"Keep exploring 🗺️"}</div>
        </div>)}
        <button onClick={onClose} style={{width:"100%",background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,padding:"13px",borderRadius:8,cursor:"pointer"}}>DONE</button>
      </div>
    </div>
  );
}

// ── TRIVIA GAME ───────────────────────────────────────────────────────────────
function TriviaGame({T,fs,questions,gameKey,onClose}:{T:any,fs:any,questions:any[],gameKey:string,onClose:()=>void}){
  const daily=useMemo(()=>getDailyTrivia(questions),[gameKey]);
  const[qIdx,setQIdx]=useState(0);
  const[selected,setSelected]=useState<number|null>(null);
  const[answers,setAnswers]=useState<any[]>([]);
  const[done,setDone]=useState(false);
  function handleSelect(i:number){
    if(selected!==null)return;
    setSelected(i);
    const isCorrect=i===daily[qIdx].ans;
    setTimeout(()=>{const na=[...answers,{correct:isCorrect}];setAnswers(na);if(qIdx<daily.length-1){setQIdx(q=>q+1);setSelected(null);}else setDone(true);},900);
  }
  const q=daily[qIdx];
  const finalScore=answers.filter(a=>a.correct).length;
  const G=GAMES[gameKey];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:400,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 50px"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(18),color:T.text}}>🧠 Daily Trivia</div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 12px",color:T.textMuted,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),cursor:"pointer"}}>✕</button>
        </div>
        <div style={{fontSize:fs(9),color:T.textMuted,marginBottom:10,letterSpacing:2}}>{G.name.toUpperCase()} · 5 QUESTIONS</div>
        {!done?(
          <>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,height:8,marginBottom:16,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${((qIdx+1)/daily.length)*100}%`,background:T.accent,borderRadius:10,transition:"width .4s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:fs(10),color:T.textMuted}}>Question {qIdx+1} of {daily.length}</div>
              <div style={{fontSize:fs(10),color:T.accentB,fontWeight:700}}>{answers.filter(a=>a.correct).length} correct</div>
            </div>
            <div style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"18px",marginBottom:14}}>
              <div style={{fontSize:fs(14),color:T.text,lineHeight:1.7,fontWeight:700}}>{q.q}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {q.opts.map((opt:string,i:number)=>{
                const isSelected=selected===i,isCorrect=i===q.ans,showResult=selected!==null;
                let bg=T.surface,border=`1.5px solid ${T.border}`,color=T.textSub,fw:any=400;
                if(showResult&&isCorrect){bg=T.cellBg.green;border=`2px solid ${T.cellBorder.green}`;color=T.cellText.green;fw=700;}
                else if(showResult&&isSelected&&!isCorrect){bg=T.cellBg.red;border=`2px solid ${T.cellBorder.red}`;color=T.cellText.red;fw=700;}
                return(<div key={i} onClick={()=>handleSelect(i)} style={{background:bg,border,borderRadius:10,padding:"14px 16px",cursor:selected===null?"pointer":"default",fontSize:fs(13),color,fontWeight:fw,transition:"all .25s",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:showResult&&isCorrect?T.accent:T.surface,border:`1.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(10),fontWeight:700,color:showResult&&isCorrect?"#fff":T.textMuted,flexShrink:0}}>{showResult&&isCorrect?"✓":showResult&&isSelected?"✗":String.fromCharCode(65+i)}</div>{opt}
                </div>);
              })}
            </div>
          </>
        ):(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"52px",marginBottom:12}}>🧠</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(24),color:T.text,marginBottom:8}}>Quiz Complete!</div>
            <div style={{fontSize:fs(18),fontWeight:800,color:finalScore>=4?T.cellText.green:finalScore>=3?T.cellText.yellow:T.cellText.red,background:finalScore>=4?T.cellBg.green:finalScore>=3?T.cellBg.yellow:T.cellBg.red,border:`2px solid ${finalScore>=4?T.cellBorder.green:finalScore>=3?T.cellBorder.yellow:T.cellBorder.red}`,borderRadius:12,padding:"16px",marginBottom:16}}>{finalScore}/5 {finalScore===5?"🏆 Perfect!":finalScore>=4?"Well done!":finalScore>=3?"Not bad!":"Keep learning!"}</div>
            <button onClick={onClose} style={{width:"100%",background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(13),fontWeight:700,letterSpacing:2,padding:"13px",borderRadius:8,cursor:"pointer"}}>DONE</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BONUS GAMES SECTION (extracted from GameApp JSX to fix hooks-in-IIFE violation) ──
function BonusGamesSection({T,fs,gameKey,G,setShowBlitz,setShowItemOfWeek,setShowTrivia}:{T:any,fs:any,gameKey:string,G:any,setShowBlitz:(v:boolean)=>void,setShowItemOfWeek:(v:boolean)=>void,setShowTrivia:(v:boolean)=>void}){
  const[bonusOpen,setBonusOpen]=useState(false);
  return(
    <div style={{marginTop:20,marginBottom:12}}>
      <button onClick={()=>setBonusOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:bonusOpen?10:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1,height:1,background:T.border}}/>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:fs(9),letterSpacing:3,color:T.textMuted,fontWeight:700}}>
            BONUS GAMES <span style={{fontSize:fs(11),transition:"transform .25s",display:"inline-block",transform:bonusOpen?"rotate(0deg)":"rotate(-90deg)"}}> ▾</span>
          </div>
          <div style={{flex:1,height:1,background:T.border}}/>
        </div>
      </button>
      {bonusOpen&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[
          {emoji:"⚡",title:"Blitz Mode",body:gameKey==="nfl"?"Name all AFC East teams. Every NFC team. All Midwest region teams. 60 seconds.":gameKey==="states"?"Name every Midwest state. Every state starting with 'N'. Pure memory test.":"Name all stations starting with 'P'. Every Red Line station. No dropdown.",onClick:()=>setShowBlitz(true)},
          {emoji:G.emoji,title:`${gameKey==="states"?"State":gameKey==="nfl"?"Team":"Station"} of the Week`,body:`Deep dive on one ${G.itemLabel} — history, facts, and 3 quiz questions. Changes every Monday.`,onClick:()=>setShowItemOfWeek(true)},
          {emoji:"🧠",title:gameKey==="nfl"?"Daily NFL Trivia":gameKey==="states"?"Daily Civics Quiz":"Daily Transit Trivia",body:"5 questions. New set every day. How deep does your knowledge go?",onClick:()=>setShowTrivia(true)},
        ].map((item,i)=>(
          <div key={i} onClick={item.onClick} style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color .2s"}}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=T.accent}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=T.border}>
            <div style={{fontSize:"28px",flexShrink:0}}>{item.emoji}</div>
            <div style={{flex:1}}><div style={{fontSize:fs(14),fontWeight:800,color:T.text,marginBottom:2}}>{item.title}</div><div style={{fontSize:fs(10),color:T.textMuted,lineHeight:1.5}}>{item.body}</div></div>
            <div style={{fontSize:fs(12),color:T.accent,fontWeight:700}}>▶</div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ── ILLUM CELL (top-level to avoid recreating on every GameApp render) ─────────
function IllumCell({lit,colIdx,color,children,extra,T}:{lit:number,colIdx:number,color:string,children:any,extra?:string,T:any}){
  const on=lit>colIdx;
  const fresh=on&&lit<90;
  return(<div style={{background:on?T.cellBg[color]:"#0d0d0d",border:`1.5px solid ${on?T.cellBorder[color]:"#252525"}`,borderRadius:5,padding:"4px 2px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,transition:fresh?"none":"background .4s,border-color .4s",animation:fresh?`cellFlip 0.55s cubic-bezier(.22,1,.36,1) ${colIdx*80}ms both`:"none",willChange:fresh?"transform":"auto",boxShadow:on?`0 0 8px ${T.cellBorder[color]}44`:"none",minHeight:36}}>
    {on&&T.cb&&<div style={{fontSize:"7px",color:T.cellText[color],opacity:.7}}>{T.SHAPE[color]}</div>}
    {on?children:<div style={{height:16}}/>}
    {on&&extra&&<div style={{fontSize:"9px",color:T.cellText[color],lineHeight:1}}>{extra}</div>}
  </div>);
}

// ── MAIN GAME COMPONENT ───────────────────────────────────────────────────────
function GameHistoryCalendar({gameKey:gk,playHistory,T}:{gameKey:string,playHistory:any,T:any}){
  const hist=playHistory[gk]||[];
  const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);const dateStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;const entry=hist.find((h:any)=>h.date===dateStr);return{dateStr,day:d.getDate(),entry};});
  return(<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:6}}>{days.map((d:any,i:number)=>(<div key={i} title={d.dateStr} style={{width:20,height:20,borderRadius:4,background:d.entry?.won?T.cellBg.green:d.entry?T.cellBg.red:T.surface,border:`1px solid ${d.entry?.won?T.cellBorder.green:d.entry?T.cellBorder.red:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:d.entry?.won?T.cellText.green:d.entry?T.cellText.red:T.textMuted}}>{d.entry?.won?"✓":d.entry?"✗":d.day}</div>))}</div>);
}
function GameApp({initGameKey,initDiff,initMode,onBack,onHome,shieldActivated}:{initGameKey:string,initDiff:string,initMode?:string,onBack:()=>void,onHome:()=>void,shieldActivated?:boolean}){
  const[gameKey,setGameKey]=useState(initGameKey);
  const[diff,setDiff]=useState(initDiff);
  const[tab,setTab]=useState("play");
  const[settings,setSettings]=useState<any>({dark:false,colorblind:false,textSize:"medium",highContrast:false,sounds:true});
  const[profile,setProfile]=useState<any>({name:"",emoji:"🎯",bio:"",optIn:false});
  const[profInput,setProfInput]=useState<any>({name:"",emoji:"🎯",bio:""});
  const[editProfile,setEditProfile]=useState(false);
  const[profileCopied,setProfileCopied]=useState(false);
  const[statsOpen,setStatsOpen]=useState(false);
  const[blitzOpen,setBlitzOpen]=useState(false);
  const[historyOpen,setHistoryOpen]=useState(false);
  const[achOpen,setAchOpen]=useState(false);
  const ER={guesses:[],won:false,lost:false,alreadyPlayed:false,hardLocks:{},hintsUsed:0,revealedHints:[],targetName:null,peekPenalty:0,peekUsed:false,extraGuesses:0,cardHintsUsed:[]};
  const ES={streak:0,played:0,wins:0,totalGuesses:0,dist:{1:0,2:0,3:0,4:0,5:0,6:0},hardWins:0,proWins:0};
  const[allStats,setAllStats]=useState<any>({pdx:ES,dc:ES,states:ES,nfl:ES,balt:ES,la:ES,nyc:ES,chi:ES});
  const[allUnlocked,setAllUnlocked]=useState<any>({pdx:[],dc:[],states:[],nfl:[],balt:[],la:[],nyc:[],chi:[]});
  const[blitzBests,setBlitzBests]=useState<any>({pdx:0,dc:0,states:0,nfl:0,balt:0,la:0,nyc:0,chi:0});
  const[playHistory,setPlayHistory]=useState<any>({pdx:[],dc:[],states:[],nfl:[],balt:[],la:[],nyc:[],chi:[]});
  const[newAchieves,setNewAchieves]=useState<any[]>([]);
  const[round,setRound]=useState(0);
  const[dailyPoints,setDailyPoints]=useState<any>({pdx:0,dc:0,states:0,nfl:0,balt:0,la:0,nyc:0,chi:0});
  const[roundData,setRoundData]=useState<any>({
    pdx:[{...ER},{...ER},{...ER}],
    dc:[{...ER},{...ER},{...ER}],
    states:[{...ER},{...ER},{...ER}],
    nfl:[{...ER},{...ER},{...ER}],
    balt:[{...ER},{...ER},{...ER}],
    la:[{...ER},{...ER},{...ER}],
    nyc:[{...ER},{...ER},{...ER}],
    chi:[{...ER},{...ER},{...ER}],
  });
  const[rowReveal,setRowReveal]=useState<any>({});
  useEffect(()=>{setRowReveal({});},[gameKey,round]);
  const[input,setInput]=useState("");
  const[sugg,setSugg]=useState<any[]>([]);
  const[voiceListening,setVoiceListening]=useState(false);
  const[pendingCard,setPendingCard]=useState(null);
  const[deckCards,setDeckCards]=useState<any[]>(()=>{try{return JSON.parse(localStorage.getItem("tgg-card-deck")||"[]");}catch{return [];}});
  const[showCardPanel,setShowCardPanel]=useState(false);
  const[cardToast,setCardToast]=useState<string|null>(null);
  const[showMoreMenu,setShowMoreMenu]=useState(false);
  const[confetti,setConfetti]=useState(false);
  const[shakeInput,setShakeInput]=useState(false);
  const[shareToast,setShareToast]=useState<string|null>(null);
  const[shieldToast,setShieldToast]=useState(!!shieldActivated);
  const[protectToast,setProtectToast]=useState(false);
  useEffect(()=>{if(protectToast){const t=setTimeout(()=>setProtectToast(false),3800);return()=>clearTimeout(t);}},[protectToast]);
  const[showSupportModal,setShowSupportModal]=useState(false);
  const[isSupporter]=useState(()=>!!localStorage.getItem("supporter_email"));
  const[supporterEmail]=useState(()=>localStorage.getItem("supporter_email")||"");
  const[shieldAvail,setShieldAvail]=useState(()=>shieldAvailableForSupporter());
  const[nextMins,setNextMins]=useState<number|null>(null);
  const[showDiffChange,setShowDiffChange]=useState(false);
  const[showFeedback,setShowFeedback]=useState(false);
  const[giveUpConfirm,setGiveUpConfirm]=useState(false);
  const[feedbackCode]=useState(()=>getBetaCode());
  const[showBlitz,setShowBlitz]=useState(false);
  const[showItemOfWeek,setShowItemOfWeek]=useState(false);
  const[showTrivia,setShowTrivia]=useState(false);
  const[showPeek,setShowPeek]=useState(false);
  const[showGameDrop,setShowGameDrop]=useState(false);
  useEffect(()=>{if(initMode==="blitz")setShowBlitz(true);else if(initMode==="trivia")setShowTrivia(true);else if(initMode==="cards")setTab("cards");},[]);
  const inputRef=useRef<HTMLInputElement>(null);
  const today=useMemo(getToday,[]);
  const dayNum=useMemo(getDayNum,[]);

  function emptyRound():any{return{guesses:[],won:false,lost:false,alreadyPlayed:false,hardLocks:{},hintsUsed:0,revealedHints:[],targetName:null,peekPenalty:0,peekUsed:false,extraGuesses:0,cardHintsUsed:[]};}
  const G=GAMES[gameKey];
  const DIFF=G.diffConfig[diff];
  const items=gameKey==="pdx"?PDX_STATIONS:gameKey==="dc"?DC_STATIONS:gameKey==="nfl"?NFL_TEAMS:gameKey==="balt"?BALT_STATIONS:gameKey==="la"?LA_STATIONS:gameKey==="nyc"?NYC_STATIONS:gameKey==="chi"?CHI_STATIONS:STATES;
  const target=useMemo(()=>getTarget(items,gameKey,round),[gameKey,round]);
  const yesterday=useMemo(()=>getYesterday(items,gameKey),[gameKey]);
  const stats=allStats[gameKey];
  const unlocked=allUnlocked[gameKey];
  const rd=(roundData[gameKey]??[])[round]??emptyRound();
  const gameDailyPoints=dailyPoints[gameKey];
  const T=useMemo(()=>getTheme(gameKey,settings),[gameKey,settings]);
  const fs=T.fs;
  const lineColors=G.lineColors||{};
  const didYouKnow=useMemo(()=>{const pool=gameKey==="pdx"?PDX_DYK:gameKey==="dc"?DC_DYK:gameKey==="nfl"?NFL_DYK:gameKey==="balt"?BALT_DYK:gameKey==="la"?LA_DYK:gameKey==="nyc"?NYC_DYK:gameKey==="chi"?CHI_DYK:STATES.map(s=>s.fact);return pool[dayNum%pool.length];},[gameKey,dayNum]);
  const openingClues=useMemo(()=>{
    const clues:string[]=[];
    if(DIFF.clues.includes("year"))clues.push(gameKey==="nfl"?`📅 Founded in ${target.year}`:`📅 Opened/Admitted in ${target.year}`);
    if(DIFF.clues.includes("conf"))clues.push(`🏈 Conference: ${target.conf}`);
    if(DIFF.clues.includes("line")&&target.lines){const lineStr=target.lines.slice(0,2).join(" & ")+(target.lines.length>2?" (+"+(target.lines.length-2)+" more)":"");clues.push(`🚊 Serves the ${lineStr} line${target.lines.length>1?"s":""}`);}
    if(DIFF.clues.includes("region"))clues.push(`🗺️ Region: ${target.region}`);
    if(DIFF.clues.includes("coast"))clues.push(`🌊 Coast: ${target.coast}`);
    return clues;
  },[target,diff,gameKey]);
  const focusHint=getFocusHint(rd.guesses,gameKey);
  const winRate=stats.played>0?Math.round(stats.wins/stats.played*100):0;
  const maxDist=Math.max(...Object.values(stats.dist as Record<string,number>),1);
  const unlockedSet=new Set(unlocked);
  const countdown=nextMins?`${String(Math.floor(nextMins/60)).padStart(2,"0")}:${String(nextMins%60).padStart(2,"0")}:00`:"--:--";
  const allGameRounds=roundData[gameKey];
  const unfinishedRounds=allGameRounds.filter((r:any)=>!r.alreadyPlayed).length;

  useEffect(()=>{
    (async()=>{
      const[prf,sett,pdxSt,dcSt,stSt,nflSt,baltSt,laSt,nycSt,chiSt,pdxUnl,dcUnl,stUnl,nflUnl,baltUnl,laUnl,nycUnl,chiUnl,pdxBest,dcBest,stBest,nflBest,baltBest,laBest,nycBest,chiBest,pdxHist,dcHist,stHist,nflHist,baltHist,laHist,nycHist,chiHist,pdxR0,pdxR1,pdxR2,dcR0,dcR1,dcR2,stR0,stR1,stR2,nflR0,nflR1,nflR2,baltR0,baltR1,baltR2,laR0,laR1,laR2,nycR0,nycR1,nycR2,chiR0,chiR1,chiR2]=await Promise.all([
        getProfile(),getSettings(),
        getStats("pdx"),getStats("dc"),getStats("states"),getStats("nfl"),getStats("balt"),getStats("la"),getStats("nyc"),getStats("chi"),
        getUnlocked("pdx"),getUnlocked("dc"),getUnlocked("states"),getUnlocked("nfl"),getUnlocked("balt"),getUnlocked("la"),getUnlocked("nyc"),getUnlocked("chi"),
        getBlitzBest("pdx"),getBlitzBest("dc"),getBlitzBest("states"),getBlitzBest("nfl"),getBlitzBest("balt"),getBlitzBest("la"),getBlitzBest("nyc"),getBlitzBest("chi"),
        getPlayHistory("pdx"),getPlayHistory("dc"),getPlayHistory("states"),getPlayHistory("nfl"),getPlayHistory("balt"),getPlayHistory("la"),getPlayHistory("nyc"),getPlayHistory("chi"),
        getTodayData("pdx",today+"r0"),getTodayData("pdx",today+"r1"),getTodayData("pdx",today+"r2"),
        getTodayData("dc",today+"r0"),getTodayData("dc",today+"r1"),getTodayData("dc",today+"r2"),
        getTodayData("states",today+"r0"),getTodayData("states",today+"r1"),getTodayData("states",today+"r2"),
        getTodayData("nfl",today+"r0"),getTodayData("nfl",today+"r1"),getTodayData("nfl",today+"r2"),
        getTodayData("balt",today+"r0"),getTodayData("balt",today+"r1"),getTodayData("balt",today+"r2"),
        getTodayData("la",today+"r0"),getTodayData("la",today+"r1"),getTodayData("la",today+"r2"),
        getTodayData("nyc",today+"r0"),getTodayData("nyc",today+"r1"),getTodayData("nyc",today+"r2"),
        getTodayData("chi",today+"r0"),getTodayData("chi",today+"r1"),getTodayData("chi",today+"r2"),
      ]);
      setProfile(prf);setSettings(sett);SoundEngine.setEnabled(sett?.sounds!==false);
      setAllStats({pdx:pdxSt,dc:dcSt,states:stSt,nfl:nflSt,balt:baltSt,la:laSt,nyc:nycSt,chi:chiSt});
      setAllUnlocked({pdx:pdxUnl,dc:dcUnl,states:stUnl,nfl:nflUnl,balt:baltUnl,la:laUnl,nyc:nycUnl,chi:chiUnl});
      setBlitzBests({pdx:pdxBest||0,dc:dcBest||0,states:stBest||0,nfl:nflBest||0,balt:baltBest||0,la:laBest||0,nyc:nycBest||0,chi:chiBest||0});
      setPlayHistory({pdx:pdxHist||[],dc:dcHist||[],states:stHist||[],nfl:nflHist||[],balt:baltHist||[],la:laHist||[],nyc:nycHist||[],chi:chiHist||[]});
      function buildRound(td:any,its:any[],gk:string,roundIdx:number){
        if(!td?.guesses)return emptyRound();
        const storedTgt=td.targetName?its.find((s:any)=>s.name===td.targetName):null;
        const tgt=storedTgt||getTarget(its,gk,roundIdx);
        const rebuilt=td.guesses.map((n:string)=>{const s=its.find((x:any)=>x.name===n);return s?buildGuess(s,tgt,gk):null;}).filter(Boolean);
        return{guesses:rebuilt,won:td.won,lost:td.lost,alreadyPlayed:td.won||td.lost,hardLocks:td.hardLocks||{},hintsUsed:td.hintsUsed||0,revealedHints:td.revealedHints||[],targetName:tgt.name,peekPenalty:td.peekPenalty||0,peekUsed:td.peekUsed||false,extraGuesses:td.extraGuesses||0,cardHintsUsed:td.cardHintsUsed||[]};
      }
      const newRoundData={
        pdx:[buildRound(pdxR0,PDX_STATIONS,"pdx",0),buildRound(pdxR1,PDX_STATIONS,"pdx",1),buildRound(pdxR2,PDX_STATIONS,"pdx",2)],
        dc:[buildRound(dcR0,DC_STATIONS,"dc",0),buildRound(dcR1,DC_STATIONS,"dc",1),buildRound(dcR2,DC_STATIONS,"dc",2)],
        states:[buildRound(stR0,STATES,"states",0),buildRound(stR1,STATES,"states",1),buildRound(stR2,STATES,"states",2)],
        nfl:[buildRound(nflR0,NFL_TEAMS,"nfl",0),buildRound(nflR1,NFL_TEAMS,"nfl",1),buildRound(nflR2,NFL_TEAMS,"nfl",2)],
        balt:[buildRound(baltR0,BALT_STATIONS,"balt",0),buildRound(baltR1,BALT_STATIONS,"balt",1),buildRound(baltR2,BALT_STATIONS,"balt",2)],
        la:[buildRound(laR0,LA_STATIONS,"la",0),buildRound(laR1,LA_STATIONS,"la",1),buildRound(laR2,LA_STATIONS,"la",2)],
        nyc:[buildRound(nycR0,NYC_STATIONS,"nyc",0),buildRound(nycR1,NYC_STATIONS,"nyc",1),buildRound(nycR2,NYC_STATIONS,"nyc",2)],
        chi:[buildRound(chiR0,CHI_STATIONS,"chi",0),buildRound(chiR1,CHI_STATIONS,"chi",1),buildRound(chiR2,CHI_STATIONS,"chi",2)],
      };
      setRoundData(newRoundData);
      setDailyPoints({pdx:newRoundData.pdx.filter((r:any)=>r.won).length,dc:newRoundData.dc.filter((r:any)=>r.won).length,states:newRoundData.states.filter((r:any)=>r.won).length,nfl:newRoundData.nfl.filter((r:any)=>r.won).length,balt:newRoundData.balt.filter((r:any)=>r.won).length,la:newRoundData.la.filter((r:any)=>r.won).length,nyc:newRoundData.nyc.filter((r:any)=>r.won).length,chi:newRoundData.chi.filter((r:any)=>r.won).length});
      const firstInc=newRoundData[gameKey as keyof typeof newRoundData].findIndex((r:any)=>!r.alreadyPlayed);
      if(firstInc>0)setRound(firstInc);
    })();
  },[]);

  useEffect(()=>{const tick=()=>{const n=new Date();const m=new Date(n);m.setHours(24,0,0,0);setNextMins(Math.ceil((m.getTime()-n.getTime())/60000));};tick();const t=setInterval(tick,30000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(shieldToast){const t=setTimeout(()=>setShieldToast(false),4500);return()=>clearTimeout(t);}},[shieldToast]);
  useEffect(()=>{
    if(input.length>0){
      const locks=rd.hardLocks||{};
      const filtered=items.filter((s:any)=>{
        if(!s.name.toLowerCase().includes(input.toLowerCase()))return false;
        if(rd.guesses.find((g:any)=>g.item.name===s.name))return false;
        if(DIFF.hardLocks){
          if(gameKey==="nfl"){
            if(locks.conf!==undefined&&s.conf!==locks.conf)return false;
            if(locks.div!==undefined&&s.div!==locks.div)return false;
            if(locks.region!==undefined&&s.region!==locks.region)return false;
            if(locks.sb!==undefined&&s.sb!==locks.sb)return false;
            if(locks.year!==undefined&&s.year!==locks.year)return false;
          } else if(gameKey==="states"){
            if(locks.region!==undefined&&s.region!==locks.region)return false;
            if(locks.coast!==undefined&&s.coast!==locks.coast)return false;
            if(locks.pop!==undefined&&s.pop!==locks.pop)return false;
            if(locks.year!==undefined&&s.year!==locks.year)return false;
            if(locks.size!==undefined&&s.size!==locks.size)return false;
          } else {
            if(locks.zone!==undefined&&s.zone!==locks.zone)return false;
            if(locks.year!==undefined&&s.year!==locks.year)return false;
          }
        }
        return true;
      }).slice(0,7);
      setSugg(filtered);
      const exact=filtered.find((s:any)=>s.name.toLowerCase()===input.toLowerCase());
      if(exact&&!rd.won&&!rd.lost&&!rd.alreadyPlayed)makeGuess(exact);
    } else setSugg([]);
  },[input,rd.guesses,gameKey,rd.hardLocks,DIFF.hardLocks]);
  useEffect(()=>{
    if(!rd.guesses.length)return;
    const lastIdx=rd.guesses.length-1;
    const key=`${gameKey}-${round}-${lastIdx}`;
    if(rowReveal[key]!==undefined)return;
    const numCols=DIFF.cols.length+1;
    setRowReveal((prev:any)=>({...prev,[key]:0}));
    for(let i=1;i<=numCols;i++)setTimeout(()=>{setRowReveal((prev:any)=>({...prev,[key]:i}));SoundEngine.play("tick");},i*120);
  },[rd.guesses.length]);

  function switchGame(gk:string){setGameKey(gk);setInput("");setSugg([]);setGiveUpConfirm(false);const firstInc=(roundData[gk]||[]).findIndex((r:any)=>!r.alreadyPlayed);setRound(Math.max(0,firstInc));}
  function doShare(text:string){
    if("share" in navigator){
      (navigator as Navigator&{share:(o:object)=>Promise<void>}).share({title:"UrbanIQ",text}).then(()=>{setShareToast("shared");setTimeout(()=>setShareToast(null),2400);}).catch(()=>{});
    } else if((navigator as any).clipboard){
      (navigator as any).clipboard.writeText(text).then(()=>{setShareToast("copied");setTimeout(()=>setShareToast(null),2400);}).catch(()=>{setShareToast("failed");setTimeout(()=>setShareToast(null),2400);});
    } else {
      setShareToast("failed");setTimeout(()=>setShareToast(null),2400);
    }
  }
  function startVoice(){
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR||voiceListening)return;
    try{
      const sr=new SR();sr.continuous=false;sr.interimResults=false;sr.lang="en-US";
      setVoiceListening(true);
      const safetyTimer=setTimeout(()=>setVoiceListening(false),9000);
      sr.onresult=(e:any)=>{clearTimeout(safetyTimer);const t=e.results[0][0].transcript;setVoiceListening(false);setInput(t);};
      sr.onerror=()=>{clearTimeout(safetyTimer);setVoiceListening(false);};
      sr.onend=()=>{clearTimeout(safetyTimer);setVoiceListening(false);};
      sr.start();
    }catch(err){setVoiceListening(false);}
  }
  function updateRound(updates:any){setRoundData((prev:any)=>{const next={...prev,[gameKey]:[...prev[gameKey]]};next[gameKey][round]={...next[gameKey][round],...updates};return next;});}
  async function handleGiveUp(){
    if(rd.won||rd.lost||rd.alreadyPlayed)return;
    SoundEngine.play("lose");
    setGiveUpConfirm(false);
    const tgtName=rd.targetName||target.name;
    updateRound({guesses:rd.guesses,won:false,lost:true,hardLocks:rd.hardLocks,alreadyPlayed:true,targetName:tgtName});
    setInput("");setSugg([]);
    await saveTodayData(gameKey,today+`r${round}`,{guesses:rd.guesses.map((g:any)=>g.item.name),won:false,lost:true,hardLocks:rd.hardLocks,hintsUsed:rd.hintsUsed,revealedHints:rd.revealedHints,targetName:tgtName,peekPenalty:rd.peekPenalty||0,peekUsed:rd.peekUsed||false,extraGuesses:rd.extraGuesses||0,cardHintsUsed:rd.cardHintsUsed||[]});
    const isFirstRoundGiveUp=round===0;
    if(isFirstRoundGiveUp)setProtectToast(true);
    const ns={...stats,played:stats.played+1,wins:stats.wins,totalGuesses:stats.totalGuesses+rd.guesses.length,streak:isFirstRoundGiveUp?stats.streak:0,dist:stats.dist,lastGuesses:rd.guesses.length,lastPlayed:today};
    setAllStats((prev:any)=>({...prev,[gameKey]:ns}));await saveStats(gameKey,ns);
    const hist=playHistory[gameKey]||[];const newHist=[...hist,{date:today,won:false}].slice(-90);
    setPlayHistory((prev:any)=>({...prev,[gameKey]:newHist}));await savePlayHistory(gameKey,newHist);
  }
  async function makeGuess(item:any){
    if(rd.won||rd.lost||rd.alreadyPlayed)return;
    SoundEngine.play("guess");
    const guess=buildGuess(item,target,gameKey);
    const newGuesses=[...rd.guesses,guess];
    const newLocks={...rd.hardLocks};
    if(DIFF.hardLocks){
      if(gameKey==="nfl"){
        if(guess.confColor==="green")newLocks.conf=item.conf;
        if(guess.divColor==="green")newLocks.div=item.div;
        if(guess.regionColor==="green")newLocks.region=item.region;
        if(guess.sbResult?.color==="green")newLocks.sb=item.sb;
        if(guess.yearResult?.color==="green")newLocks.year=item.year;
      } else if(gameKey==="states"){
        if(guess.regionColor==="green")newLocks.region=item.region;
        if(guess.coastColor==="green")newLocks.coast=item.coast;
        if(guess.popResult?.color==="green")newLocks.pop=item.pop;
        if(guess.yearResult?.color==="green")newLocks.year=item.year;
        if(guess.sizeResult?.color==="green")newLocks.size=item.size;
      } else {
        if(guess.zoneColor==="green")newLocks.zone=item.zone;
        if(guess.yearResult?.color==="green")newLocks.year=item.year;
      }
    }
    const isWin=item.name===target.name;
    const effectiveMax=DIFF.maxGuesses+(rd.extraGuesses||0);
    const isLoss=!isWin&&(newGuesses.length+(rd.peekPenalty||0))>=effectiveMax;
    if(isWin){
      const allRoundsWon=roundData[gameKey].filter((_:any,i:number)=>i!==round).every((r:any)=>r.won);
      setTimeout(()=>SoundEngine.play(allRoundsWon?"win":"correct"),300);
      setConfetti(true);setTimeout(()=>setConfetti(false),4000);
      const totalCardsCollected=JSON.parse(localStorage.getItem("tgg-card-col")||"[]").length;
      const cardDiff=totalCardsCollected===0?"hard":diff;
      const earnedCard=generateCard(target.name,gameKey,cardDiff,{zone:target.zone||target.region,year:target.year});
      setTimeout(()=>setPendingCard(earnedCard),2000);
    } else if(isLoss){
      setTimeout(()=>SoundEngine.play("lose"),300);
    } else {
      setTimeout(()=>SoundEngine.play("wrong"),300);
      setShakeInput(true);setTimeout(()=>setShakeInput(false),500);
    }
    const tgtName=rd.targetName||target.name;
    updateRound({guesses:newGuesses,won:isWin,lost:isLoss,hardLocks:newLocks,alreadyPlayed:isWin||isLoss,targetName:tgtName});
    setInput("");setSugg([]);
    await saveTodayData(gameKey,today+`r${round}`,{guesses:newGuesses.map((g:any)=>g.item.name),won:isWin,lost:isLoss,hardLocks:newLocks,hintsUsed:rd.hintsUsed,revealedHints:rd.revealedHints,targetName:tgtName,peekPenalty:rd.peekPenalty||0,peekUsed:rd.peekUsed||false,extraGuesses:rd.extraGuesses||0,cardHintsUsed:rd.cardHintsUsed||[]});
    if(isWin)window.dispatchEvent(new CustomEvent('tgg-win'));
    if(isWin)setDailyPoints((prev:any)=>({...prev,[gameKey]:Math.min(3,prev[gameKey]+1)}));
    if(isWin||isLoss){
      const newDist={...stats.dist};if(isWin)newDist[newGuesses.length]=(newDist[newGuesses.length]||0)+1;
      const isFirstRoundLoss=isLoss&&round===0;
      if(isFirstRoundLoss)setProtectToast(true);
      const ns={...stats,played:stats.played+1,wins:isWin?stats.wins+1:stats.wins,totalGuesses:stats.totalGuesses+newGuesses.length,streak:isWin?stats.streak+1:isFirstRoundLoss?stats.streak:0,dist:newDist,lastGuesses:newGuesses.length,lastMaxGuesses:DIFF.maxGuesses,hardWins:(stats.hardWins||0)+(isWin&&diff==="hard"?1:0),proWins:(stats.proWins||0)+(isWin&&diff==="pro"?1:0),lastPlayed:today};
      setAllStats((prev:any)=>({...prev,[gameKey]:ns}));await saveStats(gameKey,ns);
      const hist=playHistory[gameKey]||[];const newHist=[...hist,{date:today,won:isWin}].slice(-90);
      setPlayHistory((prev:any)=>({...prev,[gameKey]:newHist}));await savePlayHistory(gameKey,newHist);
      const prev2=await getUnlocked(gameKey);
      const ctx={...ns,usedHints:rd.hintsUsed>0||rd.peekUsed};
      const newOnes=ACHIEVEMENTS.filter(a=>!prev2.includes(a.id)&&a.check(ctx));
      if(newOnes.length>0){const upd=[...prev2,...newOnes.map(a=>a.id)];await saveUnlocked(gameKey,upd);setAllUnlocked((p:any)=>({...p,[gameKey]:upd}));setNewAchieves(newOnes);setTimeout(()=>setNewAchieves([]),4500);}
    }
  }
  function revealHint(){
    if(rd.hintsUsed>=DIFF.hints||rd.won||rd.lost)return;
    SoundEngine.play("hint");
    const hintTarget=(rd.targetName?items.find((s:any)=>s.name===rd.targetName):null)||target;
    const pool=generateHints(hintTarget,gameKey);
    const hint=pool[Math.min(rd.hintsUsed,pool.length-1)];
    updateRound({revealedHints:[...rd.revealedHints,hint],hintsUsed:rd.hintsUsed+1});
  }
  function useCardPowerupInGame(card:any){
    if(!canUseCardPowerup(card)||rd.won||rd.lost||rd.alreadyPlayed)return;
    const col2=JSON.parse(localStorage.getItem("tgg-card-col")||"[]");
    const updatedCol=col2.map((c:any)=>c.id===card.id?markCardPowerupUsed(c):c);
    localStorage.setItem("tgg-card-col",JSON.stringify(updatedCol));
    const updatedDeck=deckCards.map((c:any)=>c.id===card.id?markCardPowerupUsed(c):c);
    setDeckCards(updatedDeck);
    SoundEngine.play("hint");
    const desc=(card.ability?.description||"").toLowerCase();
    const isGuessBoost=desc.includes("extra guess")||desc.includes("one more guess")||desc.includes("skip")||desc.includes("skip one");
    if(isGuessBoost){
      const newExtra=(rd.extraGuesses||0)+1;
      updateRound({extraGuesses:newExtra,cardHintsUsed:[...(rd.cardHintsUsed||[]),card.id]});
      setCardToast(`+1 guess from ${card.ability?.icon||"🃏"} ${card.ability?.name||"Card"}`);
      setTimeout(()=>setCardToast(null),3000);
    }else{
      const hintTarget=(rd.targetName?items.find((s:any)=>s.name===rd.targetName):null)||target;
      const pool=generateHints(hintTarget,gameKey);
      const nextIdx=Math.min((rd.revealedHints||[]).length,pool.length-1);
      const hint=pool[nextIdx];
      if(hint){
        updateRound({revealedHints:[...(rd.revealedHints||[]),hint],hintsUsed:(rd.hintsUsed||0)+1,cardHintsUsed:[...(rd.cardHintsUsed||[]),card.id]});
      }
      setCardToast(`${card.ability?.icon||"💡"} ${card.ability?.name||"Hint"} activated!`);
      setTimeout(()=>setCardToast(null),3000);
    }
    setShowCardPanel(false);
  }
  async function handleSaveSettings(ns:any){setSettings(ns);await saveSettings(ns);SoundEngine.setEnabled(ns?.sounds!==false);}
  async function handleSaveProfile(np:any){setProfile(np);await saveProfile(np);setEditProfile(false);}



  return(<>
    {showGameDrop&&<div onClick={()=>setShowGameDrop(false)} style={{position:"fixed",inset:0,zIndex:9000}}/>}
    {showMoreMenu&&<div onClick={()=>setShowMoreMenu(false)} style={{position:"fixed",inset:0,zIndex:9001}}/>}
    {showMoreMenu&&(
      <div style={{position:"fixed",right:8,top:44,background:`${T.card}f0`,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 4px 24px rgba(0,0,0,.35)",zIndex:9002,minWidth:148,overflow:"hidden",animation:"slideDown .18s ease",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
        {[["cards","🃏 CARDS"],["profile","👤 ME"],["help","❓ HOW"]].map(([id,label])=>(
          <button key={id} onClick={()=>{setTab(id as any);setShowMoreMenu(false);}} style={{display:"block",width:"100%",background:tab===id?T.accent:"transparent",color:tab===id?"#fff":T.text,border:"none",borderBottom:`1px solid ${T.border}`,padding:"13px 18px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",fontWeight:700,letterSpacing:1.5,cursor:"pointer",textAlign:"left",transition:"background .15s"}}>
            {label}
          </button>
        ))}
      </div>
    )}
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'JetBrains Mono','Courier New',monospace",color:T.text,position:"relative",overflow:"hidden",transition:"background .4s,color .3s"}}>
      <link rel="manifest" href="/manifest.json"/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes tpPetal{0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:0}10%{opacity:var(--op)}90%{opacity:var(--op)}100%{transform:translateY(110vh) translateX(var(--drift)) rotate(360deg);opacity:0}}
        @keyframes tpConf{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{opacity:0;transform:scale(.9)}60%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
        @keyframes flipIn{0%{opacity:0;transform:rotateX(-80deg)}70%{transform:rotateX(8deg)}100%{opacity:1;transform:rotateX(0)}}
        @keyframes cellFlip{0%{opacity:0;transform:perspective(480px) rotateY(-90deg)}50%{transform:perspective(480px) rotateY(10deg);opacity:1}75%{transform:perspective(480px) rotateY(-4deg)}100%{opacity:1;transform:perspective(480px) rotateY(0deg)}}
        @keyframes glowG{0%,100%{box-shadow:0 0 10px rgba(40,176,80,.15)}50%{box-shadow:0 0 22px rgba(40,176,80,.45)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}70%{transform:translateY(-3px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes achievePopUp{0%{opacity:0;transform:translateX(-50%) translateY(24px) scale(.88)}15%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}85%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(10px)}}
        @keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-7px)}30%{transform:translateX(7px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}
        @keyframes flameAnim{0%,100%{transform:scaleY(1) rotate(-2deg);filter:hue-rotate(0deg)}33%{transform:scaleY(1.2) rotate(2deg);filter:hue-rotate(-20deg)}66%{transform:scaleY(0.85) rotate(-1deg);filter:hue-rotate(10deg)}}
        @keyframes peekPulse{0%,100%{transform:translateY(-50%) scale(1);opacity:1}50%{transform:translateY(-50%) scale(1.25);opacity:.7}}
        @keyframes dpIn{from{opacity:0;transform:scale(.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes correctPulse{0%{box-shadow:0 0 0 0 ${T.accent}66}50%{box-shadow:0 0 0 10px ${T.accent}00}100%{box-shadow:0 0 0 0 ${T.accent}00}}
        @keyframes inputFocusGlow{0%,100%{box-shadow:0 0 0 0 ${T.accent}33}50%{box-shadow:0 0 0 4px ${T.accent}22}}
        .shake-anim{animation:shake 0.45s ease !important;}
        .flame-anim{display:inline-block;animation:flameAnim 1s ease infinite;transform-origin:bottom center;}
        .sug{cursor:pointer;padding:9px 14px;border-bottom:1px solid ${T.border};transition:background .12s;}
        .sug:hover{background:rgba(128,128,128,.08);}
        .tab-btn{flex:1;background:transparent;border:none;border-bottom:2.5px solid transparent;padding:10px 0;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:${fs(7)};letter-spacing:1px;color:${T.textMuted};transition:all .2s;text-transform:uppercase;}
        .tab-btn.on{color:${T.accentB};border-bottom-color:${T.accentB};}
        .toggle{width:42px;height:22px;border-radius:11px;position:relative;cursor:pointer;transition:background .2s;border:none;flex-shrink:0;}
        .toggle-knob{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;}
        .uiq-btn{transition:transform 200ms ease,box-shadow 200ms ease,opacity 200ms ease;}
        .uiq-btn:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.18);}
        .uiq-btn:active{transform:scale(0.96) !important;box-shadow:none !important;}
        .uiq-glass{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:rgba(255,255,255,0.15) !important;border:1px solid rgba(255,255,255,0.3) !important;box-shadow:0 8px 32px rgba(0,0,0,0.1) !important;}
        .uiq-glass-dark{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:rgba(0,0,0,0.25) !important;border:1px solid rgba(255,255,255,0.12) !important;box-shadow:0 8px 32px rgba(0,0,0,0.25) !important;}
        .uiq-input-focus:focus-within{box-shadow:0 0 0 3px ${T.accent}33;border-color:${T.accent} !important;transition:box-shadow 200ms ease,border-color 200ms ease;}
        .uiq-correct-glow{animation:correctPulse 0.6s ease-out;}
        input:focus{outline:none;box-shadow:0 0 0 2px ${T.accent}44;border-radius:4px;}
      `}</style>

      <CityBackground/>
      <Particles gameKey={gameKey}/>
      {confetti&&<Confetti/>}
      {cardToast&&(
        <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",background:"#332800",color:"#c8a800",fontSize:"12px",fontWeight:700,letterSpacing:1,padding:"10px 20px",borderRadius:10,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",border:"1px solid rgba(200,168,0,.3)",whiteSpace:"nowrap",pointerEvents:"none",animation:"spFadeIn .25s ease both"}}>
          {cardToast}
        </div>
      )}

      {newAchieves.map((a,i)=>(
        <div key={a.id} style={{position:"fixed",bottom:80+i*72,left:"50%",transform:"translateX(-50%)",zIndex:800,background:T.card,border:`1.5px solid ${T.accent}`,borderRadius:12,padding:"12px 18px",display:"flex",alignItems:"center",gap:12,animation:"achievePopUp 4.5s ease forwards",boxShadow:"0 -4px 24px rgba(0,0,0,.15)",whiteSpace:"nowrap",maxWidth:"90vw"}}>
          <span style={{fontSize:fs(22)}}>{a.icon}</span>
          <div><div style={{fontSize:fs(8),letterSpacing:2,color:T.accent,marginBottom:1}}>ACHIEVEMENT UNLOCKED</div><div style={{fontSize:fs(13),fontWeight:700,color:T.text}}>{a.name}</div><div style={{fontSize:fs(9),color:T.textSub}}>{a.desc}</div></div>
        </div>
      ))}

      {showDiffChange&&(
        <div onClick={()=>setShowDiffChange(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:`${T.card}f0`,border:`1px solid ${T.border}`,borderRadius:18,padding:"22px 18px",width:"100%",maxWidth:420,animation:"dpIn .25s cubic-bezier(.4,0,.2,1)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 16px 48px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(16),color:T.text}}>Change Difficulty</div>
              <button onClick={()=>setShowDiffChange(false)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 12px",fontSize:fs(9),color:T.textMuted,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>✕</button>
            </div>
            <div style={{fontSize:fs(9),color:T.textMuted,marginBottom:14,letterSpacing:1}}>Applies to your next round.</div>
            {Object.entries(G.diffConfig as any).map(([k,d]:any)=>(
              <div key={k} onClick={()=>{setDiff(k);setShowDiffChange(false);}}
                style={{background:diff===k?`${G.accent}15`:T.bg,border:`1.5px solid ${diff===k?G.accent:T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"border-color .15s,background .15s"}}
                onMouseEnter={e=>{if(diff!==k){(e.currentTarget as HTMLDivElement).style.borderColor=G.accent;(e.currentTarget as HTMLDivElement).style.background=`${G.accent}08`;}}}
                onMouseLeave={e=>{if(diff!==k){(e.currentTarget as HTMLDivElement).style.borderColor=T.border;(e.currentTarget as HTMLDivElement).style.background=T.bg;}}}>
                <span style={{fontSize:"20px"}}>{d.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:fs(13),fontWeight:700,color:T.text}}>{d.label}</div>
                  <div style={{fontSize:fs(9),color:T.textMuted,marginTop:2}}>{d.desc}</div>
                </div>
                {diff===k&&<span style={{color:G.accent,fontWeight:700,fontSize:fs(14)}}>✓</span>}
              </div>
            ))}
            <div onClick={()=>{const keys=Object.keys(G.diffConfig as any);const pick=keys[Math.floor(Math.random()*keys.length)];setDiff(pick);setShowDiffChange(false);}}
              style={{background:T.bg,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"border-color .15s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=G.accent;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border;}}>
              <span style={{fontSize:"20px"}}>🎲</span>
              <div style={{flex:1}}>
                <div style={{fontSize:fs(13),fontWeight:700,color:T.text}}>Random</div>
                <div style={{fontSize:fs(9),color:T.textMuted,marginTop:2}}>Surprise difficulty — let fate decide</div>
              </div>
            </div>
            <button onClick={()=>setShowDiffChange(false)} style={{width:"100%",marginTop:4,background:"transparent",color:T.textMuted,border:`1px solid ${T.border}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),padding:"10px",borderRadius:8,cursor:"pointer",letterSpacing:1}}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px 0",position:"relative",gap:6,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",background:`${T.bg}cc`,zIndex:3}}>
        <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
          <button onClick={onHome} title="Home" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.textSub,cursor:"pointer"}}>🏠</button>
          <button onClick={onBack} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.textSub,cursor:"pointer"}}>☰</button>
        </div>
        {/* Game switcher — accordion dropdown */}
        <div style={{position:"relative",flex:1}}>
          <button onClick={()=>setShowGameDrop(o=>!o)}
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface,border:`1px solid ${showGameDrop?G.accent:T.border}`,borderRadius:20,padding:"5px 14px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.textSub,transition:"all .15s",gap:6,boxSizing:"border-box"}}>
            <span style={{fontWeight:700,color:G.accent}}>{G.key==="states"?"🗺️":G.key==="pdx"?"🚊":G.key==="nfl"?"🏈":G.key==="balt"?"🚉":G.key==="la"?"🌴":G.key==="nyc"?"🗽":G.key==="chi"?"🌬️":"🚇"} {G.short}</span>
            <span style={{fontSize:"9px",color:T.textMuted,display:"inline-block",transition:"transform .2s",transform:showGameDrop?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
          </button>
          {showGameDrop&&(
            <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,right:0,background:`${T.card}f0`,border:`1px solid ${T.border}`,borderRadius:12,zIndex:9001,boxShadow:"0 8px 28px rgba(0,0,0,0.22)",overflow:"hidden",minWidth:200,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
              {([{label:"🚊 TRANSIT",keys:["pdx","dc","balt","la","nyc","chi"]},{label:"🗺️ GEOGRAPHY",keys:["states"]},{label:"🏈 SPORTS",keys:["nfl"]}] as {label:string,keys:string[]}[]).map(({label,keys})=>(
                <div key={label}>
                  <div style={{fontSize:fs(7),letterSpacing:2,color:T.textMuted,padding:"8px 12px 3px",fontWeight:700,borderTop:`1px solid ${T.border}`,marginTop:label.includes("TRANSIT")?0:0}}>{label}</div>
                  {keys.map(k=>{const g=GAMES[k];if(!g)return null;const em=k==="states"?"🗺️":k==="pdx"?"🚊":k==="nfl"?"🏈":k==="balt"?"🚉":k==="la"?"🌴":k==="nyc"?"🗽":k==="chi"?"🌬️":"🚇";return(
                    <div key={k} onClick={()=>{switchGame(k);setShowGameDrop(false);}}
                      style={{display:"flex",alignItems:"center",gap:9,padding:"8px 14px",cursor:"pointer",background:gameKey===k?`${g.accent}18`:"transparent",borderLeft:`3px solid ${gameKey===k?g.accent:"transparent"}`,transition:"background .12s"}}>
                      <span style={{fontSize:"15px"}}>{em}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:fs(10),fontWeight:gameKey===k?700:500,color:gameKey===k?g.accent:T.textSub}}>{g.name}</div>
                        <div style={{fontSize:fs(7),color:T.textMuted,marginTop:1}}>{g.sub}</div>
                      </div>
                      {gameKey===k&&<span style={{fontSize:"11px",color:g.accent,fontWeight:700}}>✓</span>}
                    </div>
                  );})}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setShowFeedback(true)} title="Feedback" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.textSub,cursor:"pointer"}}>💬</button>
          <button onClick={()=>setShowDiffChange(true)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:T.accent,cursor:"pointer",fontWeight:700}}>{DIFF.emoji}</button>
        </div>
      </div>

      {/* Header */}
      <div style={{textAlign:"center",padding:"8px 16px 12px",borderBottom:`1px solid ${T.border}`,position:"relative",zIndex:2,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",background:`${T.bg}cc`}}>
        <div style={{fontSize:fs(7),letterSpacing:4,color:T.textMuted,marginBottom:4}}>{G.sub}</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(34),fontWeight:900,letterSpacing:3,lineHeight:1,marginBottom:4}}>
          <span style={{color:"transparent",backgroundImage:`linear-gradient(90deg,${G.accent},${T.accentB},${G.accent})`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",backgroundClip:"text",animation:"shimmer 4s linear infinite"}}>Daily</span>{" "}
          <span style={{color:T.text}}>{gameKey==="pdx"?"MAX":gameKey==="dc"?"METRO":gameKey==="nfl"?"TEAMS":gameKey==="balt"?"MTA":gameKey==="la"?"METRO":gameKey==="nyc"?"SUBWAY":gameKey==="chi"?"L":"STATE"}</span>
          {gameKey!=="states"&&<span style={{color:G.accent,fontSize:fs(26)}}> {G.short}</span>}
        </div>
        <div style={{fontSize:fs(7),letterSpacing:3,color:T.textMuted,marginBottom:10}}>PUZZLE · DAY #{dayNum}</div>
        {G.lineColors&&(<div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:10}}>{Object.entries(G.lineColors as any).map(([n,c]:any)=>(<div key={n} style={{background:c.bg,color:c.text,fontSize:fs(7),padding:"3px 7px",borderRadius:3,fontWeight:700}}>{n.toUpperCase()}</div>))}</div>)}
        {gameKey==="states"&&(<div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:10}}>{["Northeast","Mid-Atlantic","Southeast","Midwest","Southwest","Mountain West","Pacific"].map((r,i)=>{const cols=["#1a3a8f","#2a5ab0","#B22234","#2a7a2a","#c86010","#8a4a8a","#1a8a8a"];return(<div key={r} style={{background:cols[i],color:"#fff",fontSize:fs(7),padding:"3px 7px",borderRadius:3,fontWeight:700}}>{r.replace(" West","W.").replace("-Atlantic","")}</div>);})}</div>)}
        {gameKey==="nfl"&&(<div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:10}}>{[["AFC","#c8102e"],["NFC","#013369"]].map(([conf,color])=>(<div key={conf} style={{background:color,color:"#fff",fontSize:fs(7),padding:"3px 10px",borderRadius:3,fontWeight:700}}>{conf}</div>))}</div>)}
        <div style={{display:"flex",gap:5,maxWidth:360,margin:"0 auto 6px"}}>
          {[{l:"STREAK",v:stats.streak,extra:isSupporter&&shieldAvail?"🛡️":null,isStreak:true},{l:"PLAYED",v:stats.played,extra:null,isStreak:false},{l:"WIN %",v:`${winRate}%`,extra:null,isStreak:false},{l:"AVG",v:stats.played>0?(stats.totalGuesses/stats.played).toFixed(1):"—",extra:null,isStreak:false}].map(s=>(
            <div key={s.l} style={{flex:1,background:T.surface,border:`1px solid ${s.isStreak&&stats.streak>0?T.accent:T.border}`,borderRadius:7,padding:"8px 4px",textAlign:"center"}}>
              <div style={{fontSize:fs(14),fontWeight:700,color:T.accentB,display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
                {s.isStreak&&stats.streak>0&&<span className="flame-anim" style={{fontSize:fs(stats.streak>=14?18:stats.streak>=7?16:13),filter:stats.streak>=14?"hue-rotate(0deg) saturate(1.5)":stats.streak>=7?"hue-rotate(-10deg) saturate(1.2)":"none"}}>🔥</span>}
                <span>{String(s.v)}</span>
                {s.extra&&<span style={{fontSize:fs(11),marginLeft:3}}>{s.extra}</span>}
              </div>
              <div style={{fontSize:fs(6),letterSpacing:2,color:T.textMuted,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        {!isSupporter&&(
          <div onClick={()=>setShowSupportModal(true)} style={{display:"flex",justifyContent:"center",marginBottom:8,cursor:"pointer"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 12px",fontSize:fs(8),color:T.textMuted,letterSpacing:.5,transition:"border-color .2s,color .2s"}} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.accent;(e.currentTarget as HTMLDivElement).style.color=T.accentB;}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border;(e.currentTarget as HTMLDivElement).style.color=T.textMuted;}}>
              🛡️ <span>Supporters get streak protection</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,position:"relative",zIndex:2,background:`${T.bg}dd`,backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>
        <style>{`@media(min-width:768px){.tab-desktop{display:inline-flex!important}.tab-more{display:none!important}}`}</style>
        {[[`play`,`${G.itemEmoji} PLAY`],[`leaderboard`,`🏆 BOARD`]].map(([id,label])=>(
          <button key={id} className={`tab-btn${tab===id?" on":""}`} onClick={()=>setTab(id)}>
            {label}
            {id==="play"&&unfinishedRounds<3&&unfinishedRounds>0&&<span style={{background:T.accent,color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:"8px",fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",marginLeft:3}}>{unfinishedRounds}</span>}
          </button>
        ))}
        {[["cards","🃏 CARDS"],["profile","👤 ME"],["help","❓ HOW"]].map(([id,label])=>(
          <button key={id} className={`tab-btn${tab===id?" on":""} tab-desktop`} style={{display:"none"}} onClick={()=>{setShowMoreMenu(false);setTab(id);}}>
            {label}
          </button>
        ))}
        <div className="tab-more" style={{marginLeft:"auto"}}>
          <button className={`tab-btn${["cards","profile","help"].includes(tab)?" on":""}`} onClick={()=>setShowMoreMenu(m=>!m)} style={{whiteSpace:"nowrap"}}>
            ⋯ MORE
          </button>
        </div>
      </div>

      {/* Play Tab */}
      {tab==="play"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"12px 10px 2.5rem",paddingBottom:"2.5rem",position:"relative",zIndex:2}}>
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,marginBottom:9}}>
            <div style={{display:"flex",gap:5}}>
              {[0,1,2].map(r=>{const rr=roundData[gameKey][r];return(
                <div key={r} onClick={()=>r<=round&&setRound(r)} style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${rr.alreadyPlayed?(rr.won?T.cellBorder.green:T.cellBorder.red):r===round?T.accent:T.border}`,background:rr.alreadyPlayed?(rr.won?T.cellBg.green:T.cellBg.red):r===round?T.surface:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs(11),fontWeight:700,color:rr.won?T.cellText.green:rr.lost?T.cellText.red:r===round?T.accent:T.textMuted,cursor:r<=round&&rr.alreadyPlayed?"pointer":"default",transition:"all .3s"}}>
                  {rr.won?"✓":rr.lost?"✗":`${r+1}`}
                </div>
              );})}
            </div>
            <div style={{fontSize:fs(11),color:T.textSub}}><span style={{fontSize:fs(18),fontWeight:800,color:T.accentB}}>{gameDailyPoints}</span><span style={{color:T.textMuted}}>/3 pts</span></div>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:`${T.surface}cc`,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 12px",marginBottom:9,flexWrap:"wrap",gap:6,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
            <div style={{fontSize:fs(9),color:T.textMuted}}>YESTERDAY: <span style={{color:T.textSub,fontWeight:700}}>{yesterday.name}{yesterday.abbr?` (${yesterday.abbr})`:""}</span></div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              {DIFF.hints>0&&!rd.won&&!rd.lost&&!rd.alreadyPlayed&&(
                <button onClick={revealHint} disabled={rd.hintsUsed>=DIFF.hints} style={{background:"rgba(255,215,100,.08)",border:"1px solid rgba(255,215,100,.25)",borderRadius:6,padding:"5px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:"#c8a840",cursor:rd.hintsUsed>=DIFF.hints?"not-allowed":"pointer",opacity:rd.hintsUsed>=DIFF.hints?.5:1,letterSpacing:1}}>💡 {DIFF.hints-rd.hintsUsed} HINT{DIFF.hints-rd.hintsUsed!==1?"S":""}</button>
              )}
              {(PEEK_LINES[gameKey])&&!rd.won&&!rd.lost&&!rd.alreadyPlayed&&!rd.peekUsed&&(DIFF.maxGuesses+(rd.extraGuesses||0)-rd.guesses.length-(rd.peekPenalty||0))>=2&&(
                <button onClick={()=>setShowPeek(true)} style={{background:"rgba(80,140,255,.08)",border:"1px solid rgba(80,140,255,.28)",borderRadius:6,padding:"5px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:"#6496e0",cursor:"pointer",letterSpacing:1}}>🗺️ PEEK</button>
              )}
              {deckCards.length>0&&!rd.won&&!rd.lost&&!rd.alreadyPlayed&&(
                <button onClick={()=>setShowCardPanel(p=>!p)} style={{background:showCardPanel?"rgba(200,168,0,.15)":"rgba(200,168,0,.08)",border:`1px solid rgba(200,168,0,${showCardPanel?".5":".25"})`,borderRadius:6,padding:"5px 12px",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),color:"#c8a800",cursor:"pointer",letterSpacing:1}}>🃏 {deckCards.filter(c=>canUseCardPowerup(c)).length} CARD{deckCards.filter(c=>canUseCardPowerup(c)).length!==1?"S":""}</button>
              )}
            </div>
          </div>

          {showCardPanel&&!rd.won&&!rd.lost&&!rd.alreadyPlayed&&(
            <div style={{background:T.surface,border:`1px solid rgba(200,168,0,.25)`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:fs(8),letterSpacing:2,color:"#c8a800",fontWeight:700,marginBottom:8}}>🃏 USE A CARD ABILITY</div>
              {deckCards.length===0?(
                <div style={{fontSize:fs(9),color:T.textMuted,textAlign:"center",padding:"8px 0"}}>Add cards to your deck in the Cards tab</div>
              ):(
                <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
                  {deckCards.map((card:any)=>{
                    const canUse=canUseCardPowerup(card);
                    return(
                      <div key={card.id} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <CardVisual card={card} size="sm" disabled={!canUse} onClick={canUse?()=>useCardPowerupInGame(card):undefined}/>
                        <div style={{fontSize:fs(7),color:canUse?"#c8a800":T.textMuted,fontWeight:700,letterSpacing:.5,textAlign:"center"}}>{canUse?"TAP TO USE":"COOLDOWN"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{fontSize:fs(8),color:T.textMuted,marginTop:6,lineHeight:1.5}}>Hint cards reveal clues · Boost cards add extra guesses</div>
            </div>
          )}

          {target.img&&!rd.won&&!rd.lost&&(
            <div style={{borderRadius:10,overflow:"hidden",marginBottom:9,position:"relative",height:170,border:`1px solid ${T.border}`,flexShrink:0}}>
              <img src={target.img} alt="Puzzle clue" onError={(e)=>{(e.target as HTMLElement).parentElement!.style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.88)"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.08) 40%,rgba(0,0,0,0.55) 100%)"}}/>
              <div style={{position:"absolute",top:8,left:10,fontSize:fs(7),letterSpacing:2,color:"rgba(255,255,255,0.75)",background:"rgba(0,0,0,0.45)",padding:"3px 8px",borderRadius:5,fontFamily:"'JetBrains Mono',monospace",backdropFilter:"blur(4px)"}}>📷 PHOTO CLUE</div>
            </div>
          )}

          {openingClues.length>0&&(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",marginBottom:9}}>
            <div style={{fontSize:fs(8),letterSpacing:2,color:T.accent,marginBottom:5}}>TODAY'S CLUE{openingClues.length>1?"S":""}</div>
            {openingClues.map((c,i)=>(<div key={i} style={{fontSize:fs(11),color:T.textSub,marginBottom:i<openingClues.length-1?3:0}}>{c}</div>))}
          </div>)}

          {rd.revealedHints.map((hint:string,i:number)=>(<div key={i} style={{background:T.surface,border:"1px solid rgba(255,215,100,.2)",borderRadius:6,padding:"7px 12px",marginBottom:6,fontSize:fs(10),color:"#c8a840"}}>💡 {hint}</div>))}
          {focusHint&&!rd.won&&!rd.lost&&rd.guesses.length>=3&&(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 12px",marginBottom:9,fontSize:fs(10),color:T.textSub}}>{focusHint}</div>)}


          {rd.alreadyPlayed&&!rd.won&&!rd.lost&&(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px",marginBottom:10,fontSize:fs(10),color:T.textMuted,textAlign:"center"}}>Already played this round! Come back tomorrow.</div>)}

          <div style={{display:"grid",gridTemplateColumns:DIFF.grid,gap:3,marginBottom:5}}>
            {DIFF.headers.map((h:string)=>{
              const headerLockMap:{[k:string]:string}={REGION:"region",COAST:"coast",POP:"pop",YEAR:"year",SIZE:"size",ZONE:"zone"};
              const lockKey=headerLockMap[h];
              const isLocked=DIFF.hardLocks&&lockKey&&rd.hardLocks[lockKey]!==undefined;
              return(<div key={h} style={{fontSize:fs(7),letterSpacing:1,color:isLocked?T.cellText.green:T.textMuted,textAlign:"center",fontWeight:600,opacity:isLocked?1:.5,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                {isLocked&&<span style={{fontSize:"7px"}}>🔒</span>}
                {h}
              </div>);
            })}
          </div>

          <div style={{overflowY:"auto",overflowX:"hidden",maxHeight:"min(272px,38dvh)",WebkitOverflowScrolling:"touch" as any,scrollBehavior:"smooth",marginBottom:4}}>
          {rd.guesses.map((g:any,i:number)=>{
            const item=g.item;
            const effectiveTgt=rd.targetName||target.name;
            const isWin=item.name===effectiveTgt;
            const revKey=`${gameKey}-${round}-${i}`;
            const lit=rowReveal[revKey]!==undefined?rowReveal[revKey]:99;
            return(
              <div key={i} style={{display:"grid",gridTemplateColumns:DIFF.grid,gap:3,marginBottom:4}}>
                <div style={{background:isWin?T.cellBg.green:T.surface,border:`1.5px solid ${isWin?T.cellBorder.green:T.border}`,borderRadius:5,padding:"7px 6px",fontSize:fs(12),fontWeight:800,color:isWin?T.cellText.green:T.text,lineHeight:1.3,display:"flex",alignItems:"center",animation:isWin?"glowG 2s infinite":"none",transition:"all .3s"}}>
                  {item.name}{item.abbr?` (${item.abbr})`:""}
                </div>
                {DIFF.cols.includes("lines")&&item.lines&&<IllumCell T={T} lit={lit} colIdx={0} color={g.linesColor||"red"}><div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>{item.lines.map((l:string)=>(<div key={l} style={{background:lineColors[l]?.bg||"#555",color:lineColors[l]?.text||"#fff",fontSize:fs(6),padding:"2px 3px",borderRadius:2,fontWeight:700}}>{l[0]}</div>))}</div></IllumCell>}
                {DIFF.cols.includes("zone")&&gameKey!=="states"&&<IllumCell T={T} lit={lit} colIdx={1} color={g.zoneColor||"red"}><div style={{fontSize:fs(8),fontWeight:700,color:T.cellText[g.zoneColor||"red"],textAlign:"center",lineHeight:1.3}}>{item.zone?.replace(" County MD","").replace(" VA","").split(" ").slice(0,2).join(" ")||"—"}</div></IllumCell>}
                {DIFF.cols.includes("busy")&&<IllumCell T={T} lit={lit} colIdx={2} color={g.trafficResult?.color||"red"} extra={g.trafficResult?.arrow}><div style={{fontSize:fs(8),fontWeight:700,color:T.cellText[g.trafficResult?.color||"red"],textAlign:"center"}}>{busyLabel(item.traffic)}</div></IllumCell>}
                {DIFF.cols.includes("conf")&&<IllumCell T={T} lit={lit} colIdx={0} color={g.confColor||"red"}><div style={{fontSize:fs(8),fontWeight:800,color:T.cellText[g.confColor||"red"],textAlign:"center"}}>{item.conf}</div></IllumCell>}
                {DIFF.cols.includes("div")&&<IllumCell T={T} lit={lit} colIdx={1} color={g.divColor||"red"}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[g.divColor||"red"],textAlign:"center"}}>{item.div}</div></IllumCell>}
                {DIFF.cols.includes("region")&&<IllumCell T={T} lit={lit} colIdx={gameKey==="nfl"?2:0} color={g.regionColor||"red"}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[g.regionColor||"red"],textAlign:"center",lineHeight:1.3}}>{item.region?.replace("/SW","")}</div></IllumCell>}
                {DIFF.cols.includes("coast")&&<IllumCell T={T} lit={lit} colIdx={1} color={g.coastColor||"red"}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[g.coastColor||"red"],textAlign:"center"}}>{item.coast}</div></IllumCell>}
                {DIFF.cols.includes("pop")&&<IllumCell T={T} lit={lit} colIdx={2} color={g.popResult?.color||"red"} extra={g.popResult?.arrow}><div style={{fontSize:fs(8),fontWeight:700,color:T.cellText[g.popResult?.color||"red"],textAlign:"center"}}>{popLabel(item.pop)}</div></IllumCell>}
                {DIFF.cols.includes("sb")&&<IllumCell T={T} lit={lit} colIdx={3} color={g.sbResult?.color||"red"} extra={g.sbResult?.arrow}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[g.sbResult?.color||"red"],textAlign:"center"}}>{item.sb}🏆</div></IllumCell>}
                {DIFF.cols.includes("direction")&&<IllumCell T={T} lit={lit} colIdx={3} color={gameKey==="states"?g.regionColor||"red":g.zoneColor||"red"}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[gameKey==="states"?g.regionColor||"red":g.zoneColor||"red"],textAlign:"center",lineHeight:1.3}}>{g.dirInfo?.label||"—"}</div></IllumCell>}
                {DIFF.cols.includes("year")&&<IllumCell T={T} lit={lit} colIdx={gameKey==="nfl"?4:4} color={g.yearResult?.color||"red"} extra={g.yearResult?.arrow}><div style={{fontSize:fs(9),fontWeight:800,color:T.cellText[g.yearResult?.color||"red"]}}>{item.year}</div></IllumCell>}
                {DIFF.cols.includes("size")&&<IllumCell T={T} lit={lit} colIdx={5} color={g.sizeResult?.color||"red"} extra={g.sizeResult?.arrow}><div style={{fontSize:fs(7),fontWeight:700,color:T.cellText[g.sizeResult?.color||"red"],textAlign:"center"}}>{sizeLabel(item.size)}</div></IllumCell>}
                <div style={{background:lit>DIFF.cols.length?(isWin?T.cellBg.green:T.cellBg.red):"#0d0d0d",border:`1.5px solid ${lit>DIFF.cols.length?(isWin?T.cellBorder.green:T.cellBorder.red):"#252525"}`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .4s,border-color .4s",minHeight:36,boxShadow:lit>DIFF.cols.length?`0 0 12px ${isWin?T.cellBorder.green:T.cellBorder.red}55`:"none"}}>
                  {lit>DIFF.cols.length?<div style={{fontSize:fs(13),color:isWin?T.cellText.green:T.cellText.red,fontWeight:700}}>{isWin?"✓":"✗"}</div>:<div style={{height:16}}/>}
                </div>
              </div>
            );
          })}

          {!rd.won&&!rd.lost&&(rd.peekPenalty||0)>0&&Array.from({length:rd.peekPenalty}).map((_,i)=>(
            <div key={`pk${i}`} style={{display:"grid",gridTemplateColumns:DIFF.grid,gap:3,marginBottom:4,opacity:.35}}>
              {DIFF.headers.map((_:any,j:number)=>(<div key={j} style={{height:38,background:"rgba(80,140,255,.06)",border:"1px dashed rgba(80,140,255,.25)",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"rgba(100,150,224,.5)"}}>{j===0?"🗺️":""}</div>))}
            </div>
          ))}
          {!rd.won&&!rd.lost&&Array.from({length:DIFF.maxGuesses+(rd.extraGuesses||0)-rd.guesses.length-(rd.peekPenalty||0)}).map((_,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:DIFF.grid,gap:3,marginBottom:4,opacity:i===0?.3:.08}}>
              {DIFF.headers.map((_:any,j:number)=>(<div key={j} style={{height:38,background:T.surface,border:`1px solid ${T.border}`,borderRadius:5}}/>))}
            </div>
          ))}
          </div>

          {!rd.won&&!rd.lost&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8}}>
              <div style={{fontSize:fs(8),color:T.textMuted,letterSpacing:2}}>{DIFF.maxGuesses+(rd.extraGuesses||0)-rd.guesses.length-(rd.peekPenalty||0)} TRIES LEFT · {DIFF.emoji} {DIFF.label.toUpperCase()}{(rd.extraGuesses||0)>0?` · +${rd.extraGuesses} 🃏`:""}</div>
              {!rd.alreadyPlayed&&(giveUpConfirm?(
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <span style={{fontSize:fs(8),color:T.textMuted}}>Give up?</span>
                  <button onClick={handleGiveUp} style={{background:T.cellBg.red,border:`1px solid ${T.cellBorder.red}`,borderRadius:6,padding:"3px 9px",fontSize:fs(8),color:T.cellText.red,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>YES</button>
                  <button onClick={()=>setGiveUpConfirm(false)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 9px",fontSize:fs(8),color:T.textMuted,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>NO</button>
                </div>
              ):(
                <button onClick={()=>setGiveUpConfirm(true)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 10px",fontSize:fs(8),color:T.textMuted,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>GIVE UP</button>
              ))}
            </div>
          )}

          {!rd.won&&!rd.lost&&!rd.alreadyPlayed&&(
            <>
              {/* Guess progress bar */}
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:fs(8),letterSpacing:2,color:T.textMuted}}>GUESSES</span>
                  <span style={{fontSize:fs(9),fontWeight:700,color:(rd.guesses.length+(rd.peekPenalty||0))>=(DIFF.maxGuesses+(rd.extraGuesses||0))-1?T.cellText.red:T.textMuted}}>{rd.guesses.length+(rd.peekPenalty||0)} / {DIFF.maxGuesses+(rd.extraGuesses||0)}</span>
                </div>
                <div style={{height:4,background:T.surface,borderRadius:4,overflow:"hidden",border:`1px solid ${T.border}`}}>
                  <div style={{height:"100%",width:`${((rd.guesses.length+(rd.peekPenalty||0))/(DIFF.maxGuesses+(rd.extraGuesses||0)))*100}%`,background:(rd.guesses.length+(rd.peekPenalty||0))>=(DIFF.maxGuesses+(rd.extraGuesses||0))-1?T.cellBorder.red:(rd.guesses.length+(rd.peekPenalty||0))>=Math.ceil((DIFF.maxGuesses+(rd.extraGuesses||0))/2)?T.cellBorder.yellow:T.accent,borderRadius:4,transition:"width .4s ease, background .4s"}}/>
                </div>
              </div>
              {/* Close call warning */}
              {(rd.guesses.length+(rd.peekPenalty||0))===(DIFF.maxGuesses+(rd.extraGuesses||0))-1&&(
                <div style={{background:T.cellBg.red,border:`1px solid ${T.cellBorder.red}`,borderRadius:7,padding:"7px 12px",marginBottom:8,fontSize:fs(10),color:T.cellText.red,fontWeight:700,textAlign:"center",animation:"popIn .25s ease"}}>
                  {gameKey==="dc"?"🚨 Last guess — doors are almost closing!":gameKey==="pdx"?"🚨 Last guess — last train leaving!":gameKey==="balt"?"🚨 Final stop — last chance!":gameKey==="nfl"?"🏈 4th and long — make it count!":"🗺️ Last guess — which state is it?"}
                </div>
              )}
              <div style={{position:"relative",marginBottom:12}}>
                <div className={`${shakeInput?"shake-anim":""} uiq-input-focus`} style={{background:`${T.surface}dd`,border:`1.5px solid ${shakeInput?T.cellBorder.red:T.border}`,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"0 14px",transition:"border-color .2s,box-shadow .2s",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
                  <span style={{fontSize:fs(17),opacity:.35}}>{G.itemEmoji}</span>
                  <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&sugg.length>0)makeGuess(sugg[0]);else if(e.key==="Enter"&&input.trim()){const exact=sugg.find((s:any)=>s.name.toLowerCase()===input.trim().toLowerCase());if(exact)makeGuess(exact);}}}
                    placeholder={`Type a ${G.itemLabel} name...`}
                    autoFocus
                    style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:fs(14),padding:"14px 0",fontFamily:"'JetBrains Mono',monospace"}}/>
                  {((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition)&&<button onClick={startVoice} title="Speak to input" style={{background:voiceListening?"rgba(0,180,80,.12)":"transparent",border:"none",borderRadius:6,padding:"4px 6px",cursor:"pointer",color:voiceListening?T.cellText.green:T.textMuted,fontSize:fs(16),lineHeight:1,transition:"all .2s",flexShrink:0}}>{voiceListening?"🔴":"🎤"}</button>}
                </div>
                {sugg.length>0&&(
                  <div style={{position:"absolute",left:0,right:0,top:"100%",zIndex:100,background:`${T.surface}f0`,border:`1.5px solid ${T.border}`,borderRadius:"0 0 10px 10px",overflow:"hidden",boxShadow:`0 8px 24px rgba(0,0,0,0.15)`,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
                    {sugg.map((s,i)=>(
                      <div key={i} className="sug" onPointerDown={e=>e.preventDefault()} onClick={()=>makeGuess(s)}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {s.lines&&<div style={{display:"flex",gap:2}}>{s.lines.map((l:string)=>(<span key={l} style={{width:8,height:8,borderRadius:"50%",background:lineColors[l]?.bg||"#555",display:"inline-block"}}/>))}</div>}
                          {s.abbr&&<span style={{fontSize:fs(9),color:T.textMuted,fontWeight:700,width:24}}>{s.abbr}</span>}
                          <span style={{color:T.text,fontWeight:700,fontSize:fs(12)}}>{s.name}</span>
                          <span style={{fontSize:fs(9),color:T.textMuted,marginLeft:"auto"}}>{s.region||s.zone||""}</span>
                        </div>
                        {s.desc&&<div style={{fontSize:fs(9),color:T.textMuted,marginTop:2,lineHeight:1.3}}>{s.desc}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!rd.won&&!rd.lost&&(
            <div style={{background:`${T.surface}cc`,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
              <span style={{fontSize:fs(14),flexShrink:0}}>{G.itemEmoji}</span>
              <div>
                <div style={{fontSize:fs(8),letterSpacing:2,color:T.accent,marginBottom:2}}>DID YOU KNOW?</div>
                <div style={{fontSize:fs(10),color:T.textSub,lineHeight:1.7,fontStyle:"italic"}}>{didYouKnow}</div>
              </div>
            </div>
          )}

          {rd.won&&(
            <div style={{background:`${T.card}ee`,border:`2px solid ${T.accent}`,borderRadius:12,overflow:"hidden",textAlign:"center",marginBottom:14,animation:"popIn .4s ease",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:`0 8px 32px ${T.accent}22`}}>
              {target.img&&<div style={{height:210,overflow:"hidden",position:"relative"}}>
                <img src={target.img} alt={target.name} onError={(e)=>{(e.target as HTMLElement).parentElement!.style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.8) saturate(1.1)"}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.78) 100%)"}}/>
                <div style={{position:"absolute",bottom:12,left:0,right:0,fontFamily:"'Cinzel',serif",fontSize:fs(15),color:"#fff",fontWeight:700,textShadow:"0 2px 10px rgba(0,0,0,0.9)",letterSpacing:.5}}>{target.name}</div>
              </div>}
              <div style={{padding:"16px 18px 18px"}}>
              <div style={{fontSize:fs(40),marginBottom:6,animation:"bounce .8s ease"}}>{G.emoji}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(30),color:T.accentB,marginBottom:6}}>{G.winText}</div>
              <div style={{fontSize:fs(11),color:T.textMuted,marginBottom:3}}><strong style={{color:T.textSub}}>{target.name}</strong></div>
              <div style={{fontSize:fs(10),color:T.textMuted,marginBottom:8}}>Solved in {rd.guesses.length}/{DIFF.maxGuesses} · {DIFF.emoji} {DIFF.label}</div>
              {target.fact&&<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",marginBottom:12,fontSize:fs(10),color:T.textSub,fontStyle:"italic",lineHeight:1.7}}>📖 {target.fact}</div>}
              <div style={{fontSize:fs(9),color:T.textMuted,marginBottom:12,letterSpacing:2}}>NEXT IN {countdown}</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button className="uiq-btn" onClick={()=>doShare(buildShare(rd.guesses,true,dayNum,gameKey,diff,target.name))} style={{background:T.accent,color:"#fff",border:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),fontWeight:700,padding:"10px 16px",borderRadius:7,cursor:"pointer",transition:"transform 200ms ease,box-shadow 200ms ease"}}>📤 SHARE</button>
                {round<2&&!roundData[gameKey][round+1]?.alreadyPlayed&&(<button className="uiq-btn" onClick={()=>setRound(round+1)} style={{background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(11),fontWeight:700,letterSpacing:2,padding:"10px 16px",borderRadius:7,cursor:"pointer",animation:"bounce .6s ease",transition:"transform 200ms ease,box-shadow 200ms ease"}}>ROUND {round+2} →</button>)}
                <button className="uiq-btn" onClick={()=>setTab("leaderboard")} style={{background:"transparent",color:T.accentB,border:`1px solid ${T.accent}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),fontWeight:700,padding:"10px 16px",borderRadius:7,cursor:"pointer",transition:"transform 200ms ease,box-shadow 200ms ease"}}>🏆 POST SCORE</button>
              </div>
              </div>
            </div>
          )}

          {rd.lost&&(
            <div style={{background:`${T.card}ee`,border:`1.5px solid ${T.cellBorder.red}`,borderRadius:12,overflow:"hidden",textAlign:"center",marginBottom:14,animation:"popIn .4s ease",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(196,48,48,0.15)"}}>
              {target.img&&<div style={{height:210,overflow:"hidden",position:"relative"}}>
                <img src={target.img} alt={target.name} onError={(e)=>{(e.target as HTMLElement).parentElement!.style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.55) grayscale(0.4) saturate(0.8)"}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 25%,rgba(0,0,0,0.82) 100%)"}}/>
                <div style={{position:"absolute",bottom:10,left:0,right:0,fontSize:fs(14),color:"#fff",fontWeight:800,textShadow:"0 2px 10px rgba(0,0,0,0.95)",letterSpacing:.3}}>{target.name}</div>
              </div>}
              <div style={{padding:"16px 16px 16px"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(22),color:T.cellText.red,marginBottom:4}}>So Close!</div>
              <div style={{fontSize:fs(14),color:T.text,fontWeight:800,marginBottom:4}}>{target.name}{target.abbr?` (${target.abbr})`:""}</div>
              {target.lines&&<div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:8}}>{target.lines.map((l:string)=>(<div key={l} style={{background:lineColors[l]?.bg,color:lineColors[l]?.text,fontSize:fs(9),padding:"3px 8px",borderRadius:3,fontWeight:700}}>{l}</div>))}</div>}
              {gameKey==="nfl"&&target.conf&&<div style={{fontSize:fs(10),color:T.textSub,marginBottom:8}}>{target.conf} {target.div} · {target.region} · {target.sb>0?`${target.sb}× SB 🏆`:"No SB wins"}</div>}
              {gameKey!=="nfl"&&target.region&&<div style={{fontSize:fs(10),color:T.textSub,marginBottom:8}}>{target.region}{target.coast?` · ${target.coast}`:""}</div>}
              {target.fact&&<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:fs(10),color:T.textSub,fontStyle:"italic",lineHeight:1.7}}>📖 {target.fact}</div>}
              <div style={{fontSize:fs(9),color:T.textMuted,marginBottom:12,letterSpacing:2}}>NEXT IN {countdown}</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>doShare(buildShare(rd.guesses,false,dayNum,gameKey,diff,target.name))} style={{background:"transparent",color:T.cellText.red,border:`1px solid ${T.cellBorder.red}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),fontWeight:700,padding:"10px 16px",borderRadius:7,cursor:"pointer"}}>📤 SHARE</button>
                {round<2&&!roundData[gameKey][round+1]?.alreadyPlayed&&(<button onClick={()=>setRound(round+1)} style={{background:T.accent,color:"#fff",border:"none",fontFamily:"'Cinzel',serif",fontSize:fs(11),fontWeight:700,letterSpacing:2,padding:"10px 16px",borderRadius:7,cursor:"pointer"}}>ROUND {round+2} →</button>)}
              </div>
              </div>
            </div>
          )}

          {(rd.won||rd.lost)&&stats.played>0&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px",marginBottom:12}}>
              <div style={{fontSize:fs(8),letterSpacing:2,color:T.textMuted,marginBottom:8}}>GUESS DISTRIBUTION</div>
              {[1,2,3,4,5,6].map(n=>(
                <div key={n} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{fontSize:fs(9),color:T.textMuted,width:8,textAlign:"right"}}>{n}</div>
                  <div style={{height:14,width:`${Math.max(4,(stats.dist[n]||0)/maxDist*100)}%`,background:rd.won&&rd.guesses.length===n?T.accent:T.border,borderRadius:3,transition:"width .6s",minWidth:4,display:"flex",alignItems:"center",paddingLeft:4}}>
                    {stats.dist[n]>0&&<span style={{fontSize:fs(8),color:"#fff"}}>{stats.dist[n]}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {unfinishedRounds===0&&allGameRounds.some((r:any)=>r.alreadyPlayed)&&(
            <div style={{background:`${T.card}ee`,border:`2px solid ${T.accent}`,borderRadius:12,padding:"18px",textAlign:"center",marginBottom:14,animation:"popIn .4s ease",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:`0 8px 32px ${T.accent}22`}}>
              <div style={{fontSize:fs(9),letterSpacing:3,color:T.accentB,marginBottom:4}}>ALL ROUNDS COMPLETE</div>
              <div style={{fontSize:fs(11),color:T.textMuted,marginBottom:14}}>
                {allGameRounds.filter((r:any)=>r.won).length}/{allGameRounds.length} won today
                {stats.streak>1&&<span style={{marginLeft:8}}>🔥 {stats.streak} day streak</span>}
              </div>
              <button className="uiq-btn" onClick={()=>doShare(buildAllRoundsShare(allGameRounds,gameKey,diff,dayNum,stats.streak||0))}
                style={{background:T.accent,color:"#fff",border:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(12),fontWeight:700,letterSpacing:2,padding:"13px 28px",borderRadius:8,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,transition:"transform 200ms ease,box-shadow 200ms ease"}}>
                📤 SHARE TODAY'S RESULTS
              </button>
            </div>
          )}

          <BonusGamesSection T={T} fs={fs} gameKey={gameKey} G={G} setShowBlitz={setShowBlitz} setShowItemOfWeek={setShowItemOfWeek} setShowTrivia={setShowTrivia}/>

          {showBlitz&&<BlitzMode T={T} fs={fs} items={items} lineColors={lineColors} gameKey={gameKey} blitzBest={blitzBests[gameKey]} onNewBest={async(n)=>{setBlitzBests((p:any)=>({...p,[gameKey]:n}));await saveBlitzBest(gameKey,n);}} onClose={()=>setShowBlitz(false)}/>}
          {showItemOfWeek&&<ItemOfWeek T={T} fs={fs} items={items} lineColors={lineColors} gameKey={gameKey} onClose={()=>setShowItemOfWeek(false)}/>}
          {showTrivia&&<TriviaGame T={T} fs={fs} questions={gameKey==="pdx"?PDX_TRIVIA:gameKey==="dc"?DC_TRIVIA:gameKey==="nfl"?NFL_TRIVIA:gameKey==="la"?LA_TRIVIA:gameKey==="nyc"?NYC_TRIVIA:gameKey==="chi"?CHI_TRIVIA:STATES_TRIVIA} gameKey={gameKey} onClose={()=>setShowTrivia(false)}/>}

          <div style={{textAlign:"center",marginTop:8}}>
            <a href="https://mc.buymeacoffee.com/links/SyEkenCIAfWPKEhbhyglsDjuxVxSSjqkeHbXYWMXWcARvFhFzRCgIASnBhHieeDGIBlkfaEMkvhKXYgPCXWGCPB/3480126?link=nixalerllc" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:7,background:T.surface,color:"#FFDD00",border:"1px solid rgba(255,221,0,.2)",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(9),fontWeight:700,letterSpacing:1,padding:"9px 16px",borderRadius:7,textDecoration:"none"}}>☕ Enjoying it? Buy me a coffee</a>
            <div style={{fontSize:fs(8),color:T.textMuted,opacity:.6,letterSpacing:1,textAlign:"center",padding:"4px",marginTop:4}}>🚫 No ads. No tracking. Always free.</div>
          </div>
        </div>
      )}

      {tab==="leaderboard"&&<LeaderboardTab T={T} fs={fs} gameKey={gameKey} diff={diff} dayNum={dayNum} roundData={roundData} profile={profile}/>}

      {tab==="profile"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"18px 12px 50px",position:"relative",zIndex:2}}>
          {!editProfile?(
            <div style={{background:`${T.card}ee`,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",marginBottom:14,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)"}}>
              <button onClick={()=>{setProfInput({name:profile.name||"",emoji:profile.emoji||"🎯",bio:profile.bio||""});setEditProfile(true);}} style={{float:"right",background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",fontSize:fs(9),color:T.textSub,cursor:"pointer"}}>✏️ EDIT</button>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:fs(38),width:56,height:56,background:T.surface,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`,flexShrink:0}}>{profile.emoji||"🎯"}</div>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:fs(17),color:T.text,fontWeight:700}}>{profile.name||"Anonymous Player"}</div>
                  {profile.bio&&<div style={{fontSize:fs(10),color:T.textSub,marginTop:3}}>{profile.bio}</div>}
                </div>
              </div>
              <div onClick={()=>setStatsOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none",padding:"2px 0",marginBottom:statsOpen?8:12}}>
                <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted}}>YOUR STATS</div>
                <div style={{fontSize:fs(14),color:T.textMuted,lineHeight:1,transition:"transform .2s",transform:statsOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</div>
              </div>
              {statsOpen&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
                {Object.values(GAMES).map((g:any)=>{const gs=allStats[g.key];return(
                  <div key={g.key} style={{background:T.surface,border:`1.5px solid ${gameKey===g.key?T.accent:T.border}`,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:fs(14),marginBottom:2}}>{g.emoji}</div>
                    <div style={{fontSize:fs(11),fontWeight:800,color:T.accentB}}>{gs.wins}</div>
                    <div style={{fontSize:fs(7),color:T.textMuted}}>W / {gs.played}P</div>
                    <div style={{fontSize:fs(7),color:T.textMuted}}>🔥 {gs.streak}</div>
                  </div>
                );})}
              </div>}
              <div onClick={()=>setBlitzOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none",padding:"2px 0",marginBottom:blitzOpen?6:12}}>
                <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted}}>BLITZ BEST SCORES</div>
                <div style={{fontSize:fs(14),color:T.textMuted,lineHeight:1,transition:"transform .2s",transform:blitzOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</div>
              </div>
              {blitzOpen&&<div style={{display:"flex",gap:6,marginBottom:12}}>
                {Object.values(GAMES).map((g:any)=>(<div key={g.key} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 4px",textAlign:"center"}}>
                  <div style={{fontSize:fs(11),marginBottom:1}}>{g.emoji}</div>
                  <div style={{fontSize:fs(14),fontWeight:800,color:T.accentB}}>{blitzBests[g.key]||0}</div>
                  <div style={{fontSize:fs(7),color:T.textMuted}}>stations</div>
                </div>))}
              </div>}
              <div onClick={()=>setHistoryOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none",padding:"2px 0",marginBottom:historyOpen?4:12}}>
                <div style={{fontSize:fs(9),letterSpacing:2,color:T.textMuted}}>LAST 14 DAYS — {G.name.toUpperCase()}</div>
                <div style={{fontSize:fs(14),color:T.textMuted,lineHeight:1,transition:"transform .2s",transform:historyOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</div>
              </div>
              {historyOpen&&<GameHistoryCalendar gameKey={gameKey} playHistory={playHistory} T={T}/>}
              <div onClick={()=>setAchOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none",padding:"2px 0",marginTop:12,marginBottom:achOpen?7:4}}>
                <div style={{fontSize:fs(8),letterSpacing:2,color:T.textMuted}}>ACHIEVEMENTS <span style={{color:T.accentB}}>{unlocked.length}/{ACHIEVEMENTS.length}</span></div>
                <div style={{fontSize:fs(14),color:T.textMuted,lineHeight:1,transition:"transform .2s",transform:achOpen?"rotate(0deg)":"rotate(-90deg)"}}>▾</div>
              </div>
              {achOpen&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {ACHIEVEMENTS.map((a:any)=>{const isU=unlockedSet.has(a.id);return(<div key={a.id} title={a.desc} style={{background:isU?T.bg:T.surface,border:`1px solid ${isU?T.accent:T.border}`,borderRadius:7,padding:"6px 7px",textAlign:"center",width:58,opacity:isU?1:.3}}>
                  <div style={{fontSize:fs(18),marginBottom:2}}>{a.icon}</div>
                  <div style={{fontSize:fs(7),color:isU?T.cellText.green:T.textMuted,lineHeight:1.2}}>{a.name}</div>
                </div>);})}
              </div>}
              <button onClick={()=>{const t=`${G.emoji} UrbanIQ\n${profile.emoji} ${profile.name||"Player"}\n\n📊 Stats\n🔥 Streak: ${stats.streak}\n🏆 Wins: ${stats.wins}/${stats.played}\n\nPlay free 👉 nixaler-transit.replit.app`;navigator.clipboard?.writeText(t).then(()=>{setProfileCopied(true);setTimeout(()=>setProfileCopied(false),2000);});}} style={{width:"100%",background:profileCopied?"transparent":T.accent,color:profileCopied?T.accentB:"#fff",border:`1px solid ${profileCopied?T.accent:"transparent"}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(10),fontWeight:700,letterSpacing:2,padding:"11px",borderRadius:8,cursor:"pointer",transition:"all .2s"}}>{profileCopied?"✓ COPIED!":"📋 SHARE MY PROFILE"}</button>
            </div>
          ):(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",marginBottom:14}}>
              <div style={{fontSize:fs(11),letterSpacing:2,color:T.accentB,marginBottom:14}}>✏️ EDIT PROFILE</div>
              {[{label:"DISPLAY NAME",key:"name",ph:"Your name..."},{label:"BIO / CITY",key:"bio",ph:"Portland, OR · Transit nerd..."}].map((f:any)=>(
                <div key={f.key} style={{marginBottom:11}}>
                  <div style={{fontSize:fs(9),color:T.textMuted,letterSpacing:2,marginBottom:5}}>{f.label}</div>
                  <input value={profInput[f.key]} onChange={e=>setProfInput((p:any)=>({...p,[f.key]:e.target.value}))} maxLength={40} placeholder={f.ph}
                    style={{width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"9px 12px",color:T.text,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(12),outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:fs(9),color:T.textMuted,letterSpacing:2,marginBottom:7}}>AVATAR</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {EMOJIS.map(em=>(<span key={em} onClick={()=>setProfInput((p:any)=>({...p,emoji:em}))} style={{fontSize:fs(20),cursor:"pointer",opacity:profInput.emoji===em?1:.35,transform:profInput.emoji===em?"scale(1.3)":"scale(1)",transition:"all .14s",padding:2}}>{em}</span>))}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>handleSaveProfile({...profile,...profInput})} style={{flex:1,background:T.accent,color:"#fff",border:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:fs(11),fontWeight:700,letterSpacing:2,padding:"11px",borderRadius:8,cursor:"pointer"}}>SAVE</button>
                <button onClick={()=>setEditProfile(false)} style={{flex:1,background:"transparent",color:T.textMuted,border:`1px solid ${T.border}`,fontFamily:"'JetBrains Mono',monospace",fontSize:fs(11),padding:"11px",borderRadius:8,cursor:"pointer"}}>CANCEL</button>
              </div>
            </div>
          )}
          <div style={{background:`${T.card}ee`,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 16px",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)"}}>
            <div style={{fontSize:fs(11),letterSpacing:2,color:T.accentB,marginBottom:12}}>⚙️ SETTINGS</div>
            {[{label:"Dark Mode",sub:"Switch to dark background",key:"dark"},{label:"Colorblind Mode",sub:"Adds shape indicators to cells",key:"colorblind"},{label:"High Contrast",sub:"Stronger colors and thicker borders",key:"highContrast"},{label:"Sound Effects",sub:"Feedback on guesses",key:"sounds"}].map((item:any)=>(
              <div key={item.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div><div style={{fontSize:fs(12),color:T.text,fontWeight:700}}>{item.label}</div><div style={{fontSize:fs(9),color:T.textMuted,marginTop:2}}>{item.sub}</div></div>
                <button className="toggle" style={{background:settings[item.key]?T.accent:T.border}} onClick={()=>handleSaveSettings({...settings,[item.key]:!settings[item.key]})}>
                  <div className="toggle-knob" style={{left:settings[item.key]?"23px":"3px"}}/>
                </button>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
              <div><div style={{fontSize:fs(12),color:T.text,fontWeight:700}}>Text Size</div><div style={{fontSize:fs(9),color:T.textMuted,marginTop:2}}>Adjust font size throughout the app</div></div>
              <div style={{display:"flex",gap:4}}>
                {["small","medium","large"].map(sz=>(<button key={sz} onClick={()=>handleSaveSettings({...settings,textSize:sz})} style={{background:settings.textSize===sz?T.accent:T.surface,color:settings.textSize===sz?"#fff":T.textSub,border:`1px solid ${settings.textSize===sz?T.accent:T.border}`,borderRadius:5,padding:"5px 8px",fontSize:fs(9),cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",transition:"all .15s"}}>{sz}</button>))}
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingCard&&<PackOpening card={pendingCard} onDone={()=>{const _c=JSON.parse(localStorage.getItem("tgg-card-col")||"[]");localStorage.setItem("tgg-card-col",JSON.stringify([..._c,pendingCard]));setPendingCard(null);setTab("cards");}}/>}
      {tab==="cards"&&(
        <CardSystemTab pendingCard={null} onClearPending={()=>setPendingCard(null)} onActivePowerup={(card:any)=>{
          if(!card?.ability)return "no-ability";
          if(card.ability.type==="battle")return "battle";
          if(!target||rd.won||rd.lost||rd.alreadyPlayed)return "no-game";
          // Map ability description to a specific targeted hint
          const desc=(card.ability.description||'').toLowerCase();
          const hintTarget=(rd.targetName?items.find((s:any)=>s.name===rd.targetName):null)||target;
          const pool=generateHints(hintTarget,gameKey);
          let hint='';
          if(desc.includes('first letter')){
            hint=`🔤 First letter: "${hintTarget.name[0].toUpperCase()}"`;
          } else if(desc.includes('connect')||(desc.includes('line')&&!desc.includes('zone')&&!desc.includes('year')&&!desc.includes('admitted')&&!desc.includes('all stations')&&!desc.includes('same line'))){
            const ls=Array.isArray(hintTarget.lines)&&hintTarget.lines.length?hintTarget.lines.join(', '):null;
            hint=ls?`🚊 Lines: ${ls}`:pool[1];
          } else if(desc.includes('same line')||desc.includes('every station')){
            // Full line reveal — structural hint best approximation
            hint=pool[1];
          } else if(desc.includes('zone')&&(desc.includes('year')||desc.includes('direction')||desc.includes('and'))){
            hint=pool[1]; // combined structural hint
          } else if(desc.includes('zone')){
            hint=hintTarget.zone?`📍 Zone: ${hintTarget.zone}`:hintTarget.region?`🗺️ Region: ${hintTarget.region}`:pool[1];
          } else if(desc.includes('year')||desc.includes('opened')){
            const yr=hintTarget.year;
            hint=yr?`📅 Opened: ${yr}`:pool[1];
          } else if(desc.includes('admitted')){
            hint=hintTarget.year?`📅 Admitted: ${hintTarget.year}`:pool[1];
          } else if(desc.includes('direction')){
            hint=pool[1];
          } else {
            hint=pool[1];
          }
          if(!hint)hint=pool[1];
          SoundEngine.play("hint");
          updateRound({revealedHints:[...rd.revealedHints,hint],hintsUsed:rd.hintsUsed});
          setTab("play");
          return "ok";
        }}/>
      )}
      {tab==="help"&&(
        <HelpTab T={T} fs={fs} G={G} DIFF={DIFF} gameKey={gameKey} onPlay={()=>setTab("play")}/>
      )}
    </div>
    {showFeedback&&<BetaModal code={feedbackCode} onClose={()=>setShowFeedback(false)}/>}
    {showSupportModal&&<SupporterModal isSupporter={isSupporter} supporterEmail={supporterEmail} onClose={()=>{setShowSupportModal(false);setShieldAvail(shieldAvailableForSupporter());}}/>}
    {showPeek&&!rd.won&&!rd.lost&&!rd.alreadyPlayed&&(()=>{
      const gl=DIFF.maxGuesses-rd.guesses.length-(rd.peekPenalty||0);
      const cost=gl-1;
      return(
        <PeekModal T={T} fs={fs} gameKey={gameKey} target={target} DIFF={DIFF} rd={rd} cost={cost}
          onConfirm={()=>{if(cost>0){SoundEngine.play("hint");updateRound({peekPenalty:(rd.peekPenalty||0)+cost,peekUsed:true});}else{updateRound({peekUsed:true});}}}
          onClose={()=>setShowPeek(false)}/>
      );
    })()}
    {shareToast&&(
      <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:shareToast==="shared"?"#1a7a4a":shareToast==="failed"?"#7a1a1a":"#1a4a7a",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",fontWeight:700,letterSpacing:1,padding:"11px 22px",borderRadius:30,boxShadow:"0 4px 18px rgba(0,0,0,.45)",zIndex:9999,pointerEvents:"none",animation:"popIn .25s ease",whiteSpace:"nowrap"}}>
        {shareToast==="shared"?"✓ Shared!":shareToast==="failed"?"✗ Could not share — try copying manually":"✓ Copied to clipboard!"}
      </div>
    )}
    {shieldToast&&(
      <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#1a4a2a",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",fontWeight:700,letterSpacing:1,padding:"11px 22px",borderRadius:30,boxShadow:"0 4px 18px rgba(0,0,0,.45)",zIndex:9999,pointerEvents:"none",animation:"popIn .25s ease",whiteSpace:"nowrap"}}>
        🛡️ Your streak was protected by your Supporter shield!
      </div>
    )}
    {protectToast&&(
      <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#1a3a6a",color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:1,padding:"11px 22px",borderRadius:30,boxShadow:"0 4px 18px rgba(0,0,0,.45)",zIndex:9999,pointerEvents:"none",animation:"popIn .25s ease",whiteSpace:"nowrap",textAlign:"center"}}>
        🛡️ Daily Protection Active — Streak Saved! Try the next round.
      </div>
    )}
    </>
  );
}

// ── MINI GAMES SCREEN ─────────────────────────────────────────────────────────
function MiniGamesScreen({blitzBests,onSelect,onBack}:{blitzBests:any,onSelect:(gk:string)=>void,onBack:()=>void}){
  const GAME_DEFS=[
    {key:"pdx",name:"Portland MAX",emoji:"🚊",color:"#028A48",grad:"linear-gradient(135deg,#028A48,#016a36)",sub:"Light rail • Pacific NW",items:97},
    {key:"dc",name:"DC Metro",emoji:"🚇",color:"#BF0000",grad:"linear-gradient(135deg,#BF0000,#8a0000)",sub:"Subway • Nation's Capital",items:98},
    {key:"states",name:"US States",emoji:"🗺️",color:"#1a3a8f",grad:"linear-gradient(135deg,#1a3a8f,#B22234)",sub:"Geography • 50 states",items:50},
    {key:"nfl",name:"NFL Teams",emoji:"🏈",color:"#013369",grad:"linear-gradient(135deg,#013369,#d4af37)",sub:"Sports • 32 franchises",items:32},
  ];
  const MODE_DEFS=[
    {id:"blitz",emoji:"⚡",label:"BLITZ",color:"#e8a000",desc:"Race the clock — type as many as you can in 90 seconds. Use 2 hints wisely.",badge:"90 SEC",detail:"Fast-fire mode that tests your memory under pressure. Score as many as possible before time runs out. Two hints available.",icon:"🏁"},
    {id:"trivia",emoji:"🧠",label:"TRIVIA",color:"#7c3aed",desc:"Multiple-choice deep-dive into facts, history, and stats.",badge:"26 Q's",detail:"Carefully crafted questions about each game's topic. Four options per question — one correct. Track your personal best score.",icon:"🎓"},
  ];
  const[activeMode,setActiveMode]=useState<string>("blitz");
  const[hovered,setHovered]=useState<string|null>(null);
  const selMode=MODE_DEFS.find(m=>m.id===activeMode)!;
  return(
    <div style={{minHeight:"100vh",background:"#fafafa",color:"#0a0a0a",fontFamily:"'Inter','Helvetica Neue',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflowX:"hidden"}}>
      <style>{`
        @keyframes mgFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes mgShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes mgCardPop{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes mgGlow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 24px 4px currentColor}}
        .mg-game-card{transition:transform .18s,box-shadow .18s,border-color .18s;}
        .mg-game-card:hover{transform:translateY(-4px);}
        .mg-mode-tab{transition:all .2s;}
      `}</style>

      {/* Grid background */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none"}}/>

      {/* Nav */}
      <nav style={{position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 28px",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <div>
          <div style={{fontSize:"13px",fontWeight:700,letterSpacing:3,color:"#0a0a0a"}}>MINI GAMES</div>
          <div style={{fontSize:"9px",letterSpacing:2,color:"rgba(0,0,0,.35)",marginTop:1}}>UrbanIQ · ARCADE</div>
        </div>
        <button onClick={onBack} style={{background:"transparent",border:"1px solid rgba(0,0,0,0.12)",borderRadius:6,padding:"7px 16px",fontFamily:"'Inter',sans-serif",fontSize:"11px",fontWeight:600,letterSpacing:1.5,cursor:"pointer",color:"rgba(0,0,0,0.45)",transition:"all .15s"}} onMouseEnter={e=>(e.currentTarget as any).style.borderColor="#0a0a0a"} onMouseLeave={e=>(e.currentTarget as any).style.borderColor="rgba(0,0,0,0.12)"}>← HOME</button>
      </nav>

      <div style={{flex:1,position:"relative",zIndex:10,maxWidth:680,margin:"0 auto",width:"100%",padding:"32px 20px 48px"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:28,animation:"mgFadeIn .4s ease both"}}>
          <h1 style={{fontWeight:700,fontSize:"clamp(26px,5vw,46px)",letterSpacing:-1,margin:"0 0 8px",lineHeight:1.1}}>
            <span style={{backgroundImage:"linear-gradient(90deg,#7c3aed,#028A48,#e8a000,#BF0000)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"mgShimmer 5s linear infinite"}}>Arcade Mode</span>
          </h1>
          <p style={{fontSize:"13px",color:"rgba(0,0,0,.45)",margin:0,lineHeight:1.7}}>Challenge yourself beyond the daily puzzle. Earn bonus points, beat personal records.</p>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:8,marginBottom:24,animation:"mgFadeIn .4s .1s ease both"}}>
          {MODE_DEFS.map(m=>(
            <div key={m.id} className="mg-mode-tab" onClick={()=>setActiveMode(m.id)}
              style={{flex:1,padding:"14px 16px",borderRadius:12,border:`2px solid ${activeMode===m.id?m.color:"rgba(0,0,0,.08)"}`,background:activeMode===m.id?`${m.color}0d`:"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4}}>{m.emoji}</div>
              <div style={{fontSize:12,fontWeight:700,color:activeMode===m.id?m.color:"#0a0a0a",letterSpacing:1}}>{m.label}</div>
              <div style={{fontSize:9,color:"rgba(0,0,0,.4)",marginTop:3,letterSpacing:.5}}>{m.badge}</div>
            </div>
          ))}
        </div>

        {/* Mode info banner */}
        <div style={{background:"#fff",border:`1.5px solid ${selMode.color}30`,borderLeft:`4px solid ${selMode.color}`,borderRadius:10,padding:"14px 16px",marginBottom:20,animation:"mgFadeIn .3s ease both",display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{fontSize:28,flexShrink:0}}>{selMode.icon}</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#0a0a0a",marginBottom:3}}>{selMode.emoji} {selMode.label} — How It Works</div>
            <div style={{fontSize:11,color:"rgba(0,0,0,.5)",lineHeight:1.7}}>{selMode.detail}</div>
            {selMode.id==="blitz"&&(
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                {[{l:"⏱",v:"90 seconds"},{l:"💡",v:"2 hints"},{l:"🎯",v:"Type to guess"},{l:"🏅",v:"Beat your best"}].map(x=>(
                  <div key={x.v} style={{background:`${selMode.color}0f`,border:`1px solid ${selMode.color}22`,borderRadius:6,padding:"3px 8px",fontSize:9,color:selMode.color,fontWeight:700}}>{x.l} {x.v}</div>
                ))}
              </div>
            )}
            {selMode.id==="trivia"&&(
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                {[{l:"❓",v:"26 questions"},{l:"4️⃣",v:"4 options each"},{l:"🧮",v:"Track score"},{l:"📚",v:"Deep knowledge"}].map(x=>(
                  <div key={x.v} style={{background:`${selMode.color}0f`,border:`1px solid ${selMode.color}22`,borderRadius:6,padding:"3px 8px",fontSize:9,color:selMode.color,fontWeight:700}}>{x.l} {x.v}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Game cards grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {GAME_DEFS.map((g,idx)=>{
            const bestKey=g.key;
            const best=blitzBests[bestKey]||0;
            const cardKey=`${activeMode}:${g.key}`;
            const isHov=hovered===cardKey;
            return(
              <div key={cardKey} className="mg-game-card"
                onClick={()=>onSelect(cardKey)}
                onMouseEnter={()=>setHovered(cardKey)}
                onMouseLeave={()=>setHovered(null)}
                style={{background:"#fff",borderRadius:14,border:`1.5px solid ${isHov?g.color:"rgba(0,0,0,.08)"}`,overflow:"hidden",cursor:"pointer",animation:`mgCardPop .35s ${idx*.08+.15}s ease both`,boxShadow:isHov?`0 8px 32px ${g.color}25`:"0 1px 4px rgba(0,0,0,.06)"}}>
                {/* Card header */}
                <div style={{background:g.grad,padding:"18px 16px 14px",display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",right:-10,bottom:-10,fontSize:64,opacity:.12,lineHeight:1}}>{g.emoji}</div>
                  <div style={{width:44,height:44,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{g.emoji}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:.2}}>{g.name}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.7)",marginTop:2,letterSpacing:.5}}>{g.sub}</div>
                  </div>
                  <div style={{marginLeft:"auto",background:"rgba(0,0,0,.25)",borderRadius:6,padding:"4px 8px",textAlign:"center",flexShrink:0}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.6)",letterSpacing:1}}>{g.items} ITEMS</div>
                  </div>
                </div>
                {/* Card body */}
                <div style={{padding:"12px 16px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:16}}>{selMode.emoji}</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#0a0a0a"}}>{g.name} {selMode.label}</span>
                    </div>
                    {activeMode==="blitz"&&best>0&&(
                      <div style={{background:`${g.color}12`,border:`1px solid ${g.color}30`,borderRadius:20,padding:"3px 9px",fontSize:9,fontWeight:700,color:g.color}}>BEST {best}</div>
                    )}
                  </div>
                  {activeMode==="blitz"?(
                    <div style={{fontSize:10,color:"rgba(0,0,0,.45)",lineHeight:1.6,marginBottom:12}}>How many {g.name} {g.key==="states"?"states":g.key==="nfl"?"teams":"stations"} can you type in 90 seconds?{best===0?" Set your first record!":` Beat your record of ${best}.`}</div>
                  ):(
                    <div style={{fontSize:10,color:"rgba(0,0,0,.45)",lineHeight:1.6,marginBottom:12}}>26 multiple-choice questions about {g.name} facts, history, and trivia. Test your expert knowledge.</div>
                  )}
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{flex:1,height:4,background:"rgba(0,0,0,.06)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:activeMode==="blitz"&&best>0?`${Math.min(100,best/(g.items)*100)}%`:"0%",background:g.color,borderRadius:2,transition:"width .5s ease"}}/>
                    </div>
                    <div style={{background:g.color,color:"#fff",fontSize:10,fontWeight:700,padding:"7px 14px",borderRadius:20,letterSpacing:.5,flexShrink:0,transition:"opacity .15s",opacity:isHov?.95:1}}>
                      {activeMode==="blitz"?(best>0?"PLAY AGAIN ⚡":"START ⚡"):"PLAY 🧠"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div style={{textAlign:"center",marginTop:24,fontSize:10,color:"rgba(0,0,0,.28)",letterSpacing:1,animation:"mgFadeIn .4s .5s ease both"}}>
          MINI GAMES DO NOT COUNT TOWARD DAILY STREAKS · ALWAYS FREE
        </div>
      </div>
    </div>
  );
}

// ── ROOT ORCHESTRATOR ─────────────────────────────────────────────────────────
type Phase="intro"|"start"|"select-game"|"select-difficulty"|"tutorial"|"play"|"mini-games";

function IntroScreen({onDone}:{onDone:()=>void}){
  const[exiting,setExiting]=useState(false);
  const[countdown,setCountdown]=useState(20);
  const[videoError,setVideoError]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const dismiss=useRef(()=>{});
  dismiss.current=()=>{
    if(exiting)return;
    setExiting(true);
    const today=new Date().toISOString().slice(0,10);
    localStorage.setItem("tgg:intro:seen",today);
    setTimeout(onDone,500);
  };
  useEffect(()=>{
    const iv=setInterval(()=>{
      setCountdown(c=>{
        if(c<=1){clearInterval(iv);dismiss.current();return 0;}
        return c-1;
      });
    },1000);
    return()=>clearInterval(iv);
  },[]);
  useEffect(()=>{
    const v=videoRef.current;
    if(!v)return;
    v.play().catch(()=>{});
    v.onended=()=>dismiss.current();
  },[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#000",opacity:exiting?0:1,transition:"opacity 0.5s ease",overflow:"hidden"}}>
      {!videoError?(
        <video ref={videoRef} src="/intro.mp4"
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
          playsInline muted autoPlay
          onError={()=>setVideoError(true)}
        />
      ):(
        /* Fallback animated splash if video fails */
        <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0a0a0a 0%,#1a0000 50%,#0a0a0a 100%)"}}>
          <style>{`@keyframes introPulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.06);opacity:1}}@keyframes introFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}@keyframes introLine{from{width:0}to{width:100%}}`}</style>
          <div style={{fontSize:80,animation:"introPulse 2s ease-in-out infinite",marginBottom:24}}>🎯</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(28px,6vw,52px)",fontWeight:700,color:"#fff",letterSpacing:6,animation:"introFadeUp .8s .2s ease both"}}>UrbanIQ</div>
          <div style={{width:0,height:2,background:"linear-gradient(90deg,#028A48,#BF0000,#013369)",borderRadius:2,margin:"18px auto",animation:"introLine 1.2s .6s ease both"}}/>
          <div style={{display:"flex",gap:20,marginTop:12,animation:"introFadeUp .8s .8s ease both",flexWrap:"wrap",justifyContent:"center",padding:"0 20px"}}>
            {[{e:"🚊",n:"Portland MAX"},{e:"🚇",n:"DC Metro"},{e:"🚉",n:"Baltimore"},{e:"🗺️",n:"US States"},{e:"🏈",n:"NFL Teams"},{e:"🎮",n:"Mini Games"}].map(g=>(
              <div key={g.n} style={{textAlign:"center",opacity:.7}}>
                <div style={{fontSize:28}}>{g.e}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.5)",letterSpacing:1,marginTop:4,fontFamily:"'JetBrains Mono',monospace"}}>{g.n}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:32,display:"flex",gap:10,animation:"introFadeUp .8s 1.2s ease both",flexWrap:"wrap",justifyContent:"center",padding:"0 20px"}}>
            {[{e:"🃏",n:"Card System"},{e:"⚡",n:"Blitz Mode"},{e:"🧠",n:"Trivia"},{e:"🔥",n:"Streaks"},{e:"⚔️",n:"Battles"},{e:"🏆",n:"Leaderboard"}].map(f=>(
              <div key={f.n} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:14}}>{f.e}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:.5}}>{f.n}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:28,fontSize:11,color:"rgba(255,255,255,.25)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:3,animation:"introFadeUp .8s 1.6s ease both"}}>5 GAMES · DAILY · FREE</div>
        </div>
      )}
      {/* Progress bar overlay */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,0.1)"}}>
        <div style={{height:"100%",background:"rgba(255,255,255,0.7)",width:`${(countdown/20)*100}%`,transition:"width 1s linear",borderRadius:"0 2px 2px 0"}}/>
      </div>
      <button
        onClick={()=>dismiss.current()}
        style={{
          position:"absolute",top:"20px",right:"20px",
          background:"rgba(0,0,0,0.55)",border:"1px solid rgba(255,255,255,0.18)",
          color:"#fff",fontFamily:"Inter,sans-serif",fontSize:"12px",fontWeight:600,
          letterSpacing:"0.18em",padding:"10px 16px",borderRadius:"6px",cursor:"pointer",
          backdropFilter:"blur(10px)",display:"flex",alignItems:"center",gap:"10px",zIndex:10001,
        }}
      >
        SKIP
        <div style={{width:"36px",height:"3px",background:"rgba(255,255,255,0.15)",borderRadius:"2px",overflow:"hidden"}}>
          <div style={{height:"100%",background:"rgba(255,255,255,0.8)",width:`${(countdown/20)*100}%`,transition:"width 1s linear",borderRadius:"2px"}}/>
        </div>
        <span style={{fontVariantNumeric:"tabular-nums",opacity:0.5,minWidth:"18px"}}>{countdown}s</span>
      </button>
    </div>
  );
}

function Root(){
  const[phase,setPhase]=useState<Phase>("start");
  const[selectedGame,setSelectedGame]=useState(()=>localStorage.getItem("tgg:cityPref")||"pdx");
  const[selectedDiff,setSelectedDiff]=useState("medium");
  const[showOnboarding,setShowOnboarding]=useState(()=>!localStorage.getItem("has_boarded"));
  const[showSupportOnLoad]=useState(()=>{
    const p=new URLSearchParams(window.location.search);
    if(p.get("supporter")==="true"){
      const email=p.get("email");
      if(email)localStorage.setItem("supporter_email",email);
      window.history.replaceState({},"",window.location.pathname);
      return true;
    }
    return false;
  });
  const RER={guesses:[],won:false,lost:false,alreadyPlayed:false};
  const RES={streak:0,played:0,wins:0,totalGuesses:0,dist:{1:0,2:0,3:0,4:0,5:0,6:0}};
  const[allStats,setAllStats]=useState<any>({pdx:RES,dc:RES,states:RES,nfl:RES,balt:RES,la:RES,nyc:RES,chi:RES});
  const[roundData,setRoundData]=useState<any>({pdx:[{...RER},{...RER},{...RER}],dc:[{...RER},{...RER},{...RER}],states:[{...RER},{...RER},{...RER}],nfl:[{...RER},{...RER},{...RER}],balt:[{...RER},{...RER},{...RER}],la:[{...RER},{...RER},{...RER}],nyc:[{...RER},{...RER},{...RER}],chi:[{...RER},{...RER},{...RER}]});
  const[blitzBests,setBlitzBests]=useState<any>({pdx:0,dc:0,states:0,nfl:0,balt:0,la:0,nyc:0,chi:0});
  const[settings,setSettings]=useState<any>({dark:false,colorblind:false,textSize:"medium",highContrast:false,sounds:true});
  const[loaded,setLoaded]=useState(false);
  const[showDiffPicker,setShowDiffPicker]=useState(false);
  const[initMode,setInitMode]=useState<string|undefined>();
  const[streakShieldFired,setStreakShieldFired]=useState(false);
  const[pendingDailyCards,setPendingDailyCards]=useState<any[]>([]);

  useEffect(()=>{
    (async()=>{
      const today=getToday();
      const[pdxSt,dcSt,stSt,nflSt,baltSt,laSt,nycSt,chiSt,pdxBest,dcBest,stBest,nflBest,baltBest,laBest,nycBest,chiBest,sett,pdxR0,pdxR1,pdxR2,dcR0,dcR1,dcR2,stR0,stR1,stR2,nflR0,nflR1,nflR2,baltR0,baltR1,baltR2,laR0,laR1,laR2,nycR0,nycR1,nycR2,chiR0,chiR1,chiR2]=await Promise.all([
        getStats("pdx"),getStats("dc"),getStats("states"),getStats("nfl"),getStats("balt"),getStats("la"),getStats("nyc"),getStats("chi"),
        getBlitzBest("pdx"),getBlitzBest("dc"),getBlitzBest("states"),getBlitzBest("nfl"),getBlitzBest("balt"),getBlitzBest("la"),getBlitzBest("nyc"),getBlitzBest("chi"),
        getSettings(),
        getTodayData("pdx",today+"r0"),getTodayData("pdx",today+"r1"),getTodayData("pdx",today+"r2"),
        getTodayData("dc",today+"r0"),getTodayData("dc",today+"r1"),getTodayData("dc",today+"r2"),
        getTodayData("states",today+"r0"),getTodayData("states",today+"r1"),getTodayData("states",today+"r2"),
        getTodayData("nfl",today+"r0"),getTodayData("nfl",today+"r1"),getTodayData("nfl",today+"r2"),
        getTodayData("balt",today+"r0"),getTodayData("balt",today+"r1"),getTodayData("balt",today+"r2"),
        getTodayData("la",today+"r0"),getTodayData("la",today+"r1"),getTodayData("la",today+"r2"),
        getTodayData("nyc",today+"r0"),getTodayData("nyc",today+"r1"),getTodayData("nyc",today+"r2"),
        getTodayData("chi",today+"r0"),getTodayData("chi",today+"r1"),getTodayData("chi",today+"r2"),
      ]);
      const shieldAvail=shieldAvailableForSupporter();
      let shieldFired=false;
      const statsMut:{[k:string]:any}={pdx:pdxSt,dc:dcSt,states:stSt,nfl:nflSt,balt:baltSt,la:laSt,nyc:nycSt,chi:chiSt};
      const today2=getToday();
      for(const gk2 of["pdx","dc","states","nfl","balt","la","nyc","chi"]){
        const s=statsMut[gk2];
        if(!s.lastPlayed||s.streak===0)continue;
        const dayDiff=daysSinceDate(s.lastPlayed);
        if(dayDiff>1){
          if(shieldAvail&&!shieldFired){
            // Shield activates: forgive the miss by advancing lastPlayed to today
            shieldFired=true;
            const forgivenStats={...s,lastPlayed:today2};
            statsMut[gk2]=forgivenStats;
            await saveStats(gk2,forgivenStats);
          } else {
            const resetStats={...s,streak:0,lastPlayed:today2};
            statsMut[gk2]=resetStats;
            await saveStats(gk2,resetStats);
          }
        }
      }
      if(shieldFired){markShieldUsed();setStreakShieldFired(true);}
      // ────────────────────────────────────────────────────────────────────────
      setAllStats(statsMut);
      setBlitzBests({pdx:pdxBest||0,dc:dcBest||0,states:stBest||0,nfl:nflBest||0,balt:baltBest||0,la:laBest||0,nyc:nycBest||0,chi:chiBest||0});
      setSettings(sett);SoundEngine.setEnabled(sett?.sounds!==false);
      function quickRound(td:any){if(!td?.guesses)return{guesses:[],won:false,lost:false,alreadyPlayed:false};return{guesses:td.guesses,won:td.won,lost:td.lost,alreadyPlayed:td.won||td.lost};}
      const rd={pdx:[quickRound(pdxR0),quickRound(pdxR1),quickRound(pdxR2)],dc:[quickRound(dcR0),quickRound(dcR1),quickRound(dcR2)],states:[quickRound(stR0),quickRound(stR1),quickRound(stR2)],nfl:[quickRound(nflR0),quickRound(nflR1),quickRound(nflR2)],balt:[quickRound(baltR0),quickRound(baltR1),quickRound(baltR2)],la:[quickRound(laR0),quickRound(laR1),quickRound(laR2)],nyc:[quickRound(nycR0),quickRound(nycR1),quickRound(nycR2)],chi:[quickRound(chiR0),quickRound(chiR1),quickRound(chiR2)]};
      setRoundData(rd);
      const anyPlayed=Object.values(rd).some((rounds:any)=>rounds.some((r:any)=>r.alreadyPlayed));
      if(anyPlayed)markActivityDay(getDayNum());
      // Daily visit card
      const dvToday=getToday();const dvLast=localStorage.getItem("tgg:daily-cards:date");
      if(dvLast!==dvToday){localStorage.setItem("tgg:daily-cards:date",dvToday);const dvGames=["pdx","dc","balt","la","states","nfl"];const dvGk=dvGames[getDayNum()%dvGames.length];const dvPool:any[]=dvGk==="pdx"?PDX_STATIONS:dvGk==="dc"?DC_STATIONS:dvGk==="balt"?BALT_STATIONS:dvGk==="la"?LA_STATIONS:dvGk==="nfl"?NFL_TEAMS:STATES;const dvItem=dvPool[getDayNum()%dvPool.length];const dvCard=generateCard(dvItem.name,dvGk,"medium",{zone:(dvItem as any).zone||(dvItem as any).region,year:(dvItem as any).year});setPendingDailyCards([dvCard]);}
      setLoaded(true);
    })();
  },[]);

  function handleSelectGame(gk:string){
    SoundEngine.play("select");
    if(gk==="minigames"){
      setPhase("mini-games");
    }else if(gk==="cards"){
      setInitMode("cards");
      setSelectedGame(localStorage.getItem("tgg:cityPref")||"pdx");
      setSelectedDiff("medium");
      setPhase("play");
    }else if(gk.includes(":")){
      const[mode,key]=gk.split(":");
      setSelectedGame(key);
      setInitMode(mode);
      setSelectedDiff("medium");
      setPhase("play");
    }else{
      setInitMode(undefined);
      setSelectedGame(gk);
      localStorage.setItem("tgg:cityPref",gk);
      setShowDiffPicker(true);
    }
  }
  function handleSelectDiff(d:string){
    SoundEngine.play("select");setSelectedDiff(d);setShowDiffPicker(false);
    const hasFlag=!!localStorage.getItem("onboarding_complete");
    const hasHistory=Object.values(allStats).some((s:any)=>s.played>0);
    if(hasFlag||hasHistory){
      if(!hasFlag)localStorage.setItem("onboarding_complete","1");
      setPhase("play");
    }else{
      setPhase("tutorial");
    }
  }
  function handleTutorialDone(){SoundEngine.play("navigate");setPhase("play");}
  function handleBackToSelector(){SoundEngine.play("navigate");setPhase("select-game");}

  const T=getTheme(selectedGame,settings);
  const G=GAMES[selectedGame];
  const DIFF=G.diffConfig[selectedDiff];

  if(!loaded){
    return(
      <div style={{minHeight:"100vh",background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",color:"#bbb"}}>
        <div><div style={{fontSize:"32px",textAlign:"center",marginBottom:12}}>🎯</div><div style={{letterSpacing:3,fontSize:"12px"}}>LOADING...</div></div>
      </div>
    );
  }

  if(phase==="intro"){
    return <IntroScreen onDone={()=>setPhase("start")}/>;
  }

  if(phase==="play"){
    return <GameApp initGameKey={selectedGame} initDiff={selectedDiff} initMode={initMode} onBack={handleBackToSelector} onHome={()=>setPhase("start")} shieldActivated={streakShieldFired}/>;
  }

  if(phase==="mini-games"){
    return <MiniGamesScreen blitzBests={blitzBests} onSelect={handleSelectGame} onBack={()=>setPhase("start")}/>;
  }

  if(phase==="tutorial"){
    return <InteractiveTutorial T={T} fs={T.fs} gameKey={selectedGame} DIFF={DIFF} lineColors={G.lineColors||{}} onDone={handleTutorialDone}/>;
  }

  const pageContent=
    phase==="start"||phase==="select-game"?
      <>
        <StartPage onBegin={()=>setPhase("select-game")} onSelectGame={handleSelectGame} initialShowSupport={showSupportOnLoad} settings={settings}/>
        {phase==="select-game"&&<GameSelector allStats={allStats} roundData={roundData} blitzBests={blitzBests} onSelect={handleSelectGame} onBack={()=>setPhase("start")} settings={settings}/>}
        {showDiffPicker&&<DiffPickerModal gameKey={selectedGame} settings={settings} onSelect={handleSelectDiff} onClose={()=>setShowDiffPicker(false)}/>}
      </>:null;

  return(
    <>
    {pendingDailyCards.length>0&&<PackOpening isDaily={true} card={pendingDailyCards[0]} onDone={()=>{const _e=JSON.parse(localStorage.getItem("tgg-card-col")||"[]");localStorage.setItem("tgg-card-col",JSON.stringify([..._e,pendingDailyCards[0]]));setPendingDailyCards(p=>p.slice(1));}}/>}
    {showOnboarding&&<OnboardingOverlay onDone={()=>{setShowOnboarding(false);setSelectedGame(localStorage.getItem("tgg:cityPref")||"pdx");}} onStartGame={(gk)=>{setShowOnboarding(false);setSelectedGame(gk);setSelectedDiff("medium");setPhase("play");}}/>}
    <div key={phase==="select-game"?"start":phase} style={{animation:"pageIn .32s ease both"}}>
      <style>{`@keyframes pageIn{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}`}</style>
      {pageContent}
    </div>
    </>
  );
}

// ── ONBOARDING OVERLAY ─────────────────────────────────────────────────────────
function OnboardingOverlay({onDone,onStartGame}:{onDone:()=>void,onStartGame?:(gk:string)=>void}){
  const [screen,setScreen]=useState(0);
  const [cityPref,setCityPref]=useState(localStorage.getItem("tgg:cityPref")||"pdx");
  const [openCats,setOpenCats]=useState<Set<string>>(new Set());
  const CITY_OPTS=[
    {key:"pdx",   label:"Portland MAX",  emoji:"🚊", sub:"TriMet light rail",           cat:"TRANSIT"},
    {key:"dc",    label:"DC Metro",      emoji:"🚇", sub:"WMATA subway",                cat:"TRANSIT"},
    {key:"balt",  label:"Baltimore MTA", emoji:"🚉", sub:"Maryland rail",               cat:"TRANSIT"},
    {key:"la",    label:"LA Metro",      emoji:"🌴", sub:"Metro Rail · Los Angeles",    cat:"TRANSIT"},
    {key:"nyc",   label:"NYC Subway",    emoji:"🗽", sub:"MTA · New York City",         cat:"TRANSIT"},
    {key:"chi",   label:"Chicago L",     emoji:"🌬️",sub:"CTA · Chicago",              cat:"TRANSIT"},
    {key:"states",label:"US States",     emoji:"🗺️",sub:"Geography puzzle",           cat:"GEOGRAPHY"},
    {key:"nfl",   label:"NFL Teams",     emoji:"🏈", sub:"Football puzzle",             cat:"SPORTS"},
    {key:"minigames",label:"Mini Games", emoji:"🎮", sub:"Blitz · Trivia · Challenges", cat:"ARCADE"},
  ];
  function skipToHome(){localStorage.setItem("has_boarded","1");onDone();}
  function finish(){
    localStorage.setItem("has_boarded","1");
    localStorage.setItem("tgg:cityPref",cityPref);
    onDone();
  }
  const screens=[
    /* screen 0 — welcome */
    <div key="s0" style={{textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16}}>🏙️</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(22px,5vw,34px)",fontWeight:700,letterSpacing:2,color:"#0a0a0a",marginBottom:10}}>Welcome to UrbanIQ</div>
      <div style={{fontSize:"14px",color:"rgba(0,0,0,.5)",lineHeight:1.8,maxWidth:310,margin:"0 auto 28px"}}>A daily puzzle that tests your knowledge of transit systems, US states, and pro football. Five games. Three rounds. One shot per day.</div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
        {["🚊 Transit","🗺️ Geography","🏈 Sports"].map(t=>(
          <div key={t} style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:20,padding:"5px 12px",fontSize:"11px",fontWeight:600,color:"rgba(0,0,0,0.5)"}}>{t}</div>
        ))}
      </div>
      <button onClick={()=>setScreen(1)} style={{background:"#0a0a0a",color:"#fff",border:"none",borderRadius:10,padding:"14px 40px",fontSize:"14px",fontWeight:700,letterSpacing:1.5,cursor:"pointer",width:"100%",maxWidth:280}}>LET'S GO →</button>
    </div>,
    /* screen 1 — quick play */
    <div key="s1">
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:32,marginBottom:8}}>⚡</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"20px",fontWeight:700,letterSpacing:1,color:"#0a0a0a",marginBottom:5}}>Quick Play</div>
        <div style={{fontSize:"12px",color:"rgba(0,0,0,.45)",lineHeight:1.7}}>Choose a game to start with. You can always switch.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
        {([{cat:"TRANSIT",label:"🚊 Transit",color:"#028A48"},{cat:"GEOGRAPHY",label:"🗺️ Geography",color:"#1a3a8f"},{cat:"SPORTS",label:"🏈 Sports",color:"#013369"},{cat:"ARCADE",label:"🎮 Arcade",color:"#7c3aed"}] as {cat:string,label:string,color:string}[]).map(({cat,label,color})=>{
          const items=CITY_OPTS.filter(o=>o.cat===cat);
          const open=openCats.has(cat);
          const hasSelected=items.some(o=>o.key===cityPref);
          return(
            <div key={cat}>
              <button onClick={()=>setOpenCats(prev=>{const n=new Set(prev);n.has(cat)?n.delete(cat):n.add(cat);return n;})}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:open||hasSelected?"rgba(0,0,0,0.03)":"transparent",border:`1.5px solid ${hasSelected?color+"55":open?"rgba(0,0,0,0.12)":"rgba(0,0,0,0.08)"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s",boxSizing:"border-box"}}>
                <span style={{fontSize:"11px",letterSpacing:2,color:open||hasSelected?color:"rgba(0,0,0,0.45)",fontWeight:700}}>{label}{hasSelected?` · ${CITY_OPTS.find(o=>o.key===cityPref&&o.cat===cat)?.label||""}`:""}</span>
                <span style={{fontSize:"10px",color:"rgba(0,0,0,0.3)",display:"inline-block",transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
              </button>
              {open&&(
                <div style={{paddingTop:5,display:"flex",flexDirection:"column",gap:5,paddingLeft:8}}>
                  {items.map(o=>(
                    <div key={o.key} onClick={()=>{setCityPref(o.key);localStorage.setItem("tgg:cityPref",o.key);localStorage.setItem("has_boarded","1");if(onStartGame){onStartGame(o.key);}else{onDone();}}}
                      style={{display:"flex",alignItems:"center",gap:11,border:`2px solid ${cityPref===o.key?"#0a0a0a":"rgba(0,0,0,0.07)"}`,borderRadius:9,padding:"9px 13px",cursor:"pointer",background:cityPref===o.key?"rgba(0,0,0,0.03)":"#fff",transition:"all .15s"}}>
                      <span style={{fontSize:18,width:26,textAlign:"center"}}>{o.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"13px",fontWeight:700,color:"#0a0a0a"}}>{o.label}</div>
                        <div style={{fontSize:"10px",color:"rgba(0,0,0,.4)",marginTop:1}}>{o.sub}</div>
                      </div>
                      <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${cityPref===o.key?"#0a0a0a":"rgba(0,0,0,0.15)"}`,background:cityPref===o.key?"#0a0a0a":"transparent",flexShrink:0}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <button onClick={()=>setScreen(2)} style={{background:"#0a0a0a",color:"#fff",border:"none",borderRadius:10,padding:"14px 40px",fontSize:"14px",fontWeight:700,letterSpacing:1.5,cursor:"pointer",width:"100%"}}>NEXT →</button>
        <button onClick={skipToHome} style={{background:"transparent",color:"rgba(0,0,0,.38)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:10,padding:"11px",fontSize:"12px",fontWeight:600,letterSpacing:1,cursor:"pointer",width:"100%",fontFamily:"'Inter',sans-serif"}}>SKIP → GO TO HOME</button>
      </div>
    </div>,
    /* screen 2 — how it works */
    <div key="s2">
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:32,marginBottom:10}}>🎯</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"20px",fontWeight:700,letterSpacing:1,color:"#0a0a0a",marginBottom:6}}>How clues work</div>
        <div style={{fontSize:"12px",color:"rgba(0,0,0,.45)",lineHeight:1.7}}>Each guess gives you colour-coded feedback on three attributes.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {[{e:"🟩",c:"#16a34a",label:"Green",desc:"Exact match — you nailed it!"},
          {e:"🟨",c:"#ca8a04",label:"Yellow",desc:"Close — adjacent or partial match"},
          {e:"🟥",c:"#dc2626",label:"Red",desc:"Way off — try a different area"}].map(row=>(
          <div key={row.label} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(0,0,0,0.025)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,padding:"12px 14px"}}>
            <span style={{fontSize:26}}>{row.e}</span>
            <div>
              <div style={{fontSize:"13px",fontWeight:700,color:row.c}}>{row.label}</div>
              <div style={{fontSize:"11px",color:"rgba(0,0,0,.45)",marginTop:2}}>{row.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={finish} style={{background:"#0a0a0a",color:"#fff",border:"none",borderRadius:10,padding:"14px 40px",fontSize:"14px",fontWeight:700,letterSpacing:1.5,cursor:"pointer",width:"100%"}}>START PLAYING 🎉</button>
    </div>,
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}>
      <style>{`@keyframes obIn{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:none}}`}</style>
      <div style={{background:"#fff",borderRadius:18,padding:"28px 24px 24px",width:"100%",maxWidth:400,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",animation:"obIn .3s ease both",position:"relative",maxHeight:"90vh",overflowY:"auto"}}>
        {/* Step dots */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:i===screen?22:7,height:7,borderRadius:4,background:i===screen?"#0a0a0a":"rgba(0,0,0,0.12)",transition:"all .25s"}}/>
          ))}
        </div>
        {screens[screen]}
      </div>
    </div>
  );
}

// ── QUERY CLIENT ──────────────────────────────────────────────────────────────

function App(){ return <Root/>; }

// ── PWA SERVICE WORKER REGISTRATION ──────────────────────────────────────────
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
  });
}

// ── MOUNT ─────────────────────────────────────────────────────────────────────
const rootEl=document.getElementById("root") as HTMLElement;
const root=ReactDOM.createRoot(rootEl);
root.render(<ErrorBoundary><App/></ErrorBoundary>);
