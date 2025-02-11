export default {
  title: 'Geoprocessing',
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
  },
  run :{
    messages: {
      success: "Model run successfully",
      error: "An Error occur on model"
    }
  },
  draw_types: {
    'Polygon': "Polygon",
    'LineString': "Line",
    'Point': "Point",
  },
  draw_filename: 'Draw layer',
}