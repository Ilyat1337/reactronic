﻿
[![Readiness](https://img.shields.io/badge/release-beta-red.svg)](https://en.wikipedia.org/wiki/Software_release_life_cycle#Release_candidate)
[![GitHub License](https://img.shields.io/badge/license-MIT-4cc61e.svg?style=flat)](https://github.com/nezaboodka/reactronic/blob/master/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/reactronic.svg?style=flat&colorB=success)](https://www.npmjs.com/package/reactronic)
[![Package Size](https://img.shields.io/bundlephobia/minzip/reactronic.svg?colorB=success)](https://bundlephobia.com/result?p=reactronic)
[![CircleCI Status](https://circleci.com/gh/nezaboodka/reactronic.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/nezaboodka/reactronic)
![Coverage](https://img.shields.io/badge/coverage-97%25-success.svg)
![Lines](https://img.shields.io/badge/lines-1233-success.svg)
[![Demo](https://img.shields.io/badge/demo-live-success.svg)](https://nezaboodka.github.io/reactronic-demo/)

Live demo: https://nezaboodka.github.io/reactronic-demo/

# **Reactronic** - Transactionally Reactive State Management

Reactronic is a JavaScript library that provides
[transactionally reactive](https://blog.nezaboodka.com/post/2019/593-modern-database-should-natively-support-transactionally-reactive-programming)
state management in a Web application.

Transactional reactivity means that state changes are being made in an
isolated data snapshot and then, once atomically committed, are
**consistently propagated** to corresponding visual components for
(re)rendering. All that is done in automatic, seamless, and fine-grained
way, because reactronic **takes full care of tracking dependencies**
between visual components (observers) and state objects (observables).

## Conceptual Model

Transactional reactivity is based on the three fundamental concepts:

  - **State** - a set of objects that store data of an application;
  - **Transaction** - a function that changes state objects in an atomic way;
  - **Reactive Cache** - a computed value having associated function that is
  automatically called to renew the value in response to state changes.

The following picture illustrates relationships between the concepts
in the source code:

![Reactronic](https://blog.nezaboodka.com/img/reactronic.jpg)

Below is the detailed description of each concept.

### State

State is a set of objects that store data of an application.
All state objects are transparently hooked to track access to
their properties, both on reads and writes.

``` typescript
@stateful
class MyModel {
  url: string = "https://github.com/nezaboodka/reactronic";
  content: string = "transactionally reactive state management";
  timestamp: Date = Date.now();
}
```

In the example above, the class `MyModel` is instrumented with the
`@stateful` decorator and its properties `url`, `content`, and `timestamp`
are hooked.

### Transaction

Transaction is a function that changes state objects in an atomic way.
Every transaction function is instrumented with hooks to provide
transparent atomicity (by implicit context switching and isolation).

``` typescript
@stateful
class MyModel {
  // ...
  @transaction
  async load(url: string): Promise<void> {
    this.url = url;
    this.content = await fetch(url);
    this.timestamp = Date.now();
  }
}
```

In the example above, the function `load` is a transaction
that makes changes to `url`, `content` and `timestamp` properties.
While the transaction is running, the changes are visible only inside
the transaction itself. The new values become atomically visible
outside of the transaction only upon its completion.

Atomicity is achieved by making changes in an isolated data
snapshot that is visible outside of the transaction (e.g.
displayed on user screen) only when it is finished. Multiple
objects and their properties can be changed with full respect
to the all-or-nothing principle. To do so, separate data
snapshot is automatically maintained for each transaction.
That is a logical snapshot that does not create a full copy
of all the data.

Compensating actions are not needed in case of the transaction
failure, because all the changes made by the transaction in its
logical snapshot are simply discarded. In case the transaction
is successfully committed, affected caches are invalidated
and corresponding caching functions are re-executed in a proper
order (but only when all the data changes are fully applied).

Asynchronous operations (promises) are supported out of the box
during transaction execution. The transaction may consist
of a set of asynchronous calls prolonging transaction until
completion of all of them. An asynchronous call may spawn other
asynchronous calls, which prolong transaction execution until
the whole chain of asynchronous operations is fully completed.

### Reactive Cache

Reactive cache is a computed value having an associated function that
is automatically called to renew the value in response to state
changes. Renewal may happen immediately (for @reactive functions)
or on-demand (for @cached functions).

Each reactive cache function is instrumented with hooks to seamlesly
subscribe to those state objects and other caches, which are used
during its execution.

``` tsx
class MyView extends React.Component<MyModel> {
  @reactive
  refresh() {
    if (statusof(this.render).isInvalid)
      this.setState({}); // ask React to re-render
  } // refresh is subscribed to render

  @cached
  render() {
    const m: MyModel = this.props; // just a shortcut
    return (
      <div>
        <h1>{m.url}</h1>
        <div>{m.content}</div>
      </div>
    );
  } // render is subscribed to m.url and m.content
}
```

In the example above, reactive function `refresh` is transparently
subscribed to the cached function `render`. In turn, the `render`
function is subscribed to the `url` and `content` properties
of a corresponding `MyModel` object. Once `url` or `content` values
are changed, the `render` cache becomes invalid and causes invalidation
and immediate re-execution of reactive function `refresh`. While
executed, the `refresh` function enqueues re-rendering request to React,
which calls `render` function renewing its cache.

In general case, all caches are automatically and immediately marked
as invalid when changes are made in those state object properties
that were used by their functions. And once marked, the functions
are automatically executed again, either immediately (for @reactive
functions) or on demand (for @cached functions).

Reactronic takes full care of tracking dependencies between
all the state objects and reactive caches (observables and observers).
With Reactronic, you no longer need to create data change events
in one set of objects, subscribe to these events in other objects,
and manually maintain switching from the previous state to a new
one.

### Behavior Options

There are multiple options to configure behavior of transactional reactivity.

**Renew** option defines a delay between reactive cache invalidation and
invocation of the corresponding function:

  - `(ms)` - delay in milliseconds;
  - `Renew.ImmediatelyAsync` - renew immediately but async (`@reactive`);
  - `Renew.Immediately` - renew immediately (right after commit);
  - `Renew.OnDemand` - renew on access if cache is invalid (`@cached`);
  - `Renew.Manually` - renew manually (explicitly);
  - `Renew.Off` - renew manually and do not track dependencies (`@transaction`).

**Reentrance** option defines how to handle reentrant calls of the same transactional function:

  - `Reentrance.PreventWithError` - fail with error if there is an existing transaction in progress;
  - `Reentrance.WaitAndRestart` - wait for previous transaction to finish and then restart current one;
  - `Reentrance.CancelPrevious` - cancel previous transaction in favor of current one;
  - `Reentrance.RunSideBySide` - multiple simultaneous transactions are allowed.

**Start** option defines how transaction is executed if there is a parent transaction:

  - `Start.InsideParent` - transaction is part of parent transaction (default);
  - `Start.Standalone` - transaction is self-contained (separated from parent);
  - `Start.AfterParent` - transaction is start after parent one as a self-contained transaction.

**Monitor** option is an object that holds the status of running
functions, which it is attached to. A single monitor object can be
shared between multiple transaction and cache functions, thus
maintaining consolidated busy/idle status for all of them.

## Notes

Inspired by: MobX, Nezaboodka, Excel.

Key Reactronic principles and differentiators:

  - No compromises on consistency, clarity, and simplicity;
  - Minimalism and zero boilerplating (it's not a framework bloating your code);
  - Asynchrony, patches, undo/redo, conflict resolving are provided out of the box;
  - Seamless integration with transactionally reactive object-oriented databases like [Nezaboodka](https://nezaboodka.com/#products);
  - Compact dependency-free implementation consisting of just about 1K lines of code.

Roadmap:

  - v1.5: History/undo/redo API and implementation
  - v1.7: Patches and conflict resolition API
  - v2.0: Sync API and implementation

## Installation

NPM: `npm install reactronic`

## API (TypeScript)

```typescript
// Decorators

function stateful(proto, prop?); // class, field, method
function stateless(proto, prop); // field, method
function transaction(proto, prop, pd); // method only
function reactive(proto, prop, pd); // method only
function cached(proto, prop, pd); // method only

function behavior(autorun: Autorun, reentrant: ReentrantCalls, separated: SeparatedFrom);
function monitor(value: Monitor | null);
function config(config: Partial<Config>);

// Config, Autorun, ReentrantCalls, SeparatedFrom, Monitor

interface Config {
  readonly stateful: boolean;
  readonly renew: Renewal;
  readonly reentrance: Reentrance;
  readonly start: Start;
  readonly monitor: Monitor | null;
  readonly trace?: Partial<Trace>;
}

type Renewal = Renew | number; // milliseconds

enum Renew {
  ImmediatelyAsync = 0, // @reactive
  Immediately = -1,
  OnDemand = -2, // @cached
  Manually = -3,
  Off = -4, // @transaction
}

enum Reentrance {
  PreventWithError = 1, // fail with error if there is an existing transaction in progress (default)
  WaitAndRestart = 0, // wait for existing transaction to finish and then restart reentrant one
  CancelPrevious = -1, // cancel previous transaction in favor of recent one
  RunSideBySide = -2, // multiple simultaneous transactions are allowed
}

enum Start {
  InsideParent = 0,
  Standalone = 1,
  AfterParent = 2,
}

@stateful
class Monitor {
  readonly isIdle: boolean;
  readonly volume: number;
  readonly message: string;
  constructor(hint: string);
}

interface Trace {
  readonly silent: boolean;
  readonly transactions: boolean;
  readonly methods: boolean;
  readonly monitors: boolean;
  readonly reads: boolean;
  readonly writes: boolean;
  readonly changes: boolean;
  readonly subscriptions: boolean;
  readonly invalidations: boolean;
  readonly gc: boolean;
}

// Transaction

type F<T> = (...args: any[]) => T;

class Transaction {
  constructor(hint: string);
  readonly id: number;
  readonly hint: string;
  run<T>(func: F<T>, ...args: any[]): T;
  wrap<T>(func: F<T>): F<T>;
  commit(): void;
  seal(): Transaction; // t1.seal().whenFinished().then(fulfill, reject)
  cancel(error?: Error, retryAfter?: Transaction);
  isCanceled(): boolean;
  isFinished(): boolean;
  whenFinished(): Promise<void>;
  join<T>(p: Promise<T>): Promise<T>;

  static run<T>(func: F<T>, ...args: any[]): T;
  static runAs<T>(hint: string, separated: SeparatedFrom, trace: Partial<Trace> | undefined, func: F<T>, ...args: any[]): T;
  static readonly current: Transaction;
}

// Status

function resultof<T>(method: F<Promise<T>>, ...args: any[]): T | undefined;
function statusof<T>(method: F<T>): Status<T>;

abstract class Status<T> {
  readonly config: Config;
  configure(config: Partial<Config>): Config;
  readonly error: any;
  getResult(...args: any[]): T;
  readonly isInvalid: boolean;
  invalidate(cause: string | undefined): boolean;

  static get<T>(method: F<T>): Status<T>;
  static unmount(...objects: any[]): Transaction;
  static get trace(): Trace;
  static setTrace(t: Partial<Trace>): Trace;
  static setTraceHint<T extends object>(obj: T, name: string | undefined): void;
  static getTraceHint<T extends object>(obj: T): string | undefined;
}
```
