<template>
  <div class="qprocessing-model">

    <section class="qprocessing-model-header">
      <div class="title">{{$options.model.name.toUpperCase()}}</div>
    </section>

    <section class="qprocessing-model-inputs">
    </section>

    <section class="qprocessing-model-outputs">
    </section>

    <section class="qprocess-model-footer">
      <div>
        <bar-loader :loading="loading"/>
        <button class="btn skin-background-color run"  @click.stop="run" :disabled="valid">
          <i :class="g3wtemplate.font['run']"></i>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import Service from '../service';

const { formInputsMixins } = g3wsdk.gui.vue.Mixins;
export default {
    name: "modelPanel",
    mixins: [formInputsMixins],
    data(){
        return {
            loading: false,
            valid: false,
        }
    },
    methods: {
        async run(){
            this.loading = true;
            await Service.runModel(this.$options.model);
            this.loading = false;
        }
    },
    created(){},
    async mounted() {},
    async beforeDestroy(){}
}
</script>

<style scoped>
  .qprocessing-model-header .title {
    font-weight: bold;
  }
  .qprocess-model-footer button.run {
    width: 100%;
  }
</style>