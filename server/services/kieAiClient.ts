import axios, { AxiosInstance } from "axios";
import { KIE_AI_API_KEY, KIE_AI_CONFIG, TOKEN_PRICING } from "../../shared/config";

interface GenerateVideoRequest {
  prompt: string;
  duration: "10" | "15";
  quality?: "low" | "standard" | "high";
  imageUrl?: string;
  audioUrl?: string;
}

interface GenerateVideoResponse {
  jobId: string;
  status: string;
  videoUrl?: string;
}

interface JobStatusResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  errorMessage?: string;
}

interface RemoveWatermarkRequest {
  videoUrl: string;
}

interface RemoveWatermarkResponse {
  jobId: string;
  status: string;
  videoUrl?: string;
}

class KIEAIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: KIE_AI_CONFIG.BASE_URL,
      headers: {
        Authorization: `Bearer ${KIE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Generate video from text, image, or voice
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    try {
      const payload: any = {
        prompt: request.prompt,
        duration: parseInt(request.duration),
        quality: request.quality || "standard",
        removeWatermark: false, // User can choose to remove WM separately
      };

      if (request.imageUrl) {
        payload.imageUrl = request.imageUrl;
      }

      if (request.audioUrl) {
        payload.audioUrl = request.audioUrl;
      }

      const response = await this.client.post(
        KIE_AI_CONFIG.ENDPOINTS.TEXT_TO_VIDEO,
        payload
      );

      return {
        jobId: response.data.jobId,
        status: response.data.status,
        videoUrl: response.data.videoUrl,
      };
    } catch (error) {
      console.error("[KIE.AI] Video generation error:", error);
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Check video generation job status
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      const response = await this.client.get(
        `${KIE_AI_CONFIG.ENDPOINTS.JOB_STATUS}/${jobId}`
      );

      return {
        jobId: response.data.jobId,
        status: response.data.status,
        videoUrl: response.data.videoUrl,
        errorMessage: response.data.errorMessage,
      };
    } catch (error) {
      console.error("[KIE.AI] Job status check error:", error);
      throw new Error(`Failed to check job status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Remove watermark from video
   */
  async removeWatermark(videoUrl: string): Promise<RemoveWatermarkResponse> {
    try {
      const response = await this.client.post(
        KIE_AI_CONFIG.ENDPOINTS.WATERMARK_REMOVAL,
        { videoUrl }
      );

      return {
        jobId: response.data.jobId,
        status: response.data.status,
        videoUrl: response.data.videoUrl,
      };
    } catch (error) {
      console.error("[KIE.AI] Watermark removal error:", error);
      throw new Error(`Failed to remove watermark: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Calculate token cost based on duration and quality
   */
  getTokenCost(duration: "10" | "15", quality?: string): number {
    if (duration === "10") return TOKEN_PRICING.VIDEO_10_SEC;
    if (duration === "15") return TOKEN_PRICING.VIDEO_15_SEC;
    return TOKEN_PRICING.VIDEO_10_SEC;
  }

  /**
   * Get watermark removal cost
   */
  getWatermarkRemovalCost(): number {
    return TOKEN_PRICING.WATERMARK_REMOVAL;
  }
}

export const kieAiClient = new KIEAIClient();
