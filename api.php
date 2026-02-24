<?php
header('Content-Type: application/json; charset=utf-8');

$szerver = "localhost";
$felhasznalo = "root";  
$jelszo = "";           
$adatbazis = "shobu_system_adatbazis"; 

$kapcsolat = new mysqli($szerver, $felhasznalo, $jelszo, $adatbazis);
if ($kapcsolat->connect_error) { echo json_encode(["hiba" => "Adatbázis hiba: " . $kapcsolat->connect_error]); exit(); }

$akcio = isset($_GET['akcio']) ? $_GET['akcio'] : '';

// 1. KATEGÓRIÁK ÉS TATAMIK (A te kategoria és kategoria_tatami tábláidból)
// 1. KATEGÓRIÁK ÉS TATAMIK
if ($akcio === 'kategoriakLekerdezese') {
    // Itt bekérjük az új oszlopokat (tipus, nem, min_kor, max_kor) is!
    $sql = "SELECT k.kategoria_id as id, k.megnevezes as nev, k.tipus, k.nem, k.min_kor, k.max_kor, t.sorszam as tatami 
            FROM kategoria k 
            LEFT JOIN kategoria_tatami kt ON k.kategoria_id = kt.kategoria_id 
            LEFT JOIN tatami t ON kt.tatami_id = t.tatami_id";
    $eredmeny = $kapcsolat->query($sql);
    $lista = array(); if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $lista[] = $sor; } }
    echo json_encode($lista);

// 2. VERSENYZŐK (A te nevezes és versenyzo tábládból)
} elseif ($akcio === 'lekerdezes') {
    $sql = "SELECT v.versenyzo_id as id, v.nev, v.egyesulet as klub, k.megnevezes as kategoria 
            FROM versenyzo v 
            JOIN nevezes n ON v.versenyzo_id = n.versenyzo_id 
            JOIN kategoria k ON n.kategoria_id = k.kategoria_id";
    $eredmeny = $kapcsolat->query($sql);
    $versenyzok = array(); if ($eredmeny) { while($sor = $eredmeny->fetch_assoc()) { $versenyzok[] = $sor; } }
    echo json_encode($versenyzok);

// 3. NEVEZÉS (Mentés a versenyzo és a nevezes táblába!)
} elseif ($akcio === 'ujNevezes') {
    $k = json_decode(file_get_contents('php://input'), true);
    $nev = $kapcsolat->real_escape_string($k['nev']); 
    $klub = $kapcsolat->real_escape_string($k['klub']); // Ezt rakjuk az "egyesulet" oszlopba
    $katNev = $kapcsolat->real_escape_string($k['kategoria']);
    
    // A) Beszúrjuk a versenyzőt a te tábládba
    if ($kapcsolat->query("INSERT INTO versenyzo (nev, egyesulet) VALUES ('$nev', '$klub')") === TRUE) {
        $versenyzo_id = $kapcsolat->insert_id;
        
        // B) Megkeressük a kategória ID-ját
        $katRes = $kapcsolat->query("SELECT kategoria_id FROM kategoria WHERE megnevezes = '$katNev'");
        if ($katRes && $katRes->num_rows > 0) {
            $kat_id = $katRes->fetch_assoc()['kategoria_id'];
            // C) Összekapcsoljuk őket a te 'nevezes' tábládban!
            $kapcsolat->query("INSERT INTO nevezes (versenyzo_id, kategoria_id, helyezes, pontszam) VALUES ($versenyzo_id, $kat_id, 0, 0)");
        }
        echo json_encode(["uzenet" => "Sikeres mentés!", "id" => $versenyzo_id]);
    } else { echo json_encode(["hiba" => "Adatbázis hiba!"]); }

// 4. BELÉPÉS (Mostantól az adatbázis 'felhasznalok' tábláját használja!)
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

// 5. TELJES ADATBÁZIS TÖRLÉSE
} elseif ($akcio === 'torles') {
    $kapcsolat->query("DELETE FROM nevezes");
    $kapcsolat->query("DELETE FROM versenyzo");
    $kapcsolat->query("ALTER TABLE versenyzo AUTO_INCREMENT = 1");
    file_put_contents('allapot.json', '{"meccsek":[],"kata":{},"kataStatus":{}}');
    echo json_encode(["uzenet" => "Adatbázis kiürítve!"]);

// 6. ÉLŐ KÖZVETÍTÉS (A szerveren lévő fájlba ment, nem táblába!)
} elseif ($akcio === 'allapotLekerdezese') {
    if (file_exists('allapot.json')) { echo file_get_contents('allapot.json'); } 
    else { echo json_encode(["meccsek" => [], "kata" => [], "kataStatus" => []]); }

} elseif ($akcio === 'allapotMentes') {
    $jsonAdat = file_get_contents('php://input');
    file_put_contents('allapot.json', $jsonAdat);
    echo json_encode(["uzenet" => "Állapot mentve a szerverre!"]);

// 7. VÉGEREDMÉNY MENTÉSE A NEVEZÉS TÁBLÁBA!
} elseif ($akcio === 'vegeredmenyMentes') {
    $adat = json_decode(file_get_contents('php://input'), true);
    $v_id = (int)$adat['versenyzo_id'];
    $hely = (int)$adat['helyezes'];
    $pont = (int)$adat['pontszam'];
    $kapcsolat->query("UPDATE nevezes SET helyezes = $hely, pontszam = $pont WHERE versenyzo_id = $v_id");
    echo json_encode(["uzenet" => "Végeredmény beírva a nevezés táblába!"]);

} else { echo json_encode(["hiba" => "Ismeretlen akció!"]); }
$kapcsolat->close();
?>