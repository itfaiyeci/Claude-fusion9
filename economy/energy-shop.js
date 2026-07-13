// [Oturum 9 — Faz 2] Enerji mağazası: GameCore.prototype mixin.
// Eskiden GameCore sınıfının içinde tanımlıydı, davranış BİREBİR AYNI —
// sadece class body yerine prototype ataması olarak yazıldı (bu, sınıfı
// tek parça halinde bölmeden metod taşımanın standart, düşük riskli yolu).
// Bu dosya core/game-engine.js'TEN SONRA yüklenmeli (GameCore zaten
// tanımlanmış olmalı).

// [YENİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10o] ENERJİ
// HARCAMA. Tüm metodlar this.energyTracker yoksa Error fırlatır.
GameCore.prototype._requireEnergyTracker = function(){
  if(!this.energyTracker) throw new Error("Enerji harcamak için bir energyTracker gerekli.");
};
GameCore.prototype.spendEnergyForMoves = function(tier){
  this._requireEnergyTracker();
  if(this.status!=="in_progress" && this.status!=="lost"){
    return {ok:false, reason:"wrong_status"};
  }
  const result=this.energyTracker.purchaseMoves(tier);
  if(!result.ok) return result;
  this.extraMoves+=result.moves;
  if(this.status==="lost") this.status="in_progress";
  return result;
};
GameCore.prototype.spendEnergyForAreaBoost = function(){
  this._requireEnergyTracker();
  const result = this.energyTracker.purchaseAreaBoost();
  return result;
};
GameCore.prototype._maybeApplyAreaBoost = function(areaSize){
  if(!this.energyTracker) return areaSize;
  if(this.energyTracker.consumeAreaBoost()){
    const [nRows,nCols]=areaSize;
    return [nRows+AREA_BOOST_EXTRA_SIZE, nCols+AREA_BOOST_EXTRA_SIZE];
  }
  return areaSize;
};
GameCore.prototype.spendEnergyForRandomBlockerBreak = function(){
  this._requireEnergyTracker();
  const keys=[...this.blockers.keys()];
  if(keys.length===0) return {ok:false, reason:"no_blockers"};
  const result=this.energyTracker.purchaseRandomBlockerBreak();
  if(!result.ok) return result;
  const pos=keys[Math.floor(this.rng()*keys.length)];
  this.blockers.delete(pos);
  this._refillInPlace();
  result.brokenPosition=pos.split(",").map(Number);
  return result;
};
GameCore.prototype.spendEnergyForFullTypeBlockerBreak = function(blockerType){
  this._requireEnergyTracker();
  const positions=[...this.blockers.entries()].filter(([,tile])=>tile.blockerType===blockerType).map(([k])=>k);
  if(positions.length===0) throw new Error(`Board'da '${blockerType}' türünde hiç blocker yok.`);
  const result=this.energyTracker.purchaseFullTypeBlockerBreak(blockerType);
  for(const pos of positions) this.blockers.delete(pos);
  this._refillInPlace();
  result.brokenPositions=positions.map(k=>k.split(",").map(Number));
  return result;
};
GameCore.prototype.spendEnergyForSuperBlast = function(){
  this._requireEnergyTracker();
  if(this.status!=="in_progress") return {ok:false, reason:"wrong_status"};
  const result=this.energyTracker.purchaseSuperBlast();
  if(!result.ok) return result;
  const allCells=[];
  for(let r=0;r<this.board.size;r++) for(let c=0;c<this.board.size;c++) allCells.push([r,c]);
  const {points:basePoints,brokenBlockers}=this.applyBlast(allCells);
  const comboPoints=result.comboCount*VIRTUAL_COMBO_POINTS;
  const totalPoints=(basePoints+comboPoints)*result.scoreMultiplier;
  this.score+=totalPoints;
  this._refillInPlace();
  result.points=totalPoints;
  result.brokenBlockers=brokenBlockers;
  this._updateStatus();
  return result;
};

// [Oturum 9] Reklamla-devam — economy/ad-rewards.js'teki sabitleri kullanır
// (bu dosya ondan sonra yüklenmeli — build manifest'inde zaten öyle).
GameCore.prototype.watchAdContinue = function(){
  if(this.status!=="lost") throw new Error("sadece lost iken");
  if(this.adContinueUsed) throw new Error("zaten kullanildi");
  // [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10m]
  // Ödül artık level'in hamle limitinin bir oranı, alt/üst sınırlarla kısıtlı.
  let rewardMoves;
  if(this.movesLimit===null) rewardMoves=AD_CONTINUE_EXTRA_MOVES;
  else{
    rewardMoves=Math.round(this.movesLimit*AD_CONTINUE_MOVES_RATIO);
    rewardMoves=Math.max(AD_CONTINUE_MIN_MOVES,Math.min(AD_CONTINUE_MAX_MOVES,rewardMoves));
  }
  this.adContinueUsed=true; this.extraMoves+=rewardMoves; this.status="in_progress";
  this.lastAdContinueReward=rewardMoves;
  return true;
};
