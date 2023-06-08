import pluginConfig  from './config';

import ModelPanelVueComponent from './components/ModelPanel.vue';
const {base, inherit} = g3wsdk.core.utils;
const {Panel} = g3wsdk.gui;

function ModelPanel(options={}) {
  options.id = `${pluginConfig.name}-panel`;
  options.title = `plugins.${pluginConfig.name}.title`;
  base(options);
  const ModelPanelVueComponentClass = Vue.extend(ModelPanelVueComponent);
  const internalPanel = new ModelPanelVueComponentClass({
    propsData: {
      model: options.model,
    }
  });
  this.setInternalPanel(internalPanel);
}

inherit(ModelPanel, Panel);

export default ModelPanel;
