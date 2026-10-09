# TürkTicaret cPanel Deployment

Uygulama Linux cPanel, Node.js App ve MySQL/MariaDB üzerinde çalışacak şekilde hazırlanmıştır. Node.js 20 veya 22 seçilmelidir.

## 1. MySQL veritabanı

1. cPanel > MySQL Veritabanları ekranından bir veritabanı oluşturun.
2. Ayrı bir veritabanı kullanıcısı oluşturup yalnızca bu veritabanına tüm yetkileri verin.
3. cPanel'in gösterdiği tam veritabanı ve kullanıcı adlarını kullanın. Hesap ön eki genellikle zorunludur.
4. Paroladaki özel karakterleri `DATABASE_URL` içinde URL encode edin.

Bağlantı biçimi:

```text
mysql://CPANEL_USER:URL_ENCODED_PASSWORD@localhost:3306/CPANEL_DATABASE?connection_limit=5&pool_timeout=10
```

## 2. Dosyalar

Proje kökünü hosting hesabına yükleyin. `.env.local`, `node_modules`, `.next` ve `storage/database-backups` yüklenmemelidir. `storage/vehicle-images` dizini kalıcı ve Node.js uygulaması tarafından yazılabilir olmalıdır.

## 3. Node.js App

cPanel > Setup Node.js App ekranında:

- Node.js sürümü: 20 veya 22
- Application mode: Production
- Application root: proje dizini
- Application URL: alan adı
- Startup file: `server.js`

## 4. Ortam değişkenleri

Node.js App ekranına `.env.example` içindeki değişkenleri ekleyin. Production için özellikle aşağıdakiler gerçek değerler olmalıdır:

```text
NODE_ENV=production
DATABASE_URL=mysql://...
NEXTAUTH_URL=https://alanadiniz.com
NEXTAUTH_SECRET=uzun-rastgele-deger
APP_URL=https://alanadiniz.com
APP_ENV=production
VEHICLE_IMAGE_STORAGE_DIR=/home/CPANEL_USER/PROJE/storage/vehicle-images
IYZICO_BASE_URL=https://api.iyzipay.com
```

iyzico ve SMTP anahtarları yalnızca cPanel ortam değişkenlerinde tutulmalıdır.

## 5. Kurulum komutları

cPanel terminalinde proje kökünde çalıştırın:

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
```

İlk canlı kurulumda örnek seed çalıştırılmaz. Mevcut veriler taşınacaksa yerelde üretilmiş özel yedek dosyası güvenli biçimde sunucuya aktarılıp aşağıdaki komutla bir kez yüklenir:

```bash
ALLOW_DATABASE_RESTORE=true npm run db:restore -- /guvenli/yol/database-backup.json
```

Ardından Node.js App ekranından **Restart Application** seçilir.

## 6. Kontrol

```bash
curl --fail https://alanadiniz.com/
curl --fail https://alanadiniz.com/api/public/vehicles
curl --fail https://alanadiniz.com/api/public/locations
npm run db:backup
```

SSL cPanel AutoSSL üzerinden etkinleştirilmelidir. Veritabanı ve `storage/vehicle-images` dizini hosting yedekleme planına birlikte dahil edilmelidir.
