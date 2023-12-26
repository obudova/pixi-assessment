import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

import { BlurFilter, Sprite } from 'pixi.js';

const REEL_WIDTH = 160;
const SYMBOL_SIZE = 150;
const CANVAS_HEIGHT = 450;

interface Reel {
  container: any,
  symbols: Sprite[],
  position: number,
  previousPosition: number,
  blur: BlurFilter,
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

  app = new PIXI.Application({background: '#1099bb', height: CANVAS_HEIGHT});

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
  }

  startPlay() {
    if (this.running) return;
    this.running = true;

    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];
      const extra = Math.floor(Math.random() * 3);
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;


      gsap.to(r, {
        position: target,
        duration: time / 1000,
        ease: 'power4.out',
        onUpdate: this.updateSlots.bind(this),
        onComplete: i === this.reels.length - 1 ? this.reelsComplete.bind(this) : undefined,
      });}
  }

  updateSlots() {
    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];

      r.blur.blurY = (r.position - r.previousPosition) * 8;
      r.previousPosition = r.position;

      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const previous = s.y;

        // Update symbol positions on reel.
        s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
        if (s.y < 0 && previous > SYMBOL_SIZE) {
          // Detect going over and swap a texture.
          // This should in proper product be determined from some logical reel.
          s.texture = this.slotTextures[Math.floor(Math.random() * this.slotTextures.length)];
          s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
          s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
        }
      }
    }
  }

  // Reels done handler.
  reelsComplete() {
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

        symbol.y = ((reel.position + j)) * SYMBOL_SIZE - SYMBOL_SIZE
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
