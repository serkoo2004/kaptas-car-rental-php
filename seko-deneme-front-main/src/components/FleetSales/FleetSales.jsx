import React, { useState } from 'react';
import './FleetSales.css';

const FleetSales = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const companyName = String(formData.get('frm_2') || '').trim();
    const contactName = String(formData.get('frm_3') || '').trim();
    const contactEmail = String(formData.get('frm_-1') || '').trim();
    const contactPhone = String(formData.get('frm_6') || '').trim();
    const taxNumber = String(formData.get('frm_4') || '').trim();
    const duration = String(formData.get('frm_7') || '').trim();
    const vehicleCount = String(formData.get('frm_8') || '').trim();

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/contact', {
        body: JSON.stringify({
          companyName,
          contactEmail,
          contactName,
          contactPhone,
          message: `Uzun dönem filo kiralama talebi. Vergi No: ${taxNumber}. Süre: ${duration}. Araç adedi: ${vehicleCount}.`,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Form gönderilemedi.');
      }

      event.currentTarget.reset();
      alert('Talebiniz alındı. Ekibimiz en kısa sürede dönüş yapacak.');
    } catch (error) {
      alert(error.message || 'Form gönderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fleet-sales-wrapper">
      <div className="container breadcrumb-container">
        <ul className="breadcrumb">
          <li><a href="/" title="Anasayfa">Anasayfa</a></li>
          <li><span className="separator">/</span></li>
          <li className="active">Uzun Dönem Kiralama</li>
        </ul>
      </div>

      <section className="container sub_page">
        <header>
            <h1>Uzun Dönem Kiralama</h1>
        </header>
        <div className="contact_page">
            <div className="contact_page_left">
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555', textAlign: 'justify'}}>
                    <div style={{textAlign: 'left'}}><span style={{fontSize: '22px', fontFamily: 'inherit', color: '#cc0000'}}></span></div>
                </h3>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555', textAlign: 'justify'}}>
                    <div style={{textAlign: 'left'}}><strong style={{color: 'inherit', fontFamily: 'inherit', fontSize: '22px'}}>Şirketiniz İçin Uzun Dönem Araç Kiralamada Güvenilir Çözüm Ortağınız: WindyCar Filo Kiralama</strong></div>
                </h3>
                <p>Kurumsal araç ihtiyaçlarınız için uzun dönem kiralama çözümlerimizi değerlendirmek üzere&nbsp;<strong>0850 339 46 39</strong>&nbsp;numaralı çağrı merkezimizden,<br />
                <strong><a className="decorated-link cursor-pointer" rel="noopener">kurumsalkiralama@windycar.com.tr<span aria-hidden="true" className="ms-0.5 inline-block align-middle leading-none"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="block h-[0.75em] w-[0.75em] stroke-current stroke-[0.75]">
                <path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z"></path>
                </svg></span></a></strong>&nbsp;adresinden veya sayfadaki iletişim formundan bize ulaşabilirsiniz.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>WindyCar Filo ile Güvenilir ve Esnek Uzun Dönem Kiralama Çözümleri</strong></h2>
                <p>Artan araç maliyetleri, bakım giderleri, sigorta yükümlülükleri ve yeni nesil araçların sunduğu yüksek konfor, işletmeleri uzun dönem araç kiralamaya yönlendirmektedir. Kısa dönem kiralamalar maliyetli görünse de,&nbsp;<strong>uzun dönem kiralamada aylık fiyatlar çok daha avantajlıdır</strong>&nbsp;ve bu model 12–36 ay gibi sürelerde önemli tasarruf sağlar.</p>
                <p>Uzun dönem araç kiralamayla birlikte:</p>
                <ul>
                    <li>
                    <p><strong>Bakım ve onarım</strong></p>
                    </li>
                    <li>
                    <p><strong>Kasko ve trafik sigortaları</strong></p>
                    </li>
                    <li>
                    <p><strong>Vergiler ve yasal yükümlülükler</strong></p>
                    </li>
                    <li>
                    <p><strong>Arıza ve hasar yönetimi</strong></p>
                    </li>
                </ul>
                <p>tamamen WindyCar’ın sorumluluğundadır. Kullanıcı yalnızca aylık kiralama bedeline odaklanır; operasyonel süreçler profesyonel ekibimiz tarafından yönetilir.</p>
                <p>Bu model, özellikle kurumsal şirketler için hem&nbsp;<strong>ekonomik hem de operasyonel olarak en pratik çözüm</strong>&nbsp;hâline gelmiştir.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Uzun Dönem Araç Kiralama Nedir?</strong></h2>
                <p>Uzun dönem araç kiralama, araç satın almadan 12 ile 36 ay arasında değişen sürelerle&nbsp;<strong>kullanım odaklı bir mobilite hizmeti</strong>&nbsp;sunar. Tek araçtan geniş filolara kadar tüm ihtiyaçlara yönelik çözümleri kapsar.</p>
                <p>Bu modelde:</p>
                <ul>
                    <li>
                    <p>Periyodik bakım giderleri</p>
                    </li>
                    <li>
                    <p>Lastik değişimleri</p>
                    </li>
                    <li>
                    <p>Kasko ve trafik sigortaları</p>
                    </li>
                    <li>
                    <p>Aracın olası değer kaybı</p>
                    </li>
                </ul>
                <p>tamamen kiralama firmasının yönetimine geçer. Bu da&nbsp;<strong>hem maliyet hem de zaman açısından büyük avantaj</strong>&nbsp;sağlar.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Filo Kiralama &amp; Uzun Dönem Araç Kiralamada Sunulan Avantajlar</strong></h2>
                <p>WindyCar uzun dönem kiralamada şu kritik avantajları sunar:</p>
                <ul>
                    <li>
                    <p><strong>Hasar ve kaza yönetimi</strong></p>
                    </li>
                    <li>
                    <p><strong>Zorunlu trafik ve kasko sigortaları</strong></p>
                    </li>
                    <li>
                    <p><strong>Periyodik bakım hizmetleri</strong></p>
                    </li>
                    <li>
                    <p><strong>Teslimat–iade operasyonları</strong></p>
                    </li>
                    <li>
                    <p><strong>Lastik değişimi ve depolama hizmetleri</strong></p>
                    </li>
                    <li>
                    <p><strong>Yol yardım desteği</strong></p>
                    </li>
                    <li>
                    <p><strong>İkame araç temini</strong></p>
                    </li>
                </ul>
                <p>Tüm süreç tek noktadan profesyonel bir şekilde yürütülür.</p>
                <p>Kurumsal müşteriler ayrıca kiralama faturalarını&nbsp;<strong>gider olarak</strong>&nbsp;gösterebildiği için mali açıdan ek avantaj elde eder.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Uzun Dönem Araç Kiralarken Nelere Dikkat Edilmeli?</strong></h2>
                <p>Uzun dönem kiralama sürecinde aşağıdaki noktalar kritik önem taşır:</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>1️⃣ Doğru Araç Seçimi</strong></h3>
                <p>Kullanım amacı, segment, yakıt tüketimi, motor gücü ve aylık kilometre ihtiyacı doğru belirlenmelidir.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>2️⃣ Güvenilir Kiralama Firması</strong></h3>
                <p>WindyCar gibi deneyimli ve yaygın hizmet ağına sahip bir firmayla çalışmak sürecin her aşamasında güven sağlar.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>3️⃣ Bütçe Planlaması</strong></h3>
                <p>Aylık kira bedeli, toplam kiralama süresi ve yıllık kilometre limiti doğru hesaplanarak sürdürülebilir bir maliyet planı oluşturulmalıdır.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>4️⃣ Sözleşme Detayları</strong></h3>
                <p>Tüm maddeler dikkatlice incelenmeli ve ihtiyaçlara uygun olduğundan emin olunmalıdır.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Filo Kaç Araçtan Oluşur?</strong></h2>
                <p>Filo kiralama esnek bir yapıya sahiptir.<br />
                İhtiyaca göre:</p>
                <ul>
                    <li>
                    <p><strong>3 araçlık küçük filolardan</strong></p>
                    </li>
                    <li>
                    <p><strong>yüzlerce araca kadar büyük filolara</strong></p>
                    </li>
                </ul>
                <p>kadar özelleştirilebilir. Araç adedi tamamen işletmenin büyüklüğüne, operasyonel süreçlerine ve bütçesine göre şekillenir.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Filo Kiralama Süreci Nasıl İşler?</strong></h2>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>1. İhtiyaçların Belirlenmesi</strong></h3>
                <p>Araç sayısı, segmentler, ekip ihtiyacı ve kullanım senaryoları netleştirilir.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>2. Araç Modeli ve Özelliklerinin Seçilmesi</strong></h3>
                <p>Marka ve model alternatifleri değerlendirilir; en uygun seçenek belirlenir.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>3. Doğru Partnerin Seçilmesi</strong></h3>
                <p>WindyCar’ın profesyonel, deneyimli ekipleri ile süreç güven içinde yönetilir.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>4. Belgelerin Hazırlanması</strong></h3>
                <p>Gerekli evrakların tamamlanmasıyla kiralama süreci hızla başlatılır.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>WindyCar Filo Güvencesi ile Kesintisiz Mobilite</strong></h2>
                <p>WindyCar, filo yönetiminin her aşamasını profesyonel şekilde üstlenir:</p>
                <ul>
                    <li>
                    <p>Araç bakımları</p>
                    </li>
                    <li>
                    <p>Teknik takip süreçleri</p>
                    </li>
                    <li>
                    <p>Hasar–kaza yönetimi</p>
                    </li>
                    <li>
                    <p>Yedek araç temini</p>
                    </li>
                    <li>
                    <p>7/24 yol yardım</p>
                    </li>
                </ul>
                <p>gibi tüm operasyonel yükleri sizin yerinize biz yönetiriz.<br />
                Siz sadece işinize odaklanırsınız; gerisini WindyCar sizin için çözer.</p>
                <hr />
                <h2 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555'}}><strong>Uzun Dönem Kiralama Öncesi Son Tavsiye</strong></h2>
                <p>Yeni bir araç satın almadan önce mutlaka&nbsp;<strong>WindyCar Filo’nun uzun dönem kiralama avantajlarını</strong>&nbsp;değerlendirin.<br />
                İhtiyacınıza uygun aracı seçerek&nbsp;<strong>ekonomik, güvenli ve konforlu bir sürüş deneyimine</strong>&nbsp;sahip olabilirsiniz.</p>
                <h3 style={{fontFamily: '"segoe ui", arial, sans-serif', color: '#555555', textAlign: 'left'}}><span style={{fontSize: '22px', fontWeight: 'normal', color: '#000000'}}><br />
                </span></h3>
            </div>
            <div className="contact_page_right">
                <div className="form_main">
                    <div className="form_header">
                        <strong>Uzun Dönem Filo Kiralama</strong>
                        <p></p>
                    </div>
                    <form id="frm" className="form_content" method="post" action="/Content/FrmData" onSubmit={handleSubmit}>
                        
                        <input id="lblerr" name="lblerr" type="hidden" defaultValue="Hatalı Doğrulama Kodu" />
                        <input id="lblsReq" name="lblsReq" type="hidden" defaultValue="{label} alanı zorunludur" />  
                        <input id="LangID" name="LangID" type="hidden" defaultValue="1" />
                        <input id="FormID" name="FormID" type="hidden" defaultValue="14" />
                        <input id="PageID" name="PageID" type="hidden" defaultValue="1038" />
                        <input id="URL" name="URL" type="hidden" defaultValue="/filo-satis" />                                
                        
                        <h3>Uzun Dönem Araç Kiralama Formu</h3>
                        <div className="form_group">
                            <input type="text" id="frm_2" name="frm_2" placeholder="&nbsp;" required />
                            <label htmlFor="frm_2" className="text">Şirket Ünvanı</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_3" name="frm_3" placeholder="&nbsp;" required />
                            <label htmlFor="frm_3" className="text">Yetkili İsmi</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_-1" name="frm_-1" placeholder="&nbsp;" required />
                            <label htmlFor="frm_-1" className="text">E-mail</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_6" name="frm_6" placeholder="&nbsp;" required />
                            <label htmlFor="frm_6" className="text">Telefon</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_4" name="frm_4" placeholder="&nbsp;" required />
                            <label htmlFor="frm_4" className="text">Vergi No</label>
                        </div>
                        <div className="form_group">
                            <select id="frm_7" name="frm_7" required defaultValue="">
                                <option value="" disabled hidden></option>
                                <option value="6 Ay">6 Ay</option>
                                <option value="12 Ay">12 Ay</option>
                                <option value="24 Ay">24 Ay</option>
                                <option value="36 Ay">36 Ay</option>
                            </select>
                            <label htmlFor="frm_7">Kiralama Süresi</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_8" name="frm_8" placeholder="&nbsp;" required />
                            <label htmlFor="frm_8" className="text">Araç Adedi</label>
                        </div>

                        <hr />
                        <div className="send_btn">
                            <button type="submit" className="lbl Captcha2" disabled={isSubmitting} data-canvas="cvcode" data-frm="frm" data-txt="verification_code" data-refresh="refresh" id="5180" title="Gönder">
                              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                            </button>
                        </div>

                    <input name="__RequestVerificationToken" type="hidden" value="CfDJ8EjRyCdY7WtEicg89i2qMoSwMuS46MZEUY7GmzVKvf_xdSVwdzrNOb7ThfTOx5RIqLM6z3sYvginB_77NQqtR0a993YDUnYi1U16g1bszEBDlf03TvtSoT4g1Rtw1lnXl3x-wL_2xq_GDve-34Glm-w" />
                    </form>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default FleetSales;
