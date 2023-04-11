import pluginConfig from './config';
import Service from "./service";
import SidebarComponent from './components/sidebar.vue';
const {base, inherit} = g3wsdk.core.utils;
const {Plugin: BasePlugin} = g3wsdk.core.plugin;
const {GUI} = g3wsdk.gui;

const Plugin = function() {
  const {name, i18n} = pluginConfig;
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
      title: 'Custom Sidebar Component', // textual description on left sidebar (eg. "metadata")
      collapsible: true,                 // true = collapsible button; false = button
      open: false,                       // if (collapsible) expand the button when plugin is loaded
      isolate: false,                    // true = click event doesn't propagate to all sidebar item
      iconConfig: {
        color: 'yellow',                 // color of icon
        icon:'pin',                      // see gui\vue\vueappplugin.js font list
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
        position: 0                     // can be a number or a string 
      }
    }
  );
};

new Plugin();