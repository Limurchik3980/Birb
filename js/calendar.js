// ===== Календар: День, Тиждень, Місяць =====
const KAL = {
    rezhym: "misyac",   // "den", "tyzhden" або "misyac"
    data: new Date()
};

const KAL_DNI = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// ===== Справи в календарі =====
// podiyi["2026-11-23"] = [{ emoji, nazva, pochatok, kinec, notatka }]
let podiyi = JSON.parse(localStorage.getItem("kal-podiyi")) || {};
let kalIgnoreClick = false; // щоб після довгого натискання не спрацьовував клік

function kalZberehtyPodiyi() {
    localStorage.setItem("kal-podiyi", JSON.stringify(podiyi));
    hmaraZberehty({ podiyi: JSON.stringify(podiyi) });
}

// Ключ дати виду "2026-11-23"
function kalKlyuch(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Понеділок того тижня, в якому лежить дата
function kalPochatok(d) {
    const zsuv = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - zsuv);
}

// Пересуває календар вперед (+1) або назад (-1) залежно від режиму
function kalZsunuty(n) {
    const d = KAL.data;
    if (KAL.rezhym === "misyac") {
        KAL.data = new Date(d.getFullYear(), d.getMonth() + n, 1);
    } else if (KAL.rezhym === "tyzhden") {
        KAL.data = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n);
    } else {
        KAL.data = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    }
}

// Текст над календарем
function kalZagolovok() {
    const d = KAL.data;
    if (KAL.rezhym === "misyac") {
        return MISYATSI[d.getMonth()] + " " + d.getFullYear();
    }
    if (KAL.rezhym === "tyzhden") {
        const p = kalPochatok(d);
        const k = new Date(p.getFullYear(), p.getMonth(), p.getDate() + 6);
        return p.getDate() + " " + MISYATSI[p.getMonth()] + " – " + k.getDate() + " " + MISYATSI[k.getMonth()] + " " + k.getFullYear();
    }
    return d.getDate() + " " + MISYATSI[d.getMonth()] + " " + d.getFullYear() + ", " + DNI_TYZH[d.getDay()];
}

// Правий клік на ПК або довге натискання на телефоні
function kalNatyskannya(el, diya) {
    let taimer = null;
    let spratsyuvav = false;
    el.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        diya();
    });
    el.addEventListener("touchstart", function () {
        spratsyuvav = false;
        taimer = setTimeout(function () {
            spratsyuvav = true;
            diya();
        }, 500);
    }, { passive: true });
    el.addEventListener("touchend", function () {
        clearTimeout(taimer);
        if (spratsyuvav) {
            kalIgnoreClick = true;
            setTimeout(function () { kalIgnoreClick = false; }, 400);
        }
    });
    el.addEventListener("touchmove", function () { clearTimeout(taimer); });
}

// Одне поле форми: підпис + поле вводу (або textarea для нотатки)
function kalPole(tekst, pidkazka, dovgyj) {
    const ryad = document.createElement("label");
    ryad.className = "kal-pole-ryad";
    const pidp = document.createElement("span");
    pidp.textContent = tekst;
    const vvid = dovgyj ? document.createElement("textarea") : document.createElement("input");
    if (!dovgyj) vvid.type = "text";
    vvid.placeholder = pidkazka || "";
    ryad.appendChild(pidp);
    ryad.appendChild(vvid);
    return { ryad: ryad, vvid: vvid };
}

// Вікно редактора справи для обраного дня
function kalFormaPodiyi(data, pochatok) {
    const fon = document.createElement("div");
    fon.className = "overlay";
    const box = document.createElement("div");
    box.className = "vikno-potv kal-forma";

    const zag = document.createElement("p");
    zag.textContent = "Нова справа · " + chastyDaty(data).join(" ");
    box.appendChild(zag);

    const ikona = kalPole("Іконка (емоджі)", "😀");
    ikona.vvid.maxLength = 4;
    const nazva = kalPole("Назва", "Наприклад: Прогулянка");
    const star = kalPole("Початок", "09:00");
    star.vvid.value = pochatok || "";
    const kinec = kalPole("Кінець", "10:00");
    const nota = kalPole("Нотатка", "Що не забути", true);

    [ikona, nazva, star, kinec, nota].forEach(function (p) { box.appendChild(p.ryad); });

    const knopky = document.createElement("div");
    knopky.className = "potv-knopky";
    const sk = document.createElement("button");
    sk.textContent = "Скасувати";
    const zb = document.createElement("button");
    zb.textContent = "Зберегти";
    knopky.appendChild(sk);
    knopky.appendChild(zb);
    box.appendChild(knopky);

    fon.appendChild(box);
    document.body.appendChild(fon);

    function zakryty() { fon.remove(); }
    sk.addEventListener("click", zakryty);
    fon.addEventListener("click", function (e) { if (e.target === fon) zakryty(); });

    zb.addEventListener("click", function () {
        const tx = nazva.vvid.value.trim();
        if (!tx) return; // без назви справа не зберігається
        const podiya = {
            emoji: ikona.vvid.value.trim() || "📌",
            nazva: tx,
            pochatok: star.vvid.value.trim(),
            kinec: kinec.vvid.value.trim(),
            notatka: nota.vvid.value.trim()
        };
        if (!podiyi[data]) podiyi[data] = [];
        podiyi[data].push(podiya);
        // Справи з часом йдуть за часом, без часу в кінці
        podiyi[data].sort(function (a, b) {
            return (a.pochatok || "99:99").localeCompare(b.pochatok || "99:99");
        });
        kalZberehtyPodiyi();
        zakryty();
        kalRender();
    });

    nazva.vvid.focus();
}

// Кнопка з текстом
function kalKnopka(tekst, diya, aktyvna) {
    const b = document.createElement("button");
    b.className = "kal-knopka";
    b.textContent = tekst;
    if (aktyvna) b.classList.add("aktyvna");
    b.addEventListener("click", diya);
    return b;
}

// Одна клітинка дня: номер, справи, клік і правий клік / довге натискання
function kalKomirka(dt, siohodni, potochna) {
    const k = document.createElement("div");
    k.className = "kal-komirka";
    if (KAL.rezhym === "misyac" && dt.getMonth() !== potochna.getMonth()) k.classList.add("inshyj");
    if (kalKlyuch(dt) === siohodni) k.classList.add("siohodni");

    const nomer = document.createElement("div");
    nomer.textContent = dt.getDate();
    k.appendChild(nomer);

    (podiyi[kalKlyuch(dt)] || []).forEach(function (p) {
        const pz = document.createElement("div");
        pz.className = "kal-podiya";
        pz.textContent = p.emoji + " " + p.nazva;
        k.appendChild(pz);
    });

    // Клік по дню відкриває його в режимі "День"
    k.addEventListener("click", function () {
        if (kalIgnoreClick) return;
        KAL.data = dt;
        KAL.rezhym = "den";
        kalRender();
    });

    kalNatyskannya(k, function () { kalFormaPodiyi(kalKlyuch(dt)); });
    return k;
}

// Шкала годин для режиму "День" зі справами
function kalDenShkala(kont) {
    const data = kalKlyuch(KAL.data);
    const dnya = podiyi[data] || [];

    const wrap = document.createElement("div");
    wrap.className = "kal-skrol";

    // Справи без часу показуємо над шкалою
    const bezChasu = dnya.filter(function (p) { return !p.pochatok; });
    if (bezChasu.length) {
        const bl = document.createElement("div");
        bl.className = "kal-bez-chasu";
        bezChasu.forEach(function (p) {
            const pz = document.createElement("div");
            pz.className = "kal-podiya";
            pz.textContent = p.emoji + " " + p.nazva;
            bl.appendChild(pz);
        });
        wrap.appendChild(bl);
    }

    const shkala = document.createElement("div");
    shkala.className = "kal-shkala";

    for (let h = 0; h < 24; h++) {
        const ryad = document.createElement("div");
        ryad.className = "kal-chas";

        const pidpys = document.createElement("span");
        pidpys.className = "kal-chas-pidpys";
        const hh = String(h).padStart(2, "0");
        pidpys.textContent = hh + ":00";
        ryad.appendChild(pidpys);

        // Справи, що починаються в цій годині
        dnya.filter(function (p) { return p.pochatok && parseInt(p.pochatok, 10) === h; })
            .forEach(function (p) {
                const pz = document.createElement("div");
                pz.className = "kal-podiya kal-podiya-chas";
                pz.textContent = p.pochatok + " " + p.emoji + " " + p.nazva;
                ryad.appendChild(pz);
            });

        kalNatyskannya(ryad, function () { kalFormaPodiyi(data, hh + ":00"); });
        shkala.appendChild(ryad);
    }

    wrap.appendChild(shkala);
    kont.appendChild(wrap);

    // Стартуємо з 07:00, щоб ранок був видно одразу
    wrap.scrollTop = 7 * 48;
}

// Малює весь календар заново
function kalRender() {
    const kont = document.getElementById("kalendar");
    if (!kont) return;
    kont.innerHTML = "";

    const d = KAL.data;
    const siohodni = kalKlyuch(new Date());

    // Верхній рядок: стрілки, назва і перемикач режимів
    const top = document.createElement("div");
    top.className = "kal-top";

    const livo = document.createElement("div");
    livo.className = "kal-lyvo";
    livo.appendChild(kalKnopka("‹", function () { kalZsunuty(-1); kalRender(); }));
    livo.appendChild(kalKnopka("›", function () { kalZsunuty(1); kalRender(); }));
    livo.appendChild(kalKnopka("Сьогодні", function () { KAL.data = new Date(); kalRender(); }));

    const nazva = document.createElement("span");
    nazva.className = "kal-nazva";
    nazva.textContent = kalZagolovok();
    livo.appendChild(nazva);
    top.appendChild(livo);

    const pravo = document.createElement("div");
    pravo.className = "kal-rezhymy";
    [["den", "День"], ["tyzhden", "Тиждень"], ["misyac", "Місяць"]].forEach(function (r) {
        pravo.appendChild(kalKnopka(r[1], function () { KAL.rezhym = r[0]; kalRender(); }, KAL.rezhym === r[0]));
    });
    top.appendChild(pravo);
    kont.appendChild(top);

    if (KAL.rezhym === "den") {
        kalDenShkala(kont);
        return;
    }

    // Заголовок з днями тижня
    const golova = document.createElement("div");
    golova.className = "kal-golova";
    KAL_DNI.forEach(function (t) {
        const c = document.createElement("div");
        c.textContent = t;
        golova.appendChild(c);
    });
    kont.appendChild(golova);

    // Сітка: місяць показує 6 тижнів, тиждень показує 7 днів
    const sitka = document.createElement("div");
    sitka.className = "kal-sitka";
    const pochatok = KAL.rezhym === "misyac"
        ? kalPochatok(new Date(d.getFullYear(), d.getMonth(), 1))
        : kalPochatok(d);
    const kilk = KAL.rezhym === "misyac" ? 42 : 7;

    for (let i = 0; i < kilk; i++) {
        const dt = new Date(pochatok.getFullYear(), pochatok.getMonth(), pochatok.getDate() + i);
        sitka.appendChild(kalKomirka(dt, siohodni, d));
    }
    kont.appendChild(sitka);
}

kalRender();