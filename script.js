const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100;
const cellGap = 3;
let playerResources = 500;
let score = 0;
const baseDefenderCost = 100;
const baseDefenderHealth = 100;
const baseEnemyHealth = 100;
const baseEnemyReward = 10;
const baseScoreReward = 1;
let frame = 0;
let enemiesInterval = 600;
let gameOver = false;
let levelCompleted = false;
const gameGrid = [];
let defenders = [];
let enemies = [];
let projectiles = [];
let resources = [];
let winScore = 5;


const mouse = {
  x: null,
  y: null,
  width: 0.1,
  height: 0.1,
}

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', e => {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', e => {
  mouse.x = null;
  mouse.y = null;
});

canvas.addEventListener('click', e => {
  const xPos = mouse.x - (mouse.x % cellSize) + cellGap;
  const yPos = mouse.y - (mouse.y % cellSize) + cellGap;
  if (playerResources < baseDefenderCost) {
    return;
  }

  for (let defender of defenders) {
    if (xPos === defender.x && yPos === defender.y) {
      return;
    }
  }

  playerResources -= baseDefenderCost;
  defenders.push(new Defender(xPos, yPos));
});

// game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};

const drawControls = () => {
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);

  ctx.fillStyle = 'white';
  ctx.font = '20px Orbitron';
  ctx.fillText(`Resources: ${playerResources}`, 35, 35);

  ctx.fillStyle = 'white';
  ctx.font = '15px Orbitron';
  ctx.fillText(`Score: ${score}`, 35, 70);
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }

  draw = () => {
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

}

const createGameGrid = () => {
  for (let x = 0; x < canvas.width; x += cellSize) {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}

const handleGameGrid = () => {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

createGameGrid();
handleGameGrid();

// defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.cost = baseDefenderCost;
    this.health = baseDefenderHealth;
    this.shooting = false;
  }

  draw = () => {
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = 'gold';
    ctx.font = '25px Orbitron';
    ctx.fillText(`${Math.floor(this.health)}`, this.x + 25, this.y + 25);
  }


  update = () => {
    const isEnemyVisible = enemies.find(enemy => enemy.y === this.y);
    if (!isEnemyVisible) {
      clearInterval(this.shooting);
      this.shooting = false;
      return;
    }

    if (isEnemyVisible && this.shooting) {
      return;
    }

    if (isEnemyVisible && !this.shooting) {
      this.shooting = setInterval(() => {
        projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2));
      }, 1000)
    }
  }
}

const handleDefenders = () => {
  for (let defender of defenders) {
    defender.update();
    defender.draw();
    for (let enemy of enemies) {
      if (collision(defender, enemy)) {
        enemy.movement = 0;
        defender.health -= 0.2;
      }

      if (defender.health <= 0) {
        defenders = defenders.filter(d => d !== defender);
        enemy.movement = enemy.speed;
      }
    }
  }
}

// projectiles
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }

  update = () => {
    this.x += this.speed;
  }

  draw = () => {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}

const handleProjectiles = () => {
  for (let projectile of projectiles) {
    projectile.update();
    projectile.draw();

    if (projectile.x >= canvas.width - cellSize) {
      projectiles = projectiles.filter(p => p !== projectile);
    }

    for (let enemy of enemies) {
      if (collision(projectile, enemy)) {
        enemy.health -= projectile.power;
        projectiles = projectiles.filter(p => p !== projectile);
        if (enemy.health <= 0) {
          playerResources += enemy.reward;
          score += baseScoreReward;
          enemies = enemies.filter(e => e !== enemy);

          if (score >= winScore) {
            levelCompleted = true;
          }
        }
      }
    }
  }
}

// enemies
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = baseEnemyHealth;
    this.reward = baseEnemyReward;
  }

  move = () => {
    this.x -= this.movement;
  }

  draw = () => {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = 'gold';
    ctx.font = '25px Orbitron';
    ctx.fillText(`${Math.floor(this.health)}`, this.x + 25, this.y + 25);
  }
}

const handleEnemies = () => {
  if (frame % enemiesInterval === 0 && !levelCompleted) {
    const yPos = Math.floor(Math.random() * 5 + 1) * cellSize;;
    enemies.push(new Enemy(canvas.width, yPos + cellGap));
    if (enemiesInterval > 100) {
      enemiesInterval -= 50;
    }
  }

  for (let enemy of enemies) {
    enemy.move();
    enemy.draw();

    if (enemy.x <= 0) {
      gameOver = true;
    }
  }
}

// playerResources
class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = Math.floor((Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amounts = [20, 30, 40, 50];
    this.amount = this.amounts[Math.floor(Math.random() * this.amounts.length)];
  }

  draw = () => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = 'black';
    ctx.font = '15px Orbitron';
    ctx.fillText(`${this.amount}`, this.x + 25, this.y + 25);
  }
}

const handleResources = () => {
  if (frame % 500 === 0) {
    resources.push(new Resource());
  }

  for (let resource of resources) {
    resource.draw();

    if (collision(mouse, resource)) {
      playerResources += resource.amount;
      resources = resources.filter(r => r !== resource);
    }
  }
}

// utils
function collision(a, b) {
  if (
    !(a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y)
  ) {
    return true;
  }
}

const animate = () => {
  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = '50px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    return;
  }

  if (levelCompleted && enemies.length === 0) {
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '50px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETED', canvas.width / 2, canvas.height / 2);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawControls();

  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
  handleEnemies();

  frame++;
  requestAnimationFrame(animate);

}
animate();

window.addEventListener('resize', () => {
  canvasPosition = canvas.getBoundingClientRect();
})
