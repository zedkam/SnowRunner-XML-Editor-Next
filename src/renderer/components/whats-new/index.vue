<template>
  <Modal
    v-model:open="isOpen"
    :title="`${texts.whatsNewTitle} ${PROGRAM_VERSION}`"
  >
    <div class="container">
      <VersionInfo :changes="info" />
    </div>

    <template #footer>
      <Button
        key="submit"
        type="primary"
        @click="isOpen = false"
      >
        Ok
      </Button>
    </template>
  </Modal>
</template>

<script lang='ts' setup>
import { Button, Modal } from 'ant-design-vue'
import { computed } from 'vue'
import texts from './texts'
import VersionInfo from './version-info.vue'
import { PROGRAM_VERSION } from '/consts'
import { Config } from '/mods/renderer'
import { BaseLocalization } from '/utils/texts/base-localization'

/** Открыто ли модальное окно. */
const isOpen = defineModel<boolean>({ required: true })
const info = computed(() => new BaseLocalization<string[]>()
  .ru([
    'Добавлены Wortek 250T и Derry Savior из DLC 19',
    'Исправлены перепутанные изображения Mercedes',
    'Новые изображения и параметры читаются из установленной игры'
  ])
  .en([
    'Added Wortek 250T and Derry Savior from DLC 19',
    'Corrected the swapped Mercedes images',
    'New images and baseline values are read from the installed game'
  ])
  .de([
    'Programmkomponenten wurden aktualisiert',
    'Neue Autobilder hinzugefügt',
    'Standardeinstellungen wurden aktualisiert'
  ])
  .ch([
    '更新的程序组件',
    '新增新车图片',
    '标准参数已更新'
  ])
  .get(Config)
)
</script>

<style lang='scss' scoped>
.container {
  overflow: auto;
  background-color: white;
}
</style>
