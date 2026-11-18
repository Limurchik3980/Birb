// ===== Кешаня: список днів і перемикання екранів =====

// Частини дати для вирівняних колонок: день тижня, число, місяць, рік
function chastyDaty(data) {
    const [r, m, d] = data.split("-").map(Number);
    return [DNI_TYZH[new Date(r, m - 1, d).getDay()], String(d), MISYATSI[m - 1], String(r)];
}

// Показує один з трьох екранів: список, вибір дати або редактор
function pokazatyEkran(ek) {
    document.getElementById("vyd-spysok").hidden = ek !== "spysok";
    document.getElementById("data-panel").hidden = ek !== "data";
    document.getElementById("redaktor").hidden = ek !== "redaktor";
}

function pokazatyMinuli() {
    const kont = document.getElementById("minuli-dni");
    kont.innerHTML = "";
    const keys = Object.keys(dni).sort().reverse();
    if (keys.length === 0) {
        kont.textContent = "Поки що порожньо.";
        return;
    }
    keys.forEach(function (data) {
        const b = document.createElement("button");
        b.className = "den-knopka";
        chastyDaty(data).forEach(function (t) {
            const sp = document.createElement("span");
            sp.textContent = t;
            b.appendChild(sp);
        });
        b.addEventListener("click", () => vidkrytyZbereghenyDen(data));
        kont.appendChild(b);
    });
}

// Кнопки на екрані списку і вибору дати
document.getElementById("novyy-den").addEventListener("click", function () {
    document.getElementById("novyj-data").value = sohodni();
    pokazatyEkran("data");
});

document.getElementById("novyj-start").addEventListener("click", function () {
    const d = document.getElementById("novyj-data").value;
    if (!d) return;
    pochatyNovyjDen(d);
});

document.getElementById("novyj-nazad").addEventListener("click", function () {
    pokazatyEkran("spysok");
});
pokazatyMinuli();