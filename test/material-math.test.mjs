import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bevelProfile, fillBevelPixels, fillSurfacePixels, geometryKey, isSelectedSurface, normalizeRadii } from '../src/material-math.mjs';

// Frozen reference protects the visible bevel, including fractional/downsampled maps.
function reference(columns, rows, width, height, radius, ratio) {
  const pixels = new Uint8ClampedArray(columns * rows * 4);
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const px = (x + .5) / ratio, py = (y + .5) / ratio;
    const vx = px - Math.max(radius, Math.min(width - radius, px)), vy = py - Math.max(radius, Math.min(height - radius, py));
    const length = Math.hypot(vx, vy), depth = length ? radius - length : Math.min(px, py, width - px, height - py);
    const strength = depth >= 0 && depth < 18 ? Math.pow(1 - depth / 18, 1.7) * .95 : 0;
    const i = (y * columns + x) * 4;
    pixels[i] = 128 + (length ? vx / length : 0) * strength * 127;
    pixels[i + 1] = 128 + (length ? vy / length : 0) * strength * 127;
    pixels[i + 2] = 128; pixels[i + 3] = 255;
  }
  return pixels;
}
test('uniform bevel preserves the original visible field across geometry fixtures', () => {
  const cases = [[400,290,24],[240,600,26],[300,54,27],[36,36,18],[1,1,.5],[900,1700,28],[1920,1080,26],[85,33,16.5]];
  for (let n = 1; n <= 32; n++) cases.push([100+n*13,30+n*29,4+n/2]);
  for (const [width,height,radius] of cases) {
    const ratio = Math.min(1,512/Math.max(width,height)), columns = Math.ceil(width*ratio), rows = Math.ceil(height*ratio);
    const actual = new Uint8ClampedArray(columns*rows*4);
    fillBevelPixels(actual,columns,rows,width,height,radius,ratio);
    assert.deepEqual(actual,reference(columns,rows,width,height,radius,ratio),`${width}x${height}`);
  }
});
test('strong bevel remains neutral through the center and bounded on small controls', () => {
  const pixels = new Uint8ClampedArray(400*290*4), profile = bevelProfile(400,290,24);
  fillBevelPixels(pixels,400,290,400,290,24,1,profile);
  const at = (x,y) => [...pixels.slice((y*400+x)*4,(y*400+x)*4+4)];
  assert.deepEqual(at(200,145),[128,128,128,255]);
  assert.notEqual(at(200,20)[1],128);
  assert.ok(bevelProfile(36,36,18).scale < profile.scale);
  assert.ok(bevelProfile(1920,1080,26).scale <= 28);
  assert.equal(bevelProfile(400,290,0).scale,0);
});
test('CSS radii preserve square corners, percentages, ellipses and overlap scaling', () => {
  assert.deepEqual(normalizeRadii(['0px'],120,40),[[0,0],[0,0],[0,0],[0,0]]);
  assert.deepEqual(normalizeRadii(['50%'],120,40),[[60,20],[60,20],[60,20],[60,20]]);
  assert.deepEqual(normalizeRadii(['80px'],120,40),[[20,20],[20,20],[20,20],[20,20]]);
  assert.deepEqual(normalizeRadii(['12px 6px','0','4px','20% 25%'],100,60),[[12,6],[0,0],[4,4],[20,15]]);
  assert.notEqual(geometryKey(100,60,normalizeRadii(['12px'],100,60)),geometryKey(100,60,normalizeRadii(['12px','0','12px','12px'],100,60)));
});
test('mixed corner geometry keeps square corners undistorted and elliptical center aligned', () => {
  const width=120,height=80, pixels=new Uint8ClampedArray(width*height*4);
  fillSurfacePixels(pixels,width,height,width,height,normalizeRadii(['0','24px 18px','24px','12px'],width,height),1,bevelProfile(width,height,24));
  const at=(x,y)=>[...pixels.slice((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(3,3),[128,128,128,255]);
  assert.deepEqual(at(60,40),[128,128,128,255]);
  assert.notDeepEqual(at(100,4),[128,128,128,255]);
});
test('selection contract supports tabs, switches, commands and explicit surface selection', () => {
  const element = attributes => ({ getAttribute:name=>attributes[name] ?? null, matches:()=>false });
  for(const attribute of ['aria-selected','aria-checked','aria-pressed','aria-expanded','data-tblu-selected']) {
    assert.equal(isSelectedSurface(element({[attribute]:'true'})),true,attribute);
    assert.equal(isSelectedSurface(element({[attribute]:'false'})),false,attribute);
  }
  assert.equal(isSelectedSurface(element({'data-tblu-selected':''})),true);
  assert.equal(isSelectedSurface(element({})),false);
  assert.equal(isSelectedSurface({getAttribute:()=>null,matches:selector=>selector.includes(':state')}),true);
  assert.equal(isSelectedSurface({getAttribute:()=>null,matches:selector=>{ if(selector.includes(':state')) throw new SyntaxError('Unsupported state'); return false; }}),false);
});
