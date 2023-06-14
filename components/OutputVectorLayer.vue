<template>
  <div v-t-tooltip:top.create="state.description">
    <select v-select2="'type'" ref="select2"  class="form-control qprocessing-output-vectorlayer-select">
      <option v-for="({key, value}) in state.input.options.values" :key="key"
        :value="value">{{key}}</option>
    </select>
    <input
      style="width:100%;"
      class="magic-checkbox"
      v-model="checked"
      type="checkbox"
      :id="state.name">
    <label style="margin-top: 10px;" :for="state.name"  v-t-plugin="'qprocessing.outputs.outputvector.open_file_on_map'"></label>
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
  data() {
    this.state.value = this.state.input.options.values[0].value;
    return {
      checked: true,
      type: this.state.value,
    }
  },
  methods: {
    changeSelect(value) {
      this.state.value = value;
    }
  },
  watch: {
    type(value){
      this.changeSelect(value)
    }
  },
  async mounted(){
    await this.$nextTick();
  }
}
</script>

<style scoped>

</style>