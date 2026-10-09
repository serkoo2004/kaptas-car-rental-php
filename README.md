# KAPTAŞ Car Rental

Araç kiralama, rezervasyon, iyzico ödeme ve operasyon yönetimi için Next.js + Prisma + MySQL tabanlı web ve admin panel uygulaması.

## Local Kurulum

1. Bagimliliklari yukleyin:

```bash
npm install
```

2. Ortam degiskenlerini olusturun:

```bash
cp .env.example .env
```

3. MySQL'i baslatin:

```bash
docker compose up -d
```

4. Prisma semasini veritabanina aktarip baslangic verilerini yukleyin:

```bash
npm run db:setup
```

5. Gelistirme sunucusunu acin:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Başlangıç Verileri

`npm run db:seed` asagidaki kayitlari MySQL'e ekler:

- 6 yayinli filo araci
- Arac marka ve modelleri
- Kiralama paketleri
- Teknik ve operasyon ozellikleri
- 3 hizmet sayfasi
- 3 rehber yazisi
- Admin ve satis kullanicilari

Seed hesapları yalnızca yerel geliştirme içindir. Production ortamında `npm run db:seed` çalıştırılmaz.

## TürkTicaret Production

Linux cPanel Node.js App ve MySQL kurulumu için [deployment rehberini](deploy/turkticaret/README.md) izleyin.

## PostgreSQL'den MySQL'e Veri Aktarimi

Saglayici degisikliginden once mevcut veriyi yedekleyin:

```bash
npm run db:backup
```

MySQL semasini kurduktan sonra olusan JSON dosyasini geri yukleyin:

```bash
ALLOW_DATABASE_RESTORE=true npm run db:restore -- storage/database-backups/database-....json
```

## Kontrol Komutlari

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm run build
```
