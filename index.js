import i18n             from './i18n'
import SidebarComponent from './components/Sidebar.vue';

const { Plugin }                 = g3wsdk.core.plugin;
const { XHR }                    = g3wsdk.core.utils;
const { isSameBaseGeometryType } = g3wsdk.core.geoutils;
const { PluginService }          = g3wsdk.core.plugin;
const { ProjectsRegistry }       = g3wsdk.core.project;
const { TaskService }            = g3wsdk.core.task;
const { GUI }                    = g3wsdk.gui;

/**
 * @TODO use `.bind(this)` instead
 */
let self;

new class extends Plugin {
  constructor() {
    super({
      name: 'qprocessing',
      i18n,
      service: new class extends PluginService {

        constructor() {
          super();
          self = this;
      
          //prefix file value to recognize which kind of file is loading
          this.prefixCustomLayer = {
            file: 'file',
            external: '__g3w__external__'
          };
        }

        /**
         * Method to extract fields from project layerId based on options
         *
         * @param layerId
         * @param options: <Object> datatype
         */
        async getFieldsFromLayer(layerId, params={}) {
          // Check if it already fills by layerId
          if ("undefined" === typeof this.layerFields[layerId]) {
            this.layerFields[layerId] = {};
          }
          // check if it was fill based on params
          if ("undefined" === typeof this.layerFields[layerId][JSON.stringify(params)]) {
            //check if layerId belong to project layer or is id of temporary upload layer
            if ("undefined" === typeof this.project.getLayers().find(layer => layer.id === layerId)) {
              this.layerFields[layerId][JSON.stringify(params)] = [];
            } else {
              try {
                //do request to api
                const response = await XHR.get({
                  url: `${this.config.urls.fields}${this.project.getId()}/${layerId}/`,
                  params
                });
                if (true === response.result) {
                  this.layerFields[layerId][JSON.stringify(params)] = response.fields;
                }
              } catch(err) {
                console.warn(err);
                return [];
              }
            }
          }
          return this.layerFields[layerId][JSON.stringify(params)];
        }
      
        /**
         * Method that emit change selected feature when a layer feature selection change
         */
        emitChangeSelectedFeatures() {
          self.emit('change-selected-features');
        }
      
        /**
         * Method to check if a layer has selected features
         * @param layerId
         * @returns {*}
         */
        getLayerSelectedFeaturesIds(layerId) {
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
        registersSelectedFeatureLayersEvent() {
          this.mapService.defaultsLayers.selectionLayer.getSource().on('addfeature', self.emitChangeSelectedFeatures);
          this.mapService.defaultsLayers.selectionLayer.getSource().on('removefeature', self.emitChangeSelectedFeatures);
        }
      
        /**
         * Unregister Select Features events
         */
        unregistersSelectedFeatureLayersEvent() {
          this.mapService.defaultsLayers.selectionLayer.getSource().un('addfeature', self.emitChangeSelectedFeatures);
          this.mapService.defaultsLayers.selectionLayer.getSource().un('removefeature', self.emitChangeSelectedFeatures);
        }
      
        /**
         * Register add external layer
         * @param handler Function
         * @param type
         */
        registerAddExternalLayer({
          type='vector',
          handler
        }= {}) {
          return GUI.getService('catalog').onafter('addExternalLayer', ({type:externalLayerType, layer}) =>{
            if (type === externalLayerType) {
              handler(layer);
            }
          });
        }
      
        /*
         Unregister
         */
        unregisterAddExternalLayer(key) {
          GUI.getService('catalog').un('addExternalLayer', key);
        }
      
        /**
         * Convert datatype input vector layer to Ol geometries type
         * @param datatypes
         * @returns {*}
         */
        fromInputDatatypesToOLGeometryTypes(datatypes=[]) {
          return datatypes
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
        }
      
        /**
         * Method to convert external layer to an object useful to input prjvector layer
         * @param layer
         * @returns {{value: string, key}}
         */
        externalVectorLayerToInputPrjVectorLayerValue(layer) {
          return {
            key:layer.name,
            value: `${this.prefixCustomLayer.external}:${layer.id}`
          }
        }
      
      
        /**
         *
         * @param layer external layer Object
         * @param datatypes Array
         * @returns {boolean}
         */
        isExternalLayerValidForInputDatatypes({ layer, datatypes=[] }={}) {
          return (
            ("undefined" !== typeof datatypes.find(data_type => data_type === 'anygeometry')) ||
            ("undefined" !== typeof this.fromInputDatatypesToOLGeometryTypes(datatypes)
              .find(geometry_type => isSameBaseGeometryType(geometry_type, layer.geometryType)
              )
            )
          )
        }
      
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
        getInputPrjVectorLayerData(datatypes=[]) {
          const layers = [];
      
          //check if any geometry layer type is request
          const anygeometry = "undefined" !== typeof datatypes.find(data_type => data_type === 'anygeometry');
          //check if no geometry layer type is request
          const nogeometry = "undefined" !== typeof datatypes.find(data_type => data_type === 'nogeometry');
      
          //get geometry_types only from data_types array
          const geometry_types = this.fromInputDatatypesToOLGeometryTypes(datatypes);
      
          this.project.getLayers()
            //exclude base layer
            .filter(layer => !layer.baselayer)
            .forEach(layer => {
              const key = layer.name;
              const value = layer.id;
              //get layer if it has no geometry
              if (true === nogeometry) {
                if (
                  (true === nogeometry) &&
                  ("undefined" === typeof layer.geometrytype || "NoGeometry" === layer.geometrytype)
                ) {
                  layers.push({key, value})
                  return;
                }
              }
      
              if (
                (null !== layer.geometrytype) &&
                ("undefined" !== typeof layer.geometrytype) &&
                ("NoGeometry" !== layer.geometrytype)
              ) {
                // in the case of any geometry type
                if (true === anygeometry) {
                  layers.push({key, value})
                } else {
                  if (geometry_types.length > 0) {
                    if ("undefined" !== typeof geometry_types.find(geometry_type => isSameBaseGeometryType(geometry_type, layer.geometrytype))) {
                      layers.push({key, value})
                    }
                  }
                }
              }
          })
      
          //check for external
          if (anygeometry || geometry_types.length > 0) {
            //get external layers from catalog
            GUI.getService('catalog').getExternalLayers({
              type: 'vector'
            }).forEach(layer => {
              if (this.isExternalLayerValidForInputDatatypes({
                layer,
                datatypes
              })) {
                layers.push(this.externalVectorLayerToInputPrjVectorLayerValue(layer))
              }
            })
          }
      
          return layers;
        }
      
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
        getInputPrjRasterLayerData() {
          return this.project.getLayers()
            //exclude base layer
            .filter(layer => !layer.baselayer && ("undefined" !== typeof layer.source && layer.source.type === 'gdal'))
            .map(layer => ({
              key: layer.name,
              value: layer.id
            }))
        }
      
        /**
         *
         * @param features
         * @param name
         * @param crs
         * @returns {File}
         */
        createGeoJSONFileFromOLFeatures({features=[], name, crs}={}) {
          const geoJSONFormat = new ol.format.GeoJSON();
          const geoJSONObject = geoJSONFormat.writeFeaturesObject(features);
          geoJSONObject.crs = {
            type: "name",
            properties: {
              "name": crs || this.mapService.getCrs() //add crs to geojsonObject
            }
          }
          return new File(
            [JSON.stringify(geoJSONObject)],
            `${name}.geojson`,
            {
              type: "application/geo+json",
            }
          );
        }
      
        /**
         * TO handle complete task ot sync request model
         * @since v3.7.0
         * @param response server response
         * @param resolve resolve method of a Promise
         * @param reject reject method of a Promise
         * @private
         */
        _handleCompleteModelResponse(response, {
          resolve,
          reject,
        }) {
          let {result, task_result, data} = response;
          //case sync request model return data instead of task_result
          if (data) {
            task_result = data;
          }
          //in case of task_result null
          if (null === task_result || false === result) {
            reject({});
          } else {
            resolve({result, task_result});
          }
        }
      
        /**
         * Handel Async or Sync response error
         * @param response
         * @param reject
         * @private
         */
        _handleErrorModelResponse(response, {
          reject,
        }) {
          const {status, exception} = response;
          let statusError = false;
          let textMessage = false;
          let message;
      
          switch(status) {
            case '500':
            case 500:
              message = (
                response.responseJSON ?
                (response.responseJSON.exception || response.responseJSON.error.message) :
                'server_error'
              );
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
            //show a user message with error
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
      
          return statusError;
        }
      
        /**
         * Method to run model
         * @param model
         * @param state
         * @returns {Promise<unknown>}
         */
        runModel({ model, state } = {}) {
          return new Promise(async (resolve, reject) => {
            let timeoutprogressintervall;
            /**
             * listener method to handle task request
             * @param task_id
             * @param timeout
             * @param response
             */
            const listener = ({task_id, timeout, response}) => {
              const {progress, status} = response;
              // in case of complete
              if (status === 'complete') {
                //stop current task
                TaskService.stopTask({task_id});
                timeoutprogressintervall = null;
                this._handleCompleteModelResponse(response, {
                  resolve,
                  reject
                })
              } else if (status === 'executing') {
                if (state.progress === null || state.progress === undefined) {
                  timeoutprogressintervall = Date.now();
                } else {
                  if (progress > state.progress) {
                    timeoutprogressintervall = Date.now();
                  } else {
                    if ((Date.now() - timeoutprogressintervall) > 600000){
                      TaskService.stopTask({task_id});
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
                const statusError = this._handleErrorModelResponse(response, {
                  reject,
                });
      
                if (statusError) {
                  state.progress = null;
                  timeoutprogressintervall = null;
      
                  //stop task
                  TaskService.stopTask({task_id});
                }
              }
            };
      
            //create inputs parmeters
            const inputs = {};
      
            //Loop through input model
            for (const input of model.inputs) {
              if (input.value) {
                if (
                  (input.input.type === 'prjvectorlayer') &&
                  input.value.startsWith(`${this.prefixCustomLayer.external}:`)
                ) {
                  //extract layer id form input.value
                  const [,layerExternalId] = input.value.split(`${this.prefixCustomLayer.external}:`);
                  //get external layer from catalog service
                  const {crs, name} = GUI.getService('catalog').getExternalLayers({type: 'vector'}).find(layer => layer.id === layerExternalId);
                  //get map ol layer from map
                  const OLlayer = this.mapService.getLayerById(layerExternalId);
                  //create a geojson file from freatures
                  const file = this.createGeoJSONFileFromOLFeatures({
                    name,
                    features: OLlayer.getSource().getFeatures(),
                    crs
                  });
                  //upload file to server
                  try {
                    const {value} = await this.uploadFile({
                      modelId: model.id,
                      inputName: input.name,
                      file
                    });
                    //change input value value from new value
                    input.value = value;
                  } catch(err) {
                    //reject
                    reject(err);
                  }
                }
                inputs[input.name] = input.value;
              }
            }
      
            //create outputs paramter
            const outputs = model.outputs.reduce((accumulator, output) => {
              if (output.value) {
                accumulator[output.name] = output.value;
              }
              return accumulator;
            }, {});
      
            const data = {
              inputs,
              outputs,
            }
      
            const url = `${this.config.urls.run}${model.id}/${this.project.getId()}/` // url model
      
            //Check if configured in async mode
            if (this.config.async) {
              // start to run Task
              TaskService.runTask({
                url,
                taskUrl: this.config.urls.taskinfo, // url to ask task is end
                params: {
                  data: JSON.stringify(data)
                }, // request params
                method: 'POST',
                listener
              })
            } else { //get result directly
              XHR.post({
                url,
                data: JSON.stringify(data),
                contentType: 'application/json'
              })
                .then((response) => {
                  this._handleCompleteModelResponse(response, {
                    resolve,
                    reject
                  })
      
                })
                .catch((response) => {
                  response.status = 500;
                  this._handleErrorModelResponse(response, {
                    reject,
                  });
                })
            }
          })
        }
      
        /*
        * Upload file
         */
        async uploadFile({modelId, inputName, file}) {
          //create form data instance
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
                value: `${this.prefixCustomLayer.file}:${responseJson.data.file}`
              }
            }
      
          } catch(err) {
            throw new Error(err);
          }
      
        }
      
      }
    });

    if (!this.registerPlugin(this.config.gid)) {
      return;
    }
    // Show loading plugin icon
    this.setHookLoading({ loading: true });

    this.service.once('ready', async () => {
      await GUI.isReady();

      this.createSideBarComponent(SidebarComponent, {
        id: 'qprocessing',
        title: `plugins.qprocessing.title`,
        collapsible: true,
        open: false,
        isolate: false,
        iconConfig: {
          color: 'green',
          icon: 'tools',
        },
        mobile: true,
        events: {
          open: {
            when: 'before',
            cb:() => { /* TODO: add sample usage */ }
          }
        },
        sidebarOptions: {
          position: "spatialbookmarks"                     // can be a number or a string
        }
      });

      this.setHookLoading({loading: false});

      this.setReady(true);
    });

    //get plugin configuration object
    this.service.config = this.config;

    //get map service
    this.service.mapService = GUI.getService('map');

    // get a current project
    this.service.project = ProjectsRegistry.getCurrentProject();

    //store layer fields base on layerId and datatype
    this.service.layerFields = {};

    // transpile model inputs As editing form inputs
    // manage and adapt model inputs with all input editing attributes needed
    this.service.config.models.forEach(model => {
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
    });

    //send emit ready
    this.service.emit('ready', true);
  }

}