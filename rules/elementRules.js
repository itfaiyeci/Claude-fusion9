// [Oturum 15 — rules/ katmanı] Element sistemi sabitleri.
// Mantık (mekanizma fonksiyonları) engine/elementEngine.js'de.

// [GÜNCELLENDİ — bu konuşmada eklendi, bkz. TASARIM.md Bölüm 10j] Enerji
// artık ELEM_ENERGY/ELEM_ENERGY2X olarak element DEĞİL — sayısal bir
// kaynak (window.__f9Energy). DESTROYER_POWER'dan da kaldırıldı.
const ELEM_STORM="firtina", ELEM_WATER="su", ELEM_TNT="tnt", ELEM_FIRE="ates", ELEM_LIGHTNING="yildirim";
const DESTROYER_POWER={[ELEM_STORM]:6,[ELEM_WATER]:8,[ELEM_TNT]:10,[ELEM_FIRE]:12,[ELEM_LIGHTNING]:14};
const SAME_TYPE_TO_ELEMENT={[GIFT_COPPER]:ELEM_STORM,[GIFT_BRONZE]:ELEM_WATER,[GIFT_SILVER]:ELEM_TNT,[GIFT_GOLD]:ELEM_FIRE,[GIFT_DIAMOND]:ELEM_LIGHTNING};
const POWER_TO_DESTROYER={};
// POWER_TO_DESTROYER sabit tablo (N×9)
Object.assign(POWER_TO_DESTROYER,{6:ELEM_STORM,8:ELEM_WATER,10:ELEM_TNT,12:ELEM_FIRE,14:ELEM_LIGHTNING});

// MEKANİZMA 5 — Element + "9" -> board-genelinde TÜR-bazlı blocker
// kırma. Mekanizma 4'ten (komşuluk+güç toplama) tamamen bağımsız.
// [GÜNCELLENDİ] Enerji artık element olmadığı için bu tabloda hiç yer
// almıyor (board'da hiç bulunmuyor, kontrol gereksizleşti).
const ELEMENT_NINE_BREAKS_BLOCKER_TYPES={
  [ELEM_STORM]: [BLOCKER_GLASS, BLOCKER_WOOD],          // fırtına: cam + ağaç
  [ELEM_WATER]: [BLOCKER_ROCK, BLOCKER_ICE],             // su: kaya + buz
  [ELEM_TNT]:   [BLOCKER_ICE, BLOCKER_COPPER],           // tnt: buz + bakır engel
  [ELEM_FIRE]:  [BLOCKER_IRON, BLOCKER_WOOD],            // ateş: demir + ağaç
  [ELEM_LIGHTNING]: [BLOCKER_GLASS,BLOCKER_ROCK,BLOCKER_ICE,BLOCKER_IRON,BLOCKER_WOOD,BLOCKER_COPPER,BLOCKER_STEEL], // yıldırım: hepsi
};
