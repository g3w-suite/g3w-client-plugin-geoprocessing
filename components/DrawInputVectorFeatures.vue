<template>
  <div
    class = "qprocessing-draw-vector-features"
    style = "font-size: 1.3em;"
  >
    <button
      class               = "btn skin-background-color"
      style               = "height: 100%; margin-right: 0 !important;"
      @click.stop.prevent = "toggled = !toggled"
    >
      <i :class="[g3wtemplate.getFontClass('pencil')]"></i>
    </button>
  </div>
</template>

<script>

const { GUI }     = g3wsdk.gui;
const { tPlugin } = g3wsdk.core.i18n;

const DRAW_GEOMETRY_TYPES = {
  point: 'Point',
  line: 'LineString',
  polygon: 'Polygon'
};

/**
 * GeoJSON Format used to:
 *
 * - Read geojson when `TYPE = loadPOI`
 * - Write Polyogn, Circle or Point feature draw by map control
 */

export default {
  name: "DrawInputVectorFeatures",
  props: {
    datatypes: {
      type: Array, //array of datatypes from input
      default: []
    },
    upload:{
      type: Boolean, //Boolean when file is upload ot not
    }
  },
  data() {
    return {
      toggled: false, //draw button toggled
      drawTool: {
        loading: this.upload,
        disabled: true
      }
    }
  },
  methods: {
    /**
     *  Method when change draw type geometry (Point, Polygon ...)
      * @param type
     */
    changeDrawType(type) {
      this.setDrawInteraction(type);
    },

    /**
     * Method that handle draw interaction flow
      * @param type
     */
    setDrawInteraction(type=this.drawGeometryTypes[0]){

      //disable click map controls to avoid conflicts
      GUI.getService('map').disableClickMapControls(true);

      //clear eventually previous features
      this.drawLayer.getSource().clear();

      //remove eventually previous draw interaction
      GUI.getService('map').getMap().removeInteraction(this.drawInteraction);

      //create draw interaction
      this.drawInteraction = new ol.interaction.Draw({
        type,
        source: this.drawLayer.getSource()
      });

      //when drawend enable upload button
      this.drawInteraction.on('drawend', () => this.drawTool.disabled = false);

      // add interaction to Map
      GUI.getService('map').getMap().addInteraction(this.drawInteraction);

    },
    /**
     *  Clear
      */
    clear() {
      this.drawLayer.getSource().clear();
      GUI.getService('map').disableClickMapControls(false);
      GUI.getService('map').getMap().removeInteraction(this.drawInteraction);
      GUI.closeUserMessage();
    },

  },
  watch: {
    //listen toggled button
    toggled(bool){
      if (bool) {
        //set start interaction
        this.setDrawInteraction();
        //whow tool component
        GUI.showUserMessage({
          title: '', //@TODO add translation title
          type: 'tool',
          size: 'small',
          closable: false,
          hooks: {
            body: {
              template: /* html */`
                <div style="width: 100%; padding: 5px;" v-disabled="state.loading">
                <!-- NB: it makes use of built-in g3w-client directive: "v-select2" -->
                <select
                  v-select2 = "'type'"
                  :search   = "false"
                  ref       = "select"
                  style     = "width: 100%">
                  <option
                    v-for      = "type in types"
                    :key       = "type"
                    :value     = "type"
                    v-t-plugin = "'qprocessing.draw_types.'+type"
                  ></option>
                </select>

                <bar-loader :loading="state.loading"/>

                <button
                  v-disabled="state.disabled"
                  class="btn skin-background-color"
                  @click.stop.prevent="uploadLayer(type)"
                  style="margin: 3px; width: 100%">
                  <i :class="[g3wtemplate.getFontClass('cloud-upload')]"></i>
                </button>

                </div>`,
              data: () => {
                return {
                  state: this.drawTool,
                  types: this.drawGeometryTypes,
                  type: this.drawGeometryTypes[0]
                };
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
                uploadLayer: async (type) => {
                  const qprocessing = g3wsdk.core.plugin.PluginsRegistry.getPlugin('qprocessing');

                  const features = this.drawLayer.getSource().getFeatures();
                  await this.$nextTick();
                  //crate file
                  const file = qprocessing.createGeoJSONFile({
                    features,
                    name: `${tPlugin('qprocessing.draw_filename')}(${tPlugin('qprocessing.draw_types.'+type)})`
                  });
                  //emit event
                  this.$emit('add-layer', {
                    file,
                    features,
                    type: 'draw'
                  });
                }
              },
            }
          }
       });
      } else {
        //clear
        this.clear();
      }
      this.$emit('toggled-tool', !bool);
    },
    upload(bool){
      //listen upload status. Boolean
      this.drawTool.loading = bool;
      this.drawTool.disabled = !bool;
        if (!bool) {
          this.clear();
          this.toggled = bool;
      }
    }
  },
  created() {

    //set geometries type
    this.drawGeometryTypes = Object.entries(DRAW_GEOMETRY_TYPES).reduce((accumulator, [type, olGeometry]) => {
      if (this.datatypes.find(datatype => datatype === 'anygeometry')){
        accumulator.push(olGeometry);
      } else {
        this.datatypes.find(datatype => datatype === type) && accumulator.push(olGeometry)
      }
      return accumulator;
    }, []);

    //init draw interaction to null
    this.drawInteraction = null;

    //create draw layer
    this.drawLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    });

    //add to map
    GUI.getService('map').getMap().addLayer(this.drawLayer);
  },
  beforeDestroy() {
    this.clear();
    GUI.getService('map').getMap().removeLayer(this.drawLayer);
    this.drawLayer = null;
    this.drawInteraction = null;
  }
}
</script>

<style scoped>

</style>