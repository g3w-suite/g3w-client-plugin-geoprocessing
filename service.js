const {
  utils: {base, inherit, XHR, downloadFile},
  geoutils: {isSameBaseGeometryType},
  plugin:{PluginService}} = g3wsdk.core;

const {ProjectsRegistry} = g3wsdk.core.project;
const {TaskService} = g3wsdk.core.task;
const {GUI} = g3wsdk.gui;

function Service(){
  base(this);
  const self = this;

  /**
   *
   * @param config <Object> Plugin config object
   */
  this.init = function(config={}){
    //get plugin configuration object
    this.config = config;

    //get map service
    this.mapService = GUI.getService('map');

    // get current project
    this.project = ProjectsRegistry.getCurrentProject();

    //store layer fields base on layerId and datatype
    this.layerFields = {};

    // manage and adapt model inputs with all input editing attributes needed
    this.transpilModelInputsAsEditingFormInputs();

    this.emit('ready', true);
  };

  /**
   * Method to transform/transpile model inputs with the same attributes needed by editing inputs
   */
  this.transpilModelInputsAsEditingFormInputs = function(){
    this.config.models.forEach(model => {
      model.inputs.forEach(input => {
        input.visible = true; // set visibility of input
        // implement validate object
        input.validate = {
          empty: true,
          message: null,
          required: true,
          unique: false,
          valid: false,
          _valid: false,
          ...input.validate
        }
        //set get default value
        input.get_default_value = true;
      })
    })
  };

  /**
   * Method to extract fields from project layerId based on options
   *
   * @param layerId
   * @param options: <Object> datatype
   */
  this.getFieldsFromLayer = async function(layerId, params={}) {
    if ("undefined" === typeof this.layerFields[layerId]) {
      this.layerFields[layerId] = {};
    }
    if ("undefined" === typeof this.layerFields[layerId][JSON.stringify(params)]) {
      try {
        const response = await XHR.get({
          url: `${this.config.urls.fields}${this.project.getId()}/${layerId}/`,
          params
        });
        if (true === response.result) {
          this.layerFields[layerId][JSON.stringify(params)] = response.fields;
        }
      } catch(err) {
      }
    }
    return this.layerFields[layerId][JSON.stringify(params)];

  }

  /**
   * Method that emit change selected feature when a layer feature selection change
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
    return this.mapService
      .defaultsLayers.selectionLayer
      .getSource()
      .getFeatures()
      .filter(feature => feature.__layerId === layerId)
      .map(feature => feature.getId());
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
          (null !== layer.geometrytype) &&
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
              .filter(datatype => ['point', 'line', 'polygon'].indexOf(datatype) !== -1)
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
   * Get all Project Vector Layers that has geometry types
   * @param datatypes <Array> of String
   *   'nogeometry',
   *   'point',
   *   'line',
   *   'polygon',
   *   'anygeometry'
   * return <Array>
   */
  this.getInputPrjRasterLayerData = function(){
    return this.project.getLayers()
      //exclude base layer
      .filter(layer => !layer.baselayer && ("undefined" !== typeof layer.source && layer.source.type === 'gdal'))
      .map(layer => ({
        key: layer.name,
        value: layer.id
      }))
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
        const {result, progress, task_result, status, exception} = response;
        // in case of complete
        if (status === 'complete') {
          TaskService.stopTask({
            task_id
          });
          timeoutprogressintervall = null;
          if (null === task_result) {
            reject({})
          } else {
            resolve({
              result,
              task_result,
            });
          }

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
        }
        else {
          let statusError = false;
          let textMessage = false;
          let message;
          switch(status) {
            case '500':
            case 500:
              message = (response.responseJSON && response.responseJSON.exception) || 'server_error';
              textMessage = "undefined" !== typeof exception;
              statusError = true;
              break;
            case 'error':
              message = exception;
              textMessage = true;
              statusError = true;
              break;
          }

          // in case of status error
          if (statusError) {
            state.progress = null;
            timeoutprogressintervall = null;

            TaskService.stopTask({
              task_id
            });


            GUI.showUserMessage({
              type: 'alert',
              message,
              textMessage
            });

            reject({
              statusError:true,
              timeout: false
            })
          }
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

  /*
  * Upload file
   */
  this.uploadFile = async function({modelId, inputName, file}){
    const data = new FormData();
    data.append('file', file);
    try {
      const response = await fetch(`${this.config.urls.upload}${modelId}/${this.project.getId()}/${inputName}/`, {
        method: 'POST',
        body: data,
      });
      const responseJson = await response.json();
      if (responseJson.result) {
        return {
          key: file.name,
          value: `file:${responseJson.data.file}`
        }
      }

    } catch(err) {
      throw new Error(err);
    }

  };

  /**
   *
   * @param geojson
   */
  this.createGeoJSONFile = function(geojson){
    console.log(geojson)
  }
}

inherit(Service, PluginService);

export default new Service()