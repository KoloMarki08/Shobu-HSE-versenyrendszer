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

function nyisdHashTabHaVan() {
    const hash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
    if (hash && hash.startsWith('tab-') && document.getElementById(hash)) {
        openTab(null, hash, true);
    }
}

window.addEventListener('DOMContentLoaded', nyisdHashTabHaVan);
window.addEventListener('hashchange', nyisdHashTabHaVan);
