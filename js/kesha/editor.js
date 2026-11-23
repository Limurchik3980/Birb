// ===== Кешаня: редактор дня =====

// День, який зараз редагуємо (чернетка, в dni потрапляє тільки після "Завершити")
let cur = null;
let peretyaguvanyj = null;   // іконка з правого боку
let perestavlyanyj = null;   // активність зі списку, яку переставляємо

// Плавно зсуває заповнені активності, коли DOM міняє їх місцями
function zRuhom(batko, zminy) {
    const stari = new Map();
    batko.querySelectorAll(":scope > .slot.filled").forEach(function (el) {
        stari.set(el, el.getBoundingClientRect().top);
    });

    zminy();

    batko.querySelectorAll(":scope > .slot.filled").forEach(function (el) {
        if (!stari.has(el)) return;
        const dy = stari.get(el) - el.getBoundingClientRect().top;
        if (!dy) return;
        el.style.transition = "none";
        el.style.transform = "translateY(" + dy + "px)";
        el.offsetHeight; // перемальовка, щоб анімація стартувала з правильного місця
        el.style.transition = "transform 0.2s ease";
        el.style.transform = "";
    });
}

// Переставляє активність у межах групи
function perenesty(g, from, to) {
    const filled = g.slots.filter(s => s.mistce);
    if (from < 0 || from >= filled.length) return;
    const item = filled.splice(from, 1)[0];
    const pos = Math.min(to > from ? to - 1 : to, filled.length);
    filled.splice(pos, 0, item);
    g.slots = filled.concat([{ mistce: null }]);
}

// Перетворює текст тривалості на хвилини: "45" або "12:00-13:00"
function hvylyny(tekst) {
    const t = (tekst || "").trim();
    const m = t.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (m) {
        let r = (+m[3]) * 60 + (+m[4]) - ((+m[1]) * 60 + (+m[2]));
        if (r < 0) r += 1440; // проміжок через північ
        return r;
    }
    if (/^\d+$/.test(t)) return +t;
    return 0;
}

// Сума тривалостей активностей у групі, наприклад "Разом: 2 год 15 хв"
function formatSuma(g) {
    const vsogo = g.slots.reduce((sum, x) => sum + (x.mistce ? hvylyny(x.trv) : 0), 0);
    if (vsogo === 0) return "";
    const god = Math.floor(vsogo / 60);
    const hv = vsogo % 60;
    return "Разом: " + god + " год " + hv + " хв";
}

// Поле часу підлаштовується під довжину тексту
function pidlashtuvaty(el) {
    const n = el.value.length || el.placeholder.length;
    el.style.width = (n + 3) + "ch";
}

function vidkrytyEditor() {
    document.getElementById("red-data").value = cur.data;
    pokazatyEkran("redaktor");
    renderBloky();
    renderIkony();
}

// Новий день: одразу одна мітка часу з полем "Вибрати час" і місцем для активності
function pochatyNovyjDen(data) {
    cur = {
        data: data,
        orig: null,
        akt: [novaHrupa(true)],
        khar: [novaHrupa(true)]
    };
    normalizuvaty(cur.akt);
    normalizuvaty(cur.khar);
    vidkrytyEditor();
}

// Вже збережений день: відкриваємо копію для редагування
function vidkrytyZbereghenyDen(data) {
    cur = {
        data: data,
        orig: data,
        akt: kopiya(dni[data].akt),
        khar: kopiya(dni[data].khar)
    };
    vidkrytyEditor();
}
// Поле пошуку, нотатка і зона для перетягування іконок у порожній активності
function poshukovePole(s, k, slot) {
    const ryad = document.createElement("div");
    ryad.className = "poshuk-ryad";

    // Перетягування іконки справа в цей рядок
    ryad.addEventListener("dragover", function (e) {
        if (peretyaguvanyj && peretyaguvanyj.k === k) e.preventDefault();
    });
    ryad.addEventListener("drop", function (e) {
        e.preventDefault();
        if (s.mistce || !peretyaguvanyj || peretyaguvanyj.k !== k) return;
        s.mistce = { emoji: peretyaguvanyj.emoji, tekst: peretyaguvanyj.tekst };
        renderBloky();
    });

    // Поле пошуку зі списком варіантів
    const obgortka = document.createElement("div");
    obgortka.className = "poshuk-obg";

    const pole = document.createElement("input");
    pole.type = "text";
    pole.className = "zona poshuk-pole";
    pole.placeholder = KAT[k].mistce;

    const spysok = document.createElement("div");
    spysok.className = "poshuk-spysok";
    spysok.hidden = true;

    function pokazatyVarianty() {
        const q = pole.value.trim().toLowerCase();
        spysok.innerHTML = "";
        const znajdeni = ikony[k].filter(ik => ik.tekst.toLowerCase().includes(q));
        znajdeni.forEach(function (ik) {
            const v = document.createElement("div");
            v.className = "poshuk-variant";
            v.textContent = ik.emoji + " " + ik.tekst;
            // mousedown спрацьовує раніше за blur, тож список встигає отримати клік
            v.addEventListener("mousedown", function (e) {
                e.preventDefault();
                s.mistce = { emoji: ik.emoji, tekst: ik.tekst };
                renderBloky();
            });
            spysok.appendChild(v);
        });
        spysok.hidden = znajdeni.length === 0;
    }

    pole.addEventListener("focus", pokazatyVarianty);
    pole.addEventListener("input", pokazatyVarianty);
    pole.addEventListener("blur", function () { spysok.hidden = true; });

    obgortka.appendChild(pole);
    obgortka.appendChild(spysok);
    ryad.appendChild(obgortka);

    // Нотатка тільки для активностей
    if (k === "akt") {
        const nota = document.createElement("input");
        nota.type = "text";
        nota.className = "nota-pole";
        nota.placeholder = "Нотатка";
        nota.addEventListener("keydown", function (e) {
            if (e.key !== "Enter") return;
            const t = nota.value.trim();
            if (!t) return;
            // Емоджі 📝 для нотаток, іконку в список не додаємо
            s.mistce = { emoji: "📝", tekst: t };
            renderBloky();
        });
        ryad.appendChild(nota);
    }

    slot.appendChild(ryad);
}

function renderBloky() {
    ["akt", "khar"].forEach(function (k) {
        const kont = document.getElementById("blok-" + k);
        kont.innerHTML = "";

        const h = document.createElement("h3");
        h.textContent = KAT[k].nazva;
        kont.appendChild(h);

        const grupy = cur[k];
        normalizuvaty(grupy);

        grupy.forEach(function (g, gi) {
            const gr = document.createElement("div");
            gr.className = "gruppa";

            // Мітка часу тільки для груп, створених кнопкою
            if (g.ch) {
                const ryad = document.createElement("div");
                ryad.className = "chas-ryad";

                const chas = document.createElement("input");
                chas.type = "text";
                chas.className = "chas-pole";
                chas.placeholder = "Вибрати час";
                chas.value = g.chas;
                pidlashtuvaty(chas);
                chas.addEventListener("input", function () {
                    g.chas = chas.value;
                    pidlashtuvaty(chas);
                });
                ryad.appendChild(chas);

                // Видалити всю мітку разом з її активностями (з підтвердженням)
                if (grupy.length > 1) {
                    const vydal = document.createElement("button");
                    vydal.className = "hrestyk";
                    vydal.textContent = "×";
                    vydal.title = "Видалити мітку з активностями";
                    vydal.addEventListener("click", function () {
                        potverdyty("Точно цього хочеш?", function () {
                            grupy.splice(gi, 1);
                            if (grupy.length === 0) grupy.push(novaHrupa(false));
                            renderBloky();
                        });
                    });
                    ryad.appendChild(vydal);
                }
                gr.appendChild(ryad);
            }

            g.slots.forEach(function (s, si) {
                const slot = document.createElement("div");
                slot.className = "slot";
                slot._s = s;

                // Переміщення всередині тієї самої групи
                slot.addEventListener("dragover", function (e) {
                    const d = perestavlyanyj;
                    if (!d || d.k !== k || slot.parentElement !== d.el.parentElement) return;
                    e.preventDefault();
                    if (slot === d.el || !s.mistce) return;

                    const r = slot.getBoundingClientRect();
                    const pislya = e.clientY > r.top + r.height / 2;
                    const ref = pislya ? slot.nextSibling : slot;
                    if (ref === d.el || ref === d.el.nextSibling) return;

                    const batko = slot.parentElement;
                    zRuhom(batko, function () {
                        batko.insertBefore(d.el, ref);
                    });
                });

                if (s.mistce) {
                    slot.classList.add("filled");

                    const ob = document.createElement("div");
                    ob.className = "zafiksovano";

                    // Три лінії: тільки за них можна перетягувати
                    const ruchka = document.createElement("span");
                    ruchka.className = "ruchka";
                    ruchka.draggable = true;
                    ruchka.title = "Перетягнути";

                    ruchka.addEventListener("dragstart", function (e) {
                        perestavlyanyj = { k: k, el: slot };
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", s.mistce.tekst);
                        e.dataTransfer.setDragImage(slot, 12, 12);
                        requestAnimationFrame(function () { slot.classList.add("tyagnet"); });
                    });

                    ruchka.addEventListener("dragend", function (e) {
                        slot.classList.remove("tyagnet");
                        perestavlyanyj = null;
                        // Якщо кинули повз списку, повертаємо як було
                        if (e.dataTransfer.dropEffect === "none") {
                            renderBloky();
                            return;
                        }
                        // Новий порядок беремо з того, як стоять поля на екрані
                        g.slots = Array.from(gr.querySelectorAll(":scope > .slot")).map(el => el._s);
                        renderBloky();
                    });

                    const tekst = document.createElement("span");
                    tekst.textContent = s.mistce.emoji + " " + s.mistce.tekst;

                    const x = document.createElement("button");
                    x.className = "hrestyk";
                    x.textContent = "×";
                    x.title = "Прибрати активність разом з полем";
                    x.addEventListener("click", function () {
                        g.slots.splice(si, 1);
                        renderBloky();
                    });

                    ob.appendChild(ruchka);
                    ob.appendChild(tekst);

                    // Поле тривалості тільки для активностей, не для їжі
                    if (k === "akt") {
                        const trv = document.createElement("input");
                        trv.type = "text";
                        trv.className = "trv-pole";
                        trv.placeholder = "12:00-13:00";
                        trv.value = s.trv || "";
                        trv.addEventListener("input", function () {
                            s.trv = trv.value;
                            const sumaEl = gr.querySelector(".suma");
                            if (sumaEl) sumaEl.textContent = formatSuma(g);
                        });
                        ob.appendChild(trv);
                    }

                    ob.appendChild(x);
                    slot.appendChild(ob);

                } else {
                    poshukovePole(s, k, slot);
                }

                gr.appendChild(slot);
            });

            // Сума тривалостей в кінці мітки, тільки для активностей
            if (k === "akt") {
                const suma = document.createElement("div");
                suma.className = "suma";
                suma.textContent = formatSuma(g);
                gr.appendChild(suma);
            }

            kont.appendChild(gr);

        });

        const dodatyMitku = document.createElement("button");
        dodatyMitku.textContent = "Додати часову мітку";
        dodatyMitku.addEventListener("click", function () {
            // Нова група завершує попередню, бо поля йдуть вже під новою міткою
            cur[k].push(novaHrupa(true));
            normalizuvaty(cur[k]);
            renderBloky();
        });
        kont.appendChild(dodatyMitku);
    });
}

// Кнопки редактора
document.getElementById("red-data").addEventListener("change", function (e) {
    if (!cur || !e.target.value) return;
    cur.data = e.target.value;
});

document.getElementById("red-nazad").addEventListener("click", function () {
    cur = null;
    pokazatyEkran("spysok");
    pokazatyMinuli();
});

document.getElementById("red-zavershyty").addEventListener("click", function () {
    if (!cur) return;
    // Якщо дату змінили у збереженого дня, старий запис прибираємо
    if (cur.orig && cur.orig !== cur.data) delete dni[cur.orig];
    dni[cur.data] = { akt: cur.akt, khar: cur.khar };
    zberehtyDni();
    cur = null;
    pokazatyEkran("spysok");
    pokazatyMinuli();
});