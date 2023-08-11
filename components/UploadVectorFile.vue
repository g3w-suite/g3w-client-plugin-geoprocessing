<template>
  <div
    class="qprocessing-upload-vector-file"
    style="flex-grow: 2">

    <section class="upload-file-content">

      <form
        class="addlayer skin-border-color"
        v-t-tooltip:top.create="'mapcontrols.add_layer_control.drag_layer'">

        <input
          ref="file"
          type="file"
          title=" "
          @change="updateFile"
          :accept="accept">

        <div class="drag_and_drop">

          <i
            :class="g3wtemplate.getFontClass('cloud-upload')"
            class="fa-2x"
            aria-hidden="true">
          </i>

        </div>

      </form>
    </section>
  </div>
</template>

<script>

export default {
  name: "UploadVectorFile",
  props: {
    upload: {
      type: Boolean,
    }
  },
  data() {
    return {
      layer: {
        name: null,
        id: null
      }
    }
  },
  methods: {
    updateFile() {
      this.$emit('add-layer', {
        file: this.$refs.file.files[0],
        type: 'upload'
      });
    },
  },
  created(){
    this.accept = [
      'zip',
      'geojson',
      'GEOJSON',
      'kml',
      'kmz',
      'KMZ',
      'KML',
      'json',
      'gpx',
      'gml',
      'csv'].map(format => `.${format}`).join(',')
  }
}
</script>

<style scoped>

  form.addlayer {
    position: relative;
    border: 2px dashed;
    text-align: center;
    border-radius: 3px;
  }

  .addlayer input {
    position: absolute;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    outline: 0;
    opacity: 0;
    cursor: pointer;
    display: block;
  }

  .drag_and_drop {
    line-height: 20px;
    padding: 5px;
    color: #ffffff;
  }

 </style>