<?php
/**
 * MAQE Cloud API Gateway (Remote MariaDB / MySQL Backend)
 * Hosted on jethrowatson.co.uk/maqe/api/
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-MAQE-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'sdb-59.hosting.stackcp.net';
$db_user = 'jethrowawp77';
$db_pass = 'eSf90cp!.3';
$db_name = 'jethrowawp77';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$resource = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

if (!$resource) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = preg_replace('#^/maqe/api/?#', '', $uri);
    $uri = preg_replace('#^index\.php/?#', '', $uri);
    $parts = explode('/', trim($uri, '/'));
    $resource = $parts[0] ?? 'health';
    $id = $parts[1] ?? null;
}

if (empty($resource) || $resource === 'index.php') {
    $resource = 'health';
}

$method = $_SERVER['REQUEST_METHOD'];
$raw_input = file_get_contents('php://input');
$body = json_decode($raw_input, true) ?? [];

switch ($resource) {
    case 'health':
        $counts = [];
        $tables = [
            'maqe_companies',
            'maqe_profile_versions',
            'maqe_match_edges',
            'maqe_match_assessments',
            'maqe_organisations',
            'maqe_credit_wallets',
            'maqe_ledger_entries',
            'maqe_member_match_access'
        ];
        foreach ($tables as $t) {
            $stmt = $pdo->query("SELECT COUNT(*) as c FROM {$t}");
            $counts[$t] = (int)$stmt->fetch()['c'];
        }
        echo json_encode([
            'status' => 'healthy',
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            'engine' => 'MAQE Cloud Intelligence Engine v1.1',
            'database' => 'MariaDB on sdb-59.hosting.stackcp.net',
            'tables' => $counts
        ]);
        break;

    case 'companies':
        if ($method === 'GET') {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM maqe_companies WHERE company_id = ?");
                $stmt->execute([$id]);
                $company = $stmt->fetch();
                if (!$company) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Company not found']);
                    exit();
                }
                $p_stmt = $pdo->prepare("SELECT * FROM maqe_profile_versions WHERE company_id = ? AND is_current = 1 LIMIT 1");
                $p_stmt->execute([$id]);
                $profile = $p_stmt->fetch();
                if ($profile) {
                    $profile['provides'] = json_decode($profile['provides'] ?? '[]', true);
                    $profile['uses'] = json_decode($profile['uses'] ?? '[]', true);
                    $profile['serves'] = json_decode($profile['serves'] ?? '[]', true);
                    $profile['likely_needs'] = json_decode($profile['likely_needs'] ?? '[]', true);
                    $profile['relationships'] = json_decode($profile['relationships'] ?? '[]', true);
                    $profile['quality_indicators'] = json_decode($profile['quality_indicators'] ?? '{}', true);
                }
                $a_stmt = $pdo->prepare("SELECT * FROM maqe_assertions WHERE company_id = ?");
                $a_stmt->execute([$id]);
                $assertions = $a_stmt->fetchAll();
                foreach ($assertions as &$a) {
                    $a['typed_value'] = json_decode($a['typed_value'] ?? '{}', true);
                    $a['evidence_refs'] = json_decode($a['evidence_refs'] ?? '[]', true);
                }

                $company['trading_names'] = json_decode($company['trading_names'] ?? '[]', true);
                $company['sic_codes'] = json_decode($company['sic_codes'] ?? '[]', true);
                $company['addresses'] = json_decode($company['addresses'] ?? '{}', true);
                $company['profile'] = $profile;
                $company['assertions'] = $assertions;
                echo json_encode($company);
            } else {
                $q = $_GET['q'] ?? '';
                $sic = $_GET['sic'] ?? '';
                $limit = min((int)($_GET['limit'] ?? 50), 100);
                $sql = "SELECT c.*, p.profile_version_id, p.quality_indicators FROM maqe_companies c LEFT JOIN maqe_profile_versions p ON c.company_id = p.company_id AND p.is_current = 1 WHERE 1=1";
                $params = [];
                if ($q) {
                    $sql .= " AND (c.legal_name LIKE ? OR c.registration_number LIKE ?)";
                    $params[] = "%{$q}%";
                    $params[] = "%{$q}%";
                }
                if ($sic) {
                    $sql .= " AND c.sic_codes LIKE ?";
                    $params[] = "%{$sic}%";
                }
                $sql .= " ORDER BY c.legal_name ASC LIMIT {$limit}";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll();
                foreach ($rows as &$r) {
                    $r['trading_names'] = json_decode($r['trading_names'] ?? '[]', true);
                    $r['sic_codes'] = json_decode($r['sic_codes'] ?? '[]', true);
                    $r['addresses'] = json_decode($r['addresses'] ?? '{}', true);
                    $r['quality_indicators'] = json_decode($r['quality_indicators'] ?? '{}', true);
                }
                echo json_encode(['companies' => $rows, 'total' => count($rows)]);
            }
        }
        break;

    case 'matches':
        $focus_id = $_GET['focus_company_id'] ?? 'demo_delta';
        $direction = $_GET['direction'] ?? 'customer'; // customer or supplier
        $org_id = $_GET['org_id'] ?? 'org_delta';

        $sql = "SELECT e.edge_id, e.focus_company_id, e.counterparty_company_id, e.current_state,
                       a.assessment_id, a.direction, a.score, a.score_components, a.coverage, a.explanation, a.supporting_assertions,
                       c.legal_name as counterparty_name, c.registration_number, c.addresses, c.sic_codes,
                       acc.access_id as unlocked_access_id, acc.unlocked_at
                FROM maqe_match_edges e
                JOIN maqe_match_assessments a ON e.edge_id = a.edge_id AND a.direction = ?
                JOIN maqe_companies c ON e.counterparty_company_id = c.company_id
                LEFT JOIN maqe_member_match_access acc ON acc.org_id = ? AND acc.focus_company_id = e.focus_company_id AND acc.counterparty_company_id = e.counterparty_company_id
                WHERE e.focus_company_id = ?
                ORDER BY a.score DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$direction, $org_id, $focus_id]);
        $matches = $stmt->fetchAll();

        foreach ($matches as &$m) {
            $m['score_components'] = json_decode($m['score_components'] ?? '{}', true);
            $m['supporting_assertions'] = json_decode($m['supporting_assertions'] ?? '[]', true);
            $m['addresses'] = json_decode($m['addresses'] ?? '{}', true);
            $m['sic_codes'] = json_decode($m['sic_codes'] ?? '[]', true);
            $m['is_unlocked'] = !empty($m['unlocked_access_id']);
        }

        echo json_encode([
            'focus_company_id' => $focus_id,
            'direction' => $direction,
            'matches' => $matches,
            'count' => count($matches)
        ]);
        break;

    case 'unlock':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }

        $auth_hdr = $_SERVER['HTTP_X_MAQE_KEY'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $req_key = trim(str_replace('Bearer', '', $auth_hdr));
        if ($req_key !== 'maqe_live_sec_994b26f') {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: Invalid or missing API security key']);
            exit();
        }

        $org_id = $body['org_id'] ?? 'org_delta';
        $focus_id = $body['focus_company_id'] ?? 'demo_delta';
        $counterparty_id = $body['counterparty_company_id'];

        if (!$counterparty_id) {
            http_response_code(400);
            echo json_encode(['error' => 'counterparty_company_id is required']);
            exit();
        }

        $pdo->beginTransaction();
        try {
            // Check if already unlocked (Section 8A: Never double charge same org/pair)
            $check = $pdo->prepare("SELECT access_id, unlocked_at FROM maqe_member_match_access WHERE org_id = ? AND focus_company_id = ? AND counterparty_company_id = ?");
            $check->execute([$org_id, $focus_id, $counterparty_id]);
            if ($row = $check->fetch()) {
                $pdo->rollBack();
                echo json_encode([
                    'success' => true,
                    'already_unlocked' => true,
                    'access_id' => $row['access_id'],
                    'message' => 'Match connection is already permanently unlocked for this organisation.'
                ]);
                exit();
            }

            // Check wallet balance
            $w_stmt = $pdo->prepare("SELECT wallet_id, allowance_balance, purchased_balance FROM maqe_credit_wallets WHERE org_id = ? FOR UPDATE");
            $w_stmt->execute([$org_id]);
            $wallet = $w_stmt->fetch();
            if (!$wallet) {
                $w_id = 'wallet_' . bin2hex(random_bytes(6));
                $pdo->prepare("INSERT INTO maqe_credit_wallets (wallet_id, org_id, allowance_balance, purchased_balance, billing_cycle_resets_at, updated_at) VALUES (?, ?, 20, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())")->execute([$w_id, $org_id]);
                $wallet = ['wallet_id' => $w_id, 'allowance_balance' => 20, 'purchased_balance' => 0];
            }

            $total = (int)$wallet['allowance_balance'] + (int)$wallet['purchased_balance'];
            if ($total < 1) {
                $pdo->rollBack();
                http_response_code(402);
                echo json_encode(['error' => 'Insufficient credit balance', 'balance' => 0]);
                exit();
            }

            if ((int)$wallet['allowance_balance'] > 0) {
                $pdo->prepare("UPDATE maqe_credit_wallets SET allowance_balance = allowance_balance - 1, updated_at = NOW() WHERE wallet_id = ?")->execute([$wallet['wallet_id']]);
            } else {
                $pdo->prepare("UPDATE maqe_credit_wallets SET purchased_balance = purchased_balance - 1, updated_at = NOW() WHERE wallet_id = ?")->execute([$wallet['wallet_id']]);
            }
            $bal_after = $total - 1;

            $tx_id = 'tx_' . bin2hex(random_bytes(8));
            $access_id = 'acc_' . bin2hex(random_bytes(8));

            // Record immutable ledger entry
            $pdo->prepare("INSERT INTO maqe_ledger_entries (entry_id, wallet_id, entry_type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, 'match_unlock_debit', -1, ?, ?, ?, NOW())")
                ->execute([$tx_id, $wallet['wallet_id'], $bal_after, $access_id, "Unlocked candidate {$counterparty_id}"]);

            // Grant permanent match access
            $pdo->prepare("INSERT INTO maqe_member_match_access (access_id, org_id, focus_company_id, counterparty_company_id, unlocked_at, source_transaction_id) VALUES (?, ?, ?, ?, NOW(), ?)")
                ->execute([$access_id, $org_id, $focus_id, $counterparty_id, $tx_id]);

            // Add to CRM Opportunities pipeline
            $opp_id = 'opp_' . bin2hex(random_bytes(8));
            $pdo->prepare("INSERT INTO maqe_opportunities (opportunity_id, org_id, focus_company_id, counterparty_company_id, direction, state, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'prospective', 'Unlocked from AI recommendations', NOW(), NOW()) ON DUPLICATE KEY UPDATE updated_at = NOW()")
                ->execute([$opp_id, $org_id, $focus_id, $counterparty_id, $body['direction'] ?? 'customer']);

            $pdo->commit();
            echo json_encode([
                'success' => true,
                'access_id' => $access_id,
                'balance_remaining' => $bal_after,
                'transaction_id' => $tx_id
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'wallet':
        $org_id = $_GET['org_id'] ?? 'org_delta';
        $w_stmt = $pdo->prepare("SELECT * FROM maqe_credit_wallets WHERE org_id = ?");
        $w_stmt->execute([$org_id]);
        $wallet = $w_stmt->fetch();
        if (!$wallet) {
            $w_id = 'wallet_' . bin2hex(random_bytes(6));
            $pdo->prepare("INSERT INTO maqe_credit_wallets (wallet_id, org_id, allowance_balance, purchased_balance, billing_cycle_resets_at, updated_at) VALUES (?, ?, 20, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())")->execute([$w_id, $org_id]);
            $wallet = ['wallet_id' => $w_id, 'org_id' => $org_id, 'allowance_balance' => 20, 'purchased_balance' => 0];
        }

        $l_stmt = $pdo->prepare("SELECT * FROM maqe_ledger_entries WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 50");
        $l_stmt->execute([$wallet['wallet_id']]);
        $entries = $l_stmt->fetchAll();

        echo json_encode([
            'wallet' => $wallet,
            'entries' => $entries,
            'total_credits' => (int)$wallet['allowance_balance'] + (int)$wallet['purchased_balance']
        ]);
        break;

    case 'opportunities':
        $org_id = $_GET['org_id'] ?? 'org_delta';
        $sql = "SELECT o.*, c.legal_name as counterparty_name, c.registration_number, c.addresses
                FROM maqe_opportunities o
                JOIN maqe_companies c ON o.counterparty_company_id = c.company_id
                WHERE o.org_id = ?
                ORDER BY o.updated_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$org_id]);
        $opps = $stmt->fetchAll();
        foreach ($opps as &$o) {
            $o['addresses'] = json_decode($o['addresses'] ?? '{}', true);
        }
        echo json_encode(['opportunities' => $opps]);
        break;

    case 'sic_master':
        $tier = $_GET['tier'] ?? null;
        $category = $_GET['category'] ?? null;
        $search = $_GET['q'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 100), 500);

        $sql = "SELECT * FROM maqe_sic_master WHERE 1=1";
        $params = [];
        if ($tier) {
            $sql .= " AND tier = ?";
            $params[] = (int)$tier;
        }
        if ($category && $category !== 'all') {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        if ($search) {
            $sql .= " AND (sic_code LIKE ? OR description LIKE ? OR category LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        $sql .= " ORDER BY tier ASC, sic_code ASC LIMIT {$limit}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        echo json_encode([
            'total' => count($rows),
            'sic_codes' => $rows
        ]);
        break;

    case 'sic_stats':
        $stmt = $pdo->query("SELECT tier, count(*) as count, sum(records_count) as total_records FROM maqe_sic_master GROUP BY tier ORDER BY tier ASC");
        $tier_stats = $stmt->fetchAll();

        $c_stmt = $pdo->query("SELECT COUNT(DISTINCT category) as categories_count, COUNT(*) as total_sic FROM maqe_sic_master");
        $meta = $c_stmt->fetch();

        echo json_encode([
            'tier_breakdown' => $tier_stats,
            'total_sic_codes' => (int)$meta['total_sic'],
            'total_categories' => (int)$meta['categories_count'],
            'status' => 'active_engine'
        ]);
        break;

    case 'sic_scrape':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        $sic_code = $body['sic_code'] ?? null;
        if (!$sic_code) {
            http_response_code(400);
            echo json_encode(['error' => 'sic_code is required']);
            exit();
        }
        $stmt = $pdo->prepare("UPDATE maqe_sic_master SET records_count = records_count + 1, last_scraped_at = NOW() WHERE sic_code = ?");
        $stmt->execute([$sic_code]);
        echo json_encode([
            'success' => true,
            'sic_code' => $sic_code,
            'scraped_at' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found', 'resource' => $resource]);
        break;
}
