### Overview
- createShaderPlugin is a function that encapuslates the process of creating a shader plugin for pixi.js.
- Your plugin will be optimized for sprites which don't need to filter an existing texture.

### Update ###
- It is now possible to create plugins even after the renderer has already been created:
- - If you pass the renderer to createShaderPlugin then renderer will be updated for your new plugin!
- - If you call createShaderPlugin before creating app/renderer, then you can ignore this final parmeter.

### Demos ###
- Please refer to the CodePen [demo](https://codepen.io/Tazy/pen/PjvPGQ) for usage guidelines.

### Documentation ###
- More coming soon!

### Props/Creds ###
- Based on [pixi-plugin-example](https://github.com/pixijs/pixi-plugin-example) and [pixi.js](https://github.com/pixijs/pixi.js/).

### License ###
- This content is released under the (http://opensource.org/licenses/MIT) MIT License.
