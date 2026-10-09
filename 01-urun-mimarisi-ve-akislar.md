# Filo Kiralama ve Filo Yonetimi Platformu

Bu dokuman, `yapilacak budur.txt` dosyasindaki urun hedeflerini temel alan ilk mimari taslaktir. Amac, kod yazimina gecmeden once urunun ana omurgasini, sayfa yapilarini, veritabani modelini, admin panel akislarini ve mobil uygulama ekranlarini birlikte netlestirmektir.

Bu surum nihai karar degildir. Eksikler, kapsam fazlari ve oncelikler bu dosya uzerinden birlikte incelenmelidir.

## 1. Urun Vizyonu

Platform, Turkiye'de aktif kullanilabilecek premium bir filo kiralama ve filo yonetimi urunu olarak kurgulanir. Sadece tanitim sitesi degil, satis, teklif, musteri paneli, operasyon, mobil uygulama ve admin yonetimi olan tam bir dijital urundur.

Ana hedefler:

- Sirketlerin arac ihtiyacini daha hizli ve guvenilir sekilde teklif akisine tasimak.
- Filo kiralama, operasyonel kiralama ve filo yonetimi hizmetlerini tek merkezden sunmak.
- Kullanici, satis ekibi ve operasyon ekibinin ayni veri uzerinden calismasini saglamak.
- Mobil uygulamayi web sitesinin kopyasi degil, gunluk operasyon araci olarak konumlandirmak.
- Tasarim, metin ve akis dilinde gercek bir kurumsal filo sirketi hissi vermek.

## 2. Platform Yuzeyleri

### 2.1 Web Sitesi ve Satis Platformu

Web sitesi, potansiyel musterinin markayi tanidigi, araclari inceledigi, maliyet hesapladigi, teklif aldigi ve kullanici paneline girdigi ana yuzeydir.

Temel islevler:

- Arac listeleme ve filtreleme
- Arac detay inceleme
- Teklif talebi olusturma
- Satin alma vs kiralama maliyet karsilastirmasi
- Hizmet sayfalari
- SEO blog ve rehber sistemi
- Kullanici hesabi
- Basvuru ve teklif durum takibi
- Aktif filo musterileri icin operasyon talepleri

### 2.2 Admin Panel

Admin panel, web sitesini, mobil uygulamayi, teklif surecini, musterileri, operasyonu ve icerikleri yoneten merkezi kontrol sistemidir.

Temel islevler:

- Lead ve basvuru yonetimi
- Teklif hazirlama ve durum takibi
- Arac, marka, model, paket ve stok yonetimi
- Kullanici, firma, surucu ve rol yonetimi
- Mobil uygulama icerik yonetimi
- Push notification paneli
- Teslim, iade, bakim, hasar ve lastik surecleri
- Destek talepleri ve mesajlasma
- Audit log ve sistem ayarlari

### 2.3 Mobil Uygulama

Mobil uygulama; musteri, kurumsal yetkili, surucu, satis temsilcisi ve operasyon personeli icin rol bazli calisan is uygulamasidir.

Temel islevler:

- Giris ve hesap yonetimi
- Rol bazli dashboard
- Arac inceleme ve teklif talebi
- Basvuru ve teklif takibi
- Bildirimler ve mesajlasma
- Belgeler
- Aktif filo musterileri icin arac, bakim, hasar, lastik ve sozlesme takibi
- Operasyon personeli icin teslim ve iade surecleri

## 3. Kullanici Rolleri

Roller ilk fazdan itibaren net tasarlanmalidir. Yetki sistemi daha sonra eklenirse admin ve mobil kapsamda teknik borc olusturur.

Ana roller:

- `USER`: Bireysel veya genel kullanici
- `CORPORATE_USER`: Firma yetkilisi
- `DRIVER`: Kurumsal musterinin surucusu
- `SALES_REP`: Satis temsilcisi
- `OPERATIONS_STAFF`: Operasyon personeli
- `ADMIN`: Yonetici
- `SUPER_ADMIN`: Sistem sahibi

Rol bazli temel farklar:

- Bireysel kullanici arac inceler, teklif ister, basvuru durumunu takip eder.
- Kurumsal kullanici firma bilgilerini, teklifleri, belgeleri ve aktif filo sureclerini gorur.
- Surucu kendi aracini, bakim/hasar taleplerini ve belgelerini gorur.
- Satis temsilcisi lead, teklif ve musteri notlarini yonetir.
- Operasyon personeli teslim, iade, kontrol listesi ve saha sureclerini yonetir.
- Admin tum modulleri yonetir.
- Super admin sistem ayarlari, roller, yetkiler ve kritik konfigurasyonlari yonetir.

## 4. Web Sayfa Mimarisi

### 4.1 Public Web

#### Ana Sayfa

Amac: Guven vermek, arac arama ve teklif akisini hizli baslatmak.

Bolumler:

- Hero: net deger onerisi, 3 CTA
- Arac arama kutusu
- Guven rozetleri
- Populer araclar
- Satin alma vs kiralama hesaplayici girisi
- Surec anlatimi
- Hizmet gruplari
- Kurumsal referans alani
- SSS
- Blog/rehber onerileri

Hero metin tonu:

- Abartisiz, kurumsal, dogrudan.
- "Sirket filonuzu daha az operasyonla, daha net maliyetle yonetin."
- "Arac, sure ve kilometre ihtiyaciniza gore teklif alin; bakim, sigorta, lastik ve hasar sureclerini tek merkezden takip edin."

#### Araclar Sayfasi

Amac: Kullaniciya hizli, filtrelenebilir ve guvenilir arac kesfi sunmak.

Filtreler:

- Marka
- Model
- Segment
- Yakit tipi
- Elektrikli / hibrit / benzin / dizel
- Vites
- Kasa tipi
- Aylik fiyat araligi
- Kilometre paketi
- Sozlesme suresi
- Stok / teslimat durumu

Siralama:

- Onerilen
- En dusuk fiyat
- En yeni
- Elektrikli araclar
- Ticari araclar

Kart bilgileri:

- Gorsel
- Marka / model
- Aylik tahmini odeme
- Sure
- Kilometre paketi
- Yakit
- Vites
- Teslimat durumu
- Teklif al
- Karsilastir
- Favoriye ekle

Durumlar:

- Skeleton loading
- Bos sonuc
- Hata ekrani
- Filtre temizleme

#### Arac Detay Sayfasi

Amac: Kullaniciya araci ve kiralama paketlerini guvenle degerlendirme imkani vermek.

Bolumler:

- Galeri
- Arac ozeti
- Teknik ozellikler
- Paket secimi: 12 / 24 / 36 / 48 ay
- Kilometre secimi: 10.000 / 20.000 / 30.000 km
- Dahil hizmetler
- Ek hizmetler
- Dinamik teklif formu
- Benzer araclar
- SSS

#### Teklif Alma Akisi

Amac: Form terkini azaltarak nitelikli lead toplamak.

Adimlar:

1. Kullanici tipi: KOBI, kurumsal, sahis sirketi, bireysel
2. Arac ihtiyaci: marka, model, adet, sure, km
3. Firma bilgileri
4. Iletisim bilgileri
5. Ek hizmet secimleri
6. KVKK ve ticari ileti onaylari
7. Basvuru alindi ekrani

Basvuru sonrasi:

- Admin panelde lead olusur.
- Kullanici panelinde basvuru gorunur.
- Satis temsilcisi atamasi yapilir.
- Kullaniciya e-posta veya push bildirimi gonderilebilir.

#### Maliyet Hesaplayici

Amac: Kiralamanin operasyonel ve finansal avantajlarini sayisal olarak gostermek.

Girdiler:

- Arac bedeli
- Pesinat
- Kredi maliyeti
- MTV
- Sigorta
- Kasko
- Bakim
- Lastik
- Deger kaybi
- Operasyon zamani
- Kiralama aylik bedeli

Sonuc:

- Satin alma toplam maliyeti
- Kiralama toplam maliyeti
- Aylik ortalama maliyet
- Nakit akisi avantaji
- Operasyonel yuk farki
- Teklif CTA

#### Hizmet Sayfalari

Her hizmet sayfasi ayni sablonun kopyasi gibi durmamalidir. Her sayfa kendi ihtiyacina gore farkli kanit, CTA ve icerik onceligine sahip olmalidir.

Sayfalar:

- Uzun donem arac kiralama
- Operasyonel kiralama
- Filo yonetimi
- Elektrikli filo donusumu
- Ticari arac kiralama
- KOBI filo cozumleri
- Kurumsal filo cozumleri
- Bakim ve onarim yonetimi
- Hasar ve sigorta yonetimi
- Lastik yonetimi
- Yakit ve HGS yonetimi
- Telematik ve surus verisi

#### Blog ve SEO

Kategoriler:

- Filo kiralama rehberi
- Operasyonel kiralama
- Elektrikli araclar
- Vergi ve muhasebe
- Bakim, hasar ve lastik
- Sirket araclari

Blog detay icindeki yapilar:

- Okuma suresi
- Icendekiler
- Ilgili arac onerileri
- Teklif CTA
- FAQ schema

### 4.2 Auth Sayfalari

Sayfalar:

- Login
- Register
- Sifre sifirlama
- Email dogrulama
- Hesap guvenligi

Giris secenekleri:

- Email + sifre
- Google
- Apple

Kayit formunda:

- Sifre gucu gostergesi
- KVKK onayi
- Ticari ileti onayi
- Email dogrulama

### 4.3 Kullanici Paneli

Ana bolumler:

- Dashboard
- Basvurularim
- Tekliflerim
- Favori araclar
- Karsilastirmalar
- Belgelerim
- Profil
- Firma bilgileri
- Bildirimler

Aktif filo musterisi icin ek bolumler:

- Araclarim
- Bakim talepleri
- Hasar bildirimi
- Lastik degisimleri
- Ceza / HGS
- Sozlesmeler
- Faturalar

## 5. Admin Panel Mimarisi

### 5.1 Dashboard

Dashboard operasyon ekibi icin gunluk is listesi gibi calismalidir.

Kartlar:

- Yeni basvurular
- Bekleyen teklifler
- Eksik evraklar
- Bugunku teslimatlar
- Bugunku iadeler
- Acik destek talepleri
- Zamanlanmis bildirimler
- Kritik sistem uyarilari

### 5.2 Lead ve Basvuru Yonetimi

Akis:

1. Yeni basvuru gelir.
2. Kaynak, kullanici tipi ve arac ihtiyacina gore oncelik belirlenir.
3. Satis temsilcisi atanir.
4. Eksik bilgiler kontrol edilir.
5. Teklif hazirlanir.
6. Kullaniciya teklif gonderilir.
7. Durum takip edilir.

Durumlar:

- Alindi
- Inceleniyor
- Evrak bekleniyor
- Teklif hazirlaniyor
- Teklif gonderildi
- Revize bekliyor
- Onaylandi
- Reddedildi
- Sozlesme asamasi
- Teslimat planlandi
- Tamamlandi

### 5.3 Arac Yonetimi

Yonetilecek alanlar:

- Marka
- Model
- Arac
- Gorseller
- Teknik ozellikler
- Paketler
- Dahil hizmetler
- Ek hizmetler
- Stok durumu
- Teslimat suresi
- Webde yayinla
- Mobilde yayinla
- One cikar

### 5.4 Kullanici ve Firma Yonetimi

Yonetilecek kullanicilar:

- Web kullanicilari
- Mobil kullanicilar
- Kurumsal kullanicilar
- Suruculer
- Operasyon personeli
- Satis temsilcileri
- Adminler

Gorulecek bilgiler:

- Hesap durumu
- Roller
- Firma baglantisi
- Son giris tarihi
- Son giris cihazi
- Giris yapilan cihazlar
- Basvuru gecmisi
- Teklif gecmisi
- Mobilde inceledigi araclar
- Yari birakilan formlar
- Acilan bildirimler

### 5.5 Mobil Uygulama Yonetimi

Yonetilecek alanlar:

- Mobil ana sayfa bannerlari
- Kampanya kartlari
- Duyurular
- Popup bildirimleri
- Uygulama ici mesajlar
- Mobil menu siralamasi
- One cikan araclar
- One cikan hizmetler
- Bakim modu
- Zorunlu guncelleme
- Minimum uygulama versiyonu
- App Store linki
- Google Play linki
- Surum notlari

### 5.6 Push Notification Paneli

Hedefleme:

- Tum kullanicilar
- Kurumsal musteriler
- Suruculer
- Belirli firma
- Belirli kullanici
- Teklif bekleyenler
- Eksik belgesi olanlar
- Bakim tarihi yaklasanlar
- iOS kullanicilari
- Android kullanicilari

Bildirim tipleri:

- Teklif hazirlandi
- Evrak eksik
- Yeni kampanya
- Teslimat planlandi
- Bakim zamani geldi
- Lastik degisim zamani
- Sigorta yenileme
- Muayene hatirlatma
- Genel duyuru

Form alanlari:

- Baslik
- Mesaj
- Gorsel
- Hedef kitle
- Gonderim zamani
- Hemen gonder / zamanla
- Tiklaninca acilacak ekran
- Istatistikler

### 5.7 Teslim ve Iade Yonetimi

Akis:

1. Teslim veya iade gorevi olusturulur.
2. Operasyon personeli atanir.
3. Mobil uygulamada gorev gorunur.
4. Kontrol listesi tamamlanir.
5. Foto, imza, GPS, km ve yakit bilgisi alinir.
6. PDF tutanak olusur.
7. Arac durum gecmisi guncellenir.

Yonetilecek veriler:

- Gunluk teslimatlar
- Gunluk iadeler
- Personel atama
- Form sablonlari
- Hasar kontrol listesi
- Fotograf zorunluluklari
- Imza zorunlulugu
- GPS zorunlulugu
- Kilometre
- Yakit seviyesi
- Teslim tutanagi PDF
- Iade tutanagi PDF

### 5.8 Destek ve Talep Merkezi

Talep turleri:

- Bakim talebi
- Hasar bildirimi
- Evrak talebi
- Fatura talebi
- Teslimat talebi
- Teknik destek
- Genel destek

Panel alanlari:

- Talep listesi
- Oncelik
- Atanan personel
- Durum
- Mesaj gecmisi
- Dosya ekleri
- Cozum suresi
- SLA takibi

### 5.9 Sistem Ayarlari

Ayarlar:

- Site bakim modu
- Mobil bakim modu
- Teklif alma acik / kapali
- Yeni kayit acik / kapali
- Google login acik / kapali
- Apple login acik / kapali
- Email login acik / kapali
- Dosya yukleme limitleri
- Destek saatleri
- Iletisim bilgileri
- WhatsApp numarasi
- Mail sablonlari
- SMS sablonlari
- Push sablonlari

## 6. Mobil Uygulama Ekran Mimarisi

Mobil uygulama Flutter ile tek kod tabani olarak tasarlanmalidir. Rol bazli navigasyon, offline onbellek, push notification ve dark mode ilk mimaride dusunulmelidir.

### 6.1 Ortak Ekranlar

- Splash
- Onboarding
- Login
- Register
- Sifre sifirlama
- Email dogrulama
- Ana dashboard
- Araclar
- Arac detay
- Teklif iste
- Basvurularim
- Tekliflerim
- Bildirimler
- Mesajlar
- Belgeler
- Profil
- Firma bilgileri
- Bildirim ayarlari
- KVKK tercihleri
- Cihazlar ve guvenlik

### 6.2 Kurumsal Musteri Ekranlari

- Araclarim
- Arac detayim
- Surucu bilgileri
- Sozlesmeler
- Yaklasan islemler
- Bakim yonetimi
- Gecmis bakimlar
- Hasar bildirimi
- Hasar surec takibi
- Lastik yonetimi
- Belgeler
- Faturalar
- Teslim tutanaklari

### 6.3 Surucu Ekranlari

- Atanan arac
- Arac belgeleri
- Bakim talebi
- Hasar bildirimi
- Fotograf yukleme
- Servis surec takibi
- Bildirimler
- Destek talebi

### 6.4 Operasyon Personeli Ekranlari

- Gunluk gorevler
- Gunluk teslimatlar
- Gunluk iadeler
- Teslim detay
- Iade detay
- Arac kontrol listesi
- Hasar kontrolu
- Fotograf cekimi
- Imza alma
- GPS konumu
- Kilometre bilgisi
- Yakit seviyesi
- PDF tutanak onizleme
- Gorev tamamlama

### 6.5 Satis Temsilcisi Ekranlari

- Atanan leadler
- Basvuru detayi
- Musteri gecmisi
- Teklif durumu
- Notlar
- Hatirlaticilar
- Mesajlasma

## 7. Veritabani Taslagi

Bu bolum Prisma schema yazimina gecmeden once model sinirlarini netlestirir.

### 7.1 Auth ve Kullanici

- `User`: temel kullanici bilgileri, rol, durum, firma baglantisi
- `Account`: OAuth hesaplari
- `Session`: aktif oturumlar
- `VerificationToken`: email dogrulama ve sifre sifirlama tokenlari
- `DeviceSession`: kullanicinin cihaz girisleri
- `ConsentRecord`: KVKK ve ticari ileti onay kayitlari
- `RolePermission`: rol bazli yetki matrisleri
- `AuditLog`: kritik islemlerin kaydi

### 7.2 Firma ve Organizasyon

- `Company`: firma bilgileri, vergi bilgileri, sektor, yetkili kisi
- `CompanyUser`: firmaya bagli kullanicilar ve rolleri
- `Driver`: surucu kayitlari

### 7.3 Arac ve Paket

- `VehicleBrand`
- `VehicleModel`
- `Vehicle`
- `VehicleImage`
- `VehiclePackage`
- `VehicleFeature`
- `VehicleServiceOption`
- `FavoriteVehicle`
- `CompareList`
- `CompareListItem`

### 7.4 Teklif ve Lead

- `QuoteRequest`
- `QuoteRequestItem`
- `LeadAssignment`
- `AdminNote`
- `QuoteOffer`
- `QuoteOfferItem`
- `QuoteStatusHistory`

### 7.5 Filo Operasyonu

- `FleetVehicle`
- `Contract`
- `MaintenanceRequest`
- `DamageReport`
- `TireOperation`
- `TrafficFine`
- `HgsRecord`
- `InspectionRecord`
- `InsurancePolicy`

### 7.6 Teslim ve Iade

- `DeliveryTask`
- `DeliveryChecklist`
- `DeliveryChecklistItem`
- `DeliveryPhoto`
- `DeliverySignature`
- `DeliveryPdf`
- `VehicleStatusHistory`

### 7.7 Icerik ve SEO

- `BlogCategory`
- `BlogPost`
- `FAQ`
- `ServicePage`
- `SeoMetadata`

### 7.8 Mobil Uygulama Yonetimi

- `MobileBanner`
- `MobileCampaign`
- `MobileAnnouncement`
- `MobileMenuItem`
- `MobileContentBlock`
- `AppVersion`
- `AppSetting`
- `PushToken`
- `Notification`
- `NotificationDelivery`

### 7.9 Form, Belge ve Destek

- `FormTemplate`
- `FormField`
- `FormSubmission`
- `Document`
- `SupportTicket`
- `TicketMessage`
- `TicketAttachment`

### 7.10 Odeme Hazirligi

- `PaymentIntent`
- `PaymentProviderLog`
- `DepositPayment`

## 8. API Alanlari

Bu asamada endpoint implementasyonu yoktur. Sadece servis alanlari belirlenir.

API gruplari:

- Auth API
- User API
- Company API
- Vehicle API
- Quote API
- Admin Lead API
- Admin Vehicle API
- Admin User API
- Admin Mobile Content API
- Notification API
- Document API
- Fleet Operation API
- Delivery API
- Support Ticket API
- Blog / SEO API
- Payment Preparation API
- System Settings API

## 9. Frontend Dosya Mimarisi Taslagi

Next.js App Router yapisi onerilir.

Ana klasorler:

- `app/(public)`
- `app/(auth)`
- `app/(dashboard)`
- `app/admin`
- `app/api`
- `components`
- `components/ui`
- `components/marketing`
- `components/vehicles`
- `components/forms`
- `components/admin`
- `components/dashboard`
- `lib`
- `lib/auth`
- `lib/db`
- `lib/validations`
- `lib/services`
- `prisma`
- `content`

## 10. Backend Dosya Mimarisi Taslagi

Next.js API routes ile baslanirsa:

- `app/api/auth`
- `app/api/vehicles`
- `app/api/quotes`
- `app/api/admin`
- `app/api/mobile`
- `app/api/notifications`
- `app/api/documents`
- `app/api/support`
- `app/api/payments`

Servis katmani:

- `lib/services/auth-service.ts`
- `lib/services/vehicle-service.ts`
- `lib/services/quote-service.ts`
- `lib/services/admin-service.ts`
- `lib/services/notification-service.ts`
- `lib/services/payment-service.ts`
- `lib/services/mobile-content-service.ts`
- `lib/services/delivery-service.ts`

## 11. Guvenlik Mimarisi

Ilk fazdan itibaren uygulanmasi gerekenler:

- Sifre hash
- Rate limiting
- CSRF korumasi
- Role-based access control
- Admin route protection
- Zod ile form validasyonu
- Server-side validation
- KVKK onay kayitlari
- Audit log
- Environment variable ayrimi
- Hatali login deneme limiti
- Cihaz oturumu takibi
- Refresh token stratejisi

## 12. Tasarim Ilkeleri

Gorsel dil:

- Koyu lacivert, kirik beyaz, acik gri
- Metalik detaylar
- Guven veren mavi veya yesil vurgu
- Gereksiz parlak gradient yok
- Sahte stok hissi yok
- Kurumsal, sade, pahali ama soguk olmayan gorunum

UX ilkeleri:

- Formlar kisa ve adim adim olmali.
- Kullanici nerede oldugunu her zaman anlamali.
- Admin panelde kritik islemler 1-2 tikta yapilmali.
- Mobil ekranlar bankacilik uygulamasi netliginde olmali.
- Kartlar gercek veri tasimadigi surece cogaltilmamali.
- Metinler tekrar eden ve generic olmamali.

## 13. Fazlama Onerisi

### Faz 1: Web Satis ve Admin Temeli

- Public web
- Arac listeleme ve detay
- Teklif alma
- Auth
- Kullanici paneli temel ekranlari
- Admin lead, arac, kullanici ve teklif yonetimi
- Blog ve hizmet sayfalari

### Faz 2: Mobil Musteri Uygulamasi

- Flutter temel mimari
- Auth
- Dashboard
- Araclar
- Basvurular
- Teklifler
- Bildirimler
- Belgeler
- Profil

### Faz 3: Operasyon ve Filo Yonetimi

- Aktif filo musteri modulu
- Bakim, hasar, lastik, HGS/ceza
- Teslim ve iade modulu
- PDF tutanak
- Operasyon personeli mobil ekranlari

### Faz 4: Gelismis Sistemler

- Push hedefleme
- Mobil icerik yonetimi
- Analitik
- Odeme/kapora entegrasyonu
- Gelismis raporlama

## 14. Netlestirilmesi Gereken Kararlar

Kod uretimine gecmeden once su kararlar alinmalidir:

- Marka adi ve logo hazir mi?
- Ilk fazda mobil uygulama da kodlanacak mi, yoksa mimari hazir tutulup web once mi yapilacak?
- Arac fiyatlari gercek mi, temsili mi olacak?
- Teklif PDF'i ilk fazda uretilecek mi?
- Kapora odeme ilk fazda sadece mimari olarak mi kalacak?
- Admin panelde coklu sube veya coklu sirket yapisi gerekiyor mu?
- Arac stoklari manuel mi girilecek, entegrasyon hedefi var mi?
- Operasyon personeli modulu ilk surume dahil mi?
- Blog icerikleri manuel admin panelden mi, yoksa dosya tabanli mi yonetilecek?
- Musteri belgeleri icin dosya depolama hedefi ne olacak?

## 15. Bir Sonraki Adim

Bu dokuman onaylandiktan sonra ikinci dokuman olarak su detaylar uretilmelidir:

- Sayfa sayfa UX wireframe aciklamasi
- Component listesi
- Prisma schema taslagi
- API endpoint listesi
- Auth ve yetki matrisi
- Mobil navigation ve state management plani

Kod yazimina ancak bu ikinci dokuman incelendikten sonra gecilmelidir.
