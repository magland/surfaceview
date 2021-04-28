/* config-overrides.js */

var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

module.exports = function override(config, env) {
    //do stuff with the webpack config...
    config.module.rules = [...vtkRules, ...config.module.rules]
    
    return config
}