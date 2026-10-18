window.addEventListener('DOMContentLoaded', function() {
    initSzulDatumMezok();
    const form = document.getElementById('coachRegForm');
    if (form) {
        form.onsubmit = regisztracioKuldese;
    }
});

// Fülváltás a Belépés és a Regisztráció között
function valtsAuthFul(ful) {
    const loginDiv = document.getElementById('loginFormContainer');
    const regDiv = document.getElementById('registerFormContainer');
    const btnLogin = document.getElementById('tabBtnLogin');
    const btnReg = document.getElementById('tabBtnReg');

    if (ful === 'register') {
        loginDiv.style.display = 'none';
        regDiv.style.display = 'block';
        btnLogin.classList.remove('active');
        btnReg.classList.add('active');
    } else {
        loginDiv.style.display = 'block';
        regDiv.style.display = 'none';
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
    }
}

// Year / Month / Day legördülő mezők automatikus feltöltése
function initSzulDatumMezok() {
    const yearSel = document.getElementById('regDobYear');
    const monthSel = document.getElementById('regDobMonth');
    const daySel = document.getElementById('regDobDay');
    if (!yearSel || !monthSel || !daySel) return;

    let yHtml = '<option value="">Year</option>';
    const aktEv = new Date().getFullYear();
    for (let y = aktEv - 10; y >= 1940; y--) {
        yHtml += `<option value="${y}">${y}</option>`;
    }
    yearSel.innerHTML = yHtml;

    let mHtml = '<option value="">Month</option>';
    for (let m = 1; m <= 12; m++) {
        let mm = m < 10 ? '0' + m : m;
        mHtml += `<option value="${mm}">${mm}</option>`;
    }
    monthSel.innerHTML = mHtml;

    let dHtml = '<option value="">Day</option>';
    for (let d = 1; d <= 31; d++) {
        let dd = d < 10 ? '0' + d : d;
        dHtml += `<option value="${dd}">${dd}</option>`;
    }
    daySel.innerHTML = dHtml;
}

// "Change selected Club" gomb: kilistázza az adatbázisban már szereplő klubokat
async function valasszMeglevoKlubot() {
    let klubok = ["Shobu HSE", "Vácrátóti HSE", "Castrum SC", "Victory Martfű", "Yakuzák SE", "Kagami SE"];
    try {
        const versenyzok = await TatamiMaster.apiGet('Competitors');
        for (let v of versenyzok) {
            if (v.club && !klubok.includes(v.club)) klubok.push(v.club);
        }
    } catch (e) {}

    const valasztott = prompt(
        "Válassz klubot a listából (írd be a nevét vagy a sorszámát):\n\n" +
        klubok.map((k, idx) => `${idx + 1}. ${k}`).join('\n')
    );

    if (!valasztott) return;
    const sorszam = parseInt(valasztott);
    const clubInput = document.getElementById('regClubName');
    if (!isNaN(sorszam) && sorszam >= 1 && sorszam <= klubok.length) {
        clubInput.value = klubok[sorszam - 1];
    } else {
        clubInput.value = valasztott.trim();
    }
}

// REGISZTRÁCIÓ MENTÉSE -> AUTOMATIKUS EDZŐI (COACH) RANG
async function regisztracioKuldese(event) {
    event.preventDefault();
    const errDiv = document.getElementById('regError');
    errDiv.style.display = 'none';

    const email = document.getElementById('regEmail').value.trim();
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const clubName = document.getElementById('regClubName').value.trim();
    const branchief = document.getElementById('regBranchief').value.trim();
    const country = document.getElementById('regCountry').value;
    const degree = document.getElementById('regDegree').value;
    const ikoMembership = document.getElementById('regIkoMembership').value.trim();
    const sex = document.getElementById('regSex').value;
    const dobYear = document.getElementById('regDobYear').value;
    const dobMonth = document.getElementById('regDobMonth').value;
    const dobDay = document.getElementById('regDobDay').value;
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;

    if (pass !== confirmPass) {
        errDiv.innerText = "❌ A két jelszó nem egyezik meg (Password / Confirm password)!";
        errDiv.style.display = 'block';
        return;
    }

    if (pass.length < 4) {
        errDiv.innerText = "❌ A jelszónak legalább 4 karakter hosszúnak kell lennie!";
        errDiv.style.display = 'block';
        return;
    }

    // Ellenőrizzük, hogy nincs-e már regisztrálva ez az e-mail cím
    let regisztraltEdzok = JSON.parse(localStorage.getItem('regisztraltEdzok') || '[]');
    if (regisztraltEdzok.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        errDiv.innerText = "❌ Ezzel az e-mail címmel már regisztráltak!";
        errDiv.style.display = 'block';
        return;
    }

    const teljesNev = `${lastName} ${firstName}`;
    const ujEdzoProfil = {
        id: Date.now(),
        username: email,
        displayName: teljesNev,
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        club: clubName,
        branchief: branchief,
        country: country,
        degree: degree,
        ikoMembership: ikoMembership,
        sex: sex,
        dateOfBirth: `${dobYear}-${dobMonth}-${dobDay}`,
        password: pass,
        role: 'COACH' // <-- Automatikusan megkapja az Edzői rangot!
    };

    // 1. Elmentjük a regisztrált edzők listájába (minden mezővel)
    regisztraltEdzok.push(ujEdzoProfil);
    localStorage.setItem('regisztraltEdzok', JSON.stringify(regisztraltEdzok));

    // 2. Megpróbáljuk beküldeni a C# Backend /api/Users táblájába is (ha fut az végpont)
    try {
        await TatamiMaster.apiSend('Users', 'POST', {
            username: email,
            password: pass,
            passwordHash: pass,
            role: 'COACH'
        });
    } catch (e) {
        console.warn("C# Users tábla mentés kihagyva, helyi profil mentve.");
    }

    // 3. Automatikusan beléptetjük az új edzőt és átirányítjuk a nevezési felületre!
    TatamiMaster.mentBejelentkezes(ujEdzoProfil);
    alert(`🎉 Sikeres regisztráció!\n\nÜdvözlünk, ${teljesNev} (${clubName})!\nAutomatikusan megkaptad az EDZŐI (COACH) jogosultságot.`);
    window.location.href = 'views/audience.html';
}

// BEJELENTKEZÉS KEZELÉSE
async function bejelentkezes(event) {
    event.preventDefault();
    const uName = document.getElementById('loginUsername').value.trim();
    const uPass = document.getElementById('loginPassword').value.trim();
    const errDiv = document.getElementById('loginError');
    if (errDiv) errDiv.style.display = 'none';

    let sikeresUser = null;

    // 1. Megnézzük a regisztrációs űrlapon regisztrált Edzők között (e-mail vagy teljes név alapján)
    const regisztraltEdzok = JSON.parse(localStorage.getItem('regisztraltEdzok') || '[]');
    const regTalalat = regisztraltEdzok.find(u =>
        (u.email.toLowerCase() === uName.toLowerCase() || u.displayName.toLowerCase() === uName.toLowerCase()) &&
        u.password === uPass
    );
    if (regTalalat) {
        sikeresUser = regTalalat;
    }

    // 2. Megnézzük a C# /api/Users táblában
    if (!sikeresUser) {
        try {
            const res = await fetch(TatamiMaster.API_URL + '/Users');
            if (res.ok) {
                const users = await res.json();
                const talalat = users.find(u =>
                    (u.username && u.username.toLowerCase() === uName.toLowerCase()) &&
                    (u.password === uPass || u.passwordHash === uPass)
                );
                if (talalat) {
                    sikeresUser = {
                        id: talalat.id,
                        username: talalat.username,
                        displayName: talalat.username,
                        role: (talalat.role || 'COACH').toUpperCase()
                    };
                }
            }
        } catch (e) {}
    }

    // 3. Beépített teszt fiókok (Admin, Bíró, Edző)
    if (!sikeresUser) {
        if (uName.toLowerCase() === 'admin' && uPass === 'admin123') {
            sikeresUser = { id: 1, username: 'admin', displayName: 'Adminisztrátor', role: 'ADMIN' };
        } else if ((uName.toLowerCase() === 'biro' || uName.toLowerCase() === 'bíró') && uPass === 'biro123') {
            sikeresUser = { id: 2, username: 'biro', displayName: 'Asztalbíró', role: 'JUDGE' };
        } else if ((uName.toLowerCase() === 'edzo' || uName.toLowerCase() === 'edző' || uName.toLowerCase() === 'coach') && uPass === 'edzo123') {
            sikeresUser = { id: 3, username: 'edzo', displayName: 'Klubedző', club: 'Shobu HSE', role: 'COACH' };
        }
    }

    if (sikeresUser) {
        TatamiMaster.mentBejelentkezes(sikeresUser);
        const role = sikeresUser.role.toUpperCase();

        if (role === 'ADMIN') window.location.href = 'views/admin.html';
        else if (role === 'JUDGE' || role === 'BIRO') window.location.href = 'views/biroi_panel.html';
        else window.location.href = 'views/audience.html';
    } else if (errDiv) {
        errDiv.innerText = "❌ Hibás e-mail cím / felhasználónév vagy jelszó!";
        errDiv.style.display = 'block';
    }
}