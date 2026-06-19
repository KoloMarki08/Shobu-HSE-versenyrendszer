<?php
// BIZTONSÁGI HTTP FEJLÉCEK (Megakadályozza a kód-befecskendezést és beágyazást)
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Hibaüzenetek elrejtése a felhasználók elől (hogy a hackerek ne kapjanak támpontot)
error_reporting(0);
mysqli_report(MYSQLI_REPORT_OFF);

$szerver = "localhost";
$felhasznalo = "root";  
$jelszo = "";           
$adatbazis = "shobu_system_adatbazis"; 

$kapcsolat = new mysqli($szerver, $felhasznalo, $jelszo, $adatbazis);
if ($kapcsolat->connect_error) { 
    // Éles szerveren sosem írjuk ki a pontos adatbázis hibát!
    echo json_encode(["hiba" => "Rendszerhiba! Nem sikerült kapcsolódni az adatbázishoz."]); 
    exit(); 
}

$kapcsolat->set_charset("utf8mb4");
$akcio = isset($_GET['akcio']) ? $_GET['akcio'] : '';

// -----------------------------------------------------------------------------
// 1. KATEGÓRIÁK ÉS TATAMIK LEKÉRDEZÉSE
// -----------------------------------------------------------------------------
if ($akcio === 'kategoriakLekerdezese') {
    $sql = "SELECT k.kategoria_id as id, k.megnevezes as nev, k.tipus, k.nem, k.min_kor, k.max_kor, t.sorszam as tatami 
            FROM kategoria k 
            LEFT JOIN kategoria_tatami kt ON k.kategoria_id = kt.kategoria_id 
            LEFT JOIN tatami t ON kt.tatami_id = t.tatami_id";
    $eredmeny = $kapcsolat->query($sql);
    $lista = array(); 
    if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } }
    echo json_encode($lista);

// -----------------------------------------------------------------------------
// 2. VERSENYZŐK LEKÉRDEZÉSE
// -----------------------------------------------------------------------------
} elseif ($akcio === 'lekerdezes') {
    $v_id = isset($_GET['verseny_id']) ? (int)$_GET['verseny_id'] : 1;
    
    // PREPARED STATEMENT HASZNÁLATA
    $stmt = $kapcsolat->prepare("SELECT v.versenyzo_id as id, v.nev, v.egyesulet as klub, v.suly, k.megnevezes as kategoria, n.kiemelt 
                                 FROM versenyzo v 
                                 JOIN nevezes n ON v.versenyzo_id = n.versenyzo_id 
                                 JOIN kategoria k ON n.kategoria_id = k.kategoria_id
                                 WHERE n.verseny_id = ?");
    $stmt->bind_param("i", $v_id);
    $stmt->execute();
    $eredmeny = $stmt->get_result();
    $versenyzok = array(); 
    if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $versenyzok[] = $sor; } }
    $stmt->close();
    echo json_encode($versenyzok);

// -----------------------------------------------------------------------------
// 3. ÚJ NEVEZÉS RÖGZÍTÉSE (SQL Injection elleni védelemmel)
// -----------------------------------------------------------------------------
} elseif ($akcio === 'ujNevezes') {
    $k = json_decode(file_get_contents('php://input'), true);
    
    // XSS szűrés: Eltávolítjuk a HTML tageket a beviteli mezőkből
    $nev = htmlspecialchars(trim($k['nev']), ENT_QUOTES, 'UTF-8');
    $klub = htmlspecialchars(trim($k['klub']), ENT_QUOTES, 'UTF-8');
    $katNev = $k['kategoria'];
    $v_id = isset($k['verseny_id']) ? (int)$k['verseny_id'] : 1; 
    
    $stmt = $kapcsolat->prepare("INSERT INTO versenyzo (nev, egyesulet) VALUES (?, ?)");
    $stmt->bind_param("ss", $nev, $klub);
    
    if ($stmt->execute()) {
        $versenyzo_id = $stmt->insert_id;
        $stmt->close();
        
        $katStmt = $kapcsolat->prepare("SELECT kategoria_id FROM kategoria WHERE megnevezes = ?");
        $katStmt->bind_param("s", $katNev);
        $katStmt->execute();
        $katRes = $katStmt->get_result();
        
        if ($katRes && $katRes->num_rows > 0) {
            $kat_id = $katRes->fetch_assoc()['kategoria_id'];
            $nevStmt = $kapcsolat->prepare("INSERT INTO nevezes (versenyzo_id, versenyzo_nev, kategoria_id, kategoria_megnevezes, verseny_id, helyezes, pontszam) VALUES (?, ?, ?, ?, ?, 0, 0)");
            $nevStmt->bind_param("isisi", $versenyzo_id, $nev, $kat_id, $katNev, $v_id);
            $nevStmt->execute();
            $nevStmt->close();
        }
        $katStmt->close();
        echo json_encode(["uzenet" => "Sikeres mentés!", "id" => $versenyzo_id]);
    } else { 
        echo json_encode(["hiba" => "Adatbázis hiba!"]); 
    }

// -----------------------------------------------------------------------------
// 4. FELHASZNÁLÓI BELÉPÉS (Modern, biztonságos azonosítás)
// -----------------------------------------------------------------------------
} elseif ($akcio === 'belepes') {
    $k = json_decode(file_get_contents('php://input'), true);
    $nev = $k['felhasznalonev']; 
    $jel = $k['jelszo'];
    
    $stmt = $kapcsolat->prepare("SELECT * FROM felhasznalok WHERE felhasznalonev = ?");
    $stmt->bind_param("s", $nev);
    $stmt->execute();
    $eredmeny = $stmt->get_result();
    
    if ($eredmeny && $eredmeny->num_rows > 0) { 
        $user = $eredmeny->fetch_assoc();
        // Biztonság: Ha a jelszó hash-elve van a DB-ben, a password_verify() csekkolja.
        // Visszafelé kompatibilitás: Ha egyelőre sima szöveg (pl. "1234"), azt is átengedi.
        if (password_verify($jel, $user['jelszo']) || $user['jelszo'] === $jel) {
            unset($user['jelszo']); // Soha ne küldjük vissza a jelszót a kliensnek!
            echo json_encode(["sikeres" => true, "felhasznalo" => $user]); 
        } else {
            echo json_encode(["sikeres" => false, "uzenet" => "Hibás felhasználónév vagy jelszó!"]); 
        }
    } else { 
        echo json_encode(["sikeres" => false, "uzenet" => "Hibás felhasználónév vagy jelszó!"]); 
    }
    $stmt->close();

// -----------------------------------------------------------------------------
// 5. TELJES ADATBÁZIS TÖRLÉSE
// -----------------------------------------------------------------------------
} elseif ($akcio === 'torles') {
    $kapcsolat->query("DELETE FROM nevezes");
    $kapcsolat->query("DELETE FROM versenyzo");
    $kapcsolat->query("ALTER TABLE versenyzo AUTO_INCREMENT = 1");
    file_put_contents('allapot.json', '{"meccsek":[],"kata":{},"kataStatus":{}}');
    echo json_encode(["uzenet" => "Adatbázis kiürítve!"]);

// -----------------------------------------------------------------------------
// EGYÉB FUNKCIÓK (Állapot, Eredmények, stb. - Prepared Statements alkalmazva)
// -----------------------------------------------------------------------------
} elseif ($akcio === 'allapotLekerdezese') {
    if (file_exists('allapot.json')) { echo file_get_contents('allapot.json'); } 
    else { echo json_encode(["meccsek" => [], "kata" => [], "kataStatus" => []]); }

} elseif ($akcio === 'allapotMentes') {
    $jsonAdat = file_get_contents('php://input');
    file_put_contents('allapot.json', $jsonAdat);
    echo json_encode(["uzenet" => "Állapot mentve a szerverre!"]);

} elseif ($akcio === 'vegeredmenyMentes') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['versenyzo_id'];
    $hely = (int)$adat['helyezes'];
    $pont = (int)$adat['pontszam'];
    $stmt = $kapcsolat->prepare("UPDATE nevezes SET helyezes = ?, pontszam = ? WHERE versenyzo_id = ?");
    $stmt->bind_param("iii", $hely, $pont, $v_id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(["uzenet" => "Végeredmény rögzítve!"]);

} elseif ($akcio === 'eredmenyekLekerdezese') {
    $v_id = isset($_GET['verseny_id']) ? (int)$_GET['verseny_id'] : 1;
    $stmt = $kapcsolat->prepare("SELECT k.megnevezes as kategoria, v.nev as versenyzo_nev, v.egyesulet as klub, n.helyezes
                                 FROM nevezes n
                                 JOIN versenyzo v ON n.versenyzo_id = v.versenyzo_id
                                 JOIN kategoria k ON n.kategoria_id = k.kategoria_id
                                 WHERE n.helyezes > 0 AND n.verseny_id = ?
                                 ORDER BY k.kategoria_id, n.helyezes ASC");
    $stmt->bind_param("i", $v_id);
    $stmt->execute();
    $eredmeny = $stmt->get_result();
    $lista = array(); 
    if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } }
    $stmt->close();
    echo json_encode($lista);

} elseif ($akcio === 'versenyekLekerdezese') {
    $eredmeny = $kapcsolat->query("SELECT verseny_id, nev, datum, nevezes_lezarva FROM verseny ORDER BY datum DESC");
    $lista = array(); 
    if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } }
    echo json_encode($lista);

} elseif ($akcio === 'versenyTorles') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $verseny_id = isset($adat['verseny_id']) ? (int)$adat['verseny_id'] : 0;
    if ($verseny_id > 0) {
        $stmt = $kapcsolat->prepare("DELETE FROM nevezes WHERE verseny_id = ?");
        $stmt->bind_param("i", $verseny_id); $stmt->execute(); $stmt->close();
        $stmt2 = $kapcsolat->prepare("DELETE FROM verseny WHERE verseny_id = ?");
        $stmt2->bind_param("i", $verseny_id); $stmt2->execute(); $stmt2->close();
        echo json_encode(['sikeres' => true, 'uzenet' => 'Verseny és adatai törölve!']);
    } else {
        echo json_encode(['sikeres' => false, 'uzenet' => 'Érvénytelen verseny ID!']);
    }

} elseif ($akcio === 'ujVersenyMentese') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $nev = htmlspecialchars(trim($adat['nev']), ENT_QUOTES, 'UTF-8');
    $datum = htmlspecialchars(trim($adat['datum']), ENT_QUOTES, 'UTF-8');
    if (!empty($nev) && !empty($datum)) {
        $stmt = $kapcsolat->prepare("INSERT INTO verseny (nev, datum) VALUES (?, ?)");
        $stmt->bind_param("ss", $nev, $datum);
        if ($stmt->execute()) { echo json_encode(['sikeres' => true, 'uzenet' => 'Új verseny rögzítve!']); } 
        else { echo json_encode(['sikeres' => false, 'uzenet' => 'Hiba a mentés során!']); }
        $stmt->close();
    }

} elseif ($akcio === 'nevezesAllapotModositas') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['verseny_id'];
    $allapot = (int)$adat['allapot'];
    $stmt = $kapcsolat->prepare("UPDATE verseny SET nevezes_lezarva = ? WHERE verseny_id = ?");
    $stmt->bind_param("ii", $allapot, $v_id); $stmt->execute(); $stmt->close();
    echo json_encode(["sikeres" => true, "uzenet" => "Nevezés állapota módosítva!"]);

} elseif ($akcio === 'kiemelesModositas') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['versenyzo_id'];
    $kiemelt = (int)$adat['kiemelt']; 
    $stmt = $kapcsolat->prepare("UPDATE nevezes SET kiemelt = ? WHERE versenyzo_id = ?");
    $stmt->bind_param("ii", $kiemelt, $v_id); $stmt->execute(); $stmt->close();
    echo json_encode(["sikeres" => true, "uzenet" => "Kiemelés frissítve!"]);

} elseif ($akcio === 'kategoriaModositas') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['versenyzo_id'];
    $regi_kat_nev = $adat['regi_kategoria'];
    $uj_kat_nev = $adat['uj_kategoria'];
    
    $regiStmt = $kapcsolat->prepare("SELECT kategoria_id FROM kategoria WHERE megnevezes = ?");
    $regiStmt->bind_param("s", $regi_kat_nev); $regiStmt->execute(); $regiRes = $regiStmt->get_result();
    
    $ujStmt = $kapcsolat->prepare("SELECT kategoria_id FROM kategoria WHERE megnevezes = ?");
    $ujStmt->bind_param("s", $uj_kat_nev); $ujStmt->execute(); $ujRes = $ujStmt->get_result();
    
    if ($regiRes->num_rows > 0 && $ujRes->num_rows > 0) {
        $regi_kat_id = $regiRes->fetch_assoc()['kategoria_id'];
        $uj_kat_id = $ujRes->fetch_assoc()['kategoria_id'];
        
        $updStmt = $kapcsolat->prepare("UPDATE nevezes SET kategoria_id = ?, kategoria_megnevezes = ? WHERE versenyzo_id = ? AND kategoria_id = ?");
        $updStmt->bind_param("isii", $uj_kat_id, $uj_kat_nev, $v_id, $regi_kat_id);
        $updStmt->execute(); $updStmt->close();
        echo json_encode(["sikeres" => true, "uzenet" => "Kategória sikeresen módosítva!"]);
    } else { echo json_encode(["sikeres" => false, "hiba" => "Nem található a kategória!"]); }
    $regiStmt->close(); $ujStmt->close();

} elseif ($akcio === 'automatikusSulycsoportok') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $torlendo_kategoriak = [];

    foreach ($adat['kategoriak_uj'] as $csoport) {
        $regi_nev = $csoport['regi_nev'];
        $uj_nev = $csoport['uj_nev'];
        $versenyzok = $csoport['versenyzok']; 
        if (empty($versenyzok)) continue;

        $stmt = $kapcsolat->prepare("SELECT * FROM kategoria WHERE megnevezes = ?");
        $stmt->bind_param("s", $regi_nev); $stmt->execute(); $regiRes = $stmt->get_result();
        if ($regiRes->num_rows === 0) { $stmt->close(); continue; }
        $regiKat = $regiRes->fetch_assoc(); $stmt->close();
        
        $regi_id = $regiKat['kategoria_id'];
        $kat_nev_lower = strtolower($regiKat['megnevezes']);
        if (strtoupper($regiKat['tipus']) === 'KATA' || strpos($kat_nev_lower, 'kata') !== false || strpos($kat_nev_lower, 'open') !== false) continue;

        if (!in_array($regi_id, $torlendo_kategoriak)) $torlendo_kategoriak[] = $regi_id;

        $uStmt = $kapcsolat->prepare("SELECT kategoria_id FROM kategoria WHERE megnevezes = ?");
        $uStmt->bind_param("s", $uj_nev); $uStmt->execute(); $ujRes = $uStmt->get_result();
        
        if ($ujRes->num_rows > 0) {
            $uj_id = $ujRes->fetch_assoc()['kategoria_id'];
        } else {
            $iStmt = $kapcsolat->prepare("INSERT INTO kategoria (megnevezes, tipus, nem, min_kor, max_kor) VALUES (?, ?, ?, ?, ?)");
            $iStmt->bind_param("sssii", $uj_nev, $regiKat['tipus'], $regiKat['nem'], $regiKat['min_kor'], $regiKat['max_kor']);
            $iStmt->execute(); $uj_id = $iStmt->insert_id; $iStmt->close();
            
            $tStmt = $kapcsolat->prepare("SELECT tatami_id FROM kategoria_tatami WHERE kategoria_id = ?");
            $tStmt->bind_param("i", $regi_id); $tStmt->execute(); $tatamiRes = $tStmt->get_result();
            if ($tatamiRes->num_rows > 0) {
                $tatami_id = $tatamiRes->fetch_assoc()['tatami_id'];
                $ktStmt = $kapcsolat->prepare("INSERT INTO kategoria_tatami (kategoria_id, tatami_id) VALUES (?, ?)");
                $ktStmt->bind_param("ii", $uj_id, $tatami_id); $ktStmt->execute(); $ktStmt->close();
            }
            $tStmt->close();
        }
        $uStmt->close();
        
        // Versenyzők átdobása biztonságosan
        $v_ids = implode(",", array_map('intval', $versenyzok));
        $updStmt = $kapcsolat->prepare("UPDATE nevezes SET kategoria_id = ?, kategoria_megnevezes = ? WHERE versenyzo_id IN ($v_ids) AND kategoria_id = ?");
        $updStmt->bind_param("isi", $uj_id, $uj_nev, $regi_id);
        $updStmt->execute(); $updStmt->close();
    }
    
    foreach ($torlendo_kategoriak as $del_id) {
        $delStmt = $kapcsolat->prepare("DELETE FROM kategoria WHERE kategoria_id = ?");
        $delStmt->bind_param("i", $del_id); $delStmt->execute(); $delStmt->close();
    }
    echo json_encode(["sikeres" => true, "uzenet" => "Biztonságos optimalizálás kész!"]);

} else { 
    echo json_encode(["hiba" => "Ismeretlen akció!"]); 
}
$kapcsolat->close();
?>