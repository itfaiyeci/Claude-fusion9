const VALUES = [1,2,3,4,5,6,7,8];

function makeRng(seed) {
  // Mulberry32 — taşınabilir, tutarlı uint32 RNG
  // seed=0 geçersiz, 1'e zorla; >>> 0 ile uint32'ye çevir
  let a = ((seed >>> 0) || 1) >>> 0;
  return function() {
    // Tüm aritmetik >>> 0 ile uint32'de tutulur — signed/unsigned karışımı yok
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a) >>> 0;
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rngInt(rng,n){return Math.floor(rng()*n);}
function rngChoice(rng,arr){return arr[rngInt(rng,arr.length)];}
