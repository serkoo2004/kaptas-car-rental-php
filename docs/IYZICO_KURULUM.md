# iyzico 3D Secure Kurulumu

## 1. Sandbox ile doğrulama

iyzico sandbox merchant panelinde API anahtarlarını açın. `API Key` ve
`Secret Key` değerlerini yalnızca `.env.local` dosyasına yazın:

```env
IYZICO_API_KEY="sandbox-api-key"
IYZICO_SECRET_KEY="sandbox-secret-key"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"
APP_URL="http://localhost:3000"
```

`.env.local` kaynak kontrolüne eklenmez ve anahtarlar tarayıcıya gönderilmez.
Değişkenler eklendikten sonra Next.js sunucusunu yeniden başlatın.

Sandbox test kartlarını iyzico'nun güncel test kartları sayfasından kullanın.
Gerçek kartı sandbox ortamında kullanmayın.

## 2. Çalışan ödeme akışı

1. Kullanıcı araç ile alış ve bırakış tarihlerini seçer.
2. Sistem stok kapasitesini kontrol eder ve 15 dakikalık geçici blokaj koyar.
3. Günlük fiyat ve ücretlendirilecek gün sayısı sunucuda tekrar hesaplanır.
4. Kart bilgileri saklanmadan iyzico 3D Secure başlatma servisine gönderilir.
5. Banka doğrulamasından sonra iyzico callback rotasına POST gönderir.
6. Backend 3DS v2 ödeme sonucunu ve HMAC imzasını doğrular.
7. Yalnızca doğrulanan ödeme `PAID`, rezervasyon `CONFIRMED` olur.
8. Başarısız ödeme `FAILED`, geçici rezervasyon `CANCELLED` olur.

Callback adresi uygulama tarafından otomatik oluşturulur:

```text
{APP_URL}/api/payments/iyzico/3ds-callback
```

## 3. Canlı ortama geçiş

Sunucudaki gizli ortam değişkenlerini canlı merchant anahtarlarıyla değiştirin:

```env
IYZICO_API_KEY="live-api-key"
IYZICO_SECRET_KEY="live-secret-key"
IYZICO_BASE_URL="https://api.iyzipay.com"
APP_URL="https://alanadiniz.com"
APP_ENV="production"
```

Canlı ortamda `APP_URL` geçerli bir HTTPS alan adı olmalıdır. Anahtar değişiminden
sonra uygulamayı yeniden başlatın ve önce düşük tutarlı gerçek bir işlemle ödeme,
başarısız ödeme ve iptal operasyonlarını kontrol edin.

## 4. Yönetim takibi

`/admin/rezervasyonlar` ekranı rezervasyon durumunu, tahsil edilen tutarı,
ödeme durumunu, sağlayıcıyı ve iyzico ödeme referansını birlikte gösterir.
Kart numarası, CVC ve son kullanma tarihi hiçbir aşamada veritabanına yazılmaz.
