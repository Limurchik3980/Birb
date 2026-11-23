// ===== Календар: День, Тиждень, Місяць =====
const KAL = {
    rezhym: "misyac",   // "den", "tyzhden" або "misyac"
    data: new Date()    // дата, навколо якої показуємо календар
};

const KAL_DNI = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// Ключ дати виду "2026-11-23", щоб порівнювати дні
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

// Одна клітинка дня
function kalKomirka(dt, siohodni, potochna) {
    const k = document.createElement("div");
    k.className = "kal-komirka";
    if (KAL.rezhym === "misyac" && dt.getMonth() !== potochna.getMonth()) k.classList.add("inshyj");
    if (kalKlyuch(dt) === siohodni) k.classList.add("siohodni");
    k.textContent = dt.getDate();
    // Клік по дню відкриває його в режимі "День"
    k.addEventListener("click", function () {
        KAL.data = dt;
        KAL.rezhym = "den";
        kalRender();
    });
    return k;
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
        const porozhno = document.createElement("div");
        porozhno.className = "kal-porozhno";
        porozhno.textContent = "Немає подій";
        kont.appendChild(porozhno);
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

    // Сама сітка: місяць показує 6 тижнів, тиждень показує 7 днів
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