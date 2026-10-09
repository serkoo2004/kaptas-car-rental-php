const sharedContact = {
  controllerAddress: 'Cevizlidere Mah. Ceyhun Atıf Kansu Cad. 1250. Sok. No:11/16 Çankaya/Ankara',
  email: 'kaptascarrental@gmail.com',
  operationAddress: 'Pelitli Mah. Şehit Murat Yıldız Sok. No:8/AB Ortahisar/Trabzon',
  phone: '0 (555) 045 62 61',
  tradeName: 'Kaptaş Madencilik İnşaat Taşımacılık Gıda Ve İletişim Sanayi Limited Şirketi',
};

const tr = {
  updated: 'Son güncelleme: 17 Ağustos 2026',
  controller: sharedContact.tradeName,
  controllerAddress: sharedContact.controllerAddress,
  controllerAddressLabel: 'Veri sorumlusu yasal adresi',
  operationAddress: sharedContact.operationAddress,
  operationAddressLabel: 'Araç kiralama operasyon adresi',
  pages: {
    '/kvkk-aydinlatma-metni': {
      eyebrow: 'Kişisel verilerin korunması',
      title: 'KVKK Aydınlatma Metni',
      intro: 'Bu metin, KAPTAŞ Car Rental tarafından sunulan araç kiralama, rezervasyon, üyelik, iletişim ve ödeme hizmetleri sırasında kişisel verilerin nasıl işlendiğini açıklar.',
      sections: [
        ['1. Veri sorumlusu', [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu, KAPTAŞ Car Rental markası altında hizmet sunan ${sharedContact.tradeName}’dir. Veri sorumlusunun yasal adresi ${sharedContact.controllerAddress}; araç kiralama operasyon adresi ise ${sharedContact.operationAddress} adresidir.`,
          `Kişisel verilerle ilgili sorular ve başvurular için ${sharedContact.email} adresi veya ${sharedContact.phone} numarası kullanılabilir.`,
        ]],
        ['2. İşlenen kişisel veri kategorileri', [
          'Kimlik ve iletişim bilgileri: ad soyad, e-posta, telefon; kiralama ve ödeme aşamasında gerekli olduğunda T.C. kimlik numarası, şehir ve adres.',
          'Müşteri işlem bilgileri: seçilen araç, teslim ve iade tarihleri, lokasyon, rezervasyon, teklif, sözleşme ve ödeme işlem bilgileri.',
          'Hesap ve güvenlik bilgileri: parola özeti, doğrulama kayıtları, oturum, IP adresi, tarayıcı bilgisi, işlem zamanı ve güvenlik kayıtları.',
          'İletişim ve talep bilgileri: iletişim formu mesajları, destek talepleri, tercih ve izin kayıtları.',
          'Ödeme kartı bilgileri KAPTAŞ sistemlerinde saklanmaz; kart işlemi yetkili ödeme kuruluşunun güvenli ödeme ortamında yürütülür.',
        ]],
        ['3. İşleme amaçları', [
          'Üyelik hesabının oluşturulması, güvenli girişin sağlanması ve hesap işlemlerinin yürütülmesi.',
          'Araç uygunluğunun kontrolü, fiyatlandırma, rezervasyon, tahsilat, teslim ve iade süreçlerinin yürütülmesi.',
          'Müşteri taleplerinin cevaplanması, operasyon iletişimi, uyuşmazlıkların yönetimi ve hizmet kalitesinin korunması.',
          'Muhasebe, vergi, tüketici hukuku ve yetkili kurum talepleri dahil hukuki yükümlülüklerin yerine getirilmesi.',
          'Dolandırıcılığın önlenmesi, bilgi güvenliği, erişim kontrolü, denetim ve kötüye kullanımın tespiti.',
          'Kampanya ve ticari ileti gönderimi yalnızca ayrıca ve isteğe bağlı olarak verilen izin bulunduğunda yapılır.',
        ]],
        ['4. Hukuki sebepler', [
          'Veriler; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi, bir hakkın tesisi, kullanılması veya korunması ve temel haklara zarar vermemek kaydıyla meşru menfaat hukuki sebeplerine dayanılarak işlenir.',
          'Açık rıza gereken bir işlem varsa bu rıza, hizmet şartlarından ve aydınlatma metninden ayrı olarak istenir. Ticari elektronik ileti tercihi zorunlu değildir ve geri alınabilir.',
        ]],
        ['5. Toplama yöntemi', [
          'Kişisel veriler internet sitesi, üyelik ve iletişim formları, rezervasyon ve ödeme ekranları, e-posta, telefon görüşmeleri, araç teslim süreçleri ve güvenlik günlükleri üzerinden otomatik veya kısmen otomatik yollarla elde edilir.',
        ]],
        ['6. Aktarım yapılan taraflar', [
          'Veriler yalnızca amaçla sınırlı ve gerekli ölçüde; barındırma ve e-posta hizmeti sağlayıcılarına, yetkili ödeme kuruluşlarına, operasyon tedarikçilerine, mali ve hukuki danışmanlara ve kanunen yetkili kamu kurumlarına aktarılabilir.',
          'Yurt dışı aktarım ihtiyacı doğarsa KVKK’nın 9. maddesindeki şartlar ve gerekli güvenceler sağlanmadan aktarım yapılmaz.',
        ]],
        ['7. Saklama ve imha', [
          'Veriler işleme amacı için gereken süre ve ilgili mevzuattaki zamanaşımı veya saklama süreleri boyunca tutulur. Süre sona erdiğinde veri, periyodik kontroller kapsamında silinir, yok edilir veya anonim hale getirilir.',
          'Hesabın kapatılması, mevzuat gereği tutulması gereken işlem kayıtlarının derhal silineceği anlamına gelmez; erişim amacıyla sınırlanır ve yasal sürenin sonunda imha edilir.',
        ]],
        ['8. İlgili kişi hakları', [
          'KVKK’nın 11. maddesi kapsamında verinizin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarılan tarafları bilme, eksik veya yanlış verinin düzeltilmesini isteme haklarına sahipsiniz.',
          'Ayrıca şartları oluştuğunda silme veya yok etme, düzeltme ya da silmenin aktarılan taraflara bildirilmesi, otomatik analiz sonucuna itiraz, hukuka aykırı işleme nedeniyle zararın giderilmesini isteme haklarınız vardır.',
        ]],
        ['9. Başvuru', [
          `Başvurunuzu kayıtlı e-posta adresinizden ${sharedContact.email} adresine veya yazılı ve imzalı olarak ${sharedContact.tradeName}, ${sharedContact.controllerAddress} adresine iletebilirsiniz. Kimlik doğrulama için başvurunun konusu, iletişim bilgileri ve talebinizi destekleyen bilgiler istenebilir. Başvurular en geç 30 gün içinde sonuçlandırılır.`,
          'Başvuru yöntemleri ve gerekli bilgiler KVKK Başvuru sayfasında açıklanmıştır.',
        ]],
      ],
    },
    '/gizlilik-politikasi': {
      eyebrow: 'Gizlilik ve güvenlik',
      title: 'Gizlilik ve Veri Güvenliği Politikası',
      intro: 'KAPTAŞ Car Rental kişisel verileri amaçla sınırlı, ölçülü, güncel ve güvenli biçimde işlemeyi temel ilke kabul eder.',
      sections: [
        ['Veri minimizasyonu', ['Yalnızca rezervasyon, ödeme, teslim, destek ve yasal yükümlülükler için gerekli bilgiler istenir. Serbest metin alanlarına gereksiz özel nitelikli kişisel veri veya kart bilgisi yazılmamalıdır.']],
        ['Erişim ve hesap güvenliği', ['Yönetim paneli rol tabanlı yetkilendirme ile korunur. Parolalar tek yönlü güçlü özetler halinde tutulur; oturum çerezleri HttpOnly, SameSite ve canlı ortamda Secure olarak ayarlanır. Başarısız girişler sınırlandırılır ve kritik işlemler kaydedilir.']],
        ['Uygulama güvenliği', ['Form girdileri sunucuda doğrulanır, veritabanı işlemlerinde parametreli sorgular kullanılır, durum değiştiren istekler CSRF kontrolünden geçirilir ve erişim kayıtları denetim amacıyla tutulur. Gizli anahtarlar web kök dizininin dışında saklanır.']],
        ['Ödeme güvenliği', ['Kart numarası, son kullanma tarihi ve güvenlik kodu KAPTAŞ sunucularına kaydedilmez. Ödeme, yetkili ödeme kuruluşunun güvenli ödeme formu ve 3D Secure doğrulaması üzerinden tamamlanır; rezervasyon yalnızca doğrulanmış ödeme sonucundan sonra kesinleşir.']],
        ['Saklama ve yedekleme', ['Veriler belirlenen saklama süreleriyle sınırlı tutulur. Yedeklere erişim kısıtlanır; yedeklerin bütünlüğü ve geri yüklenebilirliği düzenli olarak kontrol edilir. Süresi dolan kayıtlar güvenli biçimde silinir veya anonim hale getirilir.']],
        ['Hizmet sağlayıcılar', ['Barındırma, e-posta ve ödeme hizmeti sağlayıcıları yalnızca sundukları hizmet için gereken verilere erişir. Tedarikçi seçimi, sözleşmeler ve erişimler veri güvenliği bakımından gözden geçirilir.']],
        ['İhlal yönetimi', ['Yetkisiz erişim veya veri ihlali şüphesinde erişim sınırlandırılır, olay kayıt altına alınır, etkiler değerlendirilir ve gerekli olması halinde ilgili kişiler ile Kişisel Verileri Koruma Kurumu mevzuata uygun biçimde bilgilendirilir.']],
        ['Çocukların verileri', ['Hizmet sürücü belgesi ve yaş koşulları nedeniyle çocuklara yönelik değildir. Bir çocuğa ait verinin yanlışlıkla iletildiği düşünülüyorsa silinmesi için bizimle iletişime geçilmelidir.']],
      ],
    },
    '/cerez-politikasi': {
      eyebrow: 'Çerezler ve yerel depolama',
      title: 'Çerez Politikası',
      intro: 'Site şu anda yalnızca hizmetin çalışması ve dil/para birimi tercihlerinin hatırlanması için gerekli teknolojileri kullanır.',
      sections: [
        ['Zorunlu oturum çerezi', ['kaptas_session çerezi güvenli giriş, hesap oturumu ve istek güvenliği için kullanılır. En fazla 30 gün süreli bu çerez hizmetin çalışması için zorunludur, reklam amacı taşımaz ve JavaScript tarafından okunamaz.']],
        ['Tercih kayıtları', ['kaptas-language ve kaptas-currency değerleri tarayıcının yerel depolamasında dil ve para birimi seçiminizi hatırlamak için tutulur. Bu kayıtlar reklam profili oluşturmaz.']],
        ['Analitik ve reklam teknolojileri', ['Sitede şu anda analitik, davranışsal reklam veya pazarlama çerezi etkin değildir. Böyle bir teknoloji eklenirse çalıştırılmadan önce açık bilgi verilecek, zorunlu olmayan tercihler kapalı gelecek ve kullanıcı tercihini sonradan değiştirebilecektir.']],
        ['Kayıtları yönetme', ['Tarayıcı ayarlarından çerezleri ve site verilerini silebilir veya engelleyebilirsiniz. Zorunlu oturum çerezinin engellenmesi giriş ve hesap işlevlerinin çalışmamasına neden olabilir.']],
      ],
    },
    '/kvkk-basvuru': {
      eyebrow: 'İlgili kişi başvurusu',
      title: 'KVKK Başvuru Yöntemi',
      intro: 'Kişisel verilerinizle ilgili KVKK’nın 11. maddesindeki haklarınızı aşağıdaki yöntemle kullanabilirsiniz.',
      sections: [
        ['Başvuru kanalı', [`Daha önce sistemde doğruladığınız veya bizimle iletişim kurduğunuz e-posta adresinden ${sharedContact.email} adresine “KVKK İlgili Kişi Başvurusu” konusuyla başvurabilir ya da yazılı ve imzalı başvurunuzu ${sharedContact.tradeName}, ${sharedContact.controllerAddress} adresine gönderebilirsiniz.`]],
        ['Başvuruda bulunması gerekenler', ['Ad soyad, iletişim bilgisi, talebin açık ve anlaşılır açıklaması, varsa işlem veya rezervasyon numarası ve talebi destekleyen bilgi ve belgeler belirtilmelidir. Başkasına ait veri için başvuru yapılıyorsa yetkiyi gösteren belge sunulmalıdır.']],
        ['Kimlik doğrulama', ['Veri güvenliği nedeniyle yalnızca gerekli ölçüde ek doğrulama istenebilir. T.C. kimlik belgesi gibi belgeler talep edilirse gereksiz alanlar kapatılmalı; e-posta ile kart bilgisi, parola veya SMS doğrulama kodu gönderilmemelidir.']],
        ['Cevap süresi ve ücret', ['Başvuru, niteliğine göre en kısa sürede ve en geç 30 gün içinde ücretsiz sonuçlandırılır. İşlemin ayrıca maliyet gerektirmesi halinde yalnızca Kurul tarafından belirlenen tarifedeki ücret talep edilebilir.']],
        ['Kurula şikâyet', ['Başvurunun reddedilmesi, cevabın yetersiz bulunması veya süresinde cevap verilmemesi halinde ilgili kişi, kanundaki süreler içinde Kişisel Verileri Koruma Kuruluna şikâyette bulunabilir.']],
      ],
    },
  },
};

const en = {
  updated: 'Last updated: 17 August 2026',
  controller: sharedContact.tradeName,
  controllerAddress: sharedContact.controllerAddress,
  controllerAddressLabel: 'Data controller registered address',
  operationAddress: sharedContact.operationAddress,
  operationAddressLabel: 'Car rental operations address',
  pages: {
    '/kvkk-aydinlatma-metni': { eyebrow: 'Personal data protection', title: 'KVKK Privacy Notice', intro: 'This notice explains how personal data is processed during account, contact, reservation, rental and payment services.', sections: [
      ['Data controller', [`The data controller operating under the KAPTAŞ Car Rental brand is ${sharedContact.tradeName}. Its registered address is ${sharedContact.controllerAddress}, and its car rental operations address is ${sharedContact.operationAddress}. Questions and requests may be sent to ${sharedContact.email} or ${sharedContact.phone}.`]],
      ['Data and purposes', ['Identity, contact, reservation, rental, address, payment transaction, account security, IP/device log and communication data may be processed to provide the service, fulfil contracts and legal duties, prevent fraud, secure the system and answer requests. Card details are not stored by KAPTAŞ.']],
      ['Legal grounds and collection', ['Data is collected through the website, forms, payment flow, email, phone, delivery process and security logs. Processing relies on contract performance, legal obligations, establishment or protection of rights and legitimate interests that do not override fundamental rights. Optional marketing uses separate consent.']],
      ['Recipients and international transfers', ['Necessary data may be shared with hosting and email providers, authorised payment providers, operational vendors, professional advisers and authorised public bodies. International transfers are made only when the requirements and safeguards under Article 9 of the KVKK are met.']],
      ['Retention and rights', ['Data is retained only for the purpose and applicable statutory periods, then deleted, destroyed or anonymised. You may exercise the rights listed in Article 11 of the KVKK, including access, correction, deletion where applicable, recipient information, objection to automated results and compensation for unlawful processing.']],
      ['Application', [`Send requests from your registered email to ${sharedContact.email}, or send a signed written application to ${sharedContact.tradeName}, ${sharedContact.controllerAddress}. Requests are answered within 30 days at the latest, subject to identity verification.`]],
    ]},
    '/gizlilik-politikasi': { eyebrow: 'Privacy and security', title: 'Privacy and Data Security Policy', intro: 'KAPTAŞ Car Rental processes personal data lawfully, fairly, accurately, securely and only as necessary.', sections: [
      ['Data minimisation', ['Only information needed for reservations, payments, delivery, support and legal duties is requested. Do not enter card information or unnecessary sensitive data in free-text fields.']],
      ['Technical and organisational measures', ['Role-based admin access, password hashing, secure session cookies, CSRF protection, server-side validation, parameterised database queries, rate limits, audit logs and secrets outside the public web directory are used.']],
      ['Payment and retention', ['Card details are handled by the authorised payment provider and are not stored by KAPTAŞ. Data and protected backups are retained for defined purposes and legal periods, then securely deleted or anonymised.']],
      ['Incident response', ['Suspected unauthorised access is contained, recorded and assessed. Affected persons and the authority are notified when required by law.']],
    ]},
    '/cerez-politikasi': { eyebrow: 'Cookies and local storage', title: 'Cookie Policy', intro: 'The site currently uses only technologies required for the service and for remembering language and currency preferences.', sections: [
      ['Essential session cookie', ['kaptas_session enables secure sign-in and request security for up to 30 days. It is not used for advertising and cannot be read by JavaScript.']],
      ['Preferences', ['kaptas-language and kaptas-currency are stored locally in your browser and do not create advertising profiles.']],
      ['Analytics and advertising', ['No analytics or behavioural advertising cookies are currently active. If introduced, optional technologies will remain off until informed consent is given and the choice will remain revocable.']],
      ['Browser controls', ['You may delete or block site data in your browser. Blocking the essential session cookie may prevent sign-in and account functions.']],
    ]},
    '/kvkk-basvuru': { eyebrow: 'Data subject request', title: 'KVKK Application Procedure', intro: 'You may exercise your rights under Article 11 of the KVKK through the channel below.', sections: [
      ['How to apply', [`Email ${sharedContact.email} from an address previously verified or used with us, using the subject “KVKK Data Subject Request”, or send a signed written application to ${sharedContact.tradeName}, ${sharedContact.controllerAddress}.`]],
      ['Required information', ['State your name, contact details, clear request, relevant reservation or transaction number and supporting documents. We may request proportionate identity verification to protect your data. Never email passwords, card information or verification codes.']],
      ['Response', ['Applications are answered free of charge as soon as possible and within 30 days at the latest, except for costs permitted under the official tariff.']],
    ]},
  },
};

const ar = {
  updated: 'آخر تحديث: 17 أغسطس 2026',
  controller: sharedContact.tradeName,
  controllerAddress: sharedContact.controllerAddress,
  controllerAddressLabel: 'العنوان المسجل لمسؤول البيانات',
  operationAddress: sharedContact.operationAddress,
  operationAddressLabel: 'عنوان عمليات تأجير السيارات',
  pages: {
    '/kvkk-aydinlatma-metni': { eyebrow: 'حماية البيانات الشخصية', title: 'إشعار الخصوصية وفق KVKK', intro: 'يوضح هذا الإشعار كيفية معالجة البيانات الشخصية أثناء إنشاء الحساب والتواصل والحجز والتأجير والدفع.', sections: [
      ['مسؤول البيانات', [`مسؤول البيانات العامل تحت علامة KAPTAŞ Car Rental هو ${sharedContact.tradeName}. العنوان المسجل هو ${sharedContact.controllerAddress}، وعنوان عمليات تأجير السيارات هو ${sharedContact.operationAddress}. يمكن إرسال الأسئلة والطلبات إلى ${sharedContact.email} أو الاتصال على ${sharedContact.phone}.`]],
      ['البيانات والأغراض', ['قد تتم معالجة بيانات الهوية والاتصال والحجز والتأجير والعنوان ومعاملة الدفع وأمن الحساب وسجلات IP والجهاز والمراسلات لتقديم الخدمة وتنفيذ العقد والالتزامات القانونية ومنع الاحتيال وتأمين النظام والرد على الطلبات. لا تحتفظ KAPTAŞ ببيانات البطاقة.']],
      ['الأساس القانوني والجمع', ['تجمع البيانات عبر الموقع والنماذج والدفع والبريد والهاتف وتسليم السيارة وسجلات الأمان. تعتمد المعالجة على تنفيذ العقد والالتزامات القانونية وحماية الحقوق والمصلحة المشروعة دون الإضرار بالحقوق الأساسية. التسويق الاختياري يتطلب موافقة منفصلة.']],
      ['المستلمون والنقل الدولي', ['قد تشارك البيانات اللازمة مع مزودي الاستضافة والبريد ومزودي الدفع المعتمدين وموردي التشغيل والمستشارين والجهات الرسمية. لا يتم النقل الدولي إلا بعد استيفاء شروط وضمانات المادة 9 من KVKK.']],
      ['الاحتفاظ والحقوق', ['تحتفظ البيانات للغرض والمدد القانونية ثم تحذف أو تتلف أو تجعل مجهولة. يمكن ممارسة حقوق المادة 11 من KVKK بما يشمل الوصول والتصحيح والحذف عند انطباقه ومعرفة المستلمين والاعتراض والتعويض عن المعالجة غير القانونية.']],
      ['الطلب', [`أرسل الطلب من بريدك المسجل إلى ${sharedContact.email} أو أرسل طلباً مكتوباً وموقعاً إلى ${sharedContact.tradeName}، ${sharedContact.controllerAddress}. تتم الإجابة خلال 30 يوماً كحد أقصى بعد التحقق من الهوية.`]],
    ]},
    '/gizlilik-politikasi': { eyebrow: 'الخصوصية والأمان', title: 'سياسة الخصوصية وأمن البيانات', intro: 'تعالج KAPTAŞ Car Rental البيانات بصورة قانونية ودقيقة وآمنة وبالقدر الضروري فقط.', sections: [
      ['تقليل البيانات', ['لا تطلب إلا المعلومات الضرورية للحجز والدفع والتسليم والدعم والالتزامات القانونية. لا تكتب بيانات البطاقة أو بيانات حساسة غير ضرورية في الحقول الحرة.']],
      ['تدابير الأمان', ['تستخدم صلاحيات الإدارة حسب الدور وتجزئة كلمات المرور وملفات جلسة آمنة وحماية CSRF والتحقق على الخادم والاستعلامات المعلّمة وتحديد المعدل وسجلات التدقيق وحفظ الأسرار خارج مجلد الويب العام.']],
      ['الدفع والاحتفاظ', ['يعالج مزود الدفع المعتمد بيانات البطاقة ولا تحتفظ بها KAPTAŞ. تحفظ البيانات والنسخ الاحتياطية المحمية للأغراض والمدد القانونية ثم تحذف أو تجعل مجهولة بأمان.']],
      ['إدارة الحوادث', ['يتم احتواء أي وصول غير مصرح به وتسجيله وتقييمه، وإبلاغ الأشخاص والجهة المختصة عندما يفرض القانون ذلك.']],
    ]},
    '/cerez-politikasi': { eyebrow: 'ملفات الارتباط والتخزين المحلي', title: 'سياسة ملفات الارتباط', intro: 'يستخدم الموقع حالياً التقنيات الضرورية للخدمة ولحفظ تفضيل اللغة والعملة فقط.', sections: [
      ['ملف الجلسة الضروري', ['يستخدم kaptas_session لمدة تصل إلى 30 يوماً لتسجيل الدخول الآمن وحماية الطلبات، ولا يستخدم للإعلانات ولا تستطيع JavaScript قراءته.']],
      ['التفضيلات', ['يحفظ kaptas-language وkaptas-currency محلياً في المتصفح ولا ينشئان ملفاً إعلانياً.']],
      ['التحليلات والإعلانات', ['لا توجد حالياً ملفات تحليل أو إعلان سلوكي. إذا أضيفت لاحقاً ستبقى مغلقة حتى إعطاء موافقة مستنيرة قابلة للسحب.']],
      ['إعدادات المتصفح', ['يمكن حذف بيانات الموقع أو حظرها من المتصفح. قد يؤدي حظر ملف الجلسة الضروري إلى توقف تسجيل الدخول ووظائف الحساب.']],
    ]},
    '/kvkk-basvuru': { eyebrow: 'طلب صاحب البيانات', title: 'طريقة التقديم وفق KVKK', intro: 'يمكنك ممارسة حقوق المادة 11 من KVKK عبر القناة التالية.', sections: [
      ['طريقة التقديم', [`أرسل من بريد سبق التحقق منه أو استخدامه معنا إلى ${sharedContact.email} بعنوان “KVKK Data Subject Request”، أو أرسل طلباً مكتوباً وموقعاً إلى ${sharedContact.tradeName}، ${sharedContact.controllerAddress}.`]],
      ['المعلومات المطلوبة', ['اذكر الاسم وبيانات الاتصال والطلب بوضوح ورقم الحجز أو المعاملة والوثائق الداعمة. قد نطلب تحققاً متناسباً من الهوية. لا ترسل كلمات المرور أو بيانات البطاقة أو رموز التحقق بالبريد.']],
      ['مدة الرد', ['تتم الإجابة مجاناً في أقرب وقت وخلال 30 يوماً كحد أقصى، باستثناء التكاليف التي يسمح بها التعرف الرسمي.']],
    ]},
  },
};

export const legalContent = { ar, en, tr };
