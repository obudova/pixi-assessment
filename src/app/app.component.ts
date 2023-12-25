import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as PIXI from 'pixi.js';
import { BlurFilter, Sprite } from 'pixi.js';

const REEL_WIDTH = 160;
const SYMBOL_SIZE = 150;
const tweening: Tweening[] = [];

interface Tweening {
  object: any,
  property: any,
  propertyBeginValue: any,
  target: any
  easing: any
  time: any
  change: any,
  complete: any,
  start: number,
}

interface Reel {
  container: any,
  symbols: Sprite[],
  position: number,
  previousPosition: number,
  blur: BlurFilter,
}

// @ts-ignore
function tweenTo(object, property, target, time, easing, onchange, oncomplete)
{
  const tween = {
    object,
    property,
    propertyBeginValue: object[property],
    target,
    easing,
    time,
    change: onchange,
    complete: oncomplete,
    start: Date.now(),
  };

  tweening.push(tween);

  return tween;
}

function lerp(a1: any, a2: any, t: any)
{
  return a1 * (1 - t) + a2 * t;
}

// @ts-ignore
function backout(amount)
{
  // @ts-ignore
  return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  @ViewChild('gameContainer') gameContainer!: ElementRef;

  app = new PIXI.Application({ background: '#1099bb', resizeTo: window });

  running = false;
  reels: Reel[] = [];

  slotTextures = [
    PIXI.Texture.from('https://pixijs.com/assets/eggHead.png'),
    PIXI.Texture.from('https://pixijs.com/assets/flowerTop.png'),
    PIXI.Texture.from('https://pixijs.com/assets/helmlok.png'),
    PIXI.Texture.from('https://pixijs.com/assets/skully.png'),
  ];

  ngAfterViewInit() {
    this.gameContainer.nativeElement.appendChild(this.app.view);

    PIXI.Assets.load([
      'https://pixijs.com/assets/eggHead.png',
      'https://pixijs.com/assets/flowerTop.png',
      'https://pixijs.com/assets/helmlok.png',
      'https://pixijs.com/assets/skully.png',
    ]).then(() => {
      this.onAssetsLoaded()
    });
  }

  onAssetsLoaded() {
    this.buildReels();

    // Listen for animate update.
    this.app.ticker.add((delta) =>
    {
      // Update the slots.
      for (let i = 0; i < this.reels.length; i++)
      {
        const r = this.reels[i];
        // Update blur filter y amount based on speed.
        // This would be better if calculated with time in mind also. Now blur depends on frame rate.

        r.blur.blurY = (r.position - r.previousPosition) * 8;
        r.previousPosition = r.position;

        // Update symbol positions on reel.
        for (let j = 0; j < r.symbols.length; j++)
        {
          const s = r.symbols[j];
          const prevy = s.y;

          s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
          if (s.y < 0 && prevy > SYMBOL_SIZE)
          {
            // Detect going over and swap a texture.
            // This should in proper product be determined from some logical reel.
            s.texture = this.slotTextures[Math.floor(Math.random() * this.slotTextures.length)];
            s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
            s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
          }
        }
      }
    });

    this.app.ticker.add((delta) =>
    {
      const now = Date.now();
      const remove = [];

      for (let i = 0; i < tweening.length; i++)
      {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1)
        {
          t.object[t.property] = t.target;
          if (t.complete) t.complete(t);
          remove.push(t);
        }
      }
      for (let i = 0; i < remove.length; i++)
      {
        tweening.splice(tweening.indexOf(remove[i]), 1);
      }
    });
  }

  startPlay() {
    if (this.running) return;
    this.running = true;

    for (let i = 0; i < this.reels.length; i++)
    {
      const r = this.reels[i];
      const extra = Math.floor(Math.random() * 3);
      // @ts-ignore
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;

      tweenTo(r, 'position', target, time, backout(0.5), null, i === this.reels.length - 1 ? this.reelsComplete() : null);
    }
  }

  // Reels done handler.
  reelsComplete()
  {
    this.running = false;
  }

  buildReels() {
    // Create different slot symbols.
    const slotTextures = [
      PIXI.Texture.from('https://pixijs.com/assets/eggHead.png'),
      PIXI.Texture.from('https://pixijs.com/assets/flowerTop.png'),
      PIXI.Texture.from('https://pixijs.com/assets/helmlok.png'),
      PIXI.Texture.from('https://pixijs.com/assets/skully.png'),
    ];

    // Build the reels
    const reelContainer = new PIXI.Container();

    for (let i = 0; i < 5; i++) {
      const rc = new PIXI.Container();

      rc.x = i * REEL_WIDTH;
      reelContainer.addChild(rc);

      const reel = {
        container: rc,
        symbols: <Sprite[]>[],
        position: 0,
        previousPosition: 0,
        blur: new PIXI.filters.BlurFilter(),
      };

      reel.blur.blurX = 0;
      reel.blur.blurY = 0;
      rc.filters = [reel.blur];

      // Build the symbols
      for (let j = 0; j < 4; j++) {
        const symbol = new PIXI.Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
        // Scale the symbol to fit symbol area.

        symbol.y = j * SYMBOL_SIZE;
        symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
        symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.addChild(symbol);
      }
      this.reels.push(reel);
    }

    this.app.stage.addChild(reelContainer);
  }

}
