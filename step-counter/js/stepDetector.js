export class StepDetector {
  constructor({ onStep, onStatus } = {}) { this.onStep = onStep; this.onStatus = onStatus; this.running = false; this.lastStep = 0; this.samples = []; this.handler = this.handleMotion.bind(this); }
  static supported() { return typeof DeviceMotionEvent !== 'undefined'; }
  async requestPermission() {
    if (!StepDetector.supported()) throw new Error('Motion sensors are not available in this browser.');
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const result = await DeviceMotionEvent.requestPermission();
      if (result !== 'granted') throw new Error('Motion permission was not granted.');
    }
    return true;
  }
  start() { if (this.running) return; window.addEventListener('devicemotion', this.handler, { passive: true }); this.running = true; this.onStatus?.('on'); }
  stop() { window.removeEventListener('devicemotion', this.handler); this.running = false; this.onStatus?.('off'); }
  handleMotion(event) {
    const a = event.accelerationIncludingGravity || event.acceleration;
    if (!a) return;
    const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    this.samples.push(magnitude); if (this.samples.length > 8) this.samples.shift();
    const average = this.samples.reduce((sum, n) => sum + n, 0) / this.samples.length;
    const now = Date.now();
    if (magnitude - average > 1.8 && magnitude > 11.2 && now - this.lastStep > 320) { this.lastStep = now; this.onStep?.(1); }
  }
}
