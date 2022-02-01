---
layout: post
title: Handling Events with React-Mainloop
---

I recently created a [React.js](https://facebook.github.io/react/) component wrapper around [this main loop library](https://github.com/IceCreamYou/MainLoop.js). You can find it here: [react-mainloop](https://github.com/ThomWright/react-mainloop). It can be used to control a React component using a game loop. It uses an `update()` function to generate new props, and takes control of when rendering occurs. It's especially useful for animating games, or other interactive canvas-based apps.

Since then I've been working on finding a good way to handle events using this system. This is what I've come up with so far.

Before we go any further, it might be worth reading a bit about game loops:

- [A Detailed Explanation of JavaScript Game Loops and Timing](https://www.isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing)
- [Game Programming Patterns - Game Loop](https://gameprogrammingpatterns.com/game-loop.html)

## First Attempt

My first implementation simply responded to browser events by handling them immediately, and updating component state. This triggered React rendering, and made things very jerky when responding to `mousemove` events.

What we really want is to **decouple event handling from event listeners**. The game loop should be the only thing in control of updating state and re-rendering, so events should be handled in the `update()` function.

Another good reason to decouple event handling from event listeners is separation of concerns. The React Components listening for events should have enough data to render, and nothing more. This means that they might not know enough about the state of the app to properly respond to events that happen on them. `update()`, by necessity, knows the entire state of the app, so it the perfect candidate to decide how to respond to events.

## Implementation

Here is an outline of my current implementation for event handling using the [Event Queue pattern](https://gameprogrammingpatterns.com/event-queue.html). *All code below should be treated as pseudo-code.*

The React Components create `Event`s, in response to browser events. There are different event types for different things, for example: `BackgroundMouseDown`, or `EnemyClick`. These `Event`s are useful because they contain more information than the native browser event. For example, `EnemyClick` could contain an `enemyID` property to identify which enemy was clicked.

```jsx
class Enemy extends React.Component {

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    this.props.pushEvent({
      event,
      type: 'EnemyClick',
      enemyID: this.props.id
    });
  }

  render() {
    return (
      <EnemySprite
        onClick={this.onClick}
      />
    );
  }
}
```

These `Event`s are added to a queue, to be processed every time `update()` is called.

```jsx
// event queue
let events = [];

const getUpdateFor = (componentRef) => {
  // current game state
  let gameState = {
    enemies: []
  };
  const update = (delta) {
    // handle all events since last update
    events.forEach((event) => {
        switch (event.type) {
          case `EnemyClick`: damageEnemy(event.enemyID, gameState); // updates gameState
            break;
          default:
        }
      });
    events = []; // reset events
    return gameState;
  };
  return update;
};
```

The `pushEvent` prop is passed down from the top level, like so:

```jsx
class Game extends React.Component {

  render() {
    const animate = new Animator();
    const AnimatedCanvas = animate(GameCanvas, getUpdateFor);
    return (
      <AnimatedCanvas
        pushEvent={(event) => { events.push(event); }}
        gameState={gameState}
      />
    );
  }
}
```

## Optional Extras

These extras made use of the well-known [Command Pattern](https://gameprogrammingpatterns.com/command.html).

### Injectable Event Handlers

In some cases, processing these events involves deciding what action to take in response to each event type. The action to perform might change depending on what state, or mode, the game is in. We could use an `EventProcessor` for this. It could be supplied with a mapping from event type to event handler. Here's a possible implementation:

```jsx
const normalHandler = function(event, gameState) {
  switch (event.type) {
    case `EnemyClick`: damageEnemy(event.enemyID, gameState);
      break;
    default:
  }
};

const superModeHandler = function(event, gameState) {
  switch (event.type) {
    case `EnemyClick`: killEnemy(event.enemyID, gameState);
      break;
    default:
  }
};

const EventProcessor = function(initialHandler) {
  let handler = initialHandler;

  this.process = (events, gameState) => {
    events.forEach((event) => { handler(event, gameState); } );
  };
  this.setHandler = (newHandler) => { handler = newHandler; };
};

new EventProcessor(normalHandler).process(events, gameState);
```

### Undo/Redo with an Executor

This can easily be done with the Command Pattern. Event handlers could create a `Command` object with `execute()` and `undo()` methods. These commands are sent to an `Executor`, which stores previous commands in a stack. Again, an example implementation:

```jsx
const Executor = function() {
  const undoStack = [];
  const redoStack = [];

  this.execute = (command) => {
    command.do();
    undoStack.push(command);
  };
  this.executeAll = (commands) => {
    commands.forEach((command) => {
      this.execute(command);
    });
  };
  this.undo = () => {
    const command = undoStack.pop();
    if (command) {
      command.undo();
      redoStack.push(command);
    }
  };
  this.redo = () => {
    const command = redoStack.pop();
    if (command) {
      command.do();
      undoStack.push(command);
    }
  };
};

const Command = function(execute, undoFunc) {
  this.execute;
  this.undo = undoFunc;
};

new Exectutor().execute(new Command(damageEnemy, giveHealth);
```

## Further Work

I'd like a better way of handling game state. Immutability would be great. An alternative to explicitly passing the state object around would be preferable.

It would also be interesting to try out a [Flux](https://facebook.github.io/flux/docs/todo-list.html)-type system. I'm not sure how far this breaks down when we no longer update state or render in response to events.

I'm considering adding support for event handling into [react-mainloop](https://github.com/ThomWright/react-mainloop), or maybe in a separate library. I'll probably update this post if/when I improve on these ideas.

Feedback is always appreciated!
