const Auth = {
    getUser: function() {
        return TatamiMaster.lekerBejelentkezes();
    },

    checkAccess: function() {
        TatamiMaster.ellenorizJogosultsag();
        const user = this.getUser();
        const isAdmin = !!(user && user.role && user.role.toUpperCase() === 'ADMIN');
        const biroiAdminLink = document.getElementById('biroiAdminKozpontLink');
        if (biroiAdminLink && !isAdmin) {
            biroiAdminLink.style.display = 'none';
        }
        this.renderQuickNav();
    },

    // Ha ADMIN van belépve, a views/ mappában lévő oldalakon kirajzol egy letisztult,
    // bal oldali lebegő monokróm dokkot (vonalrajzos ikonokkal) a régi felső sáv helyett!
    renderQuickNav: function() {
        const user = this.getUser();
        const path = window.location.pathname.toLowerCase();
        const isViewsFolder = path.includes('/views/');
        if (!isViewsFolder || !user || !user.role || user.role.toUpperCase() !== 'ADMIN') return;
        if (document.getElementById('tatamiQuickNavBar')) return;

        const items = [
            { href: 'admin.html',       icon: 'home',    label: 'Admin Főpanel' },
            { href: 'nevezes.html',     icon: 'scale',   label: 'Mérlegelő' },
            { href: 'eredmenyek.html',  icon: 'trophy',  label: 'Eredmények & Oklevél' },
            { href: 'biroi_panel.html', icon: 'monitor', label: 'Bírói Vezérlő' }
        ];

        const nav = document.createElement('nav');
        nav.id = 'tatamiQuickNavBar';
        nav.setAttribute('aria-label', 'Gyorsmenü');

        let html = `
            <div class="qnav-header" onclick="document.getElementById('tatamiQuickNavBar').classList.toggle('expanded')" style="cursor:pointer;" title="Gyorsmenü kinyitása / bezárása">
                ${TatamiMaster.icon('grid', 18)}
                <span class="qnav-label">Gyorsmenü</span>
            </div>
        `;

        for (let it of items) {
            const isActive = path.endsWith('/' + it.href.toLowerCase());
            const targetAttr = it.blank ? ' target="_blank"' : '';
            html += `
                <a href="${it.href}"${targetAttr} class="qnav-link${isActive ? ' active' : ''}" title="${it.label}">
                    ${TatamiMaster.icon(it.icon, 18)}
                    <span class="qnav-label">${it.label}</span>
                </a>
            `;
        }

        nav.innerHTML = html;
        document.body.appendChild(nav);
    }
};

window.addEventListener('DOMContentLoaded', () => Auth.checkAccess());
