# UI Design System ve Sayfa Wireframe Plani

Bu dokuman, kod uretimine gecmeden once Web + Admin Panel MVP icin marka bagimsiz UI design system ve sayfa wireframe planini kesinlestirir. Gercek UI dosyasi, component kodu veya CSS uretimi bu asamada yapilmaz.

Gecici marka adi: `FleetCore`

Marka adi ve logo daha sonra degisebilecegi icin tasarim sistemi token tabanli kurulmalidir. Renk, typography, spacing, radius, shadow ve component davranislari marka varliklarindan bagimsiz tanimlanir.

## 1. Marka Bagimsiz Design System

### 1.1 Tasarim Prensipleri

Urunun hissi:

- Kurumsal
- Guvenilir
- Premium
- Sade
- Hizli
- Operasyonel olarak ciddi
- Satis odakli ama baskici olmayan

Urunun kacmasi gereken hisler:

- Hazir template
- AI tarafindan uretilmis jenerik SaaS
- Asiri parlak gradient
- Sahte stok gorsel
- Gereksiz buyuk hero
- Birbirini tekrar eden kart bloklari
- Abartili pazarlama dili
- Oyuncak gibi yuvarlak, yumusak ve renkli arayuz

### 1.2 Token Yaklasimi

Tum tasarim degerleri semantic token olarak kurgulanmalidir.

Ornek token gruplari:

- `color.background`
- `color.surface`
- `color.surface-muted`
- `color.text-primary`
- `color.text-secondary`
- `color.border`
- `color.brand-primary`
- `color.brand-accent`
- `color.success`
- `color.warning`
- `color.danger`
- `radius.sm`
- `radius.md`
- `shadow.panel`
- `space.4`
- `font.heading`
- `font.body`

Marka degisirse sadece token degerleri degismeli; component yapisi ve sayfa hiyerarsisi degismemelidir.

### 1.3 Gecici Logo Yaklasimi

Logo ilk fazda placeholder olacaktir.

Ozellikler:

- Sade wordmark: `FleetCore`
- Yaninda basit geometrik isaret olabilir.
- Isaret arac, yol, ok veya filo temsiline cok literal yaklasmamalidir.
- Logo tek renk ve ters renk versiyonlarini desteklemelidir.
- Admin panelde kucuk sembol + wordmark, mobil breakpointlerde sadece sembol kullanilabilir.

## 2. Renk Paleti

Renk paleti koyu lacivert ve kirik beyaz omurgali olacak; vurgu rengi guven veren mavi veya yesil tonunda tutulacaktir. Palet tek renge bogulmamali, ozellikle tum arayuz koyu mavi varyasyonlarina yaslanmamalidir.

### 2.1 Semantic Renkler

Ana yuzeyler:

- `background`: #F7F8FA
- `surface`: #FFFFFF
- `surface-muted`: #F1F4F7
- `surface-strong`: #E7ECF1

Metin:

- `text-primary`: #17202A
- `text-secondary`: #52606D
- `text-muted`: #7A8694
- `text-inverse`: #FFFFFF

Ana marka:

- `brand-primary`: #102A43
- `brand-primary-hover`: #0B1F33
- `brand-soft`: #E8EEF5

Vurgu:

- `accent`: #0F766E
- `accent-hover`: #115E59
- `accent-soft`: #DDF5F1

Durum renkleri:

- `success`: #1F7A4D
- `success-soft`: #E2F5EA
- `warning`: #B7791F
- `warning-soft`: #FFF4D6
- `danger`: #B42318
- `danger-soft`: #FDE7E7
- `info`: #2563EB
- `info-soft`: #E8F0FF

Border:

- `border-subtle`: #E1E7EF
- `border-strong`: #C9D3DF
- `focus-ring`: #2F80ED

### 2.2 Renk Kullanim Kurallari

- Public webde `brand-primary` agirlikli ancak arka planlar acik tutulmali.
- Admin panelde beyaz ve acik gri yuzeyler daha baskin olmali.
- Vurgu rengi sadece CTA, aktif durum, onemli durum ve secili filtrelerde kullanilmali.
- Danger rengi sadece gercek risk veya red islemlerinde kullanilmali.
- Badge renkleri anlam tasimali; dekoratif renk kalabaligi yapilmamali.
- Gradient sadece cok sinirli ve ince yuzey gecislerinde kullanilabilir; ana tasarim kimligi olmamalidir.

## 3. Typography Sistemi

Typography modern, okunakli ve kurumsal olmalidir. Basliklar guclu ama pazarlama sitesi gibi devasa olmamalidir.

### 3.1 Font Ailesi

Oneri:

- Primary: Inter, Geist Sans veya benzeri modern sans-serif
- Fallback: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif

### 3.2 Font Olcekleri

Display:

- `display-lg`: 48px / 56px / 700
- `display-md`: 40px / 48px / 700

Heading:

- `h1`: 36px / 44px / 700
- `h2`: 30px / 38px / 700
- `h3`: 24px / 32px / 650
- `h4`: 20px / 28px / 650

Body:

- `body-lg`: 18px / 30px / 400
- `body-md`: 16px / 26px / 400
- `body-sm`: 14px / 22px / 400
- `caption`: 12px / 18px / 500

Admin ve tablo:

- `table-header`: 12px / 16px / 650
- `table-cell`: 14px / 20px / 400
- `form-label`: 13px / 18px / 600

### 3.3 Typography Kurallari

- Letter spacing 0 olmalidir.
- Buyuk harfli etiketler sinirli kullanilmalidir.
- Admin panelde basliklar kisa ve islevsel olmali.
- Public webde metinler kurumsal ama anlasilir olmalidir.
- Hero disinda 40px uzeri baslik nadiren kullanilmalidir.
- Kart icinde hero boyutunda baslik kullanilmamalidir.

## 4. Spacing Sistemi

Spacing sistemi 4px tabanli olmalidir.

Tokenlar:

- `space.1`: 4px
- `space.2`: 8px
- `space.3`: 12px
- `space.4`: 16px
- `space.5`: 20px
- `space.6`: 24px
- `space.8`: 32px
- `space.10`: 40px
- `space.12`: 48px
- `space.16`: 64px
- `space.20`: 80px
- `space.24`: 96px

Layout kurallari:

- Public section dikey bosluklari desktopta 72-96px arasi tutulabilir.
- Admin panelde bosluklar daha yogun olmalidir: 16-32px.
- Form alanlari arasinda 16-20px idealdir.
- Tablo ve liste ekranlarinda satir yuksekligi 44-56px arasi olmalidir.
- Mobilde section bosluklari 40-56px arasi tutulmalidir.

## 5. Component Davranislari

### 5.1 Button

Varyantlar:

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- Link

Boyutlar:

- Small: 32px height
- Medium: 40px height
- Large: 48px height

Davranis:

- Loading state spinner ve metinle desteklenmeli.
- Disabled state opacity ile degil, renk ve cursor ile net ayrilmali.
- Icon-only button mutlaka tooltip desteklemeli.
- Primary button her ekranda en fazla 1-2 ana aksiyon icin kullanilmali.
- Destructive aksiyonlar onay modalindan gecmelidir.

### 5.2 Input

Tipler:

- Text
- Email
- Password
- Phone
- Number
- Search
- Currency
- Date
- File

Davranis:

- Label her zaman gorunur olmali.
- Placeholder label yerine kullanilmamali.
- Error mesaji alanin altinda kisa ve net olmali.
- Focus state belirgin ama bagirmayan mavi ring ile verilmeli.
- Para ve adet alanlarinda input mask kullanilmali.
- Uzun formlarda alan gruplari bolumlenmelidir.

### 5.3 Card

Kullanim:

- Arac karti
- Teklif karti
- Basvuru ozeti
- Dashboard metrik karti
- Admin is listesi karti

Kurallar:

- Radius 6-8px arasi olmalidir.
- Kart icinde kart kullanilmamalidir.
- Kartlar sadece gercek veri tasiyorsa kullanilmalidir.
- Dekoratif bos kart yiginlari olusturulmamalidir.
- Hover state public webde hafif shadow veya border degisimiyle verilebilir.

### 5.4 Table

Kullanim:

- Admin lead listesi
- Arac yonetimi
- Belge onayi
- Kullanici listesi
- Audit log

Davranis:

- Kolon siralama desteklenmeli.
- Filtreler tablo ustunde gorunmeli.
- Satir secimi desteklenebilir.
- Bulk action icin secili satir bari kullanilmali.
- Durumlar badge ile gosterilmeli.
- Uzun metinler truncate edilmeli, detay tooltip veya drawerda acilmalidir.

### 5.5 Modal

Kullanim:

- Kritik onaylar
- Kisa formlar
- Red nedeni
- Hizli not ekleme

Kurallar:

- Uzun formlar modalda olmamali; drawer veya sayfa tercih edilmeli.
- Destructive modalda aksiyon metni acik olmalidir.
- Modal icinde birincil ve ikincil aksiyon net ayrilmalidir.

### 5.6 Badge

Kullanim:

- Durum
- Rol
- Stok
- Teslimat
- Belge durumu

Kurallar:

- Renk anlam tasimali.
- Ayni ekranda 5'ten fazla badge rengi kullanilmamali.
- Badge metinleri kisa olmali: "Inceleniyor", "Evrak bekliyor", "Onaylandi".

### 5.7 Tabs

Kullanim:

- Lead detay
- Arac detay admin
- Kullanici paneli alt bolumleri

Davranis:

- Desktopta yatay tab.
- Mobilde segmented control veya dropdown.
- Tab degisiminde veri kaybi olmamali.
- Aktif tab net gorunmeli.

### 5.8 Stepper

Kullanim:

- Teklif alma akisi
- Admin teklif olusturma
- Belge talep sureci

Davranis:

- Aktif adim, tamamlanan adim ve hata olan adim ayrilmali.
- Mobilde yatay uzun stepper yerine kisa ilerleme metni kullanilabilir.
- Geri donuste girilen veriler korunmali.

## 6. Public Web Sayfalari Wireframe Aciklamalari

### 6.1 Ana Sayfa

Desktop wireframe:

- Ustte sade header: logo, ana navigasyon, telefon/iletisim, login, teklif al.
- Ilk ekranda sol tarafta H1, destek metni ve 3 CTA.
- Hero altinda veya ayni viewportun alt bolumunde arac arama paneli.
- Arama paneli: marka, model, yakit, vites, aylik butce, sure.
- Guven rozetleri yatay bant olarak hero sonrasinda.
- Populer araclar 3-4 kartlik secili liste.
- Maliyet hesaplayici bolumu tablo hissinde, reklam karti gibi degil.
- Surec adimlari tek satir veya 2x2 blok.
- Hizmetler bolumu kategorilere ayrilmis.
- SSS ve blog alt kisimda.

Mobil wireframe:

- Header kompakt, menu drawer.
- Hero metni kisa, CTA'lar dikey.
- Arama paneli tek kolon.
- Filtreler ve secimler dokunmatik rahatlikta.
- Populer araclar yatay kaydirma yerine dikey liste tercih edilir.

### 6.2 Araclar Sayfasi

Desktop wireframe:

- Sayfa ustu baslik ve kisa aciklama.
- Sol filtre paneli.
- Sagda sonuc toolbar: sonuc sayisi, siralama, gorunum secimi.
- Arac kartlari 3 kolon.
- Karsilastirma bari ekran altinda sabit.

Mobil wireframe:

- Ustte arama alani.
- Filtre butonu bottom sheet acar.
- Siralama kisa menu.
- Kartlar tek kolon.
- Karsilastirma bari kompakt alt bar.

### 6.3 Arac Detay

Desktop wireframe:

- Breadcrumb.
- Sol genis galeri.
- Sag sticky teklif ozeti: paket, sure, km, CTA.
- Alt bolumlerde teknik ozellikler, dahil hizmetler, ek hizmetler.
- Benzer araclar en altta.

Mobil wireframe:

- Galeri ustte.
- Baslik ve ozet.
- Paket secici.
- Sticky alt CTA: "Teklif Al".
- Ozellikler accordion olabilir.

### 6.4 Teklif Alma

Desktop wireframe:

- Ortalanmis form konteyneri.
- Sol kisa surec ozeti veya guven notlari.
- Sag/ana alanda stepper form.
- Her adimda tek ana aksiyon.

Mobil wireframe:

- Tek kolon.
- Ustte "Adim 2/6" gibi kisa ilerleme.
- Sticky alt devam butonu.
- KVKK ve onaylar son adimda net ayrilir.

### 6.5 Maliyet Hesaplayici

Desktop wireframe:

- Sol girdi paneli.
- Sag sonuc paneli.
- Alt bolumde maliyet kalemi tablosu.
- En altta teklif CTA.

Mobil wireframe:

- Girdiler tek kolon.
- Sonuc ozeti ustte veya sticky olmayan kartta.
- Detay tablo accordion satirlara doner.

## 7. Kullanici Paneli Wireframe Aciklamalari

### 7.1 Panel Layout

Desktop:

- Sol sidebar.
- Ust topbar: kullanici, bildirim, cikis.
- Ana alan kart ve tablo karisimi.

Mobil:

- Bottom navigation veya drawer.
- Dashboard ozet kartlari tek kolon.
- Listelerde detay sayfasina gecis.

### 7.2 Dashboard

Bloklar:

- Aktif basvuru karti
- Son teklif karti
- Eksik belge uyarisi
- Favori araclar
- Son bildirimler

### 7.3 Basvurularim

Wireframe:

- Liste veya kart gorunumu.
- Her basvuru icin durum badge.
- Detayda timeline.
- Satis temsilcisi bilgisi.
- Ilgili belgeler ve teklifler.

### 7.4 Tekliflerim

Wireframe:

- Teklif listesi.
- Durum filtreleri.
- PDF goruntuleme aksiyonu.
- Revize iste veya onayla aksiyonu.

### 7.5 Belgelerim

Wireframe:

- Eksik belgeler ustte.
- Yuklenen belgeler altta.
- Durum badge.
- Yukle, degistir, red nedenini gor aksiyonlari.

## 8. Admin Panel Wireframe Aciklamalari

### 8.1 Admin Layout

Desktop oncelikli:

- Sol kalici sidebar.
- Ust topbar: global search, bildirim, kullanici menu.
- Ana alan: sayfa basligi, filtre/aksiyon alani, veri alani.
- Detaylar icin sag drawer sik kullanilir.

Tablet:

- Sidebar daraltilabilir.
- Tablolar yatay scroll veya kolon secimi desteklemeli.

Mobil:

- Admin panel mobil oncelikli degil.
- Kritik ekranlar okunabilir kalmali ama yogun operasyon desktopta hedeflenir.

### 8.2 Dashboard

Wireframe:

- Ust metrik satiri.
- Sol genis is listesi.
- Sagda aktivite ve bildirim paneli.
- Alt bolumde bekleyen leadler ve belgeler.

### 8.3 Liste Ekranlari

Ortak yapi:

- Sayfa basligi
- Birincil aksiyon
- Filtre bari
- Tablo
- Bulk action bari
- Detay drawer

## 9. Teklif Olusturma Ekrani Detayli Wireframe

Ekran tipi:

- Admin panel icinde tam sayfa veya lead detay icinden drawer/sayfa gecisi.

Bolumler:

1. Basvuru ozeti
2. Musteri ve firma bilgisi
3. Arac secimi
4. Paket secimi
5. Fiyatlandirma
6. Dahil hizmetler
7. Ek hizmetler
8. Gecerlilik ve notlar
9. Onizleme
10. Kaydet / gonder

Layout:

- Sol ana kolon: teklif kalemleri.
- Sag sticky kolon: toplam aylik bedel, gecerlilik, durum, aksiyonlar.

Davranis:

- Arac secilince paketler otomatik gelir.
- Paket degisince fiyat motoru yeniden hesaplar.
- Admin manuel fiyat revizyonu yapabilir.
- Manuel revizyon varsa hesaplama notu zorunlu olur.
- Teklif gondermeden once onizleme gosterilir.
- Gonderilen teklif kullanici panelinde gorunur.

Bos ve hata durumlari:

- Arac bulunamazsa "manuel arac ekle" opsiyonu.
- Fiyat hesaplanamazsa admin manuel fiyat girebilir.
- Eksik musteri bilgisi varsa uyari.

## 10. Arac Yonetim Ekrani Detayli Wireframe

### 10.1 Arac Listesi

Kolonlar:

- Kapak gorseli
- Marka / model
- Segment
- Yakit
- Vites
- Baslangic fiyati
- Stok / teslimat
- Web yayin
- Mobil yayin
- Son guncelleme

Filtreler:

- Marka
- Model
- Yakit
- Segment
- Yayin durumu
- Stok durumu

Aksiyonlar:

- Yeni arac
- Ice aktar
- One cikar
- Yayindan kaldir
- Duzenle

### 10.2 Arac Duzenleme

Sekmeler:

- Temel bilgiler
- Teknik ozellikler
- Gorseller
- Paketler
- Hizmetler
- SEO
- Yayin ayarlari

Davranis:

- Zorunlu alanlar tamamlanmadan yayin yapilamaz.
- Kapak gorseli secilmeden public yayin engellenir.
- Paket yoksa teklif CTA aktif olabilir ama fiyat "teklif aliniz" olarak gosterilir.
- SEO alanlari otomatik onerilebilir ama admin duzenleyebilmelidir.

## 11. Lead Detay Ekrani Detayli Wireframe

Ekran amaci:

- Satis temsilcisi veya admin musteri niyetini, basvuru bilgisini, belgeleri ve teklifleri tek ekranda gormeli.

Layout:

- Ustte lead basligi, durum badge, atanan temsilci, hizli aksiyonlar.
- Sol ana alan tablarla bolunur.
- Sag sticky musteri ozeti ve aktivite ozeti.

Sekmeler:

- Ozet
- Arac ihtiyaci
- Teklifler
- Belgeler
- Aktivite
- Notlar
- Durum gecmisi

Hizli aksiyonlar:

- Durum degistir
- Temsilci ata
- Teklif olustur
- Evrak iste
- Not ekle
- Kullaniciya bildirim olustur

Aktivite ozeti:

- Son gorulen arac
- Favori arac sayisi
- Teklif formu terk durumu
- Son login
- Son belge yukleme

## 12. Belge Onay Ekrani Detayli Wireframe

### 12.1 Belge Listesi

Kolonlar:

- Belge adi
- Tip
- Kullanici
- Firma
- Ilgili basvuru
- Durum
- Yukleme tarihi
- Son islem

Filtreler:

- Durum
- Belge tipi
- Firma
- Tarih
- Atanan temsilci

### 12.2 Belge Inceleme Drawer

Bolumler:

- Belge onizleme
- Belge metadata
- Kullanici/firma bilgisi
- Ilgili basvuru
- Onay/red aksiyonlari
- Red nedeni alani
- Belge gecerlilik tarihi

Davranis:

- Red icin neden zorunlu.
- Onay/red audit log'a duser.
- Kullanici panelinde durum aninda guncellenir.
- Gerekirse yeni belge talebi olusturulur.

## 13. Responsive Kurallar

Breakpointler:

- Mobile: 0-639px
- Tablet: 640-1023px
- Desktop: 1024-1279px
- Wide: 1280px+

Genel kurallar:

- Public web mobil oncelikli tasarlanir.
- Admin panel desktop oncelikli tasarlanir, tablet uyumlu olur.
- Formlar mobilde tek kolon.
- Admin tablolari mobilde kart listesine veya yatay scroll'a doner.
- Sticky CTA mobilde sadece teklif gibi donusum ekranlarinda kullanilir.
- Text hicbir breakpointte container disina tasmamalidir.
- Kart gridleri desktopta 3 kolon, tablette 2 kolon, mobilde 1 kolon olur.
- Hero ilk viewportu tamamen kaplamamalidir; sonraki bolumden ipucu gorunmelidir.
- Touch target minimum 44px olmalidir.
- Filtreler mobilde bottom sheet olarak acilmalidir.

## 14. AI Yapmis Gibi Gorunmemesi Icin Tasarim Kurallari

### 14.1 Layout Kurallari

- Her sayfa ayni kart-grid yapisina zorlanmamalidir.
- Hero bolumu sade ve islevsel olmali, gorsel veya arama deneyimiyle desteklenmelidir.
- Gereksiz ikon kalabaligi kullanilmamalidir.
- Sectionlar sadece dekorasyon icin degil, karar vermeye yardim etmek icin var olmalidir.
- Admin panelde gorsel susleme yerine bilgi yogunlugu ve hiz onceliklidir.

### 14.2 Metin Kurallari

Kacinilacak ifadeler:

- "Gelecegin mobilitesi"
- "Devrim yaratan cozum"
- "En iyi filo deneyimi"
- "Mukemmel operasyon"
- "Yapay zeka destekli benzersiz platform"

Tercih edilecek ifadeler:

- "Filonuzun operasyonel yukunu azaltir."
- "Maliyetlerinizi daha ongorulebilir hale getirir."
- "Bakim, sigorta, lastik ve hasar sureclerini tek yerden takip edin."
- "Ihtiyaciniza gore arac, sure ve kilometre paketi belirleyin."

### 14.3 Gorsel Kurallari

- Arac gorselleri gercekci ve temiz olmali.
- Sahte gulumseyen ofis stok gorsellerinden kacinilmali.
- Arka planlar fazla parlak veya soyut olmamali.
- Admin panelde dekoratif gorsel kullanilmamalidir.
- Placeholder gorseller bile finalde degisecek sekilde sistemli tutulmalidir.

### 14.4 Component Kurallari

- Kartlar gereksiz buyuk olmamali.
- Border, shadow ve radius dengeli olmali.
- Her CTA primary olmamali.
- Badge renkleri rastgele degil, durum anlamina gore secilmeli.
- Bos durum ekranlari samimi ama kisa olmalidir.

### 14.5 Gerceklik Kontrolu

Her sayfa icin su sorular sorulmalidir:

- Bu sayfa gercek bir filo sirketinde kullanilir mi?
- Bu metin satisa yardim ediyor mu, yoksa sadece guzel mi duruyor?
- Bu kart gercek veri tasiyor mu?
- Admin bu islemi 1-2 tikta yapabiliyor mu?
- Mobil kullanici bu ekranda ne yapacagini hemen anliyor mu?
- Marka degisse bu component sistemi ayakta kalir mi?

## 15. Kod Fazina Gecis Notu

Bu dokuman onaylandiktan sonra kod fazina gecilebilir. Kod fazinda sira su olmalidir:

1. Next.js proje kurulumu
2. Tailwind ve design token altyapisi
3. shadcn/ui temel component kurulumu
4. Prisma schema ve auth altyapisi
5. Public web layout
6. Admin shell
7. Arac ve teklif akislarinin implementasyonu
