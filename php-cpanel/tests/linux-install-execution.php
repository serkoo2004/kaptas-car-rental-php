<?php

declare(strict_types=1);

use Kaptas\Core\Database;

require dirname(__DIR__) . '/app/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const VERIFY_PREFIX = 'zv_';

/**
 * Split a MySQL script without breaking on semicolons inside strings or comments.
 * The deployment script intentionally contains no stored procedures or DELIMITER blocks.
 *
 * @return list<string>
 */
function splitSqlStatements(string $sql): array
{
    $statements = [];
    $buffer = '';
    $length = strlen($sql);
    $quote = null;

    for ($index = 0; $index < $length; $index++) {
        $char = $sql[$index];
        $next = $index + 1 < $length ? $sql[$index + 1] : '';

        if ($quote !== null) {
            $buffer .= $char;
            if ($char === '\\' && $index + 1 < $length) {
                $buffer .= $sql[++$index];
                continue;
            }
            if ($char === $quote) {
                if ($next === $quote) {
                    $buffer .= $next;
                    $index++;
                } else {
                    $quote = null;
                }
            }
            continue;
        }

        if ($char === "'" || $char === '"' || $char === '`') {
            $quote = $char;
            $buffer .= $char;
            continue;
        }

        if ($char === '/' && $next === '*') {
            $index += 2;
            while ($index < $length - 1 && !($sql[$index] === '*' && $sql[$index + 1] === '/')) {
                $index++;
            }
            $index++;
            $buffer .= ' ';
            continue;
        }

        if ($char === '#') {
            while ($index < $length && $sql[$index] !== "\n") {
                $index++;
            }
            $buffer .= "\n";
            continue;
        }

        if ($char === '-' && $next === '-' && ($index + 2 >= $length || ctype_space($sql[$index + 2]))) {
            $index += 2;
            while ($index < $length && $sql[$index] !== "\n") {
                $index++;
            }
            $buffer .= "\n";
            continue;
        }

        if ($char === ';') {
            $statement = trim($buffer);
            if ($statement !== '') {
                $statements[] = $statement;
            }
            $buffer = '';
            continue;
        }

        $buffer .= $char;
    }

    if ($quote !== null) {
        throw new RuntimeException('SQL dosyasinda kapanmamis tirnak bulundu.');
    }

    $statement = trim($buffer);
    if ($statement !== '') {
        $statements[] = $statement;
    }

    return $statements;
}

function quoteIdentifier(string $identifier): string
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $identifier)) {
        throw new RuntimeException('Guvenli olmayan SQL tanimlayicisi: ' . $identifier);
    }

    return '`' . $identifier . '`';
}

function countInsertRows(string $statement): int
{
    $valuesPosition = stripos($statement, ' VALUES ');
    if ($valuesPosition === false) {
        throw new RuntimeException('INSERT VALUES bolumu bulunamadi.');
    }

    $values = substr($statement, $valuesPosition + 8);
    $length = strlen($values);
    $quote = null;
    $depth = 0;
    $rows = 0;

    for ($index = 0; $index < $length; $index++) {
        $char = $values[$index];
        $next = $index + 1 < $length ? $values[$index + 1] : '';

        if ($quote !== null) {
            if ($char === '\\' && $index + 1 < $length) {
                $index++;
                continue;
            }
            if ($char === $quote) {
                if ($next === $quote) {
                    $index++;
                } else {
                    $quote = null;
                }
            }
            continue;
        }

        if ($char === "'" || $char === '"' || $char === '`') {
            $quote = $char;
            continue;
        }

        if ($char === '(') {
            if ($depth === 0) {
                $rows++;
            }
            $depth++;
        } elseif ($char === ')') {
            $depth--;
            if ($depth < 0) {
                throw new RuntimeException('INSERT parantez yapisi gecersiz.');
            }
        }
    }

    if ($quote !== null || $depth !== 0 || $rows === 0) {
        throw new RuntimeException('INSERT satirlari guvenle sayilamadi.');
    }

    return $rows;
}

function prefixedSql(string $sql, array $tables): string
{
    usort($tables, static fn (string $left, string $right): int => strlen($right) <=> strlen($left));

    foreach ($tables as $table) {
        $sql = str_replace(quoteIdentifier($table), quoteIdentifier(VERIFY_PREFIX . $table), $sql);
    }

    return preg_replace_callback(
        '/\bCONSTRAINT\s+`([^`]+)`/i',
        static fn (array $match): string => 'CONSTRAINT ' . quoteIdentifier(VERIFY_PREFIX . $match[1]),
        $sql,
    ) ?? throw new RuntimeException('Constraint adlari donusturulemedi.');
}

$installPath = $argv[1] ?? dirname(__DIR__) . '/deploy/KAPTAS-LINUX-VERIFIED-20260816.sql';
$resolvedPath = realpath($installPath);
if ($resolvedPath === false || !is_file($resolvedPath)) {
    throw new RuntimeException('Dogrulanacak SQL dosyasi bulunamadi.');
}

$sql = file_get_contents($resolvedPath);
if ($sql === false || $sql === '') {
    throw new RuntimeException('SQL dosyasi okunamadi veya bos.');
}

if (str_starts_with($sql, "\xEF\xBB\xBF")) {
    throw new RuntimeException('SQL dosyasinda UTF-8 BOM bulundu.');
}

preg_match_all('/\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`([^`]+)`/i', $sql, $tableMatches);
$tables = array_values(array_unique($tableMatches[1] ?? []));
if (count($tables) !== 44) {
    throw new RuntimeException('Beklenen 44 tablo yerine ' . count($tables) . ' tablo bulundu.');
}

$sourceStatements = splitSqlStatements($sql);
$expectedRows = [];
foreach ($sourceStatements as $statement) {
    if (preg_match('/^INSERT\s+INTO\s+`([^`]+)`/i', ltrim($statement), $match) !== 1) {
        continue;
    }
    $expectedRows[$match[1]] = ($expectedRows[$match[1]] ?? 0) + countInsertRows($statement);
}

if (count($expectedRows) !== 22 || array_sum($expectedRows) !== 116) {
    throw new RuntimeException(sprintf(
        'Seed ozeti beklenenden farkli: insertTables=%d, rows=%d.',
        count($expectedRows),
        array_sum($expectedRows),
    ));
}

$temporaryTables = array_map(static fn (string $table): string => VERIFY_PREFIX . $table, $tables);
$pdo = Database::connection();
$originalForeignKeyChecks = (int) $pdo->query('SELECT @@FOREIGN_KEY_CHECKS')->fetchColumn();
$executed = 0;

try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (array_reverse($temporaryTables) as $temporaryTable) {
        $pdo->exec('DROP TABLE IF EXISTS ' . quoteIdentifier($temporaryTable));
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = ' . $originalForeignKeyChecks);

    $testSql = prefixedSql($sql, $tables);
    $testStatements = splitSqlStatements($testSql);
    foreach ($testStatements as $statement) {
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (Throwable $error) {
            $preview = preg_replace('/\s+/', ' ', substr($statement, 0, 180));
            throw new RuntimeException("SQL statement #{$executed} failed ({$preview}): {$error->getMessage()}", 0, $error);
        }
    }

    $placeholders = implode(',', array_fill(0, count($temporaryTables), '?'));
    $tableQuery = $pdo->prepare(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ({$placeholders})",
    );
    $tableQuery->execute($temporaryTables);
    $createdTables = $tableQuery->fetchAll(PDO::FETCH_COLUMN);
    if (count($createdTables) !== count($temporaryTables)) {
        throw new RuntimeException('Tum gecici tablolar olusturulamadi: ' . count($createdTables) . '/' . count($temporaryTables));
    }

    $importedRows = 0;
    foreach ($expectedRows as $table => $expected) {
        $actual = (int) $pdo->query('SELECT COUNT(*) FROM ' . quoteIdentifier(VERIFY_PREFIX . $table))->fetchColumn();
        if ($actual !== $expected) {
            throw new RuntimeException("{$table} satir sayisi farkli: expected={$expected}, actual={$actual}");
        }
        $importedRows += $actual;
    }

    $checkErrors = [];
    foreach ($temporaryTables as $temporaryTable) {
        $rows = $pdo->query('CHECK TABLE ' . quoteIdentifier($temporaryTable))->fetchAll();
        foreach ($rows as $row) {
            if (($row['Msg_type'] ?? '') === 'error' || (($row['Msg_type'] ?? '') === 'status' && ($row['Msg_text'] ?? '') !== 'OK')) {
                $checkErrors[] = $temporaryTable . ': ' . ($row['Msg_text'] ?? 'unknown');
            }
        }
    }
    if ($checkErrors !== []) {
        throw new RuntimeException('CHECK TABLE hatalari: ' . implode('; ', $checkErrors));
    }

    $foreignKeyQuery = $pdo->prepare(
        "SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND REFERENCED_TABLE_NAME IS NOT NULL
           AND TABLE_NAME IN ({$placeholders})",
    );
    $foreignKeyQuery->execute($temporaryTables);
    $foreignKeys = $foreignKeyQuery->fetchAll();
    $orphans = 0;
    foreach ($foreignKeys as $foreignKey) {
        $childTable = quoteIdentifier((string) $foreignKey['TABLE_NAME']);
        $childColumn = quoteIdentifier((string) $foreignKey['COLUMN_NAME']);
        $parentTable = quoteIdentifier((string) $foreignKey['REFERENCED_TABLE_NAME']);
        $parentColumn = quoteIdentifier((string) $foreignKey['REFERENCED_COLUMN_NAME']);
        $orphans += (int) $pdo->query(
            "SELECT COUNT(*) FROM {$childTable} child_row
             LEFT JOIN {$parentTable} parent_row ON child_row.{$childColumn} = parent_row.{$parentColumn}
             WHERE child_row.{$childColumn} IS NOT NULL AND parent_row.{$parentColumn} IS NULL",
        )->fetchColumn();
    }
    if ($orphans !== 0) {
        throw new RuntimeException("Foreign key yetim kayitlari bulundu: {$orphans}");
    }

    echo sprintf(
        "Linux install execution OK: statements=%d, tables=%d, insertTables=%d, rows=%d, foreignKeys=%d, orphans=%d, checkErrors=0\n",
        $executed,
        count($createdTables),
        count($expectedRows),
        $importedRows,
        count($foreignKeys),
        $orphans,
    );
} finally {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (array_reverse($temporaryTables) as $temporaryTable) {
        if (!str_starts_with($temporaryTable, VERIFY_PREFIX)) {
            throw new RuntimeException('Gecici tablo temizleme guvenlik kontrolu basarisiz.');
        }
        $pdo->exec('DROP TABLE IF EXISTS ' . quoteIdentifier($temporaryTable));
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = ' . $originalForeignKeyChecks);
}
