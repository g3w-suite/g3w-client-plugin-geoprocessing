import i18n        from './i18n'
import ModelPanel  from './components/ModelPanel.vue';
import FormInputs  from './form/inputs';
import FormOutputs from './form/outputs';

const { Plugin }                 = g3wsdk.core.plugin;
const { ProjectsRegistry }       = g3wsdk.core.project;
const { GUI, Panel }             = g3wsdk.gui;

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

    this.emitChangeSelectedFeatures            = () => this.emit('change-selected-features');
    this.registersSelectedFeatureLayersEvent   = this.registersSelectedFeatureLayersEvent.bind(this);
    this.unregistersSelectedFeatureLayersEvent = this.unregistersSelectedFeatureLayersEvent.bind(this);

    //store layer fields base on layerId and datatype
    this.layerFields = {};

    // transpile model inputs As editing form inputs
    // manage and adapt model inputs with all input editing attributes needed
    (this.config.models || []).forEach(model => {
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
      this.createSideBarComponent({
        data: () => ({ models: this.config.models, service: this }),
        template: /* html */`
          <ul
            id    = "g3w-client-plugin-qprocessing"
            class = "treeview-menu g3w-tools menu-items"
          >
            <li
              v-for       = "model in models"
              :key        = "model.id"
              @click.stop = "service.showPanel(model)"
            >
              <i :class="g3wtemplate.getFontClass('tool')"></i>
              <span>{{ model.display_name }}</span>
            </li>
          </ul>
        `,
      }, {
        id: 'qprocessing',
        title: `plugins.qprocessing.title`,
        collapsible: true,
        open: false,
        isolate: false,
        iconColor: 'green',
        icon: 'tools',
        mobile: true,
        sidebarOptions: {
          position: "spatialbookmarks"                     // can be a number or a string
        }
      });

      this.setHookLoading({loading: false});

      this.setReady(true);
    });
  }

  showPanel(model) {
    new Panel({
      id: `qprocessing-panel`,
      title: `plugins.qprocessing.title`,
      internalPanel: new (Vue.extend(ModelPanel))({
        propsData: { model },
        components: { ...FormInputs, ...FormOutputs }
      }),
      show: true,
    });
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
   * @param features
   * @param name
   * @param crs
   * @returns {File}
   */
  createGeoJSONFile({features=[], name, crs}={}) {
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
    const json = await response.json();
    if (json.result) {
      return {
        key: file.name,
        value: `file:${json.data.file}`
      }
    }

  }

}