// Variabili 
let data;
let rivers = [];
let maxLength = 0;
let maxDischarge = 0;
let continents = [];

// id fiume sotto il mouse
let hoveredId = null;

// Margini grafico
let leftMargin = 60;
let rightMargin = 60;
let topMargin = 135;
let bottomMargin = 40;

// Valori calcolati in setup(), servono a draw() e a legende
let maxKmAxis = 0;
let chartWidth = 0;
let rowHeight = 0;
let minThickness = 0;
let maxThickness = 0;

// colori
let colorScale = {
  'Africa': '#00B4D8',
  'Asia': '#03045E',
  'Europe': '#4361EE',
  'North America': '#005F73',
  'South America': '#00BFA5',
  'Australia': '#4895EF',
  'Oceania': '#3A0CA3'
};

// setup() attende il caricamento degli asset
async function setup() {
  createCanvas(windowWidth, windowHeight);

  // loadTable(percorso, separatore, opzioni), header usa la prima riga come nomi delle colonne.
  data = await loadTable("assets/rivers-data.csv", ",", "header");

  // Ogni riga del CSV diventa un oggetto nell'array rivers.
  // ciclo trova i valori massimi e raccoglie i continenti per la legenda.
  for (let i = 0; i < data.getRowCount(); i++) {
    let name = data.getString(i, "name");

    // pulizia di nomi ripetuti nel csv 
    let alreadyIn = false;
    for (let j = 0; j < rivers.length; j++) {
      if (rivers[j].name == name) {
        alreadyIn = true;
      }
    }

    if (alreadyIn == false) {
      let river = {
        id: data.getString(i, "id"),
        name: name,
        length: data.getNum(i, "length"),
        discharge: data.getNum(i, "discharge"),
        continent: data.getString(i, "continent")
      };
      rivers.push(river);

      if (river.length > maxLength) {
        maxLength = river.length;
      }
      if (river.discharge > maxDischarge) {
        maxDischarge = river.discharge;
      }

      // controllo per i continenti ripetuti x legenda
      let continentIn = false;
      for (let j = 0; j < continents.length; j++) {
        if (continents[j] == river.continent) {
          continentIn = true;
        }
      }
      if (continentIn == false) {
        continents.push(river.continent);
      }
    }
  }

  // ordina i fiumi da più lungo a più corto
  rivers.sort((a, b) => b.length - a.length);

  // massimo dell'asse dipende da dati
  maxKmAxis = ceil(maxLength / 1000) * 1000;

  // larghezza del grafico e altezza di ogni riga (una riga per fiume)
  chartWidth = width - leftMargin - rightMargin;
  rowHeight = (height - topMargin - bottomMargin) / rivers.length;

  // spessore delle linee dipende da altezza della riga (linee vicine non si toccano)
  minThickness = rowHeight * 0.25;
  maxThickness = rowHeight * 0.6;
}

// trasforma la portata in spessore linea. x fiumi e x legenda
// sqrt() riduce la distanza tra i valori, la portata va da 101 a 209000
function thicknessFor(discharge) {
  return map(sqrt(discharge), 0, sqrt(maxDischarge), minThickness, maxThickness);
}

function draw() {

  background(243, 233, 207);

  drawKilometerScale();
  drawTitle();
  drawHeaderAndLegend();

  // n della riga sotto il mouse (-1 = nessuna)
  let hoveredRow = -1;

  // ES 04: riparte da "nessun fiume sotto il mouse" a ogni fotogramma
  hoveredId = null;

  // Ogni fiume è linea ondulata.
  for (let i = 0; i < rivers.length; i++) {
    let continent = rivers[i].continent;
    let riverLength = rivers[i].length;
    let thickness = thicknessFor(rivers[i].discharge);

    let y = topMargin + i * rowHeight + rowHeight / 2;

    // map() trasforma la lunghezza in km in larghezza sul canvas
    let scaledLength = map(riverLength, 0, maxKmAxis, 0, chartWidth);

    // Se il puntatore si trova dentro questa riga; la linea si ispessisce
    if (
      mouseX >= leftMargin - 10 &&
      mouseX <= leftMargin + scaledLength + 15 &&
      mouseY >= y - rowHeight / 2 &&
      mouseY <= y + rowHeight / 2
    ) {
      hoveredRow = i;
      hoveredId = rivers[i].id;
      thickness += 2;
    }

    // linea ondulata con vertice ogni 2 pixel, spostato in alto o in basso da sin()
    stroke(colorScale[continent]);
    strokeWeight(thickness);
    noFill();
    beginShape();
    for (let px = leftMargin; px <= leftMargin + scaledLength; px += 2) {
      vertex(px, y + sin(px * 0.08 + i * 0.4) * rowHeight * 0.15);
    }
    endShape();

    // Punto di partenza (la sorgente) a sinistra
    noStroke();
    fill(colorScale[continent]);
    circle(leftMargin, y, thickness);
  }

  // scheda per ultima, sta sopra le linee.
  if (hoveredRow >= 0) {
    drawTooltip(hoveredRow);
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

// Barchetta: scafo (quad), albero (line) e vela (triangle).
// (x, y) è centro del bordo sup; size ingrandisce barchetta.
function drawBoat(x, y, size) {
  stroke(120, 85, 55);
  strokeWeight(1);

  fill(160, 115, 70);
  quad(x - 8 * size, y, x + 8 * size, y, x + 5 * size, y + 5 * size, x - 5 * size, y + 5 * size);

  line(x, y, x, y - 13 * size);

  fill(255, 252, 242);
  triangle(x, y - 13 * size, x, y - 2 * size, x + 8 * size, y - 2 * size);
}

// asse in alto come guida verticale e barchetta ogni 1000 km.
// km si leggono con mouse sulla barchetta.
function drawKilometerScale() {
  //  scafo finisce 3 pixel sopra topMargin
  let boatY = topMargin - 8;

  for (let km = 0; km <= maxKmAxis; km += 1000) {
    let x = leftMargin + map(km, 0, maxKmAxis, 0, chartWidth);

    // guida parte da fondo scafo
    stroke(220, 205, 170);
    strokeWeight(1);
    line(x, topMargin - 3, x, height - bottomMargin);

    if (mouseX >= x - 10 && mouseX <= x + 10 && mouseY >= boatY - 15 && mouseY <= boatY + 7) {
      // Barchetta un po' più grande, con km a sinistra se siamo vicini al bordo destro
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

  // Linea asse 0 (sorgente dei fiumi)
  stroke(190, 170, 130);
  strokeWeight(1.5);
  line(leftMargin, topMargin - 3, leftMargin, height - bottomMargin);
}

// Titolo grande
// Occupa ultime 3 colonne asse (da 4000 a 7000 km); 
function drawTitle() {
  textStyle(BOLD);
  textSize(100);
  let titleSize = 100 * (chartWidth * 3 / 7) / textWidth("RIVERS");

  noStroke();
  fill(229, 214, 177);
  textSize(titleSize);
  textAlign(RIGHT, BASELINE);
  text("RIVERS", leftMargin + chartWidth, height - bottomMargin - 8);
  textStyle(NORMAL);
}

// Sottotitolo e legende
function drawHeaderAndLegend() {
  noStroke();
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  fill(85, 100, 105);
  textSize(11);
  text(rivers.length + " fiumi del dataset, ordinati per lunghezza. Clicca su un fiume per vederne il dettaglio", leftMargin, 46);

  //  legende corpo 
  textSize(10);

  // Legenda continenti: 
  let legendX = leftMargin;
  textAlign(LEFT, CENTER);
  for (let continent of continents) {
    stroke(colorScale[continent]);
    strokeWeight(3);
    line(legendX, 70, legendX + 14, 70);
    noStroke();
    fill(colorScale[continent]);
    circle(legendX + 14, 70, 5);
    fill(50, 60, 70);
    text(continent, legendX + 22, 70);
    legendX += textWidth(continent) + 42;
  }

  // Legenda spessore: tre linee con stessa funzione dei fiumi
  let title = "Spessore = portata d'acqua in m³/s:";
  legendX = leftMargin;
  fill(50, 60, 70);
  text(title, legendX, 90);
  legendX += textWidth(title) + 14;

  let refValues = [1000, 10000, 100000];
  for (let i = 0; i < refValues.length; i++) {
    let label = refValues[i] + "";
    stroke(60, 80, 90);
    strokeWeight(thicknessFor(refValues[i]));
    line(legendX, 90, legendX + 30, 90);
    noStroke();
    fill(50, 60, 70);
    text(label, legendX + 36, 90);
    legendX += 36 + textWidth(label) + 22;
  }

  // Legenda barchette
  legendX += 14;
  drawBoat(legendX + 8, 94, 0.8);
  noStroke();
  fill(50, 60, 70);
  text("Passa il mouse sulle barchette per leggere i chilometri", legendX + 26, 90);
}

// Scheda che legge dati della riga sotto il puntatore
function drawTooltip(row) {
  let river = rivers[row];
  let title = "#" + (row + 1) + " " + river.name;

  // scheda si allarga se nome fiume è lungo
  textStyle(BOLD);
  textSize(12);
  let boxW = max(245, textWidth(title) + 28);
  let boxH = 86;
  let boxX = mouseX + 15;
  let boxY = mouseY - 42;

  // scheda non esce dalla finestra
  if (boxX + boxW > width) {
    boxX = mouseX - boxW - 15;
  }
  if (boxY + boxH > height) {
    boxY = height - boxH;
  }

  // Sfondo con bordo del colore del continente
  fill(224, 200, 150);
  stroke(colorScale[river.continent]);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 6);

  noStroke();
  fill(60, 45, 25);
  textAlign(LEFT, TOP);
  text(title, boxX + 14, boxY + 11);

  textStyle(NORMAL);
  textSize(11);
  fill(100, 85, 60);
  text("Continente: " + river.continent, boxX + 14, boxY + 31);
  text("Lunghezza: " + river.length + " km", boxX + 14, boxY + 47);
  text("Portata d'acqua: " + river.discharge + " m³/s", boxX + 14, boxY + 63);
}
// al click si apre la pagina di dettaglio del fiume
function mousePressed() {

  // se il mouse non è su nessun fiume non succede nulla
  if (hoveredId != null) {

    // costruisce il nuovo URL
    let newURL = "detail.html?river=" + hoveredId;

    console.log(newURL);

    // Apre la pagina nella stessa scheda
    window.location.href = newURL;
  }
}
