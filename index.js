import pluginConfig from './config';
import Service from "./service";
import SidebarComponent from './components/Sidebar.vue';
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
      GUI.isReady().then(() => this.setupGui());
      // Hide loading plugin icon

      this.setHookLoading({loading: false});

      this.setReady(true);
    });

    //initialize service
    this.service.init(this.config);
  }

    /**
     * Add a custom button on left sidebar (g3w-client)
     */
    this.setupGui = function() {

      this.createSideBarComponent(SidebarComponent,
        {
          id: pluginConfig.name,
          title: 'Geoprocessing',
          collapsible: true,
          open: false,
          isolate: false,
          iconConfig: {
            color: 'green',
            icon: 'tools',
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
        });
    };
};

inherit(Plugin, BasePlugin);

new Plugin();