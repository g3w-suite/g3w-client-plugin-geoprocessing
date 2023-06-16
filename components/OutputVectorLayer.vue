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
        :id="state.name">
      <label style="margin-top: 10px;" :for="state.name"  v-t-plugin="'qprocessing.outputs.outputvector.open_file_on_map'"></label>
    </div>
  </div>
</template>

<script>

const {GUI} = g3wsdk.gui;
const {downloadFile, uniqueId} = g3wsdk.core.utils;
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
    console.log(this.state)
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
     const fileUrl = task_result[this.state.name];
     //add to map
     if (this.checked) {
       let promise, crs, name;
       //need to convert shp to zip to use core geoutils createVectorLayerFromFile method
       const type = this.type !== 'shp' ? this.type : 'zip';
       await fetch(fileUrl).then(async response => {
         try {
           name = response.headers.get("content-disposition").split('filename=')[1].replace(/"/g,'');
           console.log(name)
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
             crs: GUI.getService('map').getEpsg(),
             mapCrs: GUI.getService('map').getEpsg(),
             type
           });
           layer.setStyle(createStyleFunctionToVectorLayer({
             color: 'blue'
           }));
           GUI.getService('map').addExternalLayer(layer, {type});
       });

     } else { // download
      downloadFile({url: fileUrl})
     }
    }
  },
  async mounted(){
    await this.$nextTick();
  }
}
</script>

<style scoped>

</style>