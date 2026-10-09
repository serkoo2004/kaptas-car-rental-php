# Rezervasyon onay e-postasi

Bu degisiklik banka entegrasyonu degildir. VakifBank baglantisi ve banka testleri tamamlanana kadar kart odemeleri kapali kalir.

## Calisma sekli

- CLI gorevi, veritabaninda hem `PaymentIntent.status = PAID` hem `Reservation.status = CONFIRMED` olan yeni rezervasyonlari bulur. Banka entegrasyonu bu durumlari ancak sunucuda dogrulanmis tahsilat ve stok kontrolunden sonra ayni transaction icinde yazmalidir. Tarayici sonuc URL'si bir onay kaynagi degildir.
- E-posta, rezervasyondaki musteri adresine gider. Arac, rezervasyon numarasi, alis/iade tarih-saat ve noktalar, gun sayisi, tahsil edilen toplam ve para birimi bulunur. Logo MIME eki olarak gonderilir; localhost gorseline bagli degildir.
- Giris yapmis musterinin rezervasyonu mevcut `userId` iliskisiyle Kiraladiklarim'da gorunur. Misafir islemleri rastgele e-posta eslestirmesiyle hesaba baglanmaz; misafire hesap gecmisi sozu verilmez.
- Snapshot kuyruga ilk alinirken sabitlenir. Yeniden denemeler sonradan degisen arac/fiyat verisini kullanmaz. Banka baglantisinda odeme anina ait detaylarin da sabitlenmesi gerekir.
- Kuyruk tarayici ziyaretine bagli degildir; cron her dakika calisir. SMTP sorunu odemeyi/rezervasyonu geri almaz. Bes deneme sonrasi `FAILED` olur. `SENT`, SMTP sunucusunun mesaji kabul ettigini belirtir; gelen kutusuna teslim garantisi degildir.
- Normal tekrar calistirma ve eszamanli cron tek gonderim yapar. SMTP kabulunden hemen sonra surec/veritabani cokerse yeniden denemede kopya mesaj olabilir. Sabit Message-ID kullanilir fakat standart SMTP ile tam exactly-once teslim garantisi verilemez.
- Kurulumdan onceki kayitlar varsayilan olarak gonderilmez. Eski bir rezervasyon daha sonra yeniden onaylanir/guncellenirse yeni bildirim icin uygun olabilir.
- Bildirim dili mevcut PHP e-postalarindaki gibi Turkcedir. Hesap ekranindaki sure alani TR/EN/AR cevrilidir.

## Canliya kurulum

1. Veritabaninin ve degisecek dosyalarin yedegini alin. `config/config.php` dosyasini degistirmeyin; mevcut SMTP bilgileri kullanilir.
2. `database/migrations/007_reservation_mail.sql` dosyasini phpMyAdmin'de mevcut veritabanina bir kez aktarın. Tablolari silmeyin, eski `install.sql` dosyasini yeniden yuklemeyin. Bu migration sadece iki yeni tablo ekler; sifreleri ve rezervasyonlari degistirmez. Tekrar aktarimi guvenlidir.
3. Degisen `app` dosyalarini, `public_html/checkout` dosyalarini, guncel frontend derlemesini ve `bin/send-reservation-mails.php` dosyasini yukleyin. `app`, `bin`, `config` ve `database` her zamanki gibi `public_html` disinda kalmalidir. `public_html/assets/email-logo.png` bulunmalidir.
4. cPanel Cron Jobs'ta dakika/saat/gun/ay/haftanin gunu alanlarini `*` yapin. Sunucunun PHP CLI yolunu hostingden teyit edin. PHP yolu `/usr/local/bin/php` ise komut:

   `/usr/local/bin/php /home/kap1e2renonline/bin/send-reservation-mails.php >> /home/kap1e2renonline/storage/logs/reservation-mail-cron.log 2>&1`

5. CLI PHP'de `pdo_mysql` ve SMTP icin `openssl` acik olmali. Veritabani `GET_LOCK` destegi gereklidir. SMTP ve log klasoru mevcut ayarlariyla kullanilir; yeni sir/ortam degiskeni yoktur. Loglar icin boyut/rotasyon ve basarisiz cron uyarisi ayarlayin.
6. Durum: `php bin/send-reservation-mails.php --status`. phpMyAdmin'de inceleme: `SELECT reservationId, status, attempts, lastError, sentAt FROM PhpReservationMail ORDER BY createdAt DESC;`. Snapshot ve recipient kisisel veridir; public API ile acilmaz, erisim ve saklama suresi veri politikaniza gore sinirlanmalidir.
7. SMTP sorununu giderdikten sonra yalnizca ilgili `FAILED` / `DELIVERY_FAILED` kaydini, rezervasyon numarasini dogrulayarak, `PENDING`, `attempts=0`, `nextAttemptAt=NOW(3)` yapabilirsiniz. `SENT` kaydini sifirlamayin. `INVALID_RECEIPT` icin once kaynak veriyi inceleyin.

## Test ve yayina gecis siniri

Yerel: `php tests/reservation-mail.php`. Baglantiya ozel TEMPORARY tablolar kullanir; mevcut tablolari/rezervasyonlari degistirmez, gercek e-posta gondermez. Production veya uzak DB'de calismayi reddeder. CREATE TEMPORARY TABLES yetkisi gerekir; gerekirse TEST_DB_ADMIN_USER ve TEST_DB_ADMIN_PASSWORD ortam degiskenleri kullanilir. Test tabloları baglanti kapandiginda kendiliginden silinir.

Canli banka acilmadan once VakifBank test odemesi, red/iptal, yinelenen banka bildirimi, stok dolmasi, tarayicinin kapatilmasi, hesap gecmisi, SMTP kesintisi/yeniden deneme ve gercek test aliciya logo/detay teslimi birlikte kontrol edilmelidir. Mevcut servis `PAID` kaydinin gercek banka cevabiyla dogrulandigini varsayar; bu gorev banka cevabini kendisi dogrulamaz.
