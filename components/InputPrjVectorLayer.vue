<template>
  <div class="form-group" v-if="state.visible">
    <slot name="label">
      <label
        :for="state.name"
        v-disabled="!state.editable"
        class="col-sm-12">{{ state.label }}
        <span v-if="state.validate && state.validate.required">*</span>
      </label>
    </slot>
    <div class="col-sm-12">

      <section class="vector-tools-context" v-if="showUploadFile" v-disabled="upload">
          <section class="vector-tools">
            <upload-vector-file
              :upload="upload"
              @add-layer="addLayer"/>
            <draw-input-vector-features
              :upload="upload"
              @toggled-tool="showAddTempLayer"
              :datatypes="state.input.options.datatypes"
              @add-layer="addLayer"/>
          </section>
          <section class="vector-tools-message">
            <div v-if="errorUpload" class="error-upload"> Errore </div>
          </section>
      </section>

      <slot name="body">
        <select v-select2="'value'" :id="state.name" ref="select_layer" style="width:100%;"  class="form-control">

          <option
           v-for="value in state.input.options.values"
           :key="value.value"
           :value="value.value">{{ value.key }}
          </option>

        </select>

        <div
          v-if="isSelectedFeatures"
          v-disabled="selected_features_disabled"
          class="prjvectorlayerfeature-only-selected-features">

          <input style="width:100%;"
            class="magic-checkbox"
            v-model="selected_features_checked"
            type="checkbox"
            :id="`${state.name}_checkbox`">

          <label
            style="margin-top: 10px;"
            :for="`${state.name}_checkbox`"
            v-t-plugin="'qprocessing.inputs.prjvectorlayerfeature.selected_features'">
          </label>

        </div>

      </slot>

      <slot name="message">

        <p
          v-if="notvalid"
          class="g3w-long-text error-input-message"
          style="margin: 0"
          v-html="state.validate.message">
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

import UploadVectorFile        from "./UploadVectorFile.vue";
import DrawInputVectorFeatures from "./DrawInputVectorFeatures.vue";
import Service                 from '../service';

const {GUI} = g3wsdk.gui;
const {selectMixin} = g3wsdk.gui.vue.Mixins;

export default {
  name: "InputPrjVectorLayer",
  mixins: [selectMixin],
  components: {
    UploadVectorFile,
    DrawInputVectorFeatures,
  },
  props: {
      modelId: {
      type: Number,
      required: true,
    },
    state: {
      type: Object,
      required: true
    }
  },
  data(){
    return {
      upload: false,
      errorUpload: false,
      value: null,
      selected_features_checked: false,
      selected_features_disabled: true
    }
  },
  computed: {
    /**
     * Check if datatypes contain geometries values
     * @returns Boolean
     */
    showUploadFile(){
      return !!this.state.input.options.datatypes.find(datatype => {
        return (datatype === 'anygeometry') || (['point', 'line', 'polygon'].indexOf(datatype) !== -1);
      });
    },
    //check if it can take in account of selected features
    isSelectedFeatures(){
      return this.state.input.type === 'prjvectorlayerfeature';
    },
    //check if is no valid
    notvalid() {
      return this.state.validate.valid === false;
    }
  },
  methods: {
    //validity of input
    isValid(value) {
      return value !== typeof "undefined" && null !== value;
    },
    /*
    * Show/hide temp tool
    * */
    showAddTempLayer(bool){
      this.addTempLayer.setVisible(bool);
    },
    /*
    *
    * */
    async addLayer({file, features=[]}={}){
     //set initial reactive properties
     this.upload = true;
     this.errorUpload = false;
     try {
       const {key, value} = await Service.uploadFile({
         file,
         inputName: this.state.name,
         modelId: this.modelId,
       });
       //need to add only one external file
       this.state.input.options.values = this.state.input.options.values.filter(({key, value}) => !value.startsWith('file:'));

       //handle temp layer

       this.addTempLayer.getSource().clear(); //clear all eventually previous features
       this.addTempLayer.getSource().addFeatures(features); //add eventually features
       this.addTempLayer.setVisible(true); //visible true

       this.state.input.options.values.push({
         key,
         value
       });

       await this.$nextTick();
       this.value = value;
       //set current select item
       $(this.$refs.select_layer)
        .select2()
        .val(value)
        .trigger('change');

     } catch(err) {
       //In case of error
       this.errorUpload = true;
     }
     //always set upload false
     this.upload = false;
   },
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
    },
  },

  watch: {
    //listen change of value (input select)
    'value'(value) {
      if (true === this.isSelectedFeatures) {
        this.setDisabledSelectFeaturesCheckbox(value);
      }
      this.state.value = value;
      this.state.validate.valid = this.isValid(value);
      this.$emit('changeinput', this.state);
    },
    //Listen selected feature checkbox event change
    'selected_features_checked'(checked) {
      this.setInputValueFromSelectedFeatures(checked);
    }
  },

  created() {
    //set initial values
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

    /**
     * temporary layer filled by upload or draw tools
     */

    this.addTempLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    })

    //add to map
    GUI.getService('map').getMap().addLayer(this.addTempLayer);

    //set initial visibility to false
    this.addTempLayer.setVisible(false);

    //listen add external Layer
    this.keyAddExternal = Service.registerAddExternalLayer({
      type: 'vector',
      handler: (layer) => {
        if (Service.isExternalLayerValidForInputDatatypes({
          layer,
          datatypes: this.state.input.options.datatypes
        })) {
          this.state.input.options.values.push(Service.externalVectorLayerToInputPrjVectorLayerValue(layer));
        }
      }
    })

  },
  async mounted(){
    await this.$nextTick();
    this.select2 = $(this.$refs.select_layer);
    //need to emit add input to validate
    this.$emit('addinput', this.state);
    this.$emit('changeinput', this.state);
  },
  beforeDestroy(){

    if (this.isSelectedFeatures) {
      Service.unregistersSelectedFeatureLayersEvent();
      Service.removeAllListeners('change-selected-features');
    }

    //remove temp layer
    this.addTempLayer.getSource().clear();
    GUI.getService('map').getMap().removeLayer(this.addTempLayer);
    this.addTempLayer = null;
    ///remove external layer
    Service.unregisterAddExternalLayer(this.keyAddExternal);

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
  .vector-tools-context {
    margin-bottom: 5px;
  }

  .vector-tools {
    display: flex;
    justify-content: space-between;
  }
  .vector-tools-message {
    margin: 3px;
  }
  .vector-tools-message .error-upload {
    font-weight: bold;
    color: red;
  }
</style>