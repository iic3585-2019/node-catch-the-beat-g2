// External modules:
// - Paper (https://github.com/paperjs/paper.js)
const paper = require('paper');

// =============================================================================
const COLORS = {
  LASER: '#f44336',
  PLAYERS: ['#9c27b0', '#009688'],
}

const R = 20;
// =============================================================================

const EVENTS = {
  COLLISION: (event) => new CustomEvent('collision', { detail: event }),
  DEATH: (event) => new CustomEvent('death', { detail: event }),
}

const draw = {
  player: player => {
    const { x, y } = player;

    const p = new paper.Point(x, y);
    const path = new paper.Path.Circle(p, R);
    path.fillColor = COLORS.PLAYERS[0];

    return path;
  },

  laser: laser => {
    const { p1, p2 } = laser;

    const _p1 = new paper.Point(p1.x, p1.y);
    const _p2 = new paper.Point(p2.x, p2.y);

    const path = new paper.Path(_p1, _p2);
    path.strokeColor = COLORS.LASER;
    path.strokeWidth = 4;

    return path;
  }
}

const setup = () => {
  const canvas = document.getElementById('canvas');

  paper.setup(canvas);
}

const render = (state) => {
  paper.project.clear();

  _lasers = state.lasers.map(draw.laser);
  _players = state.players.map(draw.player);

  if (_players[0].intersects(_players[1])) document.dispatchEvent(EVENTS.COLLISION());

  for (const [idx, _player] of _players.entries()) {
    if (_lasers.some((_laser) => _laser.intersects(_player))) {
      document.dispatchEvent(EVENTS.DEATH({ player: idx }))

      break;
    }
  }

  paper.view.draw();
}

module.exports = { render, setup }
