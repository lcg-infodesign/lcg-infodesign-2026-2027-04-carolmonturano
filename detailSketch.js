// PAGINA DI DETTAGLIO

// dati del CSV
let data;

// id fiume selezionato
let selectedRiverId;

let maxLength = 0;
let maxDischarge = 0;

// Margini 
let leftMargin = 60;
let rightMargin = 60;

// posizioni verticali 
let scaleTop = 290;
let scaleBottom = 0;
let riverY = 0;

// Valori in setup
let maxKmAxis = 0;
let chartWidth = 0;

// spessore fisso 
let minThickness = 6;
let maxThickness = 30;

// colori foce
let seaColor = '#9FD3EC';    // mare o oceano
let lakeColor = '#B5DDB0';   // lago
let riverColor = '#8E9FE0';  // altro fiume

// continente x colore 
let colorScale = {
  'Africa': '#00B4D8',
  'Asia': '#03045E',
  'Europe': '#4361EE',
  'North America': '#005F73',
  'South America': '#00BFA5',
  'Australia': '#4895EF',
  'Oceania': '#3A0CA3'
};

async function setup() {
  createCanvas(windowWidth, windowHeight);

  
  data = await loadTable("assets/rivers-data.csv", ",", "header");

  // x parametri passati nell'URL 
  let params = getURLParams();

  //id del fiume selezionato
  selectedRiverId = params.river;

  // ciclo per trovare i massimi 
  for (let i = 0; i < data.getRowCount(); i++) {
    let length = data.getNum(i, "length");
    let discharge = data.getNum(i, "discharge");

    if (length > maxLength) {
      maxLength = length;
    }
    if (discharge > maxDischarge) {
      maxDischarge = discharge;
    }
  }

  // massimo dell'asse dipende da dati 
  maxKmAxis = ceil(maxLength / 1000) * 1000;
  chartWidth = width - leftMargin - rightMargin;

  // fiume a metà dello spazio libero
  scaleBottom = height - 40;
  riverY = (scaleTop + scaleBottom) / 2;
}

// trasforma portata in spessore linea 
function thicknessFor(discharge) {
  return map(sqrt(discharge), 0, sqrt(maxDischarge), minThickness, maxThickness);
}

// altezza onda in un punto x 
function waveY(x) {
  return riverY + sin(x * 0.08) * 8;
}

function draw() {
  background(243, 233, 207);

  drawBackLink();


  let riverRow = data.findRow(selectedRiverId, "id");

  if (riverRow) {
    // legge parametri fiume: get() testo, float() trasforma in numero
    let name = riverRow.get("name");
    let continent = riverRow.get("continent");
    let countries = riverRow.get("countries");
    let outflow = riverRow.get("outflow");
    let riverLength = float(riverRow.get("length"));
    let discharge = float(riverRow.get("discharge"));
    let tributaries = float(riverRow.get("tributaries"));

    let thickness = thicknessFor(discharge);

    // map() trasforma lunghezza in km in larghezza su canvas
    let scaledLength = map(riverLength, 0, maxKmAxis, 0, chartWidth);

    // lunghezza rametti
    let branchLength = thickness / 2 + 20;

    drawHeader(name, continent, countries);
    drawLegend();
    drawKilometerScale();

    // ordine
    drawMouth(outflow, scaledLength, thickness);
    drawTributaries(tributaries, scaledLength, branchLength, continent);
    drawRiver(scaledLength, thickness, continent);

    
    let hoveredLabel = "";
    let hovered = false;
    let mouthX = leftMargin + scaledLength;

    if (mouseX >= mouthX - 15 && mouseX <= mouthX + 20 &&
        mouseY >= riverY - 25 && mouseY <= riverY + 25) {
      // mouse sulla foce
      hoveredLabel = "Foce: " + outflow;
      hovered = true;
    } else if (mouseX >= leftMargin && mouseX <= mouthX &&
               mouseY >= riverY - thickness / 2 - 28 && mouseY < riverY - thickness / 2 - 8) {
      // mouse sui rametti 
      hoveredLabel = tributaries + " affluenti";
      hovered = true;
    } else if (mouseX >= leftMargin - 10 && mouseX <= mouthX &&
               mouseY >= riverY - thickness / 2 - 8 && mouseY <= riverY + thickness / 2 + 8) {
      // mouse sulla linea del fiume
      hoveredLabel = "Lunghezza: " + riverLength + " km, portata: " + discharge + " m³/s";
      hovered = true;
    }

    // Mostra testo vicino a puntatore solo quando è sopra una parte del glifo
    if (hovered) {
      drawLabel(hoveredLabel, continent);
    }
  } else {
    
    // se l'id nell'URL non esiste
    noStroke();
    fill(60, 45, 25);
    textAlign(LEFT, TOP);
    textSize(16);
    text("Fiume non trovato", leftMargin, 60);
  }
}

// GLIFO fiume
function drawRiver(scaledLength, thickness, continent) {
  // linea ondulata, vertice ogni 2 pixel, spostato da sin()
  stroke(colorScale[continent]);
  strokeWeight(thickness);
  noFill();
  beginShape();
  for (let px = leftMargin; px <= leftMargin + scaledLength; px += 2) {
    vertex(px, waveY(px));
  }
  endShape();

  // Punto di partenza 
  noStroke();
  fill(colorScale[continent]);
  circle(leftMargin, waveY(leftMargin), thickness);
}

// GLIFO affluenti, un rametto ogni 10 affluenti
function drawTributaries(tributaries, scaledLength, branchLength, continent) {
  let numRametti = tributaries / 10;

  // distanza tra rametti
  let step = scaledLength / (numRametti + 1);

  let posX = leftMargin + step;

  stroke(colorScale[continent]);
  strokeWeight(2);
  noFill();
  for (let i = 0; i < numRametti; i++) {
    let posY = waveY(posX);

    // rametto ondulato
    beginShape();
    for (let py = posY; py >= posY - branchLength; py -= 2) {
      vertex(posX + sin(py * 0.25) * 2.5, py);
    }
    endShape();

    posX += step;
  }
}

// GLIFO 3: pallino foce
function drawMouth(outflow, scaledLength, thickness) {
  let x = leftMargin + scaledLength;
  let y = waveY(x);

  // colore di partenza
  let mouthColor = seaColor;

  // includes() controlla se in testo c'è una parola
  if (outflow.includes("River")) {
    mouthColor = riverColor;
  }
  if (outflow.includes("Lake")) {
    mouthColor = lakeColor;
  }

  noStroke();
  fill(mouthColor);
  circle(x, y, thickness + 26);
}

// Barchetta 
function drawBoat(x, y, size) {
  stroke(120, 85, 55);
  strokeWeight(1);

  fill(160, 115, 70);
  quad(x - 8 * size, y, x + 8 * size, y, x + 5 * size, y + 5 * size, x - 5 * size, y + 5 * size);

  line(x, y, x, y - 13 * size);

  fill(255, 252, 242);
  triangle(x, y - 13 * size, x, y - 2 * size, x + 8 * size, y - 2 * size);
}

// asse km 
function drawKilometerScale() {
  let boatY = scaleTop - 8;

  for (let km = 0; km <= maxKmAxis; km += 1000) {
    let x = leftMargin + map(km, 0, maxKmAxis, 0, chartWidth);

    stroke(220, 205, 170);
    strokeWeight(1);
    line(x, scaleTop - 3, x, scaleBottom);

    if (mouseX >= x - 10 && mouseX <= x + 10 && mouseY >= boatY - 15 && mouseY <= boatY + 7) {
      drawBoat(x, boatY, 1.25);

      noStroke();
      fill(60, 45, 25);
      textStyle(BOLD);
      textSize(11);
      if (x > width / 2) {
        textAlign(RIGHT, CENTER);
        text(km + " km", x - 16, boatY - 4);
      } else {
        textAlign(LEFT, CENTER);
        text(km + " km", x + 16, boatY - 4);
      }
      textStyle(NORMAL);
    } else {
      drawBoat(x, boatY, 1);
    }
  }
}

// Titolo (nome del fiume)
function drawHeader(name, continent, countries) {
  // titolo in grassetto; se nome è troppo lungo testo si rimpicciolisce
  noStroke();
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(36);
  if (textWidth(name) > chartWidth) {
    textSize(36 * chartWidth / textWidth(name));
  }
  fill(60, 45, 25);
  text(name, leftMargin, 40);

  // continente 
  textAlign(LEFT, CENTER);
  textSize(12);
  fill(colorScale[continent]);
  text(continent, leftMargin, 100);
  textStyle(NORMAL);

  fill(85, 100, 105);
  text("Paesi attraversati: " + countries, leftMargin, 120);
}

// Legende
function drawLegend() {
  textSize(10);
  textAlign(LEFT, CENTER);

  // Legenda spessore 
  let title = "Spessore = portata d'acqua in m³/s:";
  let legendX = leftMargin;
  noStroke();
  fill(50, 60, 70);
  text(title, legendX, 165);
  legendX += textWidth(title) + 14;

  let refValues = [1000, 10000, 100000];
  for (let i = 0; i < refValues.length; i++) {
    let label = refValues[i] + "";
    let t = thicknessFor(refValues[i]);
    stroke(60, 80, 90);
    strokeWeight(t);
    line(legendX, 165, legendX + 30, 165);
    noStroke();
    fill(50, 60, 70);
   
    text(label, legendX + 36 + t / 2, 165);
    legendX += 36 + t / 2 + textWidth(label) + 22;
  }

  // Legenda rametti
  legendX = leftMargin;
  stroke(60, 80, 90);
  strokeWeight(5);
  line(legendX, 195, legendX + 30, 195);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let py = 195; py >= 181; py -= 2) {
    vertex(legendX + 18 + sin(py * 0.25) * 2.5, py);
  }
  endShape();
  noStroke();
  fill(50, 60, 70);
  let label = "1 rametto = 10 affluenti";
  text(label, legendX + 40, 195);
  legendX += 40 + textWidth(label) + 40;

  // Legenda foce
  text("Foce:", legendX, 195);
  legendX += textWidth("Foce:") + 16;

  fill(seaColor);
  circle(legendX, 195, 16);
  fill(50, 60, 70);
  text("mare o oceano", legendX + 14, 195);
  legendX += 14 + textWidth("mare o oceano") + 22;

  fill(lakeColor);
  circle(legendX, 195, 16);
  fill(50, 60, 70);
  text("lago", legendX + 14, 195);
  legendX += 14 + textWidth("lago") + 22;

  fill(riverColor);
  circle(legendX, 195, 16);
  fill(50, 60, 70);
  text("altro fiume", legendX + 14, 195);

  // Legenda barchette e rollover
  legendX = leftMargin;
  drawBoat(legendX + 8, 229, 0.8);
  noStroke();
  fill(50, 60, 70);
  text("Lunghezza = km. Passa il mouse su barchette, linea, rametti e foce per leggere i dati", legendX + 26, 225);
}

// per tornare alla pagina d'insieme
function drawBackLink() {
  noStroke();
  fill(85, 100, 105);
  textAlign(LEFT, TOP);
  textSize(11);
  text("← torna alla panoramica", leftMargin, 14);
}

// torna a pagina d'insieme con click
function mousePressed() {
  if (mouseX >= leftMargin && mouseX <= leftMargin + 140 && mouseY >= 10 && mouseY <= 30) {
    window.location.href = "index.html";
  }
}

// Etichetta rollover 
function drawLabel(label, continent) {
  textSize(11);
  let boxW = textWidth(label) + 20;
  let boxX = mouseX + 15;
  let boxY = mouseY - 12;

  // etichetta non esce dalla finestra
  if (boxX + boxW > width) {
    boxX = mouseX - boxW - 15;
  }

  fill(224, 200, 150);
  stroke(colorScale[continent]);
  strokeWeight(2);
  rect(boxX, boxY, boxW, 24, 6);

  noStroke();
  fill(60, 45, 25);
  textAlign(LEFT, CENTER);
  text(label, boxX + 10, mouseY);
}
