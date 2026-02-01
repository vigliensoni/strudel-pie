const playButton = document.getElementById('play');
const stopButton = document.getElementById('stop');
const toggleBdButton = document.getElementById('toggle-bd');
const toggleMelButton = document.getElementById('toggle-mel');
const TOGGLE_BD_INDEX = 2;
const TOGGLE_MEL_INDEX = 3;

playButton.onclick = () => window.strudelControls.playPattern();
stopButton.onclick = () => window.strudelControls.stopPattern();
const setMutedStyle = (button, muted) => {
  button.classList.toggle('is-muted', muted);
};

const toggleBdState = () => {
  const muted = window.strudelControls.toggleBd();
  toggleBdButton.textContent = muted ? 'unmute bd' : 'mute bd';
  setMutedStyle(toggleBdButton, muted);
};

const toggleMelState = () => {
  const muted = window.strudelControls.toggleMel();
  toggleMelButton.textContent = muted ? 'unmute melodies' : 'mute melodies';
  setMutedStyle(toggleMelButton, muted);
};

toggleBdButton.onclick = () => {
  toggleBdState();
  window.strudelControls.playPattern();
};
toggleMelButton.onclick = () => {
  toggleMelState();
  window.strudelControls.playPattern();
};

const movingButtons = [playButton, stopButton, toggleBdButton, toggleMelButton];

const velocities = movingButtons.map(() => ({
  x: (Math.random() * 2 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
  y: (Math.random() * 2 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
}));

const positions = movingButtons.map(() => ({ x: 0, y: 0 }));
const activeCollisions = new Set();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const initializePositions = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  movingButtons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const x = Math.random() * (viewportWidth - rect.width);
    const y = Math.random() * (viewportHeight - rect.height);
    positions[index].x = x;
    positions[index].y = y;
    button.style.transform = `translate(${x}px, ${y}px)`;
  });
};

const resolveButtonCollision = (aIndex, bIndex, aRect, bRect) => {
  const aCenterX = positions[aIndex].x + aRect.width / 2;
  const aCenterY = positions[aIndex].y + aRect.height / 2;
  const bCenterX = positions[bIndex].x + bRect.width / 2;
  const bCenterY = positions[bIndex].y + bRect.height / 2;

  const dx = aCenterX - bCenterX;
  const dy = aCenterY - bCenterY;

  if (Math.abs(dx) > Math.abs(dy)) {
    velocities[aIndex].x *= -1;
    velocities[bIndex].x *= -1;
  } else {
    velocities[aIndex].y *= -1;
    velocities[bIndex].y *= -1;
  }

  const overlapX = (aRect.width + bRect.width) / 2 - Math.abs(dx);
  const overlapY = (aRect.height + bRect.height) / 2 - Math.abs(dy);

  if (overlapX > 0 && overlapY > 0) {
    const pushX = overlapX / 2;
    const pushY = overlapY / 2;
    positions[aIndex].x += dx > 0 ? pushX : -pushX;
    positions[bIndex].x += dx > 0 ? -pushX : pushX;
    positions[aIndex].y += dy > 0 ? pushY : -pushY;
    positions[bIndex].y += dy > 0 ? -pushY : pushY;
  }
};

const animateButtons = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const rects = movingButtons.map((button) => button.getBoundingClientRect());

  movingButtons.forEach((button, index) => {
    const rect = rects[index];
    let nextX = positions[index].x + velocities[index].x;
    let nextY = positions[index].y + velocities[index].y;

    if (nextX <= 0 || nextX + rect.width >= viewportWidth) {
      velocities[index].x *= -1;
    }
    if (nextY <= 0 || nextY + rect.height >= viewportHeight) {
      velocities[index].y *= -1;
    }

    nextX = clamp(nextX, 0, viewportWidth - rect.width);
    nextY = clamp(nextY, 0, viewportHeight - rect.height);

    positions[index].x = nextX;
    positions[index].y = nextY;
    button.style.transform = `translate(${nextX}px, ${nextY}px)`;
  });

  for (let i = 0; i < movingButtons.length; i += 1) {
    for (let j = i + 1; j < movingButtons.length; j += 1) {
      const aRect = {
        width: rects[i].width,
        height: rects[i].height,
      };
      const bRect = {
        width: rects[j].width,
        height: rects[j].height,
      };
      const aLeft = positions[i].x;
      const aTop = positions[i].y;
      const bLeft = positions[j].x;
      const bTop = positions[j].y;

      const isOverlapping =
        aLeft < bLeft + bRect.width &&
        aLeft + aRect.width > bLeft &&
        aTop < bTop + bRect.height &&
        aTop + aRect.height > bTop;

      const collisionKey = `${i}-${j}`;

      if (isOverlapping) {
        if (!activeCollisions.has(collisionKey)) {
          let muteChanged = false;
          if (i === TOGGLE_BD_INDEX || j === TOGGLE_BD_INDEX) {
            toggleBdState();
            muteChanged = true;
          }
          if (i === TOGGLE_MEL_INDEX || j === TOGGLE_MEL_INDEX) {
            toggleMelState();
            muteChanged = true;
          }
          if (muteChanged) {
            window.strudelControls.playPattern();
          }
          activeCollisions.add(collisionKey);
        }
        resolveButtonCollision(i, j, aRect, bRect);
      } else {
        activeCollisions.delete(collisionKey);
      }
    }
  }

  requestAnimationFrame(animateButtons);
};

window.addEventListener('load', () => {
  initializePositions();
  animateButtons();
  window.strudelControls.playPattern();
});

window.addEventListener('resize', initializePositions);
