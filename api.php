<?php
// Megmondjuk a böngészőnek, hogy mi JSON formátumban fogunk válaszolni
header('Content-Type: application/json; charset=utf-8');

// 1. Kapcsolódás a XAMPP MySQL adatbázisához
$szerver = "localhost";
$felhasznalo = "root";  // A XAMPP alapértelmezett felhasználója
$jelszo = "";           // A XAMPP-ban alapból nincs jelszó
$adatbazis = "shobu_system_adatbazis"; // Az adatbázisunk neve

// Megpróbálunk kapcsolódni
$kapcsolat = new mysqli($szerver, $felhasznalo, $jelszo, $adatbazis);

// Ha nem sikerül (pl. nincs ilyen nevű adatbázis létrehozva a phpMyAdminban)
if ($kapcsolat->connect_error) {
    echo json_encode(["hiba" => "Adatbázis hiba: " . $kapcsolat->connect_error]);
    exit(); // Kilépünk, ne is fusson tovább
}

// 2. Megnézzük, milyen akciót kért a JavaScript (az URL-ből: ?akcio=...)
$akcio = isset($_GET['akcio']) ? $_GET['akcio'] : '';

// A kérések lekezelése
if ($akcio === 'lekerdezes') {
    // Kérik a versenyzők listáját
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
    // Új versenyző érkezett, el kell menteni
    $kuldottAdatok = json_decode(file_get_contents('php://input'), true);
    
    $nev = $kuldottAdatok['nev'];
    $klub = $kuldottAdatok['klub'];
    $kategoria = $kuldottAdatok['kategoria'];
    $suly = $kuldottAdatok['suly'];
    $kor = $kuldottAdatok['kor'];
    $tulajdonos = $kuldottAdatok['tulajdonos'];
    
    $sql = "INSERT INTO versenyzok (nev, klub, kategoria, suly, kor, tulajdonos) 
            VALUES ('$nev', '$klub', '$kategoria', '$suly', '$kor', '$tulajdonos')";
            
    if ($kapcsolat->query($sql) === TRUE) {
        echo json_encode(["uzenet" => "Sikeres mentés!", "id" => $kapcsolat->insert_id]);
    } else {
        echo json_encode(["hiba" => "Nem sikerült menteni!"]);
    }

} elseif ($akcio === 'belepes') {
    // Bejelentkezés ellenőrzése
    $kuldottAdatok = json_decode(file_get_contents('php://input'), true);
    $beirtNev = $kuldottAdatok['felhasznalonev'];
    $beirtJelszo = $kuldottAdatok['jelszo'];

    $sql = "SELECT * FROM felhasznalok WHERE felhasznalonev = '$beirtNev' AND jelszo = '$beirtJelszo'";
    $eredmeny = $kapcsolat->query($sql);

    if ($eredmeny && $eredmeny->num_rows > 0) {
        $felhasznalo = $eredmeny->fetch_assoc();
        echo json_encode(["sikeres" => true, "felhasznalo" => $felhasznalo]);
    } else {
        echo json_encode(["sikeres" => false, "uzenet" => "Hibás adatok!"]);
    }

} elseif ($akcio === 'torles') {
    // Minden nevező törlése
    $kapcsolat->query("TRUNCATE TABLE versenyzok");
    echo json_encode(["uzenet" => "Adatbázis törölve!"]);

} elseif ($akcio === 'meccsMentes') {
    // (A Kumite ágrajz mentése komplexebb, egyelőre csak küldünk egy sikeres választ, 
    // hogy a JS tudja folytatni a futást hiba nélkül!)
    echo json_encode(["uzenet" => "Meccsek nyugtázva!"]);
} else {
    echo json_encode(["hiba" => "Ismeretlen akció!"]);
}

$kapcsolat->close();
?>