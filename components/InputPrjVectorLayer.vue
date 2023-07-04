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
            :value="value.value">{{ value.key }}</option>
        </select>
        <div class="prjvectorlayerfeature-only-selected-features" v-if="isSelectedFeatures" v-disabled="selected_features_disabled">
          <input style="width:100%;"
            class="magic-checkbox"
            v-model="selected_features_checked"
            type="checkbox"
            :id="`${state.name}_checkbox`">
          <label style="margin-top: 10px;" :for="`${state.name}_checkbox`" v-t-plugin="'qprocessing.inputs.prjvectorlayerfeature.selected_features'"></label>
          </div>

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
const { selectMixin } = g3wsdk.gui.vue.Mixins;

export default {
  name: "InputPrjVectorLayer",
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
      selected_features_checked: false,
      selected_features_disabled: true
    }
  },
  computed: {
    isSelectedFeatures(){
      return this.state.input.type === 'prjvectorlayerfeature';
    },
    notvalid() {
      return this.state.validate.valid === false;
    }
  },
  watch: {
    //listen change of value (input select)
    'value': {
      handler(value) {
        if (true === this.isSelectedFeatures) {
          this.setDisabledSelectFeaturesCheckbox(value);
        }
        this.state.value = value;
        this.$emit('changeinput', this.state);
      },
      immediate: true
    },
    //Listen selected feature checkbox event change
    'selected_features_checked'(checked) {
      this.setInputValueFromSelectedFeatures(checked);
    }
  },
  methods: {
    /**
     * @TODO
     * @param layerId
     */
    setDisabledSelectFeaturesCheckbox(layerId){
      this.selected_features_disabled = Service.getLayerSelectedFeaturesIds(layerId).length === 0;
      //in case go disabled, uncheck checkbox
      if (true === this.selected_features_disabled) {
        this.selected_features_checked = false;
      }
    },
    /**
     *Set input layer value based on selected feature id or not
     * @param checked
     */
    setInputValueFromSelectedFeatures(checked) {
      const currentLayerFeatureSelectedIds = Service.getLayerSelectedFeaturesIds(this.value);
      if (true === checked && currentLayerFeatureSelectedIds.length > 0) {
        this.state.value = `${this.value}:${currentLayerFeatureSelectedIds.join(',')}`
      } else {
        this.state.value = this.value;
      }
      this.$emit('changeinput', this.state);
    },
    changeSelectedFeaturesEventHandler(){
      this.setDisabledSelectFeaturesCheckbox(this.value);
      this.setInputValueFromSelectedFeatures(this.selected_features_checked);
    }
  },
  created() {
    this.state.input.options.values = Service.getInputPrjVectorLayerData(this.state.input.options.datatypes);

    if (this.state.input.options.values.length > 0) {
      this.value = this.state.input.options.values[0].value;
      this.state.validate.valid = true;
    }

    //In case of selected features
    if (null !== this.value && this.isSelectedFeatures) {
      this.selected_features_id = []; // create array of selected id features
      //register
      Service.registersSelectedFeatureLayersEvent();
      Service.on('change-selected-features', this.changeSelectedFeaturesEventHandler.bind(this));
    }


  },
  async mounted(){
    await this.$nextTick();
    this.select2 = $(this.$refs.select);
    this.$emit('addinput', this.state);

  },
  beforeDestroy(){
    if (true === this.isSelectedFeatures) {
      Service.unregistersSelectedFeatureLayersEvent();
      Service.removeAllListeners('change-selected-features');
    }
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