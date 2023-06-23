export default {
  inputs: {
    prjvectorlayerfeature: {
      selected_features: "Only selected features"
    },
    fieldchooser: {
      validate: {
        message: {
          multiple: "Seleziona almeno un campo",
          single: "Seleziona un campo"
        }
      }
    }
  },
  outputs: {
    outputvector: {
      open_file_on_map: "Open output file after running algorithm"
    }
  }
}