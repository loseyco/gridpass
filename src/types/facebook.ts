export interface FacebookPagePost {
    id: string;
    message?: string;
    created_time?: string;
}

export interface FacebookPagePhoto {
    id: string;
    post_id?: string;
    created_time?: string;
}

export interface FacebookError {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
}
