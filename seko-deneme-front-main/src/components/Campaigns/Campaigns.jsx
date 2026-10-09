import React from 'react';
import './Campaigns.css';

const campaignsData = [
  {
    id: 1,
    title: "Garanti Bankası Kart Sahiplerine WindyCar 'da Ayrıcalık !",
    image: "https://www.windycar.com.tr/dosya/800/haber/58-1-garanti-bankasina-ozel-35-indirim-_998.webp",
    link: "/haberler/garanti-bankasi-kart-sahiplerine-windycar-da-ayricalik-"
  },
  {
    id: 2,
    title: "Türkiye İş Bankası Kart Sahiplerine Özel İndirim Fırsatı !",
    image: "https://www.windycar.com.tr/dosya/800/haber/57-1-turkiye-is-bankasi-kart-sahiplerine-ozel-indirim-firsati-_183.webp",
    link: "/haberler/turkiye-is-bankasi-35-indirim-avantaji-"
  },
  {
    id: 3,
    title: "Hopililer WindyCar'da Tüm Araç Gruplarında %20 İndirim ve %15 Paracık’la Kazanıyor!",
    image: "https://www.windycar.com.tr/dosya/800/haber/62-1-hopililer-windycarda-tum-arac-gruplarinda-20-indirim-ve-15-paracik’la-kazaniyor_890.webp",
    link: "/haberler/hopililer-windycarda-20-indirim-ve-15-paracik’la-ayricalikli"
  },
  {
    id: 4,
    title: "Kuveyt Türk Müşterilerine Özel WindyCar'da %30 İndirim Fırsatı!",
    image: "https://www.windycar.com.tr/dosya/800/haber/68-1-kuveyt-turk-musterilerine-ozel-windycarda-30-indirim-firsati-_832.webp",
    link: "/haberler/kuveyt-turk-musterilerine-ozel-windycarda-30-indirim-firsati-"
  },
  {
    id: 5,
    title: "WindyCar ile Yolculuğunuz Mil’e Dönüşsün !",
    image: "https://www.windycar.com.tr/dosya/800/haber/59-1-windycar-ile-yolculugunuz-mil’e-donussun-_906.webp",
    link: "/haberler/windycar-milesandsmiles"
  },
  {
    id: 6,
    title: "MultiNet Üyelerine Özel %35 İndirim !",
    image: "https://www.windycar.com.tr/dosya/800/haber/56-1-multinet-uyelerine-ozel-35-indirim-_514.webp",
    link: "/haberler/multinet-uyelerine-ozel-35-indirim-"
  },
  {
    id: 7,
    title: "T-Point Kullanıcılarına WindyCar %30 İndirim Fırsatı !",
    image: "https://www.windycar.com.tr/dosya/800/haber/67-1-t-point-kullanicilarina-windycar-30-indirim-firsati-_676.webp",
    link: "/haberler/t-point-kullanicilarina-windycar-30-indirim-firsati-"
  },
  {
    id: 8,
    title: "WindyCar'da Araç Kiralamalarınızı Önceden Yapın, Anında %20 İndirim Kazanın!",
    image: "https://www.windycar.com.tr/dosya/800/haber/61-1-deneme_934.webp",
    link: "/haberler/windycarda-arac-kiralamalarinizi-onceden-yapin-aninda-20-indirim-kazanin"
  },
  {
    id: 9,
    title: "Çağrı Merkezimiz 7 Gün Hizmetinizde",
    image: "https://www.windycar.com.tr/dosya/800/haber/4-1-cagri-merkezimiz-7-gun-hizmetinizde_241.webp",
    link: "/haberler/cagri-merkezimiz"
  }
];

const Campaigns = () => {
  return (
    <section className="campaigns-page-wrapper container">
      <div className="breadcrumb">
        <ul>
          <li><a href="/">Anasayfa</a><span>/</span></li>
          <li className="active">Kampanyalar</li>
        </ul>
      </div>

      <header className="campaigns-page-header">
        <h1>Kampanyalar</h1>
      </header>
      
      <div className="campaigns-grid">
        {campaignsData.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            <div className="campaign-image">
              <a href={campaign.link}>
                <img src={campaign.image} alt={campaign.title} />
              </a>
            </div>
            <div className="campaign-content">
              <a href={campaign.link} className="campaign-title">{campaign.title}</a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pagination">
        <a href="/haberler/" className="active">1</a>
      </div>
    </section>
  );
};

export default Campaigns;
