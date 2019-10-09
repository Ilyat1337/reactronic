// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2016-2019 Yury Chetyrko <ychetyrko@gmail.com>
// License: https://raw.githubusercontent.com/nezaboodka/reactronic/master/LICENSE

import { F } from './util/Utils'
import { Options } from './Options'
import { Action } from './Action'
import { Method } from './core/Method' // implementation

export function cacheof<T>(method: F<T>): Cache<T> {
  return Cache.of<T>(method)
}

export function resolved<T>(method: F<Promise<T>>, args?: any[]): T | undefined {
  return (cacheof(method) as any).call(args)
}

export function nonreactive<T>(func: F<T>, ...args: any[]): T {
  return Method.runAs<T>(undefined, func, ...args)
}

export function standalone<T>(func: F<T>, ...args: any[]): T {
  return Method.runAs<T>(undefined, Action.outside, func, ...args)
}

export abstract class Cache<T> {
  abstract setup(options: Partial<Options>): Options
  abstract readonly options: Options
  abstract readonly args: ReadonlyArray<any>
  abstract readonly value: T
  abstract readonly error: any
  abstract readonly stamp: number
  abstract readonly invalid: boolean
  abstract invalidate(): void
  abstract call(args?: any[]): T | undefined

  static of<T>(method: F<T>): Cache<T> { return Method.of(method) }
  static unmount(...objects: any[]): Action { return Method.unmount(...objects) }
}
