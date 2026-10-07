# 💀 Old Skull Tattoo Art Gallery - Dedykowana Strona Pokazowa (Demo Landing Page)

Nowoczesny, mroczno-elegancki i w pełni responsywny serwis internetowy (Landing Page) przygotowany dla salonu tatuażu **Old Skull Tattoo Art Gallery** w Tarnowie (studio z tradycjami od 2009 roku).

---

## 📌 Szczegóły Wizytówkowe & Dane Kontaktowe
- **Nazwa:** Old Skull Tattoo Art Gallery
- **Lokalizacja:** Goldhammera 5, 33-100 Tarnów, Poland
- **Telefon:** 697 130 545
- **E-mail:** info@oldskulltattoo.pl
- **Instagram:** [https://www.instagram.com/oldskulltattoo_artgallery](https://www.instagram.com/oldskulltattoo_artgallery)
- **Godziny Otwarcia:**
  - Poniedziałek – Piątek: 11:00 – 17:00
  - Sobota – Niedziela: ZAMKNIĘTE (formularz rezerwacyjny online działa 24/7)

---

## 🎨 Kluczowe Sekcje i Funkcjonalności

1. **Top Banner Demonstracyjny:**
   - Wyraźna informacja na samej górze strony o wersji pokazowej spersonalizowanego projektu przygotowanego dla Old Skull Tattoo Art Gallery z zachętą do kontaktu.

2. **Hero Section (Mroczna Elegancja):**
   - Imponujący nagłówek gothic/cinzel z nazwą salonu i miastem Tarnów.
   - Podtytuł eksponujący doświadczenie od 2009 roku oraz rezerwację online 24/7.
   - Przyciski CTA: *"Zarezerwuj termin"* oraz *"Sprawdź wolne terminy"*.

3. **Sekcja "Dlaczego warto posiadać profesjonalną stronę?":**
   - Wyliczenie głównych korzyści biznesowych i prestiżowych dla studia:
     - Pełna niezależność i brak prowizji (np. Booksy).
     - Prestiżowy wizerunek artystyczny dopasowany do tradycji studia od 2009 r.
     - Automatyzacja rezerwacji i wygoda 24/7.
     - Lepsza widoczność w wyszukiwarce Google dla klientów z Tarnowa i okolic.

4. **Interaktywny System Rezerwacji Online (Kalendarz JS):**
   - 4-krokowy intuicyjny proces:
     - Krok 1: Wybór stylu tatuażu (Realizm & Portret, Blackwork & Dark Art, Neotraditional, Trash Polka, Cover-up, Konsultacja).
     - Krok 2: Interaktywny kalendarz z uwzględnieniem dni otwarcia (sobota i niedziela oznaczone jako ZAMKNIĘTE) oraz dostępnych godzin w przedziale 11:00 - 17:00.
     - Krok 3: Wgrywanie inspiracji graficznych (FileReader API) i dane kontaktowe klienta z wyborem prefiksu krajowego.
     - Krok 4: Podsumowanie wniosku, zgoda RODO i wysyłka do bazy/localStorage oraz e-mail (EmailJS).

5. **Mroczna Galeria Prac (Portfolio Lightbox):**
   - Siatka wyselekcjonowanych autorskich tatuaży z podglądem pełnoekranowym w modalu z obsługą klawiatury (Esc, strzałki).

6. **Sekcja Opinii (Social Proof z Google):**
   - 3 autentyczne opinie klientów salonu (Kacper S., Karolina M., Paweł W.) ocenione na 5/5 ★.

7. **Kontakt, Mapa i Stopka:**
   - Kompletne dane adresowe, interaktywna integracja z Google Maps, przycisk natychmiastowego połączenia telefonicznego oraz ukryty panel administratora (`#admin`).

---

## 📁 Struktura Plików
```text
old-skull-tattoo/
├── index.html      # Główna struktura HTML5 z Tailwind CDN, sekcjami i modalami
├── style.css       # Style CSS z ciemnym motywem, zmiennymi :root, akcentami czerwieni i złota
├── script.js       # Logika kalendarza, walidacja, obsługa podglądu zdjęć i panelu admina
└── README.md       # Dokumentacja projektu
```
