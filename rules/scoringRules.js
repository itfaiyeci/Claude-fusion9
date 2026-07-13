// [Oturum 15 — rules/ katmanı] Puanlama sabitleri.

// Puan sistemi: hücre değeri × 10 mantığı
// 3'lü (a)=90 → 21 hamlede 7×3'lü=630 (level 1 hedef)
// 4'lü (b)=160, 5'li (c)=250, 6'lı (d)=360, 7'li+(e)=490
const BASE_POINTS={a:90,b:150,c:240,d:360,e:500}; // düzeltildi: sabit ~1.6x artış
const BLAST_CELL_POINTS = F9_CONFIG.POINTS.BLAST_CELL; // her patlayan hücre = 10 puan (1 sayısı değeri)
const BLAST_BLOCKER_POINTS = F9_CONFIG.POINTS.BLAST_BLOCKER; // engel kırma = 30 puan
