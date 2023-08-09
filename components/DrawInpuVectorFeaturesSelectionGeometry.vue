<!--
  @file selects "Draw geometry tool" used by custom map control
-->
<template>
  <div style="width: 100%; padding: 5px;">
    <!-- NB: it makes use of built-in g3w-client directive: "v-select2" -->
    <select
      v-select2 = "'type'"
      :search   = "false"
      ref       = "select"
      style     = "width: 100%"
    >
      <option
        v-for      = "type in types"
        :key       = "type"
        :value     = "type"
        v-t-plugin = "`qprocessing.draw_types.${type}`"
      ></option>
    </select>

    <button class="btn skin-background-color" @click.stop.prevent="uploadLayer" style="margin: 3px; width: 100%">
      <i :class="[g3wtemplate.getFontClass('cloud-upload')]"></i>
    </button>

  </div>
</template>

<script>

export default {
  name: "drawtools",
  data() {
    return {
      type: this.types[0]
    };
  },
};
</script>

<style scoped></style>