export interface ImageRequest {
    fileName : string; 
    filePath: string; 
    fileType : fileType; 
    fileMimeType: string; 
}

export interface ImageResponse {
    id: number | string; 
    fileName : string; 
    filePath: string; 
    fileType : fileType; 
    fileMimeType: string;
}

export type fileType = "IMAGE" | "DOCUMENT"