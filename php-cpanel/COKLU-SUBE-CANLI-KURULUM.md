# Çoklu Şube Güncellemesi

Bu güncelleme, admin panelinden birden fazla teslim ve iade noktası yönetilmesini sağlar.

## Uygulama sırası

1. phpMyAdmin içinde canlı KAPTAŞ veritabanını seçin.
2. `database/migrations/002_branch_location_multilingual.sql` dosyasını bir kez içe aktarın.
3. cPanel File Manager ile güncelleme paketindeki `app` ve `public_html` klasörlerini mevcut dizinlerin üzerine yükleyin.
4. `/api/health` adresinde `{"ok":true,"database":true}` yanıtını kontrol edin.
5. `/admin` sayfasına girip **Şube ve Lokasyon** bölümünü açın.
6. Mevcut şubeyi düzenleyin veya **Yeni şube** ile ikinci lokasyonu ekleyin.
7. Ana sayfayı gizli sekmede açıp **Alış ve İade Noktası** alanında bütün aktif şubelerin göründüğünü doğrulayın.

## Yönetim kuralları

- Sadece aktif şubeler ana sayfada gösterilir.
- `Yayın sırası` küçük olan şube listede önce görünür.
- Son aktif şube pasife alınamaz; backend bu işlemi engeller.
- Şube adları aynı olamaz.
- İngilizce veya Arapça alan boş bırakılırsa Türkçe metin kullanılır.
- Seçilen şube kimliği araç listesine, kiralama talebine ve ödeme ekranına taşınır.

## Önemli

`002_branch_location_multilingual.sql` dosyasını aynı veritabanında ikinci kez çalıştırmayın. Güncellemeden önce cPanel veya phpMyAdmin üzerinden güncel veritabanı yedeği alın.
