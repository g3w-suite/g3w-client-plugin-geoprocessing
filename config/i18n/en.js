export default {
  inputs: {
    prjvectorlayerfeature: {
      selected_features: "Only selected features"
    },
    fieldchooser: {
      validate: {
        message: {
          multiple: "Select at least a field",
          single: "Select at least a field"
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