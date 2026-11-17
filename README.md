# DEPPER – Netlify + Shopify Storefront API

Bu klasör, DEPPER sitesinin yüklemeye hazır halidir. Shopify erişim token'ı **hiçbir dosyada yazılı değildir**. Token sadece Netlify'ın ortam değişkenlerinde (sunucu tarafında) durur. Tarayıcı Shopify ile doğrudan konuşmaz, `/api/storefront` adresindeki bir Netlify Function üzerinden konuşur.

## Klasör yapısı
- `public/` : Sitenin kendisi (index.html, styles.css, app.js, images/, _headers)
- `netlify/functions/storefront.js` : Token'ı saklayan ve Shopify'a istek atan sunucu fonksiyonu
- `netlify.toml` : Netlify ayarları
- `.env.example` : Gerekli ortam değişkenlerinin boş örneği

## 1) Shopify'da Storefront API erişimi
1. Shopify Admin > Settings > Apps and sales channels > Develop apps.
2. Create an app (ör. "DEPPER Website") > Configure Storefront API scopes.
3. Şu izinleri aç (arayüzde isimler küçük farklılık gösterebilir):
   - unauthenticated_read_product_listings
   - unauthenticated_read_product_inventory
   - unauthenticated_read_checkouts
   - unauthenticated_write_checkouts
4. Install app'e bas, **Storefront API access token**'ı kopyala.
5. Ürünlerinin aktif ve Online Store satış kanalında yayında olduğundan emin ol.

**Asla Admin API token'ı kullanma.** Bu sitenin Admin yetkisine ihtiyacı yok.

## 2) Netlify'a yükleme (önerilen: GitHub ile)
1. Bu klasörü bir GitHub deposuna yükle (`.env` dosyası yüklenmesin, `.gitignore` bunu engeller).
2. Netlify > Add new site > Import an existing project > GitHub deposunu seç.
3. Build ayarları otomatik gelir (`netlify.toml`). Build command boş, publish directory `public`.
4. Deploy etmeden önce (ya da sonra) **Site configuration > Environment variables** bölümüne ekle:
   - `SHOPIFY_STOREFRONT_TOKEN` = kopyaladığın Storefront token
   - (isteğe bağlı) `SHOPIFY_STORE_DOMAIN` = depper-store.myshopify.com
   - (isteğe bağlı) `SHOPIFY_API_VERSION` = 2026-10
5. Değişken ekledikten sonra **Deploys > Trigger deploy > Deploy site** ile yeniden yayınla. Ortam değişkenleri ancak yeni deploy'da geçerli olur.

Alternatif: Netlify CLI ile (`npm i -g netlify-cli`, sonra `netlify login`, `netlify init`, `netlify deploy --prod`). Sürükle-bırak yöntemi fonksiyonları çalıştırmayabilir, o yüzden önermiyoruz.

## 3) Test listesi
- Ana sayfa açılıyor, "The collection" bölümünde Shopify ürünleri fotoğraf ve fiyatla görünüyor.
- Ürün seçenekleri değişiyor, "Add to cart" sepeti açıyor.
- Sepette adet artırma/azaltma ve Remove çalışıyor.
- "Checkout" ve "Buy now" Shopify ödeme sayfasını açıyor.
- Test siparişi Shopify Admin > Orders içinde görünüyor.

## 4) Sorun giderme
- "The store connection isn't configured yet": `SHOPIFY_STOREFRONT_TOKEN` eklenmemiş ya da ekledikten sonra yeniden deploy edilmemiş.
- "Shopify rejected the access token": Token yanlış ya da izinler eksik.
- "No products yet": Ürünler aktif/yayında değil ya da bu app'in kanalında görünmüyor.
- Sayfa sessizce boş: Netlify > Logs > Functions bölümünden `storefront` fonksiyonunun kayıtlarına bak.

## 5) Yerel test
`npm i -g netlify-cli`, `.env.example` dosyasını `.env` olarak kopyala, token'ı yaz, `netlify dev` çalıştır. `.env` dosyasını asla paylaşma.

## 6) İçerik düzenleme
SSS metinleri `public/app.js` içindeki `CONTENT.faq` bölümünde. Sosyal medya linkleri için `CONTENT.social` hazır. Alt kısımdaki "© DEPPER..." satırını `public/index.html` içinde kendi metninle değiştir.
