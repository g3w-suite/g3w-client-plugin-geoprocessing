<template>
  <div class="qprocessing-model-results">
      <div
        v-if="result.urls.length"
        v-for="result in model.results"
        :key="result.id">
        <h4 style="font-weight: bold">{{result.label}}</h4>

        <divider/>

          <ul
            class="treeview-menu menu-items"
            style="background-color: #2c3b41">

            <li
              v-for="(url, index) in result.urls" :key="url"
              class="menu-item"
              style="display: flex; justify-content: space-between; padding: 5px;">

                <span>{{result.id}}_{{index}}</span>
                <section class="result-section-items">

                    <i
                      :class="g3wtemplate.font['download']"
                      @click.stop.prevent="downloadResult(url)">
                    </i>
                    <i
                      :class="g3wtemplate.font['trash']"
                      style="color: red"
                      @click.stop.prevent="removeResult(index)">
                    </i>

                </section>

            </li>
          </ul>
      </div>
  </div>


</template>

<script>
const {downloadFile} = g3wsdk.core.utils;
const {GUI}          = g3wsdk.gui;

export default {
  name: "ModelResults",
  props: {
    model: {
      type: Object,
    }
  },
  methods: {
    //@since v3.7.0
    removeResult(index) {
      this.result.urls.splice(index, 1);
      if (this.result.urls.length === 0) {
        GUI.popContent();
      }
    },
    downloadResult(url) {
      downloadFile({
        url
      })
    }
  }
}
</script>

<style scoped>
  .result-section-items i {
    padding: 3px;
    cursor: pointer;
    font-weight: bold;
  }
</style>