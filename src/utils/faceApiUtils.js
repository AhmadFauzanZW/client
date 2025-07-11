// utils/faceApiUtils.js
import * as faceapi from 'face-api.js';

class FaceApiManager {
    constructor() {
        this.isInitialized = false;
        this.isLoading = false;
        this.modelsLoaded = false;
    }

    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        if (this.isLoading) {
            // Wait for current initialization to complete
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isInitialized;
        }

        this.isLoading = true;

        try {
            console.log('Loading face-api.js models...');
            
            // Load models in parallel (similar to the working reference code)
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);
            
            console.log("Face-api.js models loaded successfully");
            this.modelsLoaded = true;
            this.isInitialized = true;
            return true;

        } catch (error) {
            console.error('Face-api.js initialization failed:', error);
            this.isInitialized = false;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async detectFace(videoElement) {
        if (!this.isInitialized) {
            throw new Error('Face API not initialized');
        }

        try {
            const options = new faceapi.TinyFaceDetectorOptions();
            const detection = await faceapi.detectSingleFace(videoElement, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            return detection;
        } catch (error) {
            console.error('Face detection error:', error);
            return null;
        }
    }

    createFaceMatcher(labeledDescriptors, threshold = 0.5) {
        if (!this.isInitialized) {
            throw new Error('Face API not initialized');
        }

        return new faceapi.FaceMatcher(labeledDescriptors, threshold);
    }

    isReady() {
        return this.isInitialized && this.modelsLoaded;
    }

    dispose() {
        this.isInitialized = false;
        this.modelsLoaded = false;
    }
}

// Create singleton instance
const faceApiManager = new FaceApiManager();

export default faceApiManager;
