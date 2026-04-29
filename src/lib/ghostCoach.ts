// import { Results } from '@mediapipe/pose';
export interface JointAngle {
  name: string;
  angle: number;
  ideal: number;
  tolerance: number;
}

export interface PoseFeedback {
  message: string;
  isCorrect: boolean;
  intensity: number; // 0 to 1, how "wrong" it is
}

export const calculateAngle = (p1: any, p2: any, p3: any) => {
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

export const analyzeSquat = (landmarks: any): { angles: JointAngle[]; feedback: PoseFeedback } => {
  const lHip = landmarks[23];
  const lKnee = landmarks[25];
  const lAnkle = landmarks[27];
  const lShoulder = landmarks[11];

  const angles: JointAngle[] = [];
  let feedback: PoseFeedback = { message: "Ready to start", isCorrect: true, intensity: 0 };

  if (lHip && lKnee && lAnkle && lShoulder) {
    const kneeAngle = calculateAngle(lHip, lKnee, lAnkle);
    const backAngle = calculateAngle(lKnee, lHip, lShoulder);

    angles.push({ name: "Knee", angle: Math.round(kneeAngle), ideal: 90, tolerance: 10 });
    angles.push({ name: "Back", angle: Math.round(backAngle), ideal: 60, tolerance: 20 });

    if (kneeAngle > 100) {
      feedback = { message: "Go deeper!", isCorrect: false, intensity: 0.5 };
    } else if (kneeAngle < 70) {
      feedback = { message: "Too deep! Watch knees.", isCorrect: false, intensity: 0.7 };
    } else {
      feedback = { message: "Perfect depth!", isCorrect: true, intensity: 0 };
    }

    if (backAngle < 40) {
      feedback = { message: "Chest up! Don't lean too far.", isCorrect: false, intensity: 0.8 };
    }
  }

  return { angles, feedback };
};

export const analyzePushup = (landmarks: any): { angles: JointAngle[]; feedback: PoseFeedback } => {
  const lShoulder = landmarks[11];
  const lElbow = landmarks[13];
  const lWrist = landmarks[15];
  const lHip = landmarks[23];

  const angles: JointAngle[] = [];
  let feedback: PoseFeedback = { message: "Ready to start", isCorrect: true, intensity: 0 };

  if (lShoulder && lElbow && lWrist && lHip) {
    const elbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const torsoAngle = calculateAngle(lShoulder, lHip, landmarks[25]); // Hip angle

    angles.push({ name: "Elbow", angle: Math.round(elbowAngle), ideal: 90, tolerance: 10 });
    angles.push({ name: "Core", angle: Math.round(torsoAngle), ideal: 180, tolerance: 10 });

    if (elbowAngle > 120) {
      feedback = { message: "Lower your chest!", isCorrect: false, intensity: 0.5 };
    } else if (torsoAngle < 160) {
      feedback = { message: "Hips up! Keep core tight.", isCorrect: false, intensity: 0.8 };
    } else {
      feedback = { message: "Great form!", isCorrect: true, intensity: 0 };
    }
  }

  return { angles, feedback };
};
