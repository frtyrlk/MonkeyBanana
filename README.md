# 🐒 Muz & Maymun (Muza Ulaş!)

Mobil uyumlu, tarayıcıda çalışan **kasa istifleme** ve **bonus toplama** oyunu. 100 seviye, PWA desteği, yerel kayıt (ilerleme, coin, ayarlar).

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/ci.yml)

> **Not:** İlk push’tan sonra `YOUR_USERNAME` ve `YOUR_REPO_NAME` değerlerini kendi GitHub yolunla değiştir; rozet yeşile döner.

## Özellikler

- **İki mod:** Kule modu (kayar kasaları zamanla bırak) ve bonus modu (muz/star topla, süre sınırı).
- **100 seviye** — kademeli zorluk; rüzgar, buz, bomba, arı, gece, deprem, sis, mıknatıs vb. mekanikler.
- **Can sistemi** — stack seviyelerinde can; bonuslarda sadece süre.
- **Ödül & dükkan** — milestone bazlı sandık ödülleri, coin ile güçlendirici satın alma.
- **PWA** — `manifest` + mobil meta; ana ekrana eklenebilir.
- **Developer mode** — tüm seviyeleri kilitsiz açma (yerel ayar).

## Teknolojiler

| Katman | Araç |
|--------|------|
| UI | React 18 |
| Derleme | Vite 6 |
| Stil | Tailwind CSS 3 |
| Ses | Web Audio API (`src/sfx.js`) |
| Çizim | Canvas 2D (`src/Game.jsx`) |

## Hızlı başlangıç

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` açın. Ağdaki telefondan denemek için:

```bash
npx vite --host
```

Çıkan **Network** URL’sini telefonda açın (aynı Wi‑Fi).

## Komutlar

| Komut | Açıklama |
|--------|-----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi → `dist/` |
| `npm run preview` | `dist/` önizleme |

## Proje yapısı

```
src/
  Game.jsx      # Ana oyun döngüsü, UI, durum
  levels.js     # 100 seviye tanımları + can formülü
  mechanics.js  # Kasa spawn, parçacık
  rewards.js    # Coin, ödül, dükkan, envanter (localStorage)
  sfx.js        # Ses efektleri
  constants.js  # NF/PF meyveler, paletler
public/
  manifest.webmanifest
```

## Katkı

[Katkı rehberi](CONTRIBUTING.md) ve [davranış kuralları](CODE_OF_CONDUCT.md) dosyalarına bakın.

## Güvenlik

Güvenlik açığı bildirimi için [SECURITY.md](SECURITY.md).

## Lisans

Bu proje [MIT Lisansı](LICENSE) altındadır.

---

**Oyun adı:** Muza Ulaş! · **Paket adı:** `monkey-banana`
