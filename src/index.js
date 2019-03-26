// External modules:
// - Lodash (https://github.com/lodash/lodash)
const _ = require('lodash');

// - Paper (https://github.com/paperjs/paper.js)
const paper = require('paper');

// - ReactiveX (https://github.com/ReactiveX/rxjs)
const { Observable } = require('rxjs');
const { fromEvent, of, from, interval, merge, combineLatest } = require('rxjs');
const { filter, map, scan } = require('rxjs/operators');

// Internal modules:
// - Render
const { render, setup } = require('./render');

// =============================================================================
const ACCELERATION = 5;
const BOX_SIZE = [1280, 720];
const TIME = 50;

const PLAYER_0_KEY_CODES = [38, 40, 37, 39];
const PLAYER_1_KEY_CODES = [87, 83, 65, 68];
// =============================================================================

const MOVES = {
  up: (player, speed) => {
    return {
      ...player,
      vY: player.vY - speed,
    };
  },
  down: (player, speed) => {
    return {
      ...player,
      vY: player.vY + speed,
    };
  },
  left: (player, speed) => {
    return {
      ...player,
      vX: player.vX - speed,
    };
  },
  right: (player, speed) => {
    return {
      ...player,
      vX: player.vX + speed,
    };
  },
}

const KEYS = {
  up: {
    code: 38,
    handler: MOVES.up,
  },
  down: {
    code: 40,
    handler: MOVES.down,
  },
  left: {
    code: 37,
    handler: MOVES.left,
  },
  right: {
    code: 39,
    handler: MOVES.right,
  },
  w: {
    code: 87,
    handler: MOVES.up,
  },
  s: {
    code: 83,
    handler: MOVES.down,
  },
  a: {
    code: 65,
    handler: MOVES.left,
  },
  d: {
    code: 68,
    handler: MOVES.right,
  },
}

const getKeyCode = (event) => event.keycode || event.which;

const buildRandomLaser = (boxSize) => {
  const [p1, p2] = _.sampleSize([
    { x: 0, y: _.random(boxSize[1]) },
    { x: _.random(boxSize[0]), y: 0 },
    { x: _.random(boxSize[0]), y: boxSize[1] },
    { x: boxSize[0], y: _.random(boxSize[1]) },
  ], 2)

  return { p1, p2 };
}

const buildPlayersObservable = (players) => {
  const source = fromEvent(document, 'keydown');

  return source.pipe(map(event => getKeyCode(event)),
    filter(keyCode => PLAYER_0_KEY_CODES.includes(keyCode) || PLAYER_1_KEY_CODES.includes(keyCode)),
    scan((prev, keyCode) => {
      const key = _.find(KEYS, (k) => k.code === keyCode);

      if (PLAYER_0_KEY_CODES.includes(key.code)) {
        return [key.handler(prev[0], ACCELERATION), { ...prev[1] }];
      } else {
        return [{ ...prev[0] }, key.handler(prev[1], ACCELERATION)];
      }
    }, players)
  );
}

const buildLaserObservable = (ms, boxSize) => {
  return interval(ms).pipe(map(() => buildRandomLaser(boxSize)), scan((prev, value) => [value], []));
}

const buildCollisionsObservable = () => {
  return fromEvent(document, 'collision');
}

const buildDeathsObservable = () => {
  return fromEvent(document, 'death').pipe(scan((prev, value) => {
    if (!value) return prev;

    const deaths = [...prev];
    deaths[value] += 1;

    return deaths;
  }, [0, 0]));
}

const buildTimeObservable = (ms) => {
  return interval(ms);
}

window.onload = () => {
  setup();

  const players$ = buildPlayersObservable([
    { x: 400, y: 400, vX: 0, vY: 0 },
    { x: 400, y: 400, vX: 0, vY: 0 },
  ]);
  const lasers$ = buildLaserObservable(250, BOX_SIZE);
  const deaths$ = buildDeathsObservable();
  const time$ = buildTimeObservable(TIME);

  const state$ = combineLatest(lasers$, players$, time$).pipe(map(([lasers, players, time]) => {
    const move = (players) => {
      return players.map(p => {
        // console.log(`x: ${p.x + p.vX}, y: ${p.y + p.vY}, vX: ${p.vX}, vY: ${p.vY}`);

        return { ...p, x: p.x + p.vX, y: p.y + p.vY }
      })
    }

    return {
      players: move(players),
      lasers,
    }
  }));

  state$.subscribe(render)
}
