const Auth = {
    getUser: function() {
        return TatamiMaster.lekerBejelentkezes();
    },

    checkAccess: function() {
        TatamiMaster.ellenorizJogosultsag();
        this.renderQuickNav();
    },

    // Ha ADMIN van belépve, a views/ mappában lévő oldalakon kirajzol egy gyors ugrómenüt az összes HTML fájlhoz!
    renderQuickNav: function() {
        const user = this.getUser();
        const isViewsFolder = window.location.pathname.toLowerCase().includes('/views/');
        if (!isViewsFolder || !user || user.role.toUpperCase() !== 'ADMIN') return;
        if (document.getElementById('tatamiQuickNavBar')) return;

        const nav = document.createElement('div');
        nav.id = 'tatamiQuickNavBar';
        nav.style.cssText = 'background:#222;padding:8px 25px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;border-bottom:2px solid #dc3545;font-size:0.85rem;';
        nav.innerHTML = `
            <strong style="color:#ffc107;margin-right:8px;">⚡ Gyorsmenü:</strong>
            <a href="admin.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">🏠 Admin Főpanel</a>
            <a href="kategoriak.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">🥋 Kyu- & Súlybontó</a>
            <a href="nevezes.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">⚖️ Mérlegelő</a>
            <a href="kiemeles.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">🎲 Sorsolás & Kiemelés</a>
            <a href="kata.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">🧘 Kata Hub</a>
            <a href="kumite.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">🥊 Kumite Ágrajzok</a>
            <a href="tatami.html" style="color:white;text-decoration:none;padding:4px 8px;background:#444;border-radius:4px;">📢 Pástszéli Szólító</a>
            <a href="eredmenyek.html" style="color:#111;font-weight:bold;text-decoration:none;padding:4px 8px;background:#ffc107;border-radius:4px;">🏆 Eredmények & Oklevél</a>
            <a href="biroi_panel.html" style="color:white;text-decoration:none;padding:4px 8px;background:#dc3545;border-radius:4px;">🖥️ Bírói Vezérlő</a>
            <a href="referee.html" target="_blank" style="color:white;text-decoration:none;padding:4px 8px;background:#28a745;border-radius:4px;">📱 Oldalbírói Pad</a>
        `;
        document.body.insertBefore(nav, document.body.firstChild);
    }
};

window.addEventListener('DOMContentLoaded', () => Auth.checkAccess());