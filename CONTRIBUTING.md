# Katkıda bulunma

Teşekkürler! Bu küçük bir bağımsız oyun projesidir; PR ve issue’lar memnuniyetle karşılanır.

## Geliştirme ortamı

- Node.js **18+** veya **20+** önerilir
- `npm install` → `npm run dev`

## Kalite çubuğu

- `npm run build` hatasız tamamlanmalı
- Mümkünse değişiklikle ilgili davranışı tarayıcıda kısaca doğrulayın

## Pull request

1. Anlamlı bir branch adı kullanın (`fix/bonus-timer`, `feat/sound-toggle` vb.)
2. PR açıklamasında **ne değişti** ve **neden** kısaca yazın
3. Büyük refactor’ları küçük PR’lara bölmek tercih edilir

## Seviye verisi

`src/levels.js` içindeki `L` dizisi oyun dengesini doğrudan etkiler. Denge değişikliklerinde birkaç komşu seviyeyi de gözden geçirmek faydalıdır.
