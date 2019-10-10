// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2016-2019 Yury Chetyrko <ychetyrko@gmail.com>
// License: https://raw.githubusercontent.com/nezaboodka/reactronic/master/LICENSE

import { Trace } from './Trace'
export { Trace } from './Trace'
import { Ticker } from './Ticker'

export interface Options {
  readonly kind: Kind
  readonly reentrance: Reentrance
  readonly cachedArgs: boolean
  readonly ticker: Ticker | null
  readonly trace?: Partial<Trace>
}

export enum Kind {
  Stateless = 0,
  Stateful = 1,
  Action = 2,
  Trigger = 3,
  Cached = 4,
}

export enum Reentrance {
  PreventWithError = 1, // fail with error if there is an existing action in progress (default)
  WaitAndRestart = 0, // wait for existing action to finish and then restart reentrant one
  CancelPrevious = -1, // cancel previous action in favor of recent one
  RunSideBySide = -2, // multiple simultaneous actions are allowed
}
