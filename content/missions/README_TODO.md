// [Oturum 17 — content/ katmanı] Görev (mission) sistemi HENÜZ YOK.

Kodda ayrı bir "günlük/haftalık görev" sistemi mevcut değil — bu yüzden
buraya taşınacak bir şey yok (uydurma içerik oluşturmadık).

En yakın şey: content/levels/chapter-database.js içindeki level-bazlı
"goal" (score/create9/giftCount/breakBlockers) — ama bu "seviye hedefi",
"görev" (ayrı, level'dan bağımsız, günlük yenilenen hedef) değil.

Önerilen şema (ileride uygulanacak, şimdilik sadece tasarım):
{
  "id": "daily_2026_07_06_1",
  "type": "create9_count" | "blast_blockers" | "win_levels" | "collect_gift_tier",
  "target": 5,
  "reward": { "type": "energy", "amount": 20 },
  "resetPeriod": "daily" | "weekly",
  "expiresAt": "2026-07-07T00:00:00Z"
}
