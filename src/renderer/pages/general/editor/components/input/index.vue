<template>
  <Parameter
    :label="label"
    :desc="desc"
    :getter="getter"
    :descriptor="descriptor"
    @change="$emit('change', $event)"
  >
    <template #default="{ onChange, value }">
      <InputTip
        :descriptor="descriptor"
        :areas="areas"
      >
        <InputItem
          :type="type"
          :number-type="numberType"
          :areas="areas ?? descriptor.areas"
          :step="step ?? descriptor.step"
          :value="<any> value"
          :min="min ?? getLimitMin(descriptor.limit)"
          :max="max ?? getLimitMax(descriptor.limit)"
          @change="onChange"
        />
      </InputTip>
    </template>
  </Parameter>
</template>

<script lang='ts' setup>
import type { IInputProps, IParameterProps, ParameterEmits } from '../../types'
import Parameter from '../parameter.vue'
import InputTip from './input-tip.vue'
import InputItem from './item.vue'
import type { EmitsToProps } from '/rend/types'
import type { IAttrDescriptor } from '/mods/xml/game/attributes'

export type InputProps = Props & EmitsToProps<ParameterEmits>

type Value = string | number
type Props = IParameterProps<Value> & Omit<IInputProps, 'value'>

defineProps<Props>()
defineEmits<ParameterEmits>()

function getLimitMin(limit: IAttrDescriptor['limit']) {
  return limit && 'minValue' in limit
    ? limit.minValue
    : undefined
}

function getLimitMax(limit: IAttrDescriptor['limit']) {
  return limit && 'maxValue' in limit
    ? limit.maxValue
    : undefined
}
</script>
