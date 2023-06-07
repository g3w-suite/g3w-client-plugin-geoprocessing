<template>
    <ul id="g3w-client-plugin-qprocessing" class="treeview-menu g3w-search g3w-tools menu-items">
        <li v-for="model in models" :key="model.id" class="menu-item" @click.top="showPanel(model)">
            <i :class="g3wtemplate.getFontClass('tool')"></i>
            <span>{{model.name}}</span>
        </li>
    </ul>
</template>

<script>
import ModelPanel from './modepanel';
import Service from '../service';
export default {
    name: "qprocessing-sidebar",
    data(){
      return {
        models: [
          {
            id: 1,
            name: 'Modello 1'
          },
          {
            id: 2,
            name: 'Modello 2'
          }
        ]
      };
    },
    computed: {},
    methods:{
      showPanel(model){
        const panel = new ModelPanel({
            model
        });
        panel.show()
      }
    },
    created() {}
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
