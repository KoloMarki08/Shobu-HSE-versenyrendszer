function frissitAccordionFejlecAllapot(sectionEl, isOpen) {
    if (!sectionEl) return;
    const panelWrapper = sectionEl.closest('.admin-accordion-panel');
    if (panelWrapper) {
        panelWrapper.classList.toggle('open', isOpen);
    }
    const headerBtn = panelWrapper ? panelWrapper.querySelector('.admin-accordion-header') : null;
    if (headerBtn) {
        headerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        const statusText = headerBtn.querySelector('.acc-toggle-text');
        if (statusText) {
            statusText.textContent = isOpen ? 'Bezárás' : 'Lenyitás';
        }
    }
}

function szinkronizalAktivTabJelolok(tabId) {
    const tabBtns = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove('active');
        const onClickAttr = tabBtns[i].getAttribute('onclick') || '';
        const dataTab = tabBtns[i].getAttribute('data-tab') || '';
        if (dataTab === tabId || onClickAttr.includes(`'${tabId}'`) || onClickAttr.includes(`"${tabId}"`)) {
            tabBtns[i].classList.add('active');
        }
    }

    const stepCards = document.getElementsByClassName('admin-step-card');
    for (let i = 0; i < stepCards.length; i++) {
        stepCards[i].classList.remove('active');
        const stepTab = stepCards[i].getAttribute('data-tab') || '';
        if (stepTab === tabId) {
            stepCards[i].classList.add('active');
        }
    }
}

function openTab(evt, tabId, scrollToTabs = false) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
        tabContents[i].classList.remove('active');
        frissitAccordionFejlecAllapot(tabContents[i], false);
    }

    szinkronizalAktivTabJelolok(tabId);

    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        frissitAccordionFejlecAllapot(target, true);
    }

    if (evt && evt.currentTarget && evt.currentTarget.classList && evt.currentTarget.classList.contains('tab-btn')) {
        evt.currentTarget.classList.add('active');
    }

    if (scrollToTabs && target) {
        const panelWrapper = target.closest('.admin-accordion-panel') || target;
        setTimeout(() => {
            panelWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
    }
}

function toggleAccordionTab(tabId, evt) {
    if (evt) {
        evt.preventDefault();
    }
    const target = document.getElementById(tabId);
    if (!target) return;

    const isCurrentlyOpen = target.classList.contains('active') || target.style.display === 'block';
    if (isCurrentlyOpen) {
        target.style.display = 'none';
        target.classList.remove('active');
        frissitAccordionFejlecAllapot(target, false);
    } else {
        target.style.display = 'block';
        target.classList.add('active');
        frissitAccordionFejlecAllapot(target, true);
        szinkronizalAktivTabJelolok(tabId);
    }
}

function expandAllAdminTabs() {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'block';
        tabContents[i].classList.add('active');
        frissitAccordionFejlecAllapot(tabContents[i], true);
    }
    document.querySelectorAll('.admin-section-box.collapsed').forEach(box => {
        box.classList.remove('collapsed');
        const btnText = box.querySelector('.subbox-toggle-text');
        if (btnText) btnText.textContent = 'Összecsukás';
    });
}

function collapseAllAdminTabs() {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
        tabContents[i].classList.remove('active');
        frissitAccordionFejlecAllapot(tabContents[i], false);
    }
}

function ugorjAdminTabra(tabId, scrollToTabs = true) {
    openTab(null, tabId, scrollToTabs);
}

function toggleAdminSubBox(headerEl, evt) {
    if (evt && evt.target) {
        const interactive = evt.target.closest('input, select, textarea, a, button:not(.subbox-toggle-btn), label');
        if (interactive) return;
    }
    const box = headerEl ? headerEl.closest('.admin-section-box') : null;
    if (!box) return;

    const isCollapsed = box.classList.toggle('collapsed');
    const btnText = box.querySelector('.subbox-toggle-text');
    if (btnText) {
        btnText.textContent = isCollapsed ? 'Lenyitás' : 'Összecsukás';
    }
}

function initAdminCollapsibleSubBoxes() {
    const boxes = document.querySelectorAll('.admin-section-box');
    boxes.forEach(box => {
        const header = box.querySelector(':scope > .admin-section-header');
        if (!header || header.dataset.collapsibleInit === '1') return;
        header.dataset.collapsibleInit = '1';
        header.classList.add('collapsible-sub-header');
        header.setAttribute('title', 'Kattints ide a részterület lenyitásához vagy összecsukásához!');

        // Csomagoljuk a fejléc utáni összes elemet egy .admin-section-body konténerbe
        const bodyWrapper = document.createElement('div');
        bodyWrapper.className = 'admin-section-body';
        const children = Array.from(box.children);
        children.forEach(child => {
            if (child !== header) {
                bodyWrapper.appendChild(child);
            }
        });
        box.appendChild(bodyWrapper);

        // Lenyitás / Összecsukás gomb hozzáadása a fejléc jobb széléhez
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'subbox-toggle-btn';
        toggleBtn.innerHTML = `<span class="subbox-toggle-text">Összecsukás</span>
            <svg class="subbox-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
        header.appendChild(toggleBtn);

        header.addEventListener('click', function(e) {
            toggleAdminSubBox(header, e);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAdminCollapsibleSubBoxes();
});
