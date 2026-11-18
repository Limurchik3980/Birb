// ===== Кешаня: іконки справа і меню =====

// Яку іконку редагуємо (індекс) і чи відкрита форма
const redagIdx = { akt: -1, khar: -1 };
const formaVidkr = { akt: false, khar: false };

// Прибирає з груп усі активності з видаленою іконкою
function ochystytyGrupy(grupy, k, em, tx) {
    if (!grupy) return;
    grupy.forEach(function (g) {
        g.slots = g.slots.filter(s => !(s.mistce && s.mistce.emoji === em && s.mistce.tekst === tx));
    });
    normalizuvaty(grupy);
}

// ===== Меню Редагувати / Видалити =====
const menu = document.getElementById("menu");

function hideMenu() {
    menu.hidden = true;
}

function pokazatyMenu(x, y, k, idx) {
    menu.innerHTML = "";

    const ed = document.createElement("button");
    ed.textContent = "Редагувати";
    ed.addEventListener("click", function () {
        hideMenu();
        redagIdx[k] = idx;
        formaVidkr[k] = true;
        renderIkony();
    });

    const vd = document.createElement("button");
    vd.textContent = "Видалити";
    vd.addEventListener("click", function () {
        hideMenu();
        const vydalena = ikony[k][idx];
        ikony[k].splice(idx, 1);
        if (redagIdx[k] === idx) redagIdx[k] = -1;

        // Прибираємо активності з цією іконкою у всіх днях
        if (cur) ochystytyGrupy(cur[k], k, vydalena.emoji, vydalena.tekst);
        Object.keys(dni).forEach(function (data) {
            ochystytyGrupy(dni[data][k], k, vydalena.emoji, vydalena.tekst);
        });

        zberehtyDni();
        if (cur) renderBloky();
        renderIkony();
    });

    menu.appendChild(ed);
    menu.appendChild(vd);
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.hidden = false;
}

document.addEventListener("pointerdown", function (e) {
    if (!menu.contains(e.target)) hideMenu();
});
window.addEventListener("scroll", hideMenu, true);

// ===== Малювання іконок справа =====
function renderIkony() {
    ["akt", "khar"].forEach(function (k) {
        const kont = document.getElementById("ikony-" + k);
        kont.innerHTML = "";

        const pill = document.createElement("div");
        pill.className = "pill";
        pill.textContent = KAT[k].nazva;
        kont.appendChild(pill);

        const sitka = document.createElement("div");
        sitka.className = "sitka";
        ikony[k].forEach(function (ik, idx) {
            const wrap = document.createElement("div");
            wrap.className = "ikona-wrap";

            const el = document.createElement("div");
            el.className = "ikona";
            el.draggable = true;
            el.textContent = ik.emoji;

            el.addEventListener("dragstart", function (e) {
                peretyaguvanyj = { k: k, emoji: ik.emoji, tekst: ik.tekst };
                e.dataTransfer.setData("text/plain", ik.tekst);
            });
            el.addEventListener("dragend", function () {
                peretyaguvanyj = null;
            });

            el.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                pokazatyMenu(e.clientX, e.clientY, k, idx);
            });

            let taimer = null;
            el.addEventListener("touchstart", function (e) {
                const t = e.touches[0];
                taimer = setTimeout(function () {
                    pokazatyMenu(t.clientX, t.clientY, k, idx);
                }, 500);
            }, { passive: true });
            el.addEventListener("touchend", function () { clearTimeout(taimer); });
            el.addEventListener("touchmove", function () { clearTimeout(taimer); });

            const podpys = document.createElement("div");
            podpys.textContent = ik.tekst;

            wrap.appendChild(el);
            wrap.appendChild(podpys);
            sitka.appendChild(wrap);
        });
        kont.appendChild(sitka);

        const forma = document.createElement("div");
        forma.className = "forma";
        forma.hidden = !(formaVidkr[k] || redagIdx[k] >= 0);

        const redag = redagIdx[k] >= 0 ? ikony[k][redagIdx[k]] : null;

        const emojiPole = document.createElement("input");
        emojiPole.type = "text";
        emojiPole.placeholder = "Емоджі";
        emojiPole.maxLength = 4;
        emojiPole.value = redag ? redag.emoji : "";

        const tekstPole = document.createElement("input");
        tekstPole.type = "text";
        tekstPole.placeholder = "Назва";
        tekstPole.value = redag ? redag.tekst : "";

        const knopkyForm = document.createElement("div");
        knopkyForm.className = "forma-knopky";

        const zb = document.createElement("button");
        zb.textContent = redag ? "Оновити" : "Зберегти";
        zb.addEventListener("click", function () {
            const em = emojiPole.value.trim();
            const tx = tekstPole.value.trim();
            if (!em || !tx) return;
            if (redagIdx[k] >= 0) {
                ikony[k][redagIdx[k]] = { emoji: em, tekst: tx };
            } else {
                ikony[k].push({ emoji: em, tekst: tx });
            }
            redagIdx[k] = -1;
            formaVidkr[k] = false;
            zberehtyDni();
            renderIkony();
        });

        const skasuvaty = document.createElement("button");
        skasuvaty.textContent = "Скасувати";
        skasuvaty.addEventListener("click", function () {
            redagIdx[k] = -1;
            formaVidkr[k] = false;
            renderIkony();
        });

        knopkyForm.appendChild(zb);
        knopkyForm.appendChild(skasuvaty);

        forma.appendChild(emojiPole);
        forma.appendChild(tekstPole);
        forma.appendChild(knopkyForm);

        const nova = document.createElement("button");
        nova.className = "dodaty-nova";
        nova.textContent = "Додати нову";
        nova.addEventListener("click", function () {
            if (formaVidkr[k] || redagIdx[k] >= 0) {
                redagIdx[k] = -1;
                formaVidkr[k] = false;
            } else {
                formaVidkr[k] = true;
            }
            renderIkony();
        });

        kont.appendChild(nova);
        kont.appendChild(forma);
    });
}