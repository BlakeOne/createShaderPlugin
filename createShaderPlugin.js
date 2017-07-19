// wait for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    
    
// create the plugins before creating the app/renderer
createShaderPlugin(
    'circle',                                           // name
    document.getElementById('circleVertShader').text,   // vertShader
    document.getElementById('circleFragShader').text,   // fragShader
    { uColor: new Float32Array([0.0, 1.0, 0.0, 1.0]) }  // default values
);

// you can use the default vertShader by passing null
// you can leave out the default uniform values too
createShaderPlugin(
    'rectangle',
    null,
    document.getElementById('rectangleFragShader').text
);


// create app/renderer next
var app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    autoResize: true,
    backgroundColor: 0xFFFFFF
});
document.body.appendChild(app.view);


// create rectangleSprite
var rectangleSprite = new PIXI.Sprite();

// each uniform has a name and value
rectangleSprite.pluginUniforms = {
    uTime: 0.0
};

// world transform is applied, so E.G. when sprite is scaled 2X then your shader will draw (2 * pluginSize) pixels
rectangleSprite.pluginSize = new PIXI.Point(app.renderer.width, app.renderer.height);

// the plugin name used here must match the one passed to createShaderPlugin()
rectangleSprite.pluginName = 'rectangle';

app.stage.addChild(rectangleSprite);

// that's about it -there's just a few more comments towards the top of the HTML tab to tell about uniforms - have fun:)


// create circleSprite
var circleSprite = new PIXI.Sprite();
circleSprite.anchor.set(0.5);
circleSprite.position.set(window.innerWidth / 4.0, window.innerHeight / 2.0);

circleSprite.pluginUniforms = {
    uColor: new Float32Array([0.0, 1.0, 0.0, 1.0])
};
circleSprite.pluginSize = new PIXI.Point(100.0, 100.0);
circleSprite.pluginName = 'circle';

app.stage.addChild(circleSprite);


// Animate
app.ticker.add(function (delta) {
    rectangleSprite.pluginUniforms.uTime += delta * 16.67;
    
    circleSprite.position.x += 1.5 * delta;
    
    var inc = 0.003 * delta;
    circleSprite.pluginUniforms.uColor[0] += inc;
    circleSprite.pluginUniforms.uColor[1] -= inc;
    if (circleSprite.pluginUniforms.uColor[0] > 1.0) {
        circleSprite.pluginUniforms.uColor[0] = 1.0;
        circleSprite.pluginUniforms.uColor[1] = 0.0;
    }
});
    
    
}); // wait for DOMContentLoaded




///////////////////////////
// createShaderPlugin.js //
///////////////////////////
function createShaderPlugin (name, vertShader, fragShader, uniformDefaults) {
    var ShaderPlugin = function (renderer) {
        PIXI.ObjectRenderer.call(this, renderer);

        if (!vertShader) {
            this.vertShader = [
                '#define GLSLIFY 1',

                'attribute vec2 aVertexPosition;',
                'attribute vec2 aTextureCoord;',

                'uniform mat3 projectionMatrix;',

                'varying vec2 vTextureCoord;',

                'void main(void) {',
                    'gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
                    'vTextureCoord = aTextureCoord;',
                '}'
            ].join('\n');
        }
        else {
            this.vertShader = '#define GLSLIFY 1\n' + vertShader;
        }

        this.fragShader = '#define GLSLIFY 1\n' + fragShader;
        this.uniformDefaults = uniformDefaults;
    };
    ShaderPlugin.prototype = Object.create(PIXI.ObjectRenderer.prototype);
    ShaderPlugin.prototype.constructor = ShaderPlugin;

    ShaderPlugin.prototype.onContextChange = function () {
        var gl = this.renderer.gl;
        this._tintAlpha = new Float32Array(4);

        var shader = this.shader = new PIXI.Shader(gl, this.vertShader, this.fragShader);
        if (this.uniformDefaults) {
            shader.bind();
            var uniformDefaults = this.uniformDefaults;
            var shaderUniforms = shader.uniforms;
            for (var key in uniformDefaults) {
                shaderUniforms[key] = uniformDefaults[key];
            }
        }

        this.quad = new PIXI.Quad(gl);
        this.quad.initVao(shader);
    };

    ShaderPlugin.prototype.start = function () {
    };

    ShaderPlugin.prototype.flush = function () {
    };

    ShaderPlugin.prototype.render = function (sprite) {
        // setup
        var shader = this.shader;

        var renderer = this.renderer;
        renderer.bindShader(shader);
        renderer.state.setBlendMode(sprite.blendMode);

        var quad = this.quad;
        renderer.bindVao(quad.vao);


        // calculate and upload vertices
        sprite._transformID = sprite.transform._worldID;
        var wt = sprite.transform.worldTransform;
        var a = wt.a;
        var b = wt.b;
        var c = wt.c;
        var d = wt.d;
        var tx = wt.tx;
        var ty = wt.ty;
        var anchor = sprite._anchor;

        var w  = sprite.pluginSize.x;
        var w1 = -anchor._x * w;
        var w0 = w1 + w;

        var h  = sprite.pluginSize.y;
        var h1 = -anchor._y * h;
        var h0 = h1 + h;

        // xy
        quad.vertices[0] = a * w1 + c * h1 + tx;
        quad.vertices[1] = d * h1 + b * w1 + ty;

        // xy
        quad.vertices[2] = a * w0 + c * h1 + tx;
        quad.vertices[3] = d * h1 + b * w0 + ty;

        // xy
        quad.vertices[4] = a * w0 + c * h0 + tx;
        quad.vertices[5] = d * h0 + b * w0 + ty;

        // xy
        quad.vertices[6] = a * w1 + c * h0 + tx;
        quad.vertices[7] = d * h0 + b * w1 + ty;

        quad.upload();


        // handle tint and worldAlpha
        var tintAlpha = this._tintAlpha;
        PIXI.utils.hex2rgb(sprite.tint, tintAlpha);
        var alpha = sprite.worldAlpha;
        tintAlpha[0] *= alpha;
        tintAlpha[1] *= alpha;
        tintAlpha[2] *= alpha;
        tintAlpha[3]  = alpha;
        shader.uniforms.uTintAlpha = tintAlpha;


        // copy uniforms from sprite to shader
        var spriteUniforms = sprite.pluginUniforms;
        var shaderUniforms = shader.uniforms;
        if (spriteUniforms) {
            for (var key in spriteUniforms) {
                shaderUniforms[key] = spriteUniforms[key];
            }
        }


        // draw
        quad.vao.draw(this.renderer.gl.TRIANGLES, 6, 0);
    };

    // register and assign ShaderPlugin
    PIXI.WebGLRenderer.registerPlugin(name, ShaderPlugin);
    PIXI.CanvasRenderer.registerPlugin(name, PIXI.CanvasSpriteRenderer);

    Object.assign(PIXI.extras, ShaderPlugin);
}
