<template>
  <div class="form-group" v-if="state.visible">
    <slot name="label">
      <label :for="state.name" v-disabled="!state.editable" class="col-sm-12">{{ state.label }}
        <span v-if="state.validate && state.validate.required">*</span>
      </label>
    </slot>
    <div class="col-sm-12">
      <slot name="body">
        <select v-select2="'value'" :id="state.name" ref="select" style="width:100%;"  class="form-control">
          <option
           v-for="value in state.input.options.values"
           :key="value.value"
          :value="value.value">{{ value.key }}
          </option>
        </select>
      </slot>
      <slot name="message">
        <p v-if="notvalid" class="g3w-long-text error-input-message" style="margin: 0" v-html="state.validate.message"></p>
        <p v-else-if="state.info" style="margin: 0 " v-html="state.info"></p>
      </slot>
      <div v-if="state.help && this.state.help.visible" class="g3w_input_help skin-background-color extralighten"  v-html="state.help.message">
      </div>
    </div>
  </div>
</template>

<script>
import Service from '../service';
const { selectMixin } = g3wsdk.gui.vue.Mixins;

export default {
  name: "InputPrjRasterLayer",
  mixins: [selectMixin],
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  data(){
    return {
      value: null,
    }
  },
  computed: {
    notvalid() {
      return this.state.validate.valid === false;
    }
  },
  watch: {
    //listen change of value (input select)
    'value'(value) {
      this.state.value = value;
      this.$emit('changeinput', this.state);
    }
  },
  methods: {},
  created() {

    this.state.input.options.values = Service.getInputPrjRasterLayerData();

    if (this.state.input.options.values.length > 0) {
      this.value = this.state.input.options.values[0].value;
      this.state.validate.valid = true;
    }

  },
  async mounted(){
    await this.$nextTick();
    this.select2 = $(this.$refs.select);
    this.$emit('addinput', this.state);

  },
  beforeDestroy(){}
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