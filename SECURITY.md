# Güvenlik politikası

## Desteklenen sürümler

Bu proje tek bir aktif dal (`main`) üzerinden geliştirilir. Üretim dağıtımı genelde `npm run build` çıktısıdır.

## Güvenlik açığı bildirimi

Lütfen **hassas bilgileri** (token, şifre, kişisel veri) issue veya public tartışmalarda paylaşmayın.

- GitHub **Security** sekmesinden [güvenlik danışmanlığı açmayı](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities) tercih edin; veya
- Repo sahibine özel kanaldan ulaşın.

Beklenti: makul süre içinde ilk yanıt; ciddiyete göre düzeltme veya açıklama.

## İstemci tarafı oyun

Oyun mantığı tarayıcıda çalışır; `localStorage` yalnızca yerel ilerleme / coin / ayar içindir — sunucu tarafı oturum yoktur.
