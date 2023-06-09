<template>
  <div v-t-tooltip:top.create="state.description">
    <input
      style="width:100%"
      class="magic-checkbox"
      v-model="checked"
      type="checkbox"
      :id="state.name">
    <label :for="state.name"  v-t-plugin="'qprocessing.outputs.outputvector.open_file_on_map'"></label>
  </div>
</template>

<script>

export default {
  name: "OutputVectorLayer",
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data(){
    return {
      checked: true
    }
  }
}
</script>

<style scoped>

</style>