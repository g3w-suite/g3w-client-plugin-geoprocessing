<template>
  <div class="qprocessing-model">

    <section class="qprocessing-model-header">
      <div class="skin-color">{{model.display_name.toUpperCase()}}</div>
    </section>

    <!-- MODEL INPUTS SECTION   -->
    <section class="qprocessing-model-inputs">
      <div class="title" >INPUTS</div>
      <divider/>

      <form class="form-horizontal g3w-form">
        <div class="box-primary">
          <div class="box-body">
            <component
              @register-change-input="registerChangeInputEvent"
              @addinput="addToValidate"
              @changeinput="_changeInput(input)"
              v-for="input in model.inputs" :key="input.name"
              :state="input"
              :is="`${input.input.type}_input`"/>
          </div>
        </div>
      </form>

    </section>

    <!-- MODEL OUTPUTS SECTION   -->
    <section class="qprocessing-model-outputs">
      <div class="title">OUTPUTS</div>
      <divider/>
      <form class="form-horizontal g3w-form">
          <div class="box-primary">
            <div class="box-body">
              <component
                @add-result-to-model-results="addResultToModel"
                v-for="output in model.outputs" :key="output.name"
                :state="output"
                :task="task"
                :is="`${output.input.type}`"/>
            </div>
          </div>
        </form>
    </section>

    <!-- MODEL RESULTS SECTION   -->
    <section class="qprocessing-model-results">
      <section style="display: flex; justify-content: space-between; align-items: center">
        <div class="title">RESULTS</div>
        <span
          v-disabled="model.results.length === 0"
          class="icon skin-color skin-border-color"
          :class="[ g3wtemplate.getFontClass('list'), {'pulse': newResults}]"
          @click.stop.prevent="showModelResults">
        </span>

      </section>

      <divider/>

    </section>

    <section class="qprocess-model-footer">
      <div>
        <progressbar
          v-if="state.progress"
          :progress="state.progress"/>

        <template v-else>
            <bar-loader :loading="state.loading"/>
        </template>

        <button
          class="btn skin-background-color run"
          @click.stop="run"
          :disabled="!valid || state.loading">
          <i :class="g3wtemplate.font['run']"></i>
        </button>

        <div v-if="state.message.show">
         <span
          class="message"
          :style="{color: getMessageColor()}"
           v-t-plugin="`qprocessing.run.messages.${state.message.type}`">
         </span>
        </div>

      </div>
    </section>

  </div>
</template>

<script>

import ModelInputs from '../form/inputs';
import ModelOutputs from '../form/outputs';
import Service from '../service';
import ModelResults from '../modelresults';

const {GUI} = g3wsdk.gui;

const { formInputsMixins } = g3wsdk.gui.vue.Mixins;
export default {
  name: "modelPanel",
  mixins: [formInputsMixins],
  components: {
    ...ModelInputs,
    ...ModelOutputs
  },
  props: {
    model: {
      required: true
    }
  },
  data(){
    return {
      state: {
        loading: false,
        progress: null,
        message: {
          type: 'success', // error info
          show: false
        }
      },
      tovalidate: [],
      task: null,
      newResults: false, // set true if new results are add to models
    }
  },
  methods: {
    addResultToModel(data={}){
      const {output, result} = data;
      if ("undefined" !== typeof result) {
        const id = output.name;
         //check if output contain already result
        const findResultOutput = this.model.results.find(result => result.id === id);
        if (findResultOutput) {
          findResultOutput.urls.push(result[output.name])
        } else {
          this.model.results.push({
            id: output.name,
            label: output.label,
            urls: [result[output.name]]
          })
        }

      }
    },
    removeResultFromModel(){

    },
    getMessageColor(){
      switch(this.state.message.type){
        case 'success':
          return 'green';
        case 'error':
          return 'red';
      }
    },

    registerChangeInputEvent({inputName, handler}={}) {

      if ("undefined" === typeof this.subscribe_change_input[inputName]) {
        this.subscribe_change_input[inputName] = []
      }

      this.subscribe_change_input[inputName].push(handler)
    },
    /**
     * Method to handle change input
     * @param input
     */
    async _changeInput(input) {
      //need to wait change value dom
      await this.$nextTick();
      if (Array.isArray(this.subscribe_change_input[input.name])) {
        this.subscribe_change_input[input.name].forEach(handler => handler(input.value))
      }
      //call base changeInput method
      this.changeInput(input);
    },
    /**
     * Run model method
     * @returns {Promise<void>}
     */
    async run(){
      this.state.loading = true;
      this.state.message.show = false;
      await this.$nextTick();
      try {
        this.task = await Service.runModel({
          model: this.model,
          state: this.state
        });
        this.state.message.type = 'success';
      } catch(err){
        this.state.message.type = 'error';
      }

      this.state.loading = false;
      this.state.message.show = true;

    },
    showModelResults(){
      const resultspanel = new ModelResults({model: this.model});
      resultspanel.show();
      this.newResults = false;
    }
  },
  watch: {
    'model.results'(results, oldresults) {
      if (oldresults.length > 0) {
        if (results.length > oldresults.length) {
          this.newResults = true;
        }
      }
    }
  },
  created(){
    this.subscribe_change_input = {};
  },
  async mounted() {
    await this.$nextTick();
    //@TODO
    $('.qprocessing-model-inputs input').keypress((event) => {
      if (event.which === 13) {
        event.preventDefault();
      }
    });
  },
  async beforeDestroy(){}
}
</script>

<style scoped>
  .qprocessing-model {
    padding-bottom: 10px;
  }
  .qprocessing-model-header{
    font-size: 1.3em;
    font-weight: bold;
  }
  .title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  .qprocessing-model-results .icon {
    cursor: pointer;
    border: 2px solid transparent;
    margin-bottom: 8px;
    padding: 3px;
    border-radius: 5px;
  }

  .qprocessing-model-results .icon.pulse {
    transform: scale(1);
    animation: pulse 2s infinite;
  }

  .qprocess-model-footer button.run {
    width: 100%;
  }
  .qprocessing-model-inputs {
    margin-bottom: 5px;
  }
  .qprocessing-model-inputs .g3w-form, .qprocessing-model-outputs .g3w-form {
    background-color: transparent !important;
  }
  .qprocess-model-footer {
    margin-top: 10px;
  }

  .qprocess-model-footer .message {
    font-weight: bold;
  }


  @keyframes pulse {
      0% {
        transform: scale(0.75);
      }

      70% {
        transform: scale(1);
      }

      100% {
        transform: scale(0.75);
      }
  }

</style>