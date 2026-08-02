import { app } from 'electron'
import BaseApp from './base-app'
import TextsLoader from './texts'
import Checks from '/mods/checks/main'
import Config from '/mods/data/config/main'
import Dlc from '/mods/dlcs/main'
import Edited from '/mods/data/edited/main'
import Favorites from '/mods/data/favorites/main'
import Loading from '/mods/loading/main'
import Mods from '/mods/data/mods/main'
import QuitParams from '/mods/quit-params/main'
import Sizes from '/mods/data/sizes/main'
import Texts from '/mods/game-texts/main'
import Windows, { Page, ProgramWindow } from '/mods/windows/main'

import '/mods/epf/main'
import '/mods/updates/main'

const texts = await TextsLoader.loadMain()

/** Приложение. */
class App extends BaseApp {
  async afterInit() {
    await app.whenReady()
    await this.openProgram()
  }

  /** Запуск программы. */
  async openProgram(): Promise<void> {
    Loading.init(undefined, 6, true)
    await Windows.openWindow(ProgramWindow.general)
    await Loading.runRequiredStage(texts.checkAdminPrivileges, Checks.hasAdminPrivileges.bind(Checks))

    if (!await Loading.runStage(texts.checkInitial, () => !!Config.initialPath)) {
      Windows.generalWindow!.route(Page.setup)
      
      return Loading.hideLoading()
    }
    
    await Loading.runStage(texts.unpack, Checks.checkInitialChanges.bind(Checks))

    if (!await Loading.runStage(texts.checkFiles, Checks.hasAllPaths.bind(Checks))) {
      return Config.reset()
    }

    await Loading.runRequiredStage(texts.loadGameTexts, Texts.initFromInitial.bind(Texts))
    await Loading.runRequiredStage(texts.loadDlc, Dlc.init.bind(Dlc))
    await Loading.runRequiredStage(texts.loadMods, Mods.procMods.bind(Mods))
    Windows.generalWindow!.route(Page.lists)
  }

  onMultipleInstance() {
    app.exit()
    process.exit(102)
  }

  async beforeQuit() {
    if (!QuitParams.saveJSONs) {
      return
    }
    
    await Promise.all([
      Config.save(),
      Edited.save(),
      Sizes.save(),
      Favorites.save(),
      Mods.save()
    ])
  }

  onAllWindowsClosed() {
    app.quit()
  }

  onError(error: Error) {
    console.error(error.stack || error)
  }
}

new App()
