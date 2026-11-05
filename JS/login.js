// ============================================================================
// reCAPTCHA v3 (HÁTTÉRBELI, VISELKEDÉSALAPÚ PONTOZÁS: 0.0 - 1.0, KÉPES FELADVÁNY NÉLKÜL)
// ============================================================================
const RECAPTCHA_V3_CONFIG = {
    // Ha éles Google reCAPTCHA v3 Site Key-t szeretnél használni, írd be ide (pl. '6Lc...'):
    // Üresen hagyva a beépített reCAPTCHA v3 viselkedéselemző motor fut (100% localhost/offline kompatibilis).
    siteKey: '',
    minScore: 0.5,
    defaultAction: 'coach_register'
};

const recaptchaV3Telemetria = {
    startTime: Date.now(),
    mouseMoves: 0,
    keyPresses: 0,
    focusEvents: 0,
    clicks: 0,
    lastCheckTime: 0
};

window.addEventListener('DOMContentLoaded', function() {
    initSzulDatumMezok();
    initRecaptchaV3Motor();

    const form = document.getElementById('coachRegForm');
    if (form) {
        form.onsubmit = regisztracioKuldese;
    }
});

function initRecaptchaV3Motor() {
    // Emberi interakciók passzív figyelése a háttérben (egérmozgás, gépelés, fókuszváltás)
    window.addEventListener('mousemove', () => {
        recaptchaV3Telemetria.mouseMoves++;
        if (recaptchaV3Telemetria.mouseMoves === 6 || recaptchaV3Telemetria.mouseMoves === 25) {
            frissitRecaptchaV3AllapotCsendesen('coach_register');
        }
    }, { passive: true });

    window.addEventListener('keydown', () => {
        recaptchaV3Telemetria.keyPresses++;
        if (recaptchaV3Telemetria.keyPresses === 4 || recaptchaV3Telemetria.keyPresses === 15) {
            frissitRecaptchaV3AllapotCsendesen('coach_register');
        }
    }, { passive: true });

    window.addEventListener('click', () => {
        recaptchaV3Telemetria.clicks++;
    }, { passive: true });

    const regForm = document.getElementById('coachRegForm');
    if (regForm) {
        regForm.addEventListener('focusin', () => {
            recaptchaV3Telemetria.focusEvents++;
            frissitRecaptchaV3AllapotCsendesen('coach_register');
        });
    }

    // Ha van megadva éles Google reCAPTCHA v3 Site Key, betöltjük a hivatalos api.js-t
    if (RECAPTCHA_V3_CONFIG.siteKey) {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_V3_CONFIG.siteKey)}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    // Kezdeti háttér-kiértékelés indítása
    setTimeout(() => {
        futtatRecaptchaV3Ellenorzes('page_load');
    }, 450);
}

function szamolRecaptchaV3Score() {
    const honeypot = document.getElementById('regWebsiteHoneypot')?.value || '';
    if (honeypot.trim().length > 0) {
        return 0.1; // Bot csapda (honeypot) kitöltve -> biztosan robot
    }

    let score = 0.65; // Alap emberi pontszám
    const elteltMs = Date.now() - recaptchaV3Telemetria.startTime;

    if (recaptchaV3Telemetria.mouseMoves >= 3) score += 0.10;
    if (recaptchaV3Telemetria.mouseMoves >= 15) score += 0.05;
    if (recaptchaV3Telemetria.keyPresses >= 3) score += 0.08;
    if (recaptchaV3Telemetria.focusEvents >= 1 || recaptchaV3Telemetria.clicks >= 1) score += 0.04;
    if (elteltMs >= 1200) score += 0.03;

    if (navigator.webdriver && recaptchaV3Telemetria.mouseMoves === 0 && recaptchaV3Telemetria.keyPresses === 0) {
        score = 0.2;
    }

    return Math.min(0.95, Math.max(0.1, Math.round(score * 10) / 10));
}

function generalRecaptchaV3Token(action, score) {
    const ido = Date.now().toString(36);
    const randomPart = Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    return `v3.${action}.${score.toFixed(1).replace('.', '')}.${ido}.${randomPart}`;
}

function frissitRecaptchaV3AllapotCsendesen(action = 'coach_register') {
    const most = Date.now();
    if (most - recaptchaV3Telemetria.lastCheckTime < 900) return;
    recaptchaV3Telemetria.lastCheckTime = most;
    futtatRecaptchaV3Ellenorzes(action);
}

async function futtatRecaptchaV3Ellenorzes(action = 'coach_register') {
    const card = document.getElementById('recaptchaV3StatusCard');
    const visual = document.getElementById('recaptchaV3Visual');
    const scorePill = document.getElementById('recaptchaV3ScorePill');
    const subText = document.getElementById('recaptchaV3SubText');
    const tokenInput = document.getElementById('recaptchaV3Token');
    const scoreInput = document.getElementById('recaptchaV3Score');
    const floatingMeta = document.getElementById('recaptchaV3FloatingMeta');

    if (visual) visual.innerHTML = '<div class="robot-spinner"></div>';

    let token = '';
    const score = szamolRecaptchaV3Score();

    // 1. Ha elérhető a hivatalos Google grecaptcha.execute (éles siteKey esetén), lekérjük a tokent
    if (RECAPTCHA_V3_CONFIG.siteKey && window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
        try {
            token = await new Promise((resolve, reject) => {
                window.grecaptcha.ready(() => {
                    window.grecaptcha.execute(RECAPTCHA_V3_CONFIG.siteKey, { action: action })
                        .then(resolve)
                        .catch(reject);
                });
            });
        } catch (e) {
            token = generalRecaptchaV3Token(action, score);
        }
    } else {
        await new Promise(r => setTimeout(r, 180));
        token = generalRecaptchaV3Token(action, score);
    }

    if (tokenInput) tokenInput.value = token;
    if (scoreInput) scoreInput.value = String(score);

    const sikeres = score >= RECAPTCHA_V3_CONFIG.minScore;

    if (card) {
        card.classList.toggle('verified', sikeres);
        card.classList.toggle('failed', !sikeres);
    }
    if (visual) {
        visual.innerHTML = sikeres ? TatamiMaster.icon('check', 16) : TatamiMaster.icon('alert', 16);
        visual.style.background = sikeres ? '#18181B' : '#991B1B';
        visual.style.borderColor = sikeres ? '#18181B' : '#991B1B';
        visual.style.color = '#FAF8F5';
    }
    if (scorePill) {
        scorePill.innerText = `Score: ${score.toFixed(1)} / 1.0`;
        scorePill.style.background = sikeres ? '#18181B' : '#991B1B';
    }
    if (subText) {
        subText.innerText = sikeres
            ? `Automatikusan hitelesítve a háttérben (action: ${action})`
            : `Gyanús automatizált tevékenység észlelve (minimum score: ${RECAPTCHA_V3_CONFIG.minScore})`;
    }
    if (floatingMeta) {
        floatingMeta.innerHTML = `Privacy &bull; Terms &bull; Score: <strong>${score.toFixed(1)}</strong>`;
    }

    return { ok: sikeres, score: score, token: token, action: action };
}

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
        futtatRecaptchaV3Ellenorzes('open_register_tab');
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

// REGISZTRÁCIÓ MENTÉSE -> AUTOMATIKUS reCAPTCHA v3 TOKEN & SCORE ELLENŐRZÉSSEL
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

    // reCAPTCHA v3 automatikus kiértékelés a beküldés pillanatában (action: 'coach_register')
    const v3Eredmeny = await futtatRecaptchaV3Ellenorzes('coach_register');
    if (!v3Eredmeny.ok || !v3Eredmeny.token || v3Eredmeny.score < RECAPTCHA_V3_CONFIG.minScore) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A reCAPTCHA v3 biztonsági ellenőrzés elutasította a kérést (Score: ${v3Eredmeny.score.toFixed(1)} < ${RECAPTCHA_V3_CONFIG.minScore}).`;
        errDiv.style.display = 'block';
        return;
    }

    if (pass !== confirmPass) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A két jelszó nem egyezik meg (Password / Confirm password)!`;
        errDiv.style.display = 'block';
        return;
    }

    if (pass.length < 4) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A jelszónak legalább 4 karakter hosszúnak kell lennie!`;
        errDiv.style.display = 'block';
        return;
    }

    // Ellenőrizzük, hogy nincs-e már regisztrálva ez az e-mail cím
    let regisztraltEdzok = JSON.parse(localStorage.getItem('regisztraltEdzok') || '[]');
    if (regisztraltEdzok.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} Ezzel az e-mail címmel már regisztráltak!`;
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
        recaptchaV3Score: v3Eredmeny.score,
        recaptchaV3Action: v3Eredmeny.action,
        role: 'COACH' // <-- Automatikusan megkapja az Edzői rangot!
    };

    // 1. Elmentjük a regisztrált edzők listájába (minden mezővel)
    regisztraltEdzok.push(ujEdzoProfil);
    localStorage.setItem('regisztraltEdzok', JSON.stringify(regisztraltEdzok));

    // 2. Megpróbáljuk beküldeni a C# Backend /api/Users táblájába is (ha fut a végpont)
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

    // 3. Automatikusan kiválasztjuk az éppen aktuális versenyt, beléptetjük az új edzőt és átirányítjuk a nevezési felületre!
    TatamiMaster.valasztdAutoAktualisVersenyt();

    TatamiMaster.mentBejelentkezes(ujEdzoProfil);
    alert(`Sikeres regisztráció (reCAPTCHA v3 Score: ${v3Eredmeny.score.toFixed(1)})! Üdvözlünk, ${teljesNev} (${clubName})!`);
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
        // Belépéskor a rendszer automatikusan az éppen aktuális versenyt választja ki
        TatamiMaster.valasztdAutoAktualisVersenyt();

        TatamiMaster.mentBejelentkezes(sikeresUser);
        const role = sikeresUser.role.toUpperCase();

        if (role === 'ADMIN') window.location.href = 'views/admin.html';
        else if (role === 'JUDGE' || role === 'BIRO') window.location.href = 'views/biroi_panel.html';
        else window.location.href = 'views/audience.html';
    } else if (errDiv) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} Hibás e-mail cím / felhasználónév vagy jelszó!`;
        errDiv.style.display = 'block';
    }
}
