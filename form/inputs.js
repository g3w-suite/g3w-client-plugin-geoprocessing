import prjvectorlayer_input from '../components/InputPrjVectorLayer.vue';
import prjrasterlayer_input from '../components/InputPrjRasterLayer.vue';
import fieldchooser_input from '../components/InputFieldChooser.vue';
export default {
  ...g3wsdk.gui.vue.Inputs.InputsComponents,
  prjvectorlayer_input,
  prjrasterlayer_input,
  prjvectorlayerfeature_input: prjvectorlayer_input,
  fieldchooser_input,
}