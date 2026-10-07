/* ==========================================================================
   OLD SKULL TATTOO ART GALLERY - Główny Skrypt Strony Pokazowej
   Studio z tradycjami od 2009 roku | Tarnów, ul. Goldhammera 5
   ========================================================================== */

const CONFIG = {
    BRAND_NAME: "Old Skull Tattoo Art Gallery",
    STUDIO_PHONE: "697 130 545",
    STUDIO_EMAIL: "info@oldskulltattoo.pl",
    STUDIO_LOCATION: "Goldhammera 5, 33-100 Tarnów, Poland",
    INSTAGRAM_URL: "https://www.instagram.com/oldskulltattoo_artgallery",
    FOUNDED_YEAR: "2009",
    HOURS_WEEKDAYS: "Pn – Pt: 11:00 – 17:00",
    HOURS_WEEKENDS: "Sobota – Niedziela: ZAMKNIĘTE",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    SUPABASE_TABLE_NAME: "oldskull_bookings",
    EMAILJS_PUBLIC_KEY: "",
    EMAILJS_SERVICE_ID: "",
    EMAILJS_STUDIO_TEMPLATE_ID: "",
    EMAILJS_CLIENT_TEMPLATE_ID: "",
    DEMO_ADMIN_EMAIL: "admin@oldskulltattoo.pl",
    DEMO_ADMIN_PASS: "admin123"
};

let supabaseClient = null;
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && typeof supabase !== 'undefined') {
    try { supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY); } catch (e) { console.warn('Błąd Supabase:', e); }
}
if (CONFIG.EMAILJS_PUBLIC_KEY && typeof emailjs !== 'undefined') {
    try { emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY); } catch (e) { console.warn('Błąd EmailJS:', e); }
}

/* === STAN APLIKACJI I KALENDARZA === */
const todayDate = new Date();
const currentRealYear = todayDate.getFullYear();
const currentRealMonth = todayDate.getMonth(); // 0-11
const currentRealDay = todayDate.getDate();

let calendarYear = currentRealYear;
let calendarMonth = currentRealMonth;

let bookingState = {
    step: 1,
    selectedServiceKey: 'realizm',
    selectedServiceName: 'Realizm & Portret',
    selectedDate: null,
    selectedTime: null
};

let uploadedInspirationFiles = [];

const servicesData = {
    'realizm': { name: 'Realizm & Portret' },
    'blackwork': { name: 'Blackwork & Dark Art' },
    'neotraditional': { name: 'Neotraditional / Old School' },
    'trashpolka': { name: 'Graphic / Trash Polka' },
    'coverup': { name: 'Cover-up / Odświeżenie' },
    'konsultacja': { name: 'Konsultacja & Projekt' }
};

// Godziny pracy studia (Pn-Pt 11:00 - 17:00)
const availableTimeSlots = ['11:00', '13:00', '15:00', '16:00'];

const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

/* === OGRANICZENIA KALENDARZA ===
   - Przewijanie: max 1 miesiąc w tył od bieżącego
   - Przewijanie: max 7 miesięcy w przód od bieżącego
   - Rezerwacja aktywna: od dzisiaj do max 6 miesięcy w przód
*/
function getMinCalendarMonth() {
    let m = currentRealMonth - 1;
    let y = currentRealYear;
    if (m < 0) { m = 11; y--; }
    return { month: m, year: y };
}

function getMaxCalendarMonth() {
    let m = currentRealMonth + 7;
    let y = currentRealYear;
    while (m > 11) { m -= 12; y++; }
    return { month: m, year: y };
}

function getMaxBookingLimitDate() {
    const d = new Date(todayDate);
    d.setMonth(d.getMonth() + 6);
    return d;
}

function canScrollPrev() {
    const min = getMinCalendarMonth();
    return (calendarYear > min.year) || (calendarYear === min.year && calendarMonth > min.month);
}

function canScrollNext() {
    const max = getMaxCalendarMonth();
    return (calendarYear < max.year) || (calendarYear === max.year && calendarMonth < max.month);
}

/* === KODY KRAJÓW / PREFIX TELEFONICZNY === */
const countryList = [
    { code: '+48', iso: 'pl', name: 'Polska' },
    { code: '+31', iso: 'nl', name: 'Nederland' },
    { code: '+44', iso: 'gb', name: 'United Kingdom' },
    { code: '+49', iso: 'de', name: 'Deutschland' },
    { code: '+32', iso: 'be', name: 'België' },
    { code: '+33', iso: 'fr', name: 'France' },
    { code: '+380', iso: 'ua', name: 'Україна' },
    { code: '+420', iso: 'cz', name: 'Česko' },
    { code: '+43', iso: 'at', name: 'Österreich' },
    { code: '+41', iso: 'ch', name: 'Schweiz' },
    { code: '+39', iso: 'it', name: 'Italia' },
    { code: '+34', iso: 'es', name: 'España' },
    { code: '+47', iso: 'no', name: 'Norge' },
    { code: '+46', iso: 'se', name: 'Sverige' },
    { code: '+45', iso: 'dk', name: 'Danmark' },
    { code: '+353', iso: 'ie', name: 'Ireland' },
    { code: '+1', iso: 'us', name: 'USA / Canada' }
];

let selectedCountry = countryList[0];

function renderCountryOptions(filterText = '') {
    const listContainer = document.getElementById('country-options-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const q = (filterText || '').toLowerCase().trim();
    const filtered = countryList.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.includes(q));
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="text-xs text-gray-500 py-3 text-center">Brak wyników</div>';
        return;
    }
    filtered.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left px-3 py-2 text-xs hover:bg-dark-hover flex items-center justify-between transition rounded-lg text-gray-200 cursor-pointer';
        btn.onclick = () => selectCountryCode(c.code, c.iso);
        btn.innerHTML = `<div class="flex items-center gap-2"><span class="fi fi-${c.iso} text-sm"></span><span>${c.name}</span></div><span class="font-mono font-bold text-red-400">${c.code}</span>`;
        listContainer.appendChild(btn);
    });
}

function toggleCountryDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('country-dropdown-menu');
    if (!menu) return;
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        renderCountryOptions('');
        setTimeout(() => { const si = document.getElementById('country-search-input'); if (si) si.focus(); }, 50);
    } else {
        menu.classList.add('hidden');
    }
}

function selectCountryCode(code, iso) {
    selectedCountry = countryList.find(c => c.code === code && c.iso === iso) || { code, iso, name: '' };
    const flagEl = document.getElementById('selected-flag');
    const prefixEl = document.getElementById('selected-prefix');
    if (flagEl) flagEl.className = `fi fi-${iso} text-sm rounded-sm`;
    if (prefixEl) prefixEl.innerText = code;
    const menu = document.getElementById('country-dropdown-menu');
    if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('country-dropdown-menu');
    const btn = document.getElementById('country-prefix-btn');
    if (dropdown && !dropdown.classList.contains('hidden') && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

/* === UNIWERSALNY MODAL === */
function showCustomModal({ title, message, type = 'info', confirmText = 'OK', cancelText = null, onConfirm = null, onCancel = null }) {
    const backdrop = document.getElementById('custom-modal-backdrop');
    const card = document.getElementById('custom-modal-card');
    const iconContainer = document.getElementById('custom-modal-icon-container');
    const titleEl = document.getElementById('custom-modal-title');
    const bodyEl = document.getElementById('custom-modal-body');
    const confirmBtn = document.getElementById('custom-modal-confirm-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!backdrop || !card) return;

    if (titleEl) titleEl.innerHTML = title;
    if (bodyEl) bodyEl.innerHTML = message;
    if (confirmBtn) confirmBtn.innerHTML = confirmText;

    if (iconContainer) {
        if (type === 'success') {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            iconContainer.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (type === 'error') {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-lg bg-red-500/20 text-red-400 border border-red-500/30';
            iconContainer.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        } else {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-lg bg-red-600/20 text-red-500 border border-red-500/30';
            iconContainer.innerHTML = '<i class="fa-solid fa-skull"></i>';
        }
    }

    if (cancelBtn) {
        if (cancelText) {
            cancelBtn.innerText = cancelText;
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
    }

    const closeModal = () => {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
            backdrop.classList.remove('flex');
            backdrop.classList.add('hidden');
        }, 300);
    };

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };
    }
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
    }

    const closeBtn = document.getElementById('custom-modal-close-btn');
    if (closeBtn) closeBtn.onclick = closeModal;

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function showCustomAlert(title, message, type = 'info') {
    showCustomModal({ title, message, type });
}

function copyContactEmail(btn) {
    const email = 'kacperekwas1@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> <span class="text-emerald-400">Skopiowano!</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
    }).catch(() => {
        window.prompt('Skopiuj adres e-mail:', email);
    });
}

function openContactOwnerModal() {
    const content = `
        <div class="space-y-4">
            <p class="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
                Chcesz wdrożyć nowoczesną stronę internetową z systemem rezerwacji dla swojego salonu lub firmy? Skontaktuj się ze mną bezpośrednio:
            </p>
            <div class="p-4 rounded-xl bg-dark-base border border-red-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-400 text-lg flex-shrink-0">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                        <div class="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Adres E-mail</div>
                        <a href="mailto:kacperekwas1@gmail.com" class="text-base sm:text-lg text-white font-mono font-bold hover:text-red-400 transition select-all">kacperekwas1@gmail.com</a>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <button type="button" onclick="copyContactEmail(this)" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-dark-surface hover:bg-dark-card border border-dark-border hover:border-red-600/50 text-gray-200 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5">
                        <i class="fa-regular fa-copy"></i> <span>Kopiuj</span>
                    </button>
                    <a href="mailto:kacperekwas1@gmail.com" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg gold-gradient-bg text-white text-xs font-bold uppercase tracking-wider transition hover:opacity-90 flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-paper-plane"></i> <span>Napisz</span>
                    </a>
                </div>
            </div>
            <p class="text-xs text-gray-400 font-normal">
                Odpowiadam na wiadomości najczęściej w ciągu kilkunastu godzin. Chętnie omówię szczegóły i przygotuję indywidualną wycenę.
            </p>
        </div>
    `;

    showCustomModal({
        title: 'Skontaktuj Się w Sprawie Strony',
        message: content,
        type: 'info',
        confirmText: 'Zamknij'
    });
}


/* === LOGIKA REZERWACJI (4 KROKI Z PŁYNNĄ ANIMACJĄ) === */
function selectService(serviceKey) {
    const data = servicesData[serviceKey];
    if (!data) return;
    bookingState.selectedServiceKey = serviceKey;
    bookingState.selectedServiceName = data.name;

    document.querySelectorAll('[id^="service-option-"]').forEach(el => {
        el.classList.remove('border-red-600', 'bg-red-950/20', 'shadow-lg');
        el.classList.add('border-dark-border', 'bg-dark-base');
    });

    const activeOpt = document.getElementById(`service-option-${serviceKey}`);
    if (activeOpt) {
        activeOpt.classList.remove('border-dark-border', 'bg-dark-base');
        activeOpt.classList.add('border-red-600', 'bg-red-950/20', 'shadow-lg');
    }

    goToBookingStep(2);
}

function goToBookingStep(step) {
    if (step === 2 && !bookingState.selectedServiceKey) {
        showCustomAlert('Wybierz Styl', 'Prosimy najpierw wybrać styl tatuażu lub konsultację.', 'error');
        return;
    }
    if (step === 3 && (!bookingState.selectedDate || !bookingState.selectedTime)) {
        showCustomAlert('Wybierz Datę i Godzinę', 'Prosimy wskazać wolny dzień w kalendarzu oraz godzinę sesji.', 'error');
        return;
    }
    if (step === 4) {
        const name = document.getElementById('input-client-name')?.value.trim();
        const phone = document.getElementById('input-client-phone')?.value.trim();
        const email = document.getElementById('input-client-email')?.value.trim();
        const placement = document.getElementById('input-placement')?.value.trim();

        let hasError = false;
        if (!name) {
            showCustomAlert('Podaj Imię i Nazwisko', 'Prosimy uzupełnić swoje imię i nazwisko.', 'error');
            return;
        }

        const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
        const phoneErr = document.getElementById('phone-error-msg');
        if (!phoneDigits || phoneDigits.length < 7) {
            if (phoneErr) phoneErr.classList.remove('hidden');
            hasError = true;
        } else {
            if (phoneErr) phoneErr.classList.add('hidden');
        }

        const emailErr = document.getElementById('email-error-msg');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            if (emailErr) emailErr.classList.remove('hidden');
            hasError = true;
        } else {
            if (emailErr) emailErr.classList.add('hidden');
        }

        if (!placement) {
            showCustomAlert('Miejsce na Ciele', 'Prosimy wskazać planowane miejsce tatuażu (np. przedramię, plecy).', 'error');
            return;
        }

        if (hasError) return;

        // Wypełnij podsumowanie
        const sumService = document.getElementById('summary-service-text');
        const sumDateTime = document.getElementById('summary-datetime-text');
        const sumClient = document.getElementById('summary-client-name');
        const sumPlacement = document.getElementById('summary-placement-text');
        const sumContact = document.getElementById('summary-contact-text');
        const sumImages = document.getElementById('summary-images-text');

        if (sumService) sumService.innerText = bookingState.selectedServiceName;
        if (sumDateTime) sumDateTime.innerText = `${bookingState.selectedDate} o godz. ${bookingState.selectedTime}`;
        if (sumClient) sumClient.innerText = name;
        if (sumPlacement) sumPlacement.innerText = placement;
        if (sumContact) sumContact.innerText = `${selectedCountry.code} ${phone} | ${email}`;
        if (sumImages) sumImages.innerText = `${uploadedInspirationFiles.length} szt.`;
    }

    bookingState.step = step;

    // Przełączanie zakładek z animacją płynnego wejścia
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`booking-step-${i}`);
        const tabEl = document.getElementById(`step-tab-${i}`);
        if (stepEl) {
            if (i === step) {
                stepEl.classList.remove('hidden');
                stepEl.classList.remove('step-slide-in');
                void stepEl.offsetWidth; // Reflow dla ponownego uruchomienia animacji
                stepEl.classList.add('step-slide-in');
            } else {
                stepEl.classList.add('hidden');
                stepEl.classList.remove('step-slide-in');
            }
        }
        if (tabEl) {
            if (i === step) {
                tabEl.className = 'text-red-500 border-b-2 border-red-600 pb-2 font-bold cursor-pointer transition-colors';
            } else if (i < step) {
                tabEl.className = 'text-emerald-400 border-b-2 border-emerald-500 pb-2 font-medium cursor-pointer transition-colors';
            } else {
                tabEl.className = 'text-gray-500 pb-2 cursor-pointer font-normal transition-colors';
            }
        }
    }

    if (step === 2) {
        renderCalendar();
        renderTimeSlots();
    }
}

/* === OBSŁUGA DOSTĘPNOŚCI TERMINÓW & KALENDARZ === */
function getBookedSlotsForDate(dateStr) {
    ensureInitialDemoData();
    const active = JSON.parse(localStorage.getItem('oldskull_bookings') || '[]');
    const history = JSON.parse(localStorage.getItem('oldskull_bookings_history') || '[]');
    const booked = [];

    active.forEach(b => {
        if (b.booking_date === dateStr && b.status !== 'Usunięta' && b.booking_time) {
            booked.push(b.booking_time);
        }
    });

    history.forEach(b => {
        if (b.booking_date === dateStr && b.status === 'Zatwierdzona' && b.booking_time) {
            booked.push(b.booking_time);
        }
    });

    return booked;
}

function getDayAvailability(dateStr) {
    const booked = getBookedSlotsForDate(dateStr);
    if (booked.length >= availableTimeSlots.length) return 'full';      // Wszystkie zajęte -> Czerwony
    if (booked.length > 0) return 'partial';                           // Częściowo zajęty -> Żółty
    return 'free';                                                     // Cały dzień wolny -> Zielony
}

function changeMonth(delta) {
    if (delta < 0 && !canScrollPrev()) return;
    if (delta > 0 && !canScrollNext()) return;

    calendarMonth += delta;
    if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
    } else if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
    }
    renderCalendar();
}

function renderCalendar() {
    const monthYearEl = document.getElementById('current-month-year');
    const gridEl = document.getElementById('calendar-days-grid');
    if (!monthYearEl || !gridEl) return;

    monthYearEl.innerText = `${monthNames[calendarMonth]} ${calendarYear}`;
    gridEl.innerHTML = '';

    // Aktualizacja strzałek nawigacyjnych
    const prevBtn = document.getElementById('cal-prev-btn');
    const nextBtn = document.getElementById('cal-next-btn');

    if (prevBtn) {
        if (!canScrollPrev()) {
            prevBtn.disabled = true;
            prevBtn.classList.add('opacity-25', 'cursor-not-allowed');
        } else {
            prevBtn.disabled = false;
            prevBtn.classList.remove('opacity-25', 'cursor-not-allowed');
        }
    }

    if (nextBtn) {
        if (!canScrollNext()) {
            nextBtn.disabled = true;
            nextBtn.classList.add('opacity-25', 'cursor-not-allowed');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-25', 'cursor-not-allowed');
        }
    }

    // Dzień tygodnia 1. dnia miesiąca (0=Pn, 6=Nd)
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const todayStr = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;
    const maxBookingDate = getMaxBookingLimitDate();
    const maxBookingStr = `${maxBookingDate.getFullYear()}-${String(maxBookingDate.getMonth() + 1).padStart(2, '0')}-${String(maxBookingDate.getDate()).padStart(2, '0')}`;

    // Puste komórki na początku
    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'h-8 sm:h-10';
        gridEl.appendChild(empty);
    }

    // Dni miesiąca z kolorystycznym oznaczaniem dostępności
    for (let d = 1; d <= totalDays; d++) {
        const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDate = new Date(calendarYear, calendarMonth, d);
        const dayOfWeek = dayDate.getDay(); // 0=Nd, 6=Sb

        const isPast = (dayStr < todayStr);
        const isBeyond6Months = (dayStr > maxBookingStr);
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isBlocked = isPast || isBeyond6Months || isWeekend;

        const isSelected = (bookingState.selectedDate === dayStr);
        const isToday = (dayStr === todayStr);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = d;

        if (isBlocked) {
            btn.className = 'h-8 sm:h-10 rounded-lg text-gray-600 text-xs font-medium flex items-center justify-center cursor-not-allowed opacity-25 select-none';
            btn.disabled = true;
        } else {
            const avail = getDayAvailability(dayStr);
            let cls = 'calendar-day-btn h-8 sm:h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer border ';

            if (isSelected) {
                cls += 'selected-day bg-red-600 text-white border-red-500 shadow-md shadow-red-900/60 font-bold ring-2 ring-red-400/50';
            } else if (avail === 'full') {
                // Wszystkie terminy zajęte -> czerwone podświetlenie
                cls += 'cal-day-full';
            } else if (avail === 'partial') {
                // Częściowo zajęty -> żółte podświetlenie
                cls += 'cal-day-partial';
            } else {
                // Cały wolny -> zielone, subtelne podświetlenie
                cls += 'cal-day-free';
            }

            if (isToday && !isSelected) {
                cls += ' ring-1 ring-white/50';
            }

            btn.className = cls;
            btn.onclick = () => selectDay(dayStr);
        }

        gridEl.appendChild(btn);
    }
}

function selectDay(dateStr) {
    bookingState.selectedDate = dateStr;
    bookingState.selectedTime = null;
    renderCalendar();
    renderTimeSlots();
}

function renderTimeSlots() {
    const slotsContainer = document.getElementById('time-slots-container');
    if (!slotsContainer) return;
    slotsContainer.innerHTML = '';

    if (!bookingState.selectedDate) {
        slotsContainer.innerHTML = '<div class="col-span-full text-center py-2.5 text-xs text-gray-500">Wybierz dostępny dzień w kalendarzu powyżej.</div>';
        return;
    }

    const bookedSlots = getBookedSlotsForDate(bookingState.selectedDate);
    const isAllBooked = (bookedSlots.length >= availableTimeSlots.length);

    if (isAllBooked) {
        slotsContainer.innerHTML = `
            <div class="col-span-full text-center py-3 px-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-medium">
                <i class="fa-solid fa-ban text-red-400 mr-1.5"></i>
                Wszystkie godziny w wybranym dniu (<strong>${bookingState.selectedDate}</strong>) są już zajęte.<br>
                <span class="text-[11px] text-gray-400 mt-1 block">Prosimy wybrać inny termin oznaczony na zielono lub żółto.</span>
            </div>
        `;
        return;
    }

    availableTimeSlots.forEach(time => {
        const isBooked = bookedSlots.includes(time);
        const isSelected = (bookingState.selectedTime === time);
        const btn = document.createElement('button');
        btn.type = 'button';

        if (isBooked) {
            btn.disabled = true;
            btn.className = 'py-2.5 px-3 rounded-lg border border-red-950/80 bg-red-950/30 text-red-400/50 text-xs font-semibold cursor-not-allowed opacity-50 flex items-center justify-between line-through select-none';
            btn.innerHTML = `<span>${time}</span><span class="text-[9px] uppercase font-bold no-underline text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/60">Zajęty</span>`;
        } else {
            let cls = 'time-slot-btn py-2.5 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center justify-between ';
            if (isSelected) {
                cls += 'selected-slot bg-red-600 border-red-500 text-white shadow-md shadow-red-900/50 font-bold';
            } else {
                cls += 'border-emerald-800/40 text-emerald-200 hover:border-emerald-500 hover:text-white bg-dark-base';
            }
            btn.className = cls;
            btn.innerHTML = `<span>${time}</span><span class="text-[9px] ${isSelected ? 'text-white font-bold' : 'text-emerald-400'} font-normal">Wolny</span>`;
            btn.onclick = () => {
                bookingState.selectedTime = time;
                renderTimeSlots();
            };
        }
        slotsContainer.appendChild(btn);
    });
}

/* === ZDJĘCIA INSPIRACJI === */
function handleInspirationUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedInspirationFiles.push({ name: file.name, dataUrl: e.target.result });
            renderUploadedPreviews();
        };
        reader.readAsDataURL(file);
    }
}

function removeUploadedFile(index) {
    uploadedInspirationFiles.splice(index, 1);
    renderUploadedPreviews();
}

function renderUploadedPreviews() {
    const container = document.getElementById('upload-preview-container');
    if (!container) return;
    container.innerHTML = '';

    uploadedInspirationFiles.forEach((file, index) => {
        const box = document.createElement('div');
        box.className = 'relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-red-600/40 group shadow-md';
        box.innerHTML = `
            <img src="${file.dataUrl}" alt="Inspiracja" class="w-full h-full object-cover">
            <button type="button" onclick="removeUploadedFile(${index})" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white hover:bg-red-600 flex items-center justify-center text-[10px] transition">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(box);
    });

    if (uploadedInspirationFiles.length < 5) {
        const addBtn = document.createElement('label');
        addBtn.className = 'w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-dark-border hover:border-red-600 flex flex-col items-center justify-center cursor-pointer transition text-gray-400 hover:text-red-500 bg-dark-base';
        addBtn.innerHTML = `
            <i class="fa-solid fa-plus text-base mb-0.5"></i>
            <span class="text-[9px] font-semibold">Dodaj</span>
            <input type="file" accept="image/*" multiple class="hidden" onchange="handleInspirationUpload(event)">
        `;
        container.appendChild(addBtn);
    }
}

/* === WYSYŁANIE REZERWACJI === */
async function submitFinalBooking() {
    const rodoCheckbox = document.getElementById('checkbox-rodo');
    if (!rodoCheckbox || !rodoCheckbox.checked) {
        showCustomAlert('Zgoda RODO', 'Prosimy o zaznaczenie zgody na przetwarzanie danych osobowych.', 'error');
        return;
    }

    const name = document.getElementById('input-client-name')?.value.trim();
    const phone = `${selectedCountry.code} ${document.getElementById('input-client-phone')?.value.trim()}`;
    const email = document.getElementById('input-client-email')?.value.trim();
    const placement = document.getElementById('input-placement')?.value.trim();
    const size = document.getElementById('input-size')?.value.trim() || 'Nie określono';
    const description = document.getElementById('input-description')?.value.trim() || 'Brak opisu';

    const submitBtn = document.getElementById('btn-submit-booking');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rezerwowanie...';
    }

    const bookingData = {
        id: 'oldskull_' + Date.now(),
        created_at: new Date().toISOString(),
        client_name: name,
        client_phone: phone,
        client_email: email,
        service_name: bookingState.selectedServiceName,
        booking_date: bookingState.selectedDate,
        booking_time: bookingState.selectedTime,
        placement: placement,
        size: size,
        description: description,
        inspiration_images_count: uploadedInspirationFiles.length,
        status: 'Oczekująca'
    };

    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.from(CONFIG.SUPABASE_TABLE_NAME).insert([bookingData]);
            if (error) console.warn('Supabase fallback:', error);
        }
        
        // Zapis do localStorage
        const cur = JSON.parse(localStorage.getItem('oldskull_bookings') || '[]');
        cur.unshift(bookingData);
        localStorage.setItem('oldskull_bookings', JSON.stringify(cur));

        showCustomModal({
            title: 'Zgłoszenie Przyjęte!',
            message: `Dziękujemy, <strong>${name}</strong>!<br><br>Twoje zgłoszenie na dzień <strong>${bookingState.selectedDate}</strong> o godz. <strong>${bookingState.selectedTime}</strong> zostało pomyślnie zarejestrowane.<br><br>Wkrótce skontaktujemy się z Tobą na numer <strong>${phone}</strong> w celu omówienia projektu.`,
            type: 'success',
            onConfirm: () => {
                window.location.reload();
            }
        });
    } catch (err) {
        console.error('Błąd rezerwacji:', err);
        showCustomAlert('Błąd', 'Wystąpił problem z wysłaniem. Skontaktuj się ze studiem bezpośrednio pod numerem: 697 130 545.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Potwierdzam & Wysyłam Zgłoszenie';
        }
    }
}

/* === PORTFOLIO LIGHTBOX (AUTENTYCZNE PRACE STUDIA) === */
const portfolioGalleryData = [
    { src: 'portfolio-1.png', title: 'Kolorowy Realizm - Kwiaty & Motyl', style: 'Kolorowy Realizm' },
    { src: 'portfolio-2.jpg', title: 'Księżyc z Twarzą - Fineline & Dotwork', style: 'Fineline' },
    { src: 'portfolio-3.jpg', title: 'Lilie na Ramieniu - Blackwork Botaniczny', style: 'Blackwork' },
    { src: 'portfolio-4.jpg', title: 'Portret Wilka - Mroczny Realizm', style: 'Realizm Portretowy' }
];

let currentLightboxIndex = 0;

function updateLightboxView() {
    const item = portfolioGalleryData[currentLightboxIndex];
    if (!item) return;
    const imgEl = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const subtitleEl = document.getElementById('lightbox-subtitle');
    const counterEl = document.getElementById('lightbox-counter');

    if (imgEl) {
        imgEl.src = item.src;
        imgEl.alt = item.title;
    }
    if (titleEl) titleEl.innerText = item.title;
    if (subtitleEl) subtitleEl.innerText = `${item.style} • OLD SKULL TATTOO`;
    if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${portfolioGalleryData.length}`;
}

function openLightbox(index = 0) {
    currentLightboxIndex = index;
    updateLightboxView();
    const lightbox = document.getElementById('portfolio-lightbox');
    if (lightbox) {
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('portfolio-lightbox');
    if (lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function prevLightboxImage(e) {
    if (e) e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex - 1 + portfolioGalleryData.length) % portfolioGalleryData.length;
    updateLightboxView();
}

function nextLightboxImage(e) {
    if (e) e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex + 1) % portfolioGalleryData.length;
    updateLightboxView();
}

function handleLightboxBackdropClick(e) {
    if (e.target.id === 'portfolio-lightbox' || e.target.id === 'lightbox-image-container') {
        closeLightbox();
    }
}

document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('portfolio-lightbox');
    if (lb && !lb.classList.contains('hidden')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevLightboxImage();
        if (e.key === 'ArrowRight') nextLightboxImage();
    }
});

/* === FAQ ACCORDION HANDLER === */
function initFaqAccordion() {
    const allDetails = document.querySelectorAll('section#faq details');
    allDetails.forEach((targetDetail) => {
        targetDetail.addEventListener('toggle', () => {
            if (targetDetail.open) {
                allDetails.forEach((otherDetail) => {
                    if (otherDetail !== targetDetail && otherDetail.open) {
                        otherDetail.open = false;
                    }
                });
            }
        });
    });
}

/* === SCROLL REVEAL & COOKIES === */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-revealed');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
}

function initCookieBanner() {
    const accepted = localStorage.getItem('oldskull_cookies_accepted');
    const banner = document.getElementById('cookie-banner');
    if (banner && !accepted) {
        setTimeout(() => { banner.classList.remove('translate-y-full', 'opacity-0'); }, 1000);
    }
}

function acceptCookies() {
    localStorage.setItem('oldskull_cookies_accepted', 'true');
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('translate-y-full', 'opacity-0');
}

function openPrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) m.classList.remove('hidden');
}
function closePrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) m.classList.add('hidden');
}

/* === AMBIENT CANVAS W TLE === */
function initAmbientOrbs() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    const orbs = [
        { x: 0.15, y: 0.25, vx: 0.00012, vy: 0.00010, radius: 280, color: 'rgba(220, 38, 38, 0.08)' },
        { x: 0.85, y: 0.50, vx: -0.00010, vy: 0.00014, radius: 320, color: 'rgba(153, 27, 27, 0.09)' },
        { x: 0.50, y: 0.80, vx: 0.00011, vy: -0.00012, radius: 260, color: 'rgba(212, 175, 55, 0.05)' }
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function animate() {
        ctx.clearRect(0, 0, width, height);
        orbs.forEach(orb => {
            orb.x += orb.vx;
            orb.y += orb.vy;
            if (orb.x < 0.05 || orb.x > 0.95) orb.vx *= -1;
            if (orb.y < 0.05 || orb.y > 0.95) orb.vy *= -1;

            const px = orb.x * width, py = orb.y * height;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, orb.radius);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(1, 'rgba(9, 9, 11, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

/* === PANEL ADMINA & HISTORIA REZERWACJI === */
function checkHashRoute() {
    const hash = window.location.hash;
    const mainView = document.getElementById('main-content-view');
    const adminView = document.getElementById('admin-view-container');

    if (hash === '#admin') {
        if (mainView) mainView.classList.add('hidden');
        if (adminView) {
            adminView.classList.remove('hidden');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        checkAdminSession();
    } else {
        if (mainView) mainView.classList.remove('hidden');
        if (adminView) adminView.classList.add('hidden');
    }
}

function checkAdminSession() {
    const loginBox = document.getElementById('admin-login-box');
    const dashboard = document.getElementById('admin-dashboard-content');
    const isLoggedIn = sessionStorage.getItem('oldskull_admin_logged_in') === 'true';

    if (isLoggedIn) {
        if (loginBox) loginBox.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        loadAdminBookings();
    } else {
        if (loginBox) loginBox.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }
}

function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-password')?.value;
    const errEl = document.getElementById('admin-login-error');

    if (email === CONFIG.DEMO_ADMIN_EMAIL && pass === CONFIG.DEMO_ADMIN_PASS) {
        sessionStorage.setItem('oldskull_admin_logged_in', 'true');
        if (errEl) errEl.classList.add('hidden');
        checkAdminSession();
    } else {
        if (errEl) {
            errEl.innerText = 'Nieprawidłowe dane logowania (Demo: admin@oldskulltattoo.pl / admin123)';
            errEl.classList.remove('hidden');
        }
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('oldskull_admin_logged_in');
    window.location.hash = '';
}

// Inicjalizacja przykładowych danych demonstracyjnych
function ensureInitialDemoData() {
    if (!localStorage.getItem('oldskull_bookings_v2')) {
        const initialActive = [
            {
                id: 'oldskull_demo_1',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                client_name: 'Michał Dąbrowski',
                client_phone: '+48 601 234 567',
                client_email: 'michal.d@gmail.com',
                service_name: 'Realizm & Portret',
                booking_date: '2026-10-15',
                booking_time: '11:00',
                placement: 'Przedramię lewe',
                status: 'Oczekująca'
            },
            {
                id: 'oldskull_demo_2',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                client_name: 'Aleksandra Kruk',
                client_phone: '+48 512 889 123',
                client_email: 'ola.kruk@wp.pl',
                service_name: 'Blackwork & Dark Art',
                booking_date: '2026-10-15',
                booking_time: '13:00',
                placement: 'Plecy / Łopatka',
                status: 'Oczekująca'
            },
            {
                id: 'oldskull_demo_3',
                created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
                client_name: 'Piotr Zieliński',
                client_phone: '+48 501 333 444',
                client_email: 'piotr.z@gmail.com',
                service_name: 'Cover-up / Odświeżenie',
                booking_date: '2026-10-20',
                booking_time: '11:00',
                placement: 'Ramię',
                status: 'Oczekująca'
            },
            {
                id: 'oldskull_demo_4',
                created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
                client_name: 'Monika Wójcik',
                client_phone: '+48 502 444 555',
                client_email: 'monika.w@gmail.com',
                service_name: 'Realizm & Portret',
                booking_date: '2026-10-20',
                booking_time: '13:00',
                placement: 'Udo',
                status: 'Oczekująca'
            },
            {
                id: 'oldskull_demo_5',
                created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                client_name: 'Grzegorz Baran',
                client_phone: '+48 503 555 666',
                client_email: 'grzegorz.b@gmail.com',
                service_name: 'Neotraditional / Old School',
                booking_date: '2026-10-20',
                booking_time: '15:00',
                placement: 'Łydka',
                status: 'Oczekująca'
            },
            {
                id: 'oldskull_demo_6',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                client_name: 'Ewa Majewska',
                client_phone: '+48 504 666 777',
                client_email: 'ewa.m@gmail.com',
                service_name: 'Konsultacja & Projekt',
                booking_date: '2026-10-20',
                booking_time: '16:00',
                placement: 'Nadgarstek',
                status: 'Oczekująca'
            }
        ];

        const initialHistory = [
            {
                id: 'oldskull_demo_h1',
                client_name: 'Kamil Nowak',
                client_phone: '+48 790 111 222',
                client_email: 'kamil.n@onet.pl',
                service_name: 'Neotraditional / Old School',
                booking_date: '2026-10-02',
                booking_time: '15:00',
                status: 'Zatwierdzona',
                resolved_at: '2026-10-02T16:00:00.000Z'
            },
            {
                id: 'oldskull_demo_h2',
                client_name: 'Tomasz Lis',
                client_phone: '+48 609 999 888',
                client_email: 'tomasz@lis.pl',
                service_name: 'Cover-up / Odświeżenie',
                booking_date: '2026-09-28',
                booking_time: '11:00',
                status: 'Usunięta',
                resolved_at: '2026-09-29T10:30:00.000Z'
            }
        ];

        localStorage.setItem('oldskull_bookings', JSON.stringify(initialActive));
        localStorage.setItem('oldskull_bookings_history', JSON.stringify(initialHistory));
        localStorage.setItem('oldskull_bookings_v2', 'true');
    }
}

function loadAdminBookings() {
    ensureInitialDemoData();
    const bookings = JSON.parse(localStorage.getItem('oldskull_bookings') || '[]');
    const history = JSON.parse(localStorage.getItem('oldskull_bookings_history') || '[]');
    renderAdminTable(bookings, history);
}

// ZATWIERDZENIE REZERWACJI -> PRZENIESIENIE DO HISTORII
function approveBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem('oldskull_bookings') || '[]');
    let history = JSON.parse(localStorage.getItem('oldskull_bookings_history') || '[]');

    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return;

    const item = {
        ...bookings[idx],
        status: 'Zatwierdzona',
        resolved_at: new Date().toISOString()
    };

    bookings.splice(idx, 1);
    history.unshift(item);

    localStorage.setItem('oldskull_bookings', JSON.stringify(bookings));
    localStorage.setItem('oldskull_bookings_history', JSON.stringify(history));

    loadAdminBookings();

    showCustomModal({
        title: 'Rezerwacja Zatwierdzona',
        message: `Zgłoszenie klienta <strong>${item.client_name}</strong> zostało zatwierdzone i przeniesione do historii.`,
        type: 'success'
    });
}

// USUNIĘCIE REZERWACJI -> PRZENIESIENIE DO HISTORII ZE STATUSEM "USUNIĘTA"
function deleteBooking(bookingId) {
    showCustomModal({
        title: 'Usunąć Rezerwację?',
        message: 'Czy na pewno chcesz usunąć tę rezerwację? Zostanie ona przeniesiona do historii ze statusem „Usunięta”.',
        type: 'error',
        confirmText: 'Tak, Usuń',
        cancelText: 'Anuluj',
        onConfirm: () => {
            let bookings = JSON.parse(localStorage.getItem('oldskull_bookings') || '[]');
            let history = JSON.parse(localStorage.getItem('oldskull_bookings_history') || '[]');

            const idx = bookings.findIndex(b => b.id === bookingId);
            if (idx === -1) return;

            const item = {
                ...bookings[idx],
                status: 'Usunięta',
                resolved_at: new Date().toISOString()
            };

            bookings.splice(idx, 1);
            history.unshift(item);

            localStorage.setItem('oldskull_bookings', JSON.stringify(bookings));
            localStorage.setItem('oldskull_bookings_history', JSON.stringify(history));

            loadAdminBookings();
        }
    });
}

function renderAdminTable(bookings, history) {
    const activeBody = document.getElementById('admin-active-bookings-body');
    const historyBody = document.getElementById('admin-history-bookings-body');
    const activeCount = document.getElementById('admin-active-count');
    const historyCount = document.getElementById('admin-history-count');

    if (activeCount) activeCount.innerText = bookings.length;
    if (historyCount) historyCount.innerText = history.length;

    // Tabela Oczekujących
    if (activeBody) {
        activeBody.innerHTML = '';
        if (bookings.length === 0) {
            activeBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-xs text-gray-500">Brak oczekujących rezerwacji. Wszystkie zgłoszenia zostały rozpatrzone.</td></tr>';
        } else {
            bookings.forEach(b => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-dark-hover/40 transition text-xs text-gray-300';
                tr.innerHTML = `
                    <td class="py-3 px-3 font-mono text-red-400 font-bold whitespace-nowrap">
                        ${b.booking_date || '-'}<br>
                        <span class="text-gray-400 font-normal">${b.booking_time || ''}</span>
                    </td>
                    <td class="py-3 px-3 font-semibold text-white">
                        ${b.client_name || '-'}
                    </td>
                    <td class="py-3 px-3">
                        <a href="tel:${(b.client_phone || '').replace(/\s+/g, '')}" class="hover:text-red-400 font-mono transition">${b.client_phone || '-'}</a><br>
                        <span class="text-[10px] text-gray-400 font-mono">${b.client_email || ''}</span>
                    </td>
                    <td class="py-3 px-3">
                        ${b.service_name || '-'}<br>
                        <span class="text-[10px] text-gray-500">${b.placement || ''}</span>
                    </td>
                    <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ${b.status || 'Oczekująca'}
                        </span>
                    </td>
                    <td class="py-3 px-3 text-right whitespace-nowrap">
                        <button onclick="approveBooking('${b.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition mr-1.5 cursor-pointer" title="Zatwierdź termin">
                            <i class="fa-solid fa-check mr-1"></i> Zatwierdź
                        </button>
                        <button onclick="deleteBooking('${b.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white text-[11px] font-bold transition cursor-pointer" title="Usuń rezerwację">
                            <i class="fa-solid fa-trash mr-1"></i> Usuń
                        </button>
                    </td>
                `;
                activeBody.appendChild(tr);
            });
        }
    }

    // Tabela Historii
    if (historyBody) {
        historyBody.innerHTML = '';
        if (history.length === 0) {
            historyBody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-xs text-gray-500">Brak historii rezerwacji.</td></tr>';
        } else {
            history.forEach(b => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-dark-hover/30 transition text-xs text-gray-400';
                const isApproved = (b.status === 'Zatwierdzona');
                const badgeClass = isApproved 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30';

                tr.innerHTML = `
                    <td class="py-3 px-3 font-mono whitespace-nowrap">
                        ${b.booking_date || '-'}<br>
                        <span class="text-gray-600">${b.booking_time || ''}</span>
                    </td>
                    <td class="py-3 px-3 text-gray-300 font-medium">
                        ${b.client_name || '-'}
                    </td>
                    <td class="py-3 px-3">
                        ${b.client_phone || '-'}<br>
                        <span class="text-[10px] text-gray-500">${b.client_email || ''}</span>
                    </td>
                    <td class="py-3 px-3 text-gray-400">
                        ${b.service_name || '-'}
                    </td>
                    <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass} border">
                            ${b.status || '-'}
                        </span>
                    </td>
                    <td class="py-3 px-3 text-right font-mono text-[10px] text-gray-500 whitespace-nowrap">
                        ${b.resolved_at ? new Date(b.resolved_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                `;
                historyBody.appendChild(tr);
            });
        }
    }
}

/* === DOMContentLoaded === */
document.addEventListener('DOMContentLoaded', () => {
    ensureInitialDemoData();
    initAmbientOrbs();
    initScrollReveal();
    initCookieBanner();
    initFaqAccordion();
    renderCalendar();

    window.addEventListener('hashchange', checkHashRoute);
    checkHashRoute();

    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) adminForm.onsubmit = handleAdminLogin;
});
