<?php

declare(strict_types=1);

use Kaptas\Core\Auth;

require dirname(__DIR__, 2) . '/app/bootstrap.php';

header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
$user = Auth::user();
$isAdmin = $user && in_array($user['role'], ['ADMIN', 'SUPER_ADMIN'], true);
?>
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>KAPTAŞ Yönetim</title>
  <link rel="stylesheet" href="/admin/assets/admin.css">
  <link rel="stylesheet" href="/admin/assets/locations.css">
</head>
<body data-admin="<?= $isAdmin ? 'true' : 'false' ?>">
<?php if (!$isAdmin): ?>
  <main class="login-screen">
    <form class="admin-login" id="admin-login">
      <img src="/logo.png" alt="KAPTAŞ Car Rental">
      <div>
        <h1>Yönetim girişi</h1>
        <p>Bu alan yalnızca yetkili KAPTAŞ personeline açıktır.</p>
      </div>
      <label>E-posta<input name="email" type="email" autocomplete="username" required></label>
      <label>Şifre<input name="password" type="password" autocomplete="current-password" minlength="8" required></label>
      <p class="form-message" id="login-message"></p>
      <button type="submit">Giriş yap</button>
      <a href="/">Siteye dön</a>
    </form>
  </main>
<?php else: ?>
  <div class="admin-app">
    <aside class="sidebar">
      <a class="brand" href="/admin"><img src="/logo.png" alt="KAPTAŞ"></a>
      <nav id="admin-nav">
        <button class="active" data-view="dashboard"><span>⌂</span>Genel Bakış</button>
        <button data-view="vehicles"><span>▦</span>Araç Yönetimi</button>
        <button data-view="reservations"><span>▣</span>Rezervasyonlar</button>
        <button data-view="leads"><span>◎</span>Talep ve Leadler</button>
        <button data-view="locations"><span>⌖</span>Şube ve Lokasyon</button>
        <button data-view="documents"><span>▤</span>Belge Onayları</button>
        <button data-view="users"><span>♙</span>Kullanıcılar</button>
      </nav>
      <div class="sidebar-user">
        <strong><?= htmlspecialchars((string) $user['name']) ?></strong>
        <small><?= htmlspecialchars((string) $user['email']) ?></small>
        <button id="admin-signout">Çıkış</button>
      </div>
    </aside>
    <main class="workspace">
      <header class="workspace-header">
        <button class="menu-button" id="menu-button" aria-label="Menü">☰</button>
        <div><span>Operasyon Merkezi</span><h1 id="view-title">Genel Bakış</h1></div>
        <a href="/" target="_blank" rel="noreferrer">Siteyi görüntüle ↗</a>
      </header>
      <div class="notice" id="notice" hidden></div>
      <section id="admin-content" class="content"><div class="loading">Veriler yükleniyor...</div></section>
    </main>
  </div>
  <dialog id="editor-dialog"><div id="editor-content"></div></dialog>
<?php endif; ?>
<script src="/admin/assets/admin.js" defer></script>
</body>
</html>
