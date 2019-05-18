import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

import Matter from 'matter-js';
import { GameEngine, DefaultTouchProcessor } from 'react-native-game-engine';

import Box from './components/Box';
import Circle from './components/Circle';
import Ghost from './components/Ghost';
import Sunglasses from './components/Sunglasses';
import Null from './components/Null';
import Laugh from './components/Laugh';

Matter.Common.isElement = () => false;
const { width, height } = Dimensions.get('screen');
const logoSize = Math.trunc(Math.max(width, height) * 0.075);
const engine = Matter.Engine.create({ enableSleeping: false });

engine.world.gravity.y = 0;

const world = engine.world;
const logoBody = Matter.Bodies.rectangle(
  width / 2,
  height / 1.15,
  logoSize,
  logoSize,
  {
    frictionAir: 0,
    friction: 0,
    isStatic: true,
    label: 'logo',
    collisionFilter: {
      category: 1,
      mask: 2,
    },
  }
);

Matter.World.add(world, [logoBody]);

const Physics = (entities, { time }) => {
  let engine = entities.physics.engine;
  Matter.Engine.update(engine, time.delta);
  return entities;
};

let boxIds = 0;

let counter = 0;

let speed = 2;

let scoreSpeed = 2;

let speedCounter = 0;

let running = false;

let gameOver = false;

let Entities = () => {
  return {
    physics: { engine: engine, world: world },
    logoBody: {
      body: logoBody,
      size: [logoSize, logoSize],
      color: '#daa520',
      renderer: Box,
      render: { visible: true, opacity: 1 },
    },
    camera: { offsetY: 0 },
  };
};

const MoveLogo = (entities, { events, touches, screen }) => {
  let camera = entities.camera;

  // let speedUp = events.find(e => e.type === "speed-up");

  let boostUp = events.find(e => e.type === 'boost-up');

  // speed = gameOver ? 4 : speedUp ? speed + 0.5 : boostUp ? speed + 1 : speed;

  speed = gameOver
    ? 2
    : /*boostUp ? speed + 0.1 :*/ speedCounter % 2 === 0
    ? speed + 0.01
    : speed;

  scoreSpeed = gameOver
    ? 2
    : boostUp
    ? scoreSpeed + 2
    : speedCounter % 2 === 0
    ? scoreSpeed + 0.01
    : scoreSpeed;

  // running && console.log("speed", speed, scoreSpeed);

  running &&
    Matter.Body.translate(logoBody, { x: 0, y: -parseFloat(speed).toFixed(2) });

  running &&
    touches
      .filter(t => t.type === 'press' || t.type === 'long-press')
      .forEach(t => {
        speedCounter += 1;

        let fingerBody = Matter.Bodies.circle(
          t.event.pageX,
          t.event.pageY - camera.offsetY,
          // 0,
          logoSize / 1.25,
          {
            label: 'finger',
            isStatic: true,
            collisionFilter: {
              category: 2,
              mask: 1,
            },
          }
        );

        Matter.World.add(world, [fingerBody]);

        entities[++boxIds] = {
          body: fingerBody,
          size: [logoSize / 1.25, logoSize / 1.25],
          color: 'transparent',
          borderColor: '#daa520',
          renderer: Circle,
        };

        setTimeout(() => {
          Object.values(entities).forEach(e => {
            e.body &&
              e.body.label === 'finger' &&
              Matter.World.remove(world, e.body);
            e.body &&
              e.body.label === 'finger' &&
              Matter.Body.scale(e.body, 0.1, 0.1, {
                x: e.body.bounds.min.x - 1000,
                y: e.body.bounds.max.y,
              });
          });
        }, 100);

        // if (t.event.pageX > logoBody.bounds.max.x - (logoSize/2) && logoBody.bounds.max.x < width-(width/10)) {
        if (
          t.event.pageX > screen.width / 2 &&
          logoBody.bounds.max.x < width - width / 10
        ) {
          return Matter.Body.translate(logoBody, {
            x: Math.trunc(width / 3),
            y: 0,
          });

          // } else if (t.event.pageX < logoBody.bounds.min.x + (logoSize/2) && logoBody.bounds.min.x > width/10) {
        } else if (
          t.event.pageX < screen.width / 2 &&
          logoBody.bounds.min.x > width / 10
        ) {
          return Matter.Body.translate(logoBody, {
            x: -Math.trunc(width / 3),
            y: 0,
          });
        }
      });
  return entities;
};

const Camera = (entities, { screen, animations }) => {
  let logoBody = entities.logoBody;
  let camera = entities.camera;
  let targetY = logoBody.body.position.y + camera.offsetY;
  // let anchorY = screen.height * 0.65;
  let anchorY = screen.height * 0.85;
  let diff = anchorY - logoBody.body.position.y - camera.offsetY;

  camera.offsetY += diff * 0.85;

  return entities;
};

const RemoveBodies = (entities, { events, screen }) => {
  let world = entities.physics.world;

  let camera = entities.camera;

  let logoBody = entities.logoBody;

  // remove bodies that have fallen off the screen

  running &&
    Object.values(entities).forEach(e => {
      if (
        e.body &&
        e.body.label &&
        e.body.position.y > screen.height - camera.offsetY &&
        !e.body.isRemoved
      ) {
        e.body.isRemoved = true;
        Matter.World.remove(world, e.body);
      }
    });

  let remove = events.find(e => e.type === 'remove-bodies');

  if (remove) {
    Object.values(entities).forEach(e => {
      e.body &&
        e.body.label !== 'logo' &&
        Matter.Body.scale(e.body, 0.1, 0.1, {
          x: e.body.bounds.min.x - 1000,
          y: e.body.bounds.max.y,
        });
    });
  }

  let stopped = events.find(e => e.type === 'stopped');

  if (stopped) {
    Object.values(entities).forEach(e => {
      // e.body && console.log("STOPPPED", e.body.label);
      e.body && e.body.label !== 'logo' && Matter.World.remove(world, e.body);
    });
    logoBody.color = '#daa520';
    logoBody.render.visible = true;
    logoBody.render.opacity = 1;
    Matter.Engine.clear(engine);
    gameOver = true;
    running = false;
    boxIds = 0;
    speedCounter = 0;
  }

  let restart = events.find(e => e.type === 'restart');

  if (restart) {
    Object.values(entities).forEach(e => {
      e.body && e.body.label !== 'logo' && Matter.World.remove(world, e.body);
      e.body &&
        e.body.label !== 'logo' &&
        Matter.Body.scale(e.body, 0.1, 0.1, {
          x: e.body.bounds.min.x - 1000,
          y: e.body.bounds.max.y,
        });
    });
    // camera.offsetY = 0;
    Matter.Engine.clear(engine);
    gameOver = false;
    // entities = Entities;
    boxIds = 0;
    speedCounter = 0;
  }

  let cancel = events.find(e => e.type === 'cancel');

  if (cancel) {
    Object.values(entities).forEach(e => {
      // e.body && console.log("Cancel", e.body.label);
      e.body && e.body.label !== 'logo' && Matter.World.remove(world, e.body);
      e.body &&
        e.body.label !== 'logo' &&
        Matter.Body.scale(e.body, 0.1, 0.1, {
          x: e.body.bounds.min.x - 1000,
          y: e.body.bounds.max.y,
        });
    });
    // camera.offsetY = 0;
    Matter.Engine.clear(engine);
    // entities = Entities;
    boxIds = 0;
    speedCounter = 0;
  }

  let disappear = events.find(e => e.type === 'disappear');

  if (disappear) {
    logoBody.color = 'transparent';
    logoBody.render.visible = false;
    logoBody.render.opacity = 0;
    setTimeout(() => {
      logoBody.color = '#daa520';
      logoBody.render.visible = true;
      logoBody.render.opacity = 1;
    }, 3000);
  }

  let chill = events.find(e => e.type === 'chill');

  if (chill) {
    speed -= 4;
    setTimeout(() => {
      speed += 4;
    }, 4000);
  }

  let haha = events.find(e => e.type === 'haha');

  if (haha) {
    speed += 4;
    setTimeout(() => {
      speed -= 4;
    }, 3000);
  }

  // console.log("entities", entities);

  return entities;
};

const AddBodies = (entities, { events, screen }) => {
  let world = entities.physics.world;

  let camera = entities.camera;

  let logoBody = entities.logoBody;

  let sc = running && events.find(e => e.type === 'sc');

  let gc = running && events.find(e => e.type === 'gc');

  let block = running && events.find(e => e.type === 'block');

  let ghost = running && events.find(e => e.type === 'ghost');

  let sunglasses = running && events.find(e => e.type === 'sunglasses');

  let laugh = running && events.find(e => e.type === 'laugh');

  let isNull = running && events.find(e => e.type === 'isNull');

  let spinner = running && events.find(e => e.type === 'spinner');

  if (spinner && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    let coinBody = Matter.Bodies.circle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'Spinner',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [coinBody]);

    entities[++boxIds] = {
      body: coinBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'purple',
      renderer: Circle,
    };

    counter += 1;
    // engine.world.gravity.y += 0.01;
  }

  if (isNull && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    // let pos1 = pos===width/6 ? width/2 : pos===width-(width/6) ? width/6 : width-(width/6);

    let sunglassesBody = Matter.Bodies.rectangle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'isNull',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [sunglassesBody]);

    entities[++boxIds] = {
      body: sunglassesBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'transparent',
      renderer: Null,
    };

    counter += 1;

    // engine.world.gravity.y += 0.01;
  }

  if (laugh && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    // let pos1 = pos===width/6 ? width/2 : pos===width-(width/6) ? width/6 : width-(width/6);

    let sunglassesBody = Matter.Bodies.rectangle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'Laugh',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [sunglassesBody]);

    entities[++boxIds] = {
      body: sunglassesBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'transparent',
      renderer: Laugh,
    };

    counter += 1;

    // engine.world.gravity.y += 0.01;
  }

  if (sunglasses && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    // let pos1 = pos===width/6 ? width/2 : pos===width-(width/6) ? width/6 : width-(width/6);

    let sunglassesBody = Matter.Bodies.rectangle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'Sunglasses',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [sunglassesBody]);

    entities[++boxIds] = {
      body: sunglassesBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'transparent',
      renderer: Sunglasses,
    };

    counter += 1;

    // engine.world.gravity.y += 0.01;
  }

  if (ghost && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    let ghostBody = Matter.Bodies.rectangle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'Ghost',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [ghostBody]);

    entities[++boxIds] = {
      body: ghostBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'transparent',
      renderer: Ghost,
    };

    counter += 1;

    // engine.world.gravity.y += 0.01;
  }

  if (sc && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    let coinBody = Matter.Bodies.circle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'silver-coin',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [coinBody]);

    entities[++boxIds] = {
      body: coinBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: 'grey',
      renderer: Circle,
    };

    counter += 1;

    // engine.world.gravity.y += 0.01;
  }

  if (gc && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let pos =
      rand % 3 === 0
        ? width / 6
        : rand % 3 === 1
        ? width / 2
        : width - width / 6;

    let coinBody = Matter.Bodies.circle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize / 1.25,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'gold-coin',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [coinBody]);

    entities[++boxIds] = {
      body: coinBody,
      size: [logoSize / 1.25, logoSize / 1.25],
      color: '#daa520',
      renderer: Circle,
    };

    counter += 1;
  }

  if (block && running) {
    // console.log("ADDING BODY", running);
    let rand = Math.trunc(Math.random() * 10);

    let rand1 = Math.trunc(Math.random() * 10);

    let pos =
      rand % 2 === 0
        ? logoBody.body.position.x
        : rand % 3 === 0
        ? width / 6
        : rand % 5 === 1
        ? width / 2
        : width - width / 6;

    let blockBody = Matter.Bodies.rectangle(
      pos,
      -camera.offsetY,
      // 0,
      logoSize * 2,
      (logoSize * 2) / 5,
      {
        frictionAir: 0,
        friction: 0,
        isRemoved: false,
        label: 'Block-red',
        collisionFilter: {
          category: 2,
          mask: 1,
        },
      }
    );

    Matter.World.add(world, [blockBody]);

    entities[++boxIds] = {
      body: blockBody,
      size: [logoSize * 2, (logoSize * 2) / 5],
      color: 'red',
      renderer: Box,
    };

    counter += 1;
  }

  return entities;
};

const CameraRenderer = (state, screen) => {
  return (
    <View style={{ marginTop: state.camera.offsetY }}>
      {Object.keys(state)
        .filter(key => state[key].renderer)
        .map(key => {
          let entity = state[key];
          if (typeof entity.renderer === 'object')
            return (
              <entity.renderer.type key={key} {...entity} screen={screen} />
            );
          else if (typeof entity.renderer === 'function')
            return <entity.renderer key={key} {...entity} screen={screen} />;
        })}
    </View>
  );
};

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.scInterval = null;
    this.gcInterval = null;
    this.ghostInterval = null;
    this.state = {
      running: false,
      gameOver: false,
      restart: false,
      canStart: true,
      started: false,
      gc: 0,
      sc: 0,
      spin: 0,
      score: 0,
      mode: '',
      emojis: 0,
      isMode: false,
    };
  }

  componentDidMount() {
    Matter.Events.on(engine, 'collisionStart', event => {
      const { bodyA, bodyB } = event.pairs[0];

      if (bodyB.label === 'Block-red') {
        Matter.World.remove(world, bodyB);

        this.setState({
          gameOver: true,
          isMode: true,
          mode: 'Game Over!',
          canStart: false,
          showScore: true,
          running: false,
        });

        running = false;
      }

      if (bodyB.label === 'silver-coin') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.setState({ sc: this.state.sc + 1 });
      }

      if (bodyB.label === 'Spinner') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.setState({ spin: this.state.spin + 1 });
      }

      if (bodyB.label === 'isNull') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.setState({ sc: 0, gc: 0, spin: 0, isMode: true, mode: 'Null!' });
        setTimeout(() => {
          this.state.running && this.setState({ isMode: false, mode: '' });
        }, 1000);
      }

      if (bodyB.label === 'Laugh') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.game && this.game.dispatch({ type: 'haha' });
        this.setState({
          isMode: true,
          mode: 'Hahaha!',
          emojis: this.state.emojis + 1,
        });
        setTimeout(() => {
          this.state.running && this.setState({ isMode: false, mode: '' });
        }, 1000);
      }

      if (bodyB.label === 'gold-coin') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.setState({ gc: this.state.gc + 1 });
        this.setState({ isMode: true, mode: 'Awesome!' });
        setTimeout(() => {
          this.state.running && this.setState({ isMode: false, mode: '' });
        }, 2000);
      }

      if (bodyB.label === 'Ghost') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.game && this.game.dispatch({ type: 'disappear' });
        this.setState({
          isMode: true,
          mode: 'Ghost Mode!',
          emojis: this.state.emojis + 1,
        });
        setTimeout(() => {
          this.state.running && this.setState({ isMode: false, mode: '' });
        }, 1000);
      }

      if (bodyB.label === 'Sunglasses') {
        Matter.Body.scale(bodyB, 0.1, 0.1, {
          x: bodyB.bounds.min.x - 1000,
          y: bodyB.bounds.max.y,
        });
        Matter.World.remove(world, bodyB);
        this.game && this.game.dispatch({ type: 'chill' });
        this.setState({
          isMode: true,
          mode: 'Chill Mode!',
          emojis: this.state.emojis + 1,
        });
        setTimeout(() => {
          this.state.running && this.setState({ isMode: false, mode: '' });
        }, 1000);
      }
    });
  }

  _handleEvent = async e => {
    if (e.type === 'stopped' && this.state.gameOver) {
      this._clearIntervals();
      gameOver = true;
    }
  };

  _clearIntervals = () => {
    this.scInterval && clearInterval(this.coinInterval);
    this.gcInterval && clearInterval(this.wpInterval);
    this.ghostInterval && clearInterval(this.ghostInterval);
    this.blockInterval && clearInterval(this.blockInterval);
    this.sunglassesInterval && clearInterval(this.sunglassesInterval);
    this.laughInterval && clearInterval(this.laughInterval);
    this.nullInterval && clearInterval(this.nullInterval);
  };

  _startCounting = () => {
    setTimeout(() => {
      this.setState({
        isMode: true,
        mode: '3',
        running: true,
        gameOver: false,
        sc: 0,
        gc: 0,
        spin: 0,
        score: 0,
        v: 2,
        emojis: 0,
      });
    }, 500);
    setTimeout(() => {
      this.setState({ isMode: true, mode: '2' });
    }, 1100);
    setTimeout(() => {
      this.setState({ isMode: true, mode: '1' });
    }, 1600);
    setTimeout(() => {
      this.setState({ isMode: true, mode: 'GO!' });
    }, 2100);
    setTimeout(() => {
      this.setState({ isMode: false, mode: '' });
      this.setState({ started: false });
    }, 2600);
  };

  _startGame = () => {
    if (!this.state.started) {
      this._startCounting();
      this.setState({ started: true });

      this.game && this.game.dispatch({ type: 'remove-bodies' });

      this.game && this.game.dispatch({ type: 'restart' });

      this.game && this.game.swap(new Entities());

      running = true;

      gameOver = false;

      setTimeout(() => {
        this.scoreInterval = setInterval(() => {
          let score =
            this.state.sc * 7 +
            this.state.gc * 70 +
            this.state.spin * 4 +
            parseInt(parseInt(scoreSpeed) * 10) +
            this.state.emojis * 2;

          running && this.setState({ score });
        }, 300);

        this.scInterval = setInterval(() => {
          // console.log("running");
          let rand = Math.trunc(Math.random() * 10);

          running &&
            rand % 2 === 0 &&
            setTimeout(() => {
              running && this.game && this.game.dispatch({ type: 'block' });
            }, 300);
          running && this.game && this.game.dispatch({ type: 'sc' });
        }, 4500);

        this.blockInterval = setInterval(() => {
          running && this.game && this.game.dispatch({ type: 'block' });
        }, 4000);

        this.gcInterval = setInterval(() => {
          let rand = Math.trunc(Math.random() * 10);

          running &&
            rand % 3 === 0 &&
            setTimeout(() => {
              running && this.game && this.game.dispatch({ type: 'block' });
            }, 300);
          running && this.game && this.game.dispatch({ type: 'gc' });
        }, 16000);

        this.ghostInterval = setInterval(() => {
          running && this.game && this.game.dispatch({ type: 'ghost' });
        }, 5000);

        this.sunglassesInterval = setInterval(() => {
          running && this.game && this.game.dispatch({ type: 'sunglasses' });
        }, 6000);

        this.laughInterval = setInterval(() => {
          running && this.game && this.game.dispatch({ type: 'laugh' });
        }, 8000);

        this.nullInterval = setInterval(() => {
          running && this.game && this.game.dispatch({ type: 'isNull' });
        }, 4300);
      }, 2500);
    }
  };

  render() {
    return (
      <GameEngine
        ref={g => (this.game = g)}
        style={styles.container}
        systems={[Physics, MoveLogo, AddBodies, Camera, RemoveBodies]}
        entities={new Entities()}
        running={this.state.running}
        touchProcessor={DefaultTouchProcessor({
          triggerPressEventBefore: 150,
          triggerLongPressEventAfter: 151,
        })}
        renderer={CameraRenderer}
        onEvent={this._handleEvent}>
        <StatusBar hidden={true} />
        <View style={styles.scoreBar}>
          <Text style={{ color: 'white', fontSize: 15, marginTop: 0 }}>
            SPIN: {this.state.spin}
          </Text>
          <Text style={{ color: 'white', fontSize: 15, marginTop: 0 }}>
            SC: {this.state.sc}
          </Text>
          <Text style={{ color: 'white', fontSize: 15, marginTop: 0 }}>
            GC: {this.state.gc}
          </Text>
          <Text style={{ color: 'white', fontSize: 15, marginTop: 0 }}>
            Score: {this.state.score}
          </Text>
        </View>

        {!this.state.running && (
          <TouchableOpacity
            onPress={() => this._startGame()}
            style={{
              backgroundColor: '#daa520',
              width: 200,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              position: 'absolute',
              top: '20%',
              marginBottom: 20,
            }}>
            <Text style={{ color: 'white', fontSize: 18 }}>START</Text>
          </TouchableOpacity>
        )}

        {this.state.isMode && this.state.mode !== '' && (
          <View
            style={{
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: '7%',
              width: '100%',
              padding: 20,
            }}>
            <Text style={{ color: 'white', fontSize: 50, textAlign: 'center' }}>
              {this.state.mode}
            </Text>
          </View>
        )}
      </GameEngine>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'grey',
    backgroundColor: 'black',
  },
  scoreBar: {
    position: 'absolute',
    top: 0,
    height: logoSize * 1.2,
    width: width,
    backgroundColor: '#daa520',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
