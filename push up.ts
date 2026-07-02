<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pushup Counter</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        #video {
            border: 5px solid #ccc;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        #counter {
            font-size: 48px;
            margin-top: 20px;
        }
        canvas {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
        }
    </style>
</head>
<body>
    <video id="video" width="640" height="480" autoplay playsinline></video>
    <div id="counter">0</div>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>
    <script>
        let counter = 0;
        let isDown = false;

        async function setupCamera() {
            const video = document.getElementById('video');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            video.srcObject = stream;
            return new Promise(resolve => {
                video.onloadedmetadata = () => resolve(video);
            });
        }

        function drawKeypoints(keypoints, ctx) {
            keypoints.forEach((keypoint) => {
                if (keypoint.score > 0.5) { 
                    const { x, y } = keypoint;
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                }
            });
        }

        function drawSkeleton(keypoints, ctx) {
            const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            adjacentPairs.forEach((pair) => {
                const kp1 = keypoints[pair[0]];
                const kp2 = keypoints[pair[1]];

                if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {  
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'blue';
                    ctx.stroke();
                }
            });
        }

        async function runPushupCounter() {
            const video = await setupCamera();
            const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            document.body.appendChild(canvas);

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const counterElement = document.getElementById('counter');

            function calculatePushup(pose) {
                const nose = pose.keypoints.find(point => point.name === 'nose');
                const leftShoulder = pose.keypoints.find(point => point.name === 'left_shoulder');
                const rightShoulder = pose.keypoints.find(point => point.name === 'right_shoulder');

                if (nose && leftShoulder && rightShoulder) {
                    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

                    
                    if (!isDown && nose.y > avgShoulderY + 20) {  
                    } else if (isDown && nose.y < avgShoulderY - 20) {
                        isDown = false;
                        counter++;
                        counterElement.innerText = counter;
                    }
                }
            }

            async function detect() {
                const poses = await detector.estimatePoses(video);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                if (poses.length > 0) {
                    const pose = poses[0];
                    drawKeypoints(pose.keypoints, ctx);
                    drawSkeleton(pose.keypoints, ctx);
                    calculatePushup(pose);
                }

                requestAnimationFrame(detect);
            }

            detect();
        }

        runPushupCounter();
    </script>
</body>
</html>
