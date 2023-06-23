export default {
  inputs: {
    prjvectorlayerfeature: {
      selected_features: "Solo features selezionate",
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
      open_file_on_map: "Apri il file sulla mappa"
    }
  }
}