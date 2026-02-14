<?php
// api.php - Ez fogadja a JavaScript üzeneteit és beszél a MySQL-el

// 1. Kapcsolódás a MySQL adatbázishoz (XAMPP alap beállítások)
$szerver = "localhost";
$felhasznalo = "root";
$jelszo = "";
$adatbazis = "shobu_verseny";

$kapcsolat = new mysqli($szerver, $felhasznalo, $jelszo, $adatbazis);

if ($kapcsolat->connect_error) {
    die("Hiba a MySQL kapcsolattal: " . $kapcsolat->connect_error);
}

// 2. Megnézzük, mit akar tőlünk a JavaScript (GET vagy POST)
$keres_tipusa = $_SERVER['REQUEST_METHOD'];

// Ha a JS adatokat KÉR (GET)
if ($keres_tipusa === 'GET') {
    // Kiolvassuk az összes versenyzőt
    $sql = "SELECT * FROM versenyzok";
    $eredmeny = $kapcsolat->query($sql);
    
    $versenyzok = array();
    while($sor = $eredmeny->fetch_assoc()) {
        $versenyzok[] = $sor;
    }
    
    // Visszaküldjük a JS-nek JSON formátumban (amit megért)
    echo json_encode($versenyzok);
}

// Ha a JS új adatot KÜLD (POST) - pl. egy új nevezést
if ($keres_tipusa === 'POST') {
    // Elkapjuk a JS által küldött adatokat
    $kuldottAdatok = json_decode(file_get_contents('php://input'), true);
    
    $nev = $kuldottAdatok['nev'];
    $klub = $kuldottAdatok['klub'];
    $kategoria = $kuldottAdatok['kategoria'];
    $tulajdonos = $kuldottAdatok['tulajdonos'];
    
    // Beszúrjuk a MySQL-be
    $sql = "INSERT INTO versenyzok (nev, klub, kategoria, tulajdonos) 
            VALUES ('$nev', '$klub', '$kategoria', '$tulajdonos')";
            
    if ($kapcsolat->query($sql) === TRUE) {
        echo json_encode(["uzenet" => "Sikeresen mentve a MySQL-be!"]);
    } else {
        echo json_encode(["hiba" => "MySQL Hiba: " . $kapcsolat->error]);
    }
}

$kapcsolat->close();
?>