import i18n             from './i18n'
import SidebarComponent from './components/Sidebar.vue';

const { Plugin }                 = g3wsdk.core.plugin;
const { isSameBaseGeometryType } = g3wsdk.core.geoutils;
const { ProjectsRegistry }       = g3wsdk.core.project;
const { GUI }                    = g3wsdk.gui;

new class extends Plugin {
  constructor() {
    super({
      name: 'qprocessing',
      i18n,
    });

    if (!this.registerPlugin(this.config.gid)) {
      return;
    }

    // Show loading plugin icon
    this.setHookLoading({ loading: true });

    this.registersSelectedFeatureLayersEvent = this.registersSelectedFeatureLayersEvent.bind(this);
    this.emitChangeSelectedFeatures = this.emitChangeSelectedFeatures.bind(this);

    //prefix file value to recognize which kind of file is loading
    this.prefixCustomLayer = {
      file: 'file',
      external: '__g3w__external__'
    };

    //store layer fields base on layerId and datatype
    this.layerFields = {};

    // transpile model inputs As editing form inputs
    // manage and adapt model inputs with all input editing attributes needed
    this.config.models?.forEach(model => {
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

    GUI.isReady().then(() => {
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
  }

  /**
   * Method that emit change selected feature when a layer feature selection change
   */
  emitChangeSelectedFeatures() {
    this.emit('change-selected-features');
  }

  /**
   * Register event on source selectionLayer
   * @param layerId
   */
  registersSelectedFeatureLayersEvent() {
    GUI.getService('map').defaultsLayers.selectionLayer.getSource().on('addfeature', this.emitChangeSelectedFeatures);
    GUI.getService('map').defaultsLayers.selectionLayer.getSource().on('removefeature', this.emitChangeSelectedFeatures);
  }

  /**
   * Unregister Select Features events
   */
  unregistersSelectedFeatureLayersEvent() {
    GUI.getService('map').defaultsLayers.selectionLayer.getSource().un('addfeature', this.emitChangeSelectedFeatures);
    GUI.getService('map').defaultsLayers.selectionLayer.getSource().un('removefeature', this.emitChangeSelectedFeatures);
  }

  /**
   *
   * @param layer external layer Object
   * @param datatypes Array
   * @returns {boolean}
   */
  isExternalLayerValidForInputDatatypes({ layer, datatypes=[] }={}) {
    return (
      undefined !== datatypes.find(type => 'anygeometry' === type) ||
      undefined !== this.fromInputDatatypesToOLGeometryTypes(datatypes).find(type => isSameBaseGeometryType(type, layer.geometryType))
    )
  }

  /**
   * Convert datatype input vector layer to Ol geometries type
   * @param datatypes
   * @returns {*}
   */
  fromInputDatatypesToOLGeometryTypes(datatypes=[]) {
    return datatypes
      .filter(type => -1 !== ['point', 'line', 'polygon'].indexOf(type))
      .map(type => ({ 'point': 'Point', 'line': 'LineString', 'polygon': 'Polygon' })[type]);
  }

  /**
   *
   * @param features
   * @param name
   * @param crs
   * @returns {File}
   */
  createGeoJSONFileFromOLFeatures({features=[], name, crs}={}) {
    return new File(
      [JSON.stringify(Object.assign(
        (new ol.format.GeoJSON()).writeFeaturesObject(features), {
          crs: {
            type: "name",
            properties: {
              "name": crs || GUI.getService('map').getCrs() //add crs to geojsonObject
            }
          }
        }))],
      `${name}.geojson`,
      {
        type: "application/geo+json",
      }
    );
  }

  /*
   * Upload file
   */
  async uploadFile({modelId, inputName, file}) {
    //create form data instance
    const data = new FormData();
    data.append('file', file);
    const response = await fetch(`${this.config.urls.upload}${modelId}/${ProjectsRegistry.getCurrentProject().getId()}/${inputName}/`, {
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

  }

}