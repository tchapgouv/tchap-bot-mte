<script setup>

const props = defineProps({
  label: String,
  hasScript: Boolean
})

</script>

<template>
  <p>
    <v-icon v-if="props.hasScript"
            style="margin-bottom: -2px"
            scale="1.5"
            color="#d64d00"
            name="px-warning-box"/>
    {{ props.label }}
  </p>
</template>