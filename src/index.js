// External modules:
// - Lodash (https://github.com/lodash/lodash)
const _ = require('lodash');

// - Paper (https://github.com/paperjs/paper.js)
const paper = require('paper');

// - ReactiveX (https://github.com/ReactiveX/rxjs)
const { Observable } = require('rxjs');
const { fromEvent, of, from, interval, merge, combineLatest, zip } = require('rxjs');
const { filter, map, scan } = require('rxjs/operators');

// Internal modules:
// - Render
const { render, setup } = require('./render');

// =============================================================================
const BOX_SIZE = [1280, 720];
const ACCELERATION = 2;
const DECELERATION = 1;
const TICKS_MS = 250;

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

const keyDownSource = fromEvent(document, 'keydown');
const keydokwn = keyDownSource.pipe(map(event => keyInput(event)),
  map(keyNumber => {
    return {
      key: keyNumber,
      type: 'down'
    }
  }));

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
  const keydown$ = fromEvent(document, 'keydown').pipe(
    map(getKeyCode),
    map(keyCode => ({ code: keyCode, type: 'down' })),
  );

  const keyup$ = fromEvent(document, 'keyup').pipe(
    map(getKeyCode),
    map(keyCode => ({ code: keyCode, type: 'up' })),
  );

  const keyboard$ = merge(keyup$, keydown$).pipe(scan((prevKeyboard, current) => {
    const keyboard = [...prevKeyboard];

    if (current.type === 'down' && !keyboard.includes(current.key))
      keyboard.push(current.key);
    else {
      const idx = keyboard.indexOf(current.key);

      if (idx >= 0) keyboard.splice(idx, 1);
    }

    return keyboard;
  }, []))

  const isPlayerKeyCode = keyCode => PLAYER_0_KEY_CODES.includes(keyCode) || PLAYER_1_KEY_CODES.includes(keyCode));

  return keyboard$.pipe(map(keyCodes => keyCodes.filter(isPlayerKeyCode)));
}

const buildLaserObservable = (ms, boxSize) => {
  return interval(ms).pipe(map(() => buildRandomLaser(boxSize)));
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
  const laser$ = buildLaserObservable(250, BOX_SIZE);
  const deaths$ = buildDeathsObservable();
  const time$ = buildTimeObservable(TICKS_MS);

  const state$ = combineLatest(laser$, players$, time$).pipe(
    scan(
      (prevState, [laser, keyCodes, time]) => {
        const accelerate = (players) => {
          // const key = _.find(KEYS, (k) => k.code === keyCode);

          // if (PLAYER_0_KEY_CODES.includes(key.code)) {
          //   return [key.handler(players[0], ACCELERATION), { ...players[1] }];
          // } else {
          //   return [{ ...players[0] }, key.handler(players[1], ACCELERATION)];
          // }
        };

        const decelerate = (players) => {
          return players.map(p => {
            const decrease = (v, amount) => {
              if (v > 0 && v - amount > 0) return v - amount;
              else if (v > 0 && v - amount <= 0) return 0;
              else if (v < 0 && v + amount < 0) return v + amount;
              else if (v < 0 && v + amount >= 0) return 0;

              return v
            };

            return { ...p, vX: decrease(p.vX, DECELERATION), vY: decrease(p.vY, DECELERATION) }
          })
        };

        const move = (players) => {
          return players.map(p => {
            return { ...p, x: p.x + p.vX, y: p.y + p.vY }
          })
        }

        return {
          ...prevState,
          players: move(decelerate(accelerate(prevState.players))),
          lasers: [laser],
        };
      },
      {
        players: [
          { x: 400, y: 400, vX: 0, vY: 0 },
          { x: 400, y: 400, vX: 0, vY: 0 },
        ],
        lasers: [],
      }
    )
  );

  state$.subscribe(render)
}
