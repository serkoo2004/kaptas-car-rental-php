$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$deployRoot = Join-Path $root 'deploy'
$stage = Join-Path $deployRoot ("kaptas-cpanel-$stamp")
$zip = "$stage.zip"

New-Item -ItemType Directory -Path $stage -Force | Out-Null

foreach ($directory in @('app', 'bin', 'config', 'database', 'public_html', 'storage', 'vendor')) {
    New-Item -ItemType Directory -Path (Join-Path $stage $directory) -Force | Out-Null
}
New-Item -ItemType Directory -Path (Join-Path $stage 'database\migrations') -Force | Out-Null

Copy-Item -Path (Join-Path $root 'app\*') -Destination (Join-Path $stage 'app') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'app\.htaccess') -Destination (Join-Path $stage 'app\.htaccess') -Force
Copy-Item -LiteralPath (Join-Path $root 'bin\migrate.php') -Destination (Join-Path $stage 'bin\migrate.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'bin\system-check.php') -Destination (Join-Path $stage 'bin\system-check.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'bin\update-exchange-rates.php') -Destination (Join-Path $stage 'bin\update-exchange-rates.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'bin\send-reservation-mails.php') -Destination (Join-Path $stage 'bin\send-reservation-mails.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'bin\reconcile-vakifbank.php') -Destination (Join-Path $stage 'bin\reconcile-vakifbank.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'config\config.example.php') -Destination (Join-Path $stage 'config\config.example.php') -Force
Copy-Item -LiteralPath (Join-Path $root 'config\.htaccess') -Destination (Join-Path $stage 'config\.htaccess') -Force
Copy-Item -Path (Join-Path $root 'database\migrations\*') -Destination (Join-Path $stage 'database\migrations') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'database\.htaccess') -Destination (Join-Path $stage 'database\.htaccess') -Force
Copy-Item -Path (Join-Path $root 'public_html\*') -Destination (Join-Path $stage 'public_html') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'public_html\.htaccess') -Destination (Join-Path $stage 'public_html\.htaccess') -Force
Copy-Item -LiteralPath (Join-Path $root 'public_html\uploads\.htaccess') -Destination (Join-Path $stage 'public_html\uploads\.htaccess') -Force
Copy-Item -Path (Join-Path $root 'storage\vehicle-images') -Destination (Join-Path $stage 'storage') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'storage\.htaccess') -Destination (Join-Path $stage 'storage\.htaccess') -Force
New-Item -ItemType Directory -Path (Join-Path $stage 'storage\cache'), (Join-Path $stage 'storage\logs') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'storage\cache\exchange-rates.json') -Destination (Join-Path $stage 'storage\cache\exchange-rates.json') -Force

$sdkTarget = Join-Path $stage 'vendor\iyzipay-php'
New-Item -ItemType Directory -Path $sdkTarget -Force | Out-Null
Copy-Item -Path (Join-Path $root 'vendor\iyzipay-php\src') -Destination $sdkTarget -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'vendor\iyzipay-php\LICENSE') -Destination (Join-Path $sdkTarget 'LICENSE') -Force
Copy-Item -LiteralPath (Join-Path $root 'vendor\iyzipay-php\VERSION') -Destination (Join-Path $sdkTarget 'VERSION') -Force
Copy-Item -LiteralPath (Join-Path $root 'vendor\.htaccess') -Destination (Join-Path $stage 'vendor\.htaccess') -Force

$migrationFiles = Get-ChildItem (Join-Path $root 'database\migrations') -Filter '*.sql' | Sort-Object Name
$sqlParts = foreach ($file in $migrationFiles) {
    "-- $($file.Name)`r`n" + [IO.File]::ReadAllText($file.FullName)
}
$dataFile = Join-Path $root 'database\current-data.sql'
if (Test-Path $dataFile) {
    $canonicalTables = @{}
    $schemaSql = $sqlParts -join "`r`n"
    foreach ($match in [regex]::Matches($schemaSql, 'CREATE TABLE `([^`]+)`', [Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        $canonicalTables[$match.Groups[1].Value.ToLowerInvariant()] = $match.Groups[1].Value
    }
    $dataSql = [IO.File]::ReadAllText($dataFile)
    $dataSql = [regex]::Replace(
        $dataSql,
        '(?i)(?<prefix>(?:LOCK TABLES|ALTER TABLE|INSERT INTO)\s+`)(?<table>[^`]+)(?<suffix>`)',
        {
            param($match)
            $key = $match.Groups['table'].Value.ToLowerInvariant()
            $table = if ($canonicalTables.ContainsKey($key)) { $canonicalTables[$key] } else { $match.Groups['table'].Value }
            return $match.Groups['prefix'].Value + $table + $match.Groups['suffix'].Value
        }
    )
    $insertPattern = '(?ms)^INSERT INTO `[^`]+` .*?;\r?\n(?=/\*![0-9]+ ALTER TABLE)'
    $insertMatches = [regex]::Matches($dataSql, $insertPattern)
    if ($insertMatches.Count -eq 0) {
        throw 'current-data.sql icinde veri INSERT bloklari bulunamadi.'
    }
    $portableData = @(
        '-- portable-current-data.sql'
        'SET NAMES utf8mb4;'
        'SET @KAPTAS_OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;'
        'SET @KAPTAS_OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS;'
        'SET FOREIGN_KEY_CHECKS = 0;'
        'SET UNIQUE_CHECKS = 0;'
        'START TRANSACTION;'
        ($insertMatches | ForEach-Object { $_.Value.TrimEnd() })
        'COMMIT;'
        'SET FOREIGN_KEY_CHECKS = @KAPTAS_OLD_FOREIGN_KEY_CHECKS;'
        'SET UNIQUE_CHECKS = @KAPTAS_OLD_UNIQUE_CHECKS;'
    ) -join "`r`n`r`n"
    $sqlParts += $portableData
}
[IO.File]::WriteAllText((Join-Path $stage 'database\install.sql'), ($sqlParts -join "`r`n`r`n"), [Text.UTF8Encoding]::new($false))

Copy-Item -LiteralPath (Join-Path $root 'README.md') -Destination (Join-Path $stage 'KURULUM.md') -Force
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal -Force

Write-Host "Paket hazir: $zip"
