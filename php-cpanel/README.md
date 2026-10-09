# KAPTAS Car Rental - PHP/cPanel Surumu

Bu klasor, Node.js gerektirmeyen PHP 8.2 + MySQL surumudur. Public web, hesap islemleri, admin paneli, arac ve gorsel yonetimi, stok/tarih uygunlugu, e-posta dogrulama, sifre yenileme ve iyzico Checkout Form akisi ayni uygulamadadir.

## Sunucu gereksinimleri

- Linux cPanel ve Apache `mod_rewrite`
- PHP 8.2 veya 8.3
- MySQL 8 veya MariaDB 10.6+
- PHP eklentileri: `pdo_mysql`, `curl`, `openssl`, `mbstring`, `fileinfo`, `simplexml`, `json`, `session`
- Gecerli SSL sertifikasi

PHP secimi cPanel > MultiPHP Manager bolumunden, PHP eklentileri Select PHP Version bolumunden yapilir. MultiPHP INI Editor icinde `upload_max_filesize=12M`, `post_max_size=14M`, `memory_limit=256M` ayarlanmalidir.

## cPanel kurulumu

1. `bin/build-deployment.ps1` ile olusan ZIP dosyasini cPanel ana dizinine yukleyin. ZIP, `public_html` klasoru ile onun disinda kalan guvenli uygulama klasorlerini birlikte icerir.
2. ZIP dosyasini `/home/HESAP_ADI/` dizininde acin. `public_html` icerigi mevcut web kokune birlesmelidir; `app`, `config`, `database`, `storage` ve `vendor` klasorleri web kokunun disinda kalmalidir.
3. cPanel > MySQL Databases bolumunde UTF-8 uyumlu bir veritabani ve kullanici olusturun. Kullaniciya tum veritabani yetkilerini verin.
4. phpMyAdmin icinde yeni veritabanini secip `database/install.sql` dosyasini bir kez ice aktarin. Bu dosya semayi ve mevcut yerel verileri birlikte tasir.
5. `config/config.example.php` dosyasini `config/config.php` olarak kopyalayin ve gercek sunucu bilgilerini girin.
6. `app.url` degerini SSL kullanan kesin alan adi olarak yazin. `app.secret` icin en az 32 baytlik rastgele bir deger kullanin.
7. `storage/cache`, `storage/logs` ve `public_html/uploads/vehicles` klasorlerinin PHP tarafindan yazilabilir oldugunu kontrol edin. Genellikle `755`, sunucu yapisina gore `775` yeterlidir.
8. cPanel Terminal varsa `php bin/system-check.php` calistirin. Yoksa `/api/health` adresinin `{"ok":true,"database":true}` dondurdugunu kontrol edin.
9. Kurulum tamamlaninca `/admin` adresinden mevcut ana yonetici hesabi ile giris yapin. Ana sayfadaki arac fiyatlarini USD/gun ve stok adetlerini admin panelinden kontrol edin.
10. cPanel > Cron Jobs bolumunde 30 dakikada bir `php /home/HESAP_ADI/bin/update-exchange-rates.php` komutunu calistirin. Public ekran son basarili kuru onbellekten hizli gosterir; odeme hesaplamasi ise guncel kur alinamazsa guvenlik geregi baslatilmaz.

## config.php alanlari

- `app.environment`: Canli sitede `production`.
- `app.url`: Ornek `https://kaptascarrental.com`.
- `app.secret`: Oturum ve dogrulama kodlari icin uzun, rastgele gizli anahtar.
- `database`: cPanel MySQL sunucu, port, veritabani, kullanici ve sifre bilgileri.
- `mail`: Gmail SMTP icin `smtp.gmail.com`, `587`, `tls`, hesap adresi ve Google uygulama sifresi.
- `payment`: iyzico canli API anahtari, gizli anahtar ve `https://api.iyzipay.com`.

Gizli `config/config.php` dosyasi Git'e veya destek mesajlarina eklenmemelidir.

## Odeme guvenligi

iyzico anahtarlari bosken online odeme butonu kapali kalir ve rezervasyon kesinlesmez. Anahtarlar tanimlandiginda:

1. Tarih, stok, tutar ve musteri bilgileri sunucuda dogrulanir.
2. Arac icin 30 dakikalik gecici stok tutma kaydi acilir.
3. Kart girisi iyzico Checkout Form ekraninda ve zorunlu 3D Secure ile yapilir.
4. Callback sonucu resmi SDK ile tekrar sorgulanir.
5. Iyzico HMAC imzasi, islem/sepet numarasi, para birimi, tutar, odeme durumu ve fraud sonucu dogrulanir.
6. Arac kapasitesi veritabani kilidiyle yeniden kontrol edilir.
7. Yalnizca tum kontroller basariliysa odeme `PAID`, rezervasyon `CONFIRMED` olur.

## E-posta

Gmail hesabi icin iki adimli dogrulama acik olmali ve normal hesap sifresi yerine 16 karakterli Google uygulama sifresi kullanilmalidir. E-posta yapilandirilmadan hesap e-posta degisikligi ve sifre yenileme kodu gonderilemez; sistem bu islemleri sessizce basarili gostermek yerine kapali olarak bildirir.

## Veritabani ve yedek

`database/install.sql` ozel veri tasir; kullanici hesaplari ve parola hashleri bulunur. Bu dosyayi herkese acik bir dizinde tutmayin. Canliya gecisten sonra cPanel yedegini etkinlestirin ve gunluk veritabani yedegi alin.

Yeni ve bos kurulumda terminal kullanilacaksa once `config/config.php` hazirlanir, sonra `php bin/migrate.php` calistirilir. Mevcut eski semayi korumak icin `php bin/migrate.php --adopt-existing` kullanilir.
