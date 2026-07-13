// ── DDA: Dinamik Zorluk Ayarı ─────────────────────────
const DDA_DENSITY_STREAK2 = F9_CONFIG.DDA.DENSITY_STREAK2;
const DDA_DENSITY_STREAK3 = F9_CONFIG.DDA.DENSITY_STREAK3;

const dda = {
  losses:0, densityMult:1.0, targetMult:1.0, movesMult:1.0,
  totalPlayed:0, totalWon:0,
  winRate(){ return this.totalPlayed>0 ? this.totalWon/this.totalPlayed : 0.5; },
  record(won){
    this.totalPlayed++;
    if(won){
      this.totalWon++; this.losses=0;
      this._mv("densityMult",1.0); this._mv("targetMult",1.0); this._mv("movesMult",1.0);
    } else {
      this.losses++;
      if(this.losses>=3){ this.densityMult=DDA_DENSITY_STREAK3; this.targetMult=DDA_TARGET_STREAK3; this.movesMult=DDA_MOVES_STREAK3; }
      else if(this.losses>=2){ this.densityMult=DDA_DENSITY_STREAK2; this.targetMult=DDA_TARGET_STREAK2; this.movesMult=DDA_MOVES_STREAK2; }
    }
    saveDDA();
  },
  _mv(k,t){ const c=this[k]; if(c<t) this[k]=Math.min(t,c+DDA_RECOVERY_STEP); else if(c>t) this[k]=Math.max(t,c-DDA_RECOVERY_STEP); },
  apply(cfg){
    if(this.losses===0&&this.densityMult===1.0) return cfg;
    cfg.targetScore=Math.max(315,Math.round(cfg.targetScore*this.targetMult)); // min %50 hedef
    // moves sabit kalır — DDA sadece hedef skoru ve yoğunluğu etkiler
    // cfg.moves=Math.min(30,Math.round(cfg.moves*this.movesMult));
    if(cfg.blockerDensity!==undefined) cfg.blockerDensity=Math.max(0,cfg.blockerDensity*this.densityMult);
    return cfg;
  },
  status(){
    if(this.losses>=3) return {text:"Kolay mod aktif 🤗",color:"#5DCAA5"};
    if(this.losses>=2) return {text:"Biraz kolaylaştırıldı",color:"#E0B23C"};
    return null;
  }
};

function saveDDA(){
  try{ _storage.setItem("f9_dda",JSON.stringify({losses:dda.losses,densityMult:dda.densityMult,targetMult:dda.targetMult,movesMult:dda.movesMult,totalPlayed:dda.totalPlayed,totalWon:dda.totalWon})); }catch(e){}
}
function loadDDA(){
  try{
    const d=JSON.parse(_storage.getItem("f9_dda")||"{}");
    if(d.losses!==undefined) dda.losses=d.losses;
    if(d.densityMult!==undefined) dda.densityMult=d.densityMult;
    if(d.targetMult!==undefined) dda.targetMult=d.targetMult;
    if(d.movesMult!==undefined) dda.movesMult=d.movesMult;
    if(d.totalPlayed!==undefined) dda.totalPlayed=d.totalPlayed;
    if(d.totalWon!==undefined) dda.totalWon=d.totalWon;
  }catch(e){}
}

