import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Full-screen animated Grainient background rendered via WebGL in a WebView.
 * Uses the exact same OGL + GLSL shader as react-bits/Grainient.
 * Props match the Grainient config from reactbits.dev.
 */

interface GrainientBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  timeSpeed?: number;
  colorBalance?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  grainAnimated?: boolean;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  centerX?: number;
  centerY?: number;
  zoom?: number;
}

export function GrainientBackground({
  color1 = '#0e1442',
  color2 = '#c4370d',
  color3 = '#0e1442',
  timeSpeed = 0.4,
  colorBalance = 0,
  warpStrength = 1,
  warpFrequency = 3,
  warpSpeed = 1,
  warpAmplitude = 40,
  blendAngle = 0,
  blendSoftness = 0.5,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.08,
  grainScale = 2,
  grainAnimated = false,
  contrast = 1.1,
  gamma = 1.5,
  saturation = 0.85,
  centerX = 0,
  centerY = 0,
  zoom = 0.85,
}: GrainientBackgroundProps) {
  const html = buildHtml({
    color1, color2, color3, timeSpeed, colorBalance,
    warpStrength, warpFrequency, warpSpeed, warpAmplitude,
    blendAngle, blendSoftness, rotationAmount, noiseScale,
    grainAmount, grainScale, grainAnimated, contrast, gamma,
    saturation, centerX, centerY, zoom,
  });

  return (
    <WebView
      source={{ html }}
      style={[StyleSheet.absoluteFill, { backgroundColor: '#0E1442' }]}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      javaScriptEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      androidLayerType="hardware"
      pointerEvents="none"
      originWhitelist={['*']}
      onLoadEnd={() => {
        void SplashScreen.hideAsync();
      }}
    />
  );
}

function hexToRgbStr(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '1.0, 1.0, 1.0';
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  return `${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)}`;
}

function buildHtml(props: Required<Omit<GrainientBackgroundProps, 'grainAnimated'>> & { grainAnimated: boolean }): string {
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,canvas{width:100%;height:100%;display:block;overflow:hidden;background:#0e1442}</style>
</head><body><canvas id="c"></canvas>
<script>
(function(){
  var canvas=document.getElementById('c');
  var gl=canvas.getContext('webgl2',{alpha:false,antialias:false});
  if(!gl)return;

  var dpr=Math.min(window.devicePixelRatio||1,2);

  function resize(){
    var w=window.innerWidth,h=window.innerHeight;
    canvas.width=w*dpr;canvas.height=h*dpr;
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  window.addEventListener('resize',resize);
  resize();

  var vs=\`#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}\`;

  var fs=\`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
out vec4 fragColor;

#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0,0)),f-vec2(0,0)),dot(-1.0+2.0*hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0,1)),f-vec2(0,1)),dot(-1.0+2.0*hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);return 0.5+0.5*n;}

void main(){
  float t=iTime*${props.timeSpeed.toFixed(4)};
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+vec2(${props.centerX.toFixed(4)},${props.centerY.toFixed(4)});
  tuv/=max(${props.zoom.toFixed(4)},0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*${props.noiseScale.toFixed(4)});
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*${props.rotationAmount.toFixed(1)}+180.0));
  tuv.y*=ratio;

  float frequency=${props.warpFrequency.toFixed(4)};
  float ws=max(${props.warpStrength.toFixed(4)},0.001);
  float amplitude=${props.warpAmplitude.toFixed(4)}/ws;
  float warpTime=t*${props.warpSpeed.toFixed(4)};
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colNavy=vec3(${hexToRgbStr(props.color1)});
  vec3 colOrange=vec3(${hexToRgbStr(props.color2)});

  // Radial/circular blend: orange orbits around center
  float dist=length(tuv);
  float angle=atan(tuv.y,tuv.x);

  // Rotating orange stream — orbits slowly
  float orbitalSpeed=t*0.3;
  float stream1=sin(angle*2.0-orbitalSpeed)+sin(angle*1.0+orbitalSpeed*0.7);
  stream1=stream1*0.5+0.5;

  // Second stream offset for richness
  float stream2=sin(angle*3.0+orbitalSpeed*1.3+3.14159)*0.5+0.5;

  // Radial falloff — orange concentrated in a ring, navy at center and edges
  float ringDist=S(0.05,0.25,dist)*S(0.8,0.35,dist);

  // Combine streams with radial mask
  float orangeMask=mix(stream1,stream2,0.3)*ringDist;
  orangeMask=S(0.2,0.7,orangeMask)*0.85;

  vec3 col=mix(colNavy,colOrange,orangeMask);

  vec2 grainUv=uv*max(${props.grainScale.toFixed(4)},0.001);
  ${props.grainAnimated ? 'grainUv+=vec2(iTime*0.05);' : ''}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*${props.grainAmount.toFixed(4)};

  col=(col-0.5)*${props.contrast.toFixed(4)}+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,${props.saturation.toFixed(4)});
  col=pow(max(col,0.0),vec3(1.0/max(${props.gamma.toFixed(4)},0.001)));
  col=clamp(col,0.0,1.0);

  fragColor=vec4(col,1.0);
}\`;

  function createShader(type,src){
    var sh=gl.createShader(type);
    gl.shaderSource(sh,src);gl.compileShader(sh);
    return sh;
  }

  var prog=gl.createProgram();
  gl.attachShader(prog,createShader(gl.VERTEX_SHADER,vs));
  gl.attachShader(prog,createShader(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Full-screen triangle
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  var uRes=gl.getUniformLocation(prog,'iResolution');
  var uTime=gl.getUniformLocation(prog,'iTime');
  var t0=performance.now();

  function loop(t){
    gl.uniform2f(uRes,canvas.width,canvas.height);
    gl.uniform1f(uTime,(t-t0)*0.001);
    gl.drawArrays(gl.TRIANGLES,0,3);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
</script></body></html>`;
}
