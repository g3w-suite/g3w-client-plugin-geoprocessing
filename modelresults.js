import pluginConfig  from './config';

import ModelResultsVueComponent from './components/ModelResults.vue';
const {base, inherit} = g3wsdk.core.utils;
const {Panel} = g3wsdk.gui;

function ModelResults(options={}) {
  base(this, {
    id: `${pluginConfig.name}-panel-results`,
    title: `${options.model.display_name.toUpperCase()}`,
  });
  const ModelResultsVueComponentClass = Vue.extend(ModelResultsVueComponent);
  const internalPanel = new ModelResultsVueComponentClass({
    propsData: {
      model: options.model,
    }
  });
  this.setInternalPanel(internalPanel);
}

inherit(ModelResults, Panel);

export default ModelResults;
