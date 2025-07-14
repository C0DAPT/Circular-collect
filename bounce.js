// Canvas & DOM setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const lives = document.getElementById("lives");
const score = document.getElementById("score");
const reload = document.querySelector(".reloadBtn");

const lights = document.querySelectorAll(".light");
const bulbs = document.querySelectorAll(".bulb");
const bars = document.querySelectorAll(".bar");

// Game settings
const centerx = canvas.width / 2;
const centery = 200;
const radius = 180;
const ballradius = 10;
const colors = ["#70e0ff", "#b388eb", "#f7b801", "#ff5e5b"];

// State variables
let num = 20;
let rotation = 0;
let isDragging = false;
let lastAngle = 0;

let arcArray = [];
let ballArray = [];
let particleArray = [];
let floatingParticles = [];

let currentnum = 0;
let previousnum = 0;
let points = 0;
let live = 6;
let time = 0;
let rate = 5;
let previoustime = 0;

// Utility functions
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

// Arc class (draws segments of a circle)
class Arc {
  constructor(index, color = "white") {
    this.index = index;
    this.color = color;
    this.used = false;
  }

  draw() {
    const angleSize = (Math.PI * 2) / num;
    const start = this.index * angleSize + rotation;
    const end = start + angleSize;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.color === "white" ? 1 : 15;
    ctx.beginPath();
    ctx.arc(centerx, centery, radius, start, end);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }
}

// Ball class (falls and interacts with arcs)
class Ball {
  constructor(x, y, color, arc) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.arc = arc;
    this.dx = randomNum(0, 5);
    this.dy = 1;
    this.gravity = 0.1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, ballradius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    const d = distance(this.x, this.y, centerx, centery) + ballradius;
    this.dy += this.gravity;
    this.y += this.dy;
    this.x += this.dx;

    // Bounce logic when ball is too far from center
    if (d >= radius - 3) {
      if (this.y > centery) this.dy = -randomNum(5, 10);
      else this.dy = randomNum(1, 3);

      if (this.x > centerx) this.dx = -randomNum(1, 3);
      else this.dx = randomNum(1, 3);

      currentnum += 1;
      if (Math.abs(currentnum - previousnum) > 15) {
        live -= 1;
        bars[live].style.background = "transparent";
        previousnum = currentnum;
      }
    }

    // Collision with matching arc
    if (this.arc) {
      const angleSize = (Math.PI * 2) / num;
      const arcAngle = angleSize * this.arc.index + angleSize / 2 + rotation;
      const arcX = centerx + radius * Math.cos(arcAngle);
      const arcY = centery + radius * Math.sin(arcAngle);
      const arcWidth = angleSize * 110;

      if (
        this.x >= arcX - arcWidth &&
        this.x <= arcX + arcWidth &&
        this.y >= arcY - 16 &&
        this.y <= arcY + 16
      ) {
        // Hit success
        ballArray = ballArray.filter(b => b !== this);
        this.arc.color = "white";
        this.arc.used = false;
        this.arc = null;

        points += 1;
        score.innerHTML = points;

        // Update one background particle color
        for (let i = 0; i < particleArray.length; i++) {
          if (particleArray[i].color === "white") {
            particleArray[i].color = this.color;
            particleArray[i].radius = randomNum(4,6);
            break;
          }
        }

        flashLightsAndBulbs(this.color);

        // Particle burst effect
        for (let i = 0; i < 15; i++) {
          floatingParticles.push(new FloatingParticle(this.x, this.y, this.color));
        }

        // Win condition and difficulty increase
      
        if (points === 20) {
          alert("yay you win lets try to be faster");
          rate -= 2;
          num += 10;
          recreateArcs();
        }
      }
    }

    this.draw();
  }
}

// Floating particles after match
class FloatingParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = randomNum(1, 3);
    this.dx = (Math.random() - 0.5) * 3;
    this.dy = (Math.random() - 0.5) * 3;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= 0.02;
    this.draw();
  }
}

// Background hovering particles
class BackgroundParticle {
  constructor(x, y, color) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.radius = randomNum(1, 3);
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.01 + Math.random() * 0.01;
    this.distance = 10 + Math.random() * 10;
    this.origin = { x, y };
  }

  update() {
    this.angle += this.speed;
    this.x = this.origin.x + Math.cos(this.angle) * this.distance;
    this.y = this.origin.y + Math.sin(this.angle) * this.distance;
    this.draw();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// Create initial arcs
function recreateArcs() {
  arcArray = [];
  for (let i = 0; i < num; i++) {
    arcArray.push(new Arc(i));
  }
}
recreateArcs();

// Create background particles (non-overlapping)
function setupParticles() {
  particleArray = [];
  for (let i = 0; i < 20; i++) {
    let tries = 0;
    let placed = false;
    while (!placed && tries < 100) {
      const x = centerx + randomNum(-100, 100);
      const y = centery + randomNum(200, 270);
      let overlap = false;
      for (let j = 0; j < particleArray.length; j++) {
        if (distance(x, y, particleArray[j].x, particleArray[j].y) < 15) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        particleArray.push(new BackgroundParticle(x, y, "white"));
        placed = true;
      }
      tries++;
    }
  }
}
setupParticles();

// Spawn falling ball
function spawn() {
  time += 1;
  if ((time - previoustime) >= rate) {
    const availableArcs = arcArray.filter(arc => !arc.used);
    if (availableArcs.length === 0) return;

    const arc = availableArcs[randomNum(0, availableArcs.length)];
    const color = colors[randomNum(0, colors.length)];

    arc.color = color;
    arc.used = true;

    const x = randomNum(centerx - 50, centerx + 50);
    const y = randomNum(105, 115);

    ballArray.push(new Ball(x, y, color, arc));
    previoustime = time;
  }
}
let interval = setInterval(spawn, 1000);

// Rotation controls
canvas.addEventListener("mousedown", e => {
  isDragging = true;
  lastAngle = getAngle(e.clientX, e.clientY);
});
canvas.addEventListener("mousemove", e => {
  if (isDragging) {
    const angle = getAngle(e.clientX, e.clientY);
    rotation += angle - lastAngle;
    lastAngle = angle;
  }
});
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

function getAngle(x, y) {
  const rect = canvas.getBoundingClientRect();
  const dx = x - (rect.left + centerx);
  const dy = y - (rect.top + centery);
  return Math.atan2(dy, dx);
}

// Flash lights and bulbs
function flashLightsAndBulbs(color, duration = 200) {
  const originalShadows = [
    "200px 0px 100px rgba(255, 255, 255, 0.8)",
    "-80px 0px 100px rgba(255, 255, 255, 0.8)"
  ];
  const originalBulb = "rgb(228, 228, 227)";

  lights[0].style.boxShadow = `200px 0px 100px ${color}`;
  lights[1].style.boxShadow = `-80px 0px 100px ${color}`;
  bulbs.forEach(b => b.style.background = color);

  setTimeout(() => {
    lights[0].style.boxShadow = originalShadows[0];
    lights[1].style.boxShadow = originalShadows[1];
    bulbs.forEach(b => b.style.background = originalBulb);
  }, duration);
}

// Main animation loop
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.rect(centerx - 300, centery + 220, 600, 2);
  ctx.fillStyle = "black";
  ctx.fill();

  particleArray.forEach(p => p.update());
  arcArray.forEach(a => a.draw());
  ballArray.forEach(b => b.update());
  floatingParticles = floatingParticles.filter(p => p.alpha > 0);
  floatingParticles.forEach(p => p.update());

  lives.innerHTML = live;

  if (live <= 0) {
    clearInterval(interval);
    reload.classList.add("show");
    alert("Game Over! Your score: " + points);
    return;
  }

  requestAnimationFrame(drawAll);
}
drawAll();

// Reset game state
reload.addEventListener("click", () => {
  points = 0;
  live = 6;
  rotation = 0;
  currentnum = 0;
  previousnum = 0;
  time = 0;
  previoustime = 0;

  arcArray = [];
  ballArray = [];
  floatingParticles = [];

  recreateArcs();
  setupParticles();

  bars.forEach(bar => bar.style.background = "orange");
  score.innerHTML = points;
  lives.innerHTML = live;

  clearInterval(interval);
  interval = setInterval(spawn, 1000);

  reload.classList.remove("show");
  drawAll();
});
