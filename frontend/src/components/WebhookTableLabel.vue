<script setup>

const props = defineProps({
  label: String,
  hasScript: Boolean,
  isInternet: Boolean,
  lastUseEpoch: Number,
  webhook_id: String,
  expired: Boolean,
  loading: Boolean,
  error: Boolean,
  errorReason: String
})

</script>

<template>
  <p>
    <VIcon v-if="loading"
           style="margin-bottom: -2px"
           scale="1.5"
           color="var(--text-default-grey)"
           title="Vérifications en cours"
           label="Vérifications en cours"
           name="md-rotateright-round"/>
    <VIcon v-if="error"
           style="margin-bottom: -2px"
           scale="1.5"
           color="var(--error-425-625)"
           :title="'Erreur (' + errorReason + ')'"
           :label="'Erreur (' + errorReason + ')'"
           name="md-thumbdownoffalt"/>
    <VIcon v-if="props.hasScript"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Avec script custom"
           label="Avec script custom"
           color="var(--warning-425-625)"
           name="px-warning-box"/>
    <VIcon v-if="props.isInternet"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Accessible depuis internet"
           label="Accessible depuis internet"
           color="var(--green-emeraude-sun-425-moon-753)"
           name="gi-biohazard"/>
    <VIcon v-if="expired"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Inutilisé"
           label="Inutilisé"
           color="var(--text-default-grey)"
           name="gi-dead-wood"/>
    {{ props.label }}
  </p>
</template>