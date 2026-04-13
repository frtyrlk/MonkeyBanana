# Grafik yaklaşımı — tek sayfalık özet  
**Proje:** Muz & Maymun (MonkeyBanana) · **Tarih:** Nisan 2026

## Mevcut durum

Oyun, **HTML Canvas 2D** üzerinde çalışıyor. Görsellerin büyük kısmı **dosya tabanlı asset (PNG/SVG) olmadan**, `fillRect`, `arc`, gradyan ve metin/emoji ile **kodla çiziliyor** (prosedürel çizim). Repoda oyun için ayrı görsel dosyası yok.

## Prosedürel çizim vs PNG / sprite

| Boyut | Kodla çizim: genelde hafif paket. | Asset: görsel sayısı arttıkça paket büyür. |
| **Stil** | Teknik tutarlılık kolay; “el çizimi” kalite ayrı iş. | Sanat yönü net, marka karakteri güçlenir. |
| **İterasyon** | Renk, layout, tema kodla hızlı. | Export + yerleştirme döngüsü gerekir. |
| **Animasyon** | Basit sallanma/titreme formülle kolay. | Karakter animasyonu için sprite veya kemik sistemi. |

**Öneri (hibrit):** Okunaklı karakter/kasa/ağaç için **sprite**; parçacık, bar, hafif efektler için **mevcut canvas** veya DOM ile devam.

## Sprite sheet

Birden fazla karenin **tek bir görsel dosyasında** (ör. `sprites.png`) birleştirilmesi. Her karede `drawImage` ile kaynak dikdörtgen (`sx, sy, sw, sh`) kesilip hedefe çizilir. **Tek yükleme**, daha az istek, animasyon senkronu pratik.

## Sinüs / kosinüs ile hareket

`Math.sin` / `Math.cos` periyodik dalga üretir. Oyunda tipik kullanım: nesnenin **y** veya **x** konumuna küçük bir ofset ekleyerek yumuşak sallanma (maymun, rüzgar çizgisi, deprem sallantısı). **Harici animasyon videosu yok**; her frame konum formülle güncellenir.

## Animasyon aracı kullanımı

Bu projede After Effects, Spine vb. **timeline tabanlı araç çıktısı** kullanılmıyor. Animasyonlar **`requestAnimationFrame`** oyun döngüsü ve çizim kodu ile üretiliyor.

## Sonuç

PNG/sprite’lı yapıya geçiş **teknik olarak engelsiz**; iş, canvas çizim katmanının kademeli olarak `Image` + `drawImage` (ve isteğe sprite atlas) ile değiştirilmesi. Retina (`devicePixelRatio`) ve dosya boyutu planlanmalıdır.
