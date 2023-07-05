<template>
  <div class="qprocessing-model">

    <section class="qprocessing-model-header">
      <div class="skin-color">{{model.display_name.toUpperCase()}}</div>
    </section>

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

    <section class="qprocessing-model-outputs">
      <div class="title">OUTPUTS</div>
      <divider/>
      <form class="form-horizontal g3w-form">
          <div class="box-primary">
            <div class="box-body">
              <component
                v-for="output in model.outputs" :key="output.name"
                :state="output"
                :task="task"
                :is="`${output.input.type}`"/>
            </div>
          </div>
        </form>
    </section>

    <section class="qprocess-model-footer">
      <div>
        <progressbar :progress="state.progress"/>
        <button
            class="btn skin-background-color run"
            @click.stop="run"
            :disabled="!valid">
          <i :class="g3wtemplate.font['run']"></i>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import ModelInputs from '../form/inputs';
import ModelOutputs from '../form/outputs';
import Service from '../service';

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
      },
      tovalidate: [],
      task: null
    }
  },
  methods: {
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
      this.loading = true;
      try {
        this.task = await Service.runModel({
          model: this.model,
          state: this.state
        });
      } catch(err){
        console.log(err)
      }

      this.loading = false;
    }
  },
  created(){
    this.subscribe_change_input = {};
  },
  async mounted() {},
  async beforeDestroy(){}
}
</script>

<style scoped>
  .qprocessing-model-header{
    font-size: 1.3em;
    font-weight: bold;
  }
  .title {
    font-weight: bold;
    margin-bottom: 5px;
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
</style>