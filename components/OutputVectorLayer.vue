<template>
  <div v-t-tooltip:top.create="state.description" class="form-group">
    <label style="color:#ffffff !important;" :for="state.name" class="col-sm-12">{{state.label}}</label>
    <div class="col-sm-12">
      <select :id="state.name" v-select2="'type'" ref="select2"  class="form-control qprocessing-output-vectorlayer-select">
        <option v-for="({key, value}) in state.input.options.values" :key="key"
          :value="value">{{key}}</option>
      </select>
      <input
        style="width:100%;"
        class="magic-checkbox"
        v-model="checked"
        type="checkbox"
        :id="`${state.name}_checkbox`">
      <label style="margin-top: 10px;" :for="`${state.name}_checkbox`"  v-t-plugin="'qprocessing.outputs.outputvector.open_file_on_map'"></label>
    </div>
  </div>
</template>

<script>

const {GUI} = g3wsdk.gui;
const { uniqueId, getRandomColor} = g3wsdk.core.utils;
const {createVectorLayerFromFile, createStyleFunctionToVectorLayer} = g3wsdk.core.geoutils;
export default {
  name: "OutputVectorLayer",
  props: {
    state: {
      type: Object,
      required: true
    },
    task: {
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
    },
    async task(response={}){
     const {task_result={}} = response;
     //get value from name of the output
     const fileUrl = task_result[this.state.name];
     //add to map
     if (this.checked) {
       let promise, crs, name;
       //need to convert shp to zip to use core geoutils createVectorLayerFromFile method
       const type = this.type !== 'shp' ? this.type : 'zip';
       await fetch(fileUrl).then(async response => {
         try {
           name = response.headers.get("content-disposition").split('filename=')[1].replace(/"/g,'');
         } catch(err){
           name = `${uniqueId()}_${this.type}`;
         }

         const blob = await response.blob();
         // case shapefile or kmz
         if (type === 'zip' || type === 'kmz') {
               promise = Promise.resolve(blob);
           } else { //vase geojson, kml
           promise = new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.addEventListener(
               "load",
               (evt) => {
                   resolve(reader.result)
               }, false);
             reader.readAsText(blob);
           })
           }
           const data = await promise;
           const layer = await createVectorLayerFromFile({
             name,
             data,
             crs: GUI.getService('map').getEpsg(), //@TODO
             mapCrs: GUI.getService('map').getEpsg(),
             type
           });
           layer.setStyle(createStyleFunctionToVectorLayer({
             color: getRandomColor()
           }));
           GUI.getService('map').addExternalLayer(layer, {
             type,
             downloadUrl: fileUrl
           });
       });

     } else { // download
      this.$emit('add-result-to-model-results', {
        output: this.state,
        result: task_result
      })
     }
    }
  },
}
</script>