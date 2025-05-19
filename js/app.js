const coinData = {
  "bitcoin": { name: "Bitcoin", id: "bitcoin" },
  "ripple": { name: "XRP", id: "ripple" },
  "ethereum": { name: "Ethereum", id: "ethereum" },
  "cardano": { name: "Cardano", id: "cardano" },
  "solana": { name: "Solana", id: "solana" },
  "livepeer": { name: "Livepeer", id: "livepeer" },
};

const fallbackPrices = {
  bitcoin: 67000,
  ripple: 0.48,
  ethereum: 3000,
  cardano: 0.5,
  solana: 140,
  livepeer: 18,
};

let livePrices = {};

async function fetchLivePrices() {
  try {
    const ids = Object.values(coinData).map(c => c.id).join(",");
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
    const data = await res.json();
    for (const key in coinData) {
      const id = coinData[key].id;
      livePrices[key] = data[id]?.eur ?? fallbackPrices[key];
    }
  } catch {
    livePrices = { ...fallbackPrices };
  }
}

function populateSelects() {
  const selects = [document.getElementById("blox-coin"), document.getElementById("bitvavo-coin")];
  selects.forEach(select => {
    select.innerHTML = "";
    for (const key in coinData) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = coinData[key].name;
      select.appendChild(option);
    }
  });
}

function loadData() {
  return JSON.parse(localStorage.getItem("cryptoData") || "{}");
}

function saveData(data) {
  localStorage.setItem("cryptoData", JSON.stringify(data));
}

function render() {
  const data = loadData();
  ["blox", "bitvavo"].forEach(section => {
    const container = document.getElementById(`${section}-entries`);
    const summary = document.getElementById(`${section}-summary`);
    container.innerHTML = "";
    let totalCurrent = 0;
    let totalPaid = 0;

    (data[section] || []).forEach(entry => {
      const currentPrice = livePrices[entry.coin];
      const currentValue = entry.amount * currentPrice;
      const paid = entry.amount * entry.priceEach;
      const diff = currentValue - paid;

      totalCurrent += currentValue;
      totalPaid += paid;

      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <strong>${coinData[entry.coin].name}</strong><br/>
        Hoeveelheid: ${entry.amount}<br/>
        Prijs per munt bij aankoop: €${entry.priceEach}<br/>
        Betaald totaal: €${paid.toFixed(2)}<br/>
        Huidige waarde: €${currentValue.toFixed(2)}<br/>
        Winst/verlies: <strong style="color:${diff >= 0 ? 'lime' : 'red'}">€${diff.toFixed(2)}</strong>
      `;
      container.appendChild(div);
    });

    const totalDiff = totalCurrent - totalPaid;
    summary.innerHTML = `
      <hr/>
      <strong>Totaal betaald: €${totalPaid.toFixed(2)}</strong><br/>
      <strong>Huidige waarde: €${totalCurrent.toFixed(2)}</strong><br/>
      <strong>Winst/verlies: <span style="color:${totalDiff >= 0 ? 'lime' : 'red'}">€${totalDiff.toFixed(2)}</span></strong>
    `;
  });
}

function handleForm(section) {
  const form = document.getElementById(`${section}-form`);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const coin = form.querySelector("select").value;
    const amount = parseFloat(form.querySelector("input[type=number]:nth-of-type(1)").value);
    const priceEach = parseFloat(form.querySelector("input[type=number]:nth-of-type(2)").value);

    if (isNaN(amount) || isNaN(priceEach)) {
      alert("Ongeldige invoer.");
      return;
    }

    const data = loadData();
    if (!data[section]) data[section] = [];
    data[section].push({ coin, amount, priceEach });
    saveData(data);
    form.reset();
    render();
  });
}

async function init() {
  await fetchLivePrices();
  populateSelects();
  handleForm("blox");
  handleForm("bitvavo");
  render();
}

init();
