$ErrorActionPreference = "Stop"

$service = Get-Service -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match "^(MariaDB|MySQL)" } |
  Select-Object -First 1

if ($service) {
  if ($service.Status -ne "Running") {
    Start-Service -Name $service.Name
    $service.WaitForStatus("Running", [TimeSpan]::FromSeconds(20))
  }

  Write-Host "MySQL uyumlu servis calisiyor: $($service.Name)"
  exit 0
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose up -d mysql

  if ($LASTEXITCODE -ne 0) {
    throw "Docker MySQL container baslatilamadi."
  }

  Write-Host "Docker MySQL container baslatildi."
  exit 0
}

throw "MariaDB/MySQL servisi veya Docker bulunamadi."
