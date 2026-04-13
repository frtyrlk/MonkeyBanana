/**
 * Scripted in-game tutorial steps.
 * Each level has an array of steps. A step triggers when the condition is met,
 * pauses the game, and shows a popup. Player taps "Anladım" to resume.
 *
 * trigger types:
 *   'spawn'  — fires right after crate #N is spawned (cr === N)
 *   'drop'   — fires right after crate #N is placed (cr === N after push)
 *   'start'  — fires when the level starts (before first spawn)
 *   'combo'  — fires when combo reaches N
 *   'wind'   — fires when wind first exceeds threshold
 */

export const TUT_SCRIPTS={
  0:[ // Level 1 — temel + kombo
    {id:'t1_start', trigger:'start', text:'Kasalar sağa-sola kayıyor. Doğru an gelince ekrana dokun — kasa o anda düşer.'},
    {id:'t1_hud',   trigger:'spawn', cr:0, text:'📦 Yukarıda hedef sayacı, ❤️ sağ üstte canların. Kasa taşarsa kırpılır; boşa düşerse can gider.'},
    {id:'t1_drop1', trigger:'drop',  cr:1, text:'İlk kasan yerleşti! Kasayı öncekine ne kadar yakın bırakırsan o kadar az kırpılır.'},
    {id:'t1_perf',  trigger:'drop',  cr:2, text:'Tam hizalama = ✨ Mükemmel! Arka arkaya mükemmel yerleştir → combo başlar ve puanlar katlanır.'},
    {id:'t1_combo', trigger:'combo', n:2,  text:'🔥 x2 Combo! Seri arttıkça her kasa daha çok puan verir. Serini koru — hata comboyu kırar.'},
  ],
  1:[ // Level 2 — hız + rüzgar + combo pekiştirme
    {id:'t2_start', trigger:'start', text:'Hız biraz arttı ve hafif rüzgar var. Üstte 💨 simgesini takip et — kasayı o yöne iter.'},
    {id:'t2_wind',  trigger:'wind',  text:'Rüzgar değişti! Kasa sürükleniyor. Rüzgar yönüne göre bırakma zamanını ayarla.'},
    {id:'t2_drop2', trigger:'drop',  cr:3, text:'Rüzgarda combo yapmak zordur ama daha çok puan kazandırır. Risk al, ödülü topla!'},
  ],
  2:[ // Level 3 — zikzak + yağmur + NF meyve
    {id:'t3_start', trigger:'start', text:'Bu levelde kasalar sırayla sağdan ve soldan gelir (zikzak). Ritmini bul!'},
    {id:'t3_rain',  trigger:'spawn', cr:0, text:'🌧️ Yağmur yağıyor! Bırakınca kasa hafif kayabilir. Biraz fazla tolerans bırak.'},
    {id:'t3_nf',    trigger:'drop',  cr:2, text:'Kasaların üzerindeki meyveler bonus efekt verir: 🍌 puan, 🍓 yavaşlama, 🍊 genişleme…'},
    {id:'t3_combo2',trigger:'combo', n:3,  text:'🔥🔥 x3! Combo serin arttıkça maymun mutlu, puanlar uçar. Son tutorial — artık hazırsın!'},
  ],
};
