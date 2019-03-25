// External modules:
// - Lodash (https://github.com/lodash/lodash)
const _ = require('lodash');

// - Paper (https://github.com/paperjs/paper.js)
const paper = require('paper');

// - ReactiveX (https://github.com/ReactiveX/rxjs)
const { Observable } = require('rxjs');
const { fromEvent, interval, merge, combineLatest } = require('rxjs');
const { filter, map, scan } = require('rxjs/operators');

// Internal modules:
// - Render
const { render, setup } = require('./render');

// =============================================================================
const MAP_SIZE = 1024;
const move = 5;
// =============================================================================

const moves = {
  up: (player, move) => {
    return {
      x: player.x,
      y: player.y - move,
    };
  },
  down: (player, move) => {
    return {
      x: player.x,
      y: player.y + move,
    };
  },
  left: (player, move) => {
    return {
      x: player.x - move,
      y: player.y,
    };
  },
  right: (player, move) => {
    return {
      x: player.x + move,
      y: player.y,
    };
  },
}

const keys = {
  up: {
    number: 38,
    move: moves.up,
  },
  down: {
    number: 40,
    move: moves.down,
  },
  left: {
    number: 37,
    move: moves.left,
  },
  right: {
    number: 39,
    move: moves.right,
  },
  w: {
    number: 87,
    move: moves.up,
  },
  s: {
    number: 83,
    move: moves.down,
  },
  a: {
    number: 65,
    move: moves.left,
  },
  d: {
    number: 68,
    move: moves.right,
  },
}

const player1Move = [38, 40, 37, 39];
const player2Move = [87, 83, 65, 68];

const keyInput = (event) => event.keycode || event.which;

const buildLaser = (mapSize) => {
  const [p1, p2] = _.sampleSize([
    { x: 0, y: _.random(mapSize - 1) },
    { x: _.random(mapSize - 1), y: 0 },
    { x: mapSize - 1, y: _.random(mapSize - 1) },
    { x: _.random(mapSize - 1), y: mapSize - 1 },
  ], 2)

  return { p1, p2 };
}

const buildLaserObservable = (ms, mapSize) => {
  return interval(ms).pipe(map(() => buildLaser(mapSize)), scan((prev, value) => [value], []));
}

const buildPlayersObservable = (players) => {
  const source = fromEvent(document, 'keydown');

  return source.pipe(map(event => keyInput(event)),
    filter(numberKey => player1Move.includes(numberKey) || player2Move.includes(numberKey)),
    scan((prevPlayers, numberKey) => {
      for (let key in keys) {
        if (numberKey === keys[key].number) {
          if (player1Move.includes(keys[key].number)) {
            return [keys[key].move(prevPlayers[0], move), { x: prevPlayers[1].x, y: prevPlayers[1].y }];
          }
          else {
            return [{ x: prevPlayers[0].x, y: prevPlayers[0].y }, keys[key].move(prevPlayers[1], move)];
          }
        }
      }
    }, players)
  );
}

window.onload = () => {
  setup();


  const lasers$ = buildLaserObservable(500, MAP_SIZE);
  const players$ = buildPlayersObservable(
    [
      { x: 400, y: 400 },
      { x: 400, y: 400 },
    ]
  );

  const state$ = combineLatest(lasers$, players$).pipe((map(([lasers, players]) => {
    return {
      size: MAP_SIZE,
      players,
      lasers,
    }
  })));

  state$.subscribe(render)
}


