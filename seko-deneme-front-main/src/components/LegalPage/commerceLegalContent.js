const company = {
  tradeName: 'Kaptaş Madencilik İnşaat Taşımacılık Gıda Ve İletişim Sanayi Limited Şirketi',
  registeredAddress: 'Cevizlidere Mah. Ceyhun Atıf Kansu Cad. 1250. Sok. No:11/16 Çankaya/Ankara',
  operationAddress: 'Pelitli Mah. Şehit Murat Yıldız Sok. No:8/AB Ortahisar/Trabzon',
  phone: '0 (555) 045 62 61',
  email: 'kaptascarrental@gmail.com',
};

const tr = {
  '/teslimat-ve-iade-sartlari': {
    authority: 'consumer',
    eyebrow: 'Hizmet teslimi ve bedel iadesi',
    title: 'Teslimat ve İade Şartları',
    intro: 'Araç kiralama hizmetinin nasıl teslim edildiğini, aracın nasıl iade edileceğini ve iptal veya bedel iadesi taleplerinin nasıl ele alındığını açıklar.',
    sections: [
      ['1. Hizmetin niteliği', ['Bu sitede fiziksel ürün veya kargo teslimatı yapılmaz. Satın alınan hizmet, rezervasyonda belirtilen araç veya benzeri grubun belirli tarih aralığında kullanıma sunulmasıdır.']],
      ['2. Rezervasyonun kesinleşmesi', ['Araç seçimi tek başına kesin rezervasyon oluşturmaz. Rezervasyon; sürücü bilgilerinin doğrulanması, seçilen tarih aralığında stok bulunması ve ödemenin yetkili ödeme kuruluşu tarafından başarılı olarak doğrulanmasından sonra kesinleşir.']],
      ['3. Aracın teslimi', [`Araç, rezervasyonda belirtilen tarih, saat ve aktif teslim noktasında teslim edilir. Kiralayan; geçerli sürücü belgesi, kimlik veya pasaport ile rezervasyon ve ödeme doğrulaması için gereken belgeleri ibraz eder. Operasyon adresi: ${company.operationAddress}.`]],
      ['4. Teslim kontrolü', ['Araç tesliminde yakıt seviyesi, kilometre, mevcut hasarlar ve teslim edilen ekipman birlikte kontrol edilerek teslim kaydına alınır. Kiralama sözleşmesi ve teslim formu imzalanmadan araç kullanıma verilmez.']],
      ['5. Aracın iadesi', ['Araç, sözleşmede belirtilen tarih ve saatte, kararlaştırılan iade noktasına; teslim alındığı yakıt seviyesiyle ve teslim edilen ekipmanlarla birlikte getirilmelidir. Gecikme, eksik yakıt, kayıp ekipman, trafik cezası ve kullanıcı kusurundan doğan hasarlar kiralama sözleşmesine göre ayrıca değerlendirilir.']],
      ['6. İptal ve değişiklik talebi', [`İptal veya tarih değişikliği talebi ${company.email} adresine yazılı olarak iletilmelidir. Talep, rezervasyon kaydı ve ödeme öncesinde gösterilen kiralama koşullarına göre değerlendirilir. Kira başlangıcına 48 saatten az kalan ön ödemeli rezervasyonlarda bedel iadesi yapılmayabilir.`]],
      ['7. Sağlayıcı kaynaklı iptal', ['Kesinleşmiş rezervasyonun sağlayıcı kaynaklı nedenle karşılanamaması halinde, tüketicinin kabul etmesi durumunda eşdeğer bir araç sunulur. Tüketici bunu kabul etmezse tahsil edilen hizmet bedeli, kullanılan ödeme aracına uygun biçimde iade edilir.']],
      ['8. Başarısız veya mükerrer ödeme', ['3D Secure doğrulaması tamamlanmayan işlem rezervasyonu kesinleştirmez. Mükerrer veya hatalı tahsilat iddiası işlem numarasıyla incelenir; iade gerektiğinde ödeme kuruluşu ve kartı veren kuruluşun işlem süreleri uygulanır.']],
      ['9. İade yöntemi', ['Onaylanan iadeler, mevzuatın zorunlu kıldığı haller saklı kalmak üzere, ödemede kullanılan araca uygun olarak ve tüketiciye ek masraf yüklenmeden gerçekleştirilir. Banka veya kart kuruluşunun tutarı hesaba yansıtma süresi KAPTAŞ kontrolü dışındadır.']],
    ],
  },
  '/on-bilgilendirme-formu': {
    authority: 'consumer',
    eyebrow: 'Sözleşme öncesi zorunlu bilgilendirme',
    title: 'Ön Bilgilendirme Formu',
    intro: 'Bu form, internet sitesi üzerinden kurulacak belirli tarihli araç kiralama sözleşmesinden ve ödeme yükümlülüğünden önce tüketicinin bilgilendirilmesi amacıyla hazırlanmıştır. Seçilen araç, dönem, teslim noktası ve toplam tutar ödeme ekranında bu formun ayrılmaz parçası olarak gösterilir.',
    sections: [
      ['1. Sağlayıcı bilgileri', [`Hizmet sağlayıcı: ${company.tradeName}. Kayıtlı adres: ${company.registeredAddress}. Araç kiralama operasyon adresi: ${company.operationAddress}. Telefon: ${company.phone}. E-posta: ${company.email}.`]],
      ['2. Hizmetin temel nitelikleri', ['Hizmet; ödeme ekranında marka/modeli veya benzeri araç grubu, yakıt ve vites türü, kişi ve kapı sayısı, teslim ve iade tarihleri, aktif lokasyon ve stok durumu gösterilen aracın belirli süreyle kiralanmasıdır. Kesin araç tahsisi, sürücü ve belge kontrolleri ile ödeme doğrulamasından sonra yapılır.']],
      ['3. Fiyat, vergi ve ek masraflar', ['Günlük kiralama bedeli, para birimi, gün sayısı ve vergiler dahil ödenecek toplam tutar ödeme emrinden hemen önce gösterilir. Tüketicinin ayrıca açıkça onaylamadığı ek ürün veya hizmet için ücret alınmaz.', 'Gecikme, eksik yakıt, trafik cezası, HGS/OGS geçişi, kayıp ekipman veya kullanıcı kusurundan doğan hasar gibi kiralama sonrasında ortaya çıkabilecek bedeller, yalnızca kiralama sözleşmesindeki şartlar ve doğrulanabilir kayıtlar kapsamında ayrıca değerlendirilir.']],
      ['4. Ödeme ve rezervasyonun kurulması', ['Kart işlemi yetkili ödeme kuruluşunun 3D Secure destekli güvenli ortamında gerçekleştirilir. Kart numarası, son kullanma tarihi ve güvenlik kodu KAPTAŞ sistemlerinde saklanmaz. Rezervasyon; zorunlu bilgilerin ve onayların tamamlanması, stok kontrolü ve başarılı ödeme doğrulaması sonrasında kesinleşir.']],
      ['5. Hizmetin ifası ve teslim', [`Araç, rezervasyonda gösterilen tarih ve saatte seçilen aktif lokasyonda; geçerli sürücü belgesi, kimlik veya pasaport ve gerekli güvenlik kontrolleri tamamlandıktan sonra teslim edilir. Operasyon adresi: ${company.operationAddress}. Fiziksel ürün sevkiyatı veya kargo teslimatı yapılmaz.`]],
      ['6. İptal, değişiklik ve bedel iadesi', [`İptal veya değişiklik talepleri ${company.email} adresine yazılı olarak iletilir. Uygulanacak süreler ve iade koşulları, ödeme öncesinde erişilebilen Teslimat ve İade Şartları ile Kiralama Koşullarında açıklanır. Sağlayıcı kaynaklı ifa imkânsızlığında eşdeğer araç kabul edilmezse tahsil edilen bedel ödeme aracına uygun biçimde iade edilir.`]],
      ['7. Cayma hakkı istisnası', ['Mesafeli Sözleşmeler Yönetmeliği uyarınca belirli bir tarihte veya dönemde yapılması gereken araba kiralama hizmetlerinde 14 günlük cayma hakkı uygulanmaz. Bu istisna, hizmetin hiç veya gereği gibi ifa edilmemesinden doğan tüketici haklarını ortadan kaldırmaz.']],
      ['8. Şikâyet ve uyuşmazlık çözümü', [`Talep ve şikâyetler ${company.email} adresine veya ${company.phone} numarasına iletilebilir. Tüketici, yürürlükteki parasal sınırlar kapsamında yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetine; diğer hallerde Tüketici Mahkemesine başvurabilir.`]],
      ['9. Kişisel veriler', ['Kimlik, iletişim, adres, rezervasyon ve ödeme işlem bilgileri KVKK Aydınlatma Metninde açıklanan amaç ve hukuki sebeplerle işlenir. Pazarlama izni hizmetin şartı değildir ve ayrı olarak alınır.']],
      ['10. Teyit ve ödeme yükümlülüğü', ['Tüketici, ödeme düğmesine basmadan önce hizmetin temel niteliklerini, tarihleri, lokasyonu, toplam tutarı ve bu formu inceleyip onaylar. Ödeme düğmesi açıkça ödeme yükümlülüğü doğuran sipariş verildiğini gösterir. Elektronik onayın tarih, sürüm, işlem ve güvenlik kayıtları mevzuata uygun olarak saklanır.']],
    ],
  },
  '/mesafeli-satis-sozlesmesi': {
    authority: 'consumer',
    eyebrow: 'Mesafeli hizmet sözleşmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    intro: 'İnternet sitesi üzerinden kurulan belirli tarihli araç kiralama hizmeti sözleşmesinin temel hükümleridir. Rezervasyon ekranındaki araç, tarih, lokasyon ve toplam bedel bilgileri bu sözleşmenin ayrılmaz parçasıdır.',
    sections: [
      ['1. Taraflar', [`Sağlayıcı: ${company.tradeName}. Kayıtlı adres: ${company.registeredAddress}. Operasyon adresi: ${company.operationAddress}. Telefon: ${company.phone}. E-posta: ${company.email}.`, 'Tüketici; rezervasyon ve ödeme ekranında adı, iletişim bilgileri ve fatura adresi bulunan gerçek veya tüzel kişidir.']],
      ['2. Sözleşmenin konusu', ['Sözleşmenin konusu, tüketicinin elektronik ortamda seçtiği araç veya benzeri araç grubunun, belirtilen teslim ve iade tarihleri arasında kullanıma sunulmasına ilişkin tarafların hak ve yükümlülükleridir.']],
      ['3. Ön bilgilendirme ve hizmet bilgileri', ['Aracın temel nitelikleri, günlük fiyatı, para birimi, kiralama süresi, teslim noktası ve ödenecek toplam tutar sipariş ve güvenli ödeme adımlarında gösterilir. Tüketici, ödeme emrinden önce bu bilgileri ve ilgili yasal metinleri inceleyebildiğini kabul eder.']],
      ['4. Sözleşmenin kurulması', ['Sözleşme; tüketicinin zorunlu bilgileri tamamlaması, kiralama koşullarını, teslimat ve iade şartlarını, bu sözleşmeyi elektronik olarak onaylaması ve ödemenin başarıyla doğrulanmasıyla kurulur. Stok kontrolü ödeme sonucunda tekrar yapılır.']],
      ['5. Fiyat ve ödeme', ['Toplam hizmet bedeli ödeme ekranında seçilen para birimiyle gösterilir. Kart işlemi yetkili ödeme kuruluşunun güvenli ödeme ortamında ve 3D Secure doğrulamasıyla yürütülür. Kart numarası, son kullanma tarihi ve güvenlik kodu KAPTAŞ sistemlerinde saklanmaz.']],
      ['6. Hizmetin ifası', ['Araç, rezervasyonda belirtilen tarih ve saatte kararlaştırılan teslim noktasında, kimlik ve sürücü belgesi kontrolleri ile kiralama ve teslim formunun tamamlanmasından sonra kullanıma sunulur. Tüketicinin yaş, ehliyet veya güvenlik koşullarını karşılamaması teslimi engelleyebilir.']],
      ['7. Cayma hakkına ilişkin istisna', ['Mesafeli Sözleşmeler Yönetmeliği uyarınca belirli bir tarihte veya dönemde yapılması gereken araba kiralama hizmetlerine ilişkin sözleşmelerde 14 günlük cayma hakkı kullanılamaz. Bu istisna, hizmetin hiç veya gereği gibi ifa edilmemesinden doğan yasal hakları ortadan kaldırmaz.']],
      ['8. İptal, değişiklik ve iade', ['Tüketici talepleri, Teslimat ve İade Şartları ile Kiralama Koşullarına göre değerlendirilir. Sağlayıcı kaynaklı ifa imkânsızlığında tüketici bilgilendirilir; kabul edilen eşdeğer hizmet sunulamazsa tahsil edilen bedel kullanılan ödeme aracına uygun olarak iade edilir.']],
      ['9. Tarafların yükümlülükleri', ['Sağlayıcı, teyit edilen kiralama hizmetini sözleşmeye uygun sunmakla; tüketici ise doğru bilgi ve belge vermek, aracı hukuka ve sözleşmeye uygun kullanmak, zamanında iade etmek ve kullanımdan doğan sorumlulukları yerine getirmekle yükümlüdür.']],
      ['10. Kişisel veriler ve delil', ['Kişisel veriler KVKK Aydınlatma Metnine göre işlenir. Elektronik onay kaydı, sözleşme sürümü, tarih, IP adresi, rezervasyon, ödeme ve iletişim kayıtları mevzuata uygun olarak saklanır ve uyuşmazlıkta delil olarak kullanılabilir.']],
      ['11. Uyuşmazlıklar', ['Tüketici, yürürlükteki parasal sınırlar kapsamında yerleşim yerindeki veya tüketici işleminin yapıldığı yerdeki Tüketici Hakem Heyetine; diğer hallerde Tüketici Mahkemesine başvurabilir.']],
      ['12. Yürürlük', ['Tüketici, ödeme öncesindeki kutuyu işaretleyerek sözleşmeyi okuduğunu ve elektronik ortamda kabul ettiğini beyan eder. Sözleşme, başarılı ödeme ve rezervasyon teyidiyle yürürlüğe girer.']],
    ],
  },
};

const en = {
  '/teslimat-ve-iade-sartlari': { authority: 'consumer', eyebrow: 'Service delivery and refunds', title: 'Delivery and Refund Conditions', intro: 'Explains how the car rental service is delivered, how the vehicle is returned and how cancellation or refund requests are handled.', sections: [
    ['Service delivery', ['No physical product is shipped. The service is the provision of the selected vehicle or a similar group for the dates shown in the booking. A booking becomes final only after driver, stock and payment verification.']],
    ['Collection and return', [`The vehicle is collected at the confirmed time and active location after identity, licence and agreement checks. It must be returned at the agreed time and location with the recorded fuel level and equipment. Operations address: ${company.operationAddress}.`]],
    ['Cancellation and changes', [`Requests must be sent in writing to ${company.email} and are assessed under the booking and rental conditions displayed before payment. Prepaid bookings cancelled less than 48 hours before collection may be non-refundable.`]],
    ['Provider cancellation and refunds', ['If a confirmed booking cannot be supplied for a provider-related reason, an equivalent vehicle may be offered with the customer’s approval. If declined, the collected service fee is returned through the original payment method. Failed 3D Secure transactions do not create a confirmed booking.']],
  ]},
  '/on-bilgilendirme-formu': { authority: 'consumer', eyebrow: 'Mandatory pre-contract information', title: 'Preliminary Information Form', intro: 'This form provides the information required before a fixed-date car rental agreement and payment obligation are created. The selected vehicle, dates, location and checkout total form an integral part of it.', sections: [
    ['Provider and service', [`Provider: ${company.tradeName}. Registered address: ${company.registeredAddress}. Operations: ${company.operationAddress}. Phone: ${company.phone}. Email: ${company.email}. The service is the fixed-period rental of the vehicle or similar group shown during checkout.`]],
    ['Price and payment', ['The daily price, currency, rental duration, taxes and total payable are displayed immediately before payment. No optional charge is collected without express approval. Card processing takes place in an authorised provider’s 3D Secure environment and card credentials are not stored by KAPTAŞ.']],
    ['Delivery, cancellation and refund', ['The vehicle is delivered at the confirmed active location after identity, licence and agreement checks. Cancellation, change and refund requests follow the Rental Terms and Delivery and Refund Conditions available before payment.']],
    ['Withdrawal exception', ['The 14-day withdrawal right does not apply to car rental services to be performed on a specified date or period. Statutory rights for non-performance or defective performance remain reserved.']],
    ['Complaints, privacy and confirmation', [`Requests may be sent to ${company.email}. Consumers may apply to the competent Consumer Arbitration Committee or Consumer Court. Personal data is processed under the KVKK Privacy Notice. The customer reviews and confirms this form before placing an order carrying a payment obligation.`]],
  ]},
  '/mesafeli-satis-sozlesmesi': { authority: 'consumer', eyebrow: 'Distance service agreement', title: 'Distance Sales Agreement', intro: 'These are the principal terms for the fixed-date car rental service contracted online. The vehicle, dates, location and total shown during checkout form an integral part of this agreement.', sections: [
    ['Parties', [`Provider: ${company.tradeName}, ${company.registeredAddress}. Operations: ${company.operationAddress}. Phone: ${company.phone}. Email: ${company.email}.`, 'The consumer is the person or entity whose details appear in the booking and payment flow.']],
    ['Service and formation', ['The agreement concerns provision of the selected vehicle or a similar group for the confirmed dates. It is formed after required details and electronic approvals are completed, payment is verified and availability is confirmed.']],
    ['Price and payment', ['Vehicle features, dates, location, currency and total are displayed before payment. Card processing takes place in the authorised payment provider’s 3D Secure environment; card credentials are not stored by KAPTAŞ.']],
    ['Withdrawal exception', ['Under the Turkish Distance Contracts Regulation, the 14-day withdrawal right does not apply to car rental services to be performed on a specified date or period. Statutory rights arising from non-performance or defective performance remain reserved.']],
    ['Cancellation, privacy and disputes', ['Cancellation and refunds follow the Delivery and Refund Conditions and Rental Terms. Personal data is processed under the KVKK Privacy Notice. Consumers may apply to the competent Consumer Arbitration Committee or Consumer Court subject to applicable limits.']],
    ['Acceptance', ['The consumer confirms having read and electronically accepted this agreement before payment. It takes effect following successful payment and booking confirmation.']],
  ]},
};

const ar = {
  '/teslimat-ve-iade-sartlari': { authority: 'consumer', eyebrow: 'تسليم الخدمة واسترداد المبالغ', title: 'شروط التسليم والاسترداد', intro: 'توضح كيفية تسليم خدمة تأجير السيارة وإعادتها ومعالجة طلبات الإلغاء أو الاسترداد.', sections: [
    ['تسليم الخدمة', ['لا يوجد شحن لمنتج مادي. الخدمة هي إتاحة السيارة المختارة أو فئة مماثلة للفترة المحددة. لا يؤكد الحجز إلا بعد التحقق من السائق والمخزون والدفع.']],
    ['الاستلام والإعادة', [`تسلم السيارة في الموعد والموقع المؤكدين بعد فحص الهوية والرخصة والعقد، وتعاد في الموعد والمكان المتفق عليهما. عنوان العمليات: ${company.operationAddress}.`]],
    ['الإلغاء والاسترداد', [`ترسل الطلبات كتابياً إلى ${company.email} وتقيم وفق شروط الحجز المعروضة قبل الدفع. قد لا تسترد الحجوزات المسبقة الملغاة قبل أقل من 48 ساعة. إذا ألغت الشركة حجزاً مؤكداً ولم يقبل العميل سيارة مماثلة، يعاد المبلغ بوسيلة الدفع الأصلية.`]],
  ]},
  '/on-bilgilendirme-formu': { authority: 'consumer', eyebrow: 'المعلومات الإلزامية قبل التعاقد', title: 'نموذج المعلومات الأولية', intro: 'يقدم هذا النموذج المعلومات المطلوبة قبل إنشاء عقد تأجير سيارة محدد التاريخ والتزام الدفع. السيارة والتواريخ والموقع والمبلغ الإجمالي المعروضة عند الدفع جزء لا يتجزأ منه.', sections: [
    ['مقدم الخدمة والخدمة', [`مقدم الخدمة: ${company.tradeName}. العنوان المسجل: ${company.registeredAddress}. عنوان العمليات: ${company.operationAddress}. الهاتف: ${company.phone}. البريد: ${company.email}. الخدمة هي تأجير السيارة أو الفئة المماثلة المعروضة لمدة محددة.`]],
    ['السعر والدفع', ['يعرض السعر اليومي والعملة والمدة والضرائب والمبلغ الإجمالي مباشرة قبل الدفع. لا تحصل رسوم اختيارية دون موافقة صريحة. تتم معالجة البطاقة في بيئة آمنة تدعم 3D Secure ولا تحتفظ KAPTAŞ ببيانات البطاقة.']],
    ['التسليم والإلغاء', ['تسلم السيارة بعد فحص الهوية والرخصة والعقد. تخضع طلبات الإلغاء والتغيير والاسترداد لشروط التأجير وشروط التسليم والاسترداد المتاحة قبل الدفع.']],
    ['استثناء حق الانسحاب', ['لا ينطبق حق الانسحاب لمدة 14 يوماً على تأجير السيارات الواجب تنفيذه في تاريخ أو فترة محددة، مع بقاء الحقوق القانونية في حالة عدم التنفيذ.']],
    ['الشكاوى والخصوصية والتأكيد', [`ترسل الطلبات إلى ${company.email}. تعالج البيانات وفق إشعار KVKK. يراجع العميل هذا النموذج ويؤكده قبل تقديم طلب يرتب التزاماً بالدفع.`]],
  ]},
  '/mesafeli-satis-sozlesmesi': { authority: 'consumer', eyebrow: 'عقد خدمة عن بعد', title: 'عقد البيع عن بعد', intro: 'هذه هي الشروط الأساسية لخدمة تأجير السيارات المحددة التاريخ والمتعاقد عليها عبر الإنترنت.', sections: [
    ['الأطراف', [`مقدم الخدمة: ${company.tradeName}، ${company.registeredAddress}. العمليات: ${company.operationAddress}. الهاتف: ${company.phone}. البريد: ${company.email}.`, 'المستهلك هو الشخص أو الجهة المسجلة بياناتها في مسار الحجز والدفع.']],
    ['الخدمة والدفع', ['يتعلق العقد بإتاحة السيارة المختارة أو فئة مماثلة للتواريخ المؤكدة. تعرض الميزات والتواريخ والموقع والعملة والمبلغ الإجمالي قبل الدفع. يتم الدفع في بيئة آمنة تدعم 3D Secure لدى مزود الدفع المعتمد.']],
    ['استثناء حق الانسحاب', ['وفقاً للائحة العقود عن بعد في تركيا، لا ينطبق حق الانسحاب لمدة 14 يوماً على خدمات تأجير السيارات الواجب تنفيذها في تاريخ أو فترة محددة. تظل الحقوق الناشئة عن عدم التنفيذ محفوظة.']],
    ['القبول والنزاعات', ['يقر المستهلك بالقراءة والقبول إلكترونياً قبل الدفع. يمكن اللجوء إلى لجنة تحكيم المستهلك أو محكمة المستهلك المختصة حسب الحدود المعمول بها.']],
  ]},
};

export const commerceLegalPages = { ar, en, tr };
