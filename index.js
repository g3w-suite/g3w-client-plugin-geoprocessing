import pluginConfig from './config';
import Service from "./service";
import SidebarComponent from './components/sidebar.vue';
const {base, inherit} = g3wsdk.core.utils;
const {Plugin: BasePlugin} = g3wsdk.core.plugin;
const {GUI} = g3wsdk.gui;

const Plugin = function() {
  const {name, i18n} = pluginConfig;
  this.addFontClasses([
    {
      name: 'geo-tools',
      className: "fas fa-tools"
    }
  ]);
  base(this, {
    name,
    i18n,
    service: Service
  });
  if (this.registerPlugin(this.config.gid)) {
    // Show loading plugin icon
    this.setHookLoading({ loading: true });

    this.service.once('ready', () => {
      //plugin registry
      if (!GUI.isready) GUI.once('ready', () => this.setupGui());
      else this.setupGui();
    
      // Hide loading plugin icon
      this.setHookLoading({ loading: false });
    
      this.setReady(true);
    });
    
    //initialize service
    this.service.init(this.config);
  } 
  
};

inherit(Plugin, BasePlugin);

/**
 * Add a custom button on left sidebar (g3w-client)
 */
Plugin.prototype.setupGui = function() {
  this.createSideBarComponent(SidebarComponent,
    {
      id: name,
      title: 'Geoprocessing',
      collapsible: true,
      open: false,
      isolate: false,
      iconConfig: {
        color: 'red',
        icon: 'geo-tools',
      },
      mobile: true,
      /**
       * event called
       */
      events: {
        open: {
          when: 'before',
          cb:()=> { /* TODO: add sample usage */ }
        }
      },
      sidebarOptions: {
        position: 'spatialbookmarks'                     // can be a number or a string
      }
    }
  );
};

new Plugin();