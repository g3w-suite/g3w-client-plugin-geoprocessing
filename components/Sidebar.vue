<template>
  <ul
    id="g3w-client-plugin-qprocessing"
    class="treeview-menu g3w-search g3w-tools menu-items"
  >
    <li
      v-for       = "model in models"
      :key        = "model.id"
      class       = "menu-item"
      @click.stop = "showPanel(model)">
      <i :class="g3wtemplate.getFontClass('tool')"></i>
      <span>{{ model.display_name }}</span>
    </li>
  </ul>
</template>

<script>
import ModelPanel   from '../components/ModelPanel.vue';

const { Panel } = g3wsdk.gui;

export default {
  name: "qprocessing-sidebar",
  data() {
    return {
      models: g3wsdk.core.plugin.PluginsRegistry.getPlugin('qprocessing').getService().config.models //get model from server plugin config
    };
  },
  methods:{
    showPanel(model) {
      console.log(this, model);
      new Panel({
        id: `qprocessing-panel`,
        title: `plugins.qprocessing.title`,
        internalPanel: new (Vue.extend(ModelPanel))({ propsData: { model } }),
        show: true,
      });
    }
  },
}
</script>

<style scoped>
  li {
    color: #fff;
    padding: 1em;
  }
  p {
    white-space: normal;
  }
</style>
