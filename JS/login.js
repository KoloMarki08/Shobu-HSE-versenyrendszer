async function bejelentkezes(event) {
    event.preventDefault();
    const uName = document.getElementById('loginUsername').value.trim();
    const uPass = document.getElementById('loginPassword').value.trim();
    const errDiv = document.getElementById('loginError');
    if (errDiv) errDiv.style.display = 'none';

    let sikeresUser = null;

    // 1. Ellenőrzés a C# /api/Users táblában
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
                    role: (talalat.role || 'COACH').toUpperCase()
                };
            }
        }
    } catch (e) {
        console.warn("Users API nem elérhető, beépített fiókok használata.");
    }

    // 2. Beépített fiókok (Admin, Bíró, Edző)
    if (!sikeresUser) {
        if (uName.toLowerCase() === 'admin' && uPass === 'admin123') {
            sikeresUser = { id: 1, username: 'Adminisztrátor', role: 'ADMIN' };
        } else if ((uName.toLowerCase() === 'biro' || uName.toLowerCase() === 'bíró') && uPass === 'biro123') {
            sikeresUser = { id: 2, username: 'Asztalbíró', role: 'JUDGE' };
        } else if ((uName.toLowerCase() === 'edzo' || uName.toLowerCase() === 'edző' || uName.toLowerCase() === 'coach') && uPass === 'edzo123') {
            sikeresUser = { id: 3, username: 'Klubedző (Shobu HSE)', role: 'COACH' };
        }
    }

    if (sikeresUser) {
        TatamiMaster.mentBejelentkezes(sikeresUser);
        const role = sikeresUser.role.toUpperCase();

        if (role === 'ADMIN') window.location.href = 'views/admin.html';
        else if (role === 'JUDGE' || role === 'BIRO') window.location.href = 'views/biroi_panel.html';
        else window.location.href = 'views/audience.html';
    } else if (errDiv) {
        errDiv.innerText = "❌ Hibás felhasználónév vagy jelszó!";
        errDiv.style.display = 'block';
    }
}