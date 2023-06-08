const {utils: {base, inherit}, plugin:{PluginService}} = g3wsdk.core;
const {ProjectsRegistry} = g3wsdk.core.project;
const {TaskService} = g3wsdk.core.task;
const {GUI} = g3wsdk.gui;

function Service(){
  base();
  /**
   *
   * @param config <Object> Plugin config object
   */
  this.init = function(config={}){

    this.config = config;

    this.transpilModelInputsAsEditingFormInputs();

    this.mapService = GUI.getService('map');

    this.project = ProjectsRegistry.getCurrentProject();

    this.emit('ready', true);
  };

  /**
   * @TODO
   */
  this.transpilModelInputsAsEditingFormInputs = function(){
    this.config.models.forEach(model => {
      model.inputs.forEach(input => {
        input.visible = true; // set visibility of input
        input.validate = {
          empty: true,
          message: null,
          required: true,
          unique: false,
          valid: false,
          _valid: false,
          ...input.validate
        }
      })
    })
  };

  /**
   * Method to check if a layer has selected features
   * @param layerId
   * @returns {*}
   */
  this.hasLayerSelectedFeatures = function(layerId){
    return this.mapService.defaultsLayers.selectionLayer
      .getSource()
      .getFeatures()
      .find(feature => feature.__layerId === layerId);
  }

  /**
   * Get all Project Vector Layers that has geometry types
   * @param geometry_types <Array> of Geometry types Es.Linestring, etc..
   * return <Array>
   */
  this.getVectorProjectLayersByGeometryTypes = function(geometry_types=[]){
    const layers = [];
    this.project.getLayers().forEach(layer => {
      if (layer.geometrytype && geometry_types.indexOf(layer.geometrytype) !== -1) {
        layers.push({
          key: layer.name,
          value: layer.id
        })
      }
    })
    return layers;
  };

  /**
   * Method to run model
   * @param model
   * @returns {Promise<unknown>}
   */
  this.runModel = async function({model, state}={}){
    return new Promise(async (resolve, reject) => {
      let timeoutprogressintervall;
      /**
       * listener method to handle task request
       * @param task_id
       * @param timeout
       * @param response
       */
      const listener = ({task_id, timeout, response}) => {
        const {result, progress, task_result, status} = response;
        // in case of complete
        if (status === 'complete') {
          TaskService.stopTask({
            task_id
          });
          timeoutprogressintervall = null;
          resolve({
            result,
            task_result,
          });
        }
        else if (status === 'executing') {
          if (state.progress === null || state.progress === undefined) {
            timeoutprogressintervall = Date.now();
          } else {
            if (progress > state.progress) timeoutprogressintervall = Date.now();
            else {
              if ((Date.now() - timeoutprogressintervall) > 600000){
                TaskService.stopTask({
                  task_id
                });
                GUI.showUserMessage({
                  type: 'warning',
                  message: 'Timeout',
                  autoclose: true
                });
                state.progress = null;
                timeoutprogressintervall = null;
                reject({
                  timeout: true
                })
              }
            }
          }
          state.progress = progress;
        } else if ( status === '500') {
          const {status, exception} = response.responseJSON || {};
          const statusError = status === 'error';
          state.progress = null;
          timeoutprogressintervall = null;
          TaskService.stopTask({
            task_id
          });
          GUI.showUserMessage({
            type: 'alert',
            message: statusError ? exception : 'server_error',
            textMessage: statusError
          });
          reject({
            statusError,
            timeout: false
          })
        }
      };
      // start to run Task
      await TaskService.runTask({
        url: '', // url model
        taskUrl: this.urls.task, // url to ask task is end
        params: {}, // request params
        method: 'POST',
        listener
      })
    })
  }
}

inherit(Service, PluginService);

export default new Service()