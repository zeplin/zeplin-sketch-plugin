function Zeplin() {
    var BorderPositions = ["center", "inside", "outside"];
    var FillTypes = ["color", "gradient"];
    var GradientTypes = ["linear", "radial", "angular"];
    var ShadowTypes = ["outer", "inner"];
    var TextAligns = ["left", "right", "center", "justify"];
    var BlendModes = ["normal", "darken", "multiply", "color-burn", "lighten", "screen", "color-dodge", "overlay", "soft-light", "hard-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity", "source-in", "source-out", "source-atop", "destination-over", "destination-in", "destination-out", "destination-atop"];

    function isExportable(layer) {
        return layer instanceof MSTextLayer ||
               layer instanceof MSShapeGroup ||
               layer instanceof MSBitmapLayer;
    }

    function isHidden(layer) {
        while (!(layer instanceof MSArtboardGroup)) {
            if (!layer.isVisible()) {
                return true;
            }

            layer = layer.parentGroup();
        }

        return false;
    }

    function toJSString(str) {
        return new String(str).toString();
    }

    function pointToJSON(point) {
        return {
            x: parseFloat(point.x),
            y: parseFloat(point.y)
        };
    }

    function sizeToJSON(size) {
        return {
            width: parseFloat(size.width),
            height: parseFloat(size.height)
        };
    }

    function rectToJSON(rect, referenceRect) {
        if (referenceRect) {
            return {
                x: rect.x() - referenceRect.x(),
                y: rect.y() - referenceRect.y(),
                width: rect.width(),
                height: rect.height()
            };
        }

        return {
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height()
        };
    }

    function colorToJSON(color) {
        return {
            r: Math.round(color.red() * 255),
            g: Math.round(color.green() * 255),
            b: Math.round(color.blue() * 255),
            a: color.alpha()
        };
    }

    function colorStopToJSON(colorStop) {
        return {
            color: colorToJSON(colorStop.color()),
            position: colorStop.position()
        };
    }

    function gradientToJSON(gradient) {
        var stops = [],
            msStop, stopIter = gradient.stops().array().objectEnumerator();
        while (msStop = stopIter.nextObject()) {
            stops.push(colorStopToJSON(msStop));
        }

        return {
            type: GradientTypes[gradient.gradientType()],
            from: pointToJSON(gradient.from()),
            to: pointToJSON(gradient.to()),
            colorStops: stops
        };
    }

    function shadowToJSON(shadow) {
        return {
            type: shadow instanceof MSStyleShadow ? "outer" : "inner",
            offsetX: shadow.offsetX(),
            offsetY: shadow.offsetY(),
            blurRadius: shadow.blurRadius(),
            spread: shadow.spread(),
            color: colorToJSON(shadow.color())
        };
    }

    function getBorderRadius(layer) {
        if (!(layer instanceof MSShapeGroup)) {
            return 0;
        }

        var msLayer,
            layerIter = layer.layers().array().objectEnumerator();
        while (msLayer = layerIter.nextObject()) {
            if (msLayer instanceof MSRectangleShape) {
                return msLayer.fixedRadius();
            }
        }

        return 0;
    }

    function getBorders(style) {
        var borders = [],
            msBorder, borderIter = style.borders().array().objectEnumerator();
        while (msBorder = borderIter.nextObject()) {
            if (msBorder.isEnabled()) {
                var fillType = FillTypes[msBorder.fillType()],
                    border = {
                        fillType: fillType,
                        position: BorderPositions[msBorder.position()],
                        thickness: msBorder.thickness()
                    };

                switch (fillType) {
                    case "color":
                        border.color = colorToJSON(msBorder.color());
                        break;

                    case "gradient":
                        border.gradient = gradientToJSON(msBorder.gradient());
                        break;

                    default:
                        continue;
                }

                borders.push(border);
            }
        }

        borderIter = null;
        msBorder = null;

        return borders;
    }

    function getFills(style) {
        var fills = [],
            msFill, fillIter = style.fills().array().objectEnumerator();
        while (msFill = fillIter.nextObject()) {
            if (msFill.isEnabled()) {
                var fillType = FillTypes[msFill.fillType()],
                    fill = {
                        fillType: fillType
                    };

                switch (fillType) {
                    case "color":
                        fill.color = colorToJSON(msFill.color());
                        break;

                    case "gradient":
                        fill.gradient = gradientToJSON(msFill.gradient());
                        break;

                    default:
                        continue;
                }

                fills.push(fill);
            }
        }

        fillIter = null;
        msFill = null;

        return fills;
    }

    function getShadows(style) {
        var shadows = [],
            msShadow, shadowIter = style.shadows().array().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(shadowToJSON(msShadow)));
            }
        }

        shadowIter = style.innerShadows().array().objectEnumerator();
        while (msShadow = shadowIter.nextObject()) {
            if (msShadow.isEnabled()) {
                shadows.push(shadowToJSON(msShadow));
            }
        }

        shadowIter = null;
        msShadow = null;

        return shadows;
    }

    this.exportArtboards = function (artboards) {
        var screens = [];

        artboards.forEach(function (msArtboard, i) {
            var artboardFrame = msArtboard.frame(),
                layers = [],
                layerIter = msArtboard.children().objectEnumerator();
            while(msLayer = layerIter.nextObject()) {
                if (isHidden(msLayer) || !isExportable(msLayer)) {
                    continue;
                }

                var layerStyle = msLayer.style(),
                    layerContextSettings = layerStyle.contextSettings(),
                    layer = {
                        type: msLayer instanceof MSTextLayer ? "text" : "shape",
                        name: toJSString(msLayer.name()),
                        rect: rectToJSON(msLayer.absoluteRect(), artboardFrame),
                        rotation: msLayer.rotation(),
                        opacity: layerContextSettings.opacity(),
                        blendMode: BlendModes[layerContextSettings.blendMode()],
                        borders: getBorders(layerStyle),
                        borderRadius: getBorderRadius(msLayer),
                        fills: getFills(layerStyle),
                        shadows: getShadows(layerStyle)
                    };

                if (msLayer instanceof MSTextLayer) {
                    layer.content = toJSString(msLayer.storage().string());
                    layer.color = colorToJSON(msLayer.textColor());
                    layer.fontSize = msLayer.fontSize();
                    layer.fontFace = toJSString(msLayer.fontPostscriptName());
                    layer.textAlign = TextAligns[msLayer.textAlignment()];
                    layer.letterSpacing = msLayer.characterSpacing();
                    layer.lineHeight = msLayer.lineSpacing();
                }

                layers.push(layer);

                layer = null;
                layerStyle = null;
            }

            var imageFileName = NSUUID.UUID().UUIDString() + ".png";

            [doc saveArtboardOrSlice:msArtboard
                              toFile:NSTemporaryDirectory().stringByAppendingPathComponent(imageFileName)];

            screens.push({
                name: toJSString(msArtboard.name()),
                imageFileName: imageFileName,
                width: artboardFrame.width(),
                height: artboardFrame.height(),
                layers: layers
            });

            layers = null;
            artboards[i] = null;
            layerIter = null;
            artboardFrame = null;
            imageFileName = null;
        });

        var path = NSTemporaryDirectory().stringByAppendingPathComponent("project.zpln"),
            content = NSString.stringWithString(JSON.stringify({ screens: screens }));

        screens = null;

        [content writeToFile:path
                  atomically:false
                    encoding:NSUTF8StringEncoding
                       error:null];

        content = null;

        doc.showMessage("Export completed.");

        [[NSWorkspace sharedWorkspace] openFile:path
                                withApplication:@"Zeplin (Beta)"];

        path = null;
    }
}
