import type MainLocalGameImages from './main'
import { initMain, mainMethod } from '/utils/bridge/renderer'

@initMain()
class LocalGameImages {
  @mainMethod()
  getSrc!: typeof MainLocalGameImages.getSrc
}

export default new LocalGameImages()
