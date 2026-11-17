// Orbital Sentinel — mouse and keyboard input.
// The canvas reports pointer position in game coordinates, and the module
// keeps the set of keys currently held plus one-shot "pressed" events the
// game loop consumes once per frame.

export function createInput(canvas) {
  const keysDown = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 200, down: false, clicked: false, clickX: 0, clickY: 0 };

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toGameCoords(event);
    mouse.x = point.x;
    mouse.y = point.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toGameCoords(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.down = true;
    mouse.clicked = true;
    mouse.clickX = point.x;
    mouse.clickY = point.y;
    canvas.focus();
  });

  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keysDown.add(event.code);
    pressed.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keysDown.delete(event.code);
  });

  return {
    mouse,
    isDown(code) {
      return keysDown.has(code);
    },
    // True once for the frame after the key went down, then cleared.
    wasPressed(code) {
      return pressed.has(code);
    },
    consumeClick() {
      const was = mouse.clicked;
      mouse.clicked = false;
      return was;
    },
    clickPoint() {
      return { x: mouse.clickX, y: mouse.clickY };
    },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
