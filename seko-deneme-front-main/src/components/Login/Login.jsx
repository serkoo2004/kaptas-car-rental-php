import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [accountType, setAccountType] = useState('individual'); // 'individual' or 'corporate'
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isTc, setIsTc] = useState(true); // true = TC Vatandaşı, false = Değil

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert('Giriş başarılı (Demo)');
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    alert('Kayıt başarılı (Demo)');
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    alert('Şifre sıfırlama bağlantısı gönderildi (Demo)');
    setForgotPasswordOpen(false);
  };

  return (
    <main role="login" className="login-page">
      <section className="container sub_page">
        <div className="login-container">
          <ul className="nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'login' ? 'active' : ''}`} 
                onClick={() => setActiveTab('login')}
              >
                Giriş Yap
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'register' ? 'active' : ''}`} 
                onClick={() => setActiveTab('register')}
              >
                Yeni Üyelik
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {/* LOGIN TAB */}
            {activeTab === 'login' && (
              <div className="tab-pane active fade-in">
                <form onSubmit={handleLoginSubmit} className="login-frm">
                  <div className="form_group">
                    <input name="email" type="text" id="email" placeholder=" " required />
                    <label htmlFor="email" className="text">Kullanıcı Adı veya E-Posta</label>
                  </div>
                  <div className="form_group">
                    <input name="password" type="password" id="password" placeholder=" " required />
                    <label htmlFor="password" className="text">Şifre</label>
                  </div>
                  
                  <div className="form_group checkbox-group">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Bu cihazda beni hatırla</label>
                  </div>
                  
                  <div className="form_group">
                    <button type="submit" className="sign-up-btn">Giriş Yap</button>
                  </div>
                </form>

                <div className="accordion">
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => setForgotPasswordOpen(!forgotPasswordOpen)}>
                      <button className="accordion-button" type="button">
                        Şifremi unuttum {forgotPasswordOpen ? '▲' : '▼'}
                      </button>
                    </div>
                    {forgotPasswordOpen && (
                      <div className="accordion-collapse fade-in">
                        <form onSubmit={handleForgotPasswordSubmit} className="accordion-body">
                          <div className="form_group">
                            <input name="mail01" type="email" id="mail01" placeholder=" " required />
                            <label htmlFor="mail01" className="text">E-Posta Adresiniz</label>
                          </div>
                          <div className="form_group">
                            <button type="submit" className="sign-up-btn">Giriş Bilgilerimi Gönder</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REGISTER TAB */}
            {activeTab === 'register' && (
              <div className="tab-pane active fade-in">
                <form onSubmit={handleRegisterSubmit} className="FrmNewUser">
                  <div className="form_group flex-row radio-group">
                    <div className="radio-item">
                      <input 
                        type="radio" 
                        id="bireysel" 
                        name="account_type" 
                        checked={accountType === 'individual'}
                        onChange={() => setAccountType('individual')}
                      />
                      <label htmlFor="bireysel">Bireysel</label>
                    </div>
                    <div className="radio-item">
                      <input 
                        type="radio" 
                        id="kurumsal" 
                        name="account_type" 
                        checked={accountType === 'corporate'}
                        onChange={() => setAccountType('corporate')}
                      />
                      <label htmlFor="kurumsal">Kurumsal</label>
                    </div>
                  </div>

                  {accountType === 'corporate' && (
                    <>
                      <div className="form_group">
                        <input name="companyname" type="text" id="companyname" placeholder=" " required />
                        <label htmlFor="companyname" className="text">Şirket Ünvanı</label>
                      </div>
                      <div className="form_group">
                        <textarea name="adres" id="adres" rows="2" placeholder=" " required></textarea>
                        <label htmlFor="adres" className="text">Adres</label>
                      </div>
                      <div className="form_group">
                        <input name="vergidaire" type="text" id="vergidaire" placeholder=" " required />
                        <label htmlFor="vergidaire" className="text">Vergi Dairesi</label>
                      </div>
                      <div className="form_group">
                        <input name="vergino" type="text" id="vergino" placeholder=" " required />
                        <label htmlFor="vergino" className="text">Vergi No</label>
                      </div>
                    </>
                  )}

                  <div className="form_group">
                    <input name="name" type="text" id="name" placeholder=" " required />
                    <label htmlFor="name" className="text">Adınız</label>
                  </div>
                  <div className="form_group">
                    <input name="surname" type="text" id="surname" placeholder=" " required />
                    <label htmlFor="surname" className="text">Soyadınız</label>
                  </div>
                  <div className="form_group">
                    <input name="mail" type="email" id="mail" placeholder=" " required />
                    <label htmlFor="mail" className="text">E-Mail</label>
                  </div>
                  
                  <div className="form_group personbirth">
                    <input name="birth" type="date" id="birth" required />
                    <label htmlFor="birth" className="text date-label">Doğum Tarihi*</label>
                  </div>

                  <div className="form_group phone-group">
                    <div className="phone-code">
                      <select name="countryPhone" id="countryListPhone">
                        <option value="90">🇹🇷 +90</option>
                        <option value="1">🇺🇸 +1</option>
                        <option value="44">🇬🇧 +44</option>
                        <option value="49">🇩🇪 +49</option>
                        <option value="33">🇫🇷 +33</option>
                      </select>
                    </div>
                    <div className="phone-input">
                      <input name="phone" type="tel" id="phone" placeholder=" " required />
                      <label htmlFor="phone" className="text">Telefon</label>
                    </div>
                  </div>

                  <div className="form_group flex-row radio-group tc-radio-group">
                    <div className="radio-item">
                      <input 
                        type="radio" 
                        id="tc" 
                        name="tc_status" 
                        checked={isTc}
                        onChange={() => setIsTc(true)}
                      />
                      <label htmlFor="tc">TC Vatandaşı</label>
                    </div>
                    <div className="radio-item">
                      <input 
                        type="radio" 
                        id="diger" 
                        name="tc_status" 
                        checked={!isTc}
                        onChange={() => setIsTc(false)}
                      />
                      <label htmlFor="diger">TC Vatandaşı Değilim</label>
                    </div>
                  </div>

                  {isTc ? (
                    <div className="form_group persontc">
                      <input name="tcno" type="text" id="tcno" placeholder=" " required maxLength="11" />
                      <label htmlFor="tcno" className="text">TC No</label>
                    </div>
                  ) : (
                    <div className="form_group persondiger">
                      <input name="pasaportno" type="text" id="pasaportno" placeholder=" " required />
                      <label htmlFor="pasaportno" className="text">Pasaport No</label>
                    </div>
                  )}

                  <div className="form_group">
                    <input name="newpassword" type="password" id="newpassword" placeholder=" " required />
                    <label htmlFor="newpassword" className="text">Şifre</label>
                  </div>
                  <div className="form_group">
                    <input name="newpassword2" type="password" id="newpassword2" placeholder=" " required />
                    <label htmlFor="newpassword2" className="text">Şifre (tekrar)</label>
                  </div>

                  <div className="form_group checkbox-group agreements">
                    <input type="checkbox" id="kvkk" required />
                    <label htmlFor="kvkk">KVKK ve Gizlilik politikasını okudum onaylıyorum.</label>
                  </div>
                  
                  <div className="form_group checkbox-group agreements">
                    <input type="checkbox" id="kampanya" />
                    <label htmlFor="kampanya">Kampanya ve duyurulardan haberdar olmak istiyorum.</label>
                  </div>
                  
                  <div className="form_group" style={{marginTop: '20px'}}>
                    <button type="submit" className="sign-up-btn">Üye Ol</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
