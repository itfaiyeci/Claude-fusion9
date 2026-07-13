// [Oturum 15] Sabitler rules/rewardRules.js'e taşındı — bu dosyada
// sadece EnergyTracker SINIFI kalıyor.

class EnergyTracker{
  constructor(energy=0){ this.energy=Math.max(0,energy); this.areaBoostPending=false; }
  add(amount){
    if(typeof amount !== "number" || isNaN(amount) || amount < 0) return; // negatif/NaN sessizce yoksay
    this.energy = Math.max(0, this.energy + amount);
  }
  canAfford(cost){ return this.energy >= cost; }
  spend(cost){
    if(!this.canAfford(cost)) return false; // throw yerine false — UI çökmez
    this.energy = Math.max(0, this.energy - cost); // asla negatife düşme
    return true;
  }
  purchaseMoves(tier){
    const option=MOVE_PURCHASE_OPTIONS[tier];
    if(!option) throw new Error(`Geçersiz hamle satın alma kademesi: ${tier}`);
    if(!this.canAfford(option.cost)) return {ok:false, cost:option.cost, energy:this.energy};
    this.spend(option.cost);
    return {ok:true, moves:option.moves, cost:option.cost};
  }
  purchaseAreaBoost(){
    if(this.areaBoostPending) return {ok:false, reason:"already_active"};
    if(!this.canAfford(AREA_BOOST_COST)) return {ok:false, cost:AREA_BOOST_COST, energy:this.energy};
    this.spend(AREA_BOOST_COST);
    this.areaBoostPending=true;
    return {ok:true, cost:AREA_BOOST_COST, pending:true};
  }
  consumeAreaBoost(){
    if(this.areaBoostPending){ this.areaBoostPending=false; return true; }
    return false;
  }
  purchaseRandomBlockerBreak(){
    if(!this.canAfford(RANDOM_BLOCKER_BREAK_COST)) return {ok:false, cost:RANDOM_BLOCKER_BREAK_COST, energy:this.energy};
    this.spend(RANDOM_BLOCKER_BREAK_COST);
    return {ok:true, cost:RANDOM_BLOCKER_BREAK_COST};
  }
  purchaseFullTypeBlockerBreak(blockerType){
    if(!this.canAfford(FULL_TYPE_BLOCKER_BREAK_COST)) return {ok:false, cost:FULL_TYPE_BLOCKER_BREAK_COST, energy:this.energy};
    this.spend(FULL_TYPE_BLOCKER_BREAK_COST);
    return {ok:true, cost:FULL_TYPE_BLOCKER_BREAK_COST, blockerType};
  }
  purchaseSuperBlast(){
    if(!this.canAfford(SUPER_BLAST_COST)) return {ok:false, cost:SUPER_BLAST_COST, energy:this.energy};
    this.spend(SUPER_BLAST_COST);
    return {ok:true, cost:SUPER_BLAST_COST, comboCount:SUPER_BLAST_COMBO_COUNT, scoreMultiplier:SUPER_BLAST_SCORE_MULTIPLIER};
  }
}

