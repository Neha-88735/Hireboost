// Real-Time Client-Side Computer Vision Person & Gadget Detector
// Primary: TensorFlow.js + COCO-SSD ('person' + electronic gadget detection on live webcam stream)
// Fast Fallback: Browser Shape Detection FaceDetector API (when available)

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface DetectedPersonBox {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  score: number;
}

export interface DetectedGadgetBox {
  label: string;
  rawClass: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  score: number;
}

export interface PersonDetectionResult {
  ready: boolean;
  personCount: number | null;
  boxes: DetectedPersonBox[];
  gadgets: DetectedGadgetBox[];
  source: 'tfjs-coco-ssd' | 'face-detector' | 'loading' | 'unavailable';
}

const GADGET_CLASS_RULES: Record<string, { label: string; minScore: number }> = {
  'cell phone': { label: 'Cell Phone', minScore: 0.38 },
  remote: { label: 'Handheld Gadget', minScore: 0.54 },
  laptop: { label: 'Secondary Laptop', minScore: 0.6 },
  tv: { label: 'Secondary Screen / Tablet', minScore: 0.68 }
};

let modelPromise: Promise<cocoSsd.ObjectDetection | null> | null = null;
let modelLoadFailed = false;

function computeIoU(a: [number, number, number, number], b: [number, number, number, number]): number {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const x1 = Math.max(ax, bx);
  const y1 = Math.max(ay, by);
  const x2 = Math.min(ax + aw, bx + bw);
  const y2 = Math.min(ay + ah, by + bh);
  const interW = Math.max(0, x2 - x1);
  const interH = Math.max(0, y2 - y1);
  const interArea = interW * interH;
  if (interArea <= 0) return 0;
  const unionArea = aw * ah + bw * bh - interArea;
  return unionArea > 0 ? interArea / unionArea : 0;
}

function deduplicateBoxes<T extends { bbox: [number, number, number, number]; score: number }>(
  raw: T[],
  iouThreshold = 0.58,
  checkContainment = true
): T[] {
  const sorted = [...raw].sort((a, b) => b.score - a.score);
  const kept: T[] = [];

  for (const item of sorted) {
    const [, , iw, ih] = item.bbox;
    const itemArea = Math.max(1, iw * ih);
    let overlapsExisting = false;

    for (const prev of kept) {
      const iou = computeIoU(item.bbox, prev.bbox);
      if (iou > iouThreshold) {
        overlapsExisting = true;
        break;
      }

      if (checkContainment) {
        const [px, py, pw, ph] = prev.bbox;
        const [ix, iy] = item.bbox;
        const x1 = Math.max(px, ix);
        const y1 = Math.max(py, iy);
        const x2 = Math.min(px + pw, ix + iw);
        const y2 = Math.min(py + ph, iy + ih);
        const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        if (inter / itemArea > 0.78 && item.score < 0.72) {
          overlapsExisting = true;
          break;
        }
      }
    }

    if (!overlapsExisting) {
      kept.push(item);
    }
  }

  return kept;
}

export async function preloadPersonDetector(): Promise<boolean> {
  if (modelLoadFailed) return false;
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.ready();
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        return model;
      } catch (err) {
        console.warn('COCO-SSD CV model unavailable, using fallback proctoring:', err);
        modelLoadFailed = true;
        return null;
      }
    })();
  }
  const loaded = await modelPromise;
  return Boolean(loaded);
}

export async function detectPeopleInVideoFrame(videoEl: HTMLVideoElement): Promise<PersonDetectionResult> {
  if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
    return { ready: false, personCount: null, boxes: [], gadgets: [], source: 'loading' };
  }

  if (!modelPromise && !modelLoadFailed) {
    void preloadPersonDetector();
  }

  if (modelPromise && !modelLoadFailed) {
    const model = await Promise.race([
      modelPromise,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 50))
    ]);

    if (model) {
      try {
        const predictions = await model.detect(videoEl, 12, 0.35);
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;

        const rawPersons = predictions
          .filter((p) => p.class === 'person' && p.score >= 0.46)
          .map((p) => ({
            bbox: p.bbox as [number, number, number, number],
            score: p.score
          }));

        const dedupedPersons = deduplicateBoxes(rawPersons, 0.58, true);
        const boxes: DetectedPersonBox[] = dedupedPersons.map(({ bbox, score }) => {
          const [x, y, w, h] = bbox;
          return {
            xPct: Math.max(0, Math.min(100, (x / vw) * 100)),
            yPct: Math.max(0, Math.min(100, (y / vh) * 100)),
            wPct: Math.max(0, Math.min(100, (w / vw) * 100)),
            hPct: Math.max(0, Math.min(100, (h / vh) * 100)),
            score
          };
        });

        const rawGadgets = predictions
          .map((p) => {
            const rule = GADGET_CLASS_RULES[p.class];
            if (!rule || p.score < rule.minScore) return null;
            return {
              label: rule.label,
              rawClass: p.class,
              bbox: p.bbox as [number, number, number, number],
              score: p.score
            };
          })
          .filter((g): g is NonNullable<typeof g> => g !== null);

        const dedupedGadgets = deduplicateBoxes(rawGadgets, 0.55, false);
        const gadgets: DetectedGadgetBox[] = dedupedGadgets.map(({ label, rawClass, bbox, score }) => {
          const [x, y, w, h] = bbox;
          return {
            label,
            rawClass,
            xPct: Math.max(0, Math.min(100, (x / vw) * 100)),
            yPct: Math.max(0, Math.min(100, (y / vh) * 100)),
            wPct: Math.max(0, Math.min(100, (w / vw) * 100)),
            hPct: Math.max(0, Math.min(100, (h / vh) * 100)),
            score
          };
        });

        return {
          ready: true,
          personCount: boxes.length,
          boxes,
          gadgets,
          source: 'tfjs-coco-ssd'
        };
      } catch {
        // Fall through to FaceDetector if WebGL frame read fails transiently
      }
    }
  }

  // Browser FaceDetector fast fallback if COCO-SSD is still loading or unavailable
  const FaceDetectorCtor =
    typeof window !== 'undefined' && 'FaceDetector' in window
      ? (
          window as unknown as {
            FaceDetector?: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
              detect: (img: CanvasImageSource) => Promise<Array<{ boundingBox?: DOMRectReadOnly }>>;
            };
          }
        ).FaceDetector
      : undefined;

  if (FaceDetectorCtor) {
    try {
      const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 5 });
      const faces = await detector.detect(videoEl);
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      const boxes: DetectedPersonBox[] = (Array.isArray(faces) ? faces : []).map((f) => {
        const b = f.boundingBox;
        return b
          ? {
              xPct: Math.max(0, Math.min(100, (b.x / vw) * 100)),
              yPct: Math.max(0, Math.min(100, (b.y / vh) * 100)),
              wPct: Math.max(0, Math.min(100, (b.width / vw) * 100)),
              hPct: Math.max(0, Math.min(100, (b.height / vh) * 100)),
              score: 0.9
            }
          : { xPct: 25, yPct: 15, wPct: 50, hPct: 70, score: 0.9 };
      });
      return {
        ready: true,
        personCount: boxes.length,
        boxes,
        gadgets: [],
        source: 'face-detector'
      };
    } catch {
      // ignore
    }
  }

  return {
    ready: false,
    personCount: null,
    boxes: [],
    gadgets: [],
    source: modelLoadFailed ? 'unavailable' : 'loading'
  };
}
