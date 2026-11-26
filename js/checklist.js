// ===== Чекліст =====
const spysok = document.getElementById("chek-list");
let zavdannya = JSON.parse(localStorage.getItem("chekliest")) || [];

function zberehty() {
    localStorage.setItem("chekliest", JSON.stringify(zavdannya));
    hmaraZberehty({ chekliest: JSON.stringify(zavdannya) });
}

function pokazaty() {
    spysok.innerHTML = "";
    zavdannya.forEach(function (z, i) {
        const li = document.createElement("li");
        if (z.zrobleno) li.classList.add("done");

        const galochka = document.createElement("input");
        galochka.type = "checkbox";
        galochka.checked = z.zrobleno;
        galochka.addEventListener("change", function () {
            zavdannya[i].zrobleno = galochka.checked;
            zberehty();
            pokazaty();
        });

        const tekst = document.createElement("span");
        tekst.textContent = " " + z.tekst + " ";

        const vydalyty = document.createElement("button");
        vydalyty.className = "hrestyk";
        vydalyty.textContent = "×";
        vydalyty.addEventListener("click", function () {
            zavdannya.splice(i, 1);
            zberehty();
            pokazaty();
        });

        li.appendChild(galochka);
        li.appendChild(tekst);
        li.appendChild(vydalyty);
        spysok.appendChild(li);
    });
}
pokazaty();