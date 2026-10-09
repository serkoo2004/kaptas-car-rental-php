import React, { useState } from 'react';
import '../FleetSales/FleetSales.css'; // Reusing the same CSS classes

const CorporateLeasing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const companyName = String(formData.get('frm_3') || '').trim();
    const contactName = String(formData.get('frm_4') || '').trim();
    const contactEmail = String(formData.get('frm_5') || '').trim();
    const contactPhone = String(formData.get('frm_6') || '').trim();
    const taxNumber = String(formData.get('frm_7') || '').trim();
    const monthlyCount = String(formData.get('frm_8') || '').trim();

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/contact', {
        body: JSON.stringify({
          companyName,
          contactEmail,
          contactName,
          contactPhone,
          message: `Kurumsal kiralama talebi. Vergi No: ${taxNumber}. Aylık ortalama kiralama sayısı: ${monthlyCount}.`,
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
          <li className="active">Kurumsal Kiralama</li>
        </ul>
      </div>

      <section className="container sub_page">
        <header>
            <h1>Kurumsal Kiralama</h1>
        </header>
        <div className="contact_page">
            <div className="contact_page_left">
                <br />
                <h2 data-start="203" data-end="259" style={{fontFamily: 'verdana', color: '#555555'}}>
                    {/* Empty in the original HTML */}
                </h2>
                <p>
                    Kurumsal araç kiralama ihtiyaçlarınız için en uygun çözümleri sunuyoruz. Lütfen yandaki formu doldurarak talebinizi iletin.
                </p>
            </div>
            <div className="contact_page_right">
                <div className="form_main">
                    <div className="form_header">
                        <strong>Kurumsal Kiralama</strong>
                        <p></p>
                    </div>
                    <form id="frm" className="form_content" method="post" action="/Content/FrmData" onSubmit={handleSubmit}>
                        
                        <input id="lblerr" name="lblerr" type="hidden" defaultValue="Hatalı Doğrulama Kodu" />
                        <input id="lblsReq" name="lblsReq" type="hidden" defaultValue="{label} alanı zorunludur" />  
                        <input id="LangID" name="LangID" type="hidden" defaultValue="1" />
                        <input id="FormID" name="FormID" type="hidden" defaultValue="17" />
                        <input id="PageID" name="PageID" type="hidden" defaultValue="1002" />
                        <input id="URL" name="URL" type="hidden" defaultValue="/kurumsal-kiralama" />                                
                        
                        <h3>Kurumsal Kiralama Formu</h3>
                        <div className="form_group">
                            <input type="text" id="frm_3" name="frm_3" placeholder="&nbsp;" required />
                            <label htmlFor="frm_3" className="text">Şirket Ünvanı</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_4" name="frm_4" placeholder="&nbsp;" required />
                            <label htmlFor="frm_4" className="text">Yetkili İsmi</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_5" name="frm_5" placeholder="&nbsp;" required />
                            <label htmlFor="frm_5" className="text">E-mail</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_6" name="frm_6" placeholder="&nbsp;" required />
                            <label htmlFor="frm_6" className="text">Telefon</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_7" name="frm_7" placeholder="&nbsp;" required />
                            <label htmlFor="frm_7" className="text">Vergi No</label>
                        </div>
                        <div className="form_group">
                            <input type="text" id="frm_8" name="frm_8" placeholder="&nbsp;" required />
                            <label htmlFor="frm_8" className="text">Aylık Ortalama Kiralama Sayısı</label>
                        </div>

                        <hr />
                        <div className="send_btn">
                            <button type="submit" className="lbl Captcha2" disabled={isSubmitting} data-canvas="cvcode" data-frm="frm" data-txt="verification_code" data-refresh="refresh" id="5180" title="Gönder">
                              {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default CorporateLeasing;
