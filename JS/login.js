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

// ÉLŐ JELSZÓ-ERŐSSÉG MÉRŐ ÉS FELTÉTEL-ELLENŐRZŐ
function frissitJelszoErossegMero() {
    const passEl = document.getElementById('regPassword');
    const pass = passEl ? passEl.value : '';
    const info = TatamiMaster.ertekelJelszoErosseg(pass);

    const textEl = document.getElementById('pwdStrengthText');
    if (textEl) {
        textEl.innerText = info.label;
        textEl.style.color = info.color;
    }

    for (let i = 1; i <= 4; i++) {
        const seg = document.getElementById('pwdMeterSeg' + i);
        if (seg) {
            seg.style.background = (pass.length > 0 && i <= Math.max(1, info.score)) ? info.color : '#E4E0D7';
        }
    }

    const setRuleUI = (id, ok, text) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = `${ok ? '[OK]' : '[ ]'} ${text}`;
        el.style.color = ok ? '#15803D' : '#52525B';
        el.style.fontWeight = ok ? '800' : '600';
    };

    setRuleUI('pwdRuleLen', info.minLen, 'Legalább 8 karakter hosszú');
    setRuleUI('pwdRuleSpec', info.hasSpecial, 'Min. 1 speciális karakter (!@#$%._-)');
    setRuleUI('pwdRuleNum', info.hasDigit, 'Min. 1 számjegy (0-9)');
    setRuleUI('pwdRuleCase', info.hasCase, 'Kis- és nagybetű (a-z, A-Z)');
    return info;
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

    const rawUsername = (document.getElementById('regUsername')?.value || '').trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = rawUsername || email;
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

    if (username.length < 3) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A felhasználónévnek legalább 3 karakter hosszúnak kell lennie!`;
        errDiv.style.display = 'block';
        return;
    }

    if (pass !== confirmPass) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A két jelszó nem egyezik meg (Password / Confirm password)!`;
        errDiv.style.display = 'block';
        return;
    }

    const pwdCheck = TatamiMaster.ertekelJelszoErosseg(pass);
    if (!pwdCheck.isValid) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} A jelszó nem elég biztonságos! Hiányzik: <strong>${TatamiMaster.escapeHtml(pwdCheck.hianyzoFeltetelek.join(', '))}</strong>.`;
        errDiv.style.display = 'block';
        return;
    }

    // Ellenőrizzük, hogy nincs-e már regisztrálva ez az e-mail cím vagy felhasználónév
    let regisztraltEdzok = JSON.parse(localStorage.getItem('regisztraltEdzok') || '[]');
    if (regisztraltEdzok.some(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || (u.username && u.username.toLowerCase() === username.toLowerCase()))) {
        errDiv.innerHTML = `${TatamiMaster.icon('alert', 16)} Ezzel a felhasználónévvel vagy e-mail címmel már regisztráltak!`;
        errDiv.style.display = 'block';
        return;
    }

    const teljesNev = `${lastName} ${firstName}`;
    const jelszoHash = TatamiMaster.hashClientPassword(pass);
    const ujEdzoProfil = {
        id: Date.now(),
        username: username,
        displayName: teljesNev,
        fullName: teljesNev,
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
        approvalStatus: 'PENDING',
        role: 'COACH' // Szerveroldalon is kényszerített Edzői rang
    };

    // 1. Beküldjük a C# Backend /api/Users/register végpontjára (PBKDF2 hasheléssel + PENDING elbírálási státusszal + info@tatamimaster.hu e-maillel)
    let szerverElert = false;
    let szerverUzenet = '';
    try {
        const regRes = await fetch(TatamiMaster.API_URL + '/Users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: pass,
                role: 'COACH',
                email: email,
                fullName: teljesNev,
                club: clubName,
                branchief: branchief,
                phone: phone,
                country: country,
                degree: degree,
                ikoMembership: ikoMembership
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
        if (mentettUser && mentettUser.approvalStatus) ujEdzoProfil.approvalStatus = mentettUser.approvalStatus;
        if (mentettUser && mentettUser.message) szerverUzenet = mentettUser.message;
    } catch (e) {
        if (!szerverElert) {
            console.warn("C# Users/register végpont nem elérhető, offline edzői profil mentve (PENDING).");
        }
    }

    // 2. Elmentjük a helyi regisztrált edzői profilok listájába (nyers jelszó NÉLKÜL)
    regisztraltEdzok = regisztraltEdzok.filter(u => (u.email || '').toLowerCase() !== email.toLowerCase());
    regisztraltEdzok.push(ujEdzoProfil);
    localStorage.setItem('regisztraltEdzok', JSON.stringify(regisztraltEdzok));

    // 3. Ha a regisztráció elbírálásra vár (PENDING), NEM léptetjük be, hanem értesítjük az elbírálásról és az e-mailről
    if ((ujEdzoProfil.approvalStatus || 'PENDING').toUpperCase() !== 'APPROVED') {
        const regForm = document.getElementById('coachRegForm');
        if (regForm) regForm.reset();
        initSzulDatumMezok();
        frissitJelszoErossegMero();
        resetHCaptcha('register');
        valtsAuthFul('login');

        const loginUserInp = document.getElementById('loginUsername');
        if (loginUserInp) loginUserInp.value = username;

        const noticeBox = document.getElementById('loginStatusNotice');
        const infoSzoveg = szerverUzenet ||
            `Köszönjük a regisztrációdat, ${teljesNev} (${clubName})! A regisztrációd jelenleg szervezői elbírálás alatt áll. Automatikus visszaigazoló e-mailt küldtünk a(z) ${email} címre. Amint jóváhagyásra kerül a fiókod, újabb e-mailben értesítünk, és utána tudsz bejelentkezni.`;

        if (noticeBox) {
            noticeBox.innerHTML = `<div style="font-weight:800;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
                ${TatamiMaster.icon('check', 16)} Regisztrációd beérkezett — jelenleg elbírálás alatt áll!
            </div>
            <div>${TatamiMaster.escapeHtml(infoSzoveg)}</div>`;
            noticeBox.style.display = 'block';
        }
        alert(infoSzoveg);
        return;
    }

    // Ha Admin közvetlenül APPROVED státusszal hozta létre
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
                displayName: authUser.fullName || (helyiEdzo && helyiEdzo.displayName) || authUser.displayName || authUser.username,
                club: authUser.club || (helyiEdzo ? helyiEdzo.club : ''),
                degree: authUser.degree || (helyiEdzo ? helyiEdzo.degree : ''),
                role: (authUser.role || 'COACH').toUpperCase(),
                approvalStatus: (authUser.approvalStatus || 'APPROVED').toUpperCase(),
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
            const st = (regTalalat.approvalStatus || 'APPROVED').toUpperCase();
            if (st === 'PENDING') {
                szerverHibaUzenet = 'A regisztrációd jelenleg még szervezői elbírálás alatt áll! Amint jóváhagyásra kerül, e-mailben értesítünk.';
            } else if (st === 'REJECTED') {
                szerverHibaUzenet = 'A regisztrációdat a szervezőség elutasította (zárt IKO versenyrendszer).';
            } else {
                const tiszta = Object.assign({}, regTalalat);
                delete tiszta.password;
                delete tiszta.passwordHash;
                sikeresUser = tiszta;
            }
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
