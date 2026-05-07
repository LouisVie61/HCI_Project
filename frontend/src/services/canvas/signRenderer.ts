// Canvas rendering for sign animations
import { CANVAS_CONFIG } from '../../constants';

export interface SignFrame {
  gesture: any; // Gesture data from API
  duration: number;
}

export const canvasService = {
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  animationId: null as number | null,

  // Initialize canvas
  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = CANVAS_CONFIG.WIDTH;
    canvas.height = CANVAS_CONFIG.HEIGHT;

    // Clear canvas
    this.clear();
  },

  // Clear canvas
  clear() {
    if (this.ctx) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(
        0,
        0,
        CANVAS_CONFIG.WIDTH,
        CANVAS_CONFIG.HEIGHT
      );
    }
  },

  // Render gesture
  renderGesture(gesture: any, x: number = 0, y: number = 0) {
    if (!this.ctx) return;

    // TODO: Implement gesture rendering
    // This could be drawing stick figures, SVG rendering, or animated sprites
    console.log('Rendering gesture:', gesture);
  },

  // Animate sequence of gestures
  async animateSequence(frames: SignFrame[]): Promise<void> {
    return new Promise((resolve) => {
      let frameIndex = 0;

      const renderFrame = () => {
        if (frameIndex >= frames.length) {
          resolve();
          return;
        }

        const frame = frames[frameIndex];
        this.clear();
        this.renderGesture(frame.gesture);

        // Schedule next frame
        setTimeout(() => {
          frameIndex++;
          this.animationId = requestAnimationFrame(renderFrame);
        }, frame.duration / CANVAS_CONFIG.FPS);
      };

      this.animationId = requestAnimationFrame(renderFrame);
    });
  },

  // Stop animation
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  // Draw text on canvas
  drawText(text: string, x: number = 50, y: number = 50) {
    if (!this.ctx) return;

    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(text, x, y);
  },

  // Export canvas as image
  export(format: 'png' | 'jpg' = 'png'): string {
    if (!this.canvas) return '';

    if (format === 'png') {
      return this.canvas.toDataURL('image/png');
    } else {
      return this.canvas.toDataURL('image/jpeg', 0.95);
    }
  },

  // Cleanup
  cleanup() {
    this.stopAnimation();
    this.clear();
    this.canvas = null;
    this.ctx = null;
  },
};

export default canvasService;
