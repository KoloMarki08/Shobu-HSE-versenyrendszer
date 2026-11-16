// ============================================================================
// hCaptcha "EMBER VAGYOK" ELLENŐRZŐ MOTOR (BELÉPÉS ÉS EDZŐI REGISZTRÁCIÓ)
// ============================================================================
const HCAPTCHA_CONFIG = {
    // Ha éles külső hCaptcha Site Key-t szeretnél használni, írd be ide:
    // Üresen hagyva a beépített "Ember vagyok" interaktív ellenőrző modul fut (100% offline/VPS kompatibilis).
    siteKey: '',
    tokenTtlMs: 120000
};

const hcaptchaTelemetria = {
    startTime: Date.now(),
    pointerEvents: 0,
    keyEvents: 0
};

const hcaptchaAllapot = {
    login: { verified: false, verifying: false, token: '', verifiedAt: 0, expiryTimer: null, widgetId: null },
    register: { verified: false, verifying: false, token: '', verifiedAt: 0, expiryTimer: null, widgetId: null }
};

window.addEventListener('DOMContentLoaded', function() {
    initSzulDatumMezok();
    initHCaptchaMotor();

    const form = document.getElementById('coachRegForm');
    if (form) {
        form.onsubmit = regisztracioKuldese;
    }
});

function initHCaptchaMotor() {
    window.addEventListener('pointermove', () => {
        hcaptchaTelemetria.pointerEvents++;
    }, { passive: true });

    window.addEventListener('keydown', () => {
        hcaptchaTelemetria.keyEvents++;
    }, { passive: true });

    // Opcionális éles külső hCaptcha API betöltése, ha van siteKey megadva
    if (HCAPTCHA_CONFIG.siteKey) {
        window.onHCaptchaApiLoad = function() {
            ['login', 'register'].forEach(formKey => {
                const box = document.getElementById(`hcaptchaBox_${formKey}`);
                if (box && window.hcaptcha && typeof window.hcaptcha.render === 'function') {
                    box.innerHTML = '';
                    box.style.padding = '0';
                    box.style.border = 'none';
                    box.style.background = 'transparent';
                    box.style.boxShadow = 'none';
                    hcaptchaAllapot[formKey].widgetId = window.hcaptcha.render(box, {
                        sitekey: HCAPTCHA_CONFIG.siteKey,
                        hl: 'hu',
                        callback: function(token) {
                            hcaptchaAllapot[formKey].verified = true;
                            hcaptchaAllapot[formKey].token = token;
                            hcaptchaAllapot[formKey].verifiedAt = Date.now();
                            const tokenInput = document.getElementById(`hcaptchaToken_${formKey}`);
                            if (tokenInput) tokenInput.value = token;
                        },
                        'expired-callback': function() {
                            resetHCaptcha(formKey);
                        }
                    });
                }
            });
        };

        const script = document.createElement('script');
        script.src = 'https://js.hcaptcha.com/1/api.js?hl=hu&onload=onHCaptchaApiLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

function generalHCaptchaToken(formKey) {
    const ido = Date.now().toString(36);
    const randomPart = Array.from({ length: 28 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    return `P1_${formKey}_${ido}_${randomPart}`;
}

function lekerHoneypotErtek(formKey) {
    const id = formKey === 'login' ? 'loginWebsiteHoneypot' : 'regWebsiteHoneypot';
    return (document.getElementById(id)?.value || '').trim();
}

function billentyuHCaptcha(formKey, event) {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        kattintHCaptcha(formKey, event);
    }
}

async function kattintHCaptcha(formKey, event) {
    const state = hcaptchaAllapot[formKey];
    if (!state || state.verifying || state.verified) return;

    const box = document.getElementById(`hcaptchaBox_${formKey}`);
    const visual = document.getElementById(`hcaptchaVisual_${formKey}`);
    const leftArea = box ? box.querySelector('.hcaptcha-left') : null;
    const tokenInput = document.getElementById(`hcaptchaToken_${formKey}`);
    const errDiv = document.getElementById(formKey === 'login' ? 'loginError' : 'regError');

    if (box) box.classList.remove('error');

    // Honeypot (rejtett bot-csapda) ellenőrzés
    if (lekerHoneypotErtek(formKey).length > 0 || (event && event.isTrusted === false)) {
        jelolHCaptchaHiba(formKey, errDiv, 'Automatizált kérés észlelve. Kérlek, próbáld újra!');
        return;
    }

    state.verifying = true;
    if (box) box.classList.add('verifying');
    if (visual) visual.innerHTML = '<div class="hcaptcha-spinner"></div>';

    // Rövid, valósághű ellenőrzési animáció (pörgő türkiz karika -> pipa)
    await new Promise(resolve => setTimeout(resolve, 460));

    const token = generalHCaptchaToken(formKey);
    state.verifying = false;
    state.verified = true;
    state.token = token;
    state.verifiedAt = Date.now();

    if (tokenInput) tokenInput.value = token;

    if (box) {
        box.classList.remove('verifying', 'error');
        box.classList.add('verified');
    }
    if (leftArea) {
        leftArea.setAttribute('aria-checked', 'true');
    }
    if (visual) {
        visual.innerHTML = '<svg class="hcaptcha-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }

    // Ha korábban a hiányzó pipa miatt volt hibaüzenet, eltüntetjük
    if (errDiv && errDiv.dataset.captchaError === '1') {
        errDiv.style.display = 'none';
        errDiv.dataset.captchaError = '0';
    }

    if (state.expiryTimer) clearTimeout(state.expiryTimer);
    state.expiryTimer = setTimeout(() => {
        resetHCaptcha(formKey);
    }, HCAPTCHA_CONFIG.tokenTtlMs);
}

function resetHCaptcha(formKey) {
    const state = hcaptchaAllapot[formKey];
    if (!state) return;

    if (state.expiryTimer) {
        clearTimeout(state.expiryTimer);
        state.expiryTimer = null;
    }

    state.verified = false;
    state.verifying = false;
    state.token = '';
    state.verifiedAt = 0;

    if (HCAPTCHA_CONFIG.siteKey && window.hcaptcha && state.widgetId !== null) {
        try { window.hcaptcha.reset(state.widgetId); } catch (e) {}
    }

    const box = document.getElementById(`hcaptchaBox_${formKey}`);
    const visual = document.getElementById(`hcaptchaVisual_${formKey}`);
    const leftArea = box ? box.querySelector('.hcaptcha-left') : null;
    const tokenInput = document.getElementById(`hcaptchaToken_${formKey}`);

    if (tokenInput) tokenInput.value = '';
    if (box) box.classList.remove('verified', 'verifying', 'error');
    if (leftArea) leftArea.setAttribute('aria-checked', 'false');
    if (visual) visual.innerHTML = '';
}

function ellenorizHCaptcha(formKey) {
    if (lekerHoneypotErtek(formKey).length > 0) return false;

    const state = hcaptchaAllapot[formKey];
    if (!state) return false;

    if (HCAPTCHA_CONFIG.siteKey && window.hcaptcha && state.widgetId !== null) {
        const resp = window.hcaptcha.getResponse(state.widgetId);
        return Boolean(resp && resp.length > 0);
    }

    if (!state.verified || !state.token) return false;
    if (Date.now() - state.verifiedAt > HCAPTCHA_CONFIG.tokenTtlMs) {
        resetHCaptcha(formKey);
        return false;
    }
    return true;
}

function jelolHCaptchaHiba(formKey, errDiv, uzenet) {
    const box = document.getElementById(`hcaptchaBox_${formKey}`);
    if (box) {
        box.classList.remove('error');
        void box.offsetWidth;
        box.classList.add('error');
        const leftArea = box.querySelector('.hcaptcha-left');
        if (leftArea) leftArea.focus();
    }
    if (errDiv) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} ${uzenet}`;
        errDiv.dataset.captchaError = '1';
        errDiv.style.display = 'block';
    }
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

// REGISZTRÁCIÓ MENTÉSE -> hCaptcha "Ember vagyok" ELLENŐRZÉSSEL
async function regisztracioKuldese(event) {
    event.preventDefault();
    const errDiv = document.getElementById('regError');
    if (errDiv) {
        errDiv.style.display = 'none';
        errDiv.dataset.captchaError = '0';
    }

    if (!ellenorizHCaptcha('register')) {
        jelolHCaptchaHiba('register', errDiv, 'Kérlek, jelöld be az „Ember vagyok” négyzetet a regisztrációhoz!');
        return;
    }

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
    const jelszoHash = TatamiMaster.hashClientPassword(pass);
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
        passwordHash: jelszoHash,
        hcaptchaVerified: true,
        role: 'COACH' // Szerveroldalon is kényszerített Edzői rang
    };

    // 1. Beküldjük a C# Backend /api/Users/register végpontjára (PBKDF2 hasheléssel + aláírt tokennel)
    let szerverElert = false;
    try {
        const regRes = await fetch(TatamiMaster.API_URL + '/Users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: email,
                password: pass,
                role: 'COACH'
            })
        });
        szerverElert = true;

        if (!regRes.ok) {
            let hibaUzenet = 'A regisztráció sikertelen.';
            try {
                const errBody = await regRes.json();
                if (errBody && errBody.error) hibaUzenet = errBody.error;
            } catch (e) {}
            if (errDiv) {
                errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} ${TatamiMaster.escapeHtml(hibaUzenet)}`;
                errDiv.style.display = 'block';
            }
            return;
        }

        const mentettUser = await regRes.json();
        if (mentettUser && mentettUser.id) ujEdzoProfil.id = mentettUser.id;
        if (mentettUser && mentettUser.token) ujEdzoProfil.token = mentettUser.token;
        if (mentettUser && mentettUser.role) ujEdzoProfil.role = mentettUser.role;
    } catch (e) {
        if (!szerverElert) {
            console.warn("C# Users/register végpont nem elérhető, offline edzői profil mentve.");
        }
    }

    // 2. Elmentjük a helyi regisztrált edzői profilok listájába (nyers jelszó NÉLKÜL)
    regisztraltEdzok.push(ujEdzoProfil);
    localStorage.setItem('regisztraltEdzok', JSON.stringify(regisztraltEdzok));

    // 3. Automatikusan kiválasztjuk az éppen aktuális versenyt, beléptetjük az új edzőt és átirányítjuk a nevezési felületre
    TatamiMaster.valasztdAutoAktualisVersenyt();

    const munkamenetProfil = Object.assign({}, ujEdzoProfil);
    delete munkamenetProfil.password;
    delete munkamenetProfil.passwordHash;
    TatamiMaster.mentBejelentkezes(munkamenetProfil);
    alert(`Sikeres regisztráció! Üdvözlünk, ${teljesNev} (${clubName})!`);
    window.location.href = 'views/audience.html';
}

// BEJELENTKEZÉS KEZELÉSE -> hCaptcha + SZERVEROLDALI HITELESÍTÉS & ALÁÍRT TOKEN
async function bejelentkezes(event) {
    event.preventDefault();
    const uName = document.getElementById('loginUsername').value.trim();
    const uPass = document.getElementById('loginPassword').value.trim();
    const errDiv = document.getElementById('loginError');
    if (errDiv) {
        errDiv.style.display = 'none';
        errDiv.dataset.captchaError = '0';
    }

    if (!ellenorizHCaptcha('login')) {
        jelolHCaptchaHiba('login', errDiv, 'Kérlek, jelöld be az „Ember vagyok” négyzetet a bejelentkezéshez!');
        return;
    }

    const regisztraltEdzok = JSON.parse(localStorage.getItem('regisztraltEdzok') || '[]');
    let sikeresUser = null;
    let szerverHibaUzenet = '';

    // 1. Szerveroldali hitelesítés a C# /api/Users/login végponton keresztül (PBKDF2 + Rate Limit + HMAC token)
    try {
        const res = await fetch(TatamiMaster.API_URL + '/Users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uName,
                password: uPass,
                captchaToken: (hcaptchaAllapot.login && hcaptchaAllapot.login.token) || '',
                honeypot: lekerHoneypotErtek('login')
            })
        });

        if (res.ok) {
            const authUser = await res.json();
            const helyiEdzo = regisztraltEdzok.find(u =>
                (u.email && u.email.toLowerCase() === String(authUser.username || '').toLowerCase()) ||
                (u.displayName && u.displayName.toLowerCase() === uName.toLowerCase())
            );
            sikeresUser = {
                id: authUser.id,
                username: authUser.username,
                displayName: (helyiEdzo && helyiEdzo.displayName) ? helyiEdzo.displayName : (authUser.displayName || authUser.username),
                club: helyiEdzo ? helyiEdzo.club : '',
                degree: helyiEdzo ? helyiEdzo.degree : '',
                role: (authUser.role || 'COACH').toUpperCase(),
                token: authUser.token || ''
            };
        } else {
            try {
                const errJson = await res.json();
                if (errJson && errJson.error) szerverHibaUzenet = errJson.error;
            } catch (e) {}
            if (!szerverHibaUzenet) {
                szerverHibaUzenet = 'Hibás e-mail cím / felhasználónév vagy jelszó!';
            }
        }
    } catch (e) {
        // 2. Kizárólag offline / elérhetetlen backend esetén: helyi hashelt edzői profil ellenőrzése
        const bevittHash = TatamiMaster.hashClientPassword(uPass);
        const regTalalat = regisztraltEdzok.find(u =>
            ((u.email && u.email.toLowerCase() === uName.toLowerCase()) ||
             (u.displayName && u.displayName.toLowerCase() === uName.toLowerCase())) &&
            ((u.passwordHash && u.passwordHash === bevittHash) || (u.password && u.password === uPass))
        );
        if (regTalalat) {
            const tiszta = Object.assign({}, regTalalat);
            delete tiszta.password;
            delete tiszta.passwordHash;
            sikeresUser = tiszta;
        } else {
            szerverHibaUzenet = 'A hitelesítő szerver jelenleg nem elérhető!';
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
    } else {
        resetHCaptcha('login');
        if (errDiv) {
            errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} ${TatamiMaster.escapeHtml(szerverHibaUzenet || 'Hibás e-mail cím / felhasználónév vagy jelszó!')}`;
            errDiv.style.display = 'block';
        }
    }
}
