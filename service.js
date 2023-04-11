const {base, inherit} = g3wsdk.core.utils;
const {PluginService} = g3wsdk.core.plugin;

function Service(){
  base();
  /**
   * get plugin config object
   * @param config
   */
  this.init = function(config={}){
    /**
     *  PLUGIN SERVICE INIT FUNCTION
     */
    this.emit('ready', true);
  };

}

inherit(Service, PluginService);

export default new Service()