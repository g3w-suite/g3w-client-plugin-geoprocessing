<template>

  <div class="form-group" v-if="state.visible">

    <slot name="label">
      <label :for="state.name" v-disabled="!state.editable" class="col-sm-12">{{ state.label }}
        <span v-if="state.validate && state.validate.required">*</span>
      </label>
    </slot>

    <div class="col-sm-12">

      <slot name="body">
        <select v-select2="'value'"
          :multiple="state.input.options.multiple"
          :id="state.name"
          ref="select"
          style="width:100%;"
          class="form-control">
          <option v-if="state.validate.required && !state.input.options.multiple" :value="null"></option>
          <option v-for="value in state.input.options.values"
            :selected="state.input.options.default_to_all_fields"
            :key="value.value"
            :value="value.value">{{ value.key }}
          </option>
        </select>
      </slot>

      <slot name="message">

        <p v-if="notvalid"
          class="g3w-long-text error-input-message"
          style="margin: 0"
           v-t-plugin="state.validate.message">
        </p>

        <p
          v-else-if="state.info"
          style="margin: 0 "
          v-html="state.info">
        </p>

      </slot>

      <div class="g3w_input_help skin-background-color extralighten" v-if="state.help && this.state.help.visible" v-html="state.help.message"></div>
    </div>

  </div>

</template>

<script>

import Service from '../service';
const { baseInputMixin, selectMixin } = g3wsdk.gui.vue.Mixins;

export default {
  name: "InputFieldChooser",

  mixins: [selectMixin],

  props: {
    state: {
      type: Object,
      required: true
    },

  },

  data() {
    return {
      value: this.state.input.options.multiple ? [] : null,
    }
  },

 computed: {
   notvalid(){
    return this.state.validate.valid === false;
   }
 },

  watch: {
    //listen change of value (input select)
    'value': {
      handler(value) {
        if (this.state.input.options.multiple) {
          this.state.value = value.join(',');
          if (true === this.state.validate.required) {
            this.state.validate.valid = value.length > 0;
          }
        } else {
          this.state.value = value;
          if (this.state.validate.required) {
            this.state.validate.valid = "" !== value || null !== value;
          }
        }

        this.$emit('changeinput', this.state);
      },
      immediate: true
    },
  },

  methods: {

    getFieldsFromLayer(layerId, options={}){
      return Service.getFieldsFromLayer(layerId, options);
    },

    changeSelectedFeaturesEventHandler(){
      this.setInputValueFromSelectedFeatures(this.selected_features_checked);
    },
  },

  created() {
    this.$emit('register-change-input', {
      inputName: this.state.input.options.parent_field,
      handler: (layerId) => {
        this.state.input.options.values = this.getFieldsFromLayer(layerId, {
          datatype: this.state.input.options.datatype
        })
        if ("undefined" !== typeof this.select2) {
          if (this.state.input.options.multiple){
            this.value = [];
          } else {
            this.value = null
          }
          this.select2.val(null).trigger('change');
        }

      }
    })

    this.state.validate.valid = true;
    if (this.state.validate.required) {
      this.state.validate.message = `qprocessing.inputs.fieldchooser.validate.message.${this.state.input.options.multiple ? 'multiple' : 'single'}`
    }

  },

  async mounted() {
    await this.$nextTick();
    this.select2 = $(this.$refs.select);
    this.$emit('addinput', this.state);
    this.state.validate.valid = false;
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