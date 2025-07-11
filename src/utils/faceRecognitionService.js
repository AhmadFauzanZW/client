// utils/faceRecognitionService.js
import axiosInstance from '../api/axiosInstance';

class PythonFaceRecognitionService {
    constructor() {
        this.isHealthy = false;
        this.lastHealthCheck = null;
    }

    async checkHealth() {
        try {
            const response = await axiosInstance.get('/face/health');
            this.isHealthy = response.data.success;
            this.lastHealthCheck = new Date();
            return this.isHealthy;
        } catch (error) {
            console.error('Face service health check failed:', error);
            this.isHealthy = false;
            return false;
        }
    }

    async registerWorkerFace(workerId, imageBase64) {
        try {
            const response = await axiosInstance.post('/face/register', {
                id_pekerja: workerId,
                image_base64: imageBase64
            });
            return response.data;
        } catch (error) {
            console.error('Face registration error:', error);
            throw error;
        }
    }

    async recognizeFace(imageBase64) {
        try {
            const response = await axiosInstance.post('/face/recognize', {
                image_base64: imageBase64
            });
            return response.data;
        } catch (error) {
            console.error('Face recognition error:', error);
            throw error;
        }
    }

    async getRegisteredFaces() {
        try {
            const response = await axiosInstance.get('/face/registered');
            return response.data;
        } catch (error) {
            console.error('Get registered faces error:', error);
            throw error;
        }
    }

    async deleteWorkerFace(workerId) {
        try {
            const response = await axiosInstance.delete('/face/delete', {
                data: { id_pekerja: workerId }
            });
            return response.data;
        } catch (error) {
            console.error('Delete worker face error:', error);
            throw error;
        }
    }

    isServiceHealthy() {
        return this.isHealthy;
    }

    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
}

// Create singleton instance
const pythonFaceService = new PythonFaceRecognitionService();

export default pythonFaceService;
