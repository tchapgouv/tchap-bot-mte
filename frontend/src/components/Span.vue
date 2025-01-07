<script setup>

const props = defineProps({
  label: String,
  hasScript: Boolean,
  isInternet: Boolean
})

</script>

<template>
  <p>
    <v-icon v-if="props.hasScript"
            style="margin-bottom: -2px"
            scale="1.5"
            color="#d64d00"
            name="px-warning-box"/>
    <v-icon v-if="props.isInternet"
            style="margin-bottom: -2px"
            scale="1.5"
            color="#00FF00"
            name="gi-biohazard"/>
    {{ props.label }}
  </p>
</template>