const {
  utils: {
    base, inherit
  },
  plugin:{
    PluginService
  }
} = g3wsdk.core;
const {TaskService} = g3wsdk.core.task;
const {GUI} = g3wsdk.gui;

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

  /**
   * Method to run model
   * @param model
   * @returns {Promise<unknown>}
   */
  this.runModel = async function(model){
    return new Promise(async (resolve, reject) => {
      let timeoutprogressintervall;
      let task_progress;
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
          if (task_progress === null || task_progress === undefined) {
            timeoutprogressintervall = Date.now();
          } else {
            if (progress > task_progress) timeoutprogressintervall = Date.now();
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
                task_progress = null;
                timeoutprogressintervall = null;
                reject({
                  timeout: true
                })
              }
            }
          }
          task_progress = progress;
        } else if ( status === '500') {
          const {status, exception} = response.responseJSON || {};
          const statusError = status === 'error';
          task_progress = null;
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
      setTimeout(resolve, 3000)
    })
  }

}

inherit(Service, PluginService);

export default new Service()