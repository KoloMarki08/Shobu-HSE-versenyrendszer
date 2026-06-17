<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TATAMI MASTER Versenyrendszer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="stilus.css">
    <link rel="icon" href="logo.jpg">
</head>

<body class="oldal-alap-hattere">

    <div id="app" class="fo-alkalmazas-tarolo">
        <nav class="felso-menusor">
            <div class="menu-tartalom">
                <div class="logonk">
                    <span class="logo-szoveg">TATAMI MASTER <span class="piros-kiemeles">Versenyrendszer</span></span>
                    <span id="user-badge" class="felhasznalo-jelzo">Betöltés...</span>
                </div>
                <div class="menu-gombok">
                    <button onclick="valtFul('kategoriak')">Kategóriák</button>
                    <button id="nav-reg" onclick="valtFul('reg')" class="hidden">Nevezés</button>
                    <button onclick="valtFul('tatami')" style="color:#facc15;">Tatami Nézet</button>
                    <button onclick="valtFul('eredmenyek')" style="color:#60a5fa;">Végeredmények</button>
                    <button id="nav-admin" onclick="valtFul('admin')" class="hidden" style="color:#ef4444; font-weight:bold;">ADMIN PANEL</button>
                    <button onclick="kijelentkezesVersenybol()">Kilépés</button>
                </div>
            </div>
        </nav>

        <?php include 'fulek/kategoriak.html'; ?>
        <?php include 'fulek/nevezes.html'; ?>
        <?php include 'fulek/tatami.html'; ?>
        <?php include 'fulek/eredmenyek.html'; ?>
        <?php include 'fulek/kiemeles.html'; ?>
        
        <?php include 'fulek/kumite.html'; ?>
        <?php include 'fulek/kata.html'; ?>
        
        <?php include 'fulek/biroi_panel.html'; ?>
        <?php include 'fulek/admin.html'; ?>
        
    </div>

    <script src="data.js"></script>
    <script src="auth.js"></script>
    <script src="sorsolas.js"></script> 
    <script src="KUMITE.js"></script>
    <script src="KATA.js"></script>
    <script src="jelszomegjelenito.js"></script>
    
    <script>
        window.onload = function () {
            if (typeof ellenorizBejelentkezestVersenyOldalon === "function") {
                ellenorizBejelentkezestVersenyOldalon();
            }
        };
    </script>
</body>
</html>