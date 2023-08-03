<template>
  <ul id="g3w-client-plugin-qprocessing" class="treeview-menu g3w-search g3w-tools menu-items">
    <li v-for="model in models" :key="model.id" class="menu-item" @click.top="showPanel(model)">
      <i :class="g3wtemplate.getFontClass('tool')"></i>
      <span>{{model.display_name}}</span>
    </li>
  </ul>
</template>

<script>
import ModelPanel from '../modelpanel';
import Service from '../service';
export default {
  name: "qprocessing-sidebar",
  data() {
    return {
      models: Service.config.models
    };
  },
  methods:{
    showPanel(model){
      const panel = new ModelPanel({model});
      panel.show();
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
