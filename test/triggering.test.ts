﻿// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2016-2020 Yury Chetyrko <ychetyrko@gmail.com>
// License: https://raw.githubusercontent.com/nezaboodka/reactronic/master/LICENSE
// By contributing, you agree that your contributions will be
// automatically licensed under the license referred above.

import test from 'ava'
import { Stateful, Transaction as Tran, Reactronic as R, trigger } from 'api'
import { TestingTraceLevel } from './brief'

export class TriggeringDemo extends Stateful {
  title: string = 'TriggeringDemo'
  content: string = 'Content'

  @trigger
  actualize1(): void {
    this.title
    this.title = 'Title/1'
    this.content = 'Content/1'
    this.title
  }

  @trigger
  actualize2(): void {
    this.content
    this.title = 'Title/2'
  }
}

test('triggering', t => {
  R.setTraceMode(true, TestingTraceLevel)
  const demo = Tran.run(() => new TriggeringDemo())
  t.is(demo.title, 'Title/2')
  t.is(demo.content, 'Content/1')
})