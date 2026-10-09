import React from 'react';
import '../FleetSales/FleetSales.css';

const MissionVision = () => {
  return (
    <div className="fleet-sales-wrapper">
      <div className="container breadcrumb-container">
        <ul className="breadcrumb">
          <li><a href="/" title="Anasayfa">Anasayfa</a></li>
          <li><span className="separator">/</span></li>
          <li className="active">Vizyonumuz & Misyonumuz</li>
        </ul>
      </div>

      <section className="container sub_page">
        <header>
            <h1>Vizyonumuz & Misyonumuz</h1>
        </header>
        <div className="sub_page_content">
          <div style={{textAlign: 'center'}}>
            <h3 style={{ fontSize: '1.5rem', marginTop: '1.5rem', marginBottom: '1rem', color: '#333' }}>Misyonumuz</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1rem', color: '#444' }}>WindyCar olarak misyonumuz; bireysel ve kurumsal müşterilerimizin dönemsel araç kiralama ihtiyaçlarını, rekabetçi fiyat avantajı ve yüksek hizmet standartları ile karşılamak; her temas noktasında güven veren, sürdürülebilir ve kaliteli bir hizmet deneyimi sunmaktır.</p>
            <p style={{ lineHeight: '1.8', marginBottom: '1rem', color: '#444' }}>Köklü kurumsal yapımızdan aldığımız güçle, araç kiralamayı yalnızca bir ulaşım hizmeti olarak değil; konfor, güven ve memnuniyet odaklı bütünsel bir deneyim olarak ele alırız. Türkiye genelinde yaygın şube ağımız, yeni model ve düşük kilometreli araçlardan oluşan filomuz ile her müşterimize aynı kalite standardını sunmayı ilke ediniriz.</p>
            <p style={{ lineHeight: '1.8', marginBottom: '1rem', color: '#444' }}>Çalışanlarını, iş ortaklarını ve müşterilerini aynı ailenin bir parçası olarak gören yaklaşımımızla; şeffaf, etik ve sorumluluk bilinci yüksek bir kurumsal kültür inşa ederiz. Sürekli gelişimi esas alan yapımızla, hizmet kalitemizi, dijital altyapımızı ve operasyonel gücümüzü her geçen gün ileriye taşımayı hedefleriz.</p>

            <h3 style={{ fontSize: '1.5rem', marginTop: '2.5rem', marginBottom: '1rem', color: '#333' }}>Vizyonumuz</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1rem', color: '#444' }}>Türk misafirperverliğini hizmet anlayışının merkezine alarak; müşterileri tarafından en samimi, en güvenilir ve en çok tercih edilen araç kiralama markalarından biri olmak.</p>
            <p style={{ lineHeight: '1.8', marginBottom: '1rem', color: '#444' }}>Yenilikçi çözümlerimiz, güçlü kurumsal yapımız ve müşteri odaklı yaklaşımımızla; araç kiralama sektöründe kalite, güven ve memnuniyet denildiğinde ilk akla gelen öncü marka olmayı amaçlıyoruz. Sürdürülebilir büyüme anlayışımızla, hem sektöre hem de hizmet sunduğumuz tüm paydaşlara uzun vadeli değer katmayı hedefliyoruz.</p>
            <br />
          </div>
        </div>
      </section>
    </div>
  );
};

export default MissionVision;
