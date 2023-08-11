<template>

  <div class="form-group" v-if="state.visible">

    <slot name="label">
      <label :for="state.name" v-disabled="!state.editable" class="col-sm-12">{{ state.label }}
        <span v-if="state.validate && state.validate.required">*</span>
      </label>
    </slot>

    <div class="col-sm-12">
      <slot name="body">

        <bar-loader :loading="loading"/>

        <select v-select2="'value'"
          :multiple="state.input.options.multiple"
          :id="state.name"
          ref="select"
          style="width:100%;"
          class="form-control">

          <option
            v-if="state.validate.required && !state.input.options.multiple"
            :value="null">---</option>

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

      <div
        v-if="state.help && this.state.help.visible"
        v-html="state.help.message"
        class="g3w_input_help skin-background-color extralighten">
      </div>

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
      loading: false,
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
    'value'(value) {
      // in case of multiple selection
      if (this.state.input.options.multiple) {
        //set input value as values separate by comma
        this.state.value = value.join(',');
        //check if is required
        if (true === this.state.validate.required) {
          //need to check validation
          this.state.validate.valid = value.length > 0;
        }
      } else {
        //case single value
        this.state.value = value;
        // in case of required input value
        if (true === this.state.validate.required) {
          this.state.validate.valid = "" !== value && null !== value;
        }
      }
      //emit change input
      this.$emit('changeinput', this.state);
    },
  },

  methods: {
    /**
     * Get all fields by layers
     * @param layerId
     * @param options
     * @returns {*}
     */
    async getFieldsFromLayer(layerId, options={}){
      this.loading = true;
      const fields = await Service.getFieldsFromLayer(layerId, options);
      this.loading = false;
      return fields;
    },

    changeSelectedFeaturesEventHandler(){
      this.setInputValueFromSelectedFeatures(this.selected_features_checked);
    },
  },

  created() {
    //set it true at beginning to reactivity
    this.state.validate.valid = true;
  },

  async mounted() {
    //if required we set message of not valid input
    if (this.state.validate.required) {
      this.state.validate.message = `qprocessing.inputs.fieldchooser.validate.message.${this.state.input.options.multiple ? 'multiple' : 'single'}`
    }

    await this.$nextTick();
    //set this.select2 element
    this.select2 = $(this.$refs.select);

    //emit register change input to listen parent input layer value and get related fields
    this.$emit('register-change-input', {
      inputName: this.state.input.options.parent_field,
      handler: async (layerId) => {
        //in case of change parent value change, in case of selectefeature need to get only layerId without featuresid
        layerId = layerId.split(':')[0];
        //set values from Input layer fields
        this.state.input.options.values = await this.getFieldsFromLayer(layerId, {
          datatype: this.state.input.options.datatype,
        })
        //check if multiple
        if (this.state.input.options.multiple) {
          //value is set checking if default_all_fields is true, set all options values by defaults, otherwise empty array
          this.value = this.state.input.options.default_to_all_fields ? this.state.input.options.values.map(({value}) => value) : [];
        } else {
          this.value = null;
        }
        // in case of no value or values set value to null
        if (this.value === null || (Array.isArray(this.value) && this.value.length === 0)) {
          this.select2.val(null).trigger('change');
        }
      }
    })

    this.state.validate.valid = !this.state.validate.required;
    //emit add input
    this.$emit('addinput', this.state);
  },
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