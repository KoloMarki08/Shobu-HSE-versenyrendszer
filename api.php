<?php
header('Content-Type: application/json; charset=utf-8');

$szerver = "localhost";
$felhasznalo = "root";  
$jelszo = "";           
$adatbazis = "shobu_system_adatbazis"; 

$kapcsolat = new mysqli($szerver, $felhasznalo, $jelszo, $adatbazis);
if ($kapcsolat->connect_error) { 
    echo json_encode(["hiba" => "Adatbázis hiba: " . $kapcsolat->connect_error]); 
    exit(); 
}

$akcio = isset($_GET['akcio']) ? $_GET['akcio'] : '';

// 1. KATEGÓRIÁK ÉS TATAMIK LEKÉRDEZÉSE
if ($akcio === 'kategoriakLekerdezese') {
    $sql = "SELECT k.kategoria_id as id, k.megnevezes as nev, k.tipus, k.nem, k.min_kor, k.max_kor, t.sorszam as tatami 
            FROM kategoria k 
            LEFT JOIN kategoria_tatami kt ON k.kategoria_id = kt.kategoria_id 
            LEFT JOIN tatami t ON kt.tatami_id = t.tatami_id";
    $eredmeny = $kapcsolat->query($sql);
    $lista = array(); 
    if ($eredmeny) { 
        while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } 
    }
    echo json_encode($lista);

// 2. VERSENYZŐK LEKÉRDEZÉSE (ADOTT VERSENYHEZ)
} elseif ($akcio === 'lekerdezes') {
    $v_id = isset($_GET['verseny_id']) ? (int)$_GET['verseny_id'] : 1;
    $sql = "SELECT v.versenyzo_id as id, v.nev, v.egyesulet as klub, k.megnevezes as kategoria 
            FROM versenyzo v 
            JOIN nevezes n ON v.versenyzo_id = n.versenyzo_id 
            JOIN kategoria k ON n.kategoria_id = k.kategoria_id
            WHERE n.verseny_id = $v_id";
    $eredmeny = $kapcsolat->query($sql);
    $versenyzok = array(); 
    if ($eredmeny) { 
        while($sor = $eredmeny->fetch_assoc()) { $versenyzok[] = $sor; } 
    }
    echo json_encode($versenyzok);

// 3. ÚJ NEVEZÉS RÖGZÍTÉSE
} elseif ($akcio === 'ujNevezes') {
    $k = json_decode(file_get_contents('php://input'), true);
    $nev = $kapcsolat->real_escape_string($k['nev']); 
    $klub = $kapcsolat->real_escape_string($k['klub']); 
    $katNev = $kapcsolat->real_escape_string($k['kategoria']);
    $v_id = isset($k['verseny_id']) ? (int)$k['verseny_id'] : 1; 
    
    if ($kapcsolat->query("INSERT INTO versenyzo (nev, egyesulet) VALUES ('$nev', '$klub')") === TRUE) {
        $versenyzo_id = $kapcsolat->insert_id;
        $katRes = $kapcsolat->query("SELECT kategoria_id FROM kategoria WHERE megnevezes = '$katNev'");
        if ($katRes && $katRes->num_rows > 0) {
            $kat_id = $katRes->fetch_assoc()['kategoria_id'];
            $kapcsolat->query("INSERT INTO nevezes (versenyzo_id, kategoria_id, verseny_id, helyezes, pontszam) VALUES ($versenyzo_id, $kat_id, $v_id, 0, 0)");
        }
        echo json_encode(["uzenet" => "Sikeres mentés!", "id" => $versenyzo_id]);
    } else { 
        echo json_encode(["hiba" => "Adatbázis hiba!"]); 
    }

// 4. FELHASZNÁLÓI BELÉPÉS
} elseif ($akcio === 'belepes') {
    $k = json_decode(file_get_contents('php://input'), true);
    $nev = $kapcsolat->real_escape_string($k['felhasznalonev']); 
    $jel = $kapcsolat->real_escape_string($k['jelszo']);
    
    $eredmeny = $kapcsolat->query("SELECT * FROM felhasznalok WHERE felhasznalonev = '$nev' AND jelszo = '$jel'");
    if ($eredmeny && $eredmeny->num_rows > 0) { 
        echo json_encode(["sikeres" => true, "felhasznalo" => $eredmeny->fetch_assoc()]); 
    } else { 
        echo json_encode(["sikeres" => false, "uzenet" => "Hibás felhasználónév vagy jelszó!"]); 
    }

// 5. TELJES ADATBÁZIS TÖRLÉSE (RESET)
} elseif ($akcio === 'torles') {
    $kapcsolat->query("DELETE FROM nevezes");
    $kapcsolat->query("DELETE FROM versenyzo");
    $kapcsolat->query("ALTER TABLE versenyzo AUTO_INCREMENT = 1");
    file_put_contents('allapot.json', '{"meccsek":[],"kata":{},"kataStatus":{}}');
    echo json_encode(["uzenet" => "Adatbázis kiürítve!"]);

// 6. ÉLŐ ÁLLAPOT KEZELÉSE
} elseif ($akcio === 'allapotLekerdezese') {
    if (file_exists('allapot.json')) { 
        echo file_get_contents('allapot.json'); 
    } else { 
        echo json_encode(["meccsek" => [], "kata" => [], "kataStatus" => []]); 
    }

} elseif ($akcio === 'allapotMentes') {
    $jsonAdat = file_get_contents('php://input');
    file_put_contents('allapot.json', $jsonAdat);
    echo json_encode(["uzenet" => "Állapot mentve a szerverre!"]);

// 7. VÉGEREDMÉNY MENTÉSE
} elseif ($akcio === 'vegeredmenyMentes') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['versenyzo_id'];
    $hely = (int)$adat['helyezes'];
    $pont = (int)$adat['pontszam'];
    $kapcsolat->query("UPDATE nevezes SET helyezes = $hely, pontszam = $pont WHERE versenyzo_id = $v_id");
    echo json_encode(["uzenet" => "Végeredmény beírva a nevezés táblába!"]);

// 8. HIVATALOS EREDMÉNYEK LEKÉRDEZÉSE
} elseif ($akcio === 'eredmenyekLekerdezese') {
    $v_id = isset($_GET['verseny_id']) ? (int)$_GET['verseny_id'] : 1;
    $sql = "SELECT k.megnevezes as kategoria, v.nev as versenyzo_nev, v.egyesulet as klub, n.helyezes
            FROM nevezes n
            JOIN versenyzo v ON n.versenyzo_id = v.versenyzo_id
            JOIN kategoria k ON n.kategoria_id = k.kategoria_id
            WHERE n.helyezes > 0 AND n.verseny_id = $v_id
            ORDER BY k.kategoria_id, n.helyezes ASC";
    
    $eredmeny = $kapcsolat->query($sql);
    $lista = array(); 
    if ($eredmeny) { 
        while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } 
    }
    echo json_encode($lista);

// 9. VERSENYEK LISTÁJÁNAK LEKÉRDEZÉSE
} elseif ($akcio === 'versenyekLekerdezese') {
    $eredmeny = $kapcsolat->query("SELECT verseny_id, nev, datum FROM verseny ORDER BY datum DESC");
    $lista = array(); 
    if ($eredmeny) { 
        while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } 
    }
    echo json_encode($lista);

// 10. EGY KONKRÉT VERSENY ÉS ADATAINAK TÖRLÉSE
} elseif ($akcio === 'versenyTorles') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $verseny_id = isset($adat['verseny_id']) ? (int)$adat['verseny_id'] : 0;

    if ($verseny_id > 0) {
        // Nevezések törlése
        $stmt = $kapcsolat->prepare("DELETE FROM nevezes WHERE verseny_id = ?");
        $stmt->bind_param("i", $verseny_id);
        $stmt->execute();
        $stmt->close();

        // Verseny törlése
        $stmt2 = $kapcsolat->prepare("DELETE FROM verseny WHERE verseny_id = ?");
        $stmt2->bind_param("i", $verseny_id);
        $stmt2->execute();
        $stmt2->close();
        
        echo json_encode(['sikeres' => true, 'uzenet' => 'Verseny és adatai törölve!']);
    } else {
        echo json_encode(['sikeres' => false, 'uzenet' => 'Érvénytelen verseny ID!']);
    }

// 11. ÚJ VERSENY LÉTREHOZÁSA
} elseif ($akcio === 'ujVersenyMentese') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $nev = $kapcsolat->real_escape_string($adat['nev']);
    $datum = $kapcsolat->real_escape_string($adat['datum']);

    if (!empty($nev) && !empty($datum)) {
        $stmt = $kapcsolat->prepare("INSERT INTO verseny (nev, datum) VALUES (?, ?)");
        $stmt->bind_param("ss", $nev, $datum);
        if ($stmt->execute()) {
            echo json_encode(['sikeres' => true, 'uzenet' => 'Új verseny rögzítve!']);
        } else {
            echo json_encode(['sikeres' => false, 'uzenet' => 'Hiba a mentés során!']);
        }
        $stmt->close();
    }

} else { 
    echo json_encode(["hiba" => "Ismeretlen akció!"]); 
}

$kapcsolat->close();
?>