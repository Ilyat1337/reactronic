// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2016-2022 Yury Chetyrko <ychetyrko@gmail.com>
// License: https://raw.githubusercontent.com/nezaboodka/reactronic/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import { ObservableObject, transaction, reaction, cached, options, Transaction, Monitor, Reentrance, Rx, all, pause } from '../source/api'

export const output: string[] = []
export const busy = Monitor.create('Busy', 0, 0)

export class AsyncDemo extends ObservableObject {
  url: string = 'reactronic'
  log: string[] = ['RTA']

  @transaction @options({ monitor: busy, reentrance: Reentrance.PreventWithError })
  async load(url: string, delay: number): Promise<void> {
    this.url = url
    await all([pause(delay)])
    const log = this.log = this.log.toMutable()
    log.push(`${this.url}/${delay}`)
  }
}

export class AsyncDemoView {
  // @state observableField: string = 'observable field'

  constructor(readonly model: AsyncDemo) {
  }

  @reaction @options({ throttling: -1 })
  async print(): Promise<void> {
    const lines: string[] = await this.render()
    if (!Transaction.current.isCanceled) {
      for (const x of lines) {
        output.push(x) /* istanbul ignore next */
        if (Rx.isTraceEnabled && !Rx.traceOptions.silent) console.log(x)
      }
    }
  }

  @cached @options({ sensitiveArgs: false })
  async render(): Promise<string[]> {
    const result: string[] = []
    result.push(`${busy.isActive ? '[...] ' : ''}Url: ${this.model.url}`)
    await pause(10)
    result.push(`${busy.isActive ? '[...] ' : ''}Log: ${this.model.log.join(', ')}`)
    return result
  }
}
