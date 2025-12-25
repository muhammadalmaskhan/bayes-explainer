document.addEventListener("DOMContentLoaded", () => {

  /* ========= DATA ========= */
  const slider = document.getElementById("numTosses");
  const valueLabel = document.getElementById("numTossesValue");
  const container = document.getElementById("coinContainer");
  const regenerateBtn = document.getElementById("regenerate");
  const headsLabel = document.getElementById("headsCount");
  const tailsLabel = document.getElementById("tailsCount");

  let data = [];

  function generateData(n) {
    data = Array.from({ length: n }, () => Math.random() < 0.5 ? 1 : 0);
    renderData();
  }

  function renderData() {
    container.innerHTML = "";
    let heads = 0;

    data.forEach(d => {
      const coin = document.createElement("div");
      coin.className = `coin ${d ? "heads" : "tails"}`;
      coin.textContent = d ? "H" : "T";
      if (d) heads++;
      container.appendChild(coin);
    });

    headsLabel.textContent = heads;
    tailsLabel.textContent = data.length - heads;

    drawLikelihood();
    drawPosterior();
    drawOverlay();
  }

  slider.oninput = () => {
    valueLabel.textContent = slider.value;
    generateData(+slider.value);
  };
  regenerateBtn.onclick = () => generateData(+slider.value);

  /* ========= PRIOR ========= */
  const alphaSlider = document.getElementById("alpha");
  const betaSlider = document.getElementById("beta");
  const alphaVal = document.getElementById("alphaVal");
  const betaVal = document.getElementById("betaVal");
  const priorCanvas = document.getElementById("priorCanvas");
  const priorCtx = priorCanvas.getContext("2d");

  function betaShape(x, a, b) {
    return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
  }

  function drawPrior() {
    priorCtx.clearRect(0, 0, priorCanvas.width, priorCanvas.height);
    const a = +alphaSlider.value;
    const b = +betaSlider.value;
    alphaVal.textContent = a;
    betaVal.textContent = b;

    const vals = Array.from({ length: 201 }, (_, i) =>
      betaShape(i / 200, a, b)
    );
    const maxY = Math.max(...vals);

    priorCtx.beginPath();
    vals.forEach((y, i) => {
      const x = (i / 200) * priorCanvas.width;
      const py = priorCanvas.height - (y / maxY) * priorCanvas.height * 0.85;
      i === 0 ? priorCtx.moveTo(x, py) : priorCtx.lineTo(x, py);
    });
    priorCtx.strokeStyle = "#3f51b5";
    priorCtx.lineWidth = 2;
    priorCtx.stroke();

    drawPosterior();
    drawOverlay();
  }

  alphaSlider.oninput = betaSlider.oninput = drawPrior;

  /* ========= LIKELIHOOD ========= */
  const likelihoodCanvas = document.getElementById("likelihoodCanvas");
  const lctx = likelihoodCanvas.getContext("2d");

  function drawLikelihood() {
    lctx.clearRect(0, 0, likelihoodCanvas.width, likelihoodCanvas.height);
    const heads = data.reduce((a, b) => a + b, 0);
    const tails = data.length - heads;

    const vals = Array.from({ length: 201 }, (_, i) =>
      Math.pow(i / 200, heads) * Math.pow(1 - i / 200, tails)
    );
    const maxY = Math.max(...vals);

    lctx.beginPath();
    vals.forEach((y, i) => {
      const x = (i / 200) * likelihoodCanvas.width;
      const py = likelihoodCanvas.height - (y / maxY) * likelihoodCanvas.height * 0.85;
      i === 0 ? lctx.moveTo(x, py) : lctx.lineTo(x, py);
    });
    lctx.strokeStyle = "#e91e63";
    lctx.lineWidth = 2;
    lctx.stroke();
  }

  /* ========= POSTERIOR ========= */
  const posteriorCanvas = document.getElementById("posteriorCanvas");
  const postCtx = posteriorCanvas.getContext("2d");

  function drawPosterior() {
    postCtx.clearRect(0, 0, posteriorCanvas.width, posteriorCanvas.height);

    const heads = data.reduce((a, b) => a + b, 0);
    const tails = data.length - heads;
    const a = +alphaSlider.value;
    const b = +betaSlider.value;

    const vals = Array.from({ length: 201 }, (_, i) => {
      const p = i / 200;
      return betaShape(p, a, b) *
             Math.pow(p, heads) *
             Math.pow(1 - p, tails);
    });

    const maxY = Math.max(...vals);

    postCtx.beginPath();
    vals.forEach((y, i) => {
      const x = (i / 200) * posteriorCanvas.width;
      const py = posteriorCanvas.height - (y / maxY) * posteriorCanvas.height * 0.85;
      i === 0 ? postCtx.moveTo(x, py) : postCtx.lineTo(x, py);
    });
    postCtx.strokeStyle = "#009688";
    postCtx.lineWidth = 2;
    postCtx.stroke();
  }

  /* ========= OVERLAY ========= */
  const overlayCanvas = document.getElementById("overlayCanvas");
  const octx = overlayCanvas.getContext("2d");

  function drawOverlay() {
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const heads = data.reduce((a, b) => a + b, 0);
    const tails = data.length - heads;
    const a = +alphaSlider.value;
    const b = +betaSlider.value;

    const prior = [], like = [], post = [];
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      const pr = betaShape(p, a, b);
      const lk = Math.pow(p, heads) * Math.pow(1 - p, tails);
      prior.push(pr);
      like.push(lk);
      post.push(pr * lk);
    }

    const maxY = Math.max(...post);

    function draw(vals, color, width, alpha) {
      octx.beginPath();
      vals.forEach((y, i) => {
        const x = (i / 200) * overlayCanvas.width;
        const py = overlayCanvas.height - (y / maxY) * overlayCanvas.height * 0.85;
        i === 0 ? octx.moveTo(x, py) : octx.lineTo(x, py);
      });
      octx.globalAlpha = alpha;
      octx.strokeStyle = color;
      octx.lineWidth = width;
      octx.stroke();
      octx.globalAlpha = 1;
    }

    draw(prior, "#3f51b5", 2, 0.4);
    draw(like, "#e91e63", 2, 0.4);
    draw(post, "#009688", 3, 1);

    // MAP line
    const mapIndex = post.indexOf(Math.max(...post));
    const mapP = mapIndex / 200;
    octx.beginPath();
    octx.moveTo(mapP * overlayCanvas.width, 0);
    octx.lineTo(mapP * overlayCanvas.width, overlayCanvas.height);
    octx.setLineDash([6, 4]);
    octx.strokeStyle = "#333";
    octx.stroke();
    octx.setLineDash([]);
  }

  /* ========= INIT ========= */
  valueLabel.textContent = slider.value;
  generateData(+slider.value);
  drawPrior();
});
