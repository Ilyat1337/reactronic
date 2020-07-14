// The below copyright notice and the license permission notice
// shall be included in all copies or substantial portions.
// Copyright (C) 2016-2020 Yury Chetyrko <ychetyrko@gmail.com>
// License: https://raw.githubusercontent.com/nezaboodka/reactronic/master/LICENSE

import { misuse } from '../util/Dbg'
import { Stateful } from './Hooks'
import { Transaction } from '../Transaction'

// UndoRedoLog

export class UndoRedoLog extends Stateful {
  private _capacity: number = 5
  private _items: Transaction[] = []
  private _position: number = 0 // points right after the latest item

  get capacity(): number { return this._capacity }
  set capacity(value: number) { this._capacity = value; if (value < this._items.length) this._items.splice(0, this._items.length - value) }
  get items(): ReadonlyArray<Transaction> { return this._items }
  get canUndo(): boolean { return this._items.length > 0 && this._position > 0 }
  get canRedo(): boolean { return this._position < this._items.length }

  remember(t: Transaction): void {
    if (this._items.length >= this._capacity)
      this._items.shift()
    else
      this._items.splice(this._position)
    this._items.push(t)
  }

  undo(count: number = 1): void {
    let i: number = this._position - 1
    Transaction.run('undo', () => {
      while (i >= 0 && count > 0) {
        const t: Transaction = this._items[i]
        t.undo()
        i--
        count--
      }
    })
    this._position = i + 1
  }

  redo(count: number = 1): void {
    throw misuse('not implemented')
  }
}
