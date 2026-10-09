(() => {
  const body = document.body;
  const loginForm = document.querySelector('#admin-login');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.querySelector('#login-message');
      const button = loginForm.querySelector('button[type="submit"]');
      button.disabled = true;
      message.textContent = '';
      try {
        const csrf = await fetch('/api/auth/csrf', { credentials: 'same-origin' }).then(read);
        const form = new FormData(loginForm);
        const response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            callbackUrl: '/admin', csrfToken: csrf.csrfToken,
            email: String(form.get('email') || '').trim().toLowerCase(),
            password: String(form.get('password') || ''), json: 'true',
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.url || result.url.includes('error=')) throw new Error('E-posta veya şifre hatalı.');
        window.location.reload();
      } catch (error) {
        message.textContent = error.message || 'Giriş yapılamadı.';
        button.disabled = false;
      }
    });
    return;
  }

  if (body.dataset.admin !== 'true') return;

  const content = document.querySelector('#admin-content');
  const title = document.querySelector('#view-title');
  const dialog = document.querySelector('#editor-dialog');
  const editor = document.querySelector('#editor-content');
  const notice = document.querySelector('#notice');
  const state = { csrf: '', locations: [], vehicles: [], view: 'dashboard' };
  const titles = {
    dashboard: 'Genel Bakış', vehicles: 'Araç Yönetimi', reservations: 'Rezervasyonlar',
    leads: 'Talep ve Leadler', locations: 'Şube ve Lokasyon', documents: 'Belge Onayları', users: 'Kullanıcılar',
  };

  document.querySelector('#menu-button')?.addEventListener('click', () => document.querySelector('.sidebar')?.classList.toggle('open'));
  document.querySelectorAll('#admin-nav button').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelector('#admin-signout')?.addEventListener('click', async () => {
    await api('/api/auth/signout', { method: 'POST' });
    window.location.href = '/';
  });

  boot();

  async function boot() {
    try {
      const result = await fetch('/api/admin/bootstrap', { credentials: 'same-origin' }).then(read);
      state.csrf = result.csrfToken;
      await navigate('dashboard');
    } catch (error) {
      showNotice(error.message, true);
    }
  }

  async function navigate(view) {
    state.view = view;
    title.textContent = titles[view];
    document.querySelectorAll('#admin-nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    document.querySelector('.sidebar')?.classList.remove('open');
    content.innerHTML = '<div class="loading">Veriler yükleniyor...</div>';
    try {
      if (view === 'dashboard') await renderDashboard();
      if (view === 'vehicles') await renderVehicles();
      if (view === 'reservations') await renderReservations();
      if (view === 'leads') await renderLeads();
      if (view === 'locations') await renderLocations();
      if (view === 'users') await renderUsers();
      if (view === 'documents') await renderDocuments();
    } catch (error) {
      content.innerHTML = `<div class="empty">${escapeHtml(error.message || 'Veriler yüklenemedi.')}</div>`;
    }
  }

  async function renderDashboard() {
    const data = await api('/api/admin/dashboard');
    const c = data.counts;
    content.innerHTML = `
      <div class="metrics">
        ${metric('Toplam araç', c.vehicles)}${metric('Yayındaki araç', c.publishedVehicles)}
        ${metric('Aktif rezervasyon', c.activeReservations)}${metric('Yeni talep', c.newLeads)}
        ${metric('Belge bekliyor', c.pendingDocuments)}${metric('Kullanıcı', c.users)}
      </div>
      <section class="panel"><div class="panel-header"><h2>Son talepler</h2><strong>${money(data.paidRevenueTry, 'TRY')} doğrulanmış ödeme</strong></div>
        ${table(['Müşteri', 'E-posta', 'Kaynak', 'Durum', 'Tarih'], data.recentLeads.map((row) => [
          row.contactName, row.contactEmail, row.source, status(row.status), date(row.createdAt),
        ]))}
      </section>`;
  }

  async function renderVehicles() {
    const result = await api('/api/admin/vehicles');
    state.vehicles = result.data;
    content.innerHTML = `
      <div class="toolbar"><h2>${result.data.length} araç modeli</h2><input id="vehicle-search" placeholder="Araç ara"><button class="primary" id="add-vehicle">+ Araç ekle</button></div>
      <section class="panel" id="vehicle-table">${vehicleTable(result.data)}</section>`;
    document.querySelector('#add-vehicle').onclick = () => openVehicle();
    document.querySelector('#vehicle-search').oninput = (event) => {
      const term = event.target.value.toLocaleLowerCase('tr-TR');
      const rows = state.vehicles.filter((vehicle) => `${vehicle.brandName} ${vehicle.modelName} ${vehicle.title}`.toLocaleLowerCase('tr-TR').includes(term));
      document.querySelector('#vehicle-table').innerHTML = vehicleTable(rows);
      bindVehicleRows();
    };
    bindVehicleRows();
  }

  function vehicleTable(rows) {
    return table(['Araç', 'USD / gün', 'Stok', 'Vites / Yakıt', 'Yayın', 'İşlem'], rows.map((vehicle) => [
      `<div class="vehicle-cell"><img src="${escapeAttr(vehicle.images?.[0]?.url || '/images/fleet-hero.png')}" alt=""><div><strong>${escapeHtml(vehicle.brandName)} ${escapeHtml(vehicle.modelName)}</strong><br><small>${escapeHtml(vehicle.year || '')}</small></div></div>`,
      vehicle.dailyPrice ? money(vehicle.dailyPrice, 'USD') : '<span class="status">Fiyat yok</span>',
      `${vehicle.stockCount} adet`, `${label(vehicle.transmission)} / ${label(vehicle.fuelType)}`,
      status(vehicle.status),
      `<div class="row-actions"><button class="secondary edit-vehicle" data-id="${vehicle.id}">Yönet</button><button class="danger delete-vehicle" data-id="${vehicle.id}">Sil</button></div>`,
    ]));
  }

  function bindVehicleRows() {
    document.querySelectorAll('.edit-vehicle').forEach((button) => button.onclick = () => openVehicle(state.vehicles.find((vehicle) => vehicle.id === button.dataset.id)));
    document.querySelectorAll('.delete-vehicle').forEach((button) => button.onclick = async () => {
      const vehicle = state.vehicles.find((row) => row.id === button.dataset.id);
      if (!confirm(`${vehicle.brandName} ${vehicle.modelName} kalıcı olarak silinsin mi?`)) return;
      try { await api(`/api/admin/vehicles?id=${encodeURIComponent(vehicle.id)}`, { method: 'DELETE' }); showNotice('Araç silindi.'); await renderVehicles(); }
      catch (error) { showNotice(error.message, true); }
    });
  }

  function openVehicle(vehicle = null) {
    const features = vehicle?.features?.length ? vehicle.features : [
      { group: 'Donanım', label: 'Kapı', value: '5' }, { group: 'Donanım', label: 'Klima', value: 'Var' },
    ];
    editor.innerHTML = `
      <form class="editor" id="vehicle-form">
        <div class="editor-head"><h2>${vehicle ? 'Aracı düzenle' : 'Yeni araç ekle'}</h2><button type="button" data-close>×</button></div>
        <div class="editor-body">
          <div class="form-grid">
            ${field('Marka', 'brand', vehicle?.brandName, true)}${field('Model', 'model', vehicle?.modelName, true)}${field('Kart başlığı', 'title', vehicle?.title)}
            ${field('Model yılı', 'year', vehicle?.year, false, 'number', '1', 'min="2000" max="2100"')}${field('Günlük fiyat (USD)', 'dailyPrice', vehicle?.dailyPrice, true, 'number', '0.01', 'min="0.01" max="999999.99"')}${field('Araç adedi', 'stockCount', vehicle?.stockCount ?? 1, true, 'number', '1', 'min="0" max="999"')}
            ${selectField('Yakıt', 'fuelType', ['GASOLINE','GASOLINE_LPG','DIESEL','HYBRID','ELECTRIC'], vehicle?.fuelType || 'GASOLINE_LPG')}
            ${selectField('Vites', 'transmission', ['AUTOMATIC','MANUAL'], vehicle?.transmission || 'AUTOMATIC')}
            ${selectField('Çekiş', 'driveType', ['', 'FWD','RWD','AWD','FOUR_WD'], vehicle?.driveType || '')}
            ${field('Kasa tipi', 'bodyType', vehicle?.bodyType)}${field('Segment', 'segment', vehicle?.segment)}${field('Motor gücü', 'enginePower', vehicle?.enginePower)}
            ${selectField('Kayıt durumu', 'status', ['DRAFT','PUBLISHED','ARCHIVED'], vehicle?.status || 'PUBLISHED')}
            ${selectField('Teslim durumu', 'deliveryStatus', ['IN_STOCK','LIMITED_STOCK','ORDER_ONLY','SOON'], vehicle?.deliveryStatus || 'IN_STOCK')}
            ${field('SEO başlığı', 'seoTitle', vehicle?.seoTitle, false)}<label class="field full">SEO açıklaması<textarea name="seoDescription" maxlength="191">${escapeHtml(vehicle?.seoDescription || '')}</textarea></label>
          </div>
          <div class="checks"><label><input type="checkbox" name="isPublishedWeb" ${vehicle?.isPublishedWeb !== false ? 'checked' : ''}> Web sitesinde yayınla</label><label><input type="checkbox" name="isFeatured" ${vehicle?.isFeatured ? 'checked' : ''}> Öne çıkar</label></div>
          <section><div class="panel-header"><h2>Araç özellikleri</h2><button class="secondary" id="add-feature" type="button">+ Özellik</button></div><div class="feature-list" id="feature-list">${features.map(featureRow).join('')}</div></section>
          ${vehicle ? imageEditor(vehicle) : '<p>Aracı kaydettikten sonra bilgisayarınızdan görsel yükleyebilirsiniz.</p>'}
        </div>
        <div class="editor-actions"><button class="secondary" type="button" data-close>Vazgeç</button><button class="primary" type="submit">Kaydet</button></div>
      </form>`;
    dialog.showModal();
    editor.querySelectorAll('[data-close]').forEach((button) => button.onclick = () => dialog.close());
    editor.querySelector('#add-feature').onclick = () => editor.querySelector('#feature-list').insertAdjacentHTML('beforeend', featureRow({ group: 'Donanım', label: '', value: '' }));
    editor.querySelector('#feature-list').onclick = (event) => { if (event.target.matches('.remove-feature')) event.target.closest('.feature-row').remove(); };
    editor.querySelector('#vehicle-form').onsubmit = async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      payload.id = vehicle?.id;
      payload.dailyPrice = payload.dailyPrice ? Number(payload.dailyPrice) : null;
      payload.stockCount = Number(payload.stockCount);
      payload.year = payload.year ? Number(payload.year) : null;
      payload.isFeatured = form.has('isFeatured'); payload.isPublishedWeb = form.has('isPublishedWeb');
      payload.features = [...editor.querySelectorAll('.feature-row')].map((row) => ({
        group: row.querySelector('[name="featureGroup"]').value,
        label: row.querySelector('[name="featureLabel"]').value,
        value: row.querySelector('[name="featureValue"]').value,
      }));
      try {
        await api('/api/admin/vehicles', { method: vehicle ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
        dialog.close(); showNotice(vehicle ? 'Araç güncellendi.' : 'Araç eklendi.'); await renderVehicles();
      } catch (error) { showNotice(error.message, true); }
    };
    if (vehicle) bindImages(vehicle);
  }

  function imageEditor(vehicle) {
    return `<section><div class="panel-header"><h2>Araç görselleri</h2><span>Kapak görseli kartlarda kullanılır</span></div>
      <div class="upload-row"><input id="vehicle-image" type="file" accept="image/jpeg,image/png,image/webp"><button class="secondary" id="upload-image" type="button">Görsel yükle</button></div>
      <div class="image-grid">${(vehicle.images || []).map((image) => `<div class="image-item"><img src="${escapeAttr(image.url)}" alt=""><div><button class="secondary cover-image" data-id="${image.id}" ${image.isCover ? 'disabled' : ''}>${image.isCover ? 'Kapak' : 'Kapak yap'}</button><button class="danger remove-image" data-id="${image.id}">Sil</button></div></div>`).join('')}</div></section>`;
  }

  function bindImages(vehicle) {
    editor.querySelector('#upload-image').onclick = async () => {
      const file = editor.querySelector('#vehicle-image').files[0];
      if (!file) return showNotice('Önce bir görsel seçin.', true);
      const body = new FormData(); body.append('vehicleId', vehicle.id); body.append('image', file);
      try { await api('/api/admin/vehicle-images', { method: 'POST', body, raw: true }); showNotice('Görsel yüklendi.'); dialog.close(); await renderVehicles(); openVehicle(state.vehicles.find((row) => row.id === vehicle.id)); }
      catch (error) { showNotice(error.message, true); }
    };
    editor.querySelectorAll('.cover-image').forEach((button) => button.onclick = async () => {
      await api('/api/admin/vehicle-images', { method: 'PATCH', body: JSON.stringify({ id: button.dataset.id, isCover: true, sortOrder: 0 }) });
      dialog.close(); await renderVehicles(); openVehicle(state.vehicles.find((row) => row.id === vehicle.id));
    });
    editor.querySelectorAll('.remove-image').forEach((button) => button.onclick = async () => {
      if (!confirm('Bu görsel kalıcı olarak silinsin mi?')) return;
      await api(`/api/admin/vehicle-images?id=${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE' });
      dialog.close(); await renderVehicles(); openVehicle(state.vehicles.find((row) => row.id === vehicle.id));
    });
  }

  async function renderReservations() {
    const { data } = await api('/api/admin/reservations');
    content.innerHTML = `<div class="toolbar"><h2>${data.length} rezervasyon</h2></div><section class="panel">${table(['Müşteri','Araç','Alış','Bırakış','Ödeme','Durum','İşlem'], data.map((row) => [
      `<strong>${escapeHtml(row.customerName)}</strong><br><small>${escapeHtml(row.customerEmail)}</small>`, `${escapeHtml(row.brandName)} ${escapeHtml(row.modelName)}`,
      date(row.pickupAt), date(row.dropoffAt), row.paymentStatus ? `${status(row.paymentStatus)} ${money(row.amount,row.currency)}` : 'Ödeme yok',
      status(row.status), `<select class="reservation-status" data-id="${row.id}">${options(['HOLD','CONFIRMED','CANCELLED','EXPIRED'],row.status)}</select>`,
    ]))}</section>`;
    document.querySelectorAll('.reservation-status').forEach((select) => select.onchange = async () => {
      try { await api('/api/admin/reservations', { method:'PATCH', body:JSON.stringify({ id:select.dataset.id,status:select.value }) }); showNotice('Rezervasyon güncellendi.'); await renderReservations(); }
      catch(error){ showNotice(error.message,true); await renderReservations(); }
    });
  }

  async function renderLeads() {
    const { data } = await api('/api/admin/leads');
    const statuses=['RECEIVED','REVIEWING','WAITING_DOCUMENTS','PREPARING_OFFER','OFFER_SENT','APPROVED','REJECTED','COMPLETED','CANCELLED'];
    content.innerHTML=`<div class="toolbar"><h2>${data.length} talep</h2></div><section class="panel">${table(['Müşteri','Araç','İletişim','Kaynak','Tarih','Durum'],data.map(row=>[
      `<strong>${escapeHtml(row.contactName)}</strong>${row.companyName?`<br><small>${escapeHtml(row.companyName)}</small>`:''}`,escapeHtml(row.vehicleName||'-'),`${escapeHtml(row.contactEmail)}<br><small>${escapeHtml(row.contactPhone||'')}</small>`,escapeHtml(row.source),date(row.createdAt),`<select class="lead-status" data-id="${row.id}">${options(statuses,row.status)}</select>`
    ]))}</section>`;
    document.querySelectorAll('.lead-status').forEach(select=>select.onchange=async()=>{try{await api('/api/admin/leads',{method:'PATCH',body:JSON.stringify({id:select.dataset.id,status:select.value})});showNotice('Talep durumu güncellendi.')}catch(error){showNotice(error.message,true);await renderLeads()}});
  }

  async function renderLocations() {
    const { data, activeCount } = await api('/api/admin/locations');
    state.locations = data;
    content.innerHTML = `
      <div class="toolbar"><div><h2>${data.length} şube</h2><small>${activeCount} aktif teslim ve iade noktası</small></div><button class="primary" id="add-location">+ Yeni şube</button></div>
      <section class="panel location-panel">
        <div class="panel-header"><h2>Şube ve lokasyonlar</h2><span>Aktif şubeler ana sayfadaki lokasyon seçiminde yayınlanır</span></div>
        ${table(['Şube','Adres','İletişim','Sıra','Durum','İşlem'],data.map(location=>[
          `<div class="location-name"><span class="location-type"><i class="${location.type==='airport'?'plane':'office'}"></i></span><div><strong>${escapeHtml(location.name)}</strong><br><small>${escapeHtml(label(location.type))}</small></div></div>`,
          `<strong>${escapeHtml([location.district,location.city].filter(Boolean).join(', ')||'-')}</strong><br><small>${escapeHtml(location.address)}</small>`,
          `${escapeHtml(location.phone||'-')}<br><small>${escapeHtml(location.email||'-')}</small>`,
          Number(location.sortOrder||0),
          status(Number(location.isActive)===1?'ACTIVE':'PASSIVE'),
          `<div class="row-actions"><button class="secondary edit-location" data-id="${escapeAttr(location.id)}">Düzenle</button><button class="${Number(location.isActive)===1?'danger':'secondary'} toggle-location" data-id="${escapeAttr(location.id)}">${Number(location.isActive)===1?'Pasife al':'Aktifleştir'}</button></div>`,
        ]))}
      </section>`;
    document.querySelector('#add-location').onclick=()=>openLocation();
    document.querySelectorAll('.edit-location').forEach(button=>button.onclick=()=>openLocation(state.locations.find(location=>location.id===button.dataset.id)));
    document.querySelectorAll('.toggle-location').forEach(button=>button.onclick=async()=>{
      const location=state.locations.find(row=>row.id===button.dataset.id);
      const activating=Number(location.isActive)!==1;
      if(!activating&&!confirm(`${location.name} lokasyonu siteden kaldırılsın mı? Kayıt silinmez, pasif duruma alınır.`))return;
      try{await saveLocation({...location,isActive:activating});showNotice(activating?'Lokasyon yayına alındı.':'Lokasyon pasife alındı.');await renderLocations()}catch(error){showNotice(error.message,true)}
    });
  }

  function openLocation(location=null){
    editor.innerHTML=`<form class="editor" id="location-form">
      <div class="editor-head"><div><span class="editor-kicker">ŞUBE YÖNETİMİ</span><h2>${location?'Lokasyonu düzenle':'Yeni şube ekle'}</h2></div><button type="button" data-close>×</button></div>
      <div class="editor-body location-editor">
        <section class="location-form-section"><div class="section-title"><b>Temel bilgiler</b><span>Ana sayfada gösterilecek Türkçe bilgiler</span></div><div class="form-grid">
          ${field('Lokasyon adı (TR)','name',location?.name||'',true)}${selectField('Lokasyon tipi','type',['city','airport'],location?.type||'city')}${field('Yayın sırası','sortOrder',location?.sortOrder??0,true,'number','1','min="0" max="9999"')}
          ${field('Kısa açıklama (TR)','subtitle',location?.subtitle||'')}${field('Şehir','city',location?.city||'')}${field('İlçe','district',location?.district||'')}
          <label class="field full">Açık adres (TR)<textarea name="address" maxlength="2000" required>${escapeHtml(location?.address||'')}</textarea></label>
        </div></section>
        <section class="location-form-section"><div class="section-title"><b>Yabancı dil karşılıkları</b><span>Boş alanlarda Türkçe metin otomatik kullanılır</span></div><div class="form-grid">
          ${field('Lokasyon adı (EN)','nameEn',location?.nameEn||'')}${field('Lokasyon adı (AR)','nameAr',location?.nameAr||'')}${field('Kısa açıklama (EN)','subtitleEn',location?.subtitleEn||'')}
          ${field('Kısa açıklama (AR)','subtitleAr',location?.subtitleAr||'')}<label class="field wide">Açık adres (EN)<textarea name="addressEn" maxlength="2000">${escapeHtml(location?.addressEn||'')}</textarea></label><label class="field wide">Açık adres (AR)<textarea name="addressAr" maxlength="2000" dir="rtl">${escapeHtml(location?.addressAr||'')}</textarea></label>
        </div></section>
        <section class="location-form-section"><div class="section-title"><b>İletişim ve yayın</b><span>Şubeye özel iletişim bilgileri</span></div><div class="form-grid">
          ${field('Telefon','phone',location?.phone||'',false,'tel')}${field('E-posta','email',location?.email||'',false,'email')}${field('Puan','rating',location?.rating??5,false,'number','0.1','min="0" max="5"')}
        </div><div class="checks"><label><input type="checkbox" name="isActive" ${location?Number(location.isActive)===1?'checked':'':'checked'}> Ana sayfada aktif olarak yayınla</label></div></section>
      </div>
      <div class="editor-actions"><button class="secondary" type="button" data-close>Vazgeç</button><button class="primary" type="submit">${location?'Değişiklikleri kaydet':'Şubeyi ekle'}</button></div>
    </form>`;
    dialog.showModal();
    editor.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
    editor.querySelector('#location-form').onsubmit=async(event)=>{
      event.preventDefault();const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());
      payload.id=location?.id;payload.sortOrder=Number(payload.sortOrder);payload.rating=Number(payload.rating||5);payload.isActive=form.has('isActive');
      try{await saveLocation(payload);dialog.close();showNotice(location?'Lokasyon güncellendi.':'Yeni şube eklendi ve ana sayfaya bağlandı.');await renderLocations()}catch(error){showNotice(error.message,true)}
    };
  }

  async function saveLocation(payload){
    return api('/api/admin/locations',{method:'POST',body:JSON.stringify(payload)});
  }

  async function renderUsers() {
    const {data}=await api('/api/admin/users'); const roles=['USER','CORPORATE_USER','DRIVER','SALES_REP','OPERATIONS_STAFF','ADMIN','SUPER_ADMIN']; const statuses=['ACTIVE','PASSIVE','SUSPENDED','PENDING_VERIFICATION'];
    content.innerHTML=`<div class="toolbar"><h2>${data.length} kullanıcı</h2></div><section class="panel">${table(['Kullanıcı','Telefon','Son giriş','Rol','Durum','İşlem'],data.map(row=>[
      `<strong>${escapeHtml(row.name||'-')}</strong><br><small>${escapeHtml(row.email)}</small>`,escapeHtml(row.phone||'-'),row.lastLoginAt?date(row.lastLoginAt):'Henüz yok',`<select class="user-role" data-id="${row.id}">${options(roles,row.role)}</select>`,`<select class="user-status" data-id="${row.id}">${options(statuses,row.status)}</select>`,`<button class="secondary save-user" data-id="${row.id}">Kaydet</button>`
    ]))}</section>`;
    document.querySelectorAll('.save-user').forEach(button=>button.onclick=async()=>{const id=button.dataset.id;const role=document.querySelector(`.user-role[data-id="${id}"]`).value;const statusValue=document.querySelector(`.user-status[data-id="${id}"]`).value;try{await api('/api/admin/users',{method:'PATCH',body:JSON.stringify({id,role,status:statusValue})});showNotice('Kullanıcı yetkileri güncellendi.')}catch(error){showNotice(error.message,true)}});
  }

  async function renderDocuments() {
    const {data}=await api('/api/admin/documents'); const statuses=['REQUESTED','UPLOADED','APPROVED','REJECTED','EXPIRED'];
    content.innerHTML=`<div class="toolbar"><h2>${data.length} belge</h2></div><section class="panel">${table(['Belge','Kullanıcı','Tür','Tarih','Durum','İşlem'],data.map(row=>[
      `<a href="${escapeAttr(row.fileUrl)}" target="_blank" rel="noreferrer">${escapeHtml(row.title)}</a>`,escapeHtml(row.userName||row.userEmail||'-'),escapeHtml(row.type),date(row.createdAt),status(row.status),`<select class="document-status" data-id="${row.id}">${options(statuses,row.status)}</select>`
    ]))}</section>`;
    document.querySelectorAll('.document-status').forEach(select=>select.onchange=async()=>{let rejectionReason='';if(select.value==='REJECTED')rejectionReason=prompt('Red nedenini yazın:')||'';try{await api('/api/admin/documents',{method:'PATCH',body:JSON.stringify({id:select.dataset.id,status:select.value,rejectionReason})});showNotice('Belge durumu güncellendi.');await renderDocuments()}catch(error){showNotice(error.message,true);await renderDocuments()}});
  }

  async function api(url, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.method && !['GET','HEAD'].includes(options.method)) headers['X-CSRF-Token'] = state.csrf;
    if (options.body && !options.raw) headers['Content-Type'] = 'application/json';
    const response = await fetch(url, { credentials:'same-origin', ...options, headers });
    return read(response);
  }

  async function read(response) { const result=await response.json().catch(()=>null); if(!response.ok)throw new Error(result?.error||`Sunucu hatası (${response.status})`); return result; }
  function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell??''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="empty">Henüz kayıt yok.</div>'}
  function metric(name,value){return `<div class="metric"><span>${name}</span><strong>${Number(value||0).toLocaleString('tr-TR')}</strong></div>`}
  function status(value){return `<span class="status ${escapeAttr(value||'')}">${escapeHtml(label(value))}</span>`}
  function options(items,current){return items.map(item=>`<option value="${escapeAttr(item)}" ${item===current?'selected':''}>${escapeHtml(label(item||'Belirtilmedi'))}</option>`).join('')}
  function field(labelText,name,value='',required=false,type='text',step='',attributes=''){return `<label class="field">${labelText}<input name="${name}" type="${type}" value="${escapeAttr(value??'')}" ${required?'required':''} ${step?`step="${step}"`:''} ${attributes}></label>`}
  function selectField(labelText,name,items,current){return `<label class="field">${labelText}<select name="${name}">${options(items,current)}</select></label>`}
  function featureRow(feature){return `<div class="feature-row"><input name="featureGroup" value="${escapeAttr(feature.group||'Donanım')}" placeholder="Grup"><input name="featureLabel" value="${escapeAttr(feature.label||'')}" placeholder="Özellik"><input name="featureValue" value="${escapeAttr(feature.value||'')}" placeholder="Değer"><button class="danger remove-feature" type="button">Sil</button></div>`}
  function date(value){return value?new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'-'}
  function money(value,currency='TRY'){return new Intl.NumberFormat('tr-TR',{style:'currency',currency}).format(Number(value||0))}
  function label(value){return ({PUBLISHED:'Yayında',DRAFT:'Taslak',ARCHIVED:'Arşiv',ACTIVE:'Aktif',PASSIVE:'Pasif',SUSPENDED:'Askıda',PENDING_VERIFICATION:'Doğrulama bekliyor',AUTOMATIC:'Otomatik',MANUAL:'Manuel',GASOLINE:'Benzin',GASOLINE_LPG:'Benzin + LPG',DIESEL:'Dizel',HYBRID:'Hibrit',ELECTRIC:'Elektrik',IN_STOCK:'Stokta',LIMITED_STOCK:'Sınırlı stok',ORDER_ONLY:'Siparişle',SOON:'Yakında',FWD:'Önden çekiş',RWD:'Arkadan itiş',AWD:'Dört çeker',FOUR_WD:'4x4',RECEIVED:'Yeni',REVIEWING:'İnceleniyor',WAITING_DOCUMENTS:'Belge bekleniyor',PREPARING_OFFER:'Teklif hazırlanıyor',OFFER_SENT:'Teklif gönderildi',APPROVED:'Onaylandı',REJECTED:'Reddedildi',COMPLETED:'Tamamlandı',CANCELLED:'İptal',HOLD:'Ödeme bekliyor',CONFIRMED:'Kesinleşti',EXPIRED:'Süresi doldu',PAID:'Ödendi',FAILED:'Başarısız',REVIEW_REQUIRED:'Kontrol gerekli',UPLOADED:'Yüklendi',REQUESTED:'Talep edildi',USER:'Müşteri',ADMIN:'Yönetici',SUPER_ADMIN:'Ana yönetici',SALES_REP:'Satış',OPERATIONS_STAFF:'Operasyon',CORPORATE_USER:'Kurumsal müşteri',DRIVER:'Sürücü',city:'Şehir',airport:'Havalimanı'}[value]||value||'-')}
  function showNotice(message,isError=false){notice.textContent=message;notice.classList.toggle('error',isError);notice.hidden=false;clearTimeout(showNotice.timer);showNotice.timer=setTimeout(()=>notice.hidden=true,5000)}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
  function escapeAttr(value){return escapeHtml(value)}
})();
