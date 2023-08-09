<template>
  <div class="qprocessing-draw-vector-features" style="font-size: 1.3em;">
    <button class="btn skin-background-color" @click.stop.prevent="toggled = !toggled" style="height: 100%; margin-right: 0 !important;">
      <i :class="[g3wtemplate.getFontClass('pencil')]"></i>
    </button>
  </div>
</template>

<script>

const {GUI} = g3wsdk.gui;

import DrawInpuVectorFeaturesSelectionGeometry from "./DrawInpuVectorFeaturesSelectionGeometry.vue";


const DRAW_TYPES = [
  {
    point: 'Point',
  },
  {
    line: 'LineString',
  },
  {
    polygon: 'Polygon'
  }
];

export default {
  name: "DrawInputVectorFeatures",
  props: {
    datatypes: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      toggled: false,
    }
  },
  methods: {
    changeDrawType(type) {
      this.removeDrawInteraction();
      this.addDrawInteraction(type);
    },
    createGeoJSONFile(){
      const file = new File(["foo"], "foo.txt", {
          type: "text/plain",
      });
    },
    addDrawInteraction(type=DRAW_TYPES[0].point){

      GUI.getService('map').disableClickMapControls(true);
      this.drawInteraction = new ol.interaction.Draw({
        type,
        source: this.drawLayer.getSource()
      });

      // add interaction to Map
      GUI.getService('map').getMap().addInteraction(this.drawInteraction);

      GUI.showUserMessage({
        title: '', //@TODO add translation title
        type: 'tool',
        size: 'small',
        closable: false,
        hooks: {
          body:{
            ...DrawInpuVectorFeaturesSelectionGeometry,
            props: {
              types: {
                type: Array,
                default: ['Point', 'LineString']
              }
            },
            watch: {

              /**
               * @listens type change of drawed geometry
               * @fires   change-draw-type
               */
              'type': (type) => {
                  this.changeDrawType(type)
              },

            },

            methods: {
              uploadLayer(){}
            }
          }
        }
      });

    },
    removeDrawInteraction(){
      this.drawLayer.getSource().clear();
      GUI.getService('map').disableClickMapControls(false);
      GUI.getService('map').getMap().addInteraction(this.drawInteraction);
      GUI.closeUserMessage();
    }
  },
  watch: {
    toggled(bool){
      if (bool) {
        this.addDrawInteraction();
      } else {
        this.removeDrawInteraction();
      }
    }
  },
  created(){
    this.drawInteraction = null;
    this.drawLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    })
    GUI.getService('map').getMap().addLayer(this.drawLayer);
  },
  beforeDestroy() {
    this.removeDrawInteraction();
    GUI.getService('map').getMap().removeLayer(this.drawLayer);
    this.drawLayer = null;
    this.drawInteraction = null;
  }
}
</script>

<style scoped>

</style>