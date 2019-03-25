// External modules:
// - RxJS (https://github.com/ReactiveX/rxjs)
const { Observable } = require('rxjs');
const { map } = require('rxjs/operators');
const { merge, interval } = require('rxjs');
const { fromEvent } = require('rxjs');

// - Lodash (https://github.com/lodash/lodash)
const _ = require('lodash');

// Internal modules:
const { paint } = require('./render');

const MAP_SIZE = 500;

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
  return interval(ms).pipe(map(() => buildLaser(mapSize)));
}

const lasers$ = buildLaserObservable(500, MAP_SIZE);

const initialGame = () => ({
  players: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  lasers: []
})

const updateGame = lasers => ({ lasers });

const keyInput = function(event){
  return event.keycode || event.which;
}

//create observable that emits click events
const source = fromEvent(document, 'keydown');
//map to string with given event timestamp
const example = source.pipe(map(event => `Event: ${keyInput(event)}`));
//output (example): 'Event time: 7276.390000000001'
const subscribe = example.subscribe(val => console.log(val));
