import type MainGameBaseline from './game-baseline-main'
import { initMain, mainMethod } from '/utils/bridge/renderer'

@initMain()
class GameBaseline {
  @mainMethod()
  getValue!: typeof MainGameBaseline.getValue
}

export default new GameBaseline()
