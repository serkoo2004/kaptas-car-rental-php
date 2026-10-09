# VakifBank test kurulumu - 5 Ekim 2026

## Durum

Mevcut PHP/MySQL uygulamasina Standart API v1.3 kilavuzuna gore 3D Secure + 3DS metodlu provizyon + Search dogrulamasi eklendi. Canli tahsilat acilmadi. Bankanin gercek test API'sine enrollment istegi basarili; tarayicida challenge, callback, Sale ve Search zinciri henuz uctan uca denenmedi. Bu belge banka testinin tamamlandigi veya PCI uyumlulugunun onaylandigi anlamina gelmez.

## Dosyalar ve veri

- `app/Services/VakifBank.php`: sabit test/canli endpointler, TLS, 3D hash, Search dogrulamasi.
- `app/Services/RentalCheckout.php`: imzali 5 dakikalik fiyat, stok kilidi, tekil odeme denemesi, rezervasyon ve e-posta kuyrugunun birlikte kesinlesmesi.
- `app/Controllers/PaymentController.php`, `public_html/api/index.php`: quote/start/callback.
- `public_html/checkout/`: toplam fiyat, kart alanlari, banka formu, sonuc gorunumu.
- `bin/reconcile-vakifbank.php`: belirsiz tahsilatin bankadan tekrar sorgulanmasi.
- `bin/send-reservation-mails.php`: onay e-postasi gonderimi.
- `database/migrations/007_reservation_mail.sql` ve `008_vakifbank_payments.sql`: sadece yeni tablolar. Mevcut arac, musteri ve sifre verileri silinmez.

## cPanel'de sirayla

1. Dosyalarin ve DB'nin yedegini alin. Bu bir guncelleme paketidir; eski klasorleri topluca silmeyin. `config/config.php`, `uploads` ve mevcut DB korunur.
2. phpMyAdmin'de mevcut veritabanini secin. Once **007_reservation_mail.sql**, sonra **008_vakifbank_payments.sql** dosyasini aktarın. Bunlari tekrar aktarmak guvenlidir. Eski `install.sql` dosyasini veya tablo silme komutlarini kullanmayin.
3. Paketin `app`, `bin`, `database`, `public_html` klasorlerini `/home/kap1e2renonline` altindaki karsiliklariyla birlestirin. `public_html` icine ikinci bir `public_html` klasoru olusturmayin. Yalnizca ayni isimli guncelleme dosyalarinin uzerine yazin. `config.example.php` gercek konfigurasyon degildir.
4. `/home/kap1e2renonline/config/config.php` dosyasinda yalnizca `payment` bolumunu asagidaki test ayariyla degistirin. Diger bolumlere dokunmayin:

```php
'payment' => [
    'provider' => 'vakifbank',
    'vakifbank' => [
        'environment' => 'test',
        'live_enabled' => false,
        'merchant_id' => '',
        'terminal_no' => '',
        'password' => '',
    ],
],
```

Test modunda canli isyeri/sifre alanlari kullanilmaz; kilavuzdaki ortak banka test bilgileri kullanilir. `app.url` gercek HTTPS domaininiz olmali. Localhost'a banka donusu yapilmaz. Test odeme ekrani ve quote/start API'leri sadece ADMIN/SUPER_ADMIN oturumuna aciktir. Normal musterilere online odeme kapali gorunur.

5. Hostingin PHP 8.2+ yolunu teyit edin. `pdo_mysql`, `curl`, `openssl`, `mbstring`, `iconv`, `SimpleXML` bulunmali. Sunucudan bankanin 8443 ve 443 HTTPS portlarina erisim, guncel CA deposu gerekir. Sertifika dogrulamasini kapatmayin. Proxy/CDN varsa gercek musteri IP'si web sunucusunda dogru REMOTE_ADDR olacak sekilde yapilandirilmalidir; istemcinin gonderdigi X-Forwarded-For dogrudan guvenilir sayilmaz.
6. cPanel Cron Jobs'ta iki ayri gorev ekleyin; ikisi de her dakika (`* * * * *`). PHP yolu `/usr/local/bin/php` ise:

```text
/usr/local/bin/php /home/kap1e2renonline/bin/reconcile-vakifbank.php >> /home/kap1e2renonline/storage/logs/vakifbank-cron.log 2>&1
/usr/local/bin/php /home/kap1e2renonline/bin/send-reservation-mails.php >> /home/kap1e2renonline/storage/logs/reservation-mail-cron.log 2>&1
```

Loglar public_html disinda olmali, rotasyon ve basarisiz gorev uyarisi ayarlanmalidir. Request body, kart numarasi, sifre, PaReq/MD/CAVV ve callback tokenlarini web sunucusu/WAF/APM loglarinda kaydetmeyin. Banka callback yolu icin query string de maskelenmeli. Koruma mekanizmalarini tum site icin kapatmayin.

## Test sirasi

1. Yonetici olarak giris yapin, siteden bir arac secip kiralama adimina gecin. Sari test ortami uyarisi gorunmeli. Eski tarayici linkleri yerine yeni kiralama talebi olusturun.
2. Tarihleri secin; toplam, gunluk USD fiyat x gun x guncel kur ile sunucuda hesaplanir. Tahsilat su an yalnizca TRY'dir; site USD/EUR gorunumu aynen kalir. Fiyati yenilemek/onay suresinin dolmasi sozlesme kutularini sifirlar. Fiyat yoksa, kur bayatsa veya stok yoksa islem ilerlemez.
3. Kilavuz sayfa 4'teki test kartini kullanin. Ornek: `4938410109068353`, ay `12`, yil `2029`. Test 3D sifresi kilavuzda `123456`. Yalnizca bankanin test kartlari kabul edilir. Bu 3DS metodunda kilavuzun Enrollment/Sale istegi CVV istemez; uygulama da CVV toplamaz.
4. Banka 3D ekranini tamamlayin. Sonuc **Test odemesi dogrulandi** olmali. Bu, normal **Rezervasyon onaylandi** mesaji degildir. Test basarili olsa bile rezervasyon CANCELLED, PaymentIntent CANCELLED, banka denemesi TEST_PAID olur. Gercek gelir/rezervasyon/onay e-postasi olusmaz.
5. Red/iptal ve yanlis 3D sifresini deneyin. Kesin rezervasyon olusmamali. Aynı donusu yenileyin: ikinci Sale gonderilmemeli.
6. Banka donusu ve sorgusu, merchant/islem/siparis/tutar/para birimi/hash degerlerini dogrulamali. Belirsiz ag sonucu basarisizlik kabul edilip yeniden tahsil edilmez; REVIEW ile cron tarafindan Search yapilir. Yedi gunu asan belirsiz islemler ve REVIEW_STOCK kayitlari manuel incelenir. Stok doluysa onay e-postasi gitmez; gerekirse banka panelinden yetkili kisi iade yapar. Otomatik iade bu degisikligin kapsaminda degildir.
7. Gercek SMTP teslimi ve logosu ayrica kontrollu aliciyla dogrulanmalidir. Test modunun musteri onay maili uretmemesi kasitlidir. Yerel kuyruk testleri SMTP gondermez.

## Canliya gecis (simdi yapmayin)

Canli 3DS metodlu provizyon yetkisi, test callback/hash ve Search sonuclari, hosting loglari/erisim kontrolleri, SMTP/cron ve banka tarafindan gereken guvenlik kosullari teyit edilmelidir. Kart numarasi Enrollment icin uygulama belleginden gecer; DB, session, cache veya loglarda saklanmaz. Kart verisini saklamamak tek basina PCI uyumluluk onayi degildir.

Ancak bu kontrollerden sonra `environment=live`, gercek `merchant_id`, `terminal_no`, `password` ve `live_enabled=true` sunucudaki ozel config'e girilir. Gizli bilgileri sohbete, public_html'e, Git'e veya JS'ye koymayin. Acik PROCESSING/REVIEW denemeleri varken ortam veya isyeri bilgilerini degistirmeyin. Dovizle dogrudan tahsilat bu surumde acik degildir.

## Gelistirme kontrolleri

`php tests/vakifbank.php` ve `php tests/reservation-mail.php` sadece yerel ortamda gecici tablolari kullanir; gercek kayitlari degistirmez ve e-posta/tahsilat yapmaz. PHP eklentilerinin CLI icin de yuklenmesi gerekir.

`tests/vakifbank-sandbox.php --enrollment` opt-in banka baglanti kontroludur. `VAKIFBANK_ENVIRONMENT=test` ve `VAKIFBANK_TEST_RETURN_URL` HTTPS donus adresi gerekir. Yalnizca enrollment yapar, Sale cagirmaz. Gercek 3D challenge/callback testi yerine gecmez.

Ortam degiskeni tercih edilirse: PAYMENT_PROVIDER, VAKIFBANK_ENVIRONMENT, VAKIFBANK_LIVE_ENABLED, VAKIFBANK_MERCHANT_ID, VAKIFBANK_TERMINAL_NO, VAKIFBANK_PASSWORD. Mevcut SMTP ve APP_SECRET degismez.
