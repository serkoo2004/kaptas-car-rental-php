# Detayli UX, Component, Veritabani ve Mobil Plan

Bu dokuman, `01-urun-mimarisi-ve-akislar.md` dosyasini detaylandirir. Amac kod yazmadan once ekranlari, bilesenleri, veri modelini ve is akislarini netlestirmektir.

## 1. Public Web UX Plani

### 1.1 Ana Sayfa

Kullanici niyeti:

- Markaya guvenmek
- Hangi hizmetleri aldigini anlamak
- Hizlica arac veya teklif akisi baslatmak
- Kiralama ile satin alma arasindaki farki gormek

Ekran yapisi:

- Header
- Hero
- Arac arama paneli
- Hizmet guven rozetleri
- Populer araclar
- Maliyet hesaplayici tanitimi
- Surec adimlari
- Hizmet kartlari
- Kurumsal referans / sektor deneyimi
- SSS
- Blog rehberleri
- Footer

Kritik UX notlari:

- Hero alani gereksiz buyuk olmamali; ilk ekranda arama panelinin bir kismi gorunmeli.
- CTA metinleri dogrudan olmali: "Teklif Al", "Araclari Incele", "Maliyetini Hesapla".
- Guven rozetleri gercek hizmet maddelerine baglanmali: bakim, lastik, sigorta, ikame arac, sabit odeme, 7/24 destek.
- Populer arac kartlari gercekci fiyat ve paket bilgisi tasimali.

### 1.2 Araclar Sayfasi

Kullanici niyeti:

- Araclari hizli taramak
- Ihtiyaca gore filtrelemek
- Karsilastirmak
- Teklif akisini baslatmak

Ekran yapisi:

- Liste ustu arama
- Sol veya ust filtre paneli
- Sonuc sayisi
- Siralama menusu
- Arac kart grid/list
- Karsilastirma sabit bari
- Pagination veya infinite load
- Bos sonuc alani

Kritik UX notlari:

- Mobilde filtre paneli bottom sheet olarak acilmali.
- Desktopta filtreler kalici ve taranabilir olmali.
- Karsilastirma 2-4 arac arasi desteklemeli.
- Bos sonuc "filtreleri temizle" aksiyonuyla bitmeli.

### 1.3 Arac Detay Sayfasi

Kullanici niyeti:

- Aracin isine uygun olup olmadigini anlamak
- Paket ve sure secmek
- Dahil hizmetleri net gormek
- Teklif istemek

Ekran yapisi:

- Breadcrumb
- Galeri
- Arac baslik ve ozet
- Paket secici
- Teknik ozellikler
- Dahil hizmetler
- Ek hizmetler
- Dinamik teklif formu
- Benzer araclar
- Arac bazli SSS

Kritik UX notlari:

- Paket secimi fiyat algisini netlestirmeli.
- "Aylik tahmini bedel" varsa bunun nihai fiyat olmadigi acik belirtilmeli.
- Dahil hizmetler sade ikonlarla anlatilmali, reklam metnine donmemeli.

### 1.4 Teklif Alma Akisi

Kullanici niyeti:

- Fazla ugrasmadan talep birakmak
- Sirketinin ihtiyacini dogru aktarmak
- Basvurunun alindigindan emin olmak

Adimlar:

- Kullanici tipi
- Arac ihtiyaci
- Firma bilgileri
- Iletisim bilgileri
- Ek hizmetler
- Onaylar
- Basvuru alindi

Kritik UX notlari:

- Her adimda ilerleme gostergesi olmali.
- Uzun formlar tek sayfada verilmemeli.
- Firma bilgileri kullanici girisliyse otomatik dolmali.
- KVKK metni checkbox yaninda kisa, detay linkiyle acilir olmali.

### 1.5 Maliyet Hesaplayici

Kullanici niyeti:

- Satin alma ve kiralama maliyetlerini tarafsiz gorunebilen bir formatta karsilastirmak
- Sonucu teklif akisiyle iliskilendirmek

Ekran yapisi:

- Girdi formu
- Hesaplama sonucu
- Maliyet kalemi karsilastirma tablosu
- Nakit akisi notu
- Operasyonel yuk aciklamasi
- Teklif CTA

Kritik UX notlari:

- Sonuc satis baskisi gibi degil, finansal ozet gibi gorunmeli.
- Varsayilan degerler degistirilebilir olmali.
- Mobilde sonuc karti alt kisimda sabit ozet olarak gorunebilir.

## 2. Kullanici Paneli UX Plani

### 2.1 Dashboard

Gosterilecekler:

- Aktif basvuru ozeti
- Son teklif
- Eksik evrak uyarisi
- Yaklasan teslimat veya randevu
- Favori araclar
- Bildirimler

### 2.2 Basvurularim

Gosterilecekler:

- Basvuru listesi
- Durum etiketi
- Arac adedi
- Talep tarihi
- Atanan satis temsilcisi
- Timeline

Durum sirasi:

- Alindi
- Inceleniyor
- Evrak bekleniyor
- Teklif hazirlandi
- Sozlesme asamasi
- Teslimat planlandi
- Tamamlandi

### 2.3 Tekliflerim

Gosterilecekler:

- Bekleyen teklifler
- Hazirlanan teklifler
- Onaylanan teklifler
- Reddedilen teklifler
- PDF goruntuleme
- Revize talebi
- Onay aksiyonu

### 2.4 Belgelerim

Gosterilecekler:

- Yuklenen belgeler
- Eksik belgeler
- Belge durumu
- Son gecerlilik tarihi
- Guvenli dosya yukleme

## 3. Admin Panel UX Plani

### 3.1 Admin Dashboard

Bir operasyon ekranidir; sadece metrik gostermemeli, is yaptirmalidir.

Ust ozet:

- Yeni basvuru
- Bekleyen teklif
- Evrak bekleyen musteri
- Bugunku teslimat
- Acik destek talebi

Ana is listesi:

- Oncelikli leadler
- Teslim gorevleri
- Eksik belgeler
- Yanitsiz mesajlar
- Zamanlanmis push bildirimleri

### 3.2 Lead Detay Ekrani

Bolumler:

- Musteri ozeti
- Firma bilgileri
- Talep edilen araclar
- Iletisim gecmisi
- Admin notlari
- Atanan satis temsilcisi
- Teklif hazirlama alani
- Durum gecmisi
- Belgeler

Hizli aksiyonlar:

- Satis temsilcisi ata
- Durum degistir
- Not ekle
- Eksik evrak iste
- Teklif olustur
- Kullaniciya mesaj gonder

### 3.3 Arac Yonetim Ekrani

Bolumler:

- Arac listesi
- Filtreler
- Arac duzenleme
- Gorsel yonetimi
- Paket yonetimi
- Stok ve teslimat durumu
- Web/mobil yayin durumu

Hizli aksiyonlar:

- One cikar
- Yayindan kaldir
- Paket kopyala
- Gorsel sirala

### 3.4 Mobil Icerik Yonetimi

Bolumler:

- Bannerlar
- Kampanyalar
- Duyurular
- Popup mesajlar
- Menu siralamasi
- Hizmet kartlari
- Uygulama versiyon ayarlari

Kritik UX notlari:

- Admin icerigi kaydetmeden once mobil onizleme gormeli.
- Hedef rol ve yayin zamani net secilmeli.
- Bakim modu ve zorunlu guncelleme gibi kritik ayarlarda onay modali olmali.

### 3.5 Push Notification Ekrani

Adimlar:

- Bildirim tipi sec
- Baslik ve mesaj yaz
- Gorsel ekle
- Hedef kitle sec
- Tiklaninca acilacak ekran sec
- Hemen gonder veya zamanla
- Onizle
- Gonderim istatistiklerini takip et

## 4. Component Listesi

### 4.1 Genel UI

- Button
- IconButton
- Input
- Textarea
- Select
- Combobox
- Checkbox
- RadioGroup
- Switch
- Slider
- Tabs
- Dialog
- Drawer
- Sheet
- Tooltip
- Badge
- Table
- DataTable
- Pagination
- Breadcrumb
- EmptyState
- ErrorState
- Skeleton
- Toast
- Stepper

### 4.2 Marketing Components

- SiteHeader
- SiteFooter
- HeroSearch
- TrustBadges
- ServiceBand
- ProcessSteps
- ReferenceStrip
- FaqAccordion
- BlogPreviewGrid
- CtaBand

### 4.3 Vehicle Components

- VehicleSearchBar
- VehicleFilterPanel
- VehicleSortMenu
- VehicleCard
- VehicleListSkeleton
- VehicleGallery
- VehiclePackageSelector
- VehicleSpecsTable
- IncludedServicesGrid
- ExtraServicesSelector
- CompareBar
- CompareTable
- FavoriteButton

### 4.4 Quote Components

- QuoteStepper
- UserTypeStep
- VehicleNeedStep
- CompanyInfoStep
- ContactInfoStep
- ExtraServicesStep
- ConsentStep
- QuoteSuccess

### 4.5 Dashboard Components

- UserDashboardSummary
- ApplicationTimeline
- QuoteStatusCard
- DocumentUploadBox
- NotificationList
- FleetVehicleCard
- SupportTicketCard

### 4.6 Admin Components

- AdminShell
- AdminSidebar
- AdminTopbar
- AdminMetricCard
- AdminTaskList
- LeadTable
- LeadDetailPanel
- AssignmentControl
- StatusTimeline
- AdminNoteThread
- VehicleAdminForm
- PackageEditor
- MobilePreviewFrame
- PushComposer
- RolePermissionMatrix
- AuditLogTable

### 4.7 Mobile App Widgets

- AppScaffold
- RoleAwareHome
- MobileVehicleCard
- MobileFilterSheet
- QuoteStatusTimeline
- PushNotificationTile
- DocumentTile
- DeliveryChecklistWidget
- SignaturePad
- PhotoCaptureField
- OfflineStatusBanner

## 5. Veritabani Model Detaylari

Bu bolum alan taslagidir; henuz Prisma schema degildir.

### 5.1 User

Alanlar:

- id
- name
- email
- emailVerifiedAt
- passwordHash
- phone
- role
- status
- companyId
- avatarUrl
- lastLoginAt
- createdAt
- updatedAt

Iliskiler:

- accounts
- sessions
- company
- quoteRequests
- favoriteVehicles
- documents
- deviceSessions
- consentRecords

### 5.2 Company

Alanlar:

- id
- name
- taxNumber
- taxOffice
- companyType
- sector
- employeeCount
- fleetSize
- address
- city
- district
- phone
- email
- status
- createdAt
- updatedAt

Iliskiler:

- users
- drivers
- quoteRequests
- fleetVehicles
- contracts
- documents

### 5.3 VehicleBrand

Alanlar:

- id
- name
- slug
- logoUrl
- isActive

### 5.4 VehicleModel

Alanlar:

- id
- brandId
- name
- slug
- segment
- bodyType
- isActive

### 5.5 Vehicle

Alanlar:

- id
- brandId
- modelId
- title
- slug
- year
- fuelType
- transmission
- bodyType
- segment
- enginePower
- batteryRange
- consumption
- monthlyPriceFrom
- deliveryStatus
- stockStatus
- isFeatured
- isPublishedWeb
- isPublishedMobile
- createdAt
- updatedAt

Iliskiler:

- brand
- model
- images
- packages
- quoteItems

### 5.6 VehiclePackage

Alanlar:

- id
- vehicleId
- durationMonths
- annualKm
- monthlyPrice
- depositAmount
- includedServices
- optionalServices
- isActive

### 5.7 QuoteRequest

Alanlar:

- id
- userId
- companyId
- userType
- status
- source
- contactName
- contactEmail
- contactPhone
- companyName
- note
- kvkkAcceptedAt
- commercialConsentAt
- assignedSalesRepId
- createdAt
- updatedAt

Iliskiler:

- items
- assignedSalesRep
- notes
- statusHistory
- documents

### 5.8 QuoteRequestItem

Alanlar:

- id
- quoteRequestId
- vehicleId
- brandText
- modelText
- quantity
- durationMonths
- annualKm
- requestedServices

### 5.9 Notification

Alanlar:

- id
- title
- message
- imageUrl
- type
- targetType
- targetRole
- targetCompanyId
- targetUserId
- platform
- deepLink
- scheduledAt
- sentAt
- status
- createdById
- createdAt

### 5.10 DeliveryTask

Alanlar:

- id
- type
- vehicleId
- companyId
- userId
- assignedStaffId
- scheduledAt
- status
- locationAddress
- gpsRequired
- signatureRequired
- photoRequired
- mileage
- fuelLevel
- completedAt

### 5.11 SupportTicket

Alanlar:

- id
- userId
- companyId
- type
- priority
- status
- assignedStaffId
- subject
- lastMessageAt
- slaDueAt
- createdAt
- updatedAt

## 6. Mobil Navigation Plani

### 6.1 Bireysel / Genel Kullanici

Tablar:

- Ana Sayfa
- Araclar
- Basvurular
- Bildirimler
- Profil

### 6.2 Kurumsal Yetkili

Tablar:

- Ozet
- Filom
- Talepler
- Belgeler
- Profil

### 6.3 Surucu

Tablar:

- Aracim
- Talepler
- Bildirimler
- Belgeler
- Profil

### 6.4 Operasyon Personeli

Tablar:

- Gorevler
- Teslimler
- Iadeler
- Mesajlar
- Profil

### 6.5 Satis Temsilcisi

Tablar:

- Leadler
- Teklifler
- Mesajlar
- Hatirlaticilar
- Profil

## 7. Mobil State Management Plani

Flutter icin onerilen yapi:

- Riverpod veya Bloc
- GoRouter ile navigation
- Dio ile API client
- Secure Storage ile token saklama
- Hive veya Isar ile offline cache
- Firebase Cloud Messaging ile push notification

State alanlari:

- AuthState
- UserProfileState
- VehicleListState
- QuoteState
- NotificationState
- DocumentState
- FleetState
- DeliveryTaskState
- OfflineSyncState

## 8. Onceliklendirme

Ilk kod fazi icin minimum kapsam:

- Next.js web temel kurulumu
- Public ana sayfa
- Arac listeleme
- Arac detay
- Teklif formu
- Auth
- Kullanici paneli temel ekranlari
- Admin panel temel shell
- Admin arac ve lead yonetimi
- Prisma temel modeller

Ilk faza alinmamasi onerilenler:

- Gercek odeme entegrasyonu
- Tam mobil uygulama kodu
- Operasyon personeli saha teslim modulu
- Gelismis analitik
- Telematik entegrasyon

Bu alanlar mimaride hazir tutulmali, ancak ilk surumun bitmesini zorlastirmamalidir.

## 9. Inceleme Sorulari

Bir sonraki adima gecmeden once yanitlanmasi gereken sorular:

- Ilk fazda marka adi ne olacak?
- Mobil uygulama ilk surume dahil mi, yoksa once web + admin mi?
- Admin panelde operasyon modulu ilk faza alinacak mi?
- Arac fiyatlari temsili mi, gercek mi?
- Teklif PDF ve belge yukleme ilk fazda aktif olacak mi?
- Kullanici rolleri icinde `DRIVER` ve `OPERATIONS_STAFF` ilk fazda gerekli mi?
- Blog icerikleri admin panelden mi yonetilecek?
- Dosya depolama icin hedef servis ne olacak?
