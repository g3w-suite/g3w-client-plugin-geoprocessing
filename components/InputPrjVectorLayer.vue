<template>
  <div class="form-group" v-if="visible">
    <slot name="label">
      <label :for="state.name" v-disabled="!state.editable" class="col-sm-12 ">{{ state.label }}
        <span v-if="state.validate && state.validate.required">*</span>
      </label>
    </slot>
    <div class="col-sm-12">
      <slot name="body">
        <select v-select2="'value'" :id="state.name" ref="select" style="width:100%;"  class="form-control">
          <option
             v-for="value in state.input.options.values"
             :key="value.value"
            :value="value.value">{{ value.key }}</option>
        </select>
      </slot>
      <slot name="message">
          <p v-if="notvalid" class="g3w-long-text error-input-message" style="margin: 0" v-html="state.validate.message"></p>
          <p v-else-if="state.info" style="margin: 0 " v-html="state.info"></p>
      </slot>
      <div class="g3w_input_help skin-background-color extralighten" v-if="state.help && this.state.help.visible" v-html="state.help.message">
      </div>
    </div>
  </div>
</template>

<script>
import Service from '../service';
export default {
  name: "InputPrjVectorLayer",
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data(){
    return {
      value: null,
      visible: false
    }
  },
  watch: {
    'value'(value){
      this.state.value = value;
      this.$emit('changeinput', this.state)
    }
  },
  created(){
    this.state.input.options.values = Service.getVectorProjectLayersByGeometryTypes(this.state.input.options.datatypes);
    this.visible = this.state.input.options.values.length > 0;
    if (this.visible) {
      this.value = this.state.input.options.values[0].value;
    }
    this.state.validate.valid = this.visible;

  },
  async mounted(){
    await this.$nextTick();
    this.$emit('addinput', this.state);
  }
}
</script>

<style scoped>
  //Replicate same scoped style in InputBase.vue
  label {
    text-align: left !important;
    padding-top: 0 !important;
    margin-bottom: 3px;
  }
</style>