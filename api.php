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

if ($akcio === 'kategoriakLekerdezese') {
    $sql = "SELECT * FROM kategoriak ORDER BY id ASC";
    $eredmeny = $kapcsolat->query($sql);
    
    $kategoriak_lista = array();
    if ($eredmeny) {
        while($sor = $eredmeny->fetch_assoc()) {
            $sor['minKor'] = (int)$sor['minKor'];
            $sor['maxKor'] = (int)$sor['maxKor'];
            $kategoriak_lista[] = $sor;
        }
    }
    echo json_encode($kategoriak_lista);

} elseif ($akcio === 'lekerdezes') {
    $sql = "SELECT * FROM versenyzok";
    $eredmeny = $kapcsolat->query($sql);
    
    $versenyzok = array();
    if ($eredmeny) {
        while($sor = $eredmeny->fetch_assoc()) {
            $versenyzok[] = $sor;
        }
    }
    echo json_encode($versenyzok);

} elseif ($akcio === 'ujNevezes') {
    $kuldottAdatok = json_decode(file_get_contents('php://input'), true);
    
    $nev = $kapcsolat->real_escape_string($kuldottAdatok['nev']);
    $klub = $kapcsolat->real_escape_string($kuldottAdatok['klub']);
    $kategoria = $kapcsolat->real_escape_string($kuldottAdatok['kategoria']);
    $suly = $kapcsolat->real_escape_string($kuldottAdatok['suly']);
    $kor = $kapcsolat->real_escape_string($kuldottAdatok['kor']);
    $tulajdonos = $kapcsolat->real_escape_string($kuldottAdatok['tulajdonos']);
    
    $sql = "INSERT INTO versenyzok (nev, klub, kategoria, suly, kor, tulajdonos) 
            VALUES ('$nev', '$klub', '$kategoria', '$suly', '$kor', '$tulajdonos')";
            
    if ($kapcsolat->query($sql) === TRUE) {
        echo json_encode(["uzenet" => "Sikeres mentés!", "id" => $kapcsolat->insert_id]);
    } else {
        echo json_encode(["hiba" => "Nem sikerült menteni!"]);
    }

} elseif ($akcio === 'belepes') {
    $kuldottAdatok = json_decode(file_get_contents('php://input'), true);
    $beirtNev = $kapcsolat->real_escape_string($kuldottAdatok['felhasznalonev']);
    $beirtJelszo = $kapcsolat->real_escape_string($kuldottAdatok['jelszo']);

    $sql = "SELECT * FROM felhasznalok WHERE felhasznalonev = '$beirtNev' AND jelszo = '$beirtJelszo'";
    $eredmeny = $kapcsolat->query($sql);

    if ($eredmeny && $eredmeny->num_rows > 0) {
        $felhasznalo = $eredmeny->fetch_assoc();
        echo json_encode(["sikeres" => true, "felhasznalo" => $felhasznalo]);
    } else {
        echo json_encode(["sikeres" => false, "uzenet" => "Hibás adatok!"]);
    }

} elseif ($akcio === 'torles') {
    if ($kapcsolat->query("DELETE FROM versenyzok") === TRUE) {
        $kapcsolat->query("ALTER TABLE versenyzok AUTO_INCREMENT = 1");
        echo json_encode(["uzenet" => "MySQL adatbázis sikeresen kiürítve!"]);
    } else {
        echo json_encode(["hiba" => "MySQL Hiba: " . $kapcsolat->error]);
    }

} elseif ($akcio === 'meccsMentes') {
    echo json_encode(["uzenet" => "Meccsek nyugtázva!"]);
} else {
    echo json_encode(["hiba" => "Ismeretlen akció!"]);
}

$kapcsolat->close();
?>