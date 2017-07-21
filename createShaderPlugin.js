

function createShaderPluginSprite(name, size, uniforms) {
    var sprite = new PIXI.Sprite();
    
	sprite.pluginName = name;
	sprite.pluginSize = size;
	sprite.pluginUniforms = {};
    
    if (uniforms) {
        Object.assign(sprite.pluginUniforms, uniforms);
    }
    
    return sprite;
}
