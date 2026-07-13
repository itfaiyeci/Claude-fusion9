// [Oturum 15 — rules/ katmanı ayrıştırması] Sabitler
// rules/elementRules.js'e taşındı — bu dosyada sadece
// MEKANİZMA FONKSİYONLARI kalıyor. rules/elementRules.js
// bu dosyadan ÖNCE yüklenmeli.

// [YENİ] Mekanizma 6: Yıldırım+Yıldırım -> +12 Enerji.
function mechanism6LightningLightning(basePoints){
  return {points:basePoints,energy:LIGHTNING_LIGHTNING_ENERGY};
}
function mechanism4BreakBlockers(destroyerElement,blockerTypes){
  const destroyerPower=DESTROYER_POWER[destroyerElement];
  const blockerTotal=blockerTypes.reduce((s,b)=>s+BLOCKER_POWER[b],0);
  const total=destroyerPower+blockerTotal;
  if(total<0) return {broken:false,leftoverPower:0,leftoverElement:null};
  let leftoverElement=null;
  if(total>0){
    leftoverElement=POWER_TO_DESTROYER[total]??null;
    if(!leftoverElement){
      const candidates=Object.values(DESTROYER_POWER).filter(v=>v<=total);
      if(candidates.length) leftoverElement=POWER_TO_DESTROYER[Math.max(...candidates)];
    }
  }
  return {broken:true,leftoverPower:total,leftoverElement};
}
function mechanism5ElementNineBreak(elementType,basePoints){
  const blockerTypes=ELEMENT_NINE_BREAKS_BLOCKER_TYPES[elementType];
  if(!blockerTypes) return {points:basePoints,blockerTypesToBreak:null};
  return {points:basePoints,blockerTypesToBreak:[...blockerTypes]};
}
