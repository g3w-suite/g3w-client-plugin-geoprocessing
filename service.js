const {
  utils: {base, inherit},
  geoutils: {isSameBaseGeometryType},
  plugin:{PluginService}} = g3wsdk.core;
const {G3W_FID} = g3wsdk.constant;
const {ProjectsRegistry} = g3wsdk.core.project;
const {TaskService} = g3wsdk.core.task;
const {GUI} = g3wsdk.gui;

function Service(){
  base();
  const self = this;

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
        input.get_default_value = true;
      })
    })
  };

  /**
   *
   */
  this.emitChangeSelectedFeatures = function(){
    self.emit('change-selected-features');
  }

  /**
   * Method to check if a layer has selected features
   * @param layerId
   * @returns {*}
   */
  this.getLayerSelectedFeaturesIds = function(layerId){
    return this.mapService.defaultsLayers.selectionLayer
      .getSource()
      .getFeatures()
      .filter(feature => feature.__layerId === layerId).map(feature => feature.get(G3W_FID))
  }

  /**
   * Register event on source selectionLayer
   * @param layerId
   */
  this.registersSelectedFeatureLayersEvent = function(layerId){

    this.mapService.defaultsLayers.selectionLayer.getSource().on('addfeature', self.emitChangeSelectedFeatures);

    this.mapService.defaultsLayers.selectionLayer.getSource().on('removefeature', self.emitChangeSelectedFeatures);

  }


  /**
   * Unregister
   */
  this.unregistersSelectedFeatureLayersEvent = function(){

    this.mapService.defaultsLayers.selectionLayer.getSource().un('addfeature', self.emitChangeSelectedFeatures);

    this.mapService.defaultsLayers.selectionLayer.getSource().un('removefeature', self.emitChangeSelectedFeatures);
  };



  /**
   * Get all Project Vector Layers that has geometry types
   * @param datatypes <Array> of String
   *   'nogeometry',
   *   'point',
   *   'line',
   *   'polygon',
   *   'anygeometry'
   * return <Array>
   */
  this.getInputPrjVectorLayerData = function(datatypes=[]){
    const layers = [];

    //check if any geometry layer type is request
    const anygeometry = "undefined" !== typeof datatypes.find(data_type => data_type === 'anygeometry');
    //check if no geometry layer type is request
    const nogeometry = "undefined" !== typeof datatypes.find(data_type => data_type === 'nogeometry');


    this.project.getLayers()
      //exclude base layer
      .filter(layer => !layer.baselayer)
      .forEach(layer => {
        //get layer if it has no geometry
        if (true === nogeometry) {

          if (
            (true === nogeometry) &&
            ("undefined" === typeof layer.geometrytype || "NoGeometry" === layer.geometrytype)
          ) {
            layers.push({
              key: layer.name,
              value: layer.id
            })
            return;
          }
        }

        if (
          ("undefined" !== typeof layer.geometrytype) &&
          ("NoGeometry" !== layer.geometrytype)
        ) {
          // in case of any geometry type
          if (true === anygeometry) {

            layers.push({
              key: layer.name,
              value: layer.id
            })

          } else {

            //get geometry_types only from data_types array
            const geometry_types = datatypes
              .filter(data_type => ['point', 'line', 'polygon'].indexOf(data_type) !== -1)
              .map(geometry_type => {
                switch (geometry_type){
                  case 'point':
                    return 'Point';
                  case 'line':
                    return 'LineString';
                  case 'polygon':
                    return 'Polygon';
                }
              });

            if (geometry_types.length > 0) {
              if ("undefined" !== typeof geometry_types.find(geometry_type => isSameBaseGeometryType(geometry_type, layer.geometrytype))) {
                layers.push({
                  key: layer.name,
                  value: layer.id
                })
              }
            }
          }
        }
    })
    return layers;
  };

  /**
   * Method to run model
   * @param model
   * @returns {Promise<unknown>}
   */
  this.runModel = function({model, state}={}){
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
        } else if (status === 'executing') {
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
        } else if ( status === '500' || status === 500) {
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
      const data = {
        inputs: model.inputs.reduce((accumulator, input) => {
          if (input.value) {
            accumulator[input.name] = input.value;
          }
          return accumulator;
        }, {}),
        outputs: model.outputs.reduce((accumulator, output) => {
          if (output.value) {
            accumulator[output.name] = output.value;
          }
          return accumulator;
        }, {}),
      }
      // start to run Task
      TaskService.runTask({
        url: `${this.config.urls.run}${model.id}/${this.project.getId()}/`, // url model
        taskUrl: this.config.urls.taskinfo, // url to ask task is end
        params: {
          data: JSON.stringify(data)
        }, // request params
        method: 'POST',
        listener
      })
    })
  }

  /**
   * @TODO
   * @param layer
   */
  this.addOutputVectorLayer = function(layer){}
}

inherit(Service, PluginService);

export default new Service()