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
                    ob.appendChild(x);
                    slot.appendChild(ob);
                } else {
                    // Порожня зона для перетягування іконок
                    const zona = document.createElement("div");
                    zona.className = "zona";
                    zona.textContent = KAT[k].mistce;

                    zona.addEventListener("dragover", function (e) {
                        if (peretyaguvanyj && peretyaguvanyj.k === k) e.preventDefault();
                    });
                    zona.addEventListener("drop", function (e) {
                        e.preventDefault();
                        if (s.mistce || !peretyaguvanyj || peretyaguvanyj.k !== k) return;
                        s.mistce = { emoji: peretyaguvanyj.emoji, tekst: peretyaguvanyj.tekst };
                        renderBloky();
                    });
                    slot.appendChild(zona);
                }

                gr.appendChild(slot);
            });

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